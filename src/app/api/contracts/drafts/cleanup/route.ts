import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({
      success: false,
      message: 'User ID is required'
    }, { status: 400 });
  }

  try {
    // Keep only the most recent draft for the user, delete the rest
    const result = await query(`
      WITH keep_draft AS (
        SELECT draft_id 
        FROM contract_drafts 
        WHERE user_id = $1 
        ORDER BY last_saved DESC 
        LIMIT 1
      )
      DELETE FROM contract_drafts 
      WHERE user_id = $1 
        AND draft_id NOT IN (SELECT draft_id FROM keep_draft)
      RETURNING draft_id
    `, [userId]);

    const deletedCount = result.rows.length;

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old draft${deletedCount !== 1 ? 's' : ''}`,
      deleted_count: deletedCount
    });

  } catch (error) {
    console.error('Draft cleanup error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to cleanup drafts'
    }, { status: 500 });
  }
}