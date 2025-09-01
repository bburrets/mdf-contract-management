import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { getServerSession } from 'next-auth';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const contractId = parseInt(params.id, 10);
    
    if (isNaN(contractId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid contract ID'
      }, { status: 400 });
    }

    // Get session for audit logging
    const session = await getServerSession();
    const userId = session?.user?.email || 'anonymous';

    // Get contract details with allocations and style information
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

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Contract not found'
      }, { status: 404 });
    }

    const contract = result.rows[0];

    // Log contract access for audit trail
    await auditLog({
      contract_id: contractId,
      action_type: 'contract_view',
      user_id: userId,
      action_data: {
        contract_id: contractId,
        accessed_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('Contract details error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to load contract details'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const contractId = parseInt(params.id, 10);
    
    if (isNaN(contractId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid contract ID'
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
    const updateData = await request.json();

    // Get current contract for audit log
    const currentResult = await query(
      'SELECT * FROM mdf_contracts WHERE mdf_id = $1',
      [contractId]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Contract not found'
      }, { status: 404 });
    }

    const currentContract = currentResult.rows[0];

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

      return NextResponse.json({
        success: true,
        contract: updatedContract,
        message: 'Contract updated successfully'
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Contract update error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update contract'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const contractId = parseInt(params.id, 10);
    
    if (isNaN(contractId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid contract ID'
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

    // Get contract for audit log
    const contractResult = await query(
      'SELECT * FROM mdf_contracts WHERE mdf_id = $1',
      [contractId]
    );

    if (contractResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Contract not found'
      }, { status: 404 });
    }

    const contract = contractResult.rows[0];

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

      return NextResponse.json({
        success: true,
        message: 'Contract deleted successfully'
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Contract deletion error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete contract'
    }, { status: 500 });
  }
}