import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly totalOrdersKpi: Locator;
  readonly pendingApprovalKpi: Locator;
  readonly pendingBillingKpi: Locator;
  readonly pendingDispatchKpi: Locator;
  readonly holdDirectoryButton: Locator;
  readonly createOrderButton: Locator;
  readonly allReportsButton: Locator;
  readonly recentOrdersTable: Locator;

  constructor(page: Page) {
    super(page);
    this.totalOrdersKpi = page.locator('.kpi-card:has-text("TOTAL ORDERS"), .kpi-card:has-text("TOTAL ORDER QUANTITY")').first();
    this.pendingApprovalKpi = page.locator('.kpi-card:has-text("PENDING FOR APPROVAL"), .kpi-card:has-text("PENDING APPROVAL")').first();
    this.pendingBillingKpi = page.locator('.kpi-card:has-text("PENDING FOR BILLING"), .kpi-card:has-text("APPROVED FOR DISPATCH")').first();
    this.pendingDispatchKpi = page.locator('.kpi-card:has-text("PENDING FOR DISPATCH")').first();
    this.holdDirectoryButton = page.locator('button:has-text("Hold Reason Directory")').first();
    this.createOrderButton = page.locator('button:has-text("Create Agency Order"), button:has-text("Create Order")').first();
    this.allReportsButton = page.locator('button:has-text("All Reports")').first();
    this.recentOrdersTable = page.locator('.data-table, table').first();
  }

  async expectKpiValuesVisible(): Promise<void> {
    await expect(this.totalOrdersKpi).toBeVisible({ timeout: 8000 });
    await expect(this.pendingApprovalKpi).toBeVisible({ timeout: 8000 });
    await expect(this.pendingBillingKpi).toBeVisible({ timeout: 8000 });
  }

  async openCreateOrderModal(): Promise<void> {
    await this.expectLoggedIn();
    await this.createOrderButton.click();
    await this.page.waitForTimeout(400);
  }

  async openHoldDirectory(): Promise<void> {
    await this.expectLoggedIn();
    await this.holdDirectoryButton.click();
    await this.page.waitForTimeout(400);
  }

  async getKpiNumber(kpi: 'total' | 'approval' | 'billing' | 'dispatch'): Promise<number> {
    let locator: Locator;
    switch (kpi) {
      case 'total': locator = this.totalOrdersKpi.locator('.kpi-value'); break;
      case 'approval': locator = this.pendingApprovalKpi.locator('.kpi-value'); break;
      case 'billing': locator = this.pendingBillingKpi.locator('.kpi-value'); break;
      case 'dispatch': locator = this.pendingDispatchKpi.locator('.kpi-value'); break;
    }
    const text = await locator.innerText();
    const cleanNum = text.replace(/[^0-9]/g, '');
    return parseInt(cleanNum || '0', 10);
  }
}
