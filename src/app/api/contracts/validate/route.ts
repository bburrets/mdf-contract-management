import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { contractFormSchema, type ContractFormInput } from '@/types/contract';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json() as ContractFormInput;

    // Run Zod schema validation
    const schemaValidation = contractFormSchema.safeParse(formData);
    const schemaErrors: Record<string, string> = {};
    
    if (!schemaValidation.success) {
      schemaValidation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        schemaErrors[path] = err.message;
      });
    }

    // Run business rules validation
    const businessValidation = await validateBusinessRules(formData);

    // Combine all errors
    const allErrors = {
      ...schemaErrors,
      ...businessValidation.errors
    };

    const isValid = Object.keys(allErrors).length === 0;

    return NextResponse.json({
      success: true,
      valid: isValid,
      errors: allErrors,
      warnings: businessValidation.warnings || {},
      message: isValid ? 'Validation passed' : 'Validation failed'
    });

  } catch (error) {
    console.error('Validation error:', error);
    
    return NextResponse.json({
      success: false,
      valid: false,
      errors: { general: 'Validation service error' },
      warnings: {},
      message: 'Failed to validate form'
    }, { status: 500 });
  }
}

/**
 * Validate business rules and return errors and warnings
 */
async function validateBusinessRules(data: ContractFormInput) {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  try {
    // Check if style exists
    if (data.style_number) {
      const styleResult = await query(
        'SELECT style_number, item_desc, season FROM styles WHERE style_number = $1',
        [data.style_number]
      );

      if (styleResult.rows.length === 0) {
        errors.style_number = 'Style number does not exist. Please search and select a valid style.';
      }
    }

    // Validate allocation logic for Channel scope
    if (data.scope === 'Channel' && data.total_committed_amount > 0) {
      const totalAllocated = data.allocations.inline_amount + data.allocations.ecomm_amount;
      const tolerance = 0.01;

      if (Math.abs(totalAllocated - data.total_committed_amount) > tolerance) {
        errors.allocations = `Channel allocations ($${totalAllocated.toFixed(2)}) must equal total amount ($${data.total_committed_amount.toFixed(2)})`;
      }

      const totalPercentage = data.allocations.inline_percentage + data.allocations.ecomm_percentage;
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.allocations = `Channel percentages (${totalPercentage.toFixed(1)}%) must total 100%`;
      }

      if (totalAllocated === 0) {
        errors.allocations = 'Channel scope requires at least one channel to have a non-zero allocation';
      }

      // Warnings for unusual allocations
      if (data.allocations.inline_amount === 0 || data.allocations.ecomm_amount === 0) {
        warnings.allocations = 'One channel has zero allocation. Verify this is intentional.';
      }
    }

    // Date validation
    if (data.contract_date) {
      const contractDate = new Date(data.contract_date);
      const today = new Date();
      const diffDays = Math.ceil((contractDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays > 365) {
        warnings.contract_date = 'Contract date is more than a year in the future';
      } else if (diffDays < -30) {
        warnings.contract_date = 'Contract date is more than 30 days in the past';
      }
    }

    // Campaign date validation
    if (data.campaign_start_date && data.campaign_end_date) {
      const startDate = new Date(data.campaign_start_date);
      const endDate = new Date(data.campaign_end_date);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

      if (endDate < startDate) {
        errors.campaign_end_date = 'Campaign end date must be after start date';
      } else if (diffDays > 365) {
        warnings.campaign_end_date = 'Campaign duration exceeds one year';
      } else if (diffDays < 1) {
        warnings.campaign_end_date = 'Campaign duration is less than one day';
      }
    }

    // Amount validation
    if (data.total_committed_amount > 1000000) {
      warnings.total_committed_amount = 'Contract amount exceeds $1,000,000. Please verify.';
    }

    // Customer validation
    if (data.customer && data.customer.length > 100) {
      warnings.customer = 'Customer name is unusually long';
    }

    return { errors, warnings };

  } catch (error) {
    console.error('Business rules validation error:', error);
    return {
      errors: { general: 'Failed to validate business rules' },
      warnings: {}
    };
  }
}