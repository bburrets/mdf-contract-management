import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleSelector } from './StyleSelector';
import type { Style } from '@/types/contract';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock debounced hook
vi.mock('@/lib/hooks', () => ({
  useDebouncedValue: (value: string) => value, // Return immediately for testing
}));

const mockStyles: Style[] = [
  {
    style_number: 'STY001',
    item_number: 'ITM001',
    item_desc: 'Test Item 1',
    season: 'Spring 2024',
    business_line: 'Women'
  },
  {
    style_number: 'STY002',
    item_number: 'ITM002',
    item_desc: 'Test Item 2',
    season: 'Summer 2024',
    business_line: 'Men'
  },
  {
    style_number: 'STY003',
    item_number: 'ITM003',
    item_desc: 'Another Style',
    season: 'Fall 2024',
    business_line: 'Kids'
  }
];

describe('StyleSelector', () => {
  const mockOnStyleSelect = vi.fn();
  const defaultProps = {
    value: '',
    onStyleSelect: mockOnStyleSelect,
    error: undefined
  };

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        styles: mockStyles,
        total: mockStyles.length
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with placeholder text', () => {
    render(<StyleSelector {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search by style number, item number, or description...')).toBeInTheDocument();
  });

  it('should display error message when provided', () => {
    const errorMessage = 'Style is required';
    render(<StyleSelector {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-300');
  });

  it('should display current value in input', () => {
    const currentValue = 'STY001';
    render(<StyleSelector {...defaultProps} value={currentValue} />);
    
    expect(screen.getByDisplayValue(currentValue)).toBeInTheDocument();
  });

  it('should trigger search when user types', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/styles/search?q=STY&limit=10');
    });
  });

  it('should display search results', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('STY002 - Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('STY003 - Another Style')).toBeInTheDocument();
    });
  });

  it('should show style details in results', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      // Check for style details
      expect(screen.getByText('Spring 2024 • Women')).toBeInTheDocument();
      expect(screen.getByText('Summer 2024 • Men')).toBeInTheDocument();
      expect(screen.getByText('Fall 2024 • Kids')).toBeInTheDocument();
    });
  });

  it('should call onStyleSelect when style is clicked', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('STY001 - Test Item 1'));
    
    expect(mockOnStyleSelect).toHaveBeenCalledWith(mockStyles[0]);
  });

  it('should hide dropdown when style is selected', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('STY001 - Test Item 1'));
    
    await waitFor(() => {
      expect(screen.queryByText('STY001 - Test Item 1')).not.toBeInTheDocument();
    });
  });

  it('should show loading state during search', async () => {
    // Mock delayed response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            styles: mockStyles,
            total: mockStyles.length
          })
        }), 100)
      )
    );

    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  it('should show no results message when no styles found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        styles: [],
        total: 0
      })
    });

    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'NONEXISTENT');
    
    await waitFor(() => {
      expect(screen.getByText('No styles found. Try a different search term.')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('Error searching styles. Please try again.')).toBeInTheDocument();
    });
  });

  it('should handle server errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    });

    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('Error searching styles. Please try again.')).toBeInTheDocument();
    });
  });

  it('should not search for empty or very short queries', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    // Type single character
    await user.type(input, 'S');
    
    // Wait to ensure no fetch is called
    await act(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should search when query is 2 or more characters', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'ST');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/styles/search?q=ST&limit=10');
    });
  });

  it('should hide dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <StyleSelector {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByText('STY001 - Test Item 1')).not.toBeInTheDocument();
    });
  });

  it('should clear search when input is cleared', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
    });
    
    await user.clear(input);
    
    await waitFor(() => {
      expect(screen.queryByText('STY001 - Test Item 1')).not.toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
    });
    
    // Press arrow down to highlight first item
    await user.keyboard('{ArrowDown}');
    
    const firstOption = screen.getByText('STY001 - Test Item 1').closest('div');
    expect(firstOption).toHaveClass('bg-blue-50');
    
    // Press arrow down again to highlight second item
    await user.keyboard('{ArrowDown}');
    
    const secondOption = screen.getByText('STY002 - Test Item 2').closest('div');
    expect(secondOption).toHaveClass('bg-blue-50');
    
    // Press Enter to select highlighted item
    await user.keyboard('{Enter}');
    
    expect(mockOnStyleSelect).toHaveBeenCalledWith(mockStyles[1]);
  });

  it('should handle Escape key to close dropdown', async () => {
    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('STY001 - Test Item 1')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('STY001 - Test Item 1')).not.toBeInTheDocument();
    });
  });

  it('should display confidence scores for matches', async () => {
    const stylesWithConfidence = mockStyles.map((style, index) => ({
      ...style,
      confidence: 0.9 - (index * 0.1), // Decreasing confidence
      match_reason: `Matched ${style.style_number}`
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        styles: stylesWithConfidence,
        total: stylesWithConfidence.length
      })
    });

    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      expect(screen.getByText('90% match')).toBeInTheDocument();
      expect(screen.getByText('80% match')).toBeInTheDocument();
      expect(screen.getByText('70% match')).toBeInTheDocument();
    });
  });

  it('should show different styling for high vs low confidence matches', async () => {
    const stylesWithConfidence = [
      { ...mockStyles[0], confidence: 0.95, match_reason: 'Exact match' },
      { ...mockStyles[1], confidence: 0.60, match_reason: 'Partial match' }
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        styles: stylesWithConfidence,
        total: stylesWithConfidence.length
      })
    });

    const user = userEvent.setup();
    render(<StyleSelector {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'STY');
    
    await waitFor(() => {
      const highConfidence = screen.getByText('95% match');
      const lowConfidence = screen.getByText('60% match');
      
      expect(highConfidence).toHaveClass('text-green-600');
      expect(lowConfidence).toHaveClass('text-yellow-600');
    });
  });
});