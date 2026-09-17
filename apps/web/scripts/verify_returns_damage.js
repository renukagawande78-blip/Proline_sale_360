import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('1. Loading application at http://localhost:3000');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Login
  const userInput = await page.$('input[type="text"], input[name="username"], input[placeholder*="username" i]');
  if (userInput) {
    await userInput.fill('renuka');
    const passInput = await page.$('input[type="password"]');
    if (passInput) await passInput.fill('1234');
    const loginBtn = await page.$('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]');
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(1500);
  }

  console.log('2. Navigating to Returns & Damage...');
  const returnsNavItem = await page.$('button:has-text("Returns & Damage"), a:has-text("Returns & Damage")');
  if (returnsNavItem) {
    await returnsNavItem.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b/playwright_returns_01_view.png' });
  console.log('✓ Captured Returns view screenshot');

  // Click Raise Return / Damage Request in Returns View
  const raiseBtn = await page.$('button:has-text("Raise Return / Damage Request")');
  if (raiseBtn) {
    console.log('3. Clicking "Raise Return / Damage Request" button in Returns Register...');
    await raiseBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b/playwright_returns_02_picker_modal.png' });
    console.log('✓ Captured Order Picker modal screenshot');

    // Close modal
    const closeBtn = await page.$('.modal-card button:has-text("✕"), .modal-card button svg');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(400);
  }

  // Go to Orders view
  console.log('4. Navigating to Orders & Approvals...');
  const ordersNavItem = await page.$('button:has-text("Orders & Approvals"), button:has-text("Sales Orders"), a:has-text("Orders")');
  if (ordersNavItem) {
    await ordersNavItem.click();
    await page.waitForTimeout(1000);
  }

  // Check Return/Damage button on order rows
  const returnBtn = await page.$('button:has-text("Return/Damage")');
  if (returnBtn) {
    console.log('5. Clicking "Return/Damage" on order row...');
    await returnBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b/playwright_returns_03_damage_modal.png' });
    console.log('✓ Captured Return/Damage Request modal screenshot');
  }

  // Check POD Queue
  console.log('6. Navigating to POD Queue...');
  const podNavItem = await page.$('button:has-text("POD Queue"), a:has-text("POD Queue")');
  if (podNavItem) {
    await podNavItem.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b/playwright_returns_04_pod_queue.png' });
    console.log('✓ Captured POD Queue screenshot');
  }

  console.log('🎉 Verification completed!');
  await browser.close();
})();
