import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  // Header & Navigation locators
  readonly userBadge: Locator;
  readonly logoutButton: Locator;
  readonly roleDropdown: Locator;
  readonly sidebar: Locator;
  readonly globalSearchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userBadge = page.locator('header, .header-user-badge, text=/Logged in as|Chirag|Harshad|Jay|Riddhi|Dhruv/i').first();
    this.logoutButton = page.getByTestId('logout-button').or(page.locator('button:has-text("Logout"), button[title*="Logout"], button:has-text("Sign Out"), button[title*="Sign Out"]')).first();
    this.roleDropdown = page.locator('select:has-text("Switch Role"), select[title*="Role"]').first();
    this.sidebar = page.locator('nav, aside, .sidebar').first();
    this.globalSearchInput = page.locator('input[placeholder*="Search"]').first();
  }

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async navigateToTab(tabName: 'dashboard' | 'orders' | 'accounts' | 'dispatch' | 'pod' | 'reports' | 'returns' | 'masters'): Promise<void> {
    const tabMap: Record<string, string[]> = {
      dashboard: ['Dashboard'],
      orders: ['Orders & Approvals', 'Sales Orders', 'Orders'],
      accounts: ['Accounts & Billing', 'Billing / Accounts', 'Accounts', 'Billing'],
      dispatch: ['Dispatch Management', 'Dispatch'],
      pod: ['POD Queue', 'POD & Delivery Queue', 'POD'],
      reports: ['Reports & Analytics', 'Reports'],
      returns: ['Returns & Damage', 'Returns Register', 'Returns'],
      masters: ['Master Data', 'Master Data Management', 'Masters']
    };

    const targetLabels = tabMap[tabName] || [tabName];

    // Close any blocking modal overlay if open before navigating
    const openModal = this.page.locator('.modal-overlay:not(.sidebar-overlay)').first();
    if (await openModal.isVisible({ timeout: 300 }).catch(() => false)) {
      const closeBtn = openModal.locator('button:has-text("Cancel"), button:has-text("Close"), button:has-text("✕")').first();
      if (await closeBtn.isVisible({ timeout: 400 }).catch(() => false)) {
        await closeBtn.click().catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }

    const isMobileNav = await this.page.locator('.mobile-bottom-nav').isVisible({ timeout: 600 }).catch(() => false);

    if (isMobileNav) {
      // 1. Check direct mobile bottom nav buttons
      if (tabName === 'dashboard') {
        const dashBtn = this.page.locator('.mobile-bottom-nav button:has-text("Dashboard")').first();
        if (await dashBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await dashBtn.click();
          await this.page.waitForTimeout(400);
          return;
        }
      } else if (tabName === 'orders') {
        const orderBtn = this.page.locator('.mobile-bottom-nav button:has-text("Orders")').first();
        if (await orderBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await orderBtn.click();
          await this.page.waitForTimeout(400);
          return;
        }
      } else if (tabName === 'dispatch') {
        const dispatchBtn = this.page.locator('.mobile-bottom-nav button:has-text("Dispatch")').first();
        if (await dispatchBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await dispatchBtn.click();
          await this.page.waitForTimeout(400);
          return;
        }
      }

      // 2. Open Mobile Sidebar Drawer via Menu button
      const isDrawerOpen = await this.page.locator('.sidebar.open').isVisible({ timeout: 400 }).catch(() => false);
      if (!isDrawerOpen) {
        const menuBtn = this.page.locator('.mobile-bottom-nav button:has-text("Menu")').first();
        if (await menuBtn.isVisible({ timeout: 800 }).catch(() => false)) {
          await menuBtn.click();
          await expect(this.page.locator('.sidebar.open')).toBeVisible({ timeout: 3000 });
        }
      }

      // 3. Click target item in open drawer
      for (const label of targetLabels) {
        const itemBtn = this.page.locator(`.sidebar.open button:has-text("${label}")`).first();
        if (await itemBtn.isVisible({ timeout: 800 }).catch(() => false)) {
          await itemBtn.click();
          await this.page.waitForTimeout(400);
          return;
        }
      }
    } else {
      // Desktop: Click directly in visible sidebar
      for (const label of targetLabels) {
        const navBtn = this.page.locator(`aside.sidebar button:has-text("${label}"), nav button:has-text("${label}")`).first();
        if (await navBtn.isVisible({ timeout: 800 }).catch(() => false)) {
          await navBtn.click();
          await this.page.waitForTimeout(400);
          return;
        }
      }
    }
  }

  async logout(): Promise<void> {
    const isMobileNav = await this.page.locator('.mobile-bottom-nav').isVisible({ timeout: 600 }).catch(() => false);

    if (isMobileNav) {
      const isDrawerOpen = await this.page.locator('.sidebar.open').isVisible({ timeout: 400 }).catch(() => false);
      if (!isDrawerOpen) {
        const menuBtn = this.page.locator('.mobile-bottom-nav button:has-text("Menu")').first();
        if (await menuBtn.isVisible({ timeout: 800 }).catch(() => false)) {
          await menuBtn.click();
          await expect(this.page.locator('.sidebar.open')).toBeVisible({ timeout: 3000 });
        }
      }

      const drawerLogoutBtn = this.page.locator('.sidebar.open [data-testid="logout-button"], .sidebar.open button:has-text("Sign Out")').first();
      if (await drawerLogoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await drawerLogoutBtn.click();
        await this.page.waitForTimeout(600);
        return;
      }
    }

    if (await this.logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.logoutButton.click();
      await this.page.waitForTimeout(600);
    }
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.page.locator('h1, .page-header-row, header, .mobile-bottom-nav').first()).toBeVisible({ timeout: 10000 });
  }
}
