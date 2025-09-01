# Testing Strategy

Simple testing approach focusing on critical functionality without complex test infrastructure.

## Testing Pyramid

```
E2E Tests (Playwright)
    /        \
Integration Tests (API)
    /            \
Unit Tests (Business Logic)
```

## Test Organization

### Unit Tests
- Business logic functions
- Utility functions
- Data validation

### Integration Tests
- API endpoints
- Database operations
- OCR integration

### E2E Tests
- Complete contract processing workflow
- User authentication flow
- Critical user journeys

## Test Examples

```typescript
// Unit test example
describe('StyleMatcher', () => {
  test('should match exact item numbers', () => {
    const matcher = new StyleMatcher();
    const result = matcher.findMatches({ 
      itemNumber: 'TEST123',
      description: 'Test Item'
    });
    expect(result[0].confidence).toBeGreaterThan(0.9);
  });
});

// API test example
describe('/api/contracts', () => {
  test('should create new contract', async () => {
    const response = await request(app)
      .post('/api/contracts')
      .send({
        style_number: 'ST001',
        scope: 'Channel',
        total_committed_amount: 1000.00
      });
    expect(response.status).toBe(201);
    expect(response.body.data.mdf_id).toBeDefined();
  });
});

// E2E test example
test('complete contract processing flow', async ({ page }) => {
  await page.goto('/contracts/new');
  
  // Upload PDF
  await page.setInputFiles('#pdf-upload', 'test-contract.pdf');
  await page.click('button:text("Process Document")');
  
  // Validate extraction
  await page.waitForSelector('[data-testid="extraction-results"]');
  await page.click('button:text("Create Contract")');
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```
