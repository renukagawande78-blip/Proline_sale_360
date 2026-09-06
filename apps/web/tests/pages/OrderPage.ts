import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestOrderPayload } from '../utils/testData';

export class OrderPage extends BasePage {
  readonly createOrderButton: Locator;
  readonly orderModal: Locator;
  readonly agencySelectTrigger: Locator;
  readonly addProductButton: Locator;
  readonly submitOrderButton: Locator;
  readonly ordersTable: Locator;
  readonly searchInput: Locator;

  // Tabs
  readonly tabAll: Locator;
  readonly tabNew: Locator;
  readonly tabApprovalNeeded: Locator;
  readonly tabOnHold: Locator;
  readonly tabCompleted: Locator;

  constructor(page: Page) {
    super(page);
    this.createOrderButton = page.locator('button:has-text("Create Order"), button:has-text("Create Agency Order"), button:has-text("New Order")').first();
    this.orderModal = page.locator('.modal-overlay, div[role="dialog"]').first();
    this.agencySelectTrigger = page.locator('text=/AGENCY \\/ B2B PARTY/i').locator('..').locator('div[style*="cursor: pointer"], span').first();
    this.addProductButton = page.locator('button:has-text("Add Product"), button:has-text("Add Item")').first();
    this.submitOrderButton = page.locator('button:has-text("Submit B2B Order"), button:has-text("Submit Order"), button:has-text("Create Order")').first();
    this.ordersTable = page.locator('.data-table, table').first();
    this.searchInput = page.locator('input[placeholder*="Search by order"], input[placeholder*="Search orders"], input[placeholder*="Search"]').first();

    this.tabAll = page.locator('button:has-text("ALL"), .tab:has-text("ALL")').first();
    this.tabNew = page.locator('button:has-text("NEW"), .tab:has-text("NEW")').first();
    this.tabApprovalNeeded = page.locator('button:has-text("APPROVAL"), .tab:has-text("APPROVAL")').first();
    this.tabOnHold = page.locator('button:has-text("ON HOLD"), .tab:has-text("HOLD")').first();
    this.tabCompleted = page.locator('button:has-text("COMPLETED"), .tab:has-text("COMPLETED")').first();
  }

  async openCreateOrderModal(): Promise<void> {
    if (await this.createOrderButton.isVisible()) {
      await this.createOrderButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async fillAndSubmitOrder(payload: TestOrderPayload): Promise<void> {
    await this.openCreateOrderModal();

    // 1. Select Agency
    const agencyDropdown = this.page.locator('text=/AGENCY \\/ B2B PARTY/i').locator('..').locator('div[style*="cursor: pointer"]').first();
    if (await agencyDropdown.isVisible()) {
      await agencyDropdown.click();
      await this.page.waitForTimeout(300);
      const searchAgencyInput = this.page.locator('input[placeholder*="Search agency"]').first();
      if (await searchAgencyInput.isVisible()) {
        await searchAgencyInput.fill(payload.agencyName);
        await this.page.waitForTimeout(300);
      }
      const agencyOption = this.page.locator(`div:has-text("${payload.agencyName}")`).first();
      await agencyOption.click();
      await this.page.waitForTimeout(300);
    }

    // 2. Select Brand/Company if present
    const brandRadio = this.page.locator(`text=${payload.companyName}`).first();
    if (await brandRadio.isVisible()) {
      await brandRadio.click();
      await this.page.waitForTimeout(300);
    }

    // 3. Add Product SKU if needed
    const productSelector = this.page.locator('text=/Select Product|Search SKU|Product SKU/i').first();
    if (await productSelector.isVisible()) {
      await productSelector.click();
      await this.page.waitForTimeout(300);
      const searchProd = this.page.locator('input[placeholder*="Search SKU"], input[placeholder*="Search product"]').first();
      if (await searchProd.isVisible()) {
        await searchProd.fill(payload.productName);
        await this.page.waitForTimeout(300);
      }
      const prodOption = this.page.locator(`div:has-text("${payload.productName}")`).first();
      if (await prodOption.isVisible()) {
        await prodOption.click();
      }
    }

    // 4. Fill Quantity
    const qtyInput = this.page.locator('input[type="number"]').first();
    if (await qtyInput.isVisible()) {
      await qtyInput.fill(payload.boxQuantity.toString());
    }

    // 5. Submit Order
    await this.submitOrderButton.click();
    await this.page.waitForTimeout(800);
  }

  async filterByTab(tabName: 'ALL' | 'NEW' | 'APPROVAL' | 'HOLD' | 'COMPLETED'): Promise<void> {
    const tabBtn = this.page.locator(`button:has-text("${tabName}")`).first();
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async searchOrder(orderNumber: string): Promise<void> {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(orderNumber);
      await this.page.waitForTimeout(400);
    }
  }

  async clickOrderDetails(orderNumber: string): Promise<void> {
    await this.searchOrder(orderNumber);
    const row = this.page.locator(`tr:has-text("${orderNumber}")`);
    const actionBtn = row.locator('button:has-text("Details"), button:has-text("View"), button:has-text("Review"), button:has-text("Action")').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
    } else {
      await row.click();
    }
    await this.page.waitForTimeout(400);
  }
}
