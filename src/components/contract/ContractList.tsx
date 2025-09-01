'use client';

import { useState, useEffect } from 'react';
import { ContractCard } from './ContractCard';
import { ContractFilters } from './ContractFilters';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export interface Contract {
  mdf_id: number;
  style_number: string;
  scope: 'Channel' | 'AllStyle';
  customer?: string;
  total_committed_amount: number;
  contract_date: string;
  campaign_start_date?: string;
  campaign_end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  item_number: string;
  item_desc: string;
  season: string;
  business_line: string;
  allocations: Array<{
    allocation_id: number;
    channel_code: 'Inline' | 'Ecomm';
    allocated_amount: number;
  }>;
}

interface ContractListProps {
  initialContracts?: Contract[];
}

export function ContractList({ initialContracts = [] }: ContractListProps) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    style: '',
    customer: '',
    season: '',
    business_line: ''
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });

  // Fetch contracts with filters and pagination
  const fetchContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          searchParams.append(key, value.trim());
        }
      });

      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api/contracts?${searchParams}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setContracts(data.contracts);
        setPagination(prev => ({ ...prev, total: data.total }));
      } else {
        setError(data.message || 'Failed to load contracts');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load contracts');
      }
      console.error('Contract fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load contracts on component mount and when filters/pagination change
  useEffect(() => {
    fetchContracts();
  }, [pagination.offset, pagination.limit]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchContracts();
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading contracts...</span>
      </div>
    );
  }

  if (error && contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchContracts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h2>
        <p className="text-gray-500 mb-6">
          {Object.values(filters).some(f => f.trim()) 
            ? 'Try adjusting your search filters or create a new contract.'
            : 'Get started by creating your first contract.'
          }
        </p>
        <Link
          href="/contracts/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create New Contract
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ContractFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        onSearch={handleSearch}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6">
        {contracts.map((contract) => (
          <ContractCard
            key={contract.mdf_id}
            contract={contract}
            onUpdate={fetchContracts}
          />
        ))}
      </div>

      {pagination.total > pagination.limit && (
        <Pagination
          limit={pagination.limit}
          offset={pagination.offset}
          total={pagination.total}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}
    </div>
  );
}