import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DispatchPage extends BasePage {
  readonly dispatchTable: Locator;
  readonly dispatchModal: Locator;
  readonly vehicleNumberInput: Locator;
  readonly driverNameInput: Locator;
  readonly driverMobileInput: Locator;
  readonly confirmDispatchButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.dispatchTable = page.locator('.data-table, table').first();
    this.dispatchModal = page.locator('.modal-overlay:has-text("Dispatch"), div[role="dialog"]').first();
    this.vehicleNumberInput = page.locator('input[placeholder*="GJ"], input[placeholder*="Vehicle"], input[name*="vehicle"]').first();
    this.driverNameInput = page.locator('input[placeholder*="Driver Name"], input[name*="driver_name"]').first();
    this.driverMobileInput = page.locator('input[placeholder*="Mobile"], input[placeholder*="98"], input[name*="driver_mobile"]').first();
    this.confirmDispatchButton = page.locator('button:has-text("Confirm & Dispatch"), button:has-text("Confirm Dispatch"), button:has-text("Transfer Out for Delivery")').first();
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
  }

  async openDispatchModalForOrder(orderNumber: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${orderNumber}")`);
    const actionBtn = row.locator('button:has-text("Dispatch"), button:has-text("Load Vehicle"), button:has-text("Action")').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
    } else {
      await row.click();
    }
    await this.page.waitForTimeout(400);
  }

  async fillAndConfirmDispatch(vehicle = 'GJ-05-BX-1234', driver = 'Ramesh Kumar', mobile = '9876543210'): Promise<void> {
    if (await this.vehicleNumberInput.isVisible()) {
      await this.vehicleNumberInput.fill(vehicle);
    }
    if (await this.driverNameInput.isVisible()) {
      await this.driverNameInput.fill(driver);
    }
    if (await this.driverMobileInput.isVisible()) {
      await this.driverMobileInput.fill(mobile);
    }
    await this.confirmDispatchButton.click();
    await this.page.waitForTimeout(600);
  }
}
