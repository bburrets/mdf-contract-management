import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Test navigation to contracts page
    await page.click('text=Contracts');
    await expect(page).toHaveURL('/contracts');
    await expect(page.locator('h1')).toContainText('Contract Management');

    // Test navigation to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Test navigation to style catalog
    await page.click('text=Style Catalog');
    await expect(page).toHaveURL('/styles');
    await expect(page.locator('h1')).toContainText('Style Catalog');
  });

  test('should display home page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if the navbar is present
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=MDF Contract Management')).toBeVisible();
  });

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check that navigation links are accessible
    const dashboardLink = page.locator('a[href="/dashboard"]');
    const contractsLink = page.locator('a[href="/contracts"]');
    const stylesLink = page.locator('a[href="/styles"]');
    
    await expect(dashboardLink).toBeVisible();
    await expect(contractsLink).toBeVisible();
    await expect(stylesLink).toBeVisible();
  });
});