'use client';

import { useState } from 'react';

interface Filters {
  style: string;
  customer: string;
  season: string;
  business_line: string;
}

interface ContractFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onSearch: () => void;
  loading?: boolean;
}

export function ContractFilters({ filters, onFiltersChange, onSearch, loading }: ContractFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof Filters, value: string) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      style: '',
      customer: '',
      season: '',
      business_line: ''
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value.trim());

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Contracts</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-900 focus:outline-none"
          >
            {isExpanded ? 'Hide filters' : 'Show filters'}
          </button>
        </div>
      </div>

      {/* Quick search bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by style number, customer, or description..."
            value={localFilters.style}
            onChange={(e) => handleInputChange('style', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <button
          onClick={onSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Advanced filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label htmlFor="filter-customer" className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <input
              id="filter-customer"
              type="text"
              placeholder="Enter customer name"
              value={localFilters.customer}
              onChange={(e) => handleInputChange('customer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="filter-season" className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select
              id="filter-season"
              value={localFilters.season}
              onChange={(e) => handleInputChange('season', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All seasons</option>
              <option value="Spring 2024">Spring 2024</option>
              <option value="Summer 2024">Summer 2024</option>
              <option value="Fall 2024">Fall 2024</option>
              <option value="Winter 2024">Winter 2024</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Summer 2025">Summer 2025</option>
              <option value="Fall 2025">Fall 2025</option>
              <option value="Winter 2025">Winter 2025</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-business-line" className="block text-sm font-medium text-gray-700 mb-1">
              Business Line
            </label>
            <select
              id="filter-business-line"
              value={localFilters.business_line}
              onChange={(e) => handleInputChange('business_line', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All business lines</option>
              <option value="Apparel">Apparel</option>
              <option value="Footwear">Footwear</option>
              <option value="Accessories">Accessories</option>
              <option value="Equipment">Equipment</option>
            </select>
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>
            {Object.entries(localFilters).map(([key, value]) => {
              if (!value.trim()) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {key}: {value}
                  <button
                    onClick={() => handleInputChange(key as keyof Filters, '')}
                    className="ml-1 text-blue-600 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}