import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b';
const BASE_URL = 'http://localhost:3000';

async function verifyPodBillingReattempt() {
  console.log('================================================================');
  console.log('🧪 VERIFYING POD VERIFICATION IN BILLING: 2 OPTIONS & RN- REATTEMPT');
  console.log('   & DISPATCH IMMUTABILITY (NO EDIT IN BILLING OR SALE ORDER)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('1. Loading application at ' + BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Login as Super Admin (renuka)
    console.log('2. Logging in as renuka / 1234...');
    const usernameInput = page.locator('input[data-testid="login-username"]');
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('renuka');
      await page.locator('input[type="password"]').fill('1234');
      await page.locator('button[data-testid="login-submit"]').click();
      await page.waitForSelector('text=Super Admin Control Dashboard', { timeout: 10000 });
      console.log('   ✓ Logged in as Super Admin (renuka)');
    }

    // Dismiss any active toast
    try {
      const toastBtn = page.locator('div[style*="zIndex: 99999"] button').first();
      if (await toastBtn.isVisible({ timeout: 1000 })) await toastBtn.click();
    } catch {}

    // -------------------------------------------------------------
    // TEST 1: Sales Orders - Dispatched/Completed order must NOT have edit option
    // -------------------------------------------------------------
    console.log('\n3. Testing Sales Orders view: Dispatched/Completed order WP-12092026-123 must NOT be editable...');
    const ordersNavBtn = page.locator('button:has-text("Orders & Approvals"), button:has-text("Sales Orders")').first();
    await ordersNavBtn.click();
    await page.waitForTimeout(1000);

    // Search for WP-12092026-123 using the search box
    const searchInput = page.locator('input[placeholder*="Search orders"]').first();
    await searchInput.fill('WP-12092026-123');
    await page.waitForTimeout(800);

    // Find row for WP-12092026-123
    const dispRow = page.locator('tr:has-text("WP-12092026-123")').first();
    await dispRow.waitFor({ timeout: 6000 });
    console.log('   ✓ Found row for order WP-12092026-123');

    // Verify Edit button is NOT visible in row
    const editBtnInRow = dispRow.locator('button:has-text("Edit")');
    const isEditInRowVisible = await editBtnInRow.isVisible();
    console.log(`   Table row Edit button visible: ${isEditInRowVisible} (Expected: false)`);
    if (isEditInRowVisible) {
      throw new Error('FAIL: Edit button should NOT be visible on dispatched/completed order in Orders table!');
    }
    console.log('   ✅ PASS: Edit button is correctly hidden on dispatched order in Sales table.');

    // Click row to view sidebar / drawer details
    await dispRow.click();
    await page.waitForTimeout(800);

    // Verify "Order Dispatched — Edits Locked" is shown
    const lockBadge = page.locator('text=Order Dispatched — Edits Locked').first();
    const isLockBadgeVisible = await lockBadge.isVisible({ timeout: 3000 });
    console.log(`   Sidebar lock badge visible: ${isLockBadgeVisible} (Expected: true)`);
    if (!isLockBadgeVisible) {
      throw new Error('FAIL: "Order Dispatched — Edits Locked" badge must be shown in order details!');
    }
    console.log('   ✅ PASS: "Order Dispatched — Edits Locked" is displayed in order details.');

    // Take screenshot of Sales Orders locked state
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_pod_01_orders_locked.png') });

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // TEST 2: Billing Console - Dispatched/Completed order must NOT have Edit Invoice
    // -------------------------------------------------------------
    console.log('\n4. Testing Billing Console: Dispatched order WP-12092026-123 must NOT have "Edit Invoice" button...');
    const billingNavBtn = page.locator('button:has-text("Accounts & Billing"), button:has-text("Accounts")').first();
    await billingNavBtn.click();
    await page.waitForTimeout(1000);

    // Ensure we are on Tab 1 ("Tax Bills & Invoices")
    const billsTab = page.locator('button:has-text("Tax Bills & Invoices"), button:has-text("Issue Bills / Invoices")').first();
    if (await billsTab.isVisible()) {
      await billsTab.click();
      await page.waitForTimeout(600);
    }

    // Search for WP-12092026-123 in Billing
    await searchInput.fill('WP-12092026-123');
    await page.waitForTimeout(800);

    // Locate WP-12092026-123 in Billing table
    const billingDispRow = page.locator('tr:has-text("WP-12092026-123")').first();
    await billingDispRow.waitFor({ timeout: 6000 });
    
    // Check for "Edit Invoice" button
    const editInvoiceBtn = billingDispRow.locator('button:has-text("Edit Invoice")');
    const isEditInvoiceVisible = await editInvoiceBtn.isVisible();
    console.log(`   Billing Edit Invoice button visible: ${isEditInvoiceVisible} (Expected: false)`);
    if (isEditInvoiceVisible) {
      throw new Error('FAIL: "Edit Invoice" button must NOT be visible for dispatched order in Billing!');
    }
    console.log('   ✅ PASS: "Edit Invoice" button is correctly hidden for dispatched order in Billing.');

    // Verify "Delivery Challan" button IS visible
    const challanBtn = billingDispRow.locator('button:has-text("Delivery Challan")');
    const isChallanVisible = await challanBtn.isVisible();
    console.log(`   Delivery Challan button visible: ${isChallanVisible} (Expected: true)`);
    if (!isChallanVisible) {
      throw new Error('FAIL: "Delivery Challan" button should be visible for dispatched order!');
    }
    console.log('   ✅ PASS: "Delivery Challan" view is accessible without editing.');

    // Take screenshot of Billing Tab 1
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_pod_02_billing_locked.png') });

    // Clear search for next step
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // TEST 3: Billing Tab 2 (Issue GRN) - Must provide 2 Options on PG-12092026-858
    // -------------------------------------------------------------
    console.log('\n5. Testing Billing Tab 2: GRN queue must provide 2 Options: "Issue GRN" and "Re-attempt Delivery"...');
    const grnTabBtn = page.locator('button:has-text("Issue GRN")').first();
    await grnTabBtn.click();
    await page.waitForTimeout(800);

    // Search for PG-12092026-858 in GRN queue
    await searchInput.fill('PG-12092026-858');
    await page.waitForTimeout(800);

    // Locate row for PG-12092026-858
    const grnRow = page.locator('tr:has-text("PG-12092026-858")').first();
    await grnRow.waitFor({ timeout: 6000 });
    console.log('   ✓ Found pending exception order PG-12092026-858 in Billing GRN queue');

    // Check Option 1: "1. Issue GRN" button
    const issueGrnBtn = grnRow.locator('button:has-text("Issue GRN")').first();
    const isIssueGrnVisible = await issueGrnBtn.isVisible();
    console.log(`   Option 1 ("Issue GRN") button visible: ${isIssueGrnVisible} (Expected: true)`);
    if (!isIssueGrnVisible) {
      throw new Error('FAIL: Option 1 ("Issue GRN") button is not visible!');
    }

    // Check Option 2: "2. Re-attempt Delivery" button
    const reattemptBtn = grnRow.locator('button:has-text("Re-attempt Delivery")').first();
    const isReattemptVisible = await reattemptBtn.isVisible();
    console.log(`   Option 2 ("Re-attempt Delivery") button visible: ${isReattemptVisible} (Expected: true)`);
    if (!isReattemptVisible) {
      throw new Error('FAIL: Option 2 ("Re-attempt Delivery") button is not visible in Billing!');
    }
    console.log('   ✅ PASS: Both options (Issue GRN and Re-attempt Delivery) are available in Billing!');

    // Screenshot of Billing GRN Queue with 2 options
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_pod_03_billing_grn_queue_2options.png') });

    // -------------------------------------------------------------
    // TEST 4: Click "Re-attempt Delivery" and verify RN- new order generation
    // -------------------------------------------------------------
    console.log('\n6. Clicking "2. Re-attempt Delivery" to generate new RN- order...');
    await reattemptBtn.click();
    await page.waitForTimeout(600);

    // Verify Reattempt Modal opened
    await page.waitForSelector('text=Re-attempt Delivery (Create New Order)', { timeout: 4000 });
    console.log('   ✓ Re-attempt Delivery modal opened');

    // Verify New Order Number is RN-PG-12092026-858
    const expectedNewOrderNumber = 'RN-PG-12092026-858';
    const hasExpectedNumber = await page.locator(`strong:has-text("${expectedNewOrderNumber}")`).first().isVisible();
    console.log(`   New order preview ${expectedNewOrderNumber} visible: ${hasExpectedNumber} (Expected: true)`);
    if (!hasExpectedNumber) {
      throw new Error(`FAIL: Modal does not show expected new order number ${expectedNewOrderNumber}!`);
    }
    console.log(`   ✅ PASS: Modal previews exact new order number "${expectedNewOrderNumber}".`);

    // Screenshot of Reattempt Confirmation Modal
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_pod_04_reattempt_modal.png') });

    // Confirm creation
    const confirmReattemptBtn = page.locator('button:has-text("Confirm & Create RN Order")').first();
    await confirmReattemptBtn.click();
    await page.waitForTimeout(1500);
    console.log('   ✓ Confirmed creation of RN- order');

    // Clear search input
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // TEST 5: Verify New Order RN-PG-12092026-858 exists in Billing Queue
    // -------------------------------------------------------------
    console.log('\n7. Verifying that RN-PG-12092026-858 appears in Billing Queue ready for fresh billing...');
    // Switch to Bills tab
    await billsTab.click();
    await page.waitForTimeout(800);

    // Search for RN-PG-12092026-858
    await searchInput.fill('RN-PG-12092026-858');
    await page.waitForTimeout(800);

    const rnOrderRow = page.locator('tr:has-text("RN-PG-12092026-858")').first();
    await rnOrderRow.waitFor({ timeout: 6000 });
    console.log('   ✅ PASS: New order "RN-PG-12092026-858" is present in Billing Queue!');

    // Verify it has "Issue Bill"
    const issueBillBtn = rnOrderRow.locator('button:has-text("Issue Bill"), button:has-text("Review / Modify Bill")').first();
    const isIssueBillVisible = await issueBillBtn.isVisible();
    console.log(`   Issue Bill action available on new order: ${isIssueBillVisible} (Expected: true)`);
    if (!isIssueBillVisible) {
      throw new Error('FAIL: New RN- order should have "Issue Bill" button ready for billing workflow!');
    }
    console.log('   ✅ PASS: RN- order enters fresh billing cycle identically ("all process same").');

    // Screenshot of new order in Billing
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_pod_05_final_verified.png') });

    console.log('\n================================================================');
    console.log('🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_pod_error.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

verifyPodBillingReattempt().catch(() => process.exit(1));
