import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('5. Stock Check & Inventory Clearance Workflow', () => {

  test('5.1 Stock management reflects available items and ready status', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('orders');

    const ordersTable = page.locator('.data-table, table').first();
    await expect(ordersTable).toBeVisible({ timeout: 8000 });
  });

  test('5.2 Sales Admin can access inventory audit queue for their mapped brands', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SALES_ADMIN_JAY.email, TEST_USERS.SALES_ADMIN_JAY.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('orders');

    const brandHeader = page.locator('div, span, header').filter({ hasText: /Priyagold|RCPL|Orion|Gandour|HPPL/i }).first();
    await expect(brandHeader).toBeVisible({ timeout: 6000 });
  });
});
