// Audit trail related type definitions

export type AuditActionType = 
  | 'upload' 
  | 'extract' 
  | 'style_match' 
  | 'validate' 
  | 'submit'
  | 'save_draft' 
  | 'resume_draft' 
  | 'contract_create' 
  | 'contract_update'
  | 'contract_delete' 
  | 'allocation_create' 
  | 'allocation_update' 
  | 'contract_view'
  | 'allocation_delete';

export interface AuditEntry {
  audit_id: number;
  document_id?: number;
  contract_id?: number;
  draft_id?: number;
  action_type: AuditActionType;
  user_id: string;
  action_data?: any;
  confidence_scores?: any;
  user_decisions?: any;
  timestamp: string;
}

export interface AuditEntryWithDetails extends AuditEntry {
  style_number?: string;
  customer?: string;
}

// Specific audit data structures for different actions
export interface ContractCreateAuditData {
  contract_id: number;
  style_number: string;
  scope: 'Channel' | 'AllStyle';
  total_committed_amount: number;
  allocation_ids?: number[];
  created_at: string;
}

export interface ContractUpdateAuditData {
  before: any;
  after: any;
  changes: string[];
}

export interface ContractDeleteAuditData {
  deleted_contract: any;
  deleted_at: string;
}

export interface AllocationCreateAuditData {
  allocation_id: number;
  channel_code: 'Inline' | 'Ecomm';
  allocated_amount: number;
  created_at: string;
}

export interface AllocationUpdateAuditData {
  allocation_id: number;
  before: {
    allocated_amount: number;
  };
  after: {
    allocated_amount: number;
  };
  changes: string[];
}

export interface AllocationDeleteAuditData {
  deleted_allocation: any;
  deleted_at: string;
}

export interface ContractViewAuditData {
  contract_id: number;
  accessed_at: string;
}

// API request/response types for audit trail
export interface AuditListRequest {
  limit?: number;
  offset?: number;
  contract_id?: number;
  user_id?: string;
  action_type?: AuditActionType;
}

export interface AuditListResponse {
  success: boolean;
  audit_entries: AuditEntryWithDetails[];
  total: number;
  limit: number;
  offset: number;
}

// Audit action labels for display
export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  upload: 'Document Uploaded',
  extract: 'Data Extracted',
  style_match: 'Style Matched',
  validate: 'Data Validated',
  submit: 'Form Submitted',
  save_draft: 'Draft Saved',
  resume_draft: 'Draft Resumed',
  contract_create: 'Contract Created',
  contract_update: 'Contract Updated',
  contract_delete: 'Contract Deleted',
  allocation_create: 'Allocation Created',
  allocation_update: 'Allocation Updated',
  contract_view: 'Contract Viewed',
  allocation_delete: 'Allocation Deleted'
};

// Audit action colors for UI
export const AUDIT_ACTION_COLORS: Record<AuditActionType, string> = {
  upload: 'blue',
  extract: 'indigo',
  style_match: 'purple',
  validate: 'pink',
  submit: 'green',
  save_draft: 'yellow',
  resume_draft: 'orange',
  contract_create: 'green',
  contract_update: 'blue',
  contract_delete: 'red',
  allocation_create: 'emerald',
  allocation_update: 'cyan',
  contract_view: 'gray',
  allocation_delete: 'rose'
};

// Audit entry helper functions
export const isContractAction = (actionType: AuditActionType): boolean => {
  return [
    'contract_create',
    'contract_update', 
    'contract_delete',
    'contract_view'
  ].includes(actionType);
};

export const isAllocationAction = (actionType: AuditActionType): boolean => {
  return [
    'allocation_create',
    'allocation_update',
    'allocation_delete'
  ].includes(actionType);
};

export const isProcessingAction = (actionType: AuditActionType): boolean => {
  return [
    'upload',
    'extract',
    'style_match',
    'validate',
    'submit',
    'save_draft',
    'resume_draft'
  ].includes(actionType);
};