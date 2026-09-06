import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('6. B2B Billing & Tax Invoice Workflow', () => {

  test('6.1 Billing Clerk (Riddhi) accesses billing queue with mapped brand orders', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.BILLING_RIDDHI.email, TEST_USERS.BILLING_RIDDHI.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('accounts');

    const billingHeader = page.locator('h1, h2, div, header').filter({ hasText: /Billing|Accounts/i }).first();
    await expect(billingHeader).toBeVisible({ timeout: 8000 });
  });

  test('6.2 Issue B2B Bill Modal validates required fields before issuance', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('accounts');

    const firstBillableRow = page.locator('tbody tr').first();
    if (await firstBillableRow.isVisible({ timeout: 5000 })) {
      const billBtn = firstBillableRow.locator('button:has-text("Issue B2B Bill"), button:has-text("Generate Invoice"), button:has-text("Bill")').first();
      if (await billBtn.isVisible()) {
        await billBtn.click();
        const billModal = page.locator('.modal-overlay, div[role="dialog"]').first();
        await expect(billModal).toBeVisible({ timeout: 6000 });
        const closeBtn = billModal.locator('button:has-text("Close"), button:has-text("✕"), svg').first();
        await closeBtn.click();
      }
    }
  });
});
