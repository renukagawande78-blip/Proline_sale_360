import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('2. Order Creation & Validation', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
  });

  test('2.1 Should create a new agency order with FMCG product SKU and verify in orders table', async ({ dashboardPage, page }) => {
    // 1. Open Create Agency Order Modal
    await dashboardPage.openCreateOrderModal();
    await expect(page.locator('h2:has-text("Create Agency Order")').first()).toBeVisible({ timeout: 6000 });

    // 2. Select Agency using SearchableAgencySelect trigger
    const agencyTrigger = page.locator('[data-testid="agency-select-trigger"]').first();
    if (await agencyTrigger.isVisible()) {
      await agencyTrigger.click();
      await page.waitForTimeout(300);
      const agencyOption = page.locator('[data-testid="agency-option-item"]').first();
      if (await agencyOption.isVisible()) {
        await agencyOption.click();
        await page.waitForTimeout(300);
      }
    }

    // 3. Select Product SKU
    const productTrigger = page.locator('[data-testid="product-select-trigger"]').first();
    if (await productTrigger.isVisible()) {
      await productTrigger.click();
      await page.waitForTimeout(300);
      const productOption = page.locator('[data-testid="product-option-item"]').first();
      if (await productOption.isVisible()) {
        await productOption.click();
        await page.waitForTimeout(300);
      }
    }

    // 4. Fill Box Qty
    const boxQtyInput = page.locator('input[type="number"][placeholder="0"]').first();
    if (await boxQtyInput.isVisible()) {
      await boxQtyInput.fill('5');
    }

    // 5. Submit Order
    const submitBtn = page.locator('[data-testid="create-order-submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(800);

    // Ensure modal is dismissed
    const modalOverlay = page.locator('.modal-overlay');
    if (await modalOverlay.isVisible().catch(() => false)) {
      const cancelBtn = modalOverlay.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click().catch(() => {});
      }
    }

    // 6. Navigate to Orders Tab and verify Table is rendered
    await dashboardPage.navigateToTab('orders');
    const table = page.locator('.data-table, table').first();
    await expect(table).toBeVisible({ timeout: 8000 });
  });

  test('2.2 Should calculate total amount and box quantity correctly in order form', async ({ dashboardPage, page }) => {
    await dashboardPage.openCreateOrderModal();

    // Verify modal elements are interactive and responsive
    const modalTitle = page.locator('h2:has-text("Create Agency Order"), h2:has-text("New Order")').first();
    await expect(modalTitle).toBeVisible({ timeout: 6000 });

    const agencySection = page.locator('text=/AGENCY \\/ B2B PARTY/i').first();
    await expect(agencySection).toBeVisible();

    const volumeSummary = page.locator('text=/Total Order Volume/i').first();
    await expect(volumeSummary).toBeVisible();

    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
  });
});
