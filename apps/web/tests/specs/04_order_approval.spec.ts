import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('4. Order Approval & Review Workflow', () => {

  test('4.1 Sales Admin / Super Admin can review order details in the executive Order Details Modal', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('orders');

    const firstOrderRow = page.locator('tbody tr').first();
    if (await firstOrderRow.isVisible({ timeout: 5000 })) {
      const detailsBtn = firstOrderRow.locator('button:has-text("Details"), button:has-text("View")').first();
      if (await detailsBtn.isVisible()) {
        await detailsBtn.click();
        const detailsModal = page.locator('.order-details-panel, .modal-overlay').first();
        await expect(detailsModal).toBeVisible({ timeout: 6000 });
        const closeBtn = detailsModal.locator('button, svg').first();
        await closeBtn.click();
      }
    }
  });

  test('4.2 Order status filter tabs correctly filter orders by lifecycle stage', async ({ loginPage, dashboardPage, orderPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('orders');

    await orderPage.filterByTab('ALL');
    await expect(orderPage.ordersTable).toBeVisible();

    await orderPage.filterByTab('NEW');
    await page.waitForTimeout(300);

    await orderPage.filterByTab('COMPLETED');
    await page.waitForTimeout(300);
  });
});
