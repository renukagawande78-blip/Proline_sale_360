import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class BillingPage extends BasePage {
  readonly billingTable: Locator;
  readonly issueBillButton: Locator;
  readonly invoiceNumberInput: Locator;
  readonly invoiceAmountInput: Locator;
  readonly creditDaysInput: Locator;
  readonly remarksInput: Locator;
  readonly submitInvoiceButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.billingTable = page.locator('.data-table, table').first();
    this.issueBillButton = page.locator('button:has-text("Issue B2B Bill"), button:has-text("Generate Invoice"), button:has-text("Bill")').first();
    this.invoiceNumberInput = page.locator('input[placeholder*="INV-"], input[placeholder*="Invoice Number"], input[name*="invoice"]').first();
    this.invoiceAmountInput = page.locator('input[placeholder*="Amount"], input[name*="amount"]').first();
    this.creditDaysInput = page.locator('input[placeholder*="Credit Days"], input[name*="credit"]').first();
    this.remarksInput = page.locator('input[placeholder*="remark"], textarea[placeholder*="remark"]').first();
    this.submitInvoiceButton = page.locator('button:has-text("Save & Complete B2B Bill"), button:has-text("Save & Issue Bill"), button:has-text("Complete Bill")').first();
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
  }

  async openBillingForOrder(orderNumber: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${orderNumber}")`);
    const billBtn = row.locator('button:has-text("Issue B2B Bill"), button:has-text("Generate Invoice"), button:has-text("Bill")').first();
    if (await billBtn.isVisible()) {
      await billBtn.click();
    } else {
      await row.click();
    }
    await this.page.waitForTimeout(400);
  }

  async fillAndSubmitInvoice(invoiceNumber = `INV-${Date.now().toString().slice(-4)}`, creditDays = 15, remarks = 'Billed successfully'): Promise<void> {
    if (await this.invoiceNumberInput.isVisible()) {
      await this.invoiceNumberInput.fill(invoiceNumber);
    }
    if (await this.creditDaysInput.isVisible()) {
      await this.creditDaysInput.fill(creditDays.toString());
    }
    if (await this.remarksInput.isVisible()) {
      await this.remarksInput.fill(remarks);
    }
    await this.submitInvoiceButton.click();
    await this.page.waitForTimeout(600);
  }
}
