'use client';

import { Contract } from './ContractList';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';

interface ContractCardProps {
  contract: Contract;
  onUpdate?: () => void;
}

export function ContractCard({ contract, onUpdate }: ContractCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalAllocated = () => {
    return contract.allocations.reduce((total, allocation) => total + allocation.allocated_amount, 0);
  };

  const getChannelAllocation = (channel: 'Inline' | 'Ecomm') => {
    const allocation = contract.allocations.find(a => a.channel_code === channel);
    return allocation ? allocation.allocated_amount : 0;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <Link
                href={`/contracts/${contract.mdf_id}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                Contract #{contract.mdf_id}
              </Link>
              <StatusBadge scope={contract.scope} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Style</dt>
                <dd className="text-sm text-gray-900">
                  {contract.style_number}
                  <div className="text-xs text-gray-500 truncate">{contract.item_desc}</div>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="text-sm text-gray-900">
                  {contract.customer || <span className="text-gray-400 italic">Not specified</span>}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {formatCurrency(contract.total_committed_amount)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Contract Date</dt>
                <dd className="text-sm text-gray-900">
                  {formatDate(contract.contract_date)}
                </dd>
              </div>
            </div>

            {contract.scope === 'Channel' && contract.allocations.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Channel Allocations</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900">Inline</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {formatCurrency(getChannelAllocation('Inline'))}
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-900">E-commerce</span>
                      <span className="text-sm font-semibold text-green-900">
                        {formatCurrency(getChannelAllocation('Ecomm'))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <div>
                Created by {contract.created_by} on {formatDate(contract.created_at)}
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  {contract.season}
                </span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  {contract.business_line}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            <div className="flex space-x-2">
              <Link
                href={`/contracts/${contract.mdf_id}`}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}