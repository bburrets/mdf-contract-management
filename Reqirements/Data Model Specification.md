# Data Model Specification — CLUB Dilutions (OCS + MDF)

This document accompanies the database DDL. It refines the conceptual model, adds detailed field-level definitions, enumerations, validation rules, balance math, and implementation guidance for imports, UI, and testing. It assumes **per‑channel duplication** for All‑Style MDF and supports **linked and manual reversals**.

---

## 0) Principles & Objectives

* **Single source of truth for actuals** → `LedgerEntry` (debits/credits; adjustments; reversals)
* **Projections are immutable** → OCS projections never overwritten by actuals
* **Totals are derived** → never store column totals; compute via views
* **Channel awareness** → every budget/exposure is attributable to `Inline` or `Ecomm`
* **Auditability** → end‑to‑end lineage from Contract → Allocation → LedgerEntry → Invoice

---

## 1) Conceptual Model

* **Style (1)** ←→ **(N) Item**
* **Item (1)** ←→ **(N) OCSContract** *(per channel projections)*
* **Item (1)** ←→ **(N) MDFContract** *(Channel or AllStyle)*
* **MDFContract (1)** ←→ **(N) Allocation** *(budget buckets; always per channel)*
* **Allocation (1)** ←→ **(N) LedgerEntry** *(actuals; debits/credits)*
* **Invoice (1)** ←→ **(N) LedgerEntry** *(funding event evidence)*
* **Adjustment** → posts to `LedgerEntry` *(manual OCS/Allocation changes)*
* **Campaign (optional)** groups Allocations/actuals over date windows

**Channel enum:** `Inline`, `Ecomm`.
**Totals:** computed in views only.

---

## 2) Logical Model & Data Dictionary

### 2.1 Reference & Dimensions

#### Style

* **PK:** `style_id`
* **Business Keys:** `style_number`
* **Attributes:** `season`, `business_line`, `gender`, `country`
* **Audit:** `created_at`, `updated_at`
* **Notes:** Style is the enterprise anchor id for CLUB artifacts.

#### Item

* **PK:** `item_id`
* **FK:** `style_id → Style`
* **Business Keys:** `(style_id, item_number)`
* **Attributes:** `item_desc`
* **Audit:** `created_at`, `updated_at`
* **Notes:** Represents sellable item rows that roll up to a style.

#### Campaign *(optional but recommended)*

* **PK:** `campaign_id`
* **Attributes:** `name`, `start_date`, `end_date`, `notes`
* **Notes:** Use when multiple ledger events must be grouped semantically.

### 2.2 Contracts & Budgets

#### OCSContract *(per item & channel)*

* **PK:** `ocs_id`
* **FKs:** `item_id → Item`, `channel_code ∈ {Inline,Ecomm}`
* **Projection Fields:**

  * `ocs_units_proj` *(NUMERIC)*
  * `ocs_funding_proj` *(NUMERIC)*
  * `print_fees_proj` *(NUMERIC)*
  * `above_beyond_proj` *(NUMERIC)*
  * `markdown_proj` *(NUMERIC)*
* **Derived Projections (views):**

  * `total_promo_proj = funding + print + above`
  * `total_promo_plus_md_proj = total_promo_proj + markdown`
* **Versioning:** `effective_start`, `effective_end`
* **Notes:** Immutable after approval; superseded via new row with dates.

#### MDFContract

* **PK:** `mdf_id`
* **FK:** `item_id → Item`
* **Scope:** `scope ∈ {Channel, AllStyle}` *(see Allocations)*
* **Commercials:** `customer`, `contract_number`, `signed_date`
* **Defaults:** `funding_type_default` *(e.g., MDF/Print/Above& Beyond/Markdown)*
* **Commitment:** `total_committed_amount` *(optional; may be implied by Allocations)*
* **Versioning:** `effective_start`, `effective_end`
* **Notes:** When `scope = AllStyle`, the application must create **two per‑channel Allocations**.

#### Allocation *(budget buckets; always per channel)*

* **PK:** `allocation_id`
* **FKs:** `mdf_id → MDFContract`, `channel_code ∈ {Inline,Ecomm}`, `campaign_id → Campaign?`
* **Amounts:** `allocated_amount` *(≥ 0)*
* **Status:** `status ∈ {Active, Closed}`
* **Uniqueness:** `UNIQUE(mdf_id, channel_code)`
* **Notes:** Do **not** store “taken/remaining”; balances are derived from the Ledger.

### 2.3 Transactions & Actuals

#### Invoice

* **PK:** `invoice_id`
* **Business Keys:** `invoice_number` *(unique per customer)*
* **Attributes:** `invoice_date`, `customer`, `comments`

#### LedgerEntry *(single source of truth)*

* **PK:** `entry_id`
* **FKs:** `allocation_id → Allocation?`, `ocs_id → OCSContract?`, `invoice_id → Invoice?`
* **Event:** `entry_date`
* **Classification:** `funding_type ∈ {OCS Funding, Print Fees, Above & Beyond, Markdown, Adjustment, Reversal}`
* **Amount:** `amount` *(NUMERIC; **negative = spend**, **positive = credit**)*
* **Reversal Support:**

  * `is_reversal` *(BOOLEAN)*
  * `reverses_entry_id → LedgerEntry.entry_id` *(nullable; if set, must negate original)*
* **Provenance:** `comments`, `created_by`, `created_at`
* **Indexes:** by `allocation_id`, `ocs_id`, `invoice_id`, `entry_date`
* **Notes:** Powers `TOTAL $ AMOUNT TAKEN`, `FUNDING BALANCE`, and campaign actuals.

#### Adjustment *(UI convenience; mirrors to Ledger)*

* **PK:** `adjustment_id`
* **Target:** `target_type ∈ {OCS, Allocation}`, `target_id`
* **Amount:** `amount` *(pos/neg)*, `reason`, approvals (`approved_by`, `approved_at`)
* **Notes:** On approval, the service writes a `LedgerEntry` with `funding_type = 'Adjustment'`.

---

## 3) Enumerations & Controlled Vocabularies

* **channel:** `Inline`, `Ecomm`
* **scope\_type:** `Channel`, `AllStyle`
* **funding\_type:** `OCS Funding`, `Print Fees`, `Above & Beyond`, `Markdown`, `Adjustment`, `Reversal`
* **status (Allocation):** `Active`, `Closed`

---

## 4) Mapping From Legacy Tracker Columns

**Per‑Channel (Inline / Ecomm)**

* *Item DESC* → `Item.item_desc` *(channel displayed in views)*
* *OCS UNITS* → `OCSContract.ocs_units_proj`
* *OCS FUNDING* → `OCSContract.ocs_funding_proj`
* *PRINT FEES* → `OCSContract.print_fees_proj`
* *ABOVE & BEYOND \$* → `OCSContract.above_beyond_proj`
* *TOTAL PROMO FUNDING \$* → **derived** *(funding + print + A\&B)*
* *MARKDOWN \$* → `OCSContract.markdown_proj`
* *TOTAL PROMO + MD \$* → **derived** *(promo total + markdown)*

**Totals (do not store)**

* All “Total” columns across channels are computed via views.

**Invoice / Actuals (Inline | Ecomm)**

* *INVOICE #* → `Invoice.invoice_number`
* *INVOICE DATE* → `Invoice.invoice_date`
* *FUNDING TYPE* → `LedgerEntry.funding_type`
* *TOTAL \$ AMOUNT TAKEN* → `LedgerEntry.amount` *(negative)*
* *FUNDING BALANCE* → derived view (see §6)
* *CAMPAIGN DATES* → prefer `Campaign.start_date/end_date`; else `Allocation.campaign_id`
* *COMMENTS* → `Invoice.comments` or `LedgerEntry.comments`

---

## 5) Business Rules

1. **Auditability first**: Any non‑projection financial change is a `LedgerEntry` row (adjustments, reversals, credits).
2. **Derived totals**: Do not persist cross‑channel totals or balances.
3. **All‑Style MDF**: must materialize **two Allocations** (`Inline`, `Ecomm`); enforce `UNIQUE(mdf_id, channel_code)`.
4. **Campaign dates**:

   * Multiple campaigns → split across `LedgerEntry` rows using `entry_date` and optional `campaign_id`.
   * Known upfront → anchor to `Allocation.campaign_id`.
5. **Partial increments**: model as multiple `LedgerEntry` rows referencing the same `Allocation`.
6. **Manual OCS changes**: record as `Adjustment` → service posts `LedgerEntry` (`funding_type='Adjustment'`).
7. **Reversals**:

   * **Linked**: set `reverses_entry_id`; amount must negate original; system sets `is_reversal = TRUE`.
   * **Manual**: `is_reversal = TRUE`, no link; free‑form amount allowed; audit via comments.
8. **Versioning**: new contracts replace prior via effective date windows; history preserved.

---

## 6) Balance Math & Authoritative Views

### Allocation Balance View (authoritative)

* **Total Taken** = `SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END)` over `LedgerEntry` per `allocation_id`
* **Funding Balance** = `allocated_amount + SUM(amount)`

### OCS Projections View (by channel)

* Provides computed `total_promo_proj` and `total_promo_plus_md_proj` for analytics

### Item Totals View

* Aggregates Inline + Ecomm projections for reporting “Total” columns

> See database views `v_allocation_balance`, `v_ocs_projection_by_channel`, `v_item_ocs_totals` in the DDL.

---

## 7) Validation & Constraints

* `Allocation.allocated_amount ≥ 0`
* `LedgerEntry.amount ≠ 0`
* Linked reversal: trigger enforces `amount = - original.amount` and `funding_type = 'Reversal'`
* `Allocation (mdf_id, channel_code)` unique; `channel_code` not null
* Referential integrity for all FKs (`ON UPDATE CASCADE`, sensible `ON DELETE` rules)

---

## 8) Import/Ingestion Design

1. **OCS Imports** (from Excel):

   * Upsert `Style`, `Item`
   * Upsert/insert `OCSContract` per `(item, channel, effective window)`
   * No actuals written
2. **Invoice/Actuals Imports**:

   * Upsert `Invoice` by `invoice_number`
   * For each line, determine target `Allocation` (by item, channel, contract; or via mapping sheet)
   * Write `LedgerEntry` with `funding_type`, `amount` (negative for spend)
   * Optional: attach `campaign_id` and comments
3. **All‑Style MDF Creation:**

   * Service creates **two** `Allocation` rows splitting `total_committed_amount` by configured split (default 50/50 or user‑specified)

---

## 9) Permissions & Roles (MVP)

* **Finance Ops**: create/update Invoices, post LedgerEntries, create Reversals
* **Merch/PD**: read‑only balances and projections
* **Admins**: approve Adjustments, edit Allocations, manage Contracts
* Field‑level: prevent edits to historical OCS projections (past effective window)

---

## 10) UI/Workflow Acceptance Criteria

* **All‑Style MDF form**: entering a commitment produces two channel Allocations; split visible before save
* **Reversal UX**:

  * *Linked*: “Reverse this entry” pre‑populates and locks the amount; shows backlink
  * *Manual*: “Manual credit/debit” allows free amount, requires comment
* **Balances**: allocation card shows `Allocated`, `Taken`, `Remaining` using the authoritative view
* **OCS views**: per channel and totals without persisting totals

---

## 11) Example Queries

**Allocation Balance by Style/Channel**

```sql
SELECT s.style_number, a.channel_code,
       SUM(a.allocated_amount) AS allocated,
       SUM(b.total_taken)      AS taken,
       SUM(b.funding_balance)  AS remaining
FROM v_allocation_balance b
JOIN "Allocation" a ON a.allocation_id = b.allocation_id
JOIN "MDFContract" m ON m.mdf_id = a.mdf_id
JOIN "Item" i ON i.item_id = m.item_id
JOIN "Style" s ON s.style_id = i.style_id
GROUP BY s.style_number, a.channel_code;
```

**Spend Ledger for a Campaign Window**

```sql
SELECT c.name AS campaign, a.channel_code, l.entry_date, l.funding_type, -l.amount AS amount_taken, l.comments
FROM "LedgerEntry" l
JOIN "Allocation" a ON a.allocation_id = l.allocation_id
LEFT JOIN "Campaign" c ON c.campaign_id = a.campaign_id
WHERE l.entry_date BETWEEN DATE '2025-01-01' AND DATE '2025-12-31'
ORDER BY l.entry_date DESC;
```

**Find Linked Reversals**

```sql
SELECT l.entry_id, l.reverses_entry_id, o.amount AS original_amount, l.amount AS reversal_amount
FROM "LedgerEntry" l
JOIN "LedgerEntry" o ON o.entry_id = l.reverses_entry_id
WHERE l.is_reversal = TRUE;
```

---

## 12) Testing Matrix (Given/When/Then)

* **All‑Style Split**

  * *Given* MDF(scope=AllStyle, commit=\$10k, 50/50) *When* created *Then* Allocations: Inline \$5k, Ecomm \$5k
* **Linked Reversal**

  * *Given* spend −\$1,200 *When* reverse *Then* new entry +\$1,200 with link; balance unchanged from pre‑spend
* **Manual Reversal**

  * *Given* misposted −\$500 *When* manual credit +\$500 *Then* is\_reversal=TRUE, no link, comment required
* **Balance View**

  * *Given* allocated \$5k; spends −\$1k, −\$2k *Then* taken \$3k; remaining \$2k

---

## 13) Performance & Indexing Notes

* High‑cardinality filters: `LedgerEntry.entry_date`, `allocation_id`, `invoice_id`
* Aggregations: pre‑materialize dashboards with db views or cache layer as needed
* Batch imports: use COPY for large Excel ingests; wrap in transactions

---

## 14) Data Quality & Reconciliation

* Daily job compares `v_allocation_balance` remaining vs expected external finance figures
* Orphan checks: `LedgerEntry` without `allocation_id` or `ocs_id` flagged for triage
* Duplicate invoice detection by `invoice_number` + `customer`

---

## 15) Change Management

* Contracts revised by inserting new row with new effective window; never hard‑edit historical rows
* Schema migrations via versioned scripts; backfill derived views verified in CI

---

## 16) Open Questions (Track & Resolve)

* Required precision for amounts? *(Currently NUMERIC(14,2))* 
* Do we need multi‑currency? *(If yes, add currency code + FX policy in Ledger)* No, multi-currency is not required
* Campaign mandatory for certain customers? no, campaingns are not mandatory for customers

---

## 17) Appendix: Field Catalog (Tabular)

| Entity      | Field               |    Type | Null | Notes                                       |
| ----------- | ------------------- | ------: | :--: | ------------------------------------------- |
| Style       | style\_number       |    text |   N  | Enterprise style identifier                 |
| Item        | item\_number        |    text |   N  | Unique per style                            |
| OCSContract | channel\_code       |    enum |   N  | Inline/Ecomm                                |
| OCSContract | ocs\_funding\_proj  | numeric |   Y  | Projection; immutable                       |
| MDFContract | scope               |    enum |   N  | Channel/AllStyle                            |
| Allocation  | allocated\_amount   | numeric |   N  | Budget ≥ 0                                  |
| Allocation  | channel\_code       |    enum |   N  | Always present (per‑channel)                |
| LedgerEntry | amount              | numeric |   N  | Neg spend; Pos credit                       |
| LedgerEntry | reverses\_entry\_id |      fk |   Y  | If set, must negate original                |
| LedgerEntry | funding\_type       |    enum |   N  | OCS/Print/A\&B/Markdown/Adjustment/Reversal |
| Invoice     | invoice\_number     |    text |   N  | Unique per customer                         |

---

**This canvas is the authoritative companion to the DDL for engineering, data, and QA.**
