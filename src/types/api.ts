// API request/response types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Contract upload types
export interface ContractUploadRequest {
  filename: string;
  fileData: string; // Base64 encoded file data
  contentType: string;
}

export interface ContractUploadResponse {
  contractId: number;
  filename: string;
  status: string;
  message: string;
}

// Style matching types
export interface StyleMatchRequest {
  contractId: number;
  text: string;
}

export interface StyleMatchResponse {
  matches: Array<{
    styleId: number;
    styleCode: string;
    confidence: number;
    extractedText: string;
  }>;
}

// Health check types
export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  database: 'connected' | 'disconnected' | 'error';
  environment: string;
  error?: string;
}