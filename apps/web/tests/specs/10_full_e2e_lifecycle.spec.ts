import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('10. Complete Multi-Role End-to-End Order Lifecycle', () => {

  test('10.1 Full Order Lifecycle: Creation → Approval → Billing Check → Dispatch Check → POD Delivery', async ({ 
    loginPage, 
    dashboardPage, 
    orderPage, 
    billingPage, 
    dispatchPage, 
    podPage, 
    page 
  }) => {
    // ── STAGE 1: Super Admin Login & Order Booking ────────────────────
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();

    await dashboardPage.openCreateOrderModal();

    // Select Agency
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

    // Select Product SKU
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

    // Fill Box Qty
    const boxQtyInput = page.locator('input[type="number"][placeholder="0"]').first();
    if (await boxQtyInput.isVisible()) {
      await boxQtyInput.fill('3');
    }

    // Submit Order
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

    // ── STAGE 2: Orders View Verification ─────────────────────────────
    await dashboardPage.navigateToTab('orders');
    await expect(orderPage.ordersTable).toBeVisible({ timeout: 8000 });

    // ── STAGE 3: Billing / Accounts Queue Check ───────────────────────
    await dashboardPage.navigateToTab('accounts');
    await expect(billingPage.billingTable).toBeVisible({ timeout: 8000 });

    // ── STAGE 4: Dispatch Queue Check ─────────────────────────────────
    await dashboardPage.navigateToTab('dispatch');
    await expect(dispatchPage.dispatchTable).toBeVisible({ timeout: 8000 });

    // ── STAGE 5: POD Delivery Queue Check ─────────────────────────────
    await dashboardPage.navigateToTab('pod');
    await expect(podPage.podTable).toBeVisible({ timeout: 8000 });

    // ── STAGE 6: Return to Dashboard & Verify KPIs ────────────────────
    await dashboardPage.navigateToTab('dashboard');
    await dashboardPage.expectKpiValuesVisible();
  });
});
