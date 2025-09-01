import { query } from './db';
import { auditLog } from './audit';
import { ContractFormInput } from '@/types/contract';

export interface ContractWithAllocations {
  mdf_id: number;
  style_number: string;
  scope: 'Channel' | 'AllStyle';
  customer?: string;
  total_committed_amount: number;
  contract_date: string;
  campaign_start_date?: string;
  campaign_end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  item_number: string;
  item_desc: string;
  season: string;
  business_line: string;
  allocations: Array<{
    allocation_id: number;
    channel_code: 'Inline' | 'Ecomm';
    allocated_amount: number;
    created_at: string;
    updated_at: string;
  }>;
}

export interface ContractListParams {
  limit?: number;
  offset?: number;
  userId?: string;
  style?: string;
  customer?: string;
  season?: string;
  business_line?: string;
}

/**
 * Retrieves a list of MDF contracts with optional filtering and pagination.
 * 
 * @param params - Query parameters for filtering and pagination
 * @param params.limit - Maximum number of contracts to return (default: 50)
 * @param params.offset - Number of contracts to skip for pagination (default: 0)
 * @param params.userId - Filter by contract creator user ID
 * @param params.style - Filter by style number or item description (partial match)
 * @param params.customer - Filter by customer name (partial match)
 * @param params.season - Filter by exact season match
 * @param params.business_line - Filter by exact business line match
 * @returns Promise resolving to object with contracts array and total count
 */
export async function getContracts(params: ContractListParams = {}) {
  const {
    limit = 50,
    offset = 0,
    userId,
    style,
    customer,
    season,
    business_line
  } = params;

  let whereConditions: string[] = [];
  let queryParams: any[] = [limit, offset];
  let paramIndex = 3;

  // Add filtering conditions
  if (userId) {
    whereConditions.push(`c.created_by = $${paramIndex}`);
    queryParams.push(userId);
    paramIndex++;
  }

  if (style) {
    whereConditions.push(`(c.style_number ILIKE $${paramIndex} OR s.item_desc ILIKE $${paramIndex})`);
    queryParams.push(`%${style}%`);
    paramIndex++;
  }

  if (customer) {
    whereConditions.push(`c.customer ILIKE $${paramIndex}`);
    queryParams.push(`%${customer}%`);
    paramIndex++;
  }

  if (season) {
    whereConditions.push(`s.season = $${paramIndex}`);
    queryParams.push(season);
    paramIndex++;
  }

  if (business_line) {
    whereConditions.push(`s.business_line = $${paramIndex}`);
    queryParams.push(business_line);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await query(`
    SELECT 
      c.mdf_id,
      c.style_number,
      c.scope,
      c.customer,
      c.total_committed_amount,
      c.contract_date,
      c.campaign_start_date,
      c.campaign_end_date,
      c.created_by,
      c.created_at,
      c.updated_at,
      s.item_number,
      s.item_desc,
      s.season,
      s.business_line,
      COALESCE(
        JSON_AGG(
          CASE 
            WHEN a.allocation_id IS NOT NULL 
            THEN JSON_BUILD_OBJECT(
              'allocation_id', a.allocation_id,
              'channel_code', a.channel_code,
              'allocated_amount', a.allocated_amount,
              'created_at', a.created_at,
              'updated_at', a.updated_at
            )
          END
        ) FILTER (WHERE a.allocation_id IS NOT NULL), 
        '[]'::json
      ) as allocations
    FROM mdf_contracts c
    LEFT JOIN styles s ON c.style_number = s.style_number
    LEFT JOIN allocations a ON c.mdf_id = a.mdf_id
    ${whereClause}
    GROUP BY c.mdf_id, s.style_number
    ORDER BY c.created_at DESC
    LIMIT $1 OFFSET $2
  `, queryParams);

  // Get total count for pagination
  const countResult = await query(`
    SELECT COUNT(DISTINCT c.mdf_id) as total
    FROM mdf_contracts c
    LEFT JOIN styles s ON c.style_number = s.style_number
    ${whereClause}
  `, queryParams.slice(2)); // Remove limit and offset from count query

  return {
    contracts: result.rows as ContractWithAllocations[],
    total: parseInt(countResult.rows[0].total, 10)
  };
}

/**
 * Retrieves a single MDF contract by ID with all associated allocation details.
 * 
 * @param contractId - The unique ID of the contract to retrieve
 * @returns Promise resolving to contract with allocations or null if not found
 */
export async function getContractById(contractId: number): Promise<ContractWithAllocations | null> {
  const result = await query(`
    SELECT 
      c.mdf_id,
      c.style_number,
      c.scope,
      c.customer,
      c.total_committed_amount,
      c.contract_date,
      c.campaign_start_date,
      c.campaign_end_date,
      c.created_by,
      c.created_at,
      c.updated_at,
      s.item_number,
      s.item_desc,
      s.season,
      s.business_line,
      COALESCE(
        JSON_AGG(
          CASE 
            WHEN a.allocation_id IS NOT NULL 
            THEN JSON_BUILD_OBJECT(
              'allocation_id', a.allocation_id,
              'channel_code', a.channel_code,
              'allocated_amount', a.allocated_amount,
              'created_at', a.created_at,
              'updated_at', a.updated_at
            )
          END
        ) FILTER (WHERE a.allocation_id IS NOT NULL), 
        '[]'::json
      ) as allocations
    FROM mdf_contracts c
    LEFT JOIN styles s ON c.style_number = s.style_number
    LEFT JOIN allocations a ON c.mdf_id = a.mdf_id
    WHERE c.mdf_id = $1
    GROUP BY c.mdf_id, s.style_number
  `, [contractId]);

  return result.rows.length > 0 ? result.rows[0] as ContractWithAllocations : null;
}

/**
 * Creates a new MDF contract with associated channel allocations in a database transaction.
 * Automatically creates allocation records for Channel scope contracts and logs audit trail.
 * 
 * @param contractData - Contract data including form input and user information
 * @param contractData.created_by - User ID of the contract creator
 * @returns Promise resolving to object with success status and contract ID
 * @throws Error if contract creation fails or data validation fails
 */
export async function createContract(contractData: ContractFormInput & { created_by: string }) {
  // Start transaction
  await query('BEGIN');

  try {
    // Insert the contract
    const contractResult = await query(`
      INSERT INTO mdf_contracts (
        style_number,
        scope,
        customer,
        total_committed_amount,
        contract_date,
        campaign_start_date,
        campaign_end_date,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING mdf_id
    `, [
      contractData.style_number,
      contractData.scope,
      contractData.customer || null,
      contractData.total_committed_amount,
      contractData.contract_date,
      contractData.campaign_start_date || null,
      contractData.campaign_end_date || null,
      contractData.created_by
    ]);

    const contractId = contractResult.rows[0].mdf_id;

    // Insert allocations if scope is 'Channel'
    const allocationIds: number[] = [];
    if (contractData.scope === 'Channel') {
      if (contractData.allocations.inline_amount > 0) {
        const inlineResult = await query(`
          INSERT INTO allocations (
            mdf_id,
            channel_code,
            allocated_amount,
            created_at,
            updated_at
          ) VALUES ($1, 'Inline', $2, NOW(), NOW())
          RETURNING allocation_id
        `, [contractId, contractData.allocations.inline_amount]);
        
        allocationIds.push(inlineResult.rows[0].allocation_id);
      }

      if (contractData.allocations.ecomm_amount > 0) {
        const ecommResult = await query(`
          INSERT INTO allocations (
            mdf_id,
            channel_code,
            allocated_amount,
            created_at,
            updated_at
          ) VALUES ($1, 'Ecomm', $2, NOW(), NOW())
          RETURNING allocation_id
        `, [contractId, contractData.allocations.ecomm_amount]);
        
        allocationIds.push(ecommResult.rows[0].allocation_id);
      }
    }

    // Log contract creation for audit trail
    await auditLog({
      contract_id: contractId,
      action_type: 'contract_create',
      user_id: contractData.created_by,
      action_data: {
        contract_id: contractId,
        style_number: contractData.style_number,
        scope: contractData.scope,
        total_committed_amount: contractData.total_committed_amount,
        allocation_ids: allocationIds,
        created_at: new Date().toISOString()
      }
    });

    await query('COMMIT');

    return { success: true, contract_id: contractId };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Updates an existing MDF contract with new data in a database transaction.
 * Only updates fields provided in updateData, preserves existing values for omitted fields.
 * 
 * @param contractId - The unique ID of the contract to update
 * @param updateData - Partial contract data containing only fields to update
 * @param userId - User ID performing the update for audit trail
 * @returns Promise resolving to object with success status and updated contract
 * @throws Error if contract not found or update fails
 */
export async function updateContract(
  contractId: number, 
  updateData: Partial<ContractFormInput>, 
  userId: string
) {
  // Get current contract for audit log
  const currentContract = await getContractById(contractId);
  if (!currentContract) {
    throw new Error('Contract not found');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Update contract
    const updateResult = await query(`
      UPDATE mdf_contracts 
      SET 
        customer = COALESCE($1, customer),
        total_committed_amount = COALESCE($2, total_committed_amount),
        campaign_start_date = COALESCE($3, campaign_start_date),
        campaign_end_date = COALESCE($4, campaign_end_date),
        updated_at = NOW()
      WHERE mdf_id = $5
      RETURNING *
    `, [
      updateData.customer,
      updateData.total_committed_amount,
      updateData.campaign_start_date,
      updateData.campaign_end_date,
      contractId
    ]);

    const updatedContract = updateResult.rows[0];

    // Log update for audit trail
    await auditLog({
      contract_id: contractId,
      action_type: 'contract_update',
      user_id: userId,
      action_data: {
        before: currentContract,
        after: updatedContract,
        changes: Object.keys(updateData)
      }
    });

    await query('COMMIT');

    return { success: true, contract: updatedContract };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Deletes an MDF contract and all associated allocations in a database transaction.
 * Uses CASCADE delete to automatically remove related allocation records.
 * 
 * @param contractId - The unique ID of the contract to delete
 * @param userId - User ID performing the deletion for audit trail
 * @returns Promise resolving to object with success status
 * @throws Error if contract not found or deletion fails
 */
export async function deleteContract(contractId: number, userId: string) {
  const contract = await getContractById(contractId);
  if (!contract) {
    throw new Error('Contract not found');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Delete contract (cascades to allocations)
    await query('DELETE FROM mdf_contracts WHERE mdf_id = $1', [contractId]);

    // Log deletion for audit trail
    await auditLog({
      contract_id: contractId,
      action_type: 'contract_delete',
      user_id: userId,
      action_data: {
        deleted_contract: contract,
        deleted_at: new Date().toISOString()
      }
    });

    await query('COMMIT');

    return { success: true };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Validates contract form data before creation or update operations.
 * Checks style existence, allocation totals, and campaign date consistency.
 * 
 * @param data - Contract form input data to validate
 * @returns Promise resolving to validation result with errors object
 */
export async function validateContractData(data: ContractFormInput) {
  const errors: Record<string, string> = {};

  // Check if style exists
  const styleResult = await query(
    'SELECT style_number FROM styles WHERE style_number = $1',
    [data.style_number]
  );

  if (styleResult.rows.length === 0) {
    errors.style_number = 'Style number does not exist in the system';
  }

  // Validate allocation totals for Channel scope
  if (data.scope === 'Channel') {
    const totalAllocated = data.allocations.inline_amount + data.allocations.ecomm_amount;
    const tolerance = 0.01;

    if (Math.abs(totalAllocated - data.total_committed_amount) > tolerance) {
      errors.allocations = 'Channel allocation amounts must equal total committed amount';
    }

    if (totalAllocated === 0) {
      errors.allocations = 'At least one channel must have a non-zero allocation';
    }
  }

  // Validate campaign dates
  if (data.campaign_start_date && data.campaign_end_date) {
    const startDate = new Date(data.campaign_start_date);
    const endDate = new Date(data.campaign_end_date);
    
    if (endDate < startDate) {
      errors.campaign_end_date = 'Campaign end date must be after start date';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Exports contract data for external use, including all contract and allocation details.
 * Returns flattened data structure suitable for CSV export or reporting.
 * 
 * @param contractIds - Array of contract IDs to export
 * @returns Promise resolving to array of flattened contract records
 */
export async function exportContractData(contractIds: number[]) {
  if (contractIds.length === 0) {
    return [];
  }

  const placeholders = contractIds.map((_, index) => `$${index + 1}`).join(', ');
  
  const result = await query(`
    SELECT 
      c.mdf_id,
      c.style_number,
      c.scope,
      c.customer,
      c.total_committed_amount,
      c.contract_date,
      c.campaign_start_date,
      c.campaign_end_date,
      c.created_by,
      c.created_at,
      s.item_number,
      s.item_desc,
      s.season,
      s.business_line,
      a.channel_code,
      a.allocated_amount
    FROM mdf_contracts c
    LEFT JOIN styles s ON c.style_number = s.style_number
    LEFT JOIN allocations a ON c.mdf_id = a.mdf_id
    WHERE c.mdf_id IN (${placeholders})
    ORDER BY c.mdf_id, a.channel_code
  `, contractIds);

  return result.rows;
}