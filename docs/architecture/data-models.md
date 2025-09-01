# Data Models

## Style
**Purpose:** Central entity representing a product style with associated item details.

**Key Attributes:**
- style_number: string (Primary Key) - Unique identifier for the style
- item_number: string - Specific item code within the style
- item_desc: string - Description of the item
- season: string - Product season
- business_line: string - Product category
- created_at: timestamp - Record creation time

### TypeScript Interface
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

## MDFContract
**Purpose:** Marketing Development Fund contracts with basic allocation tracking.

**Key Attributes:**
- mdf_id: number (Primary Key) - Unique contract identifier
- style_number: string (Foreign Key) - References Style.style_number
- scope: 'Channel' | 'AllStyle' - Contract scope type
- customer: string - Customer/retailer name
- total_committed_amount: number - Total contract value
- contract_date: Date - Contract effective date

### TypeScript Interface
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

## Allocation
**Purpose:** Budget allocations from MDF contracts distributed across sales channels.

**Key Attributes:**
- allocation_id: number (Primary Key) - Unique allocation identifier
- mdf_id: number (Foreign Key) - References MDFContract.mdf_id
- channel_code: 'Inline' | 'Ecomm' - Sales channel designation
- allocated_amount: number - Budget amount allocated

### TypeScript Interface
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

## LedgerEntry
**Purpose:** Simple append-only transaction ledger for financial tracking.

**Key Attributes:**
- entry_id: number (Primary Key) - Unique transaction identifier
- allocation_id: number (Foreign Key) - Budget allocation being affected
- entry_date: Date - Transaction date
- amount: number - Transaction amount (negative = spend, positive = credit)
- description: string - Transaction description
- created_by: string - User who created the entry

### TypeScript Interface
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

## DocumentUpload
**Purpose:** Track PDF document processing state and OCR results.

### TypeScript Interface
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

## ContractDraft
**Purpose:** Save work-in-progress contract data for resume functionality.

### TypeScript Interface
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

## ProcessingAudit
**Purpose:** Comprehensive audit trail for all user actions and system processing.

### TypeScript Interface
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

## User
**Purpose:** User management and role-based access control.

### TypeScript Interface
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
