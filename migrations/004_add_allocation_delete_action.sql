-- Add missing allocation_delete action to processing_audit.action_type CHECK constraint
-- Story 1.5: Priority Issues Fixes - Task 1

-- Drop existing CHECK constraint
ALTER TABLE processing_audit DROP CONSTRAINT IF EXISTS processing_audit_action_type_check;

-- Add new CHECK constraint with allocation_delete included
ALTER TABLE processing_audit ADD CONSTRAINT processing_audit_action_type_check 
CHECK (action_type IN (
  'upload', 'extract', 'style_match', 'validate', 'submit', 
  'save_draft', 'resume_draft', 'contract_create', 'contract_update', 
  'contract_delete', 'allocation_create', 'allocation_update', 'allocation_delete', 'contract_view'
));

-- Update table comment to reflect the new action type
COMMENT ON COLUMN processing_audit.action_type IS 'Type of action performed (upload, extract, style_match, validate, submit, save_draft, resume_draft, contract_create, contract_update, contract_delete, allocation_create, allocation_update, allocation_delete, contract_view)';