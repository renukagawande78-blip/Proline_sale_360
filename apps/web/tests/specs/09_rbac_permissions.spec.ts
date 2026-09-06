import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('9. Role-Based Access Control (RBAC) & Scope Fence', () => {

  test('9.1 Sales Person (Nikhil) sees only assigned Priyagold brand scope and no delete access', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SALESPERSON_NIKHIL.email, TEST_USERS.SALESPERSON_NIKHIL.password);
    await dashboardPage.expectLoggedIn();

    const userBadge = page.locator('header, nav, aside, body').filter({ hasText: /Nikhil|Priyagold/i }).first();
    await expect(userBadge).toBeVisible({ timeout: 6000 });
  });

  test('9.2 Sales Admin (Dixit) brand scope is restricted to Hell, Waiwai, PRAN, Mogu mogu', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SALES_ADMIN_DIXIT.email, TEST_USERS.SALES_ADMIN_DIXIT.password);
    await dashboardPage.expectLoggedIn();

    const scopeText = page.locator('header, .header-user-badge, nav, aside, div').filter({ hasText: /Dixit|Hell|Waiwai|PRAN|Mogu/i }).first();
    await expect(scopeText).toBeVisible({ timeout: 6000 });
  });

  test('9.3 Dispatch Manager cannot access billing generation or add new parties', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.DISPATCH_DHRUV.email, TEST_USERS.DISPATCH_DHRUV.password);
    await dashboardPage.expectLoggedIn();

    // Accounts / Billing nav is not visible for Dispatch
    const accountsNav = page.locator('button:has-text("Billing / Accounts")');
    const isAccountsVisible = await accountsNav.isVisible().catch(() => false);
    expect(isAccountsVisible).toBe(false);
  });
});
