import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-users';

test.use({ video: 'on' });

test.describe('Automated Product Demo Walkthrough Video', () => {

  test('Record Full 4-Role End-to-End Walkthrough Demo Video', async ({ page }) => {
    test.setTimeout(120000);
    const pause = (ms: number) => page.waitForTimeout(ms);

    const doLogout = async () => {
      const isMobile = await page.locator('.mobile-bottom-nav').isVisible({ timeout: 400 }).catch(() => false);
      if (isMobile) {
        const isDrawerOpen = await page.locator('.sidebar.open').isVisible({ timeout: 400 }).catch(() => false);
        if (!isDrawerOpen) {
          const menuBtn = page.locator('.mobile-bottom-nav button:has-text("Menu")').first();
          if (await menuBtn.isVisible({ timeout: 800 }).catch(() => false)) {
            await menuBtn.click();
            await page.waitForTimeout(400);
          }
        }
        const drawerLogout = page.locator('.sidebar.open [data-testid="logout-button"], .sidebar.open button:has-text("Sign Out")').first();
        if (await drawerLogout.isVisible({ timeout: 2000 }).catch(() => false)) {
          await drawerLogout.click();
          await pause(1500);
          return;
        }
      }
      const logoutBtn = page.locator('[data-testid="logout-button"], button:has-text("Sign Out")').first();
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
        await pause(1500);
      }
    };

    const doNavigate = async (tabLabels: string[]) => {
      const isMobile = await page.locator('.mobile-bottom-nav').isVisible({ timeout: 400 }).catch(() => false);
      if (isMobile) {
        for (const label of tabLabels) {
          const mobileBtn = page.locator(`.mobile-bottom-nav button:has-text("${label}")`).first();
          if (await mobileBtn.isVisible({ timeout: 400 }).catch(() => false)) {
            await mobileBtn.click();
            await pause(1500);
            return;
          }
        }
        const isDrawerOpen = await page.locator('.sidebar.open').isVisible({ timeout: 400 }).catch(() => false);
        if (!isDrawerOpen) {
          const menuBtn = page.locator('.mobile-bottom-nav button:has-text("Menu")').first();
          if (await menuBtn.isVisible({ timeout: 800 }).catch(() => false)) {
            await menuBtn.click();
            await page.waitForTimeout(400);
          }
        }
        for (const label of tabLabels) {
          const drawerItem = page.locator(`.sidebar.open button:has-text("${label}")`).first();
          if (await drawerItem.isVisible({ timeout: 1500 }).catch(() => false)) {
            await drawerItem.click();
            await pause(1500);
            return;
          }
        }
      } else {
        for (const label of tabLabels) {
          const navItem = page.locator(`aside.sidebar button:has-text("${label}"), button:has-text("${label}")`).first();
          if (await navItem.isVisible({ timeout: 800 }).catch(() => false)) {
            await navItem.click();
            await pause(1500);
            return;
          }
        }
      }
    };

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

    // Act 1 Logout
    await doLogout();

    // ==========================================
    // ACT 2: SALES ADMIN / SUPER ADMIN (Chirag - Approval)
    // ==========================================
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // View Orders
    await doNavigate(['Orders & Approvals', 'Sales Orders', 'Orders']);

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

    // Act 2 Logout
    await doLogout();

    // ==========================================
    // ACT 3: BILLING USER (Riddhi - Invoicing)
    // ==========================================
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.BILLING_RIDDHI.email);
    await page.fill('input[type="password"]', TEST_USERS.BILLING_RIDDHI.password);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // Open Billing Tab
    await doNavigate(['Accounts & Billing', 'Billing / Accounts', 'Billing']);

    // Act 3 Logout
    await doLogout();

    // ==========================================
    // ACT 4: DISPATCH MANAGER (Dhruv - Logistics)
    // ==========================================
    await page.fill('input[placeholder*="email"], input[placeholder*="username"], input[type="text"]', TEST_USERS.DISPATCH_DHRUV.email);
    await page.fill('input[type="password"]', TEST_USERS.DISPATCH_DHRUV.password);
    await page.click('button:has-text("Sign In"), button:has-text("Login")');
    await pause(2000);

    // Open Dispatch Tab
    await doNavigate(['Dispatch Management', 'Dispatch']);

    // Open POD Tab
    await doNavigate(['POD Queue', 'POD & Delivery Queue', 'POD']);

    await pause(2000);
  });
});
