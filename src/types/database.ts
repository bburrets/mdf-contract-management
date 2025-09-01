// Database entity types

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'operations' | 'finance' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

export interface UserInsert {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role?: 'operations' | 'finance' | 'admin';
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  password_hash?: string;
  full_name?: string;
  role?: 'operations' | 'finance' | 'admin';
  is_active?: boolean;
  last_login?: string;
}

export interface UserPublic {
  user_id: string;
  email: string;
  full_name: string;
  role: 'operations' | 'finance' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

export type UserRole = 'operations' | 'finance' | 'admin';

export interface Migration {
  id: number;
  filename: string;
  version: number;
  executed_at: string;
}

export interface Contract {
  id: number;
  filename: string;
  originalText: string;
  processedData?: Record<string, unknown>;
  uploadedBy: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface Style {
  id: number;
  code: string;
  description: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundingAllocation {
  id: number;
  contractId: number;
  styleId: number;
  amount: number;
  allocationDate: Date;
  notes?: string;
}

export interface ContractStyle {
  id: number;
  contractId: number;
  styleId: number;
  confidence: number;
  extractedText: string;
  validationStatus: 'pending' | 'approved' | 'rejected';
  validatedBy?: number;
  validatedAt?: Date;
}