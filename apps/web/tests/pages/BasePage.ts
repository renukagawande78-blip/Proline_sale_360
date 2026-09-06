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
    const tabMap: Record<string, string> = {
      dashboard: 'Dashboard',
      orders: 'Sales Orders',
      accounts: 'Billing / Accounts',
      dispatch: 'Dispatch Management',
      pod: 'POD & Delivery Queue',
      reports: 'Reports & Analytics',
      returns: 'Returns Register',
      masters: 'Master Data Management'
    };

    const label = tabMap[tabName] || tabName;
    const navButton = this.page.locator(`button:has-text("${label}"), a:has-text("${label}"), button:has-text("${tabName}")`).first();
    
    if (await navButton.isVisible()) {
      await navButton.click();
    } else {
      // Direct fallback by finding text match in sidebar
      await this.page.locator(`.sidebar button:has-text("${label}")`).click();
    }
    await this.page.waitForTimeout(400);
  }

  async logout(): Promise<void> {
    if (await this.logoutButton.isVisible()) {
      await this.logoutButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.page.locator('h1, .page-header-row, header').first()).toBeVisible({ timeout: 10000 });
  }
}
