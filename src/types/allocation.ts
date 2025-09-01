// Allocation-related type definitions

export interface Allocation {
  allocation_id: number;
  mdf_id: number;
  channel_code: 'Inline' | 'Ecomm';
  allocated_amount: number;
  created_at: string;
  updated_at: string;
}

export interface AllocationWithBalance extends Allocation {
  spent_amount: number;
  remaining_balance: number;
  style_number?: string;
  customer?: string;
  contract_date?: string;
  item_desc?: string;
  season?: string;
  business_line?: string;
}

export interface AllocationSummary {
  channel_code: 'Inline' | 'Ecomm';
  allocation_count: number;
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  avg_utilization_percentage: number;
}

export interface AllocationUtilization extends AllocationWithBalance {
  utilization_percentage: number;
}

export interface AllocationValidation {
  contract_id: number;
  total_committed_amount: number;
  total_allocated: number;
  remaining_to_allocate: number;
  is_fully_allocated: boolean;
  is_over_allocated: boolean;
}

// API request/response types for allocations
export interface CreateAllocationRequest {
  mdf_id: number;
  channel_code: 'Inline' | 'Ecomm';
  allocated_amount: number;
}

export interface UpdateAllocationRequest {
  allocated_amount: number;
}

export interface AllocationListResponse {
  success: boolean;
  allocations: AllocationWithBalance[];
  total: number;
  limit: number;
  offset: number;
}

export interface AllocationResponse {
  success: boolean;
  allocation?: AllocationWithBalance;
  message?: string;
}

export interface AllocationCreateResponse {
  success: boolean;
  allocation?: Allocation;
  message?: string;
}

// Channel-specific types
export type ChannelCode = 'Inline' | 'Ecomm';

export const CHANNEL_LABELS: Record<ChannelCode, string> = {
  Inline: 'Inline Stores',
  Ecomm: 'E-commerce'
};

export const CHANNEL_COLORS: Record<ChannelCode, string> = {
  Inline: 'blue',
  Ecomm: 'green'
};

// Allocation filter parameters
export interface AllocationFilters {
  contractId?: number;
  channelCode?: ChannelCode;
  utilizationThreshold?: number;
}