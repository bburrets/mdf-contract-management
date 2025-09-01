# Requirements

## Functional

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

## Non Functional

1. **NFR1:** The system SHALL process standard PDF contracts within 30 seconds for OCR extraction and initial validation
2. **NFR2:** The system SHALL support 20+ concurrent users with response times <3 seconds for user interactions and <2 seconds for balance calculations  
3. **NFR3:** The system SHALL maintain 99% availability during business hours with standard web hosting reliability
4. **NFR4:** The system SHALL implement basic authentication with data encryption for financial data protection
5. **NFR5:** The system SHALL integrate with existing Style Master Data without requiring system replacement
6. **NFR6:** The system SHALL handle normal contract volume with manual scaling during promotional periods
