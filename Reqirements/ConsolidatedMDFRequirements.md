# MDF Contract Management System - Consolidated Requirements

**Version:** v1.0 (Post-Clarification)  
**Purpose:** Unified requirements for MDF contract intake, ledger management, and finance reconciliation  
**Scope:** Style-based funding contract tracking across Inline and E-commerce channels

---

## Executive Summary

This system manages MDF (Marketing Development Fund) contract intake, style-based allocation tracking, and ledger management for retail funding operations. The system supports automated contract processing with human validation, channel-specific allocation management, and manual reconciliation with finance actuals.

**Key Capabilities:**
- Drag-and-drop MDF contract intake with OCR extraction
- Style-based allocation management with OCS integration  
- Channel-aware ledger tracking (Inline/E-commerce)
- Manual finance reconciliation workflow
- Audit trail and compliance reporting

---

## 1. Business Context & Entity Model

### 1.1 Core Business Entities

**Style** *(Primary Business Entity)*
- Enterprise identifier used by merchandising and finance teams
- 1:1 relationship with Item and OCS Contract
- Primary anchor for all MDF funding discussions

**Relationships:**
- **Style (1)** ↔ **Item (1)** ↔ **OCS Contract (1)**
- **Style (1)** ↔ **MDF Contracts (N)**
- **MDF Contract (1)** ↔ **Channel Allocations (2)** *(Inline + E-commerce)*

### 1.2 Channel Model

**Supported Channels:**
- **Inline** - Traditional retail channel
- **E-commerce** - Online retail channel  
- **Both Channels** - MDF applies to both Inline and E-commerce (requires allocation split)

**Channel Allocation Rules:**
- Every MDF must specify channel coverage
- "Both Channels" MDF creates two allocation records (Inline + E-commerce)
- Default split: 50/50 unless user specifies otherwise
- Total allocations must equal MDF contract value

---

## 2. User Journey & Functional Requirements

### 2.1 MDF Contract Intake Process

#### Step 1: File Upload
- **User Action:** Drag-and-drop MDF contract file (PDF/scanned document)
- **System Response:** 
  - Assign unique Intake ID
  - Log metadata (filename, uploader, timestamp)
  - Display progress indicator
  - Store file with audit trail

#### Step 2: Automated Data Extraction  
- **System Process:** OCR/Document Understanding extraction
- **Extracted Fields:**
  - Contract Reference/ID
  - Item Number (Costco identifier for matching to FAM Style Numbers)
  - Item Description (Costco identifier for matching to FAM Style Numbers)
  - Channel designation (Inline, E-commerce, or Both Channels)
  - Contract Value ($)
  - Campaign dates (start/end if present)
  - Contract description text
  - Partner/Vendor information
- **UI Display:** Side-by-side contract preview and extracted values

#### Step 3: Style Matching & Validation
- **System Process:** Query existing FAM Style master data using extracted Item Number and/or Item Description from Costco MDF contract
- **Matching Logic:** Both Item Number and Item Description can be used independently to match to FAM Style Numbers
- **Auto-Selection Rule:** ≥90% confidence threshold for automatic pre-selection
- **Confidence Display:** <90% confidence predictions still shown to user with confidence percentage displayed
- **User Validation:** Review and confirm Item Number/Description → Style Number mapping with OCS linkage display
- **Requirement:** User cannot proceed until valid Style is selected/confirmed

#### Step 4: Allocation Review & Channel Setup
- **Single Channel:** Direct allocation to specified channel
- **Both Channels:** System creates two allocation rows with user-editable split
- **Validation Rules:**
  - All required fields must be populated
  - Channel allocations must sum to total contract value
  - Real-time validation prevents submission of invalid data

#### Step 5: Submission & Ledger Creation
- **System Process:**
  - Create allocation record(s) by style and channel
  - Generate initial ledger entries reflecting contract commitments
  - Archive source document with rich metadata
  - Generate submission receipt with audit trail

### 2.2 Required Data Fields

#### Mandatory Fields (Submission Blocking)
1. **Style** - FAM Style Number determined by matching extracted Item Number/Description against existing Style master data
2. **Date Taken** - Effective date for ledger impact
3. **Funding Type** - Enum: Base, Bonus, Chargeback Offset, Co-Op, Other
4. **Total Contract Value** - Must be ≥ $0.01 (USD)
5. **Campaign Dates** - At least one date (start OR end) required
6. **Contract Description** - Free-form text for finance matching

#### Channel Allocation Rules
- **Channel** must be: Inline, E-commerce, or Both Channels
- **Both Channels** creates two allocation records with mandatory split definition
- **Allocation amounts** must sum to total contract value

---

## 3. Data Model Specification

### 3.1 Core Entities

#### Style (Master Data)
```
style_id (PK)
style_number (Unique, Business Key)
item_number (1:1 relationship)
season, business_line, gender, country
created_at, updated_at
```

#### OCS Contract (1:1 with Style)
```
ocs_id (PK)
style_id (FK)
channel_code (Inline/E-commerce)
ocs_funding_proj, print_fees_proj, above_beyond_proj, markdown_proj
effective_start, effective_end
```

#### MDF Contract (N:1 with Style)
```
mdf_id (PK)
style_id (FK)
contract_reference, customer, signed_date
contract_description (for finance matching)
total_committed_amount
effective_start, effective_end
```

#### Allocation (Channel-Specific Budget Buckets)
```
allocation_id (PK)
mdf_id (FK)
channel_code (Inline/E-commerce) - NOT NULL
allocated_amount (≥ 0)
status (Active/Closed)
campaign_start, campaign_end
UNIQUE(mdf_id, channel_code)
```

#### Ledger Entry (Authoritative Financial Records)
```
entry_id (PK)
allocation_id (FK)
entry_date, funding_type
amount (negative = spend, positive = credit)
invoice_id (FK, nullable)
comments, created_by, created_at
is_reconciled (for finance matching)
```

### 3.2 Status Model

#### MDF Contract Status
- **Active** - Available for ledger entries and modifications
- **Closed** - Administratively terminated, no further entries allowed
- **Finalized** - Fully reconciled with finance actuals (read-only)

#### Ledger Entry Status  
- **Provisional** - Initial commitment from MDF intake
- **Reconciled** - Matched with finance actuals (individual entry level)

---

## 4. Finance Integration & Reconciliation

### 4.1 Current State (MVP)
- **Process:** Manual reconciliation workflow
- **Finance Data:** Excel/CSV files with item numbers and descriptions
- **Matching:** Finance team searches Snowflake DB by item number + description text
- **Resolution:** Human determination of style associations
- **System Update:** Manual ledger entry updates to reflect actuals

### 4.2 Matching Process
1. **Finance Receives:** Customer remittance with item numbers and descriptions
2. **Finance Searches:** Internal database using customer-provided identifiers  
3. **Finance Matches:** Item number to Style number through description correlation
4. **Finance Updates:** Manual system updates to convert provisional to actual amounts
5. **System Reconciles:** Ledger entries marked as reconciled at individual level

### 4.3 Partial Reconciliation Support
- **Multiple Charges:** Single MDF submission can result in multiple finance charges over time
- **Tracking Level:** Individual ledger entries, not contract-level reconciliation status
- **Balance Calculation:** Real-time based on reconciled vs provisional entries

---

## 5. Business Rules & Validation

### 5.1 Data Integrity Rules
1. **Style Requirement:** MDF cannot exist without corresponding OCS contract
2. **Channel Enforcement:** All allocations must specify explicit channel (no nulls)
3. **Amount Validation:** All financial amounts ≥ 0 in allocations; ledger entries can be negative (spend)
4. **Date Logic:** If both campaign dates provided, start ≤ end validation
5. **Allocation Math:** Both Channels MDF must have allocations summing to total contract value

### 5.2 Status Transition Rules
- **Active → Closed:** Administrative termination (manual override with justification)
- **Active → Finalized:** Full reconciliation complete (system-driven after all entries reconciled)
- **Closed Status:** Prevents new ledger entries
- **Finalized Status:** Read-only, no modifications allowed

### 5.3 Ledger Rules
- **Append-Only:** No deletion of ledger entries (corrections via reversal entries)
- **Audit Trail:** All entries maintain created_by, created_at for compliance
- **Balance Calculation:** Always derived from ledger entries, never stored as running totals

---

## 6. User Interface Requirements

### 6.1 Intake Interface
- **Drag-and-Drop Zone:** Visual feedback for file upload progress
- **Side-by-Side View:** Contract preview alongside extracted data form
- **Real-Time Validation:** Immediate feedback on required fields and validation errors
- **Style Selection:** Search interface with OCS linkage context display
- **Channel Allocation Editor:** Interactive split calculator for Both Channels MDF

### 6.2 Dashboard Requirements
- **Style Overview:** Current balance by channel for each style
- **Contract Status:** Visual indicators for Active/Closed/Finalized states
- **Reconciliation Queue:** Pending items awaiting finance reconciliation
- **Audit Access:** Links to submission receipts and document archives

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements
- **File Processing:** Standard PDF processing within 30 seconds
- **Style Lookup:** Response time < 2 seconds for search queries
- **Balance Calculation:** Real-time ledger aggregation < 1 second
- **Concurrent Users:** Support 50+ simultaneous users

### 7.2 Compliance & Audit
- **Immutable Receipt:** Generated for each submission with checksum verification
- **Complete Audit Trail:** User actions, data changes, and system events logged
- **Document Archive:** Source contracts stored with rich metadata for retrieval
- **Financial Controls:** All monetary transactions tracked with approval workflows

### 7.3 Security Requirements
- **Authentication:** Role-based access control (RBAC)
- **Data Protection:** Financial data encryption at rest and in transit
- **API Security:** Rate limiting and input validation for all endpoints
- **Audit Logging:** All data access and modifications logged for compliance

---

## 8. Integration Points

### 8.1 Current Integrations
- **Style Master Data:** Read-only access to existing Style/Item catalog
- **OCS System:** Validation of style-to-OCS relationships
- **Document Storage:** Secure archival of contract PDF files

### 8.2 Future Integrations
- **Snowflake Database:** Direct finance team access for reconciliation matching
- **Finance Systems:** API-based reconciliation data exchange (planned)
- **Notification Systems:** Email/Teams integration for workflow events

---

## 9. Acceptance Criteria

### 9.1 Functional Acceptance
1. **Intake Blocking:** User cannot submit without valid Style selection and required fields
2. **Channel Allocation:** Both Channels MDF creates exactly two allocation records
3. **Balance Accuracy:** System balances derived from ledger entries match manual calculations
4. **Audit Completeness:** All user actions and data changes captured in audit trail
5. **Document Archival:** All source contracts retrievable with complete metadata

### 9.2 Performance Acceptance
1. **Processing Speed:** 95th percentile file processing under defined SLAs
2. **System Availability:** 99.5% uptime during business hours
3. **Data Integrity:** Zero data loss or corruption incidents
4. **Response Times:** All user interactions under 3 seconds response time

---

## 10. Implementation Phases

### Phase 1: Core Foundation
- Style-based data model implementation
- Basic MDF intake workflow
- Manual ledger entry management
- Simple status tracking

### Phase 2: Enhanced Processing  
- OCR/document extraction integration
- Automated style matching (90% threshold)
- Channel allocation UI
- Audit trail implementation

### Phase 3: Finance Integration
- Manual reconciliation workflow
- Batch finance data processing
- Reconciliation reporting
- Advanced dashboard features

---

## 11. Open Questions & Assumptions

### 11.1 Resolved Through Clarification
- ✅ **Entity Model:** Style is primary business entity
- ✅ **Channel Terminology:** "Both Channels" is standard business term
- ✅ **Finance Integration:** Manual process for MVP with future automation
- ✅ **Status Complexity:** Simple Active/Closed model sufficient
- ✅ **Style Matching:** ≥90% confidence threshold for auto-selection, <90% predictions shown with confidence percentage

### 11.2 Implementation Assumptions
- **Currency:** USD only for initial release (multi-currency future consideration)
- **File Formats:** PDF support initially, other formats as needed
- **User Training:** Standard business user training for new workflows
- **Data Migration:** Existing MDF data migration plan to be developed separately

---

## 12. Success Metrics

### 12.1 Business Metrics
- **Processing Time:** 75% reduction in manual MDF processing time
- **Error Rate:** < 2% error rate in financial calculations
- **User Adoption:** 90% of eligible users actively using system within 90 days
- **Reconciliation Cycle:** 50% reduction in finance reconciliation cycle time

### 12.2 Technical Metrics
- **System Performance:** All SLAs consistently met
- **Data Quality:** 99.9% data integrity maintained
- **Security:** Zero security incidents or compliance violations
- **Audit Compliance:** 100% audit trail completeness for all financial transactions

---

*This consolidated requirements document incorporates all stakeholder clarifications and serves as the authoritative specification for MDF Contract Management System development.*