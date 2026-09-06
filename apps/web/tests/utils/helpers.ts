import { Page, expect, TestInfo } from '@playwright/test';

/**
 * Validates that an order with orderNumber displays the exact expectedStatus in the UI table or details.
 */
export async function expectOrderStatus(page: Page, orderNumber: string, expectedStatus: string): Promise<void> {
  // Search for the order in table if search box exists
  const searchInput = page.locator('input[placeholder*="Search by order"], input[placeholder*="Search orders"], input[placeholder*="Search"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill(orderNumber);
    await page.waitForTimeout(300);
  }

  const row = page.locator(`tr:has-text("${orderNumber}")`);
  await expect(row).toBeVisible({ timeout: 8000 });

  // Status cell or badge verification
  const statusBadge = row.locator('.status-badge, [class*="status"], td:has-text("' + expectedStatus + '")');
  await expect(statusBadge.first()).toContainText(expectedStatus, { ignoreCase: true });
}

/**
 * Polls / waits until an order transitions to expectedStatus
 */
export async function waitForOrderStatus(page: Page, orderNumber: string, expectedStatus: string, timeoutMs = 10000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const searchInput = page.locator('input[placeholder*="Search by order"], input[placeholder*="Search orders"], input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(orderNumber);
      }
      const row = page.locator(`tr:has-text("${orderNumber}")`);
      if (await row.isVisible()) {
        const text = await row.innerText();
        if (text.toUpperCase().includes(expectedStatus.toUpperCase())) {
          return;
        }
      }
    } catch {
      // Retry polling
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Timeout waiting for order ${orderNumber} to reach status "${expectedStatus}"`);
}

/**
 * Captures screenshot and diagnostic logs on failure
 */
export async function captureFailureContext(page: Page, testInfo: TestInfo, contextInfo: Record<string, any>): Promise<void> {
  const screenshotPath = testInfo.outputPath(`failure-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testInfo.attach('failure-screenshot', { path: screenshotPath, contentType: 'image/png' });
  testInfo.attach('failure-context', {
    body: JSON.stringify(contextInfo, null, 2),
    contentType: 'application/json'
  });
}
