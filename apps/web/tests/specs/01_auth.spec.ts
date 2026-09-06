import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('1. Authentication & Session Management', () => {

  test('1.1 Should successfully login as Super Admin (Chirag) and verify dashboard', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.expectKpiValuesVisible();
    await expect(dashboardPage.page.locator('text=/Super Admin|Chirag/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('1.2 Should successfully login as Accounts Manager (Harshad)', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(TEST_USERS.ACCOUNTS.email, TEST_USERS.ACCOUNTS.password);
    await dashboardPage.expectLoggedIn();
    await expect(dashboardPage.page.locator('text=/Accounts|Harshad/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('1.3 Should successfully login as Sales Admin (Jay) with assigned brand scope', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(TEST_USERS.SALES_ADMIN_JAY.email, TEST_USERS.SALES_ADMIN_JAY.password);
    await dashboardPage.expectLoggedIn();
    await expect(dashboardPage.page.locator('text=/Sales Admin|Jay|Priyagold/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('1.4 Should successfully login as Billing User (Riddhi)', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(TEST_USERS.BILLING_RIDDHI.email, TEST_USERS.BILLING_RIDDHI.password);
    await dashboardPage.expectLoggedIn();
    await expect(dashboardPage.page.locator('text=/Billing|Riddhi/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('1.5 Should successfully login as Dispatch Manager (Dhruv)', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(TEST_USERS.DISPATCH_DHRUV.email, TEST_USERS.DISPATCH_DHRUV.password);
    await dashboardPage.expectLoggedIn();
    await expect(dashboardPage.page.locator('text=/Dispatch|Dhruv/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('1.6 Should display error message when logging in with invalid credentials', async ({ loginPage }) => {
    await loginPage.login(TEST_USERS.INVALID_USER.email, TEST_USERS.INVALID_USER.password);
    await loginPage.expectLoginError();
  });

  test('1.7 Should support user logout and redirect back to login screen', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.logout();
    await expect(loginPage.prokapLogo).toBeVisible({ timeout: 8000 });
  });
});
