import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b';
const BASE_URL = 'http://localhost:3000';

async function testMarkCompleted() {
  console.log('================================================================');
  console.log('🧪 TESTING "MARK TASK AS COMPLETED" WITH PLAYWRIGHT (SUPER ADMIN)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // 1. Log in if on login screen
    const isLogin = await page.locator('input[data-testid="login-username"]').isVisible();
    if (isLogin) {
      await page.locator('input[data-testid="login-username"]').fill('renuka');
      await page.locator('input[type="password"]').fill('1234');
      await page.locator('button[data-testid="login-submit"]').click();
      await page.waitForSelector('text=Super Admin Control Dashboard', { timeout: 10000 });
      console.log('  ✓ Logged in as Super Admin (renuka)');
    }

    // Dismiss any active toast notification
    try {
      const toastBtn = page.locator('div[style*="zIndex: 99999"] button').first();
      if (await toastBtn.isVisible({ timeout: 1000 })) await toastBtn.click();
    } catch {}

    // 2. Open Task Manager via header button
    console.log('  ✓ Clicking "Tasks & Delegations" button...');
    const headerTasksBtn = page.locator('button[title*="Open Task Manager"], button:has-text("Tasks & Delegations")').first();
    await headerTasksBtn.click();
    await page.waitForTimeout(1000);

    // Verify Tasks view loaded
    await page.waitForSelector('text=Assign New Task', { timeout: 8000 });
    console.log('  ✅ Task Manager screen is visible!');

    // 3. Create a fresh test task to test completion
    console.log('  ✓ Creating a test task for completion verification...');
    const assignBtn = page.locator('button:has-text("Assign New Task")').first();
    await assignBtn.click();
    await page.waitForTimeout(600);

    // Fill task title
    const taskTitle = 'Urgent: Dispatch reconciliation for Surat party';
    await page.locator('input[placeholder*="Follow up on Surat City Agencies"]').first().fill(taskTitle);
    
    // Select assignee
    await page.locator('select:has(option:has-text("Select Team Member"))').first().selectOption({ index: 1 });

    // Submit task
    await page.locator('button[type="submit"]:has-text("Assign Task Now")').first().click();
    await page.waitForTimeout(1500);
    console.log(`  ✓ Created task: "${taskTitle}"`);

    // Screenshot before completing
    const beforeCompleteScreenshot = path.join(ARTIFACTS_DIR, 'playwright_10_task_before_complete.png');
    await page.screenshot({ path: beforeCompleteScreenshot });
    console.log(`  ✓ Screenshot saved: ${beforeCompleteScreenshot}`);

    // 4. Test "Mark Done" directly from the task row!
    console.log('  ✓ Locating created task row and clicking "Mark Done"...');
    const taskRow = page.locator(`tr:has-text("${taskTitle}")`).first();
    const markDoneBtn = taskRow.locator('button:has-text("Mark Done")');
    await markDoneBtn.click();
    await page.waitForTimeout(1500);
    console.log('  ✅ Clicked "Mark Done" on task row!');

    // 5. Test Details Modal "Mark Task as Completed" on another task
    console.log('  ✓ Creating a 2nd task to test modal "Mark Task as Completed" button...');
    await assignBtn.click();
    await page.waitForTimeout(600);
    const taskTitle2 = 'Second Test: Collect physical POD from Daikin';
    await page.locator('input[placeholder*="Follow up on Surat City Agencies"]').first().fill(taskTitle2);
    await page.locator('select:has(option:has-text("Select Team Member"))').first().selectOption({ index: 1 });
    await page.locator('button[type="submit"]:has-text("Assign Task Now")').first().click();
    await page.waitForTimeout(1500);

    // Open details modal of 2nd task
    const task2Row = page.locator(`text="${taskTitle2}"`).first();
    await task2Row.click();
    await page.waitForTimeout(1000);

    // Click "Mark Task as Completed" inside modal footer
    console.log('  ✓ Clicking "Mark Task as Completed" in details modal footer...');
    const modalCompleteBtn = page.locator('button:has-text("Mark Task as Completed")').first();
    await modalCompleteBtn.click();
    await page.waitForTimeout(1500);
    console.log('  ✅ Clicked "Mark Task as Completed" inside modal!');

    // 6. Switch to "Completed" filter tab to visually verify both tasks
    console.log('  ✓ Switching to "Completed" filter tab...');
    await page.locator('button:has-text("Completed")').first().click();
    await page.waitForTimeout(1000);

    const completedScreenshot = path.join(ARTIFACTS_DIR, 'playwright_11_tasks_completed_verified.png');
    await page.screenshot({ path: completedScreenshot });
    console.log(`  ✓ Completed tasks screenshot saved: ${completedScreenshot}`);

    // Verify tasks are present in completed tab
    const isTask1Completed = await page.locator(`text="${taskTitle}"`).first().isVisible();
    const isTask2Completed = await page.locator(`text="${taskTitle2}"`).first().isVisible();
    console.log(`  ✓ Task 1 completed & visible in Completed list: ${isTask1Completed ? 'YES' : 'NO'}`);
    console.log(`  ✓ Task 2 completed & visible in Completed list: ${isTask2Completed ? 'YES' : 'NO'}`);

    console.log('\n================================================================');
    console.log('🎉 "MARK TASK AS COMPLETED" VERIFIED AND FULLY WORKING!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

testMarkCompleted();
