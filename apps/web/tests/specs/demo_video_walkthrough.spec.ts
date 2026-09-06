import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('Automated Product Demo Walkthrough Video', () => {

  test('Record Full 4-Role End-to-End Walkthrough Demo Video', async ({ page }) => {
    test.setTimeout(120000);
    const pause = (ms: number) => page.waitForTimeout(ms);

    // ==========================================
    // ACT 1: SALES PERSON (Nikhil - Create Order)
    // ==========================================
    await page.goto('/');
    await pause(1500);

    // Login as Sales Person
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.SALESPERSON_NIKHIL.email);
    await page.fill('input[type="password"]', TEST_USERS.SALESPERSON_NIKHIL.password);
    await pause(800);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // Open Create Order Modal
    const createBtn = page.locator('button:has-text("Create Order"), button:has-text("New Order")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await pause(1500);

      // Select Agency
      const agencyTrigger = page.locator('[data-testid="agency-select-trigger"]').first();
      if (await agencyTrigger.isVisible()) {
        await agencyTrigger.click();
        await pause(1000);
        const firstAgency = page.locator('[data-testid="agency-option-item"]').first();
        if (await firstAgency.isVisible()) {
          await firstAgency.click();
          await pause(1000);
        }
      }

      // Select SKU
      const productTrigger = page.locator('[data-testid="product-select-trigger"]').first();
      if (await productTrigger.isVisible()) {
        await productTrigger.click();
        await pause(1000);
        const firstProd = page.locator('[data-testid="product-option-item"]').first();
        if (await firstProd.isVisible()) {
          await firstProd.click();
          await pause(1000);
        }
      }

      // Enter Box Qty
      const qtyInput = page.locator('input[type="number"][placeholder="0"]').first();
      if (await qtyInput.isVisible()) {
        await qtyInput.fill('10');
        await pause(1200);
      }

      // Submit Order
      const submitBtn = page.locator('[data-testid="create-order-submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await pause(2000);
      }
    }

    // Logout
    const logoutBtn = page.locator('[data-testid="logout-button"], button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await pause(1500);
    }

    // ==========================================
    // ACT 2: SALES ADMIN / SUPER ADMIN (Chirag - Approval)
    // ==========================================
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // View Orders
    const ordersTab = page.locator('aside.sidebar button:has-text("Orders & Approvals"), button:has-text("Sales Orders")').first();
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await pause(2000);
    }

    // Open First Order Details
    const firstDetailsBtn = page.locator('button:has-text("Details"), button:has-text("View")').first();
    if (await firstDetailsBtn.isVisible()) {
      await firstDetailsBtn.click();
      await pause(2500);
      const closeDetails = page.locator('.order-details-panel button, div[role="dialog"] button').first();
      if (await closeDetails.isVisible()) {
        await closeDetails.click();
        await pause(1000);
      }
    }

    // Logout
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await pause(1500);
    }

    // ==========================================
    // ACT 3: BILLING USER (Riddhi - Invoicing)
    // ==========================================
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.BILLING_RIDDHI.email);
    await page.fill('input[type="password"]', TEST_USERS.BILLING_RIDDHI.password);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // Open Billing Tab
    const billingTab = page.locator('button:has-text("Accounts & Billing"), button:has-text("Billing")').first();
    if (await billingTab.isVisible()) {
      await billingTab.click();
      await pause(2500);
    }

    // Logout
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await pause(1500);
    }

    // ==========================================
    // ACT 4: DISPATCH MANAGER (Dhruv - Logistics)
    // ==========================================
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.DISPATCH_DHRUV.email);
    await page.fill('input[type="password"]', TEST_USERS.DISPATCH_DHRUV.password);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // Open Dispatch Tab
    const dispatchTab = page.locator('button:has-text("Dispatch Management"), button:has-text("Dispatch")').first();
    if (await dispatchTab.isVisible()) {
      await dispatchTab.click();
      await pause(2500);
    }

    // Open POD Tab
    const podTab = page.locator('button:has-text("POD Queue"), button:has-text("POD")').first();
    if (await podTab.isVisible()) {
      await podTab.click();
      await pause(2500);
    }

    await pause(2000);
  });
});
