Initial Back-End Requirements — OCS & MDF Contract Tracking Schema (v1.0)

1. Objective

Design a normalized, channel-aware schema and process to manage:

OCS Contracts (1:1 with each Style) and their allocations.

MDF Contracts (multiple per Style, channel-specific).

Funding balances across Inline and E‑Comm channels.

Ledger of financial transactions (invoices, takes, adjustments, true‑ups) to calculate accurate, auditable balances.

The solution must support contract entry, MDF attribution, and dynamic calculation of available funds per Style × Channel.

2. Key Principles

OCS = 1:1 with Style. Each Style has one OCS contract.

MDF = N:1 with Style. A Style may have multiple MDF contracts.

MDF is recorded per Channel. Even if an MDF fund is initially "All‑style", the system will create two MDFAllocation records (Inline & Ecomm) at contract entry with explicit dollar splits.

Channel matters. Balances must be tracked separately for Inline vs E‑Comm.

Ledger is authoritative. All balances (TotalAmountTaken, Available) are derived from the FundingLedger; allocations do not store running balances.

3. Entities & Relationships

3.1 Style (Master)

Purpose: Unique identifier and descriptive info for each style.

Key Fields: StyleNumber (PK), ItemNumber, ItemDescription, Season, Business, Country, L/M.

3.2 OCSContract

Purpose: Captures the OCS agreement for a Style (header/meta).

Relationship: 1:1 with Style.

Fields: VendorAccount, ContractType, EffectiveStart/End, SignedContractLink, Notes.

3.3 OCSAllocation

Purpose: Stores OCS planned values by channel.

Relationship: 1:N with Style (each Style has up to 2 rows: Inline, Ecomm).

Fields: OCSUnits, OCSFunding, PrintFeesAboveBeyond, MarkdownDollars.

Derived: TotalPromoFunding = OCSFunding + PrintFeesA&B; PromoPlusMD = TotalPromoFunding + Markdown.

Ops Fields: Invoice #, Invoice Date, Funding Type, TotalAmountTaken, FundingBalance, CampaignDates, Comments (if not using Ledger).

3.4 MDFContract

Purpose: Independent marketing funding contracts tied to a Style.

Relationship: Many per Style (1 Style → N MDFContracts).

Fields: MDFContractId (PK), StyleNumber (FK), VendorAccount, MDFType, EffectiveStart/End, ContractDocLink, Notes.

3.5 MDFAllocation

Purpose: Channel‑specific MDF allocation under each MDFContract.

Relationship: 1:N with MDFContract (Inline/Ecomm rows). For "All‑style" MDF, two rows (Inline & Ecomm) are created at entry.

Fields: MDFFunding, MDFPrintFees, MDFMarkdown.

Derived: TotalPromoFunding = MDFFunding + MDFPrintFees; PromoPlusMD = TotalPromoFunding + MDFMarkdown.

Ops Fields: Invoice #, Invoice Date, Funding Type, (no stored running balances; use Ledger), CampaignDates, Comments.

Split Policy (All‑style): When an MDF fund is provided as a single pool, users must explicitly split the dollars between Inline and Ecomm at entry (recommended). Alternatively, an automated split rule (e.g., pro‑rata by forecast units) may be configured; the system will materialize the two channel rows accordingly.

3.6 FundingLedger (Recommended)

Purpose: Immutable transactions for both OCS and MDF.

Relationship: 1:N with Style and Channel; for MDF, also links to MDFContractId.

Fields: LedgerId (PK), StyleNumber, Channel, ContractKind (OCS|MDF), ContractRefId (MDFContractId or NULL), TxnDate, TxnType, Amount (signed), InvoiceNumber, InvoiceDate, FundingType, ReferenceDocLink, Memo.

Derived Balances:

Available_OCS = PromoPlusMD − Σ(Takes for OCS).

Available_MDF = PromoPlusMD − Σ(Takes for MDF).

TotalAvailable = Available_OCS + Σ Available_MDFs.

4. Calculations

OCS Allocation (per Style × Channel):

TotalPromotionalFunding = OCSFunding + PrintFeesAboveBeyond.

PromoPlusMD = TotalPromotionalFunding + MarkdownDollars.

MDF Allocation (per MDF × Channel):

TotalPromotionalFunding = MDFFunding + MDFPrintFees.

PromoPlusMD = TotalPromotionalFunding + MDFMarkdown.

Available Balance (ledger‑derived, authoritative):

Available_OCS(style,channel) = PromoPlusMD − Σ(Takes for OCS, style, channel).

Available_MDF(style,channel,mdf) = PromoPlusMD − Σ(Takes for MDF, style, channel, mdf).

TotalAvailable(style,channel) = Available_OCS + Σ Available_MDF.

5. Reporting & Rollups

By Style × Channel: show OCS, MDF, and total available.

By Style (all channels): Inline + Ecomm combined.

By MDFContract: balances per MDF fund.

By Vendor/Season/Business: aggregate across styles/contracts.

Exception Reporting: Negative balances, missing invoices, expired campaigns.

6. Data Integrity & Business Rules

StyleNumber unique in Style.

1:1 Style ↔ OCSContract.

StyleNumber + Channel unique in OCSAllocation.

MDFContractId + Channel unique in MDFAllocation.

Ledger is append‑only; corrections via reversing entries.

Currency fields must be ≥ 0 in allocations; ledger entries can be signed.

Controlled vocabularies: Channel (Inline, Ecomm), ContractKind (OCS, MDF), TxnType (Funding, Print Fee A&B, Markdown, Take, Adjustment, Reversal).

7. Implementation Guidance

Outside SharePoint/Smartsheet/Excel → expect 6 core tables: Style, OCSContract, OCSAllocation, MDFContract, MDFAllocation, FundingLedger.

Lean option (no ledger) → 4 tables (Style, OCSContract, OCSAllocation, MDFContract + MDFAllocation).

Strict normalization → keep Ledger for audit; calculate balances dynamically.

8. Acceptance Criteria (MVP)

Can create/update Style, OCSContract, OCSAllocation, MDFContract, MDFAllocation, and optionally FundingLedger.

Can compute available funds per Style × Channel (OCS + MDF).

Dashboards/reports show balances by contract, style, channel, season.

Validation prevents duplicate keys; negative balances flagged.

Exportable to BI tools (Power BI, Tableau) for analytics.

9) Design Decisions (Locked for MVP)

Balances Source of Truth: Derive from Ledger (FundingLedger). No stored running totals on allocations.

MDF Channel Handling: Some MDF contracts may be provided as All‑style; the system will create two MDFAllocation records (Inline & Ecomm) for that MDF. Users must explicitly split the dollars at entry (or apply a configured auto‑split rule) so that channel balances remain accurate.

Campaign Dates: Prefer Ledger‑level storage for multiple campaigns; optionally mirror the current active window on the Allocation for quick UI.

10) Acceptance Criteria (MVP)

Can create/update Style, OCSContract, OCSAllocation, MDFContract, MDFAllocation, and FundingLedger.

System enforces MDF channel rows for every MDF contract; prevents save until Inline/Ecomm splits are provided (or an auto‑split rule is applied).

Reports show available funds per Style × Channel (OCS + MDF), derived from Ledger only.

Validation prevents duplicate keys; flags negative balances; logs reversing entries for corrections.

Exportable to BI tools (Power BI, Tableau) for analytics.

