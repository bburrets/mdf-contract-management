import { NextRequest, NextResponse } from 'next/server';
import { getAuditTrail } from '@/lib/audit';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const contractId = searchParams.get('contract_id');
    const userId = searchParams.get('user_id');
    const actionType = searchParams.get('action_type');

    // Validate parameters
    if (limit > 200) {
      return NextResponse.json({
        success: false,
        message: 'Limit cannot exceed 200'
      }, { status: 400 });
    }

    const { entries, total } = await getAuditTrail({
      contractId: contractId ? parseInt(contractId, 10) : undefined,
      userId: userId || undefined,
      actionType: actionType || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      audit_entries: entries,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Audit trail error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to load audit trail',
      audit_entries: [],
      total: 0
    }, { status: 500 });
  }
}