import { query } from './db';

export interface AuditLogEntry {
  document_id?: number;
  contract_id?: number;
  draft_id?: number;
  action_type: string;
  user_id: string;
  action_data?: any;
  confidence_scores?: any;
  user_decisions?: any;
}

/**
 * Logs an action to the processing audit trail table for compliance and debugging.
 * Gracefully handles errors without breaking the main operation flow.
 * 
 * @param entry - Audit entry containing action details
 * @param entry.document_id - Optional document ID associated with action
 * @param entry.contract_id - Optional contract ID associated with action
 * @param entry.draft_id - Optional draft ID associated with action
 * @param entry.action_type - Type of action performed (must match CHECK constraint)
 * @param entry.user_id - ID of user performing the action
 * @param entry.action_data - Optional JSON data containing action details
 * @param entry.confidence_scores - Optional JSON data with AI confidence scores
 * @param entry.user_decisions - Optional JSON data with user decision information
 * @returns Promise that resolves when audit entry is logged
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await query(`
      INSERT INTO processing_audit (
        document_id,
        contract_id,
        draft_id,
        action_type,
        user_id,
        action_data,
        confidence_scores,
        user_decisions,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      entry.document_id || null,
      entry.contract_id || null,
      entry.draft_id || null,
      entry.action_type,
      entry.user_id,
      entry.action_data ? JSON.stringify(entry.action_data) : null,
      entry.confidence_scores ? JSON.stringify(entry.confidence_scores) : null,
      entry.user_decisions ? JSON.stringify(entry.user_decisions) : null
    ]);
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw here - audit logging shouldn't break the main operation
  }
}

/**
 * Retrieves audit trail entries with optional filtering and pagination.
 * Supports filtering by contract, user, and action type.
 * 
 * @param params - Filter parameters for audit trail query
 * @param params.contractId - Optional contract ID to filter by
 * @param params.userId - Optional user ID to filter by
 * @param params.actionType - Optional action type to filter by
 * @param params.limit - Maximum number of entries to return (default: 50)
 * @param params.offset - Number of entries to skip for pagination (default: 0)
 * @returns Promise resolving to object with entries array and total count
 */
export async function getAuditTrail({
  contractId,
  userId,
  actionType,
  limit = 50,
  offset = 0
}: {
  contractId?: number;
  userId?: string;
  actionType?: string;
  limit?: number;
  offset?: number;
}) {
  let whereConditions: string[] = [];
  let queryParams: any[] = [limit, offset];
  let paramIndex = 3;

  if (contractId) {
    whereConditions.push(`contract_id = $${paramIndex}`);
    queryParams.push(contractId);
    paramIndex++;
  }

  if (userId) {
    whereConditions.push(`user_id = $${paramIndex}`);
    queryParams.push(userId);
    paramIndex++;
  }

  if (actionType) {
    whereConditions.push(`action_type = $${paramIndex}`);
    queryParams.push(actionType);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await query(`
    SELECT 
      audit_id,
      document_id,
      contract_id,
      draft_id,
      action_type,
      user_id,
      action_data,
      confidence_scores,
      user_decisions,
      timestamp
    FROM processing_audit
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT $1 OFFSET $2
  `, queryParams);

  // Get total count for pagination
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM processing_audit
    ${whereClause}
  `, queryParams.slice(2)); // Remove limit and offset from count query

  return {
    entries: result.rows,
    total: parseInt(countResult.rows[0].total, 10)
  };
}

/**
 * Retrieves audit trail entries for a specific contract with enhanced contract information.
 * Includes style number and customer information from contract details.
 * 
 * @param contractId - The contract ID to get audit trail for
 * @param limit - Maximum number of entries to return (default: 50)
 * @param offset - Number of entries to skip for pagination (default: 0)
 * @returns Promise resolving to object with entries array and total count
 */
export async function getContractAuditTrail(contractId: number, limit = 50, offset = 0) {
  const result = await query(`
    SELECT 
      pa.audit_id,
      pa.document_id,
      pa.contract_id,
      pa.draft_id,
      pa.action_type,
      pa.user_id,
      pa.action_data,
      pa.confidence_scores,
      pa.user_decisions,
      pa.timestamp,
      c.style_number,
      c.customer
    FROM processing_audit pa
    LEFT JOIN mdf_contracts c ON pa.contract_id = c.mdf_id
    WHERE pa.contract_id = $3
    ORDER BY pa.timestamp DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset, contractId]);

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM processing_audit
    WHERE contract_id = $1
  `, [contractId]);

  return {
    entries: result.rows,
    total: parseInt(countResult.rows[0].total, 10)
  };
}