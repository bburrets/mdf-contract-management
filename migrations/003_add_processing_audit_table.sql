-- Add processing audit table for contract storage audit trail
-- Story 1.4: Basic Contract Storage

-- Create processing audit table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS processing_audit (
  audit_id       SERIAL PRIMARY KEY,
  document_id    INTEGER,
  contract_id    INTEGER REFERENCES mdf_contracts(mdf_id) ON DELETE CASCADE,
  draft_id       INTEGER REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
  action_type    TEXT NOT NULL CHECK (action_type IN (
    'upload', 'extract', 'style_match', 'validate', 'submit', 
    'save_draft', 'resume_draft', 'contract_create', 'contract_update', 
    'contract_delete', 'allocation_create', 'allocation_update', 'contract_view'
  )),
  user_id        TEXT NOT NULL,
  action_data    JSONB,
  confidence_scores JSONB,
  user_decisions JSONB,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create performance indexes for audit table
CREATE INDEX IF NOT EXISTS idx_audit_type ON processing_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_user ON processing_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_contract ON processing_audit(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON processing_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_draft ON processing_audit(draft_id);

-- Add table and column comments for documentation
COMMENT ON TABLE processing_audit IS 'Comprehensive audit trail for all contract processing actions';
COMMENT ON COLUMN processing_audit.action_type IS 'Type of action performed (upload, extract, style_match, validate, submit, save_draft, resume_draft, contract_create, contract_update, contract_delete, allocation_create, allocation_update, contract_view)';
COMMENT ON COLUMN processing_audit.user_id IS 'ID of user who performed the action';
COMMENT ON COLUMN processing_audit.action_data IS 'JSON data containing before/after state and changed fields';
COMMENT ON COLUMN processing_audit.confidence_scores IS 'JSON data containing AI confidence scores for automated actions';
COMMENT ON COLUMN processing_audit.user_decisions IS 'JSON data containing user overrides and validation decisions';

-- Create database view for allocation balance calculations
CREATE OR REPLACE VIEW allocation_balances AS
SELECT 
  a.allocation_id,
  a.mdf_id,
  a.channel_code,
  a.allocated_amount,
  COALESCE(SUM(le.amount), 0) AS spent_amount,
  (a.allocated_amount - COALESCE(SUM(le.amount), 0)) AS remaining_balance,
  a.created_at,
  a.updated_at
FROM allocations a
LEFT JOIN ledger_entries le ON le.allocation_id = a.allocation_id
GROUP BY a.allocation_id, a.mdf_id, a.channel_code, a.allocated_amount, a.created_at, a.updated_at;

COMMENT ON VIEW allocation_balances IS 'Calculated view showing allocation spending and remaining balances';