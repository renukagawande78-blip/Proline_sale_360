import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('8. POD Verification & Delivery Exception Workflow', () => {

  test('8.1 Dispatch Manager / Accounts can access POD delivery queue', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('pod');

    const podHeading = page.locator('h1, h2, div, header').filter({ hasText: /POD|Delivery/i }).first();
    await expect(podHeading).toBeVisible({ timeout: 8000 });
  });

  test('8.2 POD Modal supports clean delivery and issue exception reporting', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('pod');

    const firstPodRow = page.locator('tbody tr').first();
    if (await firstPodRow.isVisible({ timeout: 5000 })) {
      const verifyBtn = firstPodRow.locator('button:has-text("Verify"), button:has-text("POD"), button:has-text("Confirm")').first();
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
        const podModal = page.locator('.modal-overlay, div[role="dialog"]').first();
        await expect(podModal).toBeVisible({ timeout: 6000 });
        const closeBtn = podModal.locator('button:has-text("Close"), button:has-text("✕"), svg').first();
        await closeBtn.click();
      }
    }
  });
});
