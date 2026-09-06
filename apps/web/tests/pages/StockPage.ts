import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class StockPage extends BasePage {
  readonly stockModal: Locator;
  readonly inStockOption: Locator;
  readonly waitForStockOption: Locator;
  readonly confirmStockButton: Locator;

  constructor(page: Page) {
    super(page);
    this.stockModal = page.locator('.modal-overlay:has-text("Stock"), div[role="dialog"]:has-text("Stock")').first();
    this.inStockOption = page.locator('button:has-text("In Stock"), input[value="IN_STOCK"], text="In Stock"').first();
    this.waitForStockOption = page.locator('button:has-text("Wait For Stock"), input[value="WAIT_FOR_STOCK"], text="Wait For Stock"').first();
    this.confirmStockButton = page.locator('button:has-text("Confirm Stock"), button:has-text("Save Stock Status")').first();
  }

  async setStockAvailable(): Promise<void> {
    if (await this.inStockOption.isVisible()) {
      await this.inStockOption.click();
      await this.page.waitForTimeout(300);
    }
    if (await this.confirmStockButton.isVisible()) {
      await this.confirmStockButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async setWaitForStock(): Promise<void> {
    if (await this.waitForStockOption.isVisible()) {
      await this.waitForStockOption.click();
      await this.page.waitForTimeout(300);
    }
    if (await this.confirmStockButton.isVisible()) {
      await this.confirmStockButton.click();
      await this.page.waitForTimeout(500);
    }
  }
}
