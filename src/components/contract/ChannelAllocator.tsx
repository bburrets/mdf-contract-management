'use client';

import { type ContractFormInput } from '@/types/contract';
import { useState, useEffect } from 'react';

interface ChannelAllocatorProps {
  totalAmount: number;
  allocations: ContractFormInput['allocations'];
  onChange: (allocations: ContractFormInput['allocations']) => void;
  error?: string;
}

export default function ChannelAllocator({ totalAmount, allocations, onChange, error }: ChannelAllocatorProps) {
  const [allocationMode, setAllocationMode] = useState<'percentage' | 'amount'>('percentage');
  
  // Get allocation values from props
  const inlineAmount = allocations.inline_amount || 0;
  const ecommAmount = allocations.ecomm_amount || 0;
  const inlinePercentage = allocations.inline_percentage || 0;
  const ecommPercentage = allocations.ecomm_percentage || 0;
  
  // Calculate totals for validation display
  const totalAllocatedAmount = inlineAmount + ecommAmount;
  const totalAllocatedPercentage = inlinePercentage + ecommPercentage;
  const amountDifference = Math.abs(totalAllocatedAmount - totalAmount);
  const percentageDifference = Math.abs(totalAllocatedPercentage - 100);
  const isValidAllocation = amountDifference < 0.01 && percentageDifference < 0.01;

  const handleQuickSplit = (inlinePercent: number, ecommPercent: number) => {
    onChange({
      ...allocations,
      inline_percentage: inlinePercent,
      ecomm_percentage: ecommPercent,
      inline_amount: totalAmount > 0 ? (totalAmount * inlinePercent) / 100 : 0,
      ecomm_amount: totalAmount > 0 ? (totalAmount * ecommPercent) / 100 : 0
    });
  };

  const resetAllocation = () => {
    onChange({
      ...allocations,
      inline_percentage: 50,
      ecomm_percentage: 50,
      inline_amount: totalAmount > 0 ? totalAmount / 2 : 0,
      ecomm_amount: totalAmount > 0 ? totalAmount / 2 : 0
    });
  };

  const handleInlinePercentageChange = (value: number) => {
    const remaining = 100 - value;
    onChange({
      ...allocations,
      inline_percentage: value,
      ecomm_percentage: remaining >= 0 ? remaining : 0,
      inline_amount: totalAmount > 0 ? (totalAmount * value) / 100 : 0,
      ecomm_amount: totalAmount > 0 ? (totalAmount * (remaining >= 0 ? remaining : 0)) / 100 : 0
    });
  };

  const handleEcommPercentageChange = (value: number) => {
    const remaining = 100 - value;
    onChange({
      ...allocations,
      ecomm_percentage: value,
      inline_percentage: remaining >= 0 ? remaining : 0,
      inline_amount: totalAmount > 0 ? (totalAmount * (remaining >= 0 ? remaining : 0)) / 100 : 0,
      ecomm_amount: totalAmount > 0 ? (totalAmount * value) / 100 : 0
    });
  };

  const handleInlineAmountChange = (value: number) => {
    const remaining = totalAmount - value;
    onChange({
      ...allocations,
      inline_amount: value,
      ecomm_amount: remaining >= 0 ? remaining : 0,
      inline_percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0,
      ecomm_percentage: totalAmount > 0 ? ((remaining >= 0 ? remaining : 0) / totalAmount) * 100 : 0
    });
  };

  const handleEcommAmountChange = (value: number) => {
    const remaining = totalAmount - value;
    onChange({
      ...allocations,
      ecomm_amount: value,
      inline_amount: remaining >= 0 ? remaining : 0,
      inline_percentage: totalAmount > 0 ? ((remaining >= 0 ? remaining : 0) / totalAmount) * 100 : 0,
      ecomm_percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Mode switcher */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Allocation Mode:
        </div>
        
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setAllocationMode('percentage')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              allocationMode === 'percentage'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Percentage
          </button>
          <button
            type="button"
            onClick={() => setAllocationMode('amount')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              allocationMode === 'amount'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Amount
          </button>
        </div>
      </div>

      {/* Quick allocation buttons */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 mb-3">Quick Allocation:</div>
        
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickSplit(50, 50)}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            50/50 Split
          </button>
          <button
            type="button"
            onClick={() => handleQuickSplit(60, 40)}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            60/40 Split
          </button>
          <button
            type="button"
            onClick={() => handleQuickSplit(70, 30)}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            70/30 Split
          </button>
          <button
            type="button"
            onClick={() => handleQuickSplit(100, 0)}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Inline Only
          </button>
          <button
            type="button"
            onClick={() => handleQuickSplit(0, 100)}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            E-comm Only
          </button>
          <button
            type="button"
            onClick={resetAllocation}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Allocation inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inline Channel */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <h3 className="font-medium text-gray-900">Inline (Physical Stores)</h3>
          </div>

          {allocationMode === 'percentage' ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Inline Percentage *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={inlinePercentage}
                  onChange={(e) => handleInlinePercentageChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Inline Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={inlineAmount}
                  onChange={(e) => handleInlineAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pl-7 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Amount: ${inlineAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {inlinePercentage > 0 && ` (${inlinePercentage.toFixed(1)}%)`}
          </div>
        </div>

        {/* E-commerce Channel */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <h3 className="font-medium text-gray-900">E-commerce</h3>
          </div>

          {allocationMode === 'percentage' ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                E-commerce Percentage *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={ecommPercentage}
                  onChange={(e) => handleEcommPercentageChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                E-commerce Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={ecommAmount}
                  onChange={(e) => handleEcommAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pl-7 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Amount: ${ecommAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {ecommPercentage > 0 && ` (${ecommPercentage.toFixed(1)}%)`}
          </div>
        </div>
      </div>

      {/* Visual allocation bar */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">Allocation Breakdown</div>
        
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(inlinePercentage, 100)}%` }}
          ></div>
          <div 
            className="absolute top-0 h-full bg-green-500 transition-all duration-300"
            style={{ 
              left: `${Math.min(inlinePercentage, 100)}%`, 
              width: `${Math.min(ecommPercentage, 100 - inlinePercentage)}%` 
            }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600">
          <span>Inline: {inlinePercentage.toFixed(1)}%</span>
          <span>E-commerce: {ecommPercentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Validation summary */}
      <div className={`p-4 rounded-lg border ${
        isValidAllocation 
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isValidAllocation ? (
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${
              isValidAllocation ? 'text-green-800' : 'text-red-800'
            }`}>
              {isValidAllocation ? 'Allocation Valid' : 'Allocation Issues'}
            </div>
            
            <div className={`mt-1 text-sm ${
              isValidAllocation ? 'text-green-700' : 'text-red-700'
            }`}>
              {isValidAllocation ? (
                'Channel allocations are properly configured.'
              ) : (
                <div className="space-y-1">
                  {amountDifference >= 0.01 && (
                    <div>
                      Total allocated: ${totalAllocatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} 
                      (${amountDifference.toFixed(2)} {totalAllocatedAmount > totalAmount ? 'over' : 'under'} target)
                    </div>
                  )}
                  {percentageDifference >= 0.01 && (
                    <div>
                      Total percentage: {totalAllocatedPercentage.toFixed(1)}% 
                      (should equal 100%)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}