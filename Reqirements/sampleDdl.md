-- =====================================================================
-- Dilutions (OCS + MDF) — Full PostgreSQL DDL
-- Decisions:
--   1) All-Style MDF -> duplicated per channel (Allocation.channel_code NOT NULL; UNIQUE(mdf_id, channel_code))
--   2) Reversals: support linked (reverses_entry_id) and manual (is_reversal=TRUE without link)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Clean slate (optional in dev)  -- Comment these DROPs in production
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS v_item_ocs_totals CASCADE;
DROP VIEW IF EXISTS v_ocs_projection_by_channel CASCADE;
DROP VIEW IF EXISTS v_allocation_balance CASCADE;

DROP TRIGGER IF EXISTS trg_enforce_linked_reversal ON "LedgerEntry";
DROP FUNCTION IF EXISTS enforce_linked_reversal();

DROP TABLE IF EXISTS "Adjustment" CASCADE;
DROP TABLE IF EXISTS "LedgerEntry" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "Allocation" CASCADE;
DROP TABLE IF EXISTS "Campaign" CASCADE;
DROP TABLE IF EXISTS "MDFContract" CASCADE;
DROP TABLE IF EXISTS "OCSContract" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "Style" CASCADE;

DROP TYPE IF EXISTS funding_type CASCADE;
DROP TYPE IF EXISTS scope_type CASCADE;
DROP TYPE IF EXISTS channel CASCADE;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
CREATE TYPE channel AS ENUM ('Inline','Ecomm');
CREATE TYPE scope_type AS ENUM ('Channel','AllStyle');
CREATE TYPE funding_type AS ENUM (
  'OCS Funding',
  'Print Fees',
  'Above & Beyond',
  'Markdown',
  'Adjustment',
  'Reversal'
);

-- ---------------------------------------------------------------------
-- Reference / Dimensions
-- ---------------------------------------------------------------------
CREATE TABLE "Style" (
  style_id       BIGSERIAL PRIMARY KEY,
  style_number   TEXT UNIQUE NOT NULL,
  season         TEXT,
  business_line  TEXT,
  gender         TEXT,
  country        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Item" (
  item_id      BIGSERIAL PRIMARY KEY,
  style_id     BIGINT NOT NULL REFERENCES "Style"(style_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  item_number  TEXT NOT NULL,
  item_desc    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(style_id, item_number)
);

-- Optional: campaigns to group activity by date ranges
CREATE TABLE "Campaign" (
  campaign_id BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  notes       TEXT
);

-- ---------------------------------------------------------------------
-- Contracts (OCS projections; MDF commitments)
-- ---------------------------------------------------------------------
CREATE TABLE "OCSContract" (
  ocs_id             BIGSERIAL PRIMARY KEY,
  item_id            BIGINT NOT NULL REFERENCES "Item"(item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  channel_code       channel NOT NULL,

  -- Projections (per-channel)
  ocs_units_proj     NUMERIC(14,2),
  ocs_funding_proj   NUMERIC(14,2),
  print_fees_proj    NUMERIC(14,2),
  above_beyond_proj  NUMERIC(14,2),
  markdown_proj      NUMERIC(14,2),

  effective_start    DATE,
  effective_end      DATE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_ocs_item_channel ON "OCSContract"(item_id, channel_code);

CREATE TABLE "MDFContract" (
  mdf_id                 BIGSERIAL PRIMARY KEY,
  item_id                BIGINT NOT NULL REFERENCES "Item"(item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  scope                  scope_type NOT NULL, -- 'Channel' or 'AllStyle'
  customer               TEXT,
  contract_number        TEXT,
  signed_date            DATE,
  funding_type_default   funding_type, -- optional default classification
  total_committed_amount NUMERIC(14,2), -- optional; use Allocations as source of truth if omitted
  effective_start        DATE,
  effective_end          DATE,
  notes                  TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_mdf_item ON "MDFContract"(item_id);

-- ---------------------------------------------------------------------
-- Allocations (budget buckets)  -- Channel must be explicit (decision #1)
-- ---------------------------------------------------------------------
CREATE TABLE "Allocation" (
  allocation_id    BIGSERIAL PRIMARY KEY,
  mdf_id           BIGINT NOT NULL REFERENCES "MDFContract"(mdf_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  channel_code     channel NOT NULL,  -- enforce per-channel duplication for AllStyle MDF
  campaign_id      BIGINT REFERENCES "Campaign"(campaign_id) ON UPDATE CASCADE ON DELETE SET NULL,
  allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount >= 0),
  status           TEXT DEFAULT 'Active',
  notes            TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mdf_id, channel_code)
);

CREATE INDEX ix_alloc_mdf_channel ON "Allocation"(mdf_id, channel_code);
CREATE INDEX ix_alloc_campaign ON "Allocation"(campaign_id);

-- ---------------------------------------------------------------------
-- Transactions (Invoices; Ledger)
-- ---------------------------------------------------------------------
CREATE TABLE "Invoice" (
  invoice_id     BIGSERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date   DATE NOT NULL,
  customer       TEXT,
  comments       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_invoice_date ON "Invoice"(invoice_date);

CREATE TABLE "LedgerEntry" (
  entry_id          BIGSERIAL PRIMARY KEY,

  allocation_id     BIGINT REFERENCES "Allocation"(allocation_id) ON UPDATE CASCADE ON DELETE SET NULL,
  ocs_id            BIGINT REFERENCES "OCSContract"(ocs_id)       ON UPDATE CASCADE ON DELETE SET NULL,
  invoice_id        BIGINT REFERENCES "Invoice"(invoice_id)       ON UPDATE CASCADE ON DELETE SET NULL,

  entry_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  funding_type      funding_type NOT NULL,  -- e.g., 'OCS Funding', 'Print Fees', 'Above & Beyond', 'Markdown', 'Adjustment', 'Reversal'
  amount            NUMERIC(14,2) NOT NULL CHECK (amount <> 0),  -- negative = spend/taken, positive = credit

  -- Reversal support (decision #2)
  is_reversal       BOOLEAN NOT NULL DEFAULT FALSE,
  reverses_entry_id BIGINT REFERENCES "LedgerEntry"(entry_id) ON UPDATE CASCADE ON DELETE RESTRICT,

  comments          TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_ledger_alloc ON "LedgerEntry"(allocation_id);
CREATE INDEX ix_ledger_ocs   ON "LedgerEntry"(ocs_id);
CREATE INDEX ix_ledger_inv   ON "LedgerEntry"(invoice_id);
CREATE INDEX ix_ledger_date  ON "LedgerEntry"(entry_date);

-- ---------------------------------------------------------------------
-- Manual top-line or reclasses (always mirrored in Ledger via app logic)
-- ---------------------------------------------------------------------
CREATE TABLE "Adjustment" (
  adjustment_id BIGSERIAL PRIMARY KEY,
  target_type   TEXT NOT NULL CHECK (target_type IN ('OCS','Allocation')),
  target_id     BIGINT NOT NULL, -- references either OCSContract.ocs_id or Allocation.allocation_id (validated in app/service layer)
  reason        TEXT,
  amount        NUMERIC(14,2) NOT NULL,
  approved_by   TEXT,
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Trigger to enforce linked reversal amounts == negative of original
-- (manual reversals have reverses_entry_id IS NULL and are allowed with any amount)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_linked_reversal() RETURNS trigger AS $$
DECLARE
  _orig_amt NUMERIC(14,2);
BEGIN
  IF NEW.reverses_entry_id IS NOT NULL THEN
    SELECT amount INTO _orig_amt
    FROM "LedgerEntry"
    WHERE entry_id = NEW.reverses_entry_id
    FOR UPDATE;

    IF _orig_amt IS NULL THEN
      RAISE EXCEPTION 'reverses_entry_id % not found', NEW.reverses_entry_id;
    END IF;

    IF NEW.amount <> -_orig_amt THEN
      RAISE EXCEPTION 'Linked reversal must negate original (expected % but got %)', -_orig_amt, NEW.amount;
    END IF;

    NEW.is_reversal := TRUE;
    -- Optional: force funding_type to 'Reversal' on linked reversals
    IF NEW.funding_type <> 'Reversal' THEN
      NEW.funding_type := 'Reversal';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_linked_reversal
BEFORE INSERT OR UPDATE ON "LedgerEntry"
FOR EACH ROW
EXECUTE FUNCTION enforce_linked_reversal();

-- ---------------------------------------------------------------------
-- Views (derived totals; balances)
-- ---------------------------------------------------------------------

-- Allocation balance (allocated, taken, remaining)
CREATE OR REPLACE VIEW v_allocation_balance AS
SELECT
  a.allocation_id,
  a.mdf_id,
  a.channel_code,
  a.allocated_amount,
  COALESCE(SUM(CASE WHEN l.amount < 0 THEN -l.amount ELSE 0 END), 0) AS total_taken,
  a.allocated_amount + COALESCE(SUM(l.amount), 0) AS funding_balance
FROM "Allocation" a
LEFT JOIN "LedgerEntry" l ON l.allocation_id = a.allocation_id
GROUP BY a.allocation_id, a.mdf_id, a.channel_code, a.allocated_amount;

-- OCS projections by channel with derived promo totals
CREATE OR REPLACE VIEW v_ocs_projection_by_channel AS
SELECT
  o.ocs_id,
  i.item_id,
  i.item_number,
  i.item_desc,
  o.channel_code,
  o.ocs_units_proj,
  o.ocs_funding_proj,
  o.print_fees_proj,
  o.above_beyond_proj,
  (COALESCE(o.ocs_funding_proj,0) + COALESCE(o.print_fees_proj,0) + COALESCE(o.above_beyond_proj,0)) AS total_promo_proj,
  o.markdown_proj,
  (COALESCE(o.ocs_funding_proj,0) + COALESCE(o.print_fees_proj,0) + COALESCE(o.above_beyond_proj,0) + COALESCE(o.markdown_proj,0)) AS total_promo_plus_md_proj
FROM "OCSContract" o
JOIN "Item" i ON i.item_id = o.item_id;

-- Item-level totals (Inline + Ecomm) derived at query time
CREATE OR REPLACE VIEW v_item_ocs_totals AS
SELECT
  item_id,
  item_number,
  item_desc,
  SUM(ocs_units_proj)                       AS ocs_units_total,
  SUM(ocs_funding_proj)                     AS ocs_funding_total,
  SUM(print_fees_proj)                      AS print_fees_total,
  SUM(above_beyond_proj)                    AS above_beyond_total,
  SUM(total_promo_proj)                     AS total_promo_funding_total,
  SUM(markdown_proj)                        AS markdown_total,
  SUM(total_promo_plus_md_proj)             AS total_promo_plus_md_total
FROM v_ocs_projection_by_channel
GROUP BY item_id, item_number, item_desc;

COMMIT;

-- =====================================================================
-- Notes for the app/service layer
-- =====================================================================
-- 1) For MDFContract with scope='AllStyle', create TWO "Allocation" rows:
--      - (mdf_id, channel='Inline', allocated_amount = committed * inline_pct)
--      - (mdf_id, channel='Ecomm',  allocated_amount = committed * ecomm_pct)
--    The UNIQUE(mdf_id, channel_code) constraint enforces one bucket per channel.
--
-- 2) Reversals:
--    - Linked reversal: set reverses_entry_id, amount auto-validated to negative of original.
--    - Manual reversal: is_reversal=TRUE, reverses_entry_id NULL; any amount allowed (audited by comments/created_by).
--
-- 3) Balances naturally include reversals via SUM(amount) in views.