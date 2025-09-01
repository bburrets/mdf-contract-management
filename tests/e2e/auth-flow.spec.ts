import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check page title and heading
    await expect(page).toHaveTitle(/MDF System/);
    await expect(page.locator('h2')).toContainText('Sign in to MDF System');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Should show email format error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    // Submit button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Enter short password
    await page.fill('input[type="email"]', 'test@arkansas.gov');
    await page.fill('input[type="password"]', '123');
    
    // Should show password length error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    
    // Submit button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should enable submit button with valid inputs', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill valid credentials
    await page.fill('input[type="email"]', 'ops@arkansas.gov');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit button should be enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill credentials
    await page.fill('input[type="email"]', 'ops@arkansas.gov');
    await page.fill('input[type="password"]', 'password123');
    
    // Click submit and immediately check loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show loading state briefly
    await expect(submitButton).toContainText('Signing in...');
    await expect(submitButton).toBeDisabled();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Mock successful authentication response
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          url: '/dashboard',
          ok: true 
        })
      });
    });

    await page.goto('/auth/signin');
    
    // Fill and submit valid credentials
    await page.fill('input[type="email"]', 'ops@arkansas.gov');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Mock failed authentication response
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'CredentialsSignin',
          ok: false 
        })
      });
    });

    await page.goto('/auth/signin');
    
    // Fill and submit invalid credentials
    await page.fill('input[type="email"]', 'wrong@arkansas.gov');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login with callback URL
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.url()).toContain('callbackUrl=%2Fdashboard');
  });

  test('should display test credentials hint', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Should show test credentials
    await expect(page.locator('text=Test credentials: ops@arkansas.gov / password123')).toBeVisible();
  });

  test('should handle auth error page', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    
    // Check error page content
    await expect(page.locator('h2')).toContainText('Authentication Error');
    await expect(page.locator('text=You are not authorized to access this application')).toBeVisible();
    await expect(page.locator('text=Error code: AccessDenied')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('text=Try Again')).toBeVisible();
    await expect(page.locator('text=Go Home')).toBeVisible();
  });

  test('should navigate from error page to login', async ({ page }) => {
    await page.goto('/auth/error');
    
    // Click "Try Again" button
    await page.click('text=Try Again');
    
    // Should navigate to login page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});