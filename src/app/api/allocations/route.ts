import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { auditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const contractId = searchParams.get('contract_id');
    const channelCode = searchParams.get('channel_code');

    let whereConditions: string[] = [];
    let queryParams: any[] = [limit, offset];
    let paramIndex = 3;

    // Add filtering conditions
    if (contractId) {
      whereConditions.push(`a.mdf_id = $${paramIndex}`);
      queryParams.push(parseInt(contractId, 10));
      paramIndex++;
    }

    if (channelCode && ['Inline', 'Ecomm'].includes(channelCode)) {
      whereConditions.push(`a.channel_code = $${paramIndex}`);
      queryParams.push(channelCode);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get allocations with balance information using the allocation_balances view
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

    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM allocations a
      ${whereClause.replace(/ab\./g, 'a.')}
    `, queryParams.slice(2)); // Remove limit and offset from count query

    return NextResponse.json({
      success: true,
      allocations: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
      limit,
      offset
    });

  } catch (error) {
    console.error('Allocations list error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to load allocations',
      allocations: [],
      total: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const userId = session.user.email;
    const { mdf_id, channel_code, allocated_amount } = await request.json();

    // Validate input
    if (!mdf_id || !channel_code || allocated_amount === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: mdf_id, channel_code, allocated_amount'
      }, { status: 400 });
    }

    if (!['Inline', 'Ecomm'].includes(channel_code)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid channel_code. Must be "Inline" or "Ecomm"'
      }, { status: 400 });
    }

    if (allocated_amount < 0) {
      return NextResponse.json({
        success: false,
        message: 'Allocated amount must be non-negative'
      }, { status: 400 });
    }

    // Verify contract exists
    const contractResult = await query(
      'SELECT mdf_id, total_committed_amount FROM mdf_contracts WHERE mdf_id = $1',
      [mdf_id]
    );

    if (contractResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Contract not found'
      }, { status: 404 });
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
      `, [mdf_id, channel_code, allocated_amount]);

      const allocation = allocationResult.rows[0];

      // Log allocation creation for audit trail
      await auditLog({
        contract_id: mdf_id,
        action_type: 'allocation_create',
        user_id: userId,
        action_data: {
          allocation_id: allocation.allocation_id,
          channel_code,
          allocated_amount,
          created_at: allocation.created_at
        }
      });

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        allocation,
        message: 'Allocation created successfully'
      });

    } catch (dbError) {
      await query('ROLLBACK');
      
      // Handle unique constraint violation
      if (dbError instanceof Error && dbError.message.includes('unique')) {
        return NextResponse.json({
          success: false,
          message: `Allocation for channel ${channel_code} already exists for this contract`
        }, { status: 409 });
      }
      
      throw dbError;
    }

  } catch (error) {
    console.error('Allocation creation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create allocation'
    }, { status: 500 });
  }
}