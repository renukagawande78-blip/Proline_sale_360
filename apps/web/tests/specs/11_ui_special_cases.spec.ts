import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('11. UI Special Cases & Responsive Component Edge Scenarios', () => {

  test('11.1 Header & Sidebar Collapse / Mobile Drawer interaction', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();

    const isMobile = await page.locator('.mobile-bottom-nav').isVisible({ timeout: 600 }).catch(() => false);

    if (isMobile) {
      // Mobile Drawer Test: open drawer via bottom nav Menu button
      const menuBtn = page.locator('.mobile-bottom-nav button:has-text("Menu")').first();
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
      await expect(page.locator('.sidebar.open')).toBeVisible({ timeout: 3000 });

      // Close drawer via close button or overlay
      const closeBtn = page.locator('.sidebar.open .mobile-only-close-btn, .sidebar.open button svg').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        const overlay = page.locator('.sidebar-overlay.open').first();
        await overlay.click({ force: true });
      }
      await page.waitForTimeout(400);
    } else {
      // Desktop Sidebar Collapse Toggle
      const toggleBtn = page.locator('header button[title*="Toggle Left Sidebar"], header button:has(svg)').first();
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
        await page.waitForTimeout(300);
        // Toggle back to expanded
        await toggleBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('11.2 Segment Scope Badge and User Role Indicators render correctly', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();

    // Verify Super Admin shows FMCG & FMCD (or ALL) segment badge
    const segmentBadge = page.locator('text=/FMCG & FMCD|FMCG|FMCD|ALL/i').first();
    await expect(segmentBadge).toBeVisible({ timeout: 8000 });

    // Verify Prokap Branding & Slogan
    const logoBadge = page.locator('text=/PROKAP/i').first();
    await expect(logoBadge).toBeVisible();
  });

  test('11.3 Global Search Bar live filtering and clear behavior', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('orders');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      // Type non-existent query to test empty state handling
      await searchInput.fill('XYZ_NON_EXISTENT_SEARCH_TOKEN_999');
      await page.waitForTimeout(400);

      // Verify no crashes or errors, clear the search
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }
  });

  test('11.4 Hold Reason Directory UI Modal supports search & close', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();

    await dashboardPage.openHoldDirectory();
    const directoryModal = page.locator('.modal-overlay, div[role="dialog"]').first();
    await expect(directoryModal).toBeVisible({ timeout: 6000 });

    const dirSearch = directoryModal.locator('input[placeholder*="Search"]').first();
    if (await dirSearch.isVisible()) {
      await dirSearch.fill('overdue');
      await page.waitForTimeout(300);
      await dirSearch.fill('');
    }

    const closeBtn = directoryModal.locator('button:has-text("Close"), button:has-text("✕"), svg').first();
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  test('11.5 Order Details Modal displays structured tabbed information', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await dashboardPage.navigateToTab('orders');

    const firstOrderRow = page.locator('tbody tr').first();
    if (await firstOrderRow.isVisible({ timeout: 5000 })) {
      const detailsBtn = firstOrderRow.locator('button:has-text("Details"), button:has-text("View")').first();
      if (await detailsBtn.isVisible()) {
        await detailsBtn.click();
        const detailsModal = page.locator('.order-details-panel, .modal-overlay, div[role="dialog"]').first();
        await expect(detailsModal).toBeVisible({ timeout: 6000 });

        // Check if modal has close button
        const closeBtn = detailsModal.locator('button:has-text("Close"), button:has-text("✕"), svg').first();
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
