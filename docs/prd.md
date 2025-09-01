# MDF Contract Management System Product Requirements Document (PRD) - MVP Approach

## Goals and Background Context

### Goals (MVP-Focused)
- Reduce MDF contract processing time from 3-5 business days to 1-2 business days through automated OCR extraction and intelligent style matching
- Achieve reliable Style attribution through AI-powered matching with manual validation workflow
- Create centralized digital archive replacing Excel-based tracking
- Provide simple funding balance visibility with manual refresh capability

### Background Context
The Arkansas Operations teams currently manage MDF contracts through manual processes involving Excel spreadsheets and email workflows, resulting in frequent attribution errors, time-intensive remittance processing, and difficulty reconciling Costco Item Numbers/Descriptions to internal FAM Style Numbers. Growing contract volume, increasing complexity of multi-channel allocations, and stakeholder demand for funding visibility make manual processes unsustainable, creating financial control risks that compound over time.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-31 | v2.0 | MVP-focused PRD | Claude (Architect Agent) |

## Requirements

### Functional

1. **FR1:** The system SHALL provide drag-and-drop PDF upload interface for MDF contract intake with automated OCR extraction of Item Numbers, Item Descriptions, contract values, channel designations, campaign dates, and partner information
2. **FR2:** The system SHALL implement AI-powered Style matching engine that correlates Costco Item Numbers and Item Descriptions to FAM Style Numbers with confidence scoring (≥90% for auto-selection, <90% presented with confidence percentage for user review)
3. **FR3:** The system SHALL require user validation and confirmation of Style Number mapping before allowing contract submission, displaying OCS linkage context to reduce mismatch risk
4. **FR4:** The system SHALL automatically detect single-channel vs "Both Channels" contract designations and create separate Inline and E-commerce allocation records using contract-specified amounts
5. **FR5:** The system SHALL implement append-only ledger architecture serving as single source of truth for all financial transactions with on-demand balance calculations derived from ledger entries
6. **FR6:** The system SHALL validate that all mandatory fields (Style, Date Taken, Funding Type, Total Contract Value ≥$0.01, Campaign Dates) are populated before allowing submission
7. **FR7:** The system SHALL maintain comprehensive audit trail from contract intake through processing with user attribution, timestamp, confidence scores, and user decision tracking
8. **FR8:** The system SHALL provide Style-centric dashboard with manual refresh funding balances by Style and Channel with Active/Closed status indicators
9. **FR9:** The system SHALL archive source PDF contracts with processing metadata including OCR confidence scores, extraction results, and user validation decisions
10. **FR10:** The system SHALL provide save/resume functionality allowing users to save work-in-progress contracts and resume processing from any interruption point
11. **FR11:** The system SHALL implement role-based access control with operations, finance, and admin roles having appropriate permission levels

### Non Functional

1. **NFR1:** The system SHALL process standard PDF contracts within 30 seconds for OCR extraction and initial validation
2. **NFR2:** The system SHALL support 20+ concurrent users with response times <3 seconds for user interactions and <2 seconds for balance calculations  
3. **NFR3:** The system SHALL maintain 99% availability during business hours with standard web hosting reliability
4. **NFR4:** The system SHALL implement basic authentication with data encryption for financial data protection
5. **NFR5:** The system SHALL integrate with existing Style Master Data without requiring system replacement
6. **NFR6:** The system SHALL handle normal contract volume with manual scaling during promotional periods

## User Interface Design Goals

### Overall UX Vision
The interface prioritizes simplicity and reliability for operations staff processing contracts daily. Side-by-side contract preview with extracted data forms enables quick validation while maintaining document context. Clear confidence indicators guide users through the AI-assisted style matching process. The design emphasizes reducing errors through human validation checkpoints while maintaining processing speed.

### Key Interaction Paradigms
- **Drag-and-drop intake** with visual feedback and progress indicators
- **Confidence-based AI assistance** showing percentage scores and manual override capability
- **Side-by-side validation** with contract preview alongside editable extracted data
- **Manual refresh** for balance updates instead of real-time complexity
- **Simple disclosure** showing essential information without overwhelming complexity

### Core Screens and Views
- **Contract Intake Screen** - Drag-and-drop zone with OCR extraction progress
- **Validation Dashboard** - Side-by-side contract preview with extracted data form
- **Style Selection Interface** - Search and confidence-scored matching results
- **Channel Allocation Editor** - Simple split interface for Both Channels contracts
- **Style-Centric Dashboard** - Funding balances by Style and Channel with refresh button
- **Audit Trail Viewer** - Basic transaction history and document archive

### Target Device and Platforms: Web Responsive
Primary focus on desktop workflow optimization for operations staff, with responsive design ensuring tablet compatibility for management review. No mobile-specific features required for MVP.

## Technical Assumptions

### Repository Structure: Simple Monorepo
Single repository with Next.js full-stack application, database migrations, and basic deployment configurations. Co-located frontend and backend code with shared types.

### Service Architecture
**Next.js Full-Stack with Standard PostgreSQL** - Next.js App Router providing both frontend and API routes in single deployment, standard PostgreSQL database with basic authentication, simple file upload handling, and focus on reliability over real-time features.

### Testing Requirements
**Essential Testing** - Unit tests for business logic using Vitest, integration tests for API routes, and basic end-to-end tests using Playwright for critical user flows.

### Additional Technical Assumptions

**Backend Platform:** Next.js API routes handle all backend logic including file upload endpoints, Azure AI Document Intelligence integration, Style matching logic, and database operations. Standard authentication middleware and basic error handling.

**Frontend Platform:** Next.js App Router with standard React components, providing optimized rendering and client-server integration. Simple deployment with standard hosting.

**Database:** Standard PostgreSQL with Next.js integration providing direct database access through API routes, basic authentication, and simple connection pooling.

**OCR Integration:** Azure AI Document Intelligence integrated through Next.js API routes with manual fallback for low-confidence extractions. Add additional providers only after proving core workflow.

**Deployment & Scaling:** Simple deployment solution with standard hosting, basic monitoring, and manual scaling during peak periods.

**File Processing:** Next.js built-in file upload capabilities with PDF storage and basic CSV import processing through API routes.

**Authentication & Security:** Standard authentication system, environment variable management, data encryption, and basic audit logging.

## MVP Phasing Strategy

### Phase 1 (MVP - 8 weeks)
- PDF upload and Azure AI OCR extraction
- Style matching with manual validation
- Basic MDF contract creation
- Simple allocation management
- Manual refresh for balance updates
- Basic audit trail

### Phase 2 (Enhancements - 6 weeks)
- Real-time updates if proven necessary by user feedback
- Additional OCR providers if reliability issues discovered
- Advanced reconciliation workflows based on finance team needs
- Enhanced reporting and analytics

### Phase 3 (Scale - 4 weeks)  
- Performance optimizations based on actual usage
- Integration with additional systems as needed
- Advanced features based on operational experience

## Epic List (MVP-Focused)

**Epic 1: Foundation & Manual Contract Entry**
Establish Next.js/PostgreSQL foundation with role-based authentication, contract intake, manual data entry form, and save/resume functionality for immediate contract processing capability.

**Epic 2: Single OCR Integration**  
Implement Azure AI Document Intelligence for reliable OCR extraction with processing state tracking, confidence scoring, and manual fallback for low-confidence cases.

**Epic 3: Style Matching & Validation**
AI-powered Style matching engine with confidence scoring and user validation interface, working with manual entry or automated extraction output.

**Epic 4: Basic Ledger & Channel Allocation**
Simple append-only ledger system with channel allocation for Both Channels contracts and on-demand balance calculations.

**Epic 5: Simple Dashboard**
Style-centric dashboard with funding visibility, basic contract archive, and manual refresh capability.

## Epic 1: Foundation & Manual Contract Entry

**Goal:** Establish core platform infrastructure with Next.js and PostgreSQL while providing immediate contract processing capability through manual data entry, enabling users to begin processing MDF contracts without waiting for OCR development.

### Story 1.1: Project Foundation Setup
As a developer,
I want to initialize the Next.js project with PostgreSQL integration and deployment pipeline,
So that we have a solid foundation for building the MDF Contract Management System.

**Acceptance Criteria:**
1. Next.js project created with TypeScript and Tailwind CSS configuration
2. PostgreSQL database configured with connection from Next.js application
3. Basic deployment pipeline established with staging and production environments
4. Simple project structure with components, pages, and API routes folders
5. Environment variables configured for database connection and authentication

### Story 1.2: Basic User Authentication System
As an Arkansas Operations team member,
I want to securely log into the MDF system with my credentials,
So that I can access contract processing functionality.

**Acceptance Criteria:**
1. Simple authentication system with email/password
2. Login page with form validation
3. Protected routes requiring authentication to access
4. Basic user session management
5. Simple role-based access (Operations, Finance roles)

### Story 1.3: Manual Contract Data Entry Form
As an Arkansas Operations team member,
I want to manually enter MDF contract data through a comprehensive form,
So that I can process contracts immediately without waiting for OCR capabilities.

**Acceptance Criteria:**
1. Contract intake form with required fields (Style, Date Taken, Funding Type, Total Amount, Campaign Dates)
2. Form validation preventing submission of invalid data
3. Style search and selection interface with autocomplete
4. Channel handling with Both Channels allocation interface
5. Form saves and allows resuming incomplete entries

### Story 1.4: Basic Contract Storage
As an Arkansas Operations team member,
I want my manually entered contract data to be securely stored and retrievable,
So that I can maintain records of all processed MDF contracts.

**Acceptance Criteria:**
1. PostgreSQL database schema for contracts, allocations, and ledger entries
2. API endpoints for creating and retrieving contract records
3. Data persistence with validation and error handling
4. Basic contract listing page showing processed contracts
5. Simple audit trail capturing user actions and timestamps

## Epic 2: Single OCR Integration

**Goal:** Implement Azure AI Document Intelligence for reliable OCR extraction with manual fallback, enabling automated contract data extraction with cost control and user oversight.

### Story 2.1: Basic PDF Upload and Preview
As an Arkansas Operations team member,
I want to upload PDF contracts and see them displayed alongside the manual entry form,
So that I can reference the document while processing contract data.

**Acceptance Criteria:**
1. PDF upload endpoint with file size limits and validation
2. PDF viewer component displaying uploaded contracts
3. Side-by-side layout: PDF preview and manual entry form
4. Secure PDF storage with basic audit trail
5. PDF download capabilities for processed contracts

### Story 2.2: Azure AI Document Intelligence Integration
As an Arkansas Operations team member,
I want automated text extraction from PDF contracts,
So that I can reduce manual data entry while maintaining control over the process.

**Acceptance Criteria:**
1. Azure AI Document Intelligence integration for OCR processing
2. Automatic processing for uploaded PDFs with progress indicators
3. Cost controls: monthly API call limits with admin configuration
4. Structured output showing extracted text with confidence scores
5. Manual fallback for low-confidence extractions

### Story 2.3: Extraction Results Interface
As an Arkansas Operations team member,
I want to review and validate extracted data before creating contracts,
So that I can ensure accuracy while benefiting from automation.

**Acceptance Criteria:**
1. Extraction results displayed in editable form fields
2. Confidence indicators for each extracted field
3. Side-by-side comparison with original PDF
4. Manual override capability for all extracted values
5. Clear indication of extraction vs manual data entry

## Epic 3: Style Matching & Validation

**Goal:** Implement AI-powered Style matching engine that correlates Costco Item Numbers and Item Descriptions to FAM Style Numbers with confidence scoring, enabling accurate contract attribution while maintaining human validation.

### Story 3.1: Style Master Data Integration
As a developer,
I want to connect to the Style Master Data system,
So that the application can access current Style information for matching operations.

**Acceptance Criteria:**
1. PostgreSQL database schema for Style master data with indexing
2. Data import mechanism from existing Style Master Data system
3. Style search API endpoints with fuzzy matching
4. Performance optimization for Style lookups under 2-second response times
5. OCS contract linkage data integrated with Style records

### Story 3.2: Basic Style Search Interface
As an Arkansas Operations team member,
I want to search and select FAM Style Numbers when processing contracts,
So that I can accurately attribute MDF contracts to the correct styles.

**Acceptance Criteria:**
1. Style search interface with autocomplete and filtering
2. Search results display Style Number, description, and OCS status
3. Style selection populates contract form with validated information
4. Recent and frequently used styles quick-select options
5. Manual Style entry option for edge cases

### Story 3.3: Automated Item Matching Engine
As an Arkansas Operations team member,
I want the system to suggest FAM Style matches based on Costco Item Numbers and Descriptions,
So that I can quickly validate correct attributions without manual searching.

**Acceptance Criteria:**
1. Matching algorithm using exact and fuzzy matching
2. Confidence scoring system with ≥90% threshold for auto-selection
3. Multiple match results with confidence percentages
4. Pre-selected highest confidence match with alternatives
5. No-match scenarios handled with manual search fallback

## Epic 4: Basic Ledger & Channel Allocation

**Goal:** Create simple append-only ledger system with channel allocation management for Both Channels contracts and on-demand balance calculations, providing reliable financial tracking without real-time complexity.

### Story 4.1: Simple Ledger Architecture
As a developer,
I want to implement a basic ledger system for all MDF financial transactions,
So that we maintain audit trails and financial integrity.

**Acceptance Criteria:**
1. PostgreSQL database schema for ledger entries with constraints
2. Ledger entry creation API with validation
3. Transaction correlation linking entries to contracts and allocations
4. Basic audit trail capturing entry metadata
5. Database constraints preventing unauthorized modifications

### Story 4.2: Channel Allocation Management
As an Arkansas Operations team member,
I want to specify channel allocations for MDF contracts,
So that I can properly create separate entries for Inline and E-commerce channels.

**Acceptance Criteria:**
1. Channel selection interface: Inline, E-commerce, or Both Channels
2. For Both Channels: separate amount fields for each channel
3. Amount validation ensuring positive values for selected channels
4. Independent ledger entry creation for each channel
5. Clear indication that Both Channels creates separate commitments

### Story 4.3: On-Demand Balance Calculations
As an Arkansas Operations team member,
I want to see current funding balances by Style and Channel,
So that I can make informed decisions about available MDF funding.

**Acceptance Criteria:**
1. Balance calculation engine deriving totals from ledger entries
2. On-demand balance queries by Style and Channel
3. Balance display with refresh button for updates
4. Performance ensuring calculations complete within 2 seconds
5. Simple balance history for basic audit purposes

## Epic 5: Simple Dashboard

**Goal:** Build basic Style-centric dashboard with funding visibility and contract archive, providing essential operational visibility without real-time complexity.

### Story 5.1: Style-Centric Dashboard
As an Arkansas Operations team member,
I want a dashboard showing funding status by Style and Channel,
So that I can quickly assess available funding and respond to inquiries.

**Acceptance Criteria:**
1. Dashboard layout showing Style-based cards with funding summaries
2. Balance display with manual refresh capability
3. Status indicators for contract states (Active, Closed)
4. Search and filter functionality by Style Number and channel
5. Links to contract details and document archives

### Story 5.2: Contract Archive
As an Arkansas Operations team member,
I want to access contract history and documents for each Style,
So that I can provide information to stakeholders and maintain records.

**Acceptance Criteria:**
1. Contract listing page showing all MDF contracts for selected Style
2. Document archive with secure PDF access
3. Basic contract timeline showing processing dates and status
4. Simple audit log showing user actions and system events
5. Contract search and filtering capabilities

### Story 5.3: Basic Reporting
As a system administrator,
I want basic reporting on system usage and contract processing,
So that I can monitor system performance and identify issues.

**Acceptance Criteria:**
1. Simple usage metrics: contracts processed, OCR success rate, processing times
2. Basic financial summary: total commitments by Style and Channel
3. User activity summary showing processing volume by user
4. Monthly summary reports for operations stakeholders
5. Error tracking for OCR failures and system issues

## Checklist Results Report

### Executive Summary
- **Overall PRD Completeness:** 90% (MVP-focused)
- **MVP Scope Appropriateness:** Right-sized for 8-week delivery
- **Readiness for Architecture Phase:** Ready
- **Most Critical Success Factor:** Reliable OCR integration with cost control

### MVP Scope Assessment
**Appropriately Scoped:** The simplified approach focuses on core value delivery - reducing processing time from 3-5 days to 1-2 days through automation while maintaining reliability and user control.

**Technical Complexity:** Manageable with Next.js/PostgreSQL/Azure AI stack providing proven solutions with minimal vendor lock-in risk.

### Recommendations
1. **Proceed with MVP architecture** - PRD provides clear guidance for simple, reliable implementation
2. **Focus on OCR reliability** - Single provider approach reduces complexity while proving core value
3. **Plan Phase 2 based on user feedback** - Add complexity only when justified by actual usage
4. **Maintain upgrade path** - Simple architecture can evolve to complex features when needed

**FINAL DECISION: READY FOR MVP ARCHITECTURE** - The PRD focuses on essential features with clear success metrics and realistic technical approach.