import { chromium, devices } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/renukagawande/.gemini/antigravity-ide/brain/fba46fe9-8a64-4105-9645-59c3fefe6ef5';

async function main() {
  console.log('Launching mobile viewport test (Pixel 7: 412x915)...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Mobile Device Viewport (Android Phone)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  console.log('Navigating to live app on mobile...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Mobile Login Screen
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_login.png') });
  console.log('Saved mobile_login.png');

  // Check login
  const loginInput = page.locator('input[placeholder*="Chirag"]');
  if (await loginInput.count() > 0) {
    console.log('Logging in as Chirag on mobile...');
    await loginInput.fill('chirag');
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.fill('0706');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(3000);
  }

  // 2. Mobile Dashboard Screen
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_dashboard_top.png') });
  console.log('Saved mobile_dashboard_top.png');

  // Scroll down to see table and buttons on dashboard
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_dashboard_table.png') });
  console.log('Saved mobile_dashboard_table.png');

  // 3. Open Order Details Modal on mobile
  const detailsBtn = page.locator('button:has-text("Details")').first();
  if (await detailsBtn.count() > 0) {
    await detailsBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_order_modal.png') });
    console.log('Saved mobile_order_modal.png');

    // Scroll inside modal if scrollable
    await page.evaluate(() => {
      const modal = document.querySelector('.modal-content, [role="dialog"], .modal-body, div[style*="overflow"]');
      if (modal) modal.scrollTop = 300;
      else window.scrollBy(0, 300);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_order_modal_footer.png') });
    console.log('Saved mobile_order_modal_footer.png');

    const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"], button:has-text("✕")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  // 4. Mobile Header Menu / Drawer
  const menuBtn = page.locator('button[aria-label="Toggle Menu"], button:has-text("☰"), header button:has(svg)').first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_nav_menu.png') });
    console.log('Saved mobile_nav_menu.png');
  }

  // 5. Navigate to Orders on mobile
  const ordersNav = page.locator('button:has-text("Orders"), a:has-text("Orders")').first();
  if (await ordersNav.count() > 0) {
    await ordersNav.click().catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_orders_view.png') });
    console.log('Saved mobile_orders_view.png');

    // 5b. Open Create Order Modal on mobile
    const createOrderBtn = page.locator('button:has-text("Create Order")').first();
    if (await createOrderBtn.count() > 0) {
      await createOrderBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_create_order_modal.png') });
      console.log('Saved mobile_create_order_modal.png');
      await page.evaluate(() => {
        const modal = document.querySelector('.modal-card');
        if (modal) modal.scrollTop = 1500;
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_create_order_footer.png') });
      console.log('Saved mobile_create_order_footer.png');
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click().catch(() => {});
        await page.waitForTimeout(1000);
      }
    }

    // 5c. Open Invoice / Challan Modal
    const printChallanBtn = page.locator('button:has-text("Print"), button:has-text("Challan"), button:has-text("Invoice")').first();
    if (await printChallanBtn.count() > 0) {
      await printChallanBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_invoice_modal.png') });
      console.log('Saved mobile_invoice_modal.png');
      const closeInv = page.locator('button[title="Close"]').first();
      if (await closeInv.count() > 0) {
        await closeInv.click().catch(() => {});
        await page.waitForTimeout(1000);
      }
    }
  }

  await browser.close();
  console.log('Mobile screenshots capture completed!');
}

main().catch(err => {
  console.error('Mobile test failed:', err);
  process.exit(1);
});
