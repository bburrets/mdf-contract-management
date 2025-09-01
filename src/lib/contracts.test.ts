import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  validateContractData,
  exportContractData
} from './contracts';
import { query } from './db';
import { auditLog } from './audit';

// Mock the database query function
vi.mock('./db', () => ({
  query: vi.fn()
}));

// Mock the audit logging function
vi.mock('./audit', () => ({
  auditLog: vi.fn()
}));

describe('Contract Service Functions', () => {
  const mockQuery = vi.mocked(query);
  const mockAuditLog = vi.mocked(auditLog);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getContracts', () => {
    it('should return contracts with default pagination', async () => {
      const mockContracts = [
        {
          mdf_id: 1,
          style_number: 'STY001',
          scope: 'Channel',
          total_committed_amount: 10000,
          allocations: []
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockContracts }) // Main query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] }); // Count query

      const result = await getContracts();

      expect(result).toEqual({
        contracts: mockContracts,
        total: 1
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should filter contracts by style', async () => {
      const mockContracts = [];
      mockQuery
        .mockResolvedValueOnce({ rows: mockContracts })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      const result = await getContracts({ style: 'STY001' });

      expect(result.contracts).toEqual(mockContracts);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%STY001%'])
      );
    });

    it('should apply pagination parameters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await getContracts({ limit: 10, offset: 20 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        expect.arrayContaining([10, 20])
      );
    });
  });

  describe('getContractById', () => {
    it('should return contract when found', async () => {
      const mockContract = {
        mdf_id: 1,
        style_number: 'STY001',
        scope: 'Channel',
        total_committed_amount: 10000,
        allocations: []
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockContract] });

      const result = await getContractById(1);

      expect(result).toEqual(mockContract);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.mdf_id = $1'),
        [1]
      );
    });

    it('should return null when contract not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getContractById(999);

      expect(result).toBeNull();
    });
  });

  describe('createContract', () => {
    const mockContractData = {
      style_number: 'STY001',
      scope: 'Channel' as const,
      customer: 'Test Customer',
      total_committed_amount: 10000,
      contract_date: '2024-01-01',
      campaign_start_date: '2024-02-01',
      campaign_end_date: '2024-03-01',
      created_by: 'test@example.com',
      allocations: {
        inline_amount: 6000,
        ecomm_amount: 4000
      }
    };

    it('should create contract with allocations successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ mdf_id: 1 }] }) // Contract insert
        .mockResolvedValueOnce({ rows: [{ allocation_id: 1 }] }) // Inline allocation
        .mockResolvedValueOnce({ rows: [{ allocation_id: 2 }] }) // Ecomm allocation
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await createContract(mockContractData);

      expect(result).toEqual({ success: true, contract_id: 1 });
      expect(mockQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockQuery).toHaveBeenCalledWith('COMMIT');
      expect(mockAuditLog).toHaveBeenCalledWith({
        contract_id: 1,
        action_type: 'contract_create',
        user_id: 'test@example.com',
        action_data: expect.objectContaining({
          contract_id: 1,
          style_number: 'STY001',
          allocation_ids: [1, 2]
        })
      });
    });

    it('should rollback transaction on error', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // Contract insert fails

      await expect(createContract(mockContractData)).rejects.toThrow('Database error');
      expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should not create allocations for AllStyle scope', async () => {
      const allStyleData = { ...mockContractData, scope: 'AllStyle' as const };
      
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ mdf_id: 1 }] }) // Contract insert
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await createContract(allStyleData);

      expect(result).toEqual({ success: true, contract_id: 1 });
      // Should not attempt to create allocations
      expect(mockQuery).toHaveBeenCalledTimes(3); // BEGIN, INSERT, COMMIT only
    });
  });

  describe('updateContract', () => {
    it('should update contract successfully', async () => {
      const mockCurrentContract = {
        mdf_id: 1,
        customer: 'Old Customer',
        total_committed_amount: 5000
      };
      const updateData = {
        customer: 'New Customer',
        total_committed_amount: 15000
      };

      // Mock getContractById
      mockQuery.mockResolvedValueOnce({ rows: [mockCurrentContract] });

      // Mock transaction operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ ...mockCurrentContract, ...updateData }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await updateContract(1, updateData, 'test@example.com');

      expect(result.success).toBe(true);
      expect(mockAuditLog).toHaveBeenCalledWith({
        contract_id: 1,
        action_type: 'contract_update',
        user_id: 'test@example.com',
        action_data: expect.objectContaining({
          changes: ['customer', 'total_committed_amount']
        })
      });
    });

    it('should throw error when contract not found', async () => {
      // Mock getContractById returning null
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(updateContract(999, {}, 'test@example.com'))
        .rejects.toThrow('Contract not found');
    });
  });

  describe('deleteContract', () => {
    it('should delete contract successfully', async () => {
      const mockContract = { mdf_id: 1, style_number: 'STY001' };

      // Mock getContractById
      mockQuery.mockResolvedValueOnce({ rows: [mockContract] });

      // Mock transaction operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // DELETE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await deleteContract(1, 'test@example.com');

      expect(result).toEqual({ success: true });
      expect(mockAuditLog).toHaveBeenCalledWith({
        contract_id: 1,
        action_type: 'contract_delete',
        user_id: 'test@example.com',
        action_data: expect.objectContaining({
          deleted_contract: mockContract
        })
      });
    });
  });

  describe('validateContractData', () => {
    const validContractData = {
      style_number: 'STY001',
      scope: 'Channel' as const,
      total_committed_amount: 10000,
      contract_date: '2024-01-01',
      allocations: {
        inline_amount: 6000,
        ecomm_amount: 4000
      }
    };

    it('should validate correct contract data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ style_number: 'STY001' }] });

      const result = await validateContractData(validContractData);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return error for non-existent style', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await validateContractData(validContractData);

      expect(result.valid).toBe(false);
      expect(result.errors.style_number).toContain('does not exist');
    });

    it('should validate allocation totals', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ style_number: 'STY001' }] });

      const invalidData = {
        ...validContractData,
        allocations: {
          inline_amount: 5000,
          ecomm_amount: 3000 // Total: 8000, but committed is 10000
        }
      };

      const result = await validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.allocations).toContain('must equal total');
    });

    it('should validate campaign date range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ style_number: 'STY001' }] });

      const invalidData = {
        ...validContractData,
        campaign_start_date: '2024-03-01',
        campaign_end_date: '2024-02-01' // End before start
      };

      const result = await validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.campaign_end_date).toContain('after start date');
    });
  });

  describe('exportContractData', () => {
    it('should export contract data for given IDs', async () => {
      const mockExportData = [
        { mdf_id: 1, style_number: 'STY001', channel_code: 'Inline' },
        { mdf_id: 1, style_number: 'STY001', channel_code: 'Ecomm' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockExportData });

      const result = await exportContractData([1, 2]);

      expect(result).toEqual(mockExportData);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.mdf_id IN ($1, $2)'),
        [1, 2]
      );
    });

    it('should return empty array for empty input', async () => {
      const result = await exportContractData([]);

      expect(result).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});