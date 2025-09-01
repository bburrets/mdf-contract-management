import { z } from 'zod';

// Contract form data structure
export interface ContractFormData {
  style_number: string;
  scope: 'Channel' | 'AllStyle';
  customer?: string;
  total_committed_amount: number;
  contract_date: string;
  campaign_start_date?: string;
  campaign_end_date?: string;
  allocations: {
    inline_amount: number;
    ecomm_amount: number;
    inline_percentage?: number;
    ecomm_percentage?: number;
  };
}

// Contract draft data structure
export interface ContractDraft {
  draft_id: number;
  user_id: string;
  document_id?: number;
  form_data: ContractFormData;
  style_suggestions?: StyleSuggestion[];
  validation_errors?: Record<string, string>;
  last_saved: string;
  created_at: string;
}

// Style data structure for search results
export interface Style {
  style_number: string;
  item_number: string;
  item_desc: string;
  season: string;
  business_line: string;
  created_at: string;
  updated_at: string;
}

// Style suggestion for autocomplete
export interface StyleSuggestion {
  style: Style;
  confidence?: number;
  match_reason?: string;
}

// Validation schema for contract form
export const contractFormSchema = z.object({
  style_number: z.string()
    .min(1, 'Style number is required')
    .max(50, 'Style number must be 50 characters or less'),
  
  scope: z.enum(['Channel', 'AllStyle'], {
    required_error: 'Funding type is required'
  }),
  
  customer: z.string()
    .max(200, 'Customer name must be 200 characters or less')
    .optional(),
  
  total_committed_amount: z.number()
    .positive('Total amount must be greater than 0')
    .min(0.01, 'Minimum amount is $0.01')
    .max(999999999.99, 'Maximum amount is $999,999,999.99'),
  
  contract_date: z.string()
    .min(1, 'Contract date is required'),
  
  campaign_start_date: z.string().optional(),
  
  campaign_end_date: z.string().optional(),
  
  // Channel allocation validation
  allocations: z.object({
    inline_amount: z.number()
      .min(0, 'Inline amount must be 0 or greater'),
    
    ecomm_amount: z.number()
      .min(0, 'Ecomm amount must be 0 or greater'),
    
    inline_percentage: z.number()
      .min(0, 'Inline percentage must be 0 or greater')
      .max(100, 'Inline percentage cannot exceed 100')
      .optional(),
    
    ecomm_percentage: z.number()
      .min(0, 'Ecomm percentage must be 0 or greater')
      .max(100, 'Ecomm percentage cannot exceed 100')
      .optional()
  })
}).refine(
  (data) => {
    // Campaign date validation: end date must be after start date
    if (data.campaign_start_date && data.campaign_end_date) {
      const startDate = new Date(data.campaign_start_date);
      const endDate = new Date(data.campaign_end_date);
      return endDate >= startDate;
    }
    return true;
  },
  {
    message: 'Campaign end date must be after start date',
    path: ['campaign_end_date']
  }
).refine(
  (data) => {
    // Channel allocation validation: amounts must equal total
    const totalAllocated = data.allocations.inline_amount + data.allocations.ecomm_amount;
    const tolerance = 0.01; // Allow for floating point precision issues
    return Math.abs(totalAllocated - data.total_committed_amount) < tolerance;
  },
  {
    message: 'Channel allocation amounts must equal total committed amount',
    path: ['allocations']
  }
).refine(
  (data) => {
    // Percentage allocation validation: must equal 100% if both percentages provided
    const inlinePerc = data.allocations.inline_percentage || 0;
    const ecommPerc = data.allocations.ecomm_percentage || 0;
    
    if (data.allocations.inline_percentage !== undefined && data.allocations.ecomm_percentage !== undefined) {
      const totalPerc = inlinePerc + ecommPerc;
      return Math.abs(totalPerc - 100) < 0.01;
    }
    return true;
  },
  {
    message: 'Channel allocation percentages must total 100%',
    path: ['allocations']
  }
);

// Type for form validation
export type ContractFormInput = z.infer<typeof contractFormSchema>;

// API response types
export interface ContractCreateResponse {
  success: boolean;
  contract_id?: number;
  message: string;
  errors?: Record<string, string>;
}

export interface DraftSaveResponse {
  success: boolean;
  draft_id: number;
  message: string;
  last_saved: string;
}

export interface StyleSearchResponse {
  success: boolean;
  styles: StyleSuggestion[];
  total: number;
  query: string;
}