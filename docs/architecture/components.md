# Components

## DocumentProcessor
**Responsibility:** PDF upload and OCR processing using Azure AI with manual fallback.

**Key Interfaces:**
- uploadDocument(file) -> DocumentResult
- extractData(documentId) -> ExtractionResult
- validateExtraction(data) -> ValidationResult

**Technology Stack:** Next.js API routes, Azure AI SDK, file system storage

## StyleMatcher
**Responsibility:** Simple AI-powered matching of item data against style database.

**Key Interfaces:**
- findMatches(itemData) -> MatchResult[]
- validateMatch(styleNumber, itemData) -> ValidationResult

**Technology Stack:** PostgreSQL queries, simple fuzzy matching algorithms

## LedgerManager
**Responsibility:** Basic financial transaction management with append-only integrity.

**Key Interfaces:**
- addEntry(transaction) -> LedgerResult
- calculateBalance(allocationId) -> BalanceResult
- getHistory(filters) -> LedgerEntry[]

**Technology Stack:** PostgreSQL with constraints, TypeScript validation

## AllocationManager
**Responsibility:** Simple MDF budget allocation management across channels.

**Key Interfaces:**
- createAllocation(mdfId, channelData) -> AllocationResult
- getBalance(allocationId) -> BalanceData
- updateAllocation(allocationId, changes) -> UpdateResult

**Technology Stack:** PostgreSQL queries, simple calculation logic
