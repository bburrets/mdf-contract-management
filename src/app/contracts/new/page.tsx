'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { contractFormSchema, type ContractFormInput } from '@/types/contract';
import FormField from '@/components/forms/FormField';
import FormButton from '@/components/forms/FormButton';
import FormError from '@/components/forms/FormError';
import StyleSelector from '@/components/contract/StyleSelector';
import ChannelAllocator from '@/components/contract/ChannelAllocator';

export default function NewContractPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [draftId, setDraftId] = useState<number | null>(null);

  // Initialize form with React Hook Form and Zod validation
  const methods = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      style_number: '',
      scope: 'Channel',
      customer: '',
      total_committed_amount: 0,
      contract_date: '',
      campaign_start_date: '',
      campaign_end_date: '',
      allocations: {
        inline_amount: 0,
        ecomm_amount: 0,
        inline_percentage: 50,
        ecomm_percentage: 50
      }
    }
  });

  const { 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, isDirty },
    trigger
  } = methods;

  const watchedValues = watch();

  // Auto-save draft functionality
  useEffect(() => {
    if (!session?.user?.email || !isDirty) return;

    const autoSaveTimer = setTimeout(async () => {
      if (saveStatus !== 'saving') {
        setSaveStatus('saving');
        try {
          const response = await fetch('/api/contracts/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: session.user.email,
              form_data: watchedValues
            })
          });

          const result = await response.json();
          
          if (result.success) {
            setDraftId(result.draft_id);
            setSaveStatus('saved');
          } else {
            setSaveStatus('error');
          }
        } catch (error) {
          setSaveStatus('error');
        }
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [watchedValues, session?.user?.email, isDirty, saveStatus]);

  // Load existing draft on component mount
  useEffect(() => {
    const loadExistingDraft = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch(`/api/contracts/drafts?user_id=${encodeURIComponent(session.user.email)}`);
        const result = await response.json();
        
        if (result.success && result.draft) {
          const formData = result.draft.form_data;
          Object.keys(formData).forEach(key => {
            setValue(key as keyof ContractFormInput, formData[key]);
          });
          setDraftId(result.draft.draft_id);
          setSaveStatus('saved');
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };

    loadExistingDraft();
  }, [session?.user?.email, setValue]);

  // Manual save functionality
  const handleSaveDraft = async () => {
    if (!session?.user?.email) return;
    
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/contracts/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.email,
          form_data: watchedValues
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDraftId(result.draft_id);
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    }
  };

  // Form submission
  const onSubmit = async (data: ContractFormInput) => {
    if (!session?.user?.email) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          created_by: session.user.email
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Clear draft after successful submission
        if (draftId) {
          await fetch(`/api/contracts/drafts/${draftId}`, {
            method: 'DELETE'
          });
        }
        router.push(`/contracts/${result.contract_id}`);
      } else {
        alert(result.message || 'Failed to create contract');
      }
    } catch (error) {
      alert('Failed to create contract');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New MDF Contract</h1>
          <p className="text-gray-600">Create a new Marketing Development Fund contract.</p>
          
          {/* Save Status Indicator */}
          <div className="mt-4 flex items-center gap-4">
            {saveStatus === 'saving' && (
              <span className="text-sm text-blue-600">Saving draft...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600">Draft saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">Failed to save draft</span>
            )}
            <FormButton
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saveStatus === 'saving'}
            >
              Save Draft
            </FormButton>
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Style Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Style Information</h2>
              <StyleSelector
                value={watchedValues.style_number}
                onChange={(styleNumber) => setValue('style_number', styleNumber, { shouldValidate: true })}
                error={errors.style_number?.message}
              />
            </div>

            {/* Contract Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Contract Date *"
                  type="date"
                  {...methods.register('contract_date')}
                  error={errors.contract_date?.message}
                />
                
                <FormField
                  label="Funding Type *"
                  type="select"
                  {...methods.register('scope')}
                  error={errors.scope?.message}
                >
                  <option value="Channel">Channel</option>
                  <option value="AllStyle">All Style</option>
                </FormField>

                <FormField
                  label="Total Amount *"
                  type="number"
                  step="0.01"
                  {...methods.register('total_committed_amount', { valueAsNumber: true })}
                  error={errors.total_committed_amount?.message}
                />

                <FormField
                  label="Customer"
                  type="text"
                  {...methods.register('customer')}
                  error={errors.customer?.message}
                />
              </div>
            </div>

            {/* Campaign Dates */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Campaign Start Date"
                  type="date"
                  {...methods.register('campaign_start_date')}
                  error={errors.campaign_start_date?.message}
                />
                
                <FormField
                  label="Campaign End Date"
                  type="date"
                  {...methods.register('campaign_end_date')}
                  error={errors.campaign_end_date?.message}
                />
              </div>
            </div>

            {/* Channel Allocation */}
            {watchedValues.scope === 'Channel' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Channel Allocation</h2>
                <ChannelAllocator
                  totalAmount={watchedValues.total_committed_amount || 0}
                  allocations={watchedValues.allocations}
                  onChange={(allocations) => setValue('allocations', allocations, { shouldValidate: true })}
                  error={errors.allocations?.message}
                />
              </div>
            )}

            {/* Form Errors */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h3>
                {Object.entries(errors).map(([field, error]) => (
                  <FormError key={field} error={error?.message} />
                ))}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <FormButton
                type="button"
                variant="outline"
                onClick={() => router.push('/contracts')}
              >
                Cancel
              </FormButton>
              <FormButton
                type="submit"
                disabled={isLoading || Object.keys(errors).length > 0}
              >
                {isLoading ? 'Creating Contract...' : 'Create Contract'}
              </FormButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}