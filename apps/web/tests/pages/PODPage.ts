import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PODPage extends BasePage {
  readonly podTable: Locator;
  readonly podModal: Locator;
  readonly cleanOptionButton: Locator;
  readonly issueOptionButton: Locator;
  readonly shortageOption: Locator;
  readonly damagedOption: Locator;
  readonly goodReturnOption: Locator;
  readonly detailsInput: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.podTable = page.locator('.data-table, table').first();
    this.podModal = page.locator('.modal-overlay:has-text("POD"), div[role="dialog"]').first();
    this.cleanOptionButton = page.locator('button:has-text("CLEAN"), button:has-text("Clean Delivery"), text="Clean Delivery"').first();
    this.issueOptionButton = page.locator('button:has-text("ISSUE"), button:has-text("Issue Raised"), button:has-text("Exception")').first();
    this.shortageOption = page.locator('text=/SHORTAGE/i').first();
    this.damagedOption = page.locator('text=/DAMAGED/i').first();
    this.goodReturnOption = page.locator('text=/GOOD RETURN/i').first();
    this.detailsInput = page.locator('textarea[placeholder*="details"], textarea[placeholder*="remark"], input[placeholder*="remark"]').first();
    this.confirmButton = page.locator('button:has-text("Confirm POD"), button:has-text("Confirm Delivery"), button:has-text("Submit POD")').first();
  }

  async openPODModalForOrder(orderNumber: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${orderNumber}")`);
    const actionBtn = row.locator('button:has-text("POD"), button:has-text("Verify"), button:has-text("Action")').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
    } else {
      await row.click();
    }
    await this.page.waitForTimeout(400);
  }

  async confirmCleanDelivery(): Promise<void> {
    if (await this.cleanOptionButton.isVisible()) {
      await this.cleanOptionButton.click();
      await this.page.waitForTimeout(300);
    }
    await this.confirmButton.click();
    await this.page.waitForTimeout(600);
  }

  async raisePODIssue(type: 'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' = 'SHORTAGE', details = 'Automation test exception reported'): Promise<void> {
    if (await this.issueOptionButton.isVisible()) {
      await this.issueOptionButton.click();
      await this.page.waitForTimeout(300);
    }
    if (type === 'SHORTAGE' && await this.shortageOption.isVisible()) {
      await this.shortageOption.click();
    } else if (type === 'DAMAGED' && await this.damagedOption.isVisible()) {
      await this.damagedOption.click();
    } else if (type === 'GOOD_RETURN' && await this.goodReturnOption.isVisible()) {
      await this.goodReturnOption.click();
    }
    if (await this.detailsInput.isVisible()) {
      await this.detailsInput.fill(details);
    }
    await this.confirmButton.click();
    await this.page.waitForTimeout(600);
  }
}
