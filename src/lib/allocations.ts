import { query } from './db';
import { auditLog } from './audit';

export interface AllocationWithBalance {
  allocation_id: number;
  mdf_id: number;
  channel_code: 'Inline' | 'Ecomm';
  allocated_amount: number;
  spent_amount: number;
  remaining_balance: number;
  created_at: string;
  updated_at: string;
  style_number: string;
  customer?: string;
  contract_date: string;
  item_desc: string;
  season: string;
  business_line: string;
}

export interface AllocationListParams {
  limit?: number;
  offset?: number;
  contractId?: number;
  channelCode?: 'Inline' | 'Ecomm';
}

/**
 * Retrieves allocations with calculated balance information using the allocation_balances view.
 * 
 * @param params - Query parameters for filtering and pagination
 * @param params.limit - Maximum number of allocations to return (default: 50)
 * @param params.offset - Number of allocations to skip for pagination (default: 0)
 * @param params.contractId - Filter by specific contract ID
 * @param params.channelCode - Filter by channel code (Inline or Ecomm)
 * @returns Promise resolving to object with allocations array and total count
 */
export async function getAllocations(params: AllocationListParams = {}) {
  const { limit = 50, offset = 0, contractId, channelCode } = params;

  let whereConditions: string[] = [];
  let queryParams: any[] = [limit, offset];
  let paramIndex = 3;

  if (contractId) {
    whereConditions.push(`ab.mdf_id = $${paramIndex}`);
    queryParams.push(contractId);
    paramIndex++;
  }

  if (channelCode && ['Inline', 'Ecomm'].includes(channelCode)) {
    whereConditions.push(`ab.channel_code = $${paramIndex}`);
    queryParams.push(channelCode);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await query(`
    SELECT 
      ab.allocation_id,
      ab.mdf_id,
      ab.channel_code,
      ab.allocated_amount,
      ab.spent_amount,
      ab.remaining_balance,
      ab.created_at,
      ab.updated_at,
      c.style_number,
      c.customer,
      c.contract_date,
      s.item_desc,
      s.season,
      s.business_line
    FROM allocation_balances ab
    JOIN mdf_contracts c ON ab.mdf_id = c.mdf_id
    LEFT JOIN styles s ON c.style_number = s.style_number
    ${whereClause}
    ORDER BY ab.created_at DESC
    LIMIT $1 OFFSET $2
  `, queryParams);

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM allocations a
    ${whereClause.replace(/ab\./g, 'a.')}
  `, queryParams.slice(2));

  return {
    allocations: result.rows as AllocationWithBalance[],
    total: parseInt(countResult.rows[0].total, 10)
  };
}

/**
 * Retrieves a single allocation by ID with balance information and contract details.
 * 
 * @param allocationId - The unique ID of the allocation to retrieve
 * @returns Promise resolving to allocation with balance info or null if not found
 */
export async function getAllocationById(allocationId: number): Promise<AllocationWithBalance | null> {
  const result = await query(`
    SELECT 
      ab.allocation_id,
      ab.mdf_id,
      ab.channel_code,
      ab.allocated_amount,
      ab.spent_amount,
      ab.remaining_balance,
      ab.created_at,
      ab.updated_at,
      c.style_number,
      c.customer,
      c.contract_date,
      c.total_committed_amount,
      s.item_desc,
      s.season,
      s.business_line
    FROM allocation_balances ab
    JOIN mdf_contracts c ON ab.mdf_id = c.mdf_id
    LEFT JOIN styles s ON c.style_number = s.style_number
    WHERE ab.allocation_id = $1
  `, [allocationId]);

  return result.rows.length > 0 ? result.rows[0] as AllocationWithBalance : null;
}

/**
 * Creates a new channel allocation for an existing MDF contract in a database transaction.
 * Verifies contract exists before creation and logs audit trail.
 * 
 * @param mdfId - The contract ID to create allocation for
 * @param channelCode - Channel code (Inline or Ecomm)
 * @param allocatedAmount - Amount to allocate to this channel
 * @param userId - User ID creating the allocation for audit trail
 * @returns Promise resolving to object with success status and allocation details
 * @throws Error if contract not found or allocation creation fails
 */
export async function createAllocation(
  mdfId: number,
  channelCode: 'Inline' | 'Ecomm',
  allocatedAmount: number,
  userId: string
) {
  // Verify contract exists
  const contractResult = await query(
    'SELECT mdf_id, total_committed_amount FROM mdf_contracts WHERE mdf_id = $1',
    [mdfId]
  );

  if (contractResult.rows.length === 0) {
    throw new Error('Contract not found');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Insert allocation
    const allocationResult = await query(`
      INSERT INTO allocations (
        mdf_id,
        channel_code,
        allocated_amount,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `, [mdfId, channelCode, allocatedAmount]);

    const allocation = allocationResult.rows[0];

    // Log allocation creation for audit trail
    await auditLog({
      contract_id: mdfId,
      action_type: 'allocation_create',
      user_id: userId,
      action_data: {
        allocation_id: allocation.allocation_id,
        channel_code: channelCode,
        allocated_amount: allocatedAmount,
        created_at: allocation.created_at
      }
    });

    await query('COMMIT');

    return { success: true, allocation };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Updates an existing allocation's allocated amount in a database transaction.
 * Preserves audit trail of changes made to allocation amounts.
 * 
 * @param allocationId - The unique ID of the allocation to update
 * @param allocatedAmount - New allocation amount
 * @param userId - User ID performing the update for audit trail
 * @returns Promise resolving to object with success status and updated allocation
 * @throws Error if allocation not found or update fails
 */
export async function updateAllocation(
  allocationId: number,
  allocatedAmount: number,
  userId: string
) {
  // Get current allocation for audit log
  const currentAllocation = await getAllocationById(allocationId);
  if (!currentAllocation) {
    throw new Error('Allocation not found');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Update allocation
    const updateResult = await query(`
      UPDATE allocations 
      SET 
        allocated_amount = $1,
        updated_at = NOW()
      WHERE allocation_id = $2
      RETURNING *
    `, [allocatedAmount, allocationId]);

    const updatedAllocation = updateResult.rows[0];

    // Log update for audit trail
    await auditLog({
      contract_id: updatedAllocation.mdf_id,
      action_type: 'allocation_update',
      user_id: userId,
      action_data: {
        allocation_id: allocationId,
        before: {
          allocated_amount: currentAllocation.allocated_amount
        },
        after: {
          allocated_amount: updatedAllocation.allocated_amount
        },
        changes: ['allocated_amount']
      }
    });

    await query('COMMIT');

    return { success: true, allocation: updatedAllocation };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Deletes an allocation and logs the action for audit trail in a database transaction.
 * 
 * @param allocationId - The unique ID of the allocation to delete
 * @param userId - User ID performing the deletion for audit trail
 * @returns Promise resolving to object with success status
 * @throws Error if allocation not found or deletion fails
 */
export async function deleteAllocation(allocationId: number, userId: string) {
  const allocation = await getAllocationById(allocationId);
  if (!allocation) {
    throw new Error('Allocation not found');
  }

  // Start transaction
  await query('BEGIN');

  try {
    // Delete allocation
    await query('DELETE FROM allocations WHERE allocation_id = $1', [allocationId]);

    // Log deletion for audit trail
    await auditLog({
      contract_id: allocation.mdf_id,
      action_type: 'allocation_delete',
      user_id: userId,
      action_data: {
        deleted_allocation: allocation,
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
 * Calculates utilization percentages for allocations, optionally filtered by contract.
 * Returns allocations ordered by utilization percentage (highest first).
 * 
 * @param contractId - Optional contract ID to filter utilization by specific contract
 * @returns Promise resolving to array of allocations with utilization percentages
 */
export async function getAllocationUtilization(contractId?: number) {
  let whereClause = '';
  let queryParams: any[] = [];

  if (contractId) {
    whereClause = 'WHERE ab.mdf_id = $1';
    queryParams.push(contractId);
  }

  const result = await query(`
    SELECT 
      ab.allocation_id,
      ab.mdf_id,
      ab.channel_code,
      ab.allocated_amount,
      ab.spent_amount,
      ab.remaining_balance,
      CASE 
        WHEN ab.allocated_amount > 0 
        THEN ROUND((ab.spent_amount / ab.allocated_amount * 100)::numeric, 2)
        ELSE 0
      END as utilization_percentage,
      c.style_number,
      c.customer,
      s.item_desc
    FROM allocation_balances ab
    JOIN mdf_contracts c ON ab.mdf_id = c.mdf_id
    LEFT JOIN styles s ON c.style_number = s.style_number
    ${whereClause}
    ORDER BY utilization_percentage DESC
  `, queryParams);

  return result.rows;
}

/**
 * Provides summary statistics for all allocations grouped by channel code.
 * Includes totals, counts, and average utilization percentages.
 * 
 * @returns Promise resolving to array of channel summary objects
 */
export async function getAllocationSummaryByChannel() {
  const result = await query(`
    SELECT 
      channel_code,
      COUNT(*) as allocation_count,
      SUM(allocated_amount) as total_allocated,
      SUM(spent_amount) as total_spent,
      SUM(remaining_balance) as total_remaining,
      ROUND(AVG(
        CASE 
          WHEN allocated_amount > 0 
          THEN (spent_amount / allocated_amount * 100)
          ELSE 0
        END
      )::numeric, 2) as avg_utilization_percentage
    FROM allocation_balances
    GROUP BY channel_code
    ORDER BY channel_code
  `);

  return result.rows;
}

/**
 * Identifies allocations that are approaching full utilization based on threshold.
 * Useful for early warning system to prevent overspending.
 * 
 * @param thresholdPercentage - Utilization percentage threshold (default: 90)
 * @returns Promise resolving to array of allocations above threshold
 */
export async function getAllocationsNearingLimit(thresholdPercentage = 90) {
  const result = await query(`
    SELECT 
      ab.allocation_id,
      ab.mdf_id,
      ab.channel_code,
      ab.allocated_amount,
      ab.spent_amount,
      ab.remaining_balance,
      ROUND((ab.spent_amount / ab.allocated_amount * 100)::numeric, 2) as utilization_percentage,
      c.style_number,
      c.customer,
      s.item_desc
    FROM allocation_balances ab
    JOIN mdf_contracts c ON ab.mdf_id = c.mdf_id
    LEFT JOIN styles s ON c.style_number = s.style_number
    WHERE ab.allocated_amount > 0 
      AND (ab.spent_amount / ab.allocated_amount * 100) >= $1
    ORDER BY utilization_percentage DESC
  `, [thresholdPercentage]);

  return result.rows;
}

/**
 * Validates that allocation amounts align with contract total committed amount.
 * Checks for over-allocation and under-allocation scenarios.
 * 
 * @param contractId - The contract ID to validate allocations for
 * @returns Promise resolving to validation result with allocation status
 * @throws Error if contract not found
 */
export async function validateAllocationAmounts(contractId: number) {
  const result = await query(`
    SELECT 
      c.mdf_id,
      c.total_committed_amount,
      COALESCE(SUM(a.allocated_amount), 0) as total_allocated,
      c.total_committed_amount - COALESCE(SUM(a.allocated_amount), 0) as remaining_to_allocate
    FROM mdf_contracts c
    LEFT JOIN allocations a ON c.mdf_id = a.mdf_id
    WHERE c.mdf_id = $1
    GROUP BY c.mdf_id, c.total_committed_amount
  `, [contractId]);

  if (result.rows.length === 0) {
    throw new Error('Contract not found');
  }

  const data = result.rows[0];
  const tolerance = 0.01;

  return {
    contract_id: data.mdf_id,
    total_committed_amount: parseFloat(data.total_committed_amount),
    total_allocated: parseFloat(data.total_allocated),
    remaining_to_allocate: parseFloat(data.remaining_to_allocate),
    is_fully_allocated: Math.abs(parseFloat(data.remaining_to_allocate)) <= tolerance,
    is_over_allocated: parseFloat(data.remaining_to_allocate) < -tolerance
  };
}