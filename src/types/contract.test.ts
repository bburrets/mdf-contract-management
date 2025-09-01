import { describe, it, expect } from 'vitest';
import { contractFormSchema } from './contract';

describe('contractFormSchema', () => {
  describe('style_number validation', () => {
    it('should accept valid style numbers', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty style number', () => {
      const invalidData = {
        style_number: '',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const styleError = result.error.issues.find(issue => 
          issue.path.includes('style_number') && issue.message === 'Style number is required'
        );
        expect(styleError).toBeDefined();
      }
    });

    it('should accept style number with whitespace (no auto-trimming)', () => {
      const dataWithWhitespace = {
        style_number: '  STY123  ',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.style_number).toBe('  STY123  '); // No trimming in schema
      }
    });
  });

  describe('scope validation', () => {
    it('should accept Channel scope', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept AllStyle scope with allocations', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'AllStyle' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid scope', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Invalid' as any,
        total_committed_amount: 1000,
        contract_date: '2024-01-01'
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('total_committed_amount validation', () => {
    it('should accept positive amounts', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000.50,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500.25,
          ecomm_amount: 500.25
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 0,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 0,
          ecomm_amount: 0
        }
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const amountError = result.error.issues.find(issue => 
          issue.path.includes('total_committed_amount') && issue.message === 'Total amount must be greater than 0'
        );
        expect(amountError).toBeDefined();
      }
    });

    it('should reject negative amounts', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: -100,
        contract_date: '2024-01-01'
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject amounts exceeding maximum', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000000000, // 1 billion
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500000000,
          ecomm_amount: 500000000
        }
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const maxError = result.error.issues.find(issue => 
          issue.path.includes('total_committed_amount') && issue.message === 'Maximum amount is $999,999,999.99'
        );
        expect(maxError).toBeDefined();
      }
    });
  });

  describe('date validation', () => {
    it('should accept valid contract date', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: 'invalid-date'
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid campaign dates', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        campaign_start_date: '2024-02-01',
        campaign_end_date: '2024-03-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('channel allocation validation', () => {
    it('should accept valid Channel scope with allocations', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 60,
          ecomm_percentage: 40,
          inline_amount: 600,
          ecomm_amount: 400
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject Channel scope without allocations', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01'
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept AllStyle scope (allocations are always required)', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'AllStyle' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate percentage totals equal 100', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 70,
          ecomm_percentage: 40, // Total = 110%
          inline_amount: 700,
          ecomm_amount: 400
        }
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate amount totals equal total_committed_amount', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 600, // Total = 1100 (doesn't match 1000)
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields validation', () => {
    it('should accept valid customer name', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        customer: 'ACME Corp',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept customer name with whitespace (no auto-trimming)', () => {
      const dataWithWhitespace = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        customer: '  ACME Corp  ',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer).toBe('  ACME Corp  '); // No trimming in schema
      }
    });

    it('should accept undefined customer', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('cross-field validation', () => {
    it('should validate campaign end date is after start date', () => {
      const invalidData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        campaign_start_date: '2024-03-01',
        campaign_end_date: '2024-02-01', // Before start date
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow same start and end date', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 1000,
        contract_date: '2024-01-01',
        campaign_start_date: '2024-02-01',
        campaign_end_date: '2024-02-01', // Same as start date
        allocations: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 500,
          ecomm_amount: 500
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very small amounts with proper precision', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 0.01,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 100,
          ecomm_percentage: 0,
          inline_amount: 0.01,
          ecomm_amount: 0
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle floating point precision in allocation validation', () => {
      const validData = {
        style_number: 'STY123',
        scope: 'Channel' as const,
        total_committed_amount: 100.33,
        contract_date: '2024-01-01',
        allocations: {
          inline_percentage: 33.33,
          ecomm_percentage: 66.67,
          inline_amount: 33.44,
          ecomm_amount: 66.89
        }
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});