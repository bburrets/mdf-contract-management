# MDF Contract Intake & Ledger Update

**Initial Requirements & User Journey Document**
**Version:** v0.3
**Scope:** UX + Functional requirements for MDF contract intake, style matching, user validation, ledger write-back, and lifecycle status updates.

---

## Purpose

Define the end-to-end experience and core system behaviors to process MDF contracts via an automated intake with human-in-the-loop validation, including pre‑submission style matching, channel handling, ledger updates tied to OCS-linked styles, and final reconciliation with finance through the Dilutions Phase 3 process.

---

## User Journey Overview

### 1) Intake (Drag & Drop)

* **User Action:** Drag and drop MDF contract file (PDF/scanned) into the **MDF Contract Intake** area.
* **System Behavior:**

  * Assign **Intake ID** and log file metadata (filename, uploader, timestamp, source).
  * Show toast/banner: *“Contract received. Extracting key fields…”*
  * Stage file in "Intake" folder/queue; capture raw file hash for audit.

### 2) Automated Extraction

* **System Behavior:** Run OCR/DU on contract; extract provisional fields:

  * Contract Reference/ID
  * **Item Number** (Costco identifier for matching to FAM Style Numbers)
  * **Item Description** (Costco identifier for matching to FAM Style Numbers) 
  * Channel(s): Inline, Ecomm, or Both (if ambiguous, flag)
  * Contract Value (\$)
  * Campaign Dates (start/end, one or both may be present in source)
  * Partner/Vendor, Effective/Signature Dates, Terms
  * Confidence scores per field
* **UX:** Side-by-side **contract preview** and **extracted values**; low-confidence fields visually flagged.

### 3) **Pre‑Validation Style Lookup (Required Before Confirm)**

* **System Behavior (blocking step):**

  * Query **FAM Style master data** using extracted Item Number and/or Item Description from Costco MDF contract.
  * **Matching Logic:** Both Item Number and Item Description can be used independently to match to FAM Style Numbers.
  * If **≥90% confidence match** found: pre-select and display match with confidence percentage.
  * If **<90% confidence**: present prediction with confidence percentage displayed to user.
  * If **multiple matches**: present shortlist (sorted by confidence + recency + active OCS linkage).
  * If **no match**: prompt user to search/select from **Known Styles**; show filters (season, business, L/M, country) and link to style details if needed.
* **UX Requirement:** User cannot continue until a **FAM Style Number** is selected/confirmed. Display OCS linkage for the selected style (e.g., OCS Contract ID) to reduce mismatch risk.

### 4) User Validation & Review

* **User Action:** Review and edit extracted fields in a form.
* **UX:**

  * Required fields labeled with \* and validated in real-time.
  * If MDF applies to **Both channels**, system auto-splits into Inline/Ecomm allocation rows (editable), preserving the total.
  * Contextual warnings (e.g., date range anomalies, negative/over‑allocation against style cap).
  * Inline errors prevent submission until resolved.

### 5) Submit

* **User Action:** Click **Submit**.
* **System Behavior:**

  * Persist **Allocation** record(s) (by style + channel) and **Ledger** entries for the contract values.
  * Move source PDF to the **Style’s document set**; stamp metadata (Style, Channel, Intake ID, Funding Type, Campaign Dates, Amount, Uploader, Timestamp).
  * Generate a **Submission Receipt** (JSON/PDF) with a checksum and link to the archived document.

### 6) Ledger & Rollups

* **System Behavior:**

  * Post ledger entries (debits/credits) that reflect total amount and channel splits.
  * Recompute balances: per Style, per Channel, and any higher-level rollups.
  * Update Style dashboard widgets (Available vs. Used MDF, Campaign timeline blocks).
* **UX:** Confirmation summary showing:

  * Finalized style, channel allocations, totals
  * Updated balances by channel
  * Campaign date placement in timeline
  * Links: **View Style**, **Open Receipt**, **Open Document**

### 7) Post‑Submission (Active Pending Phase)

* **System Behavior:**

  * Notify subscribers (email/Teams/Asana task comment) with summary and links.
  * Set status: **Intake → Pre‑Validation → Validation In Progress → Submitted → Active (Pending Actuals)**.
  * Time-stamp all entries for audit.
  * Expose API/webhook events (e.g., `mdf.intake.completed`, `mdf.ledger.posted`).
* **Context:** Balances at this stage are **expected** and provisional. They remain pending until reconciled against finance actuals in Dilutions Phase 3.

### 8) Dilutions Phase 3 (Finance Actuals Reconciliation)

* **Trigger:** Periodic finance remittance processing.
* **Process:**

  * Finance processes remittance files, attributing chargebacks and invoices against styles.
  * Alignments are today based on manual email/excel workflows, but will be systematized here.
  * System consumes actuals and reconciles them against pending MDF allocations.
* **System Behavior:**

  * Once reconciled, mark MDF contract/channel records as **Finalized**.
  * Balances move from **expected** → **actual**, closing the lifecycle for those MDF records.
* **UX:**

  * Dashboard shows **Final Available Funding** per style/channel.
  * Status: **Active (Pending Actuals) → Finalized**.
  * User can view both provisional vs. actual history for audit.

---

## Required Fields & Validation Rules

### Required (blocking) fields at submission

1. **Style** (matched/confirmed from Known Styles; ties to OCS)
2. **Date Taken** (date when MDF becomes effective for balance impact)
3. **Funding Type** (enum)

   * Examples: `Base`, `Bonus`, `Chargeback Offset`, `Co-Op`, `Other` (final values to be confirmed)
4. **Total Amount Taken (\$)** (>= 0.01; currency = USD unless multi‑currency is later enabled)
5. **Campaign Dates**

   * At least **one date field must be populated**: `Campaign Start` or `Campaign End`.
   * If both present: `Start <= End` validation.

### Channel Handling

* **Channel** must be one of: `Inline`, `Ecomm`, `Both`.
* If `Both`, system creates two allocation rows (Inline/Ecomm). Rules:

  * Default split = 50/50 unless the contract specifies otherwise or user edits.
  * Sum of splits must equal **Total Amount Taken**.

### Style Matching Rules

* **≥90% confidence:** Auto-select match; **<90% confidence:** Show prediction with confidence percentage for user review.
* **Matching Fields:** Item Number and Item Description from Costco contract can each independently match to FAM Style Numbers.
* Show OCS contract link for the chosen Style; if no OCS exists, warn and require explicit override/justification.
* Keep a **Style Match Trace** (Item Number, Item Description, candidates, user choice, confidence scores) in the receipt.

### General Validation

* Numeric fields: currency/precision rules; no negative values.
* Dates: ISO format; timezone neutral (store in UTC, display per user locale).
* Duplicate protection: warn if an identical intake (same file hash + style + total + dates) exists.

---

## Functional Requirements

### A. Intake & Tracking

* Drag‑and‑drop intake with progress state.
* Intake ID assignment; log file hash and uploader.
* Retry/resume on transient DU/OCR errors; surface failures in an **Intake Errors** view.

### B. Data Extraction (OCR/DU)

* Extract core MDF fields + confidence scores.
* Detect channel(s); if ambiguous, flag for user decision.
* Extract candidate style tokens to feed style lookup.

### C. **Style Lookup Service (Pre‑Validation Gate)**

* Search **Known Styles** with fuzzy matching and aliases.
* Return candidates with confidence and OCS linkage indicators.
* Provide filters (season, business, L/M, country) and quick preview.
* API response must support pagination; client must support type‑ahead.

### D. Validation UI

* Side‑by‑side contract preview and editable form.
* Required field indicators; real‑time validation; error summaries.
* Channel split editor with total enforcement.
* Save‑as‑draft; audit history of user edits prior to submission.

### E. Submission & Archival

* Persist to **Allocations** and **Ledger** (idempotent write with correlation to Intake ID).
* Archive source PDF in Style’s document set with rich metadata.
* Generate **Submission Receipt** (ID, checksum, selected style, fields, splits, ledger ids, timestamps).

### F. Ledger & Rollups

* Post ledger entries dated as **Date Taken** (or configured accounting date rule).
* Recompute balances per style/channel and higher rollups.
* Track provisional vs. actual states until reconciliation.
* Expose read APIs for dashboards and reporting.

### G. Notifications & Reporting

* Notify subscribers with summary (links to Style, Receipt, Document).
* Expose standard reports: by style, channel, campaign, partner, funding type, date taken.
* Provide ability to compare provisional vs. actual balances.

---

## Non‑Functional & Compliance

* **Auditability:** Immutable receipt; full trace (extraction → style match → user edits → ledger ids → reconciliation outcome).
* **Security:** RBAC; PII-safe (contracts typically low-PII, confirm); principle of least privilege for archives and ledgers.
* **Reliability:** At‑least‑once processing with idempotent writes; DU retries; circuit breakers.
* **Performance:** Intake to pre‑validation screen within target SLA (e.g., p95 ≤ 10s for avg. PDF).
* **Observability:** Metrics on extraction accuracy, match rates, correction rates, reconciliation lags, and submission errors.

---

## Data Model Touchpoints (context only)

* **Styles** (master data) ⇄ **OCS Contracts** (1:1 per style) ⇄ **MDF Contracts** (0..n per style; may be Both channels)
* **Allocations** (per style/channel) ⇄ **Ledger** (entries reflecting debits/credits)
* **Documents** (archived contracts) with metadata keys: Style, Channel, Funding Type, Date Taken, Campaign Dates, Amount, Intake ID
* **Remittance Actuals** (chargebacks + invoices) ⇄ Reconciliation layer → MDF allocations finalization

---

## States & Statuses

* **Intake** → **Pre‑Validation (Awaiting Style)** → **Validation In Progress** → **Submitted** → **Active (Pending Actuals)** → **Finalized (Reconciled)**
* **Error** sub‑states: Extraction Failed, Style Not Found, Validation Incomplete, Write‑Back Failed (with retry strategy)

---

## Acceptance Criteria (Representative)

1. User cannot proceed to validation until a **Style** is auto‑ or manually‑selected from Known Styles.
2. Submission blocked until **Style, Date Taken, Funding Type, Total Amount Taken, Campaign Dates (≥1 field)** are valid.
3. If `Channel = Both`, two allocation rows are created whose amounts sum to the total.
4. Ledger balances reflect submitted values as **provisional** until Dilutions Phase 3 reconciliation.
5. After reconciliation, records move to **Finalized** state, balances are actual, and receipts reflect the reconciliation trace.
6. A submission receipt with trace + checksums is generated and linkable from the Style view.

---

## Open Questions / Assumptions

* Final **Funding Type** enum values and any mapping to accounting GL codes.
* Campaign date semantics when only one date provided (assume **Start** if single date unless explicitly marked as **End**?).
* Handling of styles without existing OCS: allow with justification, or block?
* Multi‑currency requirements (assumed **USD only** for v0.2).
* How to integrate with Finance’s remittance actuals feed: batch vs. API vs. file‑based.

---
