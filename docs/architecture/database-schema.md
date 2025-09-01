# Database Schema

Simple PostgreSQL schema focusing on core business entities with minimal complexity.

```sql
-- Core Types
CREATE TYPE channel AS ENUM ('Inline','Ecomm');
CREATE TYPE scope_type AS ENUM ('Channel','AllStyle');

-- Styles (Primary Product Entity)
CREATE TABLE styles (
  style_number   TEXT PRIMARY KEY,
  item_number    TEXT NOT NULL,
  item_desc      TEXT,
  season         TEXT,
  business_line  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MDF Contracts
CREATE TABLE mdf_contracts (
  mdf_id                 SERIAL PRIMARY KEY,
  style_number           TEXT NOT NULL REFERENCES styles(style_number),
  scope                  scope_type NOT NULL,
  customer               TEXT,
  total_committed_amount DECIMAL(14,2),
  contract_date          DATE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budget Allocations
CREATE TABLE allocations (
  allocation_id    SERIAL PRIMARY KEY,
  mdf_id           INTEGER NOT NULL REFERENCES mdf_contracts(mdf_id),
  channel_code     channel NOT NULL,
  allocated_amount DECIMAL(14,2) NOT NULL CHECK (allocated_amount >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mdf_id, channel_code)
);

-- Simple Ledger (Append-only)
CREATE TABLE ledger_entries (
  entry_id      SERIAL PRIMARY KEY,
  allocation_id INTEGER REFERENCES allocations(allocation_id),
  entry_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  amount        DECIMAL(14,2) NOT NULL CHECK (amount <> 0),
  description   TEXT,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Processing Tracking
CREATE TABLE document_uploads (
  document_id       SERIAL PRIMARY KEY,
  filename          TEXT NOT NULL,
  file_size         INTEGER NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_confidence    DECIMAL(3,2), -- Overall confidence score 0.00-1.00
  extraction_results JSONB,        -- Raw OCR extraction results
  file_path         TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at      TIMESTAMPTZ
);

-- Contract Drafts for Save/Resume Functionality
CREATE TABLE contract_drafts (
  draft_id          SERIAL PRIMARY KEY,
  user_id           TEXT NOT NULL,
  document_id       INTEGER REFERENCES document_uploads(document_id),
  form_data         JSONB NOT NULL,
  style_suggestions JSONB,          -- Cached style matching results
  validation_errors JSONB,          -- Form validation state
  last_saved        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)      -- One draft per user per document
);

-- Processing Audit Trail
CREATE TABLE processing_audit (
  audit_id       SERIAL PRIMARY KEY,
  document_id    INTEGER REFERENCES document_uploads(document_id),
  contract_id    INTEGER REFERENCES mdf_contracts(mdf_id),
  draft_id       INTEGER REFERENCES contract_drafts(draft_id),
  action_type    TEXT NOT NULL CHECK (action_type IN ('upload', 'extract', 'style_match', 'validate', 'submit', 'save_draft', 'resume_draft')),
  user_id        TEXT NOT NULL,
  action_data    JSONB,              -- Action-specific metadata
  confidence_scores JSONB,           -- AI confidence scores when applicable
  user_decisions JSONB,              -- User override/validation decisions
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table for authentication and audit
CREATE TABLE users (
  user_id        TEXT PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'operations' CHECK (role IN ('operations', 'finance', 'admin')),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login     TIMESTAMPTZ
);

-- Basic indexes for performance
CREATE INDEX idx_styles_item ON styles(item_number);
CREATE INDEX idx_mdf_style ON mdf_contracts(style_number);
CREATE INDEX idx_alloc_mdf ON allocations(mdf_id);
CREATE INDEX idx_ledger_alloc ON ledger_entries(allocation_id);
CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);
CREATE INDEX idx_docs_status ON document_uploads(processing_status);
CREATE INDEX idx_docs_user ON document_uploads(uploaded_by);
CREATE INDEX idx_drafts_user ON contract_drafts(user_id);
CREATE INDEX idx_audit_type ON processing_audit(action_type);
CREATE INDEX idx_audit_user ON processing_audit(user_id);
CREATE INDEX idx_users_role ON users(role);

-- Simple balance calculation view
CREATE VIEW allocation_balances AS
SELECT
  a.allocation_id,
  a.mdf_id,
  a.channel_code,
  a.allocated_amount,
  COALESCE(SUM(CASE WHEN l.amount < 0 THEN -l.amount ELSE 0 END), 0) AS total_spent,
  a.allocated_amount + COALESCE(SUM(l.amount), 0) AS remaining_balance
FROM allocations a
LEFT JOIN ledger_entries l ON l.allocation_id = a.allocation_id
GROUP BY a.allocation_id, a.mdf_id, a.channel_code, a.allocated_amount;
```
