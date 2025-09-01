import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Context {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const draftId = parseInt(params.id, 10);

  if (isNaN(draftId)) {
    return NextResponse.json({
      success: false,
      message: 'Invalid draft ID'
    }, { status: 400 });
  }

  try {
    const result = await query(`
      DELETE FROM contract_drafts 
      WHERE draft_id = $1
      RETURNING draft_id
    `, [draftId]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Draft not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Draft delete error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete draft'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: Context) {
  const draftId = parseInt(params.id, 10);

  if (isNaN(draftId)) {
    return NextResponse.json({
      success: false,
      message: 'Invalid draft ID',
      draft: null
    }, { status: 400 });
  }

  try {
    const result = await query(`
      SELECT 
        draft_id,
        user_id,
        document_id,
        form_data,
        style_suggestions,
        validation_errors,
        last_saved,
        created_at
      FROM contract_drafts 
      WHERE draft_id = $1
    `, [draftId]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Draft not found',
        draft: null
      }, { status: 404 });
    }

    const draftRow = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Draft loaded successfully',
      draft: {
        draft_id: draftRow.draft_id,
        user_id: draftRow.user_id,
        document_id: draftRow.document_id,
        form_data: draftRow.form_data,
        style_suggestions: draftRow.style_suggestions,
        validation_errors: draftRow.validation_errors,
        last_saved: draftRow.last_saved,
        created_at: draftRow.created_at
      }
    });

  } catch (error) {
    console.error('Draft load error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to load draft',
      draft: null
    }, { status: 500 });
  }
}