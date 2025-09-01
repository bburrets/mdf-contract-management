import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleSelector } from '@/components/contract/StyleSelector';
import { ChannelAllocator } from '@/components/contract/ChannelAllocator';
import ContractFormPage from '@/app/contracts/new/page';
import type { Style, ChannelAllocation } from '@/types/contract';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock session
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    },
    status: 'authenticated'
  })
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Style Search and Channel Allocation Interactions', () => {
  const mockStyles: Style[] = [
    {
      style_number: 'STY001',
      item_number: 'ITM001',
      item_desc: 'Premium Jacket',
      season: 'Spring 2024',
      business_line: 'Women'
    },
    {
      style_number: 'STY002',
      item_number: 'ITM002',
      item_desc: 'Classic Shirt',
      season: 'Summer 2024',
      business_line: 'Men'
    },
    {
      style_number: 'STY003',
      item_number: 'ITM003',
      item_desc: 'Kids Sneakers',
      season: 'Fall 2024',
      business_line: 'Kids'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/styles/search')) {
        const query = new URL(url).searchParams.get('q') || '';
        const filteredStyles = mockStyles.filter(style =>
          style.style_number.toLowerCase().includes(query.toLowerCase()) ||
          style.item_desc.toLowerCase().includes(query.toLowerCase()) ||
          style.item_number.toLowerCase().includes(query.toLowerCase())
        );
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            styles: filteredStyles,
            total: filteredStyles.length
          })
        });
      }
      
      if (url.includes('/api/contracts/drafts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            drafts: [],
            total: 0
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  describe('StyleSelector with ChannelAllocator Integration', () => {
    it('should update allocation amounts when total amount changes after style selection', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Select a style first
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'STY001');
      
      await waitFor(() => {
        expect(screen.getByText('STY001 - Premium Jacket')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('STY001 - Premium Jacket'));
      
      // Select Channel scope to enable allocations
      await user.click(screen.getByLabelText('Channel'));
      
      // Set a total amount
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '2000');
      
      // Check that allocation amounts are calculated correctly (default 50/50)
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(50);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(50);
      });
      
      // Switch to amount view to check calculated amounts
      await user.click(screen.getByText('Amount'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Amount')).toHaveValue(1000);
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(1000);
      });
    });

    it('should recalculate allocations when total amount is modified', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Setup initial state
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'STY002');
      await waitFor(() => screen.getByText('STY002 - Classic Shirt'));
      await user.click(screen.getByText('STY002 - Classic Shirt'));
      
      await user.click(screen.getByLabelText('Channel'));
      
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '1000');
      
      // Set a specific allocation (60/40)
      await user.click(screen.getByText('60/40'));
      
      // Verify initial allocation amounts
      await user.click(screen.getByText('Amount'));
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Amount')).toHaveValue(600);
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(400);
      });
      
      // Change total amount
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '1500');
      
      // Verify allocations are recalculated proportionally
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Amount')).toHaveValue(900);
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(600);
      });
      
      // Verify percentages remain the same
      await user.click(screen.getByText('Percentage'));
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(60);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(40);
      });
    });

    it('should clear style selection and maintain allocation ratios', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Setup with style and allocations
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'STY003');
      await waitFor(() => screen.getByText('STY003 - Kids Sneakers'));
      await user.click(screen.getByText('STY003 - Kids Sneakers'));
      
      await user.click(screen.getByLabelText('Channel'));
      
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '2000');
      
      // Set 70/30 allocation
      await user.click(screen.getByText('70/30'));
      
      // Clear the style selection
      await user.clear(styleInput);
      
      // Verify allocations are maintained even without style
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(70);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(30);
      });
      
      await user.click(screen.getByText('Amount'));
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Amount')).toHaveValue(1400);
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(600);
      });
    });
  });

  describe('Search Performance and User Experience', () => {
    it('should handle rapid style search queries without race conditions', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      
      // Type rapidly (simulating fast typing)
      await user.type(styleInput, 'S');
      await user.type(styleInput, 'T');
      await user.type(styleInput, 'Y');
      
      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('STY001 - Premium Jacket')).toBeInTheDocument();
        expect(screen.getByText('STY002 - Classic Shirt')).toBeInTheDocument();
        expect(screen.getByText('STY003 - Kids Sneakers')).toBeInTheDocument();
      });
      
      // Continue typing to narrow results
      await user.type(styleInput, '0');
      await user.type(styleInput, '0');
      await user.type(styleInput, '1');
      
      // Should show only STY001
      await waitFor(() => {
        expect(screen.getByText('STY001 - Premium Jacket')).toBeInTheDocument();
        expect(screen.queryByText('STY002 - Classic Shirt')).not.toBeInTheDocument();
        expect(screen.queryByText('STY003 - Kids Sneakers')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during search and clear when results arrive', async () => {
      // Mock delayed response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/styles/search')) {
          return new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                styles: [mockStyles[0]],
                total: 1
              })
            }), 500)
          );
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'STY');
      
      // Should show loading state
      expect(screen.getByText('Searching...')).toBeInTheDocument();
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('STY001 - Premium Jacket')).toBeInTheDocument();
      });
      
      // Loading state should be gone
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });

    it('should maintain allocation state when switching between styles', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Select first style and set up allocations
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'STY001');
      await waitFor(() => screen.getByText('STY001 - Premium Jacket'));
      await user.click(screen.getByText('STY001 - Premium Jacket'));
      
      await user.click(screen.getByLabelText('Channel'));
      
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '3000');
      
      // Set custom allocation
      const inlinePercentage = screen.getByLabelText('Inline Percentage');
      await user.clear(inlinePercentage);
      await user.type(inlinePercentage, '75');
      
      // Switch to different style
      await user.clear(styleInput);
      await user.type(styleInput, 'STY002');
      await waitFor(() => screen.getByText('STY002 - Classic Shirt'));
      await user.click(screen.getByText('STY002 - Classic Shirt'));
      
      // Allocation should be maintained
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(75);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(25);
      });
      
      // Amounts should be recalculated based on same total
      await user.click(screen.getByText('Amount'));
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Amount')).toHaveValue(2250);
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(750);
      });
    });
  });

  describe('Allocation Visual Feedback Integration', () => {
    it('should update progress bars when style selection affects total amount', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Select style and set up Channel scope
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'premium');
      await waitFor(() => screen.getByText('STY001 - Premium Jacket'));
      await user.click(screen.getByText('STY001 - Premium Jacket'));
      
      await user.click(screen.getByLabelText('Channel'));
      
      // Set total amount
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '2000');
      
      // Check initial progress bars (50/50)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars[0]).toHaveStyle('width: 50%'); // Inline
      expect(progressBars[1]).toHaveStyle('width: 50%'); // Ecomm
      
      // Change allocation to 80/20
      await user.click(screen.getByText('80/20'));
      
      // Progress bars should update
      await waitFor(() => {
        expect(progressBars[0]).toHaveStyle('width: 80%');
        expect(progressBars[1]).toHaveStyle('width: 20%');
      });
    });

    it('should show validation errors in both style selector and allocator', async () => {
      const user = userEvent.setup();
      
      // Mock validation API with errors
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/contracts/validate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              valid: false,
              errors: {
                style_number: 'Style number does not exist',
                allocations: 'Channel allocations must equal total amount'
              },
              warnings: {},
              message: 'Validation failed'
            })
          });
        }
        if (url.includes('/api/styles/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              styles: [],
              total: 0
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      // Enter invalid style
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'INVALID');
      
      // No results should be shown
      await waitFor(() => {
        expect(screen.getByText('No styles found. Try a different search term.')).toBeInTheDocument();
      });
      
      // Set up form to trigger validation
      await user.click(screen.getByLabelText('Channel'));
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '1000');
      
      // Manually enter invalid allocation
      await user.click(screen.getByText('Amount'));
      const inlineAmount = screen.getByLabelText('Inline Amount');
      await user.clear(inlineAmount);
      await user.type(inlineAmount, '800'); // Ecomm will be 200, total = 1000 but let's make it inconsistent
      
      const ecommAmount = screen.getByLabelText('Ecomm Amount');
      await user.clear(ecommAmount);
      await user.type(ecommAmount, '300'); // Total now = 1100, not 1000
      
      // Trigger validation
      await user.click(screen.getByText('Validate Form'));
      
      // Should show both errors
      await waitFor(() => {
        expect(screen.getByText('Style number does not exist')).toBeInTheDocument();
        expect(screen.getByText('Channel allocations must equal total amount')).toBeInTheDocument();
      });
      
      // Both components should show error styling
      expect(styleInput).toHaveClass(/border-red-300/);
      expect(screen.getByText('Channel allocations must equal total amount').closest('div')).toHaveClass(/text-red-600/);
    });
  });

  describe('Complex Interaction Scenarios', () => {
    it('should handle style search with allocation adjustments in real workflow', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Start typing style number
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'classic');
      
      // Select from search results
      await waitFor(() => screen.getByText('STY002 - Classic Shirt'));
      await user.click(screen.getByText('STY002 - Classic Shirt'));
      
      // Configure for Channel allocation
      await user.click(screen.getByLabelText('Channel'));
      
      // Set total amount
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '5000');
      
      // Use quick preset
      await user.click(screen.getByText('70/30'));
      
      // Verify amounts are calculated correctly
      await user.click(screen.getByText('Amount'));
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Amount')).toHaveValue(3500);
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(1500);
      });
      
      // Manually adjust one amount
      const inlineAmount = screen.getByLabelText('Inline Amount');
      await user.clear(inlineAmount);
      await user.type(inlineAmount, '4000');
      
      // Other amount and percentages should auto-adjust
      await waitFor(() => {
        expect(screen.getByLabelText('Ecomm Amount')).toHaveValue(1000);
      });
      
      // Switch back to percentage to verify
      await user.click(screen.getByText('Percentage'));
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(80);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(20);
      });
      
      // Change style again to verify persistence
      await user.clear(styleInput);
      await user.type(styleInput, 'kids');
      await waitFor(() => screen.getByText('STY003 - Kids Sneakers'));
      await user.click(screen.getByText('STY003 - Kids Sneakers'));
      
      // Allocation ratios should be maintained
      await waitFor(() => {
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(80);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(20);
      });
    });

    it('should handle scope changes affecting allocation visibility', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Select style first
      const styleInput = screen.getByPlaceholderText('Search by style number, item number, or description...');
      await user.type(styleInput, 'jacket');
      await waitFor(() => screen.getByText('STY001 - Premium Jacket'));
      await user.click(screen.getByText('STY001 - Premium Jacket'));
      
      // Start with AllStyle (no allocations)
      await user.click(screen.getByLabelText('AllStyle'));
      
      // Allocation section should not be visible
      expect(screen.queryByText('Channel Allocation')).not.toBeInTheDocument();
      
      // Switch to Channel scope
      await user.click(screen.getByLabelText('Channel'));
      
      // Allocation section should appear with default 50/50
      await waitFor(() => {
        expect(screen.getByText('Channel Allocation')).toBeInTheDocument();
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(50);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(50);
      });
      
      // Set up total amount and custom allocation
      const totalAmountInput = screen.getByLabelText('Total Committed Amount');
      await user.clear(totalAmountInput);
      await user.type(totalAmountInput, '1200');
      
      await user.click(screen.getByText('60/40'));
      
      // Switch back to AllStyle
      await user.click(screen.getByLabelText('AllStyle'));
      
      // Allocation should be hidden but not lost
      expect(screen.queryByText('Channel Allocation')).not.toBeInTheDocument();
      
      // Switch back to Channel
      await user.click(screen.getByLabelText('Channel'));
      
      // Previous allocation should be restored
      await waitFor(() => {
        expect(screen.getByText('Channel Allocation')).toBeInTheDocument();
        expect(screen.getByLabelText('Inline Percentage')).toHaveValue(60);
        expect(screen.getByLabelText('Ecomm Percentage')).toHaveValue(40);
      });
    });
  });
});