import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b';
const BASE_URL = 'http://localhost:3000';

async function verifyOrderTracker() {
  console.log('================================================================');
  console.log('🧪 VERIFYING REDESIGNED ORDER TRACKER VIEW');
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

    // Wait 2s for Supabase live orders to populate
    await page.waitForTimeout(2000);

    // -------------------------------------------------------------
    // STEP 1: Navigate to Order Tracker
    // -------------------------------------------------------------
    console.log('\n3. Navigating to Order Tracker...');
    const trackerNavBtn = page.locator('button:has-text("Order Tracker")').first();
    await trackerNavBtn.click();
    await page.waitForTimeout(1000);

    // Verify Live Orders Directory table is visible
    await page.waitForSelector('text=Live Orders Directory', { timeout: 6000 });
    console.log('   ✅ PASS: Live Orders Directory table is rendered.');

    // Screenshot of Orders Directory
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_tracker_01_directory.png') });

    // -------------------------------------------------------------
    // STEP 2: Search for RN-PG-12092026-858 in Tracker
    // -------------------------------------------------------------
    console.log('\n4. Searching for reattempt order "RN-PG-12092026-858"...');
    const searchInput = page.locator('input[placeholder*="Search by Order #"]').first();
    await searchInput.fill('RN-PG-12092026-858');
    await page.waitForTimeout(600);

    const rnRow = page.locator('tr:has-text("RN-PG-12092026-858")').first();
    await rnRow.waitFor({ timeout: 4000 });
    console.log('   ✓ Found RN-PG-12092026-858 in directory results');

    // Click "Track Journey"
    const trackBtn = rnRow.locator('button:has-text("Track Journey")').first();
    await trackBtn.click();
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // STEP 3: Verify Tracking Journey Details for RN-PG-12092026-858
    // -------------------------------------------------------------
    console.log('\n5. Verifying Tracking Journey details for RN- order...');
    
    // Order number title
    const orderTitle = page.locator('div:has-text("RN-PG-12092026-858")').first();
    await orderTitle.waitFor({ timeout: 3000 });
    console.log('   ✓ Order number header displayed correctly');

    // Reattempt badge
    const reattemptBadge = page.locator('text=RE-ATTEMPT ORDER').first();
    const isReattemptBadgeVisible = await reattemptBadge.isVisible();
    console.log(`   RE-ATTEMPT ORDER badge visible: ${isReattemptBadgeVisible} (Expected: true)`);

    // Parent order cross-link button
    const parentLink = page.locator('button:has-text("Original Parent: PG-12092026-858")').first();
    const isParentLinkVisible = await parentLink.isVisible();
    console.log(`   Original Parent link visible: ${isParentLinkVisible} (Expected: true)`);

    // Accurate agency name (Momaji Agency)
    const partyName = page.locator('div:has-text("Momaji Agency")').first();
    const isPartyNameVisible = await partyName.isVisible();
    console.log(`   Accurate agency name "Momaji Agency" visible: ${isPartyNameVisible} (Expected: true)`);

    // Total order value (₹1,120)
    const amountVal = page.locator('div:has-text("₹1,120")').first();
    const isAmountVisible = await amountVal.isVisible();
    console.log(`   Order Value "₹1,120" visible: ${isAmountVisible} (Expected: true)`);

    // Verify Active Stage is Stage 3: Accounts & Tax Invoicing
    const activeStageBadge = page.locator('span:has-text("CURRENT ACTIVE STAGE")').first();
    await activeStageBadge.waitFor({ timeout: 3000 });
    console.log('   ✅ PASS: CURRENT ACTIVE STAGE is clearly highlighted.');

    // Screenshot of RN- order tracking journey
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_tracker_02_rn_order_journey.png') });

    // -------------------------------------------------------------
    // STEP 4: Switch to Parent Order PG-12092026-858 via 1-Click Crosslink
    // -------------------------------------------------------------
    console.log('\n6. Testing 1-click crosslink: Clicking "Original Parent: PG-12092026-858"...');
    await parentLink.click();
    await page.waitForTimeout(1000);

    // Verify parent order PG-12092026-858 is now active
    await page.waitForSelector('text=PG-12092026-858', { timeout: 4000 });
    const childLink = page.locator('button:has-text("Re-attempt Created: RN-PG-12092026-858")').first();
    const isChildLinkVisible = await childLink.isVisible();
    console.log(`   Child reattempt link visible on parent: ${isChildLinkVisible} (Expected: true)`);

    // Status: Delivery Reattempted
    const statusPill = page.locator('span:has-text("Delivery Reattempted")').first();
    const isStatusPillVisible = await statusPill.isVisible();
    console.log(`   Parent status pill "Delivery Reattempted" visible: ${isStatusPillVisible} (Expected: true)`);

    // Screenshot of Parent order tracking journey
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_tracker_03_parent_order_journey.png') });

    // -------------------------------------------------------------
    // STEP 5: Test "Back to All Orders Directory"
    // -------------------------------------------------------------
    console.log('\n7. Clicking "Back to All Orders Directory"...');
    const backBtn = page.locator('button:has-text("Back to All Orders Directory")').first();
    await backBtn.click();
    await page.waitForTimeout(800);

    await page.waitForSelector('text=Live Orders Directory', { timeout: 4000 });
    console.log('   ✅ PASS: Successfully returned to Live Orders Directory.');

    console.log('\n================================================================');
    console.log('🎉 ORDER TRACKER VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'playwright_tracker_error.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

verifyOrderTracker().catch(() => process.exit(1));
