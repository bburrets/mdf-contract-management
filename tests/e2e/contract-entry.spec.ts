import { test, expect } from '@playwright/test';

// Test data
const testContract = {
  styleNumber: 'STY001',
  customer: 'ACME Corporation',
  totalAmount: '5000',
  contractDate: '2024-03-01',
  campaignStartDate: '2024-04-01',
  campaignEndDate: '2024-05-01'
};

const testStyle = {
  style_number: 'STY001',
  item_number: 'ITM001',
  item_desc: 'Test Product 1',
  season: 'Spring 2024',
  business_line: 'Women'
};

test.describe('Contract Entry E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/styles/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          styles: [testStyle],
          total: 1
        })
      });
    });

    await page.route('**/api/contracts/validate*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          valid: true,
          errors: {},
          warnings: {},
          message: 'Validation passed'
        })
      });
    });

    await page.route('**/api/contracts/drafts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            drafts: [],
            total: 0
          })
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            draft_id: 1,
            message: 'Draft saved successfully'
          })
        });
      }
    });

    await page.route('**/api/contracts', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            contract_id: 123,
            message: 'Contract created successfully'
          })
        });
      }
    });

    // Navigate to contract form
    await page.goto('/contracts/new');
  });

  test('should complete full contract entry workflow', async ({ page }) => {
    // Step 1: Fill in style number with autocomplete
    const styleInput = page.getByPlaceholder('Search by style number, item number, or description...');
    await styleInput.click();
    await styleInput.fill('STY');
    
    // Wait for and select from autocomplete results
    await expect(page.getByText('STY001 - Test Product 1')).toBeVisible();
    await page.getByText('STY001 - Test Product 1').click();
    
    // Verify style selection
    await expect(styleInput).toHaveValue('STY001');

    // Step 2: Select scope and verify allocations appear
    await page.getByLabel('Channel').check();
    await expect(page.getByText('Channel Allocation')).toBeVisible();

    // Step 3: Fill in contract details
    await page.getByLabel('Customer').fill(testContract.customer);
    await page.getByLabel('Total Committed Amount').fill(testContract.totalAmount);
    await page.getByLabel('Contract Date').fill(testContract.contractDate);
    await page.getByLabel('Campaign Start Date').fill(testContract.campaignStartDate);
    await page.getByLabel('Campaign End Date').fill(testContract.campaignEndDate);

    // Step 4: Configure channel allocation
    // Use 60/40 preset
    await page.getByText('60/40').click();
    
    // Verify allocation amounts are calculated correctly
    await expect(page.getByLabelText('Inline Percentage')).toHaveValue('60');
    await expect(page.getByLabelText('Ecomm Percentage')).toHaveValue('40');
    
    // Switch to amount mode to verify amounts
    await page.getByText('Amount').click();
    await expect(page.getByLabelText('Inline Amount')).toHaveValue('3000');
    await expect(page.getByLabelText('Ecomm Amount')).toHaveValue('2000');

    // Step 5: Save draft manually
    await page.getByText('Save Draft').click();
    await expect(page.getByText(/Draft saved successfully/)).toBeVisible();

    // Step 6: Validate form
    await page.getByText('Validate Form').click();
    await expect(page.getByText('Validation passed')).toBeVisible();

    // Step 7: Submit form
    await page.getByText('Create Contract').click();
    
    // Verify success message
    await expect(page.getByText('Contract created successfully')).toBeVisible();
    
    // Verify redirect to success page or contract list
    await expect(page).toHaveURL(/\/contracts|\/dashboard/);
  });

  test('should handle style search and selection', async ({ page }) => {
    const styleInput = page.getByPlaceholder('Search by style number, item number, or description...');
    
    // Test initial state
    await expect(styleInput).toBeEmpty();
    await expect(page.getByText('STY001 - Test Product 1')).not.toBeVisible();

    // Test search with short query (should not trigger search)
    await styleInput.fill('S');
    await page.waitForTimeout(500); // Wait for debounce
    await expect(page.getByText('STY001 - Test Product 1')).not.toBeVisible();

    // Test search with sufficient query length
    await styleInput.fill('STY');
    await expect(page.getByText('STY001 - Test Product 1')).toBeVisible();
    await expect(page.getByText('Spring 2024 • Women')).toBeVisible();

    // Test keyboard navigation
    await styleInput.press('ArrowDown');
    await expect(page.getByText('STY001 - Test Product 1').locator('..')).toHaveClass(/bg-blue-50/);
    
    // Test selection with Enter key
    await styleInput.press('Enter');
    await expect(styleInput).toHaveValue('STY001');
    await expect(page.getByText('STY001 - Test Product 1')).not.toBeVisible();

    // Test clearing selection
    await styleInput.clear();
    await expect(styleInput).toBeEmpty();
  });

  test('should validate channel allocation requirements', async ({ page }) => {
    // Fill in basic form first
    await page.getByPlaceholder('Search by style number, item number, or description...').fill('STY001');
    await page.getByText('STY001 - Test Product 1').click();
    await page.getByLabel('Channel').check();
    await page.getByLabel('Total Committed Amount').fill('1000');
    await page.getByLabel('Contract Date').fill('2024-03-01');

    // Test invalid percentage allocation (not totaling 100%)
    await page.getByLabelText('Inline Percentage').fill('70');
    await page.getByLabelText('Ecomm Percentage').fill('40'); // Total = 110%

    await page.getByText('Validate Form').click();
    await expect(page.getByText(/percentages.*must total 100%/)).toBeVisible();

    // Fix percentage allocation
    await page.getByLabelText('Ecomm Percentage').fill('30'); // Total = 100%
    
    // Switch to amount mode and verify amounts are correct
    await page.getByText('Amount').click();
    await expect(page.getByLabelText('Inline Amount')).toHaveValue('700');
    await expect(page.getByLabelText('Ecomm Amount')).toHaveValue('300');

    // Test invalid amount allocation
    await page.getByLabelText('Inline Amount').fill('800'); // Total = 1100, not 1000
    
    await page.getByText('Validate Form').click();
    await expect(page.getByText(/allocations.*must equal total amount/)).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    // Mock validation API to return errors
    await page.route('**/api/contracts/validate*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          valid: false,
          errors: {
            style_number: 'Style number is required',
            total_committed_amount: 'Amount must be greater than 0',
            contract_date: 'Contract date is required'
          },
          warnings: {},
          message: 'Validation failed'
        })
      });
    });

    // Try to validate empty form
    await page.getByText('Validate Form').click();

    // Check that errors are displayed
    await expect(page.getByText('Style number is required')).toBeVisible();
    await expect(page.getByText('Amount must be greater than 0')).toBeVisible();
    await expect(page.getByText('Contract date is required')).toBeVisible();

    // Check that form fields have error styling
    await expect(page.getByPlaceholder('Search by style number, item number, or description...')).toHaveClass(/border-red-300/);
    await expect(page.getByLabel('Total Committed Amount')).toHaveClass(/border-red-300/);
    await expect(page.getByLabel('Contract Date')).toHaveClass(/border-red-300/);
  });

  test('should auto-save draft during form entry', async ({ page }) => {
    // Fill in some form data
    await page.getByPlaceholder('Search by style number, item number, or description...').fill('STY001');
    await page.getByText('STY001 - Test Product 1').click();
    await page.getByLabel('Customer').fill('Test Customer');

    // Wait for auto-save (30 seconds)
    await page.waitForTimeout(31000);

    // Check for auto-save indicator
    await expect(page.getByText(/Draft saved/)).toBeVisible();
  });

  test('should handle AllStyle scope without allocations', async ({ page }) => {
    // Fill in style
    await page.getByPlaceholder('Search by style number, item number, or description...').fill('STY001');
    await page.getByText('STY001 - Test Product 1').click();

    // Select AllStyle scope
    await page.getByLabel('AllStyle').check();

    // Verify allocation section is not visible
    await expect(page.getByText('Channel Allocation')).not.toBeVisible();

    // Fill in remaining required fields
    await page.getByLabel('Total Committed Amount').fill('5000');
    await page.getByLabel('Contract Date').fill('2024-03-01');

    // Validate form should pass without allocations
    await page.getByText('Validate Form').click();
    await expect(page.getByText('Validation passed')).toBeVisible();

    // Should be able to submit
    await page.getByText('Create Contract').click();
    await expect(page.getByText('Contract created successfully')).toBeVisible();
  });

  test('should handle date validation', async ({ page }) => {
    // Mock validation with date errors
    await page.route('**/api/contracts/validate*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          valid: false,
          errors: {
            campaign_end_date: 'Campaign end date must be after start date'
          },
          warnings: {
            contract_date: 'Contract date is more than 30 days in the past'
          },
          message: 'Validation failed'
        })
      });
    });

    // Fill in basic form
    await page.getByPlaceholder('Search by style number, item number, or description...').fill('STY001');
    await page.getByText('STY001 - Test Product 1').click();
    await page.getByLabel('AllStyle').check();
    await page.getByLabel('Total Committed Amount').fill('5000');

    // Set invalid date range (end before start)
    await page.getByLabel('Contract Date').fill('2023-01-01'); // Old date for warning
    await page.getByLabel('Campaign Start Date').fill('2024-05-01');
    await page.getByLabel('Campaign End Date').fill('2024-04-01'); // Before start

    await page.getByText('Validate Form').click();

    // Check for error and warning messages
    await expect(page.getByText('Campaign end date must be after start date')).toBeVisible();
    await expect(page.getByText('Contract date is more than 30 days in the past')).toBeVisible();

    // Check that fields have appropriate styling
    await expect(page.getByLabel('Campaign End Date')).toHaveClass(/border-red-300/);
    await expect(page.getByLabel('Contract Date')).toHaveClass(/border-yellow-300/);
  });

  test('should persist form state across page reloads', async ({ page }) => {
    // Fill in form data
    await page.getByPlaceholder('Search by style number, item number, or description...').fill('STY001');
    await page.getByText('STY001 - Test Product 1').click();
    await page.getByLabel('Customer').fill('Test Customer');
    await page.getByLabel('Total Committed Amount').fill('2500');
    await page.getByLabel('Contract Date').fill('2024-03-01');

    // Manually save draft
    await page.getByText('Save Draft').click();
    await expect(page.getByText(/Draft saved successfully/)).toBeVisible();

    // Mock draft loading for reload
    await page.route('**/api/contracts/drafts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            drafts: [{
              draft_id: 1,
              user_id: 'test-user',
              document_id: null,
              form_data: {
                style_number: 'STY001',
                scope: 'Channel',
                customer: 'Test Customer',
                total_committed_amount: 2500,
                contract_date: '2024-03-01',
                allocations: {
                  inline_percentage: 50,
                  ecomm_percentage: 50,
                  inline_amount: 1250,
                  ecomm_amount: 1250
                }
              },
              style_suggestions: null,
              validation_errors: null,
              last_saved: new Date().toISOString(),
              created_at: new Date().toISOString()
            }],
            total: 1
          })
        });
      }
    });

    // Reload the page
    await page.reload();

    // Wait for draft to be loaded
    await expect(page.getByText(/Draft loaded from/)).toBeVisible();

    // Verify form data is restored
    await expect(page.getByPlaceholder('Search by style number, item number, or description...')).toHaveValue('STY001');
    await expect(page.getByLabel('Customer')).toHaveValue('Test Customer');
    await expect(page.getByLabel('Total Committed Amount')).toHaveValue('2500');
    await expect(page.getByLabel('Contract Date')).toHaveValue('2024-03-01');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock API failures
    await page.route('**/api/contracts', async (route) => {
      if (route.request().method() === 'POST') {
        await route.abort('failed');
      }
    });

    // Fill in valid form
    await page.getByPlaceholder('Search by style number, item number, or description...').fill('STY001');
    await page.getByText('STY001 - Test Product 1').click();
    await page.getByLabel('AllStyle').check();
    await page.getByLabel('Total Committed Amount').fill('5000');
    await page.getByLabel('Contract Date').fill('2024-03-01');

    // Try to submit
    await page.getByText('Create Contract').click();

    // Should show error message
    await expect(page.getByText(/Failed to create contract/)).toBeVisible();

    // Form should remain filled and editable
    await expect(page.getByLabel('Total Committed Amount')).toHaveValue('5000');
    await expect(page.getByText('Create Contract')).toBeEnabled();
  });
});