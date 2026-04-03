import { test, expect } from '@playwright/test';

test.describe('POS Terminal', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This test assumes the user is logged in or we bypass auth for testing
    // In a real scenario, we'd use a storageState or a login helper
    await page.goto('/dashboard/pos');
  });

  test('should display the POS terminal interface', async ({ page }) => {
    // Check for the "Current Order" title
    await expect(page.locator('text=Current Order')).toBeVisible();
    
    // Check for the search input
    await expect(page.locator('placeholder=Search product or scan barcode...')).toBeVisible();
  });

  test('should show cart empty state initially', async ({ page }) => {
    await expect(page.locator('text=Cart is Empty')).toBeVisible();
  });

  test('should allow searching for products', async ({ page }) => {
    const searchInput = page.locator('placeholder=Search product or scan barcode...');
    await searchInput.fill('Non-existent Product');
    
    // Check that no products are found (this depends on your mock/real data)
    // For now, we just verify the input works
    await expect(searchInput).toHaveValue('Non-existent Product');
  });

  test('responsive layout check', async ({ page }) => {
    // Check desktop layout (Cart should be visible)
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('text=Current Order')).toBeVisible();

    // Check mobile layout (Cart should be hidden by default in the new refactor)
    await page.setViewportSize({ width: 375, height: 667 });
    // The "View Order" button should be visible on mobile
    await expect(page.locator('text=View Order')).toBeVisible();
  });
});
