import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContractFormPage from '@/app/contracts/new/page';
import type { ContractDraft } from '@/types/contract';

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

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock timers for auto-save testing
vi.useFakeTimers();

describe('Contract Form Draft Functionality Integration', () => {
  const mockDraft: ContractDraft = {
    draft_id: 1,
    user_id: 'test-user-123',
    document_id: null,
    form_data: {
      style_number: 'STY001',
      scope: 'Channel',
      customer: 'ACME Corp',
      total_committed_amount: 1500,
      contract_date: '2024-02-01',
      campaign_start_date: '2024-03-01',
      campaign_end_date: '2024-04-01',
      allocations: {
        inline_percentage: 60,
        ecomm_percentage: 40,
        inline_amount: 900,
        ecomm_amount: 600
      }
    },
    style_suggestions: null,
    validation_errors: null,
    last_saved: '2024-01-20T10:00:00Z',
    created_at: '2024-01-20T09:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    
    // Default mock responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/contracts/drafts') && url.includes('user_id=')) {
        // GET drafts for user
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            drafts: [mockDraft],
            total: 1
          })
        });
      }
      
      if (url.includes('/api/contracts/drafts') && !url.includes('user_id=')) {
        // POST save draft
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            draft_id: 1,
            message: 'Draft saved successfully'
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Draft Loading on Form Initialization', () => {
    it('should load existing draft when form initializes', async () => {
      render(<ContractFormPage />);
      
      // Wait for draft to be loaded
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/contracts/drafts?user_id=test-user-123')
        );
      });
      
      // Check that form fields are populated with draft data
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ACME Corp')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
      });
    });

    it('should show draft loaded message when draft is found', async () => {
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Draft loaded from/)).toBeInTheDocument();
      });
    });

    it('should handle no existing draft gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/contracts/drafts') && url.includes('user_id=')) {
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
      
      render(<ContractFormPage />);
      
      // Should not show draft loaded message
      await waitFor(() => {
        expect(screen.queryByText(/Draft loaded from/)).not.toBeInTheDocument();
      });
      
      // Form should have default values
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Empty style number
    });

    it('should handle draft loading error gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/contracts/drafts') && url.includes('user_id=')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to load draft/)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save draft every 30 seconds when form has changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ContractFormPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Clear previous fetch calls
      vi.clearAllMocks();
      
      // Make a change to the form
      const styleInput = screen.getByDisplayValue('STY001');
      await user.clear(styleInput);
      await user.type(styleInput, 'STY002');
      
      // Advance timer by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      // Should have called save draft API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/contracts/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('STY002')
        });
      });
    });

    it('should show saving indicator during auto-save', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock delayed response for save
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST' && url.includes('/api/contracts/drafts')) {
          return new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                draft_id: 1,
                message: 'Draft saved successfully'
              })
            }), 500)
          );
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Make a change
      const styleInput = screen.getByDisplayValue('STY001');
      await user.clear(styleInput);
      await user.type(styleInput, 'STY002');
      
      // Trigger auto-save
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      // Should show saving indicator
      expect(screen.getByText(/Saving draft.../)).toBeInTheDocument();
      
      // Advance time to complete the save
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
      });
    });

    it('should not auto-save if form has not changed', async () => {
      render(<ContractFormPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Clear previous fetch calls
      vi.clearAllMocks();
      
      // Advance timer by 30 seconds without making changes
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      // Should not have called save draft API
      expect(mockFetch).not.toHaveBeenCalledWith('/api/contracts/drafts', expect.any(Object));
    });

    it('should handle auto-save errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock error response for save
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST' && url.includes('/api/contracts/drafts')) {
          return Promise.reject(new Error('Save failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      // Wait for initial load and make a change
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      const styleInput = screen.getByDisplayValue('STY001');
      await user.clear(styleInput);
      await user.type(styleInput, 'STY002');
      
      // Trigger auto-save
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to save draft/)).toBeInTheDocument();
      });
    });
  });

  describe('Manual Save/Resume Controls', () => {
    it('should have manual save button', async () => {
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Draft')).toBeInTheDocument();
      });
    });

    it('should save draft when manual save button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Clear previous fetch calls
      vi.clearAllMocks();
      
      // Click save draft button
      await user.click(screen.getByText('Save Draft'));
      
      // Should call save draft API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/contracts/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        });
      });
    });

    it('should show success message after manual save', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Save Draft'));
      
      await waitFor(() => {
        expect(screen.getByText(/Draft saved successfully/)).toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST' && url.includes('/api/contracts/drafts')) {
          return new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                draft_id: 1,
                message: 'Draft saved successfully'
              })
            }), 500)
          );
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText('Save Draft');
      await user.click(saveButton);
      
      expect(saveButton).toBeDisabled();
      
      // Wait for save to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Draft Conflict Resolution', () => {
    it('should handle concurrent editing gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock response that simulates another user has modified the draft
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST' && url.includes('/api/contracts/drafts')) {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: () => Promise.resolve({
              success: false,
              message: 'Draft has been modified by another user',
              conflict: true
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Make a change and trigger auto-save
      const styleInput = screen.getByDisplayValue('STY001');
      await user.clear(styleInput);
      await user.type(styleInput, 'STY002');
      
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      // Should show conflict message
      await waitFor(() => {
        expect(screen.getByText(/Draft has been modified by another user/)).toBeInTheDocument();
      });
    });
  });

  describe('Draft Persistence Across Sessions', () => {
    it('should preserve all form data in draft', async () => {
      const user = userEvent.setup();
      render(<ContractFormPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Modify various fields
      const customerInput = screen.getByDisplayValue('ACME Corp');
      await user.clear(customerInput);
      await user.type(customerInput, 'New Customer Corp');
      
      const amountInput = screen.getByDisplayValue('1500');
      await user.clear(amountInput);
      await user.type(amountInput, '2000');
      
      // Save manually to check data
      vi.clearAllMocks();
      await user.click(screen.getByText('Save Draft'));
      
      // Check that all modified data is in the save request
      await waitFor(() => {
        const saveCall = mockFetch.mock.calls.find(call => 
          call[0].includes('/api/contracts/drafts') && call[1]?.method === 'POST'
        );
        expect(saveCall).toBeTruthy();
        
        const requestBody = JSON.parse(saveCall[1].body);
        expect(requestBody.form_data).toEqual(expect.objectContaining({
          style_number: 'STY001',
          customer: 'New Customer Corp',
          total_committed_amount: 2000
        }));
      });
    });

    it('should preserve allocation data in drafts', async () => {
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Check that allocations are loaded from draft
      const inlinePercentage = screen.getByLabelText('Inline Percentage');
      const ecommPercentage = screen.getByLabelText('Ecomm Percentage');
      
      expect(inlinePercentage).toHaveValue(60);
      expect(ecommPercentage).toHaveValue(40);
    });

    it('should preserve validation errors in drafts', async () => {
      const draftWithErrors = {
        ...mockDraft,
        validation_errors: {
          style_number: 'Style number is required',
          total_committed_amount: 'Amount must be greater than 0'
        }
      };
      
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/contracts/drafts') && url.includes('user_id=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              drafts: [draftWithErrors],
              total: 1
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      // Should show validation errors from draft
      await waitFor(() => {
        expect(screen.getByText('Style number is required')).toBeInTheDocument();
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });
    });
  });

  describe('Draft Cleanup', () => {
    it('should clear draft after successful form submission', async () => {
      const user = userEvent.setup();
      
      // Mock successful contract submission
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST' && url.includes('/api/contracts') && !url.includes('drafts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              contract_id: 123,
              message: 'Contract created successfully'
            })
          });
        }
        if (url.includes('/api/contracts/drafts/cleanup')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Draft cleaned up',
              deleted_count: 1
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<ContractFormPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('STY001')).toBeInTheDocument();
      });
      
      // Submit form
      await user.click(screen.getByText('Create Contract'));
      
      // Should call draft cleanup after successful submission
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/contracts/drafts/cleanup?user_id=test-user-123'),
          { method: 'POST' }
        );
      });
    });
  });
});