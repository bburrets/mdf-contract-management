import { z } from 'zod';

// Common validation schemas for reuse across components

// Currency validation
export const currencySchema = z.number()
  .positive('Amount must be greater than 0')
  .min(0.01, 'Minimum amount is $0.01')
  .max(999999999.99, 'Maximum amount is $999,999,999.99');

// Date validation
export const dateStringSchema = z.string()
  .min(1, 'Date is required')
  .refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  );

// Optional date validation
export const optionalDateSchema = z.string()
  .optional()
  .refine(
    (date) => !date || !isNaN(Date.parse(date)),
    'Invalid date format'
  );

// Style number validation
export const styleNumberSchema = z.string()
  .min(1, 'Style number is required')
  .max(50, 'Style number must be 50 characters or less')
  .regex(/^[A-Z0-9\-_]+$/i, 'Style number can only contain letters, numbers, hyphens, and underscores');

// Percentage validation
export const percentageSchema = z.number()
  .min(0, 'Percentage must be 0 or greater')
  .max(100, 'Percentage cannot exceed 100');

// Customer name validation
export const customerNameSchema = z.string()
  .max(200, 'Customer name must be 200 characters or less')
  .optional();

// Field validation error messages
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_CURRENCY: 'Please enter a valid amount',
  INVALID_PERCENTAGE: 'Please enter a percentage between 0 and 100',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  ALLOCATION_TOTAL_MISMATCH: 'Channel allocations must equal total amount',
  PERCENTAGE_TOTAL_MISMATCH: 'Percentages must total 100%',
  END_DATE_BEFORE_START: 'End date must be after start date'
};

// Contract-specific validation schemas
export const contractScopeSchema = z.enum(['Channel', 'AllStyle'], {
  errorMap: () => ({ message: 'Scope must be either "Channel" or "AllStyle"' })
});

export const channelCodeSchema = z.enum(['Inline', 'Ecomm'], {
  errorMap: () => ({ message: 'Channel must be either "Inline" or "Ecomm"' })
});

export const allocationAmountSchema = z.number()
  .min(0, 'Allocation amount must be non-negative')
  .max(999999999.99, 'Maximum allocation amount is $999,999,999.99');

// Allocation validation schema
export const allocationSchema = z.object({
  inline_amount: allocationAmountSchema,
  ecomm_amount: allocationAmountSchema
}).refine(
  (data) => data.inline_amount > 0 || data.ecomm_amount > 0,
  { message: 'At least one channel must have a non-zero allocation' }
);

// Contract update validation schema
export const contractUpdateSchema = z.object({
  customer: customerNameSchema,
  total_committed_amount: currencySchema.optional(),
  campaign_start_date: optionalDateSchema,
  campaign_end_date: optionalDateSchema
}).refine(
  (data) => {
    if (data.campaign_start_date && data.campaign_end_date) {
      const startDate = new Date(data.campaign_start_date);
      const endDate = new Date(data.campaign_end_date);
      return endDate >= startDate;
    }
    return true;
  },
  {
    message: 'Campaign end date must be after or equal to start date',
    path: ['campaign_end_date']
  }
);

// Audit log validation schema
export const auditActionTypeSchema = z.enum([
  'upload', 'extract', 'style_match', 'validate', 'submit',
  'save_draft', 'resume_draft', 'contract_create', 'contract_update',
  'contract_delete', 'allocation_create', 'allocation_update', 'contract_view'
]);

// API query parameters validation
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0)
});

export const contractFilterSchema = z.object({
  style: z.string().max(100).optional(),
  customer: z.string().max(200).optional(),
  season: z.string().max(50).optional(),
  business_line: z.string().max(50).optional(),
  user_id: z.string().max(255).optional()
});

// Form field types for consistent typing
export interface FormFieldError {
  message: string;
  type: 'validation' | 'server' | 'network';
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, FormFieldError>;
  warnings?: Record<string, string>;
}

// Contract validation utilities
export const validateAllocationTotal = (
  totalAmount: number,
  inlineAmount: number,
  ecommAmount: number,
  tolerance = 0.01
): boolean => {
  const allocatedTotal = inlineAmount + ecommAmount;
  return Math.abs(allocatedTotal - totalAmount) <= tolerance;
};

export const validateDateRange = (startDate?: string, endDate?: string): boolean => {
  if (!startDate || !endDate) return true;
  return new Date(endDate) >= new Date(startDate);
};