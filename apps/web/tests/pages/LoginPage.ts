import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly quickSelectDropdown: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly prokapLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.prokapLogo = page.locator('h1:has-text("PROKAP"), img[alt="PROKAP"]').first();
    this.usernameInput = page.getByTestId('login-username').or(page.locator('input[placeholder*="chirag"], input[placeholder*="email"], input[placeholder*="Enter Person Name"]').first());
    this.passwordInput = page.getByTestId('login-password').or(page.locator('input[type="password"]').first());
    this.quickSelectDropdown = page.getByTestId('login-quick-select').or(page.locator('select').first());
    this.submitButton = page.getByTestId('login-submit').or(page.locator('button[type="submit"], button:has-text("Access Workspace")').first());
    this.errorMessage = page.locator('div:has-text("Invalid credentials"), div:has-text("not found"), div:has-text("Suspended"), [style*="rgba(244, 63, 94"]').first();
  }

  async login(username: string, password = '1234'): Promise<void> {
    await this.goto('/');
    await this.page.waitForTimeout(400);

    // If already logged in, log out first
    const isLoginPage = await this.submitButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isLoginPage) {
      await this.logout();
      await this.page.waitForTimeout(400);
    }

    if (await this.usernameInput.isVisible()) {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.submitButton.click();
    } else if (await this.quickSelectDropdown.isVisible()) {
      await this.quickSelectDropdown.selectOption({ label: username }).catch(() => {
        return this.quickSelectDropdown.selectOption(username);
      });
      await this.submitButton.click();
    }
    
    // If successful login credentials, wait for dashboard to mount
    if (password !== 'wrong_password' && !username.includes('invalid')) {
      await this.expectLoggedIn().catch(() => {});
    }
    await this.page.waitForTimeout(300);
  }

  async quickSelectUser(userIdentifier: string): Promise<void> {
    await this.goto('/');
    if (await this.quickSelectDropdown.isVisible({ timeout: 3000 })) {
      await this.quickSelectDropdown.selectOption({ label: userIdentifier }).catch(async () => {
        await this.quickSelectDropdown.selectOption(userIdentifier);
      });
      await this.submitButton.click();
      await this.page.waitForTimeout(600);
    } else {
      await this.login(userIdentifier, '1234');
    }
  }

  async expectLoginError(expectedText?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 6000 });
    if (expectedText) {
      await expect(this.errorMessage).toContainText(expectedText, { ignoreCase: true });
    }
  }
}
