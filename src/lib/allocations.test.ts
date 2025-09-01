import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getAllocationUtilization,
  getAllocationSummaryByChannel,
  getAllocationsNearingLimit,
  validateAllocationAmounts
} from './allocations';
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

describe('Allocation Service Functions', () => {
  const mockQuery = vi.mocked(query);
  const mockAuditLog = vi.mocked(auditLog);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllocations', () => {
    it('should return allocations with default pagination', async () => {
      const mockAllocations = [
        {
          allocation_id: 1,
          mdf_id: 1,
          channel_code: 'Inline',
          allocated_amount: 5000,
          spent_amount: 1000,
          remaining_balance: 4000
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockAllocations }) // Main query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] }); // Count query

      const result = await getAllocations();

      expect(result).toEqual({
        allocations: mockAllocations,
        total: 1
      });
    });

    it('should filter by contract ID', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await getAllocations({ contractId: 123 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ab.mdf_id = $3'),
        [50, 0, 123]
      );
    });

    it('should filter by channel code', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await getAllocations({ channelCode: 'Ecomm' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ab.channel_code = $3'),
        [50, 0, 'Ecomm']
      );
    });
  });

  describe('getAllocationById', () => {
    it('should return allocation when found', async () => {
      const mockAllocation = {
        allocation_id: 1,
        mdf_id: 1,
        channel_code: 'Inline',
        allocated_amount: 5000,
        spent_amount: 1000,
        remaining_balance: 4000
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockAllocation] });

      const result = await getAllocationById(1);

      expect(result).toEqual(mockAllocation);
    });

    it('should return null when allocation not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getAllocationById(999);

      expect(result).toBeNull();
    });
  });

  describe('createAllocation', () => {
    it('should create allocation successfully', async () => {
      const mockAllocation = {
        allocation_id: 1,
        mdf_id: 1,
        channel_code: 'Inline',
        allocated_amount: 5000
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ mdf_id: 1, total_committed_amount: 10000 }] }) // Contract check
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockAllocation] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await createAllocation(1, 'Inline', 5000, 'test@example.com');

      expect(result).toEqual({ success: true, allocation: mockAllocation });
      expect(mockAuditLog).toHaveBeenCalledWith({
        contract_id: 1,
        action_type: 'allocation_create',
        user_id: 'test@example.com',
        action_data: expect.objectContaining({
          allocation_id: 1,
          channel_code: 'Inline',
          allocated_amount: 5000
        })
      });
    });

    it('should throw error when contract not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Contract check fails

      await expect(createAllocation(999, 'Inline', 5000, 'test@example.com'))
        .rejects.toThrow('Contract not found');
    });

    it('should rollback transaction on error', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ mdf_id: 1 }] }) // Contract check
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // INSERT fails

      await expect(createAllocation(1, 'Inline', 5000, 'test@example.com'))
        .rejects.toThrow('Database error');

      expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('updateAllocation', () => {
    it('should update allocation successfully', async () => {
      const mockCurrentAllocation = {
        allocation_id: 1,
        allocated_amount: 5000
      };
      const mockUpdatedAllocation = {
        allocation_id: 1,
        mdf_id: 1,
        allocated_amount: 7000
      };

      // Mock getAllocationById
      mockQuery.mockResolvedValueOnce({ rows: [mockCurrentAllocation] });

      // Mock transaction operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockUpdatedAllocation] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await updateAllocation(1, 7000, 'test@example.com');

      expect(result.success).toBe(true);
      expect(mockAuditLog).toHaveBeenCalledWith({
        contract_id: 1,
        action_type: 'allocation_update',
        user_id: 'test@example.com',
        action_data: expect.objectContaining({
          allocation_id: 1,
          before: { allocated_amount: 5000 },
          after: { allocated_amount: 7000 }
        })
      });
    });

    it('should throw error when allocation not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // getAllocationById returns null

      await expect(updateAllocation(999, 5000, 'test@example.com'))
        .rejects.toThrow('Allocation not found');
    });
  });

  describe('deleteAllocation', () => {
    it('should delete allocation successfully', async () => {
      const mockAllocation = {
        allocation_id: 1,
        mdf_id: 1,
        channel_code: 'Inline'
      };

      // Mock getAllocationById
      mockQuery.mockResolvedValueOnce({ rows: [mockAllocation] });

      // Mock transaction operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // DELETE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await deleteAllocation(1, 'test@example.com');

      expect(result).toEqual({ success: true });
      expect(mockAuditLog).toHaveBeenCalledWith({
        contract_id: 1,
        action_type: 'allocation_delete',
        user_id: 'test@example.com',
        action_data: expect.objectContaining({
          deleted_allocation: mockAllocation
        })
      });
    });
  });

  describe('getAllocationUtilization', () => {
    it('should return utilization data for all contracts', async () => {
      const mockUtilization = [
        {
          allocation_id: 1,
          channel_code: 'Inline',
          allocated_amount: 5000,
          spent_amount: 2500,
          utilization_percentage: 50.00
        }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockUtilization });

      const result = await getAllocationUtilization();

      expect(result).toEqual(mockUtilization);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.not.stringContaining('WHERE'),
        []
      );
    });

    it('should filter by contract ID when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getAllocationUtilization(123);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ab.mdf_id = $1'),
        [123]
      );
    });
  });

  describe('getAllocationSummaryByChannel', () => {
    it('should return summary data by channel', async () => {
      const mockSummary = [
        {
          channel_code: 'Inline',
          allocation_count: 5,
          total_allocated: 25000,
          total_spent: 10000,
          total_remaining: 15000,
          avg_utilization_percentage: 40.00
        },
        {
          channel_code: 'Ecomm',
          allocation_count: 3,
          total_allocated: 15000,
          total_spent: 9000,
          total_remaining: 6000,
          avg_utilization_percentage: 60.00
        }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockSummary });

      const result = await getAllocationSummaryByChannel();

      expect(result).toEqual(mockSummary);
    });
  });

  describe('getAllocationsNearingLimit', () => {
    it('should return allocations above threshold', async () => {
      const mockNearingLimit = [
        {
          allocation_id: 1,
          utilization_percentage: 95.00,
          allocated_amount: 5000,
          spent_amount: 4750
        }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockNearingLimit });

      const result = await getAllocationsNearingLimit(90);

      expect(result).toEqual(mockNearingLimit);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('(ab.spent_amount / ab.allocated_amount * 100) >= $1'),
        [90]
      );
    });

    it('should use default threshold of 90%', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getAllocationsNearingLimit();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        [90]
      );
    });
  });

  describe('validateAllocationAmounts', () => {
    it('should return validation data for fully allocated contract', async () => {
      const mockValidation = {
        mdf_id: 1,
        total_committed_amount: '10000.00',
        total_allocated: '10000.00',
        remaining_to_allocate: '0.00'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockValidation] });

      const result = await validateAllocationAmounts(1);

      expect(result).toEqual({
        contract_id: 1,
        total_committed_amount: 10000,
        total_allocated: 10000,
        remaining_to_allocate: 0,
        is_fully_allocated: true,
        is_over_allocated: false
      });
    });

    it('should detect over-allocated contract', async () => {
      const mockValidation = {
        mdf_id: 1,
        total_committed_amount: '10000.00',
        total_allocated: '12000.00',
        remaining_to_allocate: '-2000.00'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockValidation] });

      const result = await validateAllocationAmounts(1);

      expect(result.is_over_allocated).toBe(true);
      expect(result.is_fully_allocated).toBe(false);
    });

    it('should detect under-allocated contract', async () => {
      const mockValidation = {
        mdf_id: 1,
        total_committed_amount: '10000.00',
        total_allocated: '8000.00',
        remaining_to_allocate: '2000.00'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockValidation] });

      const result = await validateAllocationAmounts(1);

      expect(result.is_over_allocated).toBe(false);
      expect(result.is_fully_allocated).toBe(false);
      expect(result.remaining_to_allocate).toBe(2000);
    });

    it('should throw error when contract not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(validateAllocationAmounts(999))
        .rejects.toThrow('Contract not found');
    });
  });
});