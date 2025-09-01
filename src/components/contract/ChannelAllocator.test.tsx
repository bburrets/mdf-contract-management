import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChannelAllocator from './ChannelAllocator';
import type { ContractFormInput } from '@/types/contract';

describe('ChannelAllocator', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    totalAmount: 1000,
    allocations: {
      inline_percentage: 50,
      ecomm_percentage: 50,
      inline_amount: 500,
      ecomm_amount: 500
    } as ContractFormInput['allocations'],
    onChange: mockOnChange,
    error: undefined
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render both percentage and amount tabs', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      expect(screen.getByText('Percentage')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('should render Inline and Ecomm channel sections', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      expect(screen.getByText('Inline')).toBeInTheDocument();
      expect(screen.getByText('Ecomm')).toBeInTheDocument();
    });

    it('should display current percentage values', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      const inlinePercentageInput = screen.getByLabelText('Inline Percentage');
      const ecommPercentageInput = screen.getByLabelText('Ecomm Percentage');
      
      expect(inlinePercentageInput).toHaveValue(50);
      expect(ecommPercentageInput).toHaveValue(50);
    });

    it('should display current amount values in amount tab', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('Amount'));
      
      const inlineAmountInput = screen.getByLabelText('Inline Amount');
      const ecommAmountInput = screen.getByLabelText('Ecomm Amount');
      
      expect(inlineAmountInput).toHaveValue(500);
      expect(ecommAmountInput).toHaveValue(500);
    });

    it('should display total percentage', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      expect(screen.getByText('Total: 100%')).toBeInTheDocument();
    });

    it('should display progress bars', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2); // One for each channel
    });
  });

  describe('Percentage Mode', () => {
    it('should update inline percentage when changed', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      const inlineInput = screen.getByLabelText('Inline Percentage');
      await user.clear(inlineInput);
      await user.type(inlineInput, '60');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 60,
        ecomm_percentage: 40, // Auto-calculated
        inline_amount: 600,   // Auto-calculated based on total
        ecomm_amount: 400     // Auto-calculated based on total
      }));
    });

    it('should update ecomm percentage when changed', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      const ecommInput = screen.getByLabelText('Ecomm Percentage');
      await user.clear(ecommInput);
      await user.type(ecommInput, '70');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 30, // Auto-calculated
        ecomm_percentage: 70,
        inline_amount: 300,    // Auto-calculated based on total
        ecomm_amount: 700      // Auto-calculated based on total
      }));
    });

    it('should show error when percentages dont equal 100', () => {
      const propsWithError = {
        ...defaultProps,
        value: {
          inline_percentage: 60,
          ecomm_percentage: 50, // Total = 110%
          inline_amount: 600,
          ecomm_amount: 500
        },
        errors: {
          allocations: 'Channel percentages (110.0%) must total 100%'
        }
      };
      
      render(<ChannelAllocator {...propsWithError} />);
      
      expect(screen.getByText('Channel percentages (110.0%) must total 100%')).toBeInTheDocument();
      expect(screen.getByText('Total: 110%')).toHaveClass('text-red-600');
    });

    it('should show success styling when percentages equal 100', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      expect(screen.getByText('Total: 100%')).toHaveClass('text-green-600');
    });

    it('should handle percentage input with decimals', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      const inlineInput = screen.getByLabelText('Inline Percentage');
      await user.clear(inlineInput);
      await user.type(inlineInput, '33.33');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 33.33,
        ecomm_percentage: 66.67,
        inline_amount: 333.3,
        ecomm_amount: 666.7
      }));
    });
  });

  describe('Amount Mode', () => {
    it('should switch to amount mode when amount tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('Amount'));
      
      expect(screen.getByLabelText('Inline Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Ecomm Amount')).toBeInTheDocument();
    });

    it('should update inline amount when changed', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('Amount'));
      
      const inlineInput = screen.getByLabelText('Inline Amount');
      await user.clear(inlineInput);
      await user.type(inlineInput, '600');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 60,  // Auto-calculated
        ecomm_percentage: 40,   // Auto-calculated
        inline_amount: 600,
        ecomm_amount: 400       // Auto-calculated
      }));
    });

    it('should update ecomm amount when changed', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('Amount'));
      
      const ecommInput = screen.getByLabelText('Ecomm Amount');
      await user.clear(ecommInput);
      await user.type(ecommInput, '700');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 30,  // Auto-calculated
        ecomm_percentage: 70,   // Auto-calculated
        inline_amount: 300,     // Auto-calculated
        ecomm_amount: 700
      }));
    });

    it('should show error when amounts dont equal total', async () => {
      const user = userEvent.setup();
      const propsWithError = {
        ...defaultProps,
        value: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 600,
          ecomm_amount: 500  // Total = 1100, not 1000
        },
        errors: {
          allocations: 'Channel allocations ($1,100.00) must equal total amount ($1,000.00)'
        }
      };
      
      render(<ChannelAllocator {...propsWithError} />);
      
      await user.click(screen.getByText('Amount'));
      
      expect(screen.getByText('Channel allocations ($1,100.00) must equal total amount ($1,000.00)')).toBeInTheDocument();
    });

    it('should handle decimal amounts', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('Amount'));
      
      const inlineInput = screen.getByLabelText('Inline Amount');
      await user.clear(inlineInput);
      await user.type(inlineInput, '333.33');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 33.333,
        ecomm_percentage: 66.667,
        inline_amount: 333.33,
        ecomm_amount: 666.67
      }));
    });

    it('should show total amount in amount mode', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('Amount'));
      
      expect(screen.getByText('Total: $1,000.00')).toBeInTheDocument();
    });
  });

  describe('Quick Presets', () => {
    it('should render preset buttons', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      expect(screen.getByText('50/50')).toBeInTheDocument();
      expect(screen.getByText('60/40')).toBeInTheDocument();
      expect(screen.getByText('70/30')).toBeInTheDocument();
      expect(screen.getByText('80/20')).toBeInTheDocument();
      expect(screen.getByText('100/0')).toBeInTheDocument();
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('should apply 60/40 preset when clicked', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('60/40'));
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 60,
        ecomm_percentage: 40,
        inline_amount: 600,
        ecomm_amount: 400
      }));
    });

    it('should apply 100/0 preset when clicked', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('100/0'));
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 100,
        ecomm_percentage: 0,
        inline_amount: 1000,
        ecomm_amount: 0
      }));
    });

    it('should apply 0/100 preset when clicked', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      await user.click(screen.getByText('0/100'));
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 0,
        ecomm_percentage: 100,
        inline_amount: 0,
        ecomm_amount: 1000
      }));
    });

    it('should highlight active preset', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      const fiftyFiftyButton = screen.getByText('50/50');
      expect(fiftyFiftyButton).toHaveClass('bg-blue-100', 'border-blue-300');
    });

    it('should highlight different preset when allocation changes', () => {
      const propsWithSixtyForty = {
        ...defaultProps,
        value: {
          inline_percentage: 60,
          ecomm_percentage: 40,
          inline_amount: 600,
          ecomm_amount: 400
        }
      };
      
      render(<ChannelAllocator {...propsWithSixtyForty} />);
      
      const sixtyFortyButton = screen.getByText('60/40');
      expect(sixtyFortyButton).toHaveClass('bg-blue-100', 'border-blue-300');
      
      const fiftyFiftyButton = screen.getByText('50/50');
      expect(fiftyFiftyButton).not.toHaveClass('bg-blue-100', 'border-blue-300');
    });
  });

  describe('Progress Bars', () => {
    it('should show correct progress bar widths', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      const inlineBar = progressBars[0];
      const ecommBar = progressBars[1];
      
      expect(inlineBar).toHaveStyle('width: 50%');
      expect(ecommBar).toHaveStyle('width: 50%');
    });

    it('should update progress bars when allocation changes', () => {
      const propsWithDifferentAllocation = {
        ...defaultProps,
        value: {
          inline_percentage: 70,
          ecomm_percentage: 30,
          inline_amount: 700,
          ecomm_amount: 300
        }
      };
      
      render(<ChannelAllocator {...propsWithDifferentAllocation} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      const inlineBar = progressBars[0];
      const ecommBar = progressBars[1];
      
      expect(inlineBar).toHaveStyle('width: 70%');
      expect(ecommBar).toHaveStyle('width: 30%');
    });

    it('should show different colors for different channels', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      const inlineBar = progressBars[0];
      const ecommBar = progressBars[1];
      
      expect(inlineBar).toHaveClass('bg-blue-500');
      expect(ecommBar).toHaveClass('bg-green-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total amount', () => {
      const propsWithZeroTotal = {
        ...defaultProps,
        totalAmount: 0,
        value: {
          inline_percentage: 0,
          ecomm_percentage: 0,
          inline_amount: 0,
          ecomm_amount: 0
        }
      };
      
      render(<ChannelAllocator {...propsWithZeroTotal} />);
      
      expect(screen.getByText('Total: 0%')).toBeInTheDocument();
    });

    it('should handle invalid percentage inputs', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      const inlineInput = screen.getByLabelText('Inline Percentage');
      await user.clear(inlineInput);
      await user.type(inlineInput, 'invalid');
      
      // Should not call onChange with invalid data
      expect(mockOnChange).not.toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: NaN
      }));
    });

    it('should handle negative percentages', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      const inlineInput = screen.getByLabelText('Inline Percentage');
      await user.clear(inlineInput);
      await user.type(inlineInput, '-10');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 0, // Should be clamped to 0
        ecomm_percentage: 100,
        inline_amount: 0,
        ecomm_amount: 1000
      }));
    });

    it('should handle percentages over 100', async () => {
      const user = userEvent.setup();
      render(<ChannelAllocator {...defaultProps} />);
      
      const inlineInput = screen.getByLabelText('Inline Percentage');
      await user.clear(inlineInput);
      await user.type(inlineInput, '150');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        inline_percentage: 100, // Should be clamped to 100
        ecomm_percentage: 0,
        inline_amount: 1000,
        ecomm_amount: 0
      }));
    });

    it('should handle very large amounts', () => {
      const propsWithLargeAmount = {
        ...defaultProps,
        totalAmount: 9999999.99,
        value: {
          inline_percentage: 50,
          ecomm_percentage: 50,
          inline_amount: 4999999.995,
          ecomm_amount: 4999999.995
        }
      };
      
      render(<ChannelAllocator {...propsWithLargeAmount} />);
      
      expect(screen.getByText('Total: $9,999,999.99')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      expect(screen.getByLabelText('Inline Percentage')).toBeInTheDocument();
      expect(screen.getByLabelText('Ecomm Percentage')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for progress bars', () => {
      render(<ChannelAllocator {...defaultProps} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should associate error messages with inputs', () => {
      const propsWithError = {
        ...defaultProps,
        errors: {
          allocations: 'Channel percentages must total 100%'
        }
      };
      
      render(<ChannelAllocator {...propsWithError} />);
      
      const inlineInput = screen.getByLabelText('Inline Percentage');
      const errorId = inlineInput.getAttribute('aria-describedby');
      
      expect(errorId).toBeTruthy();
      expect(screen.getByText('Channel percentages must total 100%')).toHaveAttribute('id', errorId);
    });
  });
});