import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { contractFormSchema, type ContractCreateResponse, type ContractFormInput } from '@/types/contract';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json() as ContractFormInput & { created_by: string };

    // Validate the form data using Zod schema
    const validationResult = contractFormSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      
      validationResult.error.issues.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors
      } satisfies ContractCreateResponse, { status: 400 });
    }

    const data = validationResult.data;

    // Additional business logic validation
    const businessValidation = await validateBusinessRules(data);
    if (!businessValidation.valid) {
      return NextResponse.json({
        success: false,
        message: businessValidation.message,
        errors: businessValidation.errors
      } satisfies ContractCreateResponse, { status: 400 });
    }

    // Start database transaction
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
        data.style_number,
        data.scope,
        data.customer || null,
        data.total_committed_amount,
        data.contract_date,
        data.campaign_start_date || null,
        data.campaign_end_date || null,
        formData.created_by
      ]);

      const contractId = contractResult.rows[0].mdf_id;

      // Insert allocations if scope is 'Channel'
      if (data.scope === 'Channel') {
        // Insert Inline allocation if amount > 0
        if (data.allocations.inline_amount > 0) {
          await query(`
            INSERT INTO allocations (
              mdf_id,
              channel_code,
              allocated_amount,
              created_at,
              updated_at
            ) VALUES ($1, 'Inline', $2, NOW(), NOW())
          `, [contractId, data.allocations.inline_amount]);
        }

        // Insert Ecomm allocation if amount > 0
        if (data.allocations.ecomm_amount > 0) {
          await query(`
            INSERT INTO allocations (
              mdf_id,
              channel_code,
              allocated_amount,
              created_at,
              updated_at
            ) VALUES ($1, 'Ecomm', $2, NOW(), NOW())
          `, [contractId, data.allocations.ecomm_amount]);
        }
      }

      // Commit transaction
      await query('COMMIT');

      return NextResponse.json({
        success: true,
        contract_id: contractId,
        message: 'Contract created successfully'
      } satisfies ContractCreateResponse);

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Contract creation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create contract',
      errors: { general: 'An unexpected error occurred' }
    } satisfies ContractCreateResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const userId = searchParams.get('user_id');

  try {
    let whereClause = '';
    let queryParams: any[] = [limit, offset];
    
    if (userId) {
      whereClause = 'WHERE c.created_by = $3';
      queryParams.push(userId);
    }

    // Get contracts with their allocations
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
                'allocated_amount', a.allocated_amount
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

    return NextResponse.json({
      success: true,
      contracts: result.rows,
      total: result.rows.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Contract list error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to load contracts',
      contracts: [],
      total: 0,
      limit,
      offset
    }, { status: 500 });
  }
}

/**
 * Validate business rules for contract creation
 */
async function validateBusinessRules(data: ContractFormInput) {
  const errors: Record<string, string> = {};

  try {
    // Validate style exists
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
      message: Object.keys(errors).length > 0 ? 'Validation failed' : '',
      errors
    };

  } catch (error) {
    console.error('Business validation error:', error);
    return {
      valid: false,
      message: 'Failed to validate contract data',
      errors: { general: 'Validation error occurred' }
    };
  }
}