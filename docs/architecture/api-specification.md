# API Specification

Simple REST API design with clear endpoints and standard HTTP methods.

## REST API Endpoints

```typescript
// Contract Management
POST   /api/contracts              // Create new MDF contract
GET    /api/contracts              // List all contracts
GET    /api/contracts/{id}         // Get specific contract
PUT    /api/contracts/{id}         // Update contract
DELETE /api/contracts/{id}         // Delete contract
POST   /api/contracts/draft        // Save work-in-progress contract
GET    /api/contracts/drafts       // Get user's draft contracts
POST   /api/contracts/validate     // Pre-submission validation

// Style Management
GET    /api/styles                 // Search styles
GET    /api/styles/{style_number}  // Get specific style
POST   /api/styles/match           // Match item to style
GET    /api/styles/{style_number}/summary // Get funding summary by style

// Allocation Management
GET    /api/allocations            // List allocations
GET    /api/allocations/{id}       // Get specific allocation
GET    /api/allocations/{id}/balance // Get allocation balance
POST   /api/allocations            // Create new allocation

// Ledger Management
POST   /api/ledger/entries         // Create ledger entry
GET    /api/ledger/entries         // List ledger entries
GET    /api/ledger/balance/{allocation_id} // Get balance

// Document Processing
POST   /api/documents/upload       // Upload PDF
POST   /api/documents/extract      // Extract data from PDF
GET    /api/documents/{id}         // Get document
GET    /api/documents/{id}/status  // Get processing status

// Dashboard and Aggregation
GET    /api/dashboard/styles       // Style dashboard summary data
GET    /api/dashboard/balances     // Aggregate balance information
```

## API Response Format

```typescript
// Standard success response
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Standard error response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```
