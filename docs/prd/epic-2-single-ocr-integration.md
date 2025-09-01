# Epic 2: Single OCR Integration

**Goal:** Implement Azure AI Document Intelligence for reliable OCR extraction with manual fallback, enabling automated contract data extraction with cost control and user oversight.

## Story 2.1: Basic PDF Upload and Preview
As an Arkansas Operations team member,
I want to upload PDF contracts and see them displayed alongside the manual entry form,
So that I can reference the document while processing contract data.

**Acceptance Criteria:**
1. PDF upload endpoint with file size limits and validation
2. PDF viewer component displaying uploaded contracts
3. Side-by-side layout: PDF preview and manual entry form
4. Secure PDF storage with basic audit trail
5. PDF download capabilities for processed contracts

## Story 2.2: Azure AI Document Intelligence Integration
As an Arkansas Operations team member,
I want automated text extraction from PDF contracts,
So that I can reduce manual data entry while maintaining control over the process.

**Acceptance Criteria:**
1. Azure AI Document Intelligence integration for OCR processing
2. Automatic processing for uploaded PDFs with progress indicators
3. Cost controls: monthly API call limits with admin configuration
4. Structured output showing extracted text with confidence scores
5. Manual fallback for low-confidence extractions

## Story 2.3: Extraction Results Interface
As an Arkansas Operations team member,
I want to review and validate extracted data before creating contracts,
So that I can ensure accuracy while benefiting from automation.

**Acceptance Criteria:**
1. Extraction results displayed in editable form fields
2. Confidence indicators for each extracted field
3. Side-by-side comparison with original PDF
4. Manual override capability for all extracted values
5. Clear indication of extraction vs manual data entry
