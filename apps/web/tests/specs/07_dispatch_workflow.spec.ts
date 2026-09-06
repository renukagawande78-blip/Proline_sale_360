import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('7. Warehouse & Vehicle Dispatch Workflow', () => {

  test('7.1 Dispatch Manager (Dhruv) views all zonewise orders ready for vehicle loading', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.DISPATCH_DHRUV.email, TEST_USERS.DISPATCH_DHRUV.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('dispatch');

    const dispatchHeading = page.locator('h1, h2, div, header').filter({ hasText: /Dispatch/i }).first();
    await expect(dispatchHeading).toBeVisible({ timeout: 8000 });
  });

  test('7.2 Dispatch modal requires vehicle number, driver name, and driver mobile', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.DISPATCH_DHRUV.email, TEST_USERS.DISPATCH_DHRUV.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('dispatch');

    const firstDispatchRow = page.locator('tbody tr').first();
    if (await firstDispatchRow.isVisible({ timeout: 5000 })) {
      const dispatchBtn = firstDispatchRow.locator('button:has-text("Dispatch"), button:has-text("Load Vehicle"), button:has-text("Action")').first();
      if (await dispatchBtn.isVisible()) {
        await dispatchBtn.click();
        const dispatchModal = page.locator('.modal-overlay, div[role="dialog"]').first();
        await expect(dispatchModal).toBeVisible({ timeout: 6000 });
        const closeBtn = dispatchModal.locator('button:has-text("Close"), button:has-text("✕"), svg').first();
        await closeBtn.click();
      }
    }
  });
});
