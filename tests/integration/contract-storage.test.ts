import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as contractsGET, POST as contractsPOST } from '@/app/api/contracts/route';
import { GET as contractDetailGET, PUT as contractDetailPUT, DELETE as contractDetailDELETE } from '@/app/api/contracts/[id]/route';
import { GET as allocationsGET, POST as allocationsPOST } from '@/app/api/allocations/route';
import { GET as auditGET } from '@/app/api/audit/route';

// Mock NextAuth session for authenticated requests  
const mockSession = {
  user: { email: 'test@example.com' }
};

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSession))
}));

// Mock audit logging
vi.mock('@/lib/audit', () => ({
  auditLog: vi.fn(() => Promise.resolve()),
  getAuditTrail: vi.fn(() => Promise.resolve({
    entries: [],
    total: 0
  }))
}));

// Mock database connection
const mockDbResults: Record<string, any> = {
  contracts: [],
  allocations: [],
  audit: []
};

vi.mock('@/lib/db', () => ({
  query: vi.fn((sql: string, params?: any[]) => {
    // Simulate different database responses based on query patterns
    if (sql.includes('mdf_contracts') && sql.includes('SELECT')) {
      return Promise.resolve({ rows: mockDbResults.contracts });
    }
    if (sql.includes('allocations') && sql.includes('SELECT')) {
      return Promise.resolve({ rows: mockDbResults.allocations });
    }
    if (sql.includes('processing_audit') && sql.includes('SELECT')) {
      return Promise.resolve({ rows: mockDbResults.audit });
    }
    if (sql.includes('INSERT') && sql.includes('mdf_contracts')) {
      return Promise.resolve({ rows: [{ mdf_id: 1 }] });
    }
    if (sql.includes('INSERT') && sql.includes('allocations')) {
      return Promise.resolve({ rows: [{ allocation_id: 1 }] });
    }
    if (sql.includes('COUNT')) {
      return Promise.resolve({ rows: [{ total: 0 }] });
    }
    return Promise.resolve({ rows: [] });
  })
}));

describe('Contract Storage API Integration Tests', () => {
  beforeEach(() => {
    // Reset mock data
    mockDbResults.contracts = [];
    mockDbResults.allocations = [];
    mockDbResults.audit = [];
  });

  describe('Contracts API', () => {
    describe('GET /api/contracts', () => {
      it('should return empty list when no contracts exist', async () => {
        const request = new NextRequest('http://localhost/api/contracts');
        const response = await contractsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.contracts).toEqual([]);
      });

      it('should return contracts when they exist', async () => {
        mockDbResults.contracts = [
          {
            mdf_id: 1,
            style_number: 'STY001',
            scope: 'Channel',
            customer: 'Test Customer',
            total_committed_amount: 10000,
            contract_date: '2024-01-01',
            allocations: []
          }
        ];

        const request = new NextRequest('http://localhost/api/contracts');
        const response = await contractsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.contracts).toHaveLength(1);
        expect(data.contracts[0].style_number).toBe('STY001');
      });

      it('should handle pagination parameters', async () => {
        const request = new NextRequest('http://localhost/api/contracts?limit=10&offset=20');
        const response = await contractsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limit).toBe(10);
        expect(data.offset).toBe(20);
      });
    });

    describe('POST /api/contracts', () => {
      it('should create a new contract successfully', async () => {
        const contractData = {
          style_number: 'STY001',
          scope: 'Channel',
          customer: 'Test Customer',
          total_committed_amount: 10000,
          contract_date: '2024-01-01',
          allocations: {
            inline_amount: 6000,
            ecomm_amount: 4000
          },
          created_by: 'test@example.com'
        };

        // Mock style exists validation
        vi.mocked(require('@/lib/db').query)
          .mockResolvedValueOnce({ rows: [{ style_number: 'STY001' }] }) // Style exists
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ mdf_id: 1 }] }) // Contract insert
          .mockResolvedValueOnce({ rows: [{ allocation_id: 1 }] }) // Inline allocation
          .mockResolvedValueOnce({ rows: [{ allocation_id: 2 }] }) // Ecomm allocation
          .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const request = new NextRequest('http://localhost/api/contracts', {
          method: 'POST',
          body: JSON.stringify(contractData)
        });

        const response = await contractsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.contract_id).toBe(1);
      });

      it('should return validation error for invalid data', async () => {
        const invalidData = {
          // Missing required fields
          scope: 'Channel'
        };

        const request = new NextRequest('http://localhost/api/contracts', {
          method: 'POST',
          body: JSON.stringify(invalidData)
        });

        const response = await contractsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
      });

      it('should return error for non-existent style', async () => {
        const contractData = {
          style_number: 'INVALID',
          scope: 'Channel',
          total_committed_amount: 10000,
          contract_date: '2024-01-01',
          allocations: {
            inline_amount: 6000,
            ecomm_amount: 4000
          },
          created_by: 'test@example.com'
        };

        // Mock style not found
        vi.mocked(require('@/lib/db').query)
          .mockResolvedValueOnce({ rows: [] }); // Style doesn't exist

        const request = new NextRequest('http://localhost/api/contracts', {
          method: 'POST',
          body: JSON.stringify(contractData)
        });

        const response = await contractsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors.style_number).toContain('does not exist');
      });
    });
  });

  describe('Contract Details API', () => {
    describe('GET /api/contracts/[id]', () => {
      it('should return contract details when found', async () => {
        mockDbResults.contracts = [{
          mdf_id: 1,
          style_number: 'STY001',
          scope: 'Channel',
          total_committed_amount: 10000,
          allocations: []
        }];

        const request = new NextRequest('http://localhost/api/contracts/1');
        const response = await contractDetailGET(request, { params: { id: '1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.contract.mdf_id).toBe(1);
      });

      it('should return 404 when contract not found', async () => {
        const request = new NextRequest('http://localhost/api/contracts/999');
        const response = await contractDetailGET(request, { params: { id: '999' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.message).toContain('not found');
      });

      it('should return 400 for invalid ID', async () => {
        const request = new NextRequest('http://localhost/api/contracts/invalid');
        const response = await contractDetailGET(request, { params: { id: 'invalid' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Invalid contract ID');
      });
    });

    describe('PUT /api/contracts/[id]', () => {
      it('should update contract successfully', async () => {
        const updateData = {
          customer: 'Updated Customer',
          total_committed_amount: 15000
        };

        // Mock contract exists and update
        vi.mocked(require('@/lib/db').query)
          .mockResolvedValueOnce({ rows: [{ mdf_id: 1, customer: 'Old Customer' }] }) // Current contract
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ mdf_id: 1, customer: 'Updated Customer' }] }) // UPDATE
          .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const request = new NextRequest('http://localhost/api/contracts/1', {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        const response = await contractDetailPUT(request, { params: { id: '1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.contract.customer).toBe('Updated Customer');
      });
    });

    describe('DELETE /api/contracts/[id]', () => {
      it('should delete contract successfully', async () => {
        // Mock contract exists and deletion
        vi.mocked(require('@/lib/db').query)
          .mockResolvedValueOnce({ rows: [{ mdf_id: 1, style_number: 'STY001' }] }) // Current contract
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // DELETE
          .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const request = new NextRequest('http://localhost/api/contracts/1', {
          method: 'DELETE'
        });

        const response = await contractDetailDELETE(request, { params: { id: '1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('deleted successfully');
      });
    });
  });

  describe('Allocations API', () => {
    describe('GET /api/allocations', () => {
      it('should return allocations with balance information', async () => {
        mockDbResults.allocations = [{
          allocation_id: 1,
          mdf_id: 1,
          channel_code: 'Inline',
          allocated_amount: 5000,
          spent_amount: 1000,
          remaining_balance: 4000
        }];

        const request = new NextRequest('http://localhost/api/allocations');
        const response = await allocationsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.allocations).toHaveLength(1);
        expect(data.allocations[0].remaining_balance).toBe(4000);
      });

      it('should filter by contract ID', async () => {
        const request = new NextRequest('http://localhost/api/allocations?contract_id=123');
        const response = await allocationsGET(request);

        expect(response.status).toBe(200);
        // Verify the query would be called with contract filter
      });
    });

    describe('POST /api/allocations', () => {
      it('should create allocation successfully', async () => {
        const allocationData = {
          mdf_id: 1,
          channel_code: 'Inline',
          allocated_amount: 5000
        };

        // Mock contract exists and allocation creation
        vi.mocked(require('@/lib/db').query)
          .mockResolvedValueOnce({ rows: [{ mdf_id: 1, total_committed_amount: 10000 }] }) // Contract exists
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ allocation_id: 1, ...allocationData }] }) // INSERT
          .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const request = new NextRequest('http://localhost/api/allocations', {
          method: 'POST',
          body: JSON.stringify(allocationData)
        });

        const response = await allocationsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.allocation.channel_code).toBe('Inline');
      });

      it('should return error for invalid channel code', async () => {
        const invalidData = {
          mdf_id: 1,
          channel_code: 'Invalid',
          allocated_amount: 5000
        };

        const request = new NextRequest('http://localhost/api/allocations', {
          method: 'POST',
          body: JSON.stringify(invalidData)
        });

        const response = await allocationsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Invalid channel_code');
      });
    });
  });

  describe('Audit API', () => {
    describe('GET /api/audit', () => {
      it('should return audit entries for authorized user', async () => {
        mockDbResults.audit = [{
          audit_id: 1,
          contract_id: 1,
          action_type: 'contract_create',
          user_id: 'test@example.com',
          timestamp: '2024-01-01T00:00:00Z'
        }];

        const request = new NextRequest('http://localhost/api/audit');
        const response = await auditGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.audit_entries).toHaveLength(1);
        expect(data.audit_entries[0].action_type).toBe('contract_create');
      });

      it('should require authentication', async () => {
        // Mock no session
        vi.mocked(require('next-auth').getServerSession).mockResolvedValueOnce(null);

        const request = new NextRequest('http://localhost/api/audit');
        const response = await auditGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Unauthorized');
      });

      it('should filter by contract ID', async () => {
        const request = new NextRequest('http://localhost/api/audit?contract_id=123');
        const response = await auditGET(request);

        expect(response.status).toBe(200);
        // Verify filtering would be applied
      });
    });
  });
});