import { type ContractFormInput, type ContractDraft, type DraftSaveResponse } from '@/types/contract';

/**
 * Save a contract draft for the user
 * @param userId - The user ID
 * @param formData - The form data to save
 * @param existingDraftId - Optional existing draft ID to update
 * @returns Promise with save result
 */
export async function saveDraft(
  userId: string, 
  formData: ContractFormInput,
  existingDraftId?: number | null
): Promise<DraftSaveResponse> {
  try {
    const response = await fetch('/api/contracts/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        draft_id: existingDraftId,
        form_data: formData
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to save draft');
    }

    return result;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Load the most recent draft for a user
 * @param userId - The user ID
 * @returns Promise with draft data or null if no draft exists
 */
export async function loadDraft(userId: string): Promise<ContractDraft | null> {
  try {
    const response = await fetch(`/api/contracts/drafts?user_id=${userId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load draft');
    }

    return result.draft || null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Delete a draft by ID
 * @param draftId - The draft ID to delete
 * @returns Promise with deletion result
 */
export async function deleteDraft(draftId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/contracts/drafts/${draftId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete draft');
    }

    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}

/**
 * Validate if form data is worth saving as a draft
 * Only save if there's meaningful data entered
 * @param formData - The form data to validate
 * @returns True if draft should be saved
 */
export function shouldSaveDraft(formData: ContractFormInput): boolean {
  // Don't save if no meaningful data is entered
  if (!formData.style_number && 
      !formData.customer && 
      !formData.total_committed_amount &&
      !formData.campaign_start_date &&
      !formData.campaign_end_date) {
    return false;
  }

  // Don't save if only default values
  if (formData.total_committed_amount === 0 &&
      formData.allocations.inline_percentage === 50 &&
      formData.allocations.ecomm_percentage === 50) {
    return false;
  }

  return true;
}

/**
 * Clean up old drafts for a user (keep only the most recent)
 * @param userId - The user ID
 * @returns Promise with cleanup result
 */
export async function cleanupOldDrafts(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/contracts/drafts/cleanup?user_id=${userId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to cleanup drafts');
    }

    return true;
  } catch (error) {
    console.error('Error cleaning up drafts:', error);
    return false;
  }
}

/**
 * Get draft save status text for UI display
 * @param lastSaved - ISO string of last save time
 * @returns Human-readable save status
 */
export function getDraftSaveStatus(lastSaved: string): string {
  try {
    const saveTime = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - saveTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 30) {
      return 'Saved just now';
    } else if (diffSeconds < 60) {
      return `Saved ${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return `Saved ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return `Saved at ${saveTime.toLocaleTimeString()}`;
    }
  } catch (error) {
    return 'Save status unknown';
  }
}

/**
 * Compare two form data objects to detect changes
 * @param current - Current form data
 * @param saved - Previously saved form data
 * @returns True if there are meaningful changes
 */
export function hasFormDataChanged(
  current: ContractFormInput, 
  saved: ContractFormInput
): boolean {
  // Compare key fields that indicate meaningful changes
  const fieldsToCompare: (keyof ContractFormInput)[] = [
    'style_number',
    'scope',
    'customer',
    'total_committed_amount',
    'contract_date',
    'campaign_start_date',
    'campaign_end_date'
  ];

  for (const field of fieldsToCompare) {
    if (current[field] !== saved[field]) {
      return true;
    }
  }

  // Compare allocation data
  if (current.allocations.inline_amount !== saved.allocations.inline_amount ||
      current.allocations.ecomm_amount !== saved.allocations.ecomm_amount ||
      current.allocations.inline_percentage !== saved.allocations.inline_percentage ||
      current.allocations.ecomm_percentage !== saved.allocations.ecomm_percentage) {
    return true;
  }

  return false;
}

/**
 * Sanitize form data before saving to remove empty/default values
 * @param formData - Raw form data
 * @returns Cleaned form data
 */
export function sanitizeFormDataForSave(formData: ContractFormInput): ContractFormInput {
  return {
    ...formData,
    // Trim string values
    style_number: formData.style_number.trim(),
    customer: formData.customer?.trim() || '',
    // Ensure valid dates or empty strings
    contract_date: formData.contract_date || new Date().toISOString().split('T')[0],
    campaign_start_date: formData.campaign_start_date?.trim() || '',
    campaign_end_date: formData.campaign_end_date?.trim() || '',
    // Ensure allocation values are numbers
    allocations: {
      inline_amount: Number(formData.allocations.inline_amount) || 0,
      ecomm_amount: Number(formData.allocations.ecomm_amount) || 0,
      inline_percentage: Number(formData.allocations.inline_percentage) || 0,
      ecomm_percentage: Number(formData.allocations.ecomm_percentage) || 0,
    }
  };
}