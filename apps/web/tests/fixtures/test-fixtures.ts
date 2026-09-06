import { test as baseTest, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { OrderPage } from '../pages/OrderPage';
import { ApprovalPage } from '../pages/ApprovalPage';
import { StockPage } from '../pages/StockPage';
import { BillingPage } from '../pages/BillingPage';
import { DispatchPage } from '../pages/DispatchPage';
import { PODPage } from '../pages/PODPage';

export interface TestFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  orderPage: OrderPage;
  approvalPage: ApprovalPage;
  stockPage: StockPage;
  billingPage: BillingPage;
  dispatchPage: DispatchPage;
  podPage: PODPage;
}

export const test = baseTest.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  orderPage: async ({ page }, use) => {
    await use(new OrderPage(page));
  },
  approvalPage: async ({ page }, use) => {
    await use(new ApprovalPage(page));
  },
  stockPage: async ({ page }, use) => {
    await use(new StockPage(page));
  },
  billingPage: async ({ page }, use) => {
    await use(new BillingPage(page));
  },
  dispatchPage: async ({ page }, use) => {
    await use(new DispatchPage(page));
  },
  podPage: async ({ page }, use) => {
    await use(new PODPage(page));
  }
});

export { expect };
