# MDF Contract Management System Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Reduce MDF contract processing time from 3-5 business days to 1-2 business days through automated OCR extraction and intelligent style matching
- Achieve <2% error rate in Style attribution through AI-powered matching algorithms with confidence scoring
- Eliminate 75% of overtime hours during peak promotional periods by replacing manual processes with automated workflows
- Enable real-time funding status queries, reducing sales stakeholder response time from hours to minutes
- Reduce month-end reconciliation cycle time by 50% through systematic finance workflow integration

### Background Context
The Arkansas Operations teams currently manage MDF contracts through manual processes involving Excel spreadsheets and email workflows, resulting in frequent attribution errors, time-intensive remittance processing, and difficulty reconciling Costco Item Numbers/Descriptions to internal FAM Style Numbers. Growing contract volume, increasing complexity of multi-channel allocations, and stakeholder demand for real-time funding visibility make manual processes unsustainable, creating financial control risks that compound over time.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-30 | v1.0 | Initial PRD creation | John (PM Agent) |

## Requirements

### Functional

1. **FR1:** The system SHALL provide drag-and-drop PDF upload interface for MDF contract intake with automated OCR extraction of Item Numbers, Item Descriptions, contract values, channel designations, campaign dates, and partner information
2. **FR2:** The system SHALL implement AI-powered Style matching engine that correlates Costco Item Numbers and Item Descriptions to FAM Style Numbers with confidence scoring (≥90% for auto-selection, <90% presented with confidence percentage for user review)
3. **FR3:** The system SHALL require user validation and confirmation of Style Number mapping before allowing contract submission, displaying OCS linkage context to reduce mismatch risk
4. **FR4:** The system SHALL automatically detect single-channel vs "Both Channels" contract designations and create separate Inline and E-commerce allocation records using contract-specified amounts
5. **FR5:** The system SHALL implement append-only ledger architecture serving as single source of truth for all financial transactions with real-time balance calculations derived from ledger entries
6. **FR6:** The system SHALL support manual finance reconciliation workflow with Excel/CSV import capabilities for matching provisional entries to actual finance charges
7. **FR7:** The system SHALL validate that all mandatory fields (Style, Date Taken, Funding Type, Total Contract Value ≥$0.01, Campaign Dates) are populated before allowing submission
8. **FR8:** The system SHALL maintain complete audit trail from contract intake through final reconciliation with user attribution and timestamp precision
9. **FR9:** The system SHALL provide Style-centric dashboard with real-time visibility into funding balances by Style and Channel with Active/Closed/Finalized status indicators
10. **FR10:** The system SHALL archive source PDF contracts with rich metadata including Style, Channel, Funding Type, Date Taken, Campaign Dates, Amount, Intake ID, and uploader information

### Non Functional

1. **NFR1:** The system SHALL process standard PDF contracts within 30 seconds for OCR extraction and initial validation
2. **NFR2:** The system SHALL support 50+ concurrent users with response times <2 seconds for user interactions and <1 second for balance calculations  
3. **NFR3:** The system SHALL maintain 99.5% availability during business hours with appropriate auto-scaling for peak volume handling
4. **NFR4:** The system SHALL implement role-based access control (RBAC) with data encryption at rest and in transit for financial data protection
5. **NFR5:** The system SHALL generate immutable submission receipts with checksum verification for each contract processing transaction
6. **NFR6:** The system SHALL maintain SOX compliance requirements through complete financial audit trails and appropriate internal controls
7. **NFR7:** The system SHALL integrate with existing Style Master Data and OCS Contract systems without requiring system replacement
8. **NFR8:** The system SHALL handle 3x normal contract volume spikes during promotional periods while maintaining performance standards

## User Interface Design Goals

### Overall UX Vision
The interface prioritizes efficiency and confidence for operations staff processing multiple contracts daily. Side-by-side contract preview with extracted data forms enables quick validation while maintaining document context. Visual confidence indicators and clear error states guide users through the AI-assisted style matching process. The design emphasizes reducing cognitive load during high-volume processing while ensuring accuracy through human validation checkpoints.

### Key Interaction Paradigms
- **Drag-and-drop intake** with immediate visual feedback and progress indicators
- **Confidence-based AI assistance** showing percentage scores and auto-selection thresholds
- **Side-by-side validation** with contract preview alongside editable extracted data
- **Real-time validation** with inline error states preventing submission of invalid data
- **Progressive disclosure** revealing complexity only when needed (e.g., channel splits for "Both Channels" contracts)

### Core Screens and Views
- **Contract Intake Screen** - Drag-and-drop zone with OCR extraction progress
- **Validation Dashboard** - Side-by-side contract preview with extracted data form
- **Style Selection Interface** - Search and confidence-scored matching results
- **Channel Allocation Editor** - Interactive split calculator for Both Channels contracts
- **Style-Centric Dashboard** - Real-time funding balances by Style and Channel
- **Reconciliation Workspace** - Manual finance matching workflow interface
- **Audit Trail Viewer** - Complete transaction history and document archive

### Accessibility: WCAG AA
Target compliance level ensuring keyboard navigation, screen reader compatibility, color contrast ratios, and alternative text for all visual elements. Critical for users with diverse accessibility needs in operations environment.

### Branding
Clean, professional interface reflecting enterprise financial software standards. Emphasis on clarity and trust through consistent typography, appropriate use of color for status indicators (green for validated, yellow for needs attention, red for errors), and FAMBrands visual identity where appropriate.

### Target Device and Platforms: Web Responsive
Primary focus on desktop workflow optimization for operations staff, with responsive design ensuring tablet compatibility for management review and mobile access for quick status checks. No native mobile apps required for MVP.

## Technical Assumptions

### Repository Structure: Monorepo
Single repository with Next.js full-stack application, database schema migrations, and deployment configurations. Co-located frontend and backend code with shared types and utilities.

### Service Architecture
**Next.js Full-Stack with Supabase Backend** - Next.js App Router providing both frontend and API routes in single Vercel deployment, Supabase for managed PostgreSQL with built-in auth and real-time capabilities, automatic scaling and edge deployment with zero infrastructure management.

### Testing Requirements
**Full Testing Pyramid** - Unit tests for business logic using Jest/Vitest, integration tests for API routes and Supabase operations, UiPath integration tests with proper mocking, and end-to-end tests using Playwright with Next.js testing utilities.

### Additional Technical Assumptions and Requests

**Backend Platform:** Next.js API routes handle all backend logic including file upload endpoints, UiPath Document Understanding integration, Style matching logic, database operations, and finance reconciliation processing. Built-in multipart handling, authentication middleware through Supabase Auth helpers, and automatic error boundaries.

**Frontend Platform:** Next.js App Router with React Server Components, providing optimized rendering, built-in image optimization, and seamless client-server integration. Vercel deployment enables global edge distribution and automatic performance optimization.

**Database:** Supabase PostgreSQL with Next.js integration providing direct database access through API routes, real-time subscriptions for dashboard updates, built-in authentication, and Row Level Security policies with minimal configuration.

**OCR Integration:** UiPath Document Understanding integrated through Next.js API routes with built-in request parsing, automatic timeout handling, and error boundaries. Vercel's extended limits support large file processing requirements.

**Deployment & Scaling:** Complete turnkey solution with single `git push` deployment to Vercel, automatic preview deployments, built-in monitoring and analytics, auto-scaling with zero configuration, and global edge distribution.

**File Processing:** Next.js built-in file upload capabilities with Vercel's extended processing limits, Supabase storage integration for PDF archival, and streamlined CSV/Excel import processing through API routes.

**Authentication & Security:** Supabase Auth integration with Next.js middleware, environment variable management through Vercel, data encryption at rest and in transit, SOX compliance through audit logging and immutable ledger design.

**Performance Optimization:** Automatic edge caching through Vercel, Supabase connection pooling, Next.js built-in optimizations for images and assets, and real-time balance calculations using PostgreSQL queries with server-side rendering.

## Epic List

**Epic 1: Foundation & Manual Contract Entry**
Establish Next.js/Supabase foundation with authentication, basic contract intake, and manual data entry form for contract processing, delivering immediate value for contract processing while OCR capabilities are developed.

**Epic 2: Progressive OCR Integration**  
Implement multi-tier OCR strategy: PDF.js text extraction for simple documents, cloud OCR APIs (Azure AI Document Intelligence preferred), and optional UiPath Document Understanding for complex cases.

**Epic 3: Style Matching & Validation**
AI-powered Style matching engine with confidence scoring and user validation interface, working with manual entry or automated extraction output.

**Epic 4: Ledger Management & Channel Allocation**
Append-only ledger system, channel-aware allocation management for Both Channels contracts, and real-time balance calculation engine.

**Epic 5: Dashboard & Finance Reconciliation**
Style-centric dashboard with real-time funding visibility, manual finance reconciliation workflow with CSV import, and complete audit trail reporting.

## Epic 1: Foundation & Manual Contract Entry

**Goal:** Establish core platform infrastructure with Next.js and Supabase while providing immediate contract processing capability through manual data entry, enabling users to begin processing MDF contracts without waiting for OCR development.

### Story 1.1: Project Foundation Setup
As a developer,
I want to initialize the Next.js project with Supabase integration and deployment pipeline,
so that we have a solid foundation for building the MDF Contract Management System.

**Acceptance Criteria:**
1. Next.js project created with TypeScript and Tailwind CSS configuration
2. Supabase project configured with connection from Next.js application
3. Vercel deployment pipeline established with preview and production environments
4. Basic project structure with components, pages, and API routes folders
5. Environment variables configured for Supabase connection and authentication

### Story 1.2: User Authentication System
As an Arkansas Operations team member,
I want to securely log into the MDF system with my credentials,
so that I can access contract processing functionality with appropriate permissions.

**Acceptance Criteria:**
1. Supabase Auth integration with email/password authentication
2. Login and registration pages with form validation
3. Protected routes requiring authentication to access
4. User session management with automatic logout after inactivity
5. Basic role-based access control (Operations, Finance roles)

### Story 1.3: Manual Contract Data Entry Form
As an Arkansas Operations team member,
I want to manually enter MDF contract data through a comprehensive form,
so that I can process contracts immediately without waiting for OCR capabilities.

**Acceptance Criteria:**
1. Contract intake form with all required fields (Style, Date Taken, Funding Type, Total Amount, Campaign Dates)
2. Real-time form validation preventing submission of invalid data
3. Style search and selection interface with autocomplete functionality
4. Channel handling with Both Channels allocation split interface
5. Form saves as draft and allows resuming incomplete entries

### Story 1.4: Basic Contract Storage
As an Arkansas Operations team member,
I want my manually entered contract data to be securely stored and retrievable,
so that I can maintain records of all processed MDF contracts.

**Acceptance Criteria:**
1. Supabase database schema for contracts, allocations, and ledger entries
2. API endpoints for creating and retrieving contract records
3. Data persistence with proper validation and error handling
4. Basic contract listing page showing processed contracts
5. Audit trail capturing user actions and timestamps

## Epic 2: Progressive OCR Integration

**Goal:** Implement multi-tier OCR strategy starting with simple PDF text extraction and progressing to sophisticated document understanding, enabling automated contract data extraction while maintaining fallback options and user control over the extraction process.

### Story 2.1: Basic PDF Upload and Preview
As an Arkansas Operations team member,
I want to upload PDF contracts and see them displayed alongside the manual entry form,
so that I can reference the document while entering contract data.

**Acceptance Criteria:**
1. PDF upload endpoint with file size limits and validation
2. PDF viewer component displaying uploaded contracts
3. Side-by-side layout: PDF preview and manual entry form
4. Secure PDF storage in Supabase with audit trail
5. PDF download and view capabilities for processed contracts

### Story 2.2: Simple Text Extraction
As an Arkansas Operations team member,
I want the system to extract basic text from PDF contracts when possible,
so that I can copy/paste key values instead of typing them manually.

**Acceptance Criteria:**
1. Server-side PDF text extraction using pdf-parse or similar Node.js library
2. Display extracted text in copyable text blocks below PDF preview
3. Basic keyword highlighting for amounts, dates, and item descriptions
4. No automatic field mapping - user manually copies relevant text segments
5. Graceful handling of extraction failures with fallback to manual entry

### Story 2.3: Azure AI Document Intelligence Integration
As an Arkansas Operations team member,  
I want improved text extraction for scanned or complex contracts,
so that I can access better text quality when basic extraction isn't sufficient.

**Acceptance Criteria:**
1. Azure AI Document Intelligence integration for enhanced OCR
2. User-triggered processing (button to "Enhance Extraction") rather than automatic
3. Cost controls: daily/monthly API call limits with admin configuration
4. Structured output showing extracted text with confidence scores
5. Clear user messaging about processing time and API usage

### Story 2.4: Extraction Preference Settings
As a system administrator,
I want to configure OCR processing preferences and monitor usage,
so that I can control costs and optimize the extraction approach based on actual usage.

**Acceptance Criteria:**
1. Admin settings for enabling/disabling different extraction methods
2. Usage tracking: API calls, processing time, costs per month
3. User preference settings: default to basic extraction vs enhanced OCR
4. Simple analytics: extraction usage by user and document type
5. Cost alerts when approaching configured spending limits

## Epic 3: Style Matching & Validation

**Goal:** Implement AI-powered Style matching engine that correlates Costco Item Numbers and Item Descriptions to FAM Style Numbers with confidence scoring, enabling accurate contract attribution while maintaining human validation for critical business decisions.

### Story 3.1: Style Master Data Integration
As a developer,
I want to connect to the Style Master Data system through Supabase,
so that the application can access current Style information for matching operations.

**Acceptance Criteria:**
1. Supabase database schema for Style master data with proper indexing
2. Data synchronization mechanism from existing Style Master Data system
3. Style search API endpoints with fuzzy matching capabilities
4. Performance optimization for Style lookups with under 2-second response times
5. OCS contract linkage data integrated with Style records

### Story 3.2: Basic Style Search Interface
As an Arkansas Operations team member,
I want to search and select FAM Style Numbers when processing contracts,
so that I can accurately attribute MDF contracts to the correct styles.

**Acceptance Criteria:**
1. Style search interface with autocomplete and filtering by season, business line, gender, country
2. Search results display Style Number, description, and OCS linkage status
3. Style selection populates contract form with validated Style information
4. Recent styles and frequently used styles quick-select options
5. Manual Style entry option for edge cases with validation warnings

### Story 3.3: Automated Item Matching Engine
As an Arkansas Operations team member,
I want the system to suggest FAM Style matches based on Costco Item Numbers and Descriptions,
so that I can quickly validate correct attributions without manual searching.

**Acceptance Criteria:**
1. Matching algorithm using Item Number exact matching and Item Description fuzzy matching
2. Confidence scoring system with ≥90% threshold for auto-selection
3. Multiple match results displayed with confidence percentages and reasoning
4. Pre-selected highest confidence match with option to review alternatives
5. No-match scenarios gracefully handled with manual search fallback

### Story 3.4: Validation Workflow with OCS Context
As an Arkansas Operations team member,
I want to see OCS contract context when validating Style matches,
so that I can make informed decisions about contract attribution accuracy.

**Acceptance Criteria:**
1. OCS contract details displayed for selected Style (funding projections, effective dates)
2. Visual indicators for Style-OCS relationship status (linked, unlinked, expired)
3. Validation warnings for mismatched effective dates or inactive OCS contracts
4. User confirmation required before proceeding with low-confidence matches
5. Override capability with justification text for exceptional cases

### Story 3.5: Style Matching Analytics
As a system administrator,
I want to monitor Style matching accuracy and user correction patterns,
so that I can improve the matching algorithm and identify data quality issues.

**Acceptance Criteria:**
1. Matching accuracy metrics: auto-selection acceptance rate, user correction frequency
2. Style matching performance tracking: common mismatches, frequently corrected suggestions
3. Data quality alerts: Item Numbers/Descriptions that consistently fail to match
4. User feedback collection on matching quality with simple rating system
5. Monthly reporting on matching effectiveness and improvement recommendations

## Epic 4: Ledger Management & Channel Allocation

**Goal:** Create append-only ledger system with channel-aware allocation management for Both Channels contracts and real-time balance calculation engine, providing authoritative financial tracking that serves as single source of truth for all MDF transactions.

### Story 4.1: Append-Only Ledger Architecture
As a developer,
I want to implement an immutable ledger system for all MDF financial transactions,
so that we maintain complete audit trails and financial integrity for compliance requirements.

**Acceptance Criteria:**
1. Supabase database schema for immutable ledger entries with proper constraints
2. Ledger entry creation API with validation preventing modifications or deletions
3. Transaction correlation linking ledger entries to source contracts and allocations
4. Audit trail capturing all entry metadata (user, timestamp, source, correlation IDs)
5. Database triggers preventing direct ledger modifications outside application

### Story 4.2: Channel Allocation Management
As an Arkansas Operations team member,
I want to specify channel allocations for MDF contracts with extracted or manual amounts,
so that I can properly create separate ledger entries for Inline and E-commerce channels based on contract-specific funding amounts.

**Acceptance Criteria:**
1. Channel selection interface: Inline, E-commerce, or Both Channels options
2. For Both Channels contracts: separate amount fields for Inline and E-commerce entries (no total constraint)
3. Amount validation ensuring each selected channel has a populated amount ≥ $0.01
4. Pre-population of channel amounts from OCR extraction with user override capability
5. Independent ledger entry creation for each channel with respective amounts (no mathematical relationship required)
6. Clear UI indication that Both Channels creates two separate funding commitments
7. Validation preventing submission if any selected channel lacks an amount value

### Story 4.3: Real-Time Balance Calculations
As an Arkansas Operations team member,
I want to see current funding balances by Style and Channel in real-time,
so that I can make informed decisions about available MDF funding.

**Acceptance Criteria:**
1. Balance calculation engine deriving totals from ledger entries (never stored totals)
2. Real-time balance queries by Style, Channel, and combined rollups
3. Balance display showing provisional commitments vs actual reconciled amounts
4. Performance optimization ensuring balance calculations complete within 1 second
5. Balance history tracking showing changes over time for audit purposes

### Story 4.4: Contract Status Management
As an Arkansas Operations team member,
I want to track MDF contract lifecycle status,
so that I can manage active contracts and prevent modifications to finalized records.

**Acceptance Criteria:**
1. Contract status tracking: Active, Closed, Finalized with appropriate transitions
2. Status change validation preventing invalid transitions or unauthorized modifications
3. Closed status preventing new ledger entries while maintaining visibility
4. Finalized status making contracts read-only after complete reconciliation
5. Status change audit trail with user attribution and justification

### Story 4.5: Ledger Transaction Processing
As an Arkansas Operations team member,
I want all contract submissions to create proper ledger entries for each specified channel,
so that financial impacts are immediately reflected in balance calculations with correct channel attribution.

**Acceptance Criteria:**
1. Automated ledger entry creation upon contract submission with proper dating for each selected channel
2. Independent ledger entries created for each channel with respective amounts (Inline, E-commerce, or both)
3. Provisional entry marking distinguishing initial commitments from actual charges
4. Transaction reversal capability through offsetting entries (not deletion)
5. Bulk transaction processing for finance reconciliation scenarios  
6. Transaction validation ensuring mathematical accuracy and business rule compliance per individual entry

## Epic 5: Dashboard & Finance Reconciliation

**Goal:** Build Style-centric dashboard with real-time funding visibility and manual finance reconciliation workflow with CSV import capabilities, providing complete operational visibility and systematic reconciliation process for closing the loop between provisional commitments and actual finance charges.

### Story 5.1: Style-Centric Dashboard Foundation
As an Arkansas Operations team member,
I want a comprehensive dashboard showing funding status by Style and Channel,
so that I can quickly assess available funding and respond to sales stakeholder inquiries in real-time.

**Acceptance Criteria:**
1. Dashboard layout showing Style-based cards with funding summaries by channel
2. Real-time balance display: committed amounts, reconciled actuals, available balances
3. Status indicators for contract states (Active, Closed, Finalized) with visual color coding
4. Search and filter functionality by Style Number, season, business line, channel
5. Quick access links to contract details, document archives, and audit trails

### Story 5.2: Contract History and Document Archive
As an Arkansas Operations team member,
I want to access complete contract history and archived documents for each Style,
so that I can provide detailed information to stakeholders and maintain comprehensive audit trails.

**Acceptance Criteria:**
1. Contract listing page showing all MDF contracts for selected Style with metadata
2. Document archive with secure PDF access and rich metadata search capabilities
3. Contract timeline view showing processing dates, status changes, and reconciliation events
4. Submission receipt access with complete processing trail and validation history
5. Audit log display showing all user actions and system events for transparency

### Story 5.3: Finance Reconciliation File Import
As a Finance team member,
I want to import reconciliation data from CSV/Excel files,
so that I can systematically match actual finance charges to provisional MDF commitments.

**Acceptance Criteria:**
1. CSV/Excel file upload interface with column mapping and validation
2. Data preview and error checking before import processing
3. Reconciliation matching logic linking imported actuals to provisional ledger entries
4. Batch processing capability for large reconciliation files
5. Import audit trail showing processed files, match results, and any exceptions

### Story 5.4: Manual Reconciliation Workflow
As a Finance team member,
I want to manually match individual finance charges to MDF commitments,
so that I can handle cases where automatic matching fails or requires human judgment.

**Acceptance Criteria:**
1. Reconciliation workspace showing unmatched provisional entries and imported actuals
2. Side-by-side matching interface with Style, amount, date, and description context
3. Manual matching capability with confidence scoring and validation warnings
4. Partial reconciliation support for contracts with multiple finance charges over time
5. Reconciliation confirmation creating final ledger entries and updating contract status

### Story 5.5: Reconciliation Reporting and Analytics
As a system administrator,
I want comprehensive reporting on reconciliation status and financial accuracy,
so that I can monitor system performance and identify process improvement opportunities.

**Acceptance Criteria:**
1. Reconciliation status dashboard showing matched vs unmatched entries by age
2. Financial accuracy reporting: variance analysis between provisional and actual amounts
3. Processing time metrics: contract intake to final reconciliation cycle times
4. Exception reporting: frequent reconciliation failures, data quality issues, user correction patterns
5. Monthly reconciliation summary reports for finance and operations stakeholders

## Checklist Results Report

### Executive Summary
- **Overall PRD Completeness:** 95%
- **MVP Scope Appropriateness:** Just Right  
- **Readiness for Architecture Phase:** Ready
- **Most Critical Gap:** Specific database schema details and Supabase integration specifics

### Category Analysis Table

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | PASS    | None |
| 2. MVP Scope Definition          | PASS    | None |
| 3. User Experience Requirements  | PASS    | None |
| 4. Functional Requirements       | PASS    | Minor: Database schema details |
| 5. Non-Functional Requirements   | PASS    | None |
| 6. Epic & Story Structure        | PASS    | None |
| 7. Technical Guidance            | PARTIAL | Next.js/Supabase integration specifics |
| 8. Cross-Functional Requirements | PASS    | None |
| 9. Clarity & Communication       | PASS    | None |

### Top Issues by Priority

**HIGH:**
- Technical integration details for Supabase schema design and real-time subscriptions
- Specific performance testing requirements for OCR processing timeouts

**MEDIUM:**
- Data migration strategy from existing Excel tracker
- User training and change management approach

**LOW:**
- Detailed error message specifications
- Advanced analytics requirements for post-MVP

### MVP Scope Assessment
**Appropriately Scoped:** The progressive approach from manual entry (Epic 1) through automated processing (Epics 2-3) to full operational capability (Epics 4-5) provides excellent incremental value delivery while minimizing risk.

**Technical Complexity:** Manageable with Next.js/Supabase/UiPath stack providing turnkey solutions for most requirements.

### Technical Readiness
**Architecture Clarity:** Next.js full-stack with Supabase backend provides clear technical direction
**Identified Risks:** OCR processing timeouts, Style matching algorithm accuracy, real-time performance under load
**Areas for Architect Investigation:** Database schema optimization, real-time subscription patterns, OCR integration patterns

### Recommendations
1. **Proceed with architecture phase** - PRD provides sufficient guidance for technical design
2. **Collaborate with architect** on Supabase schema design for optimal performance  
3. **Plan OCR prototype** early in Epic 2 to validate Azure AI integration approach
4. **Consider user training plan** as part of Epic 1 completion criteria

**FINAL DECISION: READY FOR ARCHITECT** - The PRD and epics are comprehensive, properly structured, and ready for architectural design.

## Next Steps

### UX Expert Prompt
Review the MDF Contract Management System PRD and create detailed UX designs for the contract intake workflow, focusing on side-by-side PDF preview with form validation, Style matching interface with confidence indicators, and Style-centric dashboard for real-time funding visibility.

### Architect Prompt  
Review the MDF Contract Management System PRD and design the technical architecture using Next.js full-stack with Supabase backend, emphasizing append-only ledger design, real-time balance calculations, OCR integration patterns, and optimal database schema for Style matching performance.