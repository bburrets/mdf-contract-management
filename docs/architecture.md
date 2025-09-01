# MDF Contract Management System MVP Architecture Document

## Introduction

This document outlines the MVP-focused architecture for MDF Contract Management System, emphasizing simplicity, reliability, and rapid delivery over complex features. It serves as the technical foundation for an 8-week development cycle that delivers core automation value while avoiding over-engineering.

This pragmatic approach focuses on proven technologies and simple patterns that can evolve as business needs are validated through actual usage.

### MVP Approach

This is a simplified implementation focusing on the core automation goal: reducing MDF contract processing from 3-5 days to 1-2 days through reliable OCR and Style matching, with manual processes for edge cases.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-31 | v2.0 | MVP-focused architecture | Claude (Architect Agent) |

## High Level Architecture

### Technical Summary

The MDF Contract Management System follows a straightforward fullstack architecture using Next.js with standard PostgreSQL database, deployed on standard hosting infrastructure. The system integrates Azure AI Document Intelligence for reliable OCR processing with manual fallback, and implements simple Style matching with user validation. The architecture emphasizes reliability and maintainability over real-time features or complex orchestration.

### Platform and Infrastructure Choice

**Platform:** Next.js + Standard PostgreSQL + Standard Web Hosting
**Key Services:** Next.js hosting, PostgreSQL database, Azure AI Document Intelligence
**Deployment Host:** Standard cloud hosting (AWS/GCP/Azure) with managed PostgreSQL

### Repository Structure

**Structure:** Simple Monorepo
**Package Organization:** Single Next.js app with shared utilities and types

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Access"
        U[Users] --> W[Web App]
    end
    
    subgraph "Application Layer"
        W --> NX[Next.js App]
        NX --> API[API Routes]
        NX --> UI[React Components]
    end
    
    subgraph "Data Layer"
        API --> PG[PostgreSQL Database]
        API --> FS[File Storage]
    end
    
    subgraph "External Services"
        API --> AZ[Azure AI Document Intelligence]
    end
```

### Architectural Patterns

- **Standard Web App Architecture:** Server-side rendering with API routes for backend logic
- **Component-Based UI:** Simple React components with TypeScript for type safety
- **Append-Only Ledger Pattern:** Immutable financial transaction records for audit integrity
- **Single OCR Provider:** Azure AI with manual fallback for reliability over complexity
- **Manual Refresh Pattern:** On-demand data updates instead of real-time complexity

## Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.x | Type-safe development | Prevents runtime errors, manageable complexity |
| Frontend Framework | Next.js | 14.x | Full-stack React framework | Proven technology, integrated backend |
| UI Component Library | Tailwind CSS + Headless UI | Latest | Simple, accessible components | Lightweight, no vendor lock-in |
| State Management | React Query | Latest | Server state management | Simple server state caching |
| Backend Language | TypeScript | 5.x | Unified language stack | Single language for simplicity |
| Backend Framework | Next.js API Routes | 14.x | API endpoints | Integrated with frontend |
| API Style | REST | N/A | Simple HTTP endpoints | Universal compatibility, easy to debug |
| Database | PostgreSQL | 15+ | Relational database | Proven, reliable, no vendor lock-in |
| File Storage | Local/Cloud Storage | Latest | PDF document storage | Simple file handling |
| Authentication | NextAuth.js | Latest | Session management | Simple, integrated auth |
| Testing | Vitest + Playwright | Latest | Unit and E2E testing | Fast testing with good Next.js support |
| Build Tool | Next.js Build | 14.x | Integrated build system | Standard Next.js tooling |
| Deployment | Standard Hosting | Latest | Web application hosting | Simple, cost-effective |
| OCR Service | Azure AI Document Intelligence | Latest | PDF text extraction | Reliable OCR with reasonable pricing |
| Monitoring | Standard Logging | Latest | Basic error tracking | Simple monitoring without complexity |

## Data Models

### Style
**Purpose:** Central entity representing a product style with associated item details.

**Key Attributes:**
- style_number: string (Primary Key) - Unique identifier for the style
- item_number: string - Specific item code within the style
- item_desc: string - Description of the item
- season: string - Product season
- business_line: string - Product category
- created_at: timestamp - Record creation time

#### TypeScript Interface
```typescript
interface Style {
  style_number: string;
  item_number: string;
  item_desc: string;
  season: string;
  business_line: string;
  created_at: string;
  updated_at: string;
}
```

### MDFContract
**Purpose:** Marketing Development Fund contracts with basic allocation tracking.

**Key Attributes:**
- mdf_id: number (Primary Key) - Unique contract identifier
- style_number: string (Foreign Key) - References Style.style_number
- scope: 'Channel' | 'AllStyle' - Contract scope type
- customer: string - Customer/retailer name
- total_committed_amount: number - Total contract value
- contract_date: Date - Contract effective date

#### TypeScript Interface
```typescript
interface MDFContract {
  mdf_id: number;
  style_number: string;
  scope: 'Channel' | 'AllStyle';
  customer?: string;
  total_committed_amount: number;
  contract_date: Date;
  created_at: string;
  updated_at: string;
}
```

### Allocation
**Purpose:** Budget allocations from MDF contracts distributed across sales channels.

**Key Attributes:**
- allocation_id: number (Primary Key) - Unique allocation identifier
- mdf_id: number (Foreign Key) - References MDFContract.mdf_id
- channel_code: 'Inline' | 'Ecomm' - Sales channel designation
- allocated_amount: number - Budget amount allocated

#### TypeScript Interface
```typescript
interface Allocation {
  allocation_id: number;
  mdf_id: number;
  channel_code: 'Inline' | 'Ecomm';
  allocated_amount: number;
  created_at: string;
  updated_at: string;
}
```

### LedgerEntry
**Purpose:** Simple append-only transaction ledger for financial tracking.

**Key Attributes:**
- entry_id: number (Primary Key) - Unique transaction identifier
- allocation_id: number (Foreign Key) - Budget allocation being affected
- entry_date: Date - Transaction date
- amount: number - Transaction amount (negative = spend, positive = credit)
- description: string - Transaction description
- created_by: string - User who created the entry

#### TypeScript Interface
```typescript
interface LedgerEntry {
  entry_id: number;
  allocation_id: number;
  entry_date: Date;
  amount: number;
  description: string;
  created_by: string;
  created_at: string;
}
```

### DocumentUpload
**Purpose:** Track PDF document processing state and OCR results.

#### TypeScript Interface
```typescript
interface DocumentUpload {
  document_id: number;
  filename: string;
  file_size: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_confidence?: number;
  extraction_results?: any;
  file_path: string;
  uploaded_by: string;
  created_at: string;
  processed_at?: string;
}
```

### ContractDraft
**Purpose:** Save work-in-progress contract data for resume functionality.

#### TypeScript Interface
```typescript
interface ContractDraft {
  draft_id: number;
  user_id: string;
  document_id?: number;
  form_data: any;
  style_suggestions?: any;
  validation_errors?: any;
  last_saved: string;
  created_at: string;
}
```

### ProcessingAudit
**Purpose:** Comprehensive audit trail for all user actions and system processing.

#### TypeScript Interface
```typescript
interface ProcessingAudit {
  audit_id: number;
  document_id?: number;
  contract_id?: number;
  draft_id?: number;
  action_type: 'upload' | 'extract' | 'style_match' | 'validate' | 'submit' | 'save_draft' | 'resume_draft';
  user_id: string;
  action_data?: any;
  confidence_scores?: any;
  user_decisions?: any;
  timestamp: string;
}
```

### User
**Purpose:** User management and role-based access control.

#### TypeScript Interface
```typescript
interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: 'operations' | 'finance' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}
```

## API Specification

Simple REST API design with clear endpoints and standard HTTP methods.

### REST API Endpoints

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

### API Response Format

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

## Components

### DocumentProcessor
**Responsibility:** PDF upload and OCR processing using Azure AI with manual fallback.

**Key Interfaces:**
- uploadDocument(file) -> DocumentResult
- extractData(documentId) -> ExtractionResult
- validateExtraction(data) -> ValidationResult

**Technology Stack:** Next.js API routes, Azure AI SDK, file system storage

### StyleMatcher
**Responsibility:** Simple AI-powered matching of item data against style database.

**Key Interfaces:**
- findMatches(itemData) -> MatchResult[]
- validateMatch(styleNumber, itemData) -> ValidationResult

**Technology Stack:** PostgreSQL queries, simple fuzzy matching algorithms

### LedgerManager
**Responsibility:** Basic financial transaction management with append-only integrity.

**Key Interfaces:**
- addEntry(transaction) -> LedgerResult
- calculateBalance(allocationId) -> BalanceResult
- getHistory(filters) -> LedgerEntry[]

**Technology Stack:** PostgreSQL with constraints, TypeScript validation

### AllocationManager
**Responsibility:** Simple MDF budget allocation management across channels.

**Key Interfaces:**
- createAllocation(mdfId, channelData) -> AllocationResult
- getBalance(allocationId) -> BalanceData
- updateAllocation(allocationId, changes) -> UpdateResult

**Technology Stack:** PostgreSQL queries, simple calculation logic

## External APIs

### Azure AI Document Intelligence API
- **Purpose:** Primary OCR service for extracting structured data from MDF contract PDFs
- **Documentation:** https://docs.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/
- **Base URL(s):** https://{region}.api.cognitive.microsoft.com/formrecognizer/v3.0
- **Authentication:** API Key in request headers
- **Rate Limits:** 15 requests/second for S0 tier

**Key Endpoints Used:**
- `POST /documentModels/{modelId}:analyze` - Analyze document with prebuilt model
- `GET /documentModels/{modelId}/analyzeResults/{resultId}` - Get analysis results

**Integration Notes:** Single OCR provider for simplicity. Manual fallback for low-confidence extractions. Cost controls through monthly API limits.

## Core Workflows

Simple workflow patterns focusing on reliability and user control over automation complexity.

### Document Processing Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Web Interface
    participant API as API Routes
    participant AZ as Azure AI
    participant DB as Database

    Note over U,DB: Simple Document Processing Flow
    U->>UI: Upload PDF contract
    UI->>API: POST /api/documents/upload
    API->>DB: Store document metadata
    API->>AZ: Submit for OCR analysis
    
    alt OCR Success
        AZ-->>API: Return extracted data
        API-->>UI: Show extraction results
        UI->>U: Display for user validation
    else OCR Failure
        AZ-->>API: Return error/low confidence
        API-->>UI: Show manual entry form
        UI->>U: Request manual data entry
    end
    
    U->>UI: Validate/correct data
    UI->>API: POST /api/contracts
    API->>DB: Create MDF contract
    API-->>UI: Success confirmation
```

### Style Matching Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Web Interface
    participant API as API Routes
    participant DB as Database

    Note over U,DB: Simple Style Matching Flow
    U->>UI: Submit item data for matching
    UI->>API: POST /api/styles/match
    API->>DB: Query style database
    DB-->>API: Return potential matches
    API-->>UI: Return ranked matches with confidence
    
    alt High Confidence Match (>90%)
        UI->>U: Show pre-selected match for confirmation
    else Low Confidence Matches
        UI->>U: Show multiple options for selection
    else No Matches
        UI->>U: Show manual style search
    end
    
    U->>UI: Confirm or select style
    UI->>API: Continue with validated style
```

## Database Schema

Simple PostgreSQL schema focusing on core business entities with minimal complexity.

```sql
-- Core Types
CREATE TYPE channel AS ENUM ('Inline','Ecomm');
CREATE TYPE scope_type AS ENUM ('Channel','AllStyle');

-- Styles (Primary Product Entity)
CREATE TABLE styles (
  style_number   TEXT PRIMARY KEY,
  item_number    TEXT NOT NULL,
  item_desc      TEXT,
  season         TEXT,
  business_line  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MDF Contracts
CREATE TABLE mdf_contracts (
  mdf_id                 SERIAL PRIMARY KEY,
  style_number           TEXT NOT NULL REFERENCES styles(style_number),
  scope                  scope_type NOT NULL,
  customer               TEXT,
  total_committed_amount DECIMAL(14,2),
  contract_date          DATE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budget Allocations
CREATE TABLE allocations (
  allocation_id    SERIAL PRIMARY KEY,
  mdf_id           INTEGER NOT NULL REFERENCES mdf_contracts(mdf_id),
  channel_code     channel NOT NULL,
  allocated_amount DECIMAL(14,2) NOT NULL CHECK (allocated_amount >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mdf_id, channel_code)
);

-- Simple Ledger (Append-only)
CREATE TABLE ledger_entries (
  entry_id      SERIAL PRIMARY KEY,
  allocation_id INTEGER REFERENCES allocations(allocation_id),
  entry_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  amount        DECIMAL(14,2) NOT NULL CHECK (amount <> 0),
  description   TEXT,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Processing Tracking
CREATE TABLE document_uploads (
  document_id       SERIAL PRIMARY KEY,
  filename          TEXT NOT NULL,
  file_size         INTEGER NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_confidence    DECIMAL(3,2), -- Overall confidence score 0.00-1.00
  extraction_results JSONB,        -- Raw OCR extraction results
  file_path         TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at      TIMESTAMPTZ
);

-- Contract Drafts for Save/Resume Functionality
CREATE TABLE contract_drafts (
  draft_id          SERIAL PRIMARY KEY,
  user_id           TEXT NOT NULL,
  document_id       INTEGER REFERENCES document_uploads(document_id),
  form_data         JSONB NOT NULL,
  style_suggestions JSONB,          -- Cached style matching results
  validation_errors JSONB,          -- Form validation state
  last_saved        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)      -- One draft per user per document
);

-- Processing Audit Trail
CREATE TABLE processing_audit (
  audit_id       SERIAL PRIMARY KEY,
  document_id    INTEGER REFERENCES document_uploads(document_id),
  contract_id    INTEGER REFERENCES mdf_contracts(mdf_id),
  draft_id       INTEGER REFERENCES contract_drafts(draft_id),
  action_type    TEXT NOT NULL CHECK (action_type IN ('upload', 'extract', 'style_match', 'validate', 'submit', 'save_draft', 'resume_draft')),
  user_id        TEXT NOT NULL,
  action_data    JSONB,              -- Action-specific metadata
  confidence_scores JSONB,           -- AI confidence scores when applicable
  user_decisions JSONB,              -- User override/validation decisions
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table for authentication and audit
CREATE TABLE users (
  user_id        TEXT PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'operations' CHECK (role IN ('operations', 'finance', 'admin')),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login     TIMESTAMPTZ
);

-- Basic indexes for performance
CREATE INDEX idx_styles_item ON styles(item_number);
CREATE INDEX idx_mdf_style ON mdf_contracts(style_number);
CREATE INDEX idx_alloc_mdf ON allocations(mdf_id);
CREATE INDEX idx_ledger_alloc ON ledger_entries(allocation_id);
CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);
CREATE INDEX idx_docs_status ON document_uploads(processing_status);
CREATE INDEX idx_docs_user ON document_uploads(uploaded_by);
CREATE INDEX idx_drafts_user ON contract_drafts(user_id);
CREATE INDEX idx_audit_type ON processing_audit(action_type);
CREATE INDEX idx_audit_user ON processing_audit(user_id);
CREATE INDEX idx_users_role ON users(role);

-- Simple balance calculation view
CREATE VIEW allocation_balances AS
SELECT
  a.allocation_id,
  a.mdf_id,
  a.channel_code,
  a.allocated_amount,
  COALESCE(SUM(CASE WHEN l.amount < 0 THEN -l.amount ELSE 0 END), 0) AS total_spent,
  a.allocated_amount + COALESCE(SUM(l.amount), 0) AS remaining_balance
FROM allocations a
LEFT JOIN ledger_entries l ON l.allocation_id = a.allocation_id
GROUP BY a.allocation_id, a.mdf_id, a.channel_code, a.allocated_amount;
```

## Frontend Architecture

Simple React components with standard patterns, avoiding complex state management or real-time features.

### Component Organization
```
src/
├── app/                    # Next.js App Router
│   ├── contracts/         # Contract management pages
│   ├── dashboard/         # Style dashboard
│   ├── api/              # API route handlers
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utilities and database
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication
│   └── utils.ts         # Shared utilities
└── types/                # TypeScript definitions
```

### State Management
- **Server State:** React Query for API data caching
- **Client State:** React useState for simple UI state
- **Form State:** React Hook Form for form handling
- **No Real-time:** Manual refresh buttons instead of subscriptions

### Key Components

```typescript
// Contract upload component
export function ContractUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  
  const handleUpload = async (file: File) => {
    setExtracting(true);
    // Call OCR API and handle results
    const result = await extractDocument(file);
    // Show results for user validation
    setExtracting(false);
  };
  
  return (
    <div className="upload-zone">
      <input type="file" accept=".pdf" onChange={handleFileSelect} />
      {extracting && <div>Processing document...</div>}
    </div>
  );
}

// Simple balance display component
export function AllocationBalance({ allocationId }: { allocationId: number }) {
  const { data: balance, isLoading, refetch } = useQuery({
    queryKey: ['balance', allocationId],
    queryFn: () => fetchBalance(allocationId),
  });
  
  return (
    <div className="balance-card">
      <div>Allocated: ${balance?.allocated_amount}</div>
      <div>Remaining: ${balance?.remaining_balance}</div>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

## Backend Architecture

Simple Next.js API routes with direct database calls, avoiding complex abstractions or service layers.

### API Route Structure
```
src/app/api/
├── contracts/
│   ├── route.ts          # GET /api/contracts, POST /api/contracts
│   └── [id]/
│       └── route.ts      # GET /api/contracts/[id], PUT, DELETE
├── documents/
│   ├── upload/
│   │   └── route.ts      # POST /api/documents/upload
│   └── extract/
│       └── route.ts      # POST /api/documents/extract
├── styles/
│   ├── route.ts          # GET /api/styles
│   └── match/
│       └── route.ts      # POST /api/styles/match
└── ledger/
    └── route.ts          # GET /api/ledger, POST /api/ledger
```

### Simple Service Functions

```typescript
// lib/services/contract-service.ts
export async function createMDFContract(data: ContractData) {
  const client = await getDbClient();
  
  try {
    await client.query('BEGIN');
    
    // Insert contract
    const contractResult = await client.query(
      'INSERT INTO mdf_contracts (...) VALUES (...) RETURNING *',
      [data.style_number, data.scope, data.customer, data.amount, data.date]
    );
    
    // Create allocations based on scope
    if (data.scope === 'AllStyle') {
      await createBothChannelAllocations(contractResult.rows[0].mdf_id, data.amount);
    } else {
      await createSingleChannelAllocation(contractResult.rows[0].mdf_id, data);
    }
    
    await client.query('COMMIT');
    return contractResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Simple OCR integration
export async function extractDocumentData(buffer: Buffer) {
  try {
    const response = await fetch(`${azureEndpoint}/formrecognizer/documentModels/prebuilt-document:analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'Ocp-Apim-Subscription-Key': azureApiKey,
      },
      body: buffer,
    });
    
    if (!response.ok) {
      throw new Error('OCR processing failed');
    }
    
    const result = await response.json();
    return parseOCRResults(result);
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return { success: false, error: 'OCR processing failed' };
  }
}
```

## Project Structure

Simple monorepo structure without complex tooling or multiple packages.

```
mdf-contract-management/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── contracts/    # Contract pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── api/         # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/          # Basic UI components
│   │   ├── forms/       # Form components
│   │   └── layout/      # Layout components
│   ├── lib/             # Utilities and services
│   │   ├── db.ts        # Database connection
│   │   ├── auth.ts      # Authentication
│   │   ├── ocr.ts       # OCR integration
│   │   └── utils.ts     # Shared utilities
│   └── types/           # TypeScript definitions
│       ├── database.ts  # Database types
│       ├── api.ts       # API types
│       └── global.d.ts  # Global types
├── public/              # Static assets
├── migrations/          # Database migrations
├── tests/              # Test files
├── .env.example         # Environment template
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind configuration
├── package.json         # Dependencies
└── README.md           # Project documentation
```

## Development Workflow

Simple development setup without complex tooling or multiple services.

### Local Development Setup

#### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install PostgreSQL locally or use Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres

# Install dependencies
npm install
```

#### Initial Setup
```bash
# Copy environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

#### Development Commands
```bash
# Start all services
npm run dev

# Run tests
npm run test

# Run database migrations
npm run db:migrate

# Build for production
npm run build
```

### Environment Configuration

#### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mdf_system

# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Azure AI
AZURE_AI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_AI_KEY=your-api-key-here

# File Storage
UPLOAD_DIR=./uploads
```

## Deployment Architecture

Simple deployment using standard hosting with managed database.

### Deployment Strategy

**Frontend/Backend Deployment:**
- **Platform:** Standard cloud hosting (Vercel/Netlify/AWS)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment:** Production environment variables

**Database Deployment:**
- **Platform:** Managed PostgreSQL (AWS RDS/GCP SQL/Azure Database)
- **Migration Strategy:** Run migrations during deployment
- **Backup Strategy:** Automated daily backups

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Run database migrations
          npm run db:migrate
          # Deploy application
          npm run deploy
```

## Security and Performance

Basic security and performance considerations for MVP deployment.

### Security Requirements

**Authentication Security:**
- Session-based authentication with secure cookies
- Password hashing using bcrypt
- Basic rate limiting on auth endpoints

**Data Protection:**
- HTTPS enforcement in production
- SQL injection prevention through parameterized queries
- File upload validation and virus scanning

**Access Control:**
- Simple role-based access (Admin/User)
- Basic audit logging for financial transactions

### Performance Optimization

**Frontend Performance:**
- Next.js automatic optimization
- Image optimization for contract previews
- Basic caching for API responses

**Backend Performance:**
- Database connection pooling
- Query optimization for balance calculations
- Basic API response caching

**Database Performance:**
- Proper indexing on query columns
- Query optimization for reporting
- Regular maintenance tasks

## Testing Strategy

Simple testing approach focusing on critical functionality without complex test infrastructure.

### Testing Pyramid

```
E2E Tests (Playwright)
    /        \
Integration Tests (API)
    /            \
Unit Tests (Business Logic)
```

### Test Organization

#### Unit Tests
- Business logic functions
- Utility functions
- Data validation

#### Integration Tests
- API endpoints
- Database operations
- OCR integration

#### E2E Tests
- Complete contract processing workflow
- User authentication flow
- Critical user journeys

### Test Examples

```typescript
// Unit test example
describe('StyleMatcher', () => {
  test('should match exact item numbers', () => {
    const matcher = new StyleMatcher();
    const result = matcher.findMatches({ 
      itemNumber: 'TEST123',
      description: 'Test Item'
    });
    expect(result[0].confidence).toBeGreaterThan(0.9);
  });
});

// API test example
describe('/api/contracts', () => {
  test('should create new contract', async () => {
    const response = await request(app)
      .post('/api/contracts')
      .send({
        style_number: 'ST001',
        scope: 'Channel',
        total_committed_amount: 1000.00
      });
    expect(response.status).toBe(201);
    expect(response.body.data.mdf_id).toBeDefined();
  });
});

// E2E test example
test('complete contract processing flow', async ({ page }) => {
  await page.goto('/contracts/new');
  
  // Upload PDF
  await page.setInputFiles('#pdf-upload', 'test-contract.pdf');
  await page.click('button:text("Process Document")');
  
  // Validate extraction
  await page.waitForSelector('[data-testid="extraction-results"]');
  await page.click('button:text("Create Contract")');
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## MVP Success Metrics

### Primary Success Criteria
- **Processing Time:** Reduce from 3-5 days to 1-2 days (measured per contract)
- **OCR Accuracy:** >85% successful extraction rate requiring minimal manual correction
- **User Adoption:** 80% of contracts processed through new system within 4 weeks
- **Error Reduction:** 50% reduction in Style attribution errors compared to Excel process

### Technical Performance Targets
- **Page Load Time:** <3 seconds for dashboard and forms
- **OCR Processing:** <30 seconds per document
- **System Availability:** >99% uptime during business hours
- **Database Performance:** Balance calculations complete in <2 seconds

### User Experience Goals
- **Learning Curve:** New users productive within 2 hours of training
- **Error Recovery:** Clear error messages with actionable next steps
- **Workflow Efficiency:** 50% reduction in manual data entry per contract

This MVP architecture prioritizes proven reliability over complex features, enabling rapid delivery while maintaining upgrade paths for future enhancements based on actual user feedback and operational experience.