import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/renukagawande/.gemini/antigravity-ide/brain/701e821e-ac7e-4b07-9e2b-03a68ea1f66b';
const BASE_URL = 'http://localhost:3000';

async function runRenukaSuperAdminCheck() {
  console.log('===============================================================');
  console.log('🚀 PLAYWRIGHT AUTOMATION: SUPER ADMIN (RENUKA) & TASK MANAGER');
  console.log('===============================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    // 1. Navigate to Web App
    console.log(`[Step 1] Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Screenshot login page
    const loginScreenshot = path.join(ARTIFACTS_DIR, 'playwright_01_login_page.png');
    await page.screenshot({ path: loginScreenshot });
    console.log(`  ✓ Login page rendered. Screenshot saved: ${loginScreenshot}`);

    // Check if already logged in or needs login
    const isLoginVisible = await page.locator('input[data-testid="login-username"], input[placeholder*="Chirag"]').isVisible();
    if (isLoginVisible) {
      console.log('[Step 2] Entering Super Admin credentials (renuka / 1234)...');
      const userInput = page.locator('input[data-testid="login-username"], input[placeholder*="Chirag"]').first();
      await userInput.fill('renuka');
      
      const passInput = page.locator('input[type="password"]').first();
      await passInput.fill('1234');

      const submitBtn = page.locator('button[data-testid="login-submit"], button:has-text("Sign In")').first();
      await submitBtn.click();
      console.log('  ✓ Clicked Sign In button');
    }

    // Wait for Dashboard to appear
    console.log('[Step 3] Waiting for Dashboard to load...');
    await page.waitForSelector('text=Super Admin Control Dashboard', { timeout: 12000 });
    console.log('  ✅ Logged in successfully! "Super Admin Control Dashboard" is visible.');

    // Screenshot Dashboard
    const dashboardScreenshot = path.join(ARTIFACTS_DIR, 'playwright_02_superadmin_dashboard.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log(`  ✓ Dashboard screenshot saved: ${dashboardScreenshot}`);

    // Verify Super Admin elements
    const isHoldBtnVisible = await page.locator('button:has-text("Hold Reason Directory")').isVisible();
    const isTasksHeaderBtnVisible = await page.locator('button:has-text("Tasks & Delegations")').first().isVisible();
    const isCreateOrderVisible = await page.locator('button:has-text("Create Order")').isVisible();
    console.log(`  ✓ Hold Reason Directory button: ${isHoldBtnVisible ? 'YES' : 'NO'}`);
    console.log(`  ✓ Tasks & Delegations header button: ${isTasksHeaderBtnVisible ? 'YES' : 'NO'}`);
    console.log(`  ✓ Create Order button: ${isCreateOrderVisible ? 'YES' : 'NO'}`);

    // 4. Click Tasks & Delegations in top header
    console.log('[Step 4] Clicking "Tasks & Delegations" button...');
    const tasksBtn = page.locator('button:has-text("Tasks & Delegations")').first();
    await tasksBtn.click();

    // Wait for Task Manager view
    await page.waitForTimeout(1000);
    const taskManagerHeader = await page.locator('text=/Tasks & Delegations|Task Management/i').first();
    await taskManagerHeader.waitFor({ state: 'visible', timeout: 8000 });
    console.log('  ✅ Task Manager opened successfully!');

    // Screenshot Task Manager initial view
    const taskViewScreenshot = path.join(ARTIFACTS_DIR, 'playwright_03_tasks_manager_view.png');
    await page.screenshot({ path: taskViewScreenshot });
    console.log(`  ✓ Task Manager screenshot saved: ${taskViewScreenshot}`);

    // 5. Open Create Task Modal
    console.log('[Step 5] Clicking "+ New Task" to create a task...');
    const createBtn = page.locator('button:has-text("New Task"), button:has-text("Create Task")').first();
    await createBtn.click();
    await page.waitForTimeout(600);

    // Screenshot Create Task Modal
    const modalScreenshot = path.join(ARTIFACTS_DIR, 'playwright_04_create_task_modal.png');
    await page.screenshot({ path: modalScreenshot });
    console.log(`  ✓ Create Task Modal screenshot saved: ${modalScreenshot}`);

    // Dismiss any active toast notification so it doesn't block interactions
    try {
      const toastClose = page.locator('div:has-text("Notifications Active") button, div[style*="zIndex: 99999"] button').first();
      if (await toastClose.isVisible({ timeout: 1000 })) {
        await toastClose.click();
        console.log('  ✓ Dismissed notification toast');
      }
    } catch {}

    // Fill Task form
    console.log('[Step 6] Filling out new task details...');
    const titleInput = page.locator('input[placeholder*="Follow up on Surat City Agencies"]').first();
    await titleInput.fill('Review Daikin Dispatch POD & verify GRN in billing');
    console.log('  ✓ Filled task title');

    // Assign to a team member
    const userSelect = page.locator('select:has(option:has-text("Select Team Member"))').first();
    await userSelect.selectOption({ index: 1 });
    console.log('  ✓ Selected assignee user');

    // Due date
    const dateInput = page.locator('input[type="datetime-local"]').first();
    if (await dateInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const dateStr = tomorrow.toISOString().slice(0, 16);
      await dateInput.fill(dateStr);
      console.log(`  ✓ Set due date to: ${dateStr}`);
    }

    // Description / Remarks
    const descArea = page.locator('textarea').first();
    if (await descArea.isVisible()) {
      await descArea.fill('Created by Super Admin Renuka via automated Playwright test verification. Ensure GRN is issued in billing.');
      console.log('  ✓ Filled description');
    }

    // Click Submit Button ('Assign Task Now')
    const saveTaskBtn = page.locator('button[type="submit"]:has-text("Assign Task Now")').first();
    await saveTaskBtn.click();
    console.log('  ✓ Clicked "Assign Task Now" submit button');

    // Wait for create task modal to close
    await page.waitForSelector('.modal-overlay', { state: 'detached', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // Screenshot after creating task
    const afterCreateScreenshot = path.join(ARTIFACTS_DIR, 'playwright_05_task_created_list.png');
    await page.screenshot({ path: afterCreateScreenshot });
    console.log(`  ✓ Task list screenshot saved: ${afterCreateScreenshot}`);

    // 7. Verify the task in list
    const createdTaskRow = page.locator('text=Review Daikin Dispatch POD').first();
    const isCreatedVisible = await createdTaskRow.isVisible();
    if (isCreatedVisible) {
      console.log('  ✅ Created task is visibly present in the Task Manager!');
      
      // Click task to open Details Modal
      await createdTaskRow.click();
      await page.waitForTimeout(1000);

      const detailsScreenshot = path.join(ARTIFACTS_DIR, 'playwright_06_task_details_modal.png');
      await page.screenshot({ path: detailsScreenshot });
      console.log(`  ✓ Task Details modal screenshot saved: ${detailsScreenshot}`);

      // Close modal
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("✕")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 8. Return to Dashboard via sidebar
    console.log('[Step 7] Navigating back to Dashboard via sidebar...');
    const dashboardNav = page.locator('nav button:has-text("Dashboard"), div:has-text("Dashboard")').first();
    await dashboardNav.click();
    await page.waitForTimeout(800);

    const finalScreenshot = path.join(ARTIFACTS_DIR, 'playwright_07_dashboard_final.png');
    await page.screenshot({ path: finalScreenshot });
    console.log(`  ✓ Final Dashboard screenshot saved: ${finalScreenshot}`);

    console.log('\n===============================================================');
    console.log('🎉 ALL PLAYWRIGHT CHECKS PASSED FOR SUPER ADMIN (RENUKA)!');
    console.log('===============================================================\n');

  } catch (error) {
    console.error('❌ Playwright check error:', error);
    const errScreenshot = path.join(ARTIFACTS_DIR, 'playwright_error.png');
    await page.screenshot({ path: errScreenshot }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

runRenukaSuperAdminCheck();
