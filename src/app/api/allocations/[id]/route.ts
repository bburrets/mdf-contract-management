import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { getServerSession } from 'next-auth';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const allocationId = parseInt(params.id, 10);
    
    if (isNaN(allocationId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid allocation ID'
      }, { status: 400 });
    }

    // Get allocation details with balance information
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

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Allocation not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      allocation: result.rows[0]
    });

  } catch (error) {
    console.error('Allocation details error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to load allocation details'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const allocationId = parseInt(params.id, 10);
    
    if (isNaN(allocationId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid allocation ID'
      }, { status: 400 });
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const userId = session.user.email;
    const { allocated_amount } = await request.json();

    if (allocated_amount === undefined || allocated_amount < 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid allocated_amount. Must be non-negative number'
      }, { status: 400 });
    }

    // Get current allocation for audit log
    const currentResult = await query(
      'SELECT * FROM allocations WHERE allocation_id = $1',
      [allocationId]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Allocation not found'
      }, { status: 404 });
    }

    const currentAllocation = currentResult.rows[0];

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
      `, [allocated_amount, allocationId]);

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

      return NextResponse.json({
        success: true,
        allocation: updatedAllocation,
        message: 'Allocation updated successfully'
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Allocation update error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update allocation'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const allocationId = parseInt(params.id, 10);
    
    if (isNaN(allocationId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid allocation ID'
      }, { status: 400 });
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const userId = session.user.email;

    // Get allocation for audit log
    const allocationResult = await query(
      'SELECT * FROM allocations WHERE allocation_id = $1',
      [allocationId]
    );

    if (allocationResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Allocation not found'
      }, { status: 404 });
    }

    const allocation = allocationResult.rows[0];

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

      return NextResponse.json({
        success: true,
        message: 'Allocation deleted successfully'
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Allocation deletion error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete allocation'
    }, { status: 500 });
  }
}