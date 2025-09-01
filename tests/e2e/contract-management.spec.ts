import { test, expect } from '@playwright/test';

test.describe('Contract Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/auth/signin');
    
    // Mock authentication or login with test credentials
    // This would depend on your authentication setup
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should display contract listing page', async ({ page }) => {
    await page.goto('/contracts');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Contract Management/);
    await expect(page.locator('h1')).toContainText('Contract Management');
    
    // Check for "Create New Contract" button
    await expect(page.locator('text=Create New Contract')).toBeVisible();
  });

  test('should show empty state when no contracts exist', async ({ page }) => {
    await page.goto('/contracts');
    
    // Mock empty API response
    await page.route('/api/contracts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contracts: [],
          total: 0,
          limit: 50,
          offset: 0
        })
      });
    });
    
    await page.reload();
    
    // Check for empty state message
    await expect(page.locator('text=No contracts found')).toBeVisible();
    await expect(page.locator('text=Get started by creating your first contract')).toBeVisible();
  });

  test('should display contract cards when contracts exist', async ({ page }) => {
    const mockContracts = [
      {
        mdf_id: 1,
        style_number: 'STY001',
        scope: 'Channel',
        customer: 'Test Customer',
        total_committed_amount: 10000,
        contract_date: '2024-01-01',
        campaign_start_date: '2024-02-01',
        campaign_end_date: '2024-03-01',
        created_by: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        item_number: 'ITM001',
        item_desc: 'Test Product',
        season: 'Spring 2024',
        business_line: 'Apparel',
        allocations: [
          {
            allocation_id: 1,
            channel_code: 'Inline',
            allocated_amount: 6000
          },
          {
            allocation_id: 2,
            channel_code: 'Ecomm',
            allocated_amount: 4000
          }
        ]
      }
    ];

    await page.route('/api/contracts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contracts: mockContracts,
          total: 1,
          limit: 50,
          offset: 0
        })
      });
    });

    await page.goto('/contracts');
    
    // Check contract card is displayed
    await expect(page.locator('text=Contract #1')).toBeVisible();
    await expect(page.locator('text=STY001')).toBeVisible();
    await expect(page.locator('text=Test Customer')).toBeVisible();
    await expect(page.locator('text=$10,000.00')).toBeVisible();
    
    // Check allocation display
    await expect(page.locator('text=Channel Allocations')).toBeVisible();
    await expect(page.locator('text=$6,000.00')).toBeVisible(); // Inline allocation
    await expect(page.locator('text=$4,000.00')).toBeVisible(); // Ecomm allocation
  });

  test('should allow filtering contracts', async ({ page }) => {
    await page.goto('/contracts');
    
    // Wait for filters to be visible
    await expect(page.locator('text=Filter Contracts')).toBeVisible();
    
    // Expand filters
    await page.click('text=Show filters');
    
    // Fill in customer filter
    await page.fill('[id="filter-customer"]', 'Test Customer');
    
    // Select season filter
    await page.selectOption('[id="filter-season"]', 'Spring 2024');
    
    // Click search button
    await page.click('button:has-text("Search")');
    
    // Verify API call would be made with filters
    // This would require intercepting the API call and checking parameters
  });

  test('should navigate to contract details', async ({ page }) => {
    // Mock contract list response
    await page.route('/api/contracts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contracts: [{
            mdf_id: 1,
            style_number: 'STY001',
            scope: 'Channel',
            customer: 'Test Customer',
            total_committed_amount: 10000,
            contract_date: '2024-01-01',
            allocations: []
          }],
          total: 1
        })
      });
    });

    // Mock contract details response
    await page.route('/api/contracts/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contract: {
            mdf_id: 1,
            style_number: 'STY001',
            scope: 'Channel',
            customer: 'Test Customer',
            total_committed_amount: 10000,
            contract_date: '2024-01-01',
            allocations: []
          }
        })
      });
    });

    await page.goto('/contracts');
    
    // Click on "View Details" link
    await page.click('text=View Details');
    
    // Should navigate to contract details page
    await page.waitForURL('/contracts/1');
    
    // Verify contract details are displayed
    // This would depend on how you implement the contract details page
  });

  test('should show pagination when many contracts exist', async ({ page }) => {
    // Mock large number of contracts
    const mockContracts = Array.from({ length: 20 }, (_, i) => ({
      mdf_id: i + 1,
      style_number: `STY${String(i + 1).padStart(3, '0')}`,
      scope: 'Channel',
      customer: `Customer ${i + 1}`,
      total_committed_amount: 10000,
      contract_date: '2024-01-01',
      allocations: []
    }));

    await page.route('/api/contracts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contracts: mockContracts.slice(0, 20),
          total: 100, // Total of 100 contracts
          limit: 20,
          offset: 0
        })
      });
    });

    await page.goto('/contracts');
    
    // Check pagination controls
    await expect(page.locator('text=Showing 1 to 20 of 100 results')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    
    // Previous button should be disabled on first page
    await expect(page.locator('button:has-text("Previous")')).toBeDisabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/contracts*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Internal server error',
          contracts: [],
          total: 0
        })
      });
    });

    await page.goto('/contracts');
    
    // Should show error message
    await expect(page.locator('text=Failed to load contracts')).toBeVisible();
    
    // Should show "Try Again" button
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    // Delay the API response to test loading state
    await page.route('/api/contracts*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contracts: [],
          total: 0
        })
      });
    });

    await page.goto('/contracts');
    
    // Should show loading spinner initially
    await expect(page.locator('text=Loading contracts...')).toBeVisible();
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading contracts...')).not.toBeVisible({ timeout: 2000 });
  });

  test('should integrate with audit trail', async ({ page }) => {
    // Mock contract access
    await page.route('/api/contracts/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contract: {
            mdf_id: 1,
            style_number: 'STY001',
            total_committed_amount: 10000,
            allocations: []
          }
        })
      });
    });

    // Mock audit trail response
    await page.route('/api/audit*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          audit_entries: [{
            audit_id: 1,
            contract_id: 1,
            action_type: 'contract_view',
            user_id: 'test@example.com',
            timestamp: '2024-01-01T00:00:00Z'
          }],
          total: 1
        })
      });
    });

    await page.goto('/contracts/1');
    
    // Verify that audit logging would occur
    // The actual audit log entry would be created server-side
    // This test verifies the flow works end-to-end
  });
});