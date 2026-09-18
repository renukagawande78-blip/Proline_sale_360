import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/renukagawande/.gemini/antigravity-ide/brain/fba46fe9-8a64-4105-9645-59c3fefe6ef5';

async function main() {
  console.log('Launching Chrome for screenshot capture...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('Navigating to Live Web App...');
  await page.goto('https://proline-oms-360.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check if Login page is shown
  const loginInput = page.locator('input[placeholder*="Chirag"]');
  if (await loginInput.count() > 0) {
    console.log('Logging in as Chirag (Super Admin)...');
    await loginInput.fill('chirag');
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.fill('0706');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(3000);
  }

  // 1. Dashboard screenshot
  console.log('Capturing Dashboard screenshot...');
  // Scroll down a bit to show Recent B2B Order Stream table clearly
  await page.evaluate(() => window.scrollBy(0, 350));
  await page.waitForTimeout(1000);
  const dashPath = path.join(ARTIFACT_DIR, 'dashboard_billed_qty.png');
  await page.screenshot({ path: dashPath });
  console.log('Saved dashboard screenshot:', dashPath);

  // 2. Open Order Details modal for completed order (or order with 172/162)
  console.log('Locating order with Details button...');
  const detailsButtons = page.locator('button:has-text("Details")');
  const count = await detailsButtons.count();
  console.log(`Found ${count} Details buttons`);

  if (count > 0) {
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const btn = detailsButtons.nth(i);
      const row = btn.locator('xpath=ancestor::tr');
      const text = await row.innerText().catch(() => '');
      if (text.includes('162') || text.includes('COMPLETED') || text.includes('172')) {
        console.log(`Clicking details for row index ${i}`);
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      console.log('Clicking first Details button');
      await detailsButtons.first().click();
    }

    await page.waitForTimeout(2000);
    const detailsModalPath = path.join(ARTIFACT_DIR, 'order_details_modal.png');
    await page.screenshot({ path: detailsModalPath });
    console.log('Saved order details modal screenshot:', detailsModalPath);

    // Close modal
    const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"], button:has-text("✕")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  // 3. Navigate to Orders page
  console.log('Navigating to Orders view...');
  const ordersNav = page.locator('nav button:has-text("Orders"), aside button:has-text("Orders"), button:has-text("Orders")').first();
  if (await ordersNav.count() > 0) {
    await ordersNav.click();
    await page.waitForTimeout(2500);
    const ordersPath = path.join(ARTIFACT_DIR, 'orders_locked_edit.png');
    await page.screenshot({ path: ordersPath });
    console.log('Saved orders list screenshot:', ordersPath);
  }

  // 4. Navigate to Accounts page
  console.log('Navigating to Accounts view...');
  const accountsNav = page.locator('nav button:has-text("Accounts"), aside button:has-text("Accounts"), button:has-text("Accounts")').first();
  if (await accountsNav.count() > 0) {
    await accountsNav.click();
    await page.waitForTimeout(2500);
    const accountsPath = path.join(ARTIFACT_DIR, 'accounts_locked_edit.png');
    await page.screenshot({ path: accountsPath });
    console.log('Saved accounts list screenshot:', accountsPath);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
