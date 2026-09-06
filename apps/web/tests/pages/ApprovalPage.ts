import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ApprovalPage extends BasePage {
  readonly approvalModal: Locator;
  readonly approveButton: Locator;
  readonly holdButton: Locator;
  readonly releaseHoldButton: Locator;
  readonly rejectButton: Locator;
  readonly sendToBillingButton: Locator;
  readonly stockCheckButton: Locator;
  readonly holdReasonSelect: Locator;
  readonly remarksInput: Locator;

  constructor(page: Page) {
    super(page);
    this.approvalModal = page.locator('.modal-overlay, div[role="dialog"]').first();
    this.approveButton = page.locator('button:has-text("Approve"), button:has-text("Approve Order"), button:has-text("Save & Approve")').first();
    this.holdButton = page.locator('button:has-text("Hold"), button:has-text("Put On Hold"), button:has-text("Hold Order")').first();
    this.releaseHoldButton = page.locator('button:has-text("Release Hold"), button:has-text("Unfreeze")').first();
    this.rejectButton = page.locator('button:has-text("Reject"), button:has-text("Reject Order")').first();
    this.sendToBillingButton = page.locator('button:has-text("Send to Billing"), button:has-text("Transfer to Billing")').first();
    this.stockCheckButton = page.locator('button:has-text("Stock Check"), button:has-text("Audit Stock")').first();
    this.holdReasonSelect = page.locator('select:has-text("Select Hold Reason"), select[name*="hold"]').first();
    this.remarksInput = page.locator('textarea[placeholder*="remark"], input[placeholder*="remark"]').first();
  }

  async approveOrder(remarks = 'Approved by Automation Test'): Promise<void> {
    if (await this.remarksInput.isVisible()) {
      await this.remarksInput.fill(remarks);
    }
    await this.approveButton.click();
    await this.page.waitForTimeout(600);
  }

  async holdOrder(reason = 'Overdue invoice review', remarks = 'Order placed on hold for testing'): Promise<void> {
    if (await this.holdReasonSelect.isVisible()) {
      await this.holdReasonSelect.selectOption({ label: reason }).catch(() => {
        return this.holdReasonSelect.selectOption(reason);
      });
    }
    if (await this.remarksInput.isVisible()) {
      await this.remarksInput.fill(remarks);
    }
    await this.holdButton.click();
    await this.page.waitForTimeout(600);
  }

  async releaseHold(remarks = 'Released by Super Admin'): Promise<void> {
    if (await this.releaseHoldButton.isVisible()) {
      await this.releaseHoldButton.click();
      await this.page.waitForTimeout(600);
    }
  }

  async sendToBilling(): Promise<void> {
    if (await this.sendToBillingButton.isVisible()) {
      await this.sendToBillingButton.click();
      await this.page.waitForTimeout(600);
    }
  }
}
