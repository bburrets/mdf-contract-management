'use client';

import { useFormContext } from 'react-hook-form';
import { type ContractFormInput } from '@/types/contract';
import StyleSelector from './StyleSelector';
import ChannelAllocator from './ChannelAllocator';
import FormField from '@/components/forms/FormField';
import FormError from '@/components/forms/FormError';

export default function ContractForm() {
  const { 
    register, 
    formState: { errors }, 
    watch, 
    setValue 
  } = useFormContext<ContractFormInput>();

  // Watch values for dependent field updates
  const totalAmount = watch('total_committed_amount');
  const scope = watch('scope');

  return (
    <div className=\"space-y-8 p-6\">
      {/* Contract Basic Information */}
      <section>
        <h2 className=\"text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2\">
          Contract Information
        </h2>
        
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          {/* Style Selection */}
          <div className=\"md:col-span-2\">
            <StyleSelector />
          </div>

          {/* Contract Date */}
          <FormField
            label=\"Contract Date\"
            required
            error={errors.contract_date?.message}
          >
            <input
              type=\"date\"
              {...register('contract_date')}
              className=\"mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
            />
          </FormField>

          {/* Customer */}
          <FormField
            label=\"Customer/Retailer\"
            optional
            error={errors.customer?.message}
          >
            <input
              type=\"text\"
              {...register('customer')}
              placeholder=\"Enter customer or retailer name\"
              className=\"mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
            />
          </FormField>

          {/* Funding Type */}
          <FormField
            label=\"Funding Type\"
            required
            error={errors.scope?.message}
          >
            <select
              {...register('scope')}
              className=\"mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
            >
              <option value=\"Channel\">Channel - Specific channel allocation</option>
              <option value=\"AllStyle\">All Style - Available across all channels</option>
            </select>
          </FormField>

          {/* Total Amount */}
          <FormField
            label=\"Total Committed Amount\"
            required
            error={errors.total_committed_amount?.message}
          >
            <div className=\"relative mt-1\">
              <div className=\"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none\">
                <span className=\"text-gray-500 sm:text-sm\">$</span>
              </div>
              <input
                type=\"number\"
                step=\"0.01\"
                min=\"0.01\"
                max=\"999999999.99\"
                {...register('total_committed_amount', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    // Auto-update channel allocations when total amount changes
                    const newTotal = parseFloat(e.target.value) || 0;
                    if (newTotal > 0 && scope === 'Channel') {
                      const inlinePerc = watch('allocations.inline_percentage') || 50;
                      const ecommPerc = watch('allocations.ecomm_percentage') || 50;
                      
                      setValue('allocations.inline_amount', (newTotal * inlinePerc) / 100);
                      setValue('allocations.ecomm_amount', (newTotal * ecommPerc) / 100);
                    }
                  }
                })}
                placeholder=\"0.00\"
                className=\"block w-full pl-7 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
              />
            </div>
          </FormField>
        </div>
      </section>

      {/* Campaign Period */}
      <section>
        <h2 className=\"text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2\">
          Campaign Period
          <span className=\"text-sm font-normal text-gray-500 ml-2\">(Optional)</span>
        </h2>
        
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          {/* Campaign Start Date */}
          <FormField
            label=\"Campaign Start Date\"
            optional
            error={errors.campaign_start_date?.message}
          >
            <input
              type=\"date\"
              {...register('campaign_start_date')}
              className=\"mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
            />
          </FormField>

          {/* Campaign End Date */}
          <FormField
            label=\"Campaign End Date\"
            optional
            error={errors.campaign_end_date?.message}
          >
            <input
              type=\"date\"
              {...register('campaign_end_date')}
              className=\"mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
            />
          </FormField>
        </div>
        
        {/* Campaign date validation error */}
        {errors.campaign_end_date && (
          <FormError message={errors.campaign_end_date.message} />
        )}
      </section>

      {/* Channel Allocation - only show for Channel scope */}
      {scope === 'Channel' && (
        <section>
          <h2 className=\"text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2\">
            Channel Allocation
          </h2>
          
          <ChannelAllocator totalAmount={totalAmount || 0} />
          
          {/* Allocation validation errors */}
          {errors.allocations && (
            <div className=\"mt-4\">
              <FormError message={errors.allocations.message || 'Please check channel allocation values'} />
            </div>
          )}
        </section>
      )}

      {/* AllStyle Information */}
      {scope === 'AllStyle' && (
        <section>
          <div className=\"bg-blue-50 border border-blue-200 rounded-md p-4\">
            <div className=\"flex\">
              <div className=\"flex-shrink-0\">
                <svg className=\"h-5 w-5 text-blue-400\" viewBox=\"0 0 20 20\" fill=\"currentColor\">
                  <path fillRule=\"evenodd\" d=\"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z\" clipRule=\"evenodd\" />
                </svg>
              </div>
              <div className=\"ml-3\">
                <h3 className=\"text-sm font-medium text-blue-800\">
                  All Style Funding
                </h3>
                <div className=\"mt-2 text-sm text-blue-700\">
                  <p>
                    This contract covers all channels for the selected style. The full amount of{' '}
                    <span className=\"font-medium\">
                      ${totalAmount ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    </span>
                    {' '}will be available across both Inline and E-commerce channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form Summary */}
      <section className=\"bg-gray-50 rounded-lg p-6\">
        <h3 className=\"text-base font-semibold text-gray-900 mb-4\">Contract Summary</h3>
        
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm\">
          <div>
            <span className=\"text-gray-600\">Style:</span>
            <span className=\"ml-2 font-medium\">{watch('style_number') || 'Not selected'}</span>
          </div>
          
          <div>
            <span className=\"text-gray-600\">Funding Type:</span>
            <span className=\"ml-2 font-medium\">
              {scope === 'Channel' ? 'Channel Specific' : 'All Style'}
            </span>
          </div>
          
          <div>
            <span className=\"text-gray-600\">Total Amount:</span>
            <span className=\"ml-2 font-medium\">
              ${totalAmount ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          
          <div>
            <span className=\"text-gray-600\">Contract Date:</span>
            <span className=\"ml-2 font-medium\">{watch('contract_date') || 'Not set'}</span>
          </div>
          
          {scope === 'Channel' && totalAmount > 0 && (
            <>
              <div>
                <span className=\"text-gray-600\">Inline Allocation:</span>
                <span className=\"ml-2 font-medium\">
                  ${(watch('allocations.inline_amount') || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {' '}({watch('allocations.inline_percentage') || 0}%)
                </span>
              </div>
              
              <div>
                <span className=\"text-gray-600\">E-commerce Allocation:</span>
                <span className=\"ml-2 font-medium\">
                  ${(watch('allocations.ecomm_amount') || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {' '}({watch('allocations.ecomm_percentage') || 0}%)
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}