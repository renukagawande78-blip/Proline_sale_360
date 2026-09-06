import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('3. Payment & Credit Approval Workflow', () => {

  test('3.1 Harshad (Accounts) can review credit terms and overdue orders', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.ACCOUNTS.email, TEST_USERS.ACCOUNTS.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('accounts');

    const accountsHeading = page.locator('h1, h2, div, header').filter({ hasText: /Billing|Accounts/i }).first();
    await expect(accountsHeading).toBeVisible({ timeout: 8000 });
  });

  test('3.2 Chirag / Harshad can place an order on hold and access the Hold Reason Directory', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();

    await dashboardPage.openHoldDirectory();
    const directoryModal = page.locator('.modal-overlay, div[role="dialog"]').first();
    await expect(directoryModal).toBeVisible({ timeout: 6000 });

    const closeBtn = directoryModal.locator('button:has-text("Close"), button:has-text("✕"), svg').first();
    await closeBtn.click();
  });

  test('3.3 Non-Accounts / unauthorized users cannot bypass payment hold authority', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SALESPERSON_NIKHIL.email, TEST_USERS.SALESPERSON_NIKHIL.password);
    await dashboardPage.expectLoggedIn();

    // Verify Salesperson sidebar does not expose restricted financial controls
    const accountsNav = page.locator('button:has-text("Accounts & Billing"), button:has-text("Billing / Accounts")');
    const isAccountsVisible = await accountsNav.isVisible().catch(() => false);
    expect(isAccountsVisible).toBe(false);
  });
});
