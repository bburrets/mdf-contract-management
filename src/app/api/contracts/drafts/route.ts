import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { type ContractDraft, type DraftSaveResponse } from '@/types/contract';

export async function POST(request: NextRequest) {
  try {
    const { user_id, draft_id, form_data } = await request.json();

    if (!user_id || !form_data) {
      return NextResponse.json({
        success: false,
        message: 'User ID and form data are required',
        draft_id: 0,
        last_saved: ''
      } satisfies DraftSaveResponse, { status: 400 });
    }

    let result;
    let message;

    if (draft_id) {
      // Update existing draft
      result = await query(`
        UPDATE contract_drafts 
        SET form_data = $1, last_saved = NOW()
        WHERE draft_id = $2 AND user_id = $3
        RETURNING draft_id, last_saved
      `, [JSON.stringify(form_data), draft_id, user_id]);

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Draft not found or access denied',
          draft_id: 0,
          last_saved: ''
        } satisfies DraftSaveResponse, { status: 404 });
      }

      message = 'Draft updated successfully';
    } else {
      // Create new draft (replace any existing draft for this user)
      await query(`
        DELETE FROM contract_drafts WHERE user_id = $1
      `, [user_id]);

      result = await query(`
        INSERT INTO contract_drafts (user_id, form_data, last_saved, created_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING draft_id, last_saved
      `, [user_id, JSON.stringify(form_data)]);

      message = 'Draft saved successfully';
    }

    const savedDraft = result.rows[0];

    return NextResponse.json({
      success: true,
      message,
      draft_id: savedDraft.draft_id,
      last_saved: savedDraft.last_saved
    } satisfies DraftSaveResponse);

  } catch (error) {
    console.error('Draft save error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to save draft',
      draft_id: 0,
      last_saved: ''
    } satisfies DraftSaveResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({
      success: false,
      message: 'User ID is required',
      draft: null
    }, { status: 400 });
  }

  try {
    // Get the most recent draft for the user
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
      WHERE user_id = $1
      ORDER BY last_saved DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No draft found',
        draft: null
      });
    }

    const draftRow = result.rows[0];
    const draft: ContractDraft = {
      draft_id: draftRow.draft_id,
      user_id: draftRow.user_id,
      document_id: draftRow.document_id,
      form_data: draftRow.form_data,
      style_suggestions: draftRow.style_suggestions,
      validation_errors: draftRow.validation_errors,
      last_saved: draftRow.last_saved,
      created_at: draftRow.created_at
    };

    return NextResponse.json({
      success: true,
      message: 'Draft loaded successfully',
      draft
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