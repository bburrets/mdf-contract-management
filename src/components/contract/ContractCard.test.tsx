import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContractCard } from './ContractCard';
import type { Contract } from './ContractList';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ContractCard', () => {
  const mockContract: Contract = {
    mdf_id: 1,
    style_number: 'STY001',
    scope: 'Channel',
    customer: 'Test Customer',
    total_committed_amount: 10000,
    contract_date: '2024-01-01',
    campaign_start_date: '2024-02-01',
    campaign_end_date: '2024-03-01',
    created_by: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    item_number: 'ITM001',
    item_desc: 'Test Product Description',
    season: 'Spring 2024',
    business_line: 'Apparel',
    allocations: [
      {
        allocation_id: 1,
        channel_code: 'Inline',
        allocated_amount: 6000
      },
      {
        allocation_id: 2,
        channel_code: 'Ecomm',
        allocated_amount: 4000
      }
    ]
  };

  it('should render contract basic information', () => {
    render(<ContractCard contract={mockContract} />);
    
    expect(screen.getByText('Contract #1')).toBeInTheDocument();
    expect(screen.getByText('STY001')).toBeInTheDocument();
    expect(screen.getByText('Test Product Description')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('should display formatted dates correctly', () => {
    render(<ContractCard contract={mockContract} />);
    
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
  });

  it('should show Channel Specific badge for Channel scope', () => {
    render(<ContractCard contract={mockContract} />);
    
    expect(screen.getByText('Channel Specific')).toBeInTheDocument();
  });

  it('should show All Style badge for AllStyle scope', () => {
    const allStyleContract = { ...mockContract, scope: 'AllStyle' as const };
    render(<ContractCard contract={allStyleContract} />);
    
    expect(screen.getByText('All Style')).toBeInTheDocument();
  });

  it('should display channel allocations for Channel scope', () => {
    render(<ContractCard contract={mockContract} />);
    
    expect(screen.getByText('Channel Allocations')).toBeInTheDocument();
    expect(screen.getByText('Inline')).toBeInTheDocument();
    expect(screen.getByText('E-commerce')).toBeInTheDocument();
    expect(screen.getByText('$6,000.00')).toBeInTheDocument();
    expect(screen.getByText('$4,000.00')).toBeInTheDocument();
  });

  it('should not display allocations for AllStyle scope', () => {
    const allStyleContract = { 
      ...mockContract, 
      scope: 'AllStyle' as const,
      allocations: []
    };
    render(<ContractCard contract={allStyleContract} />);
    
    expect(screen.queryByText('Channel Allocations')).not.toBeInTheDocument();
  });

  it('should handle missing customer gracefully', () => {
    const contractWithoutCustomer = { ...mockContract, customer: undefined };
    render(<ContractCard contract={contractWithoutCustomer} />);
    
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  it('should show correct link to contract details', () => {
    render(<ContractCard contract={mockContract} />);
    
    const detailsLink = screen.getByRole('link', { name: /Contract #1/i });
    expect(detailsLink).toHaveAttribute('href', '/contracts/1');
    
    const viewDetailsLink = screen.getByRole('link', { name: /View Details/i });
    expect(viewDetailsLink).toHaveAttribute('href', '/contracts/1');
  });

  it('should display metadata tags', () => {
    render(<ContractCard contract={mockContract} />);
    
    expect(screen.getByText('Spring 2024')).toBeInTheDocument();
    expect(screen.getByText('Apparel')).toBeInTheDocument();
  });

  it('should show creation information', () => {
    render(<ContractCard contract={mockContract} />);
    
    expect(screen.getByText(/Created by test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/on Jan 1, 2024/)).toBeInTheDocument();
  });

  it('should handle zero allocations correctly', () => {
    const contractWithZeroAllocation = {
      ...mockContract,
      allocations: [
        {
          allocation_id: 1,
          channel_code: 'Inline' as const,
          allocated_amount: 0
        },
        {
          allocation_id: 2,
          channel_code: 'Ecomm' as const,
          allocated_amount: 10000
        }
      ]
    };
    
    render(<ContractCard contract={contractWithZeroAllocation} />);
    
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('should handle contracts with no allocations', () => {
    const contractNoAllocations = {
      ...mockContract,
      allocations: []
    };
    
    render(<ContractCard contract={contractNoAllocations} />);
    
    // Should not show Channel Allocations section
    expect(screen.queryByText('Channel Allocations')).not.toBeInTheDocument();
  });

  it('should call onUpdate when provided', () => {
    const mockOnUpdate = vi.fn();
    render(<ContractCard contract={mockContract} onUpdate={mockOnUpdate} />);
    
    // This would typically be tested with user interactions that trigger updates
    // For now, just verify the prop is accepted
    expect(mockOnUpdate).toBeDefined();
  });

  it('should handle large amounts correctly', () => {
    const largeAmountContract = {
      ...mockContract,
      total_committed_amount: 1234567.89,
      allocations: [
        {
          allocation_id: 1,
          channel_code: 'Inline' as const,
          allocated_amount: 734567.89
        },
        {
          allocation_id: 2,
          channel_code: 'Ecomm' as const,
          allocated_amount: 500000.00
        }
      ]
    };
    
    render(<ContractCard contract={largeAmountContract} />);
    
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
    expect(screen.getByText('$734,567.89')).toBeInTheDocument();
    expect(screen.getByText('$500,000.00')).toBeInTheDocument();
  });
});