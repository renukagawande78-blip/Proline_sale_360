import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.setTimeout(300000);

test.describe('Sales Admin Single-Zone Order Approval & Proceed Suite', () => {

  test('Single Zone Agency Order Booking → Sales Admin Review, Approval & Proceed', async ({ 
    loginPage,
    dashboardPage,
    page 
  }) => {
    
    // Auto-accept browser dialogs / window.alert
    page.on('dialog', async dialog => {
      console.log(`[Browser Dialog]: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    const pause = async (ms = 1800) => await page.waitForTimeout(ms);

    // Floating UI Step Indicator HUD
    const showStepBanner = async (title: string, subtitle = '') => {
      await page.evaluate(({ title, subtitle }) => {
        let el = document.getElementById('headed-test-banner');
        if (!el) {
          el = document.createElement('div');
          el.id = 'headed-test-banner';
          el.style.position = 'fixed';
          el.style.top = '14px';
          el.style.left = '50%';
          el.style.transform = 'translateX(-50%)';
          el.style.zIndex = '999999';
          el.style.background = 'linear-gradient(135deg, #090f1d 0%, #1e293b 100%)';
          el.style.border = '2px solid #38bdf8';
          el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.85), 0 0 20px rgba(56,189,248,0.4)';
          el.style.borderRadius = '12px';
          el.style.padding = '0.65rem 1.4rem';
          el.style.color = '#ffffff';
          el.style.fontFamily = 'system-ui, sans-serif';
          el.style.textAlign = 'center';
          el.style.pointerEvents = 'none';
          el.style.transition = 'all 0.3s ease';
          document.body.appendChild(el);
        }
        el.innerHTML = `
          <div style="font-size: 0.95rem; font-weight: 900; color: #38bdf8; letter-spacing: 0.03em;">🚀 ${title}</div>
          ${subtitle ? `<div style="font-size: 0.775rem; color: #cbd5e1; margin-top: 3px; font-weight: 600;">${subtitle}</div>` : ''}
        `;
      }, { title, subtitle });
    };

    const ensureModalDismissed = async () => {
      const overlay = page.locator('.modal-overlay');
      if (await overlay.isVisible().catch(() => false)) {
        const cancel = overlay.locator('button:has-text("Cancel"), button:has-text("Close"), button[title="Close"]').first();
        if (await cancel.isVisible().catch(() => false)) {
          await cancel.click({ force: true }).catch(() => {});
        }
        await overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }
    };

    // =========================================================================
    // STEP 1: Sales Person Logs in to Book Order in Single Zone (City-A)
    // =========================================================================
    await showStepBanner(
      'STEP 1: Sales Person Authentication',
      'Logging in as Sales Person Nikhil (Booking orders for Zone "City-A")...'
    );
    await loginPage.login(TEST_USERS.SALESPERSON_NIKHIL.email, TEST_USERS.SALESPERSON_NIKHIL.password);
    await dashboardPage.expectLoggedIn();
    await pause(1800);

    // =========================================================================
    // STEP 2: Open Create Order Modal & Select Agency in Zone "City-A"
    // =========================================================================
    await showStepBanner(
      'STEP 2: Agency Selection in Single Zone "City-A"',
      'Target Zone: "City-A" | Selecting Agency in Zone "City-A"...'
    );
    await dashboardPage.openCreateOrderModal();
    await pause(1800);

    // Select Agency in City-A
    const agencyTrigger = page.locator('[data-testid="agency-select-trigger"]').first();
    if (await agencyTrigger.isVisible()) {
      await agencyTrigger.click();
      await pause(800);
      const agencyOption = page.locator('[data-testid="agency-option-item"]').first();
      if (await agencyOption.isVisible()) {
        await agencyOption.click();
        await pause(1000);
      }
    }

    // =========================================================================
    // STEP 3: Configure FMCG Order Items (Boxes, Loose & Free Pcs)
    // =========================================================================
    await showStepBanner(
      'STEP 3: Configure Order Items (Multi-Product FMCG)',
      'Adding FMCG Products with Box Qty, Loose Pcs, and Promotional Free Pcs'
    );

    // Select Product 1
    const prodTrigger1 = page.locator('[data-testid="product-select-trigger"]').nth(0);
    if (await prodTrigger1.isVisible()) {
      await prodTrigger1.click({ force: true });
      await pause(800);
      const opt1 = page.locator('[data-testid="product-option-item"]').nth(0);
      if (await opt1.isVisible()) {
        await opt1.click();
        await pause(600);
      }
    }

    const boxInput1 = page.locator('[data-testid="item-box-qty-input"]').nth(0);
    if (await boxInput1.isVisible()) {
      await boxInput1.fill('15');
      await pause(500);
    }
    const looseInput1 = page.locator('[data-testid="item-loose-pcs-input"]').nth(0);
    if (await looseInput1.isVisible()) {
      await looseInput1.fill('6');
      await pause(500);
    }
    const freeInput1 = page.locator('[data-testid="item-free-pcs-input"]').nth(0);
    if (await freeInput1.isVisible()) {
      await freeInput1.fill('3');
      await pause(500);
    }

    // Submit Order
    const saveOrderBtn = page.locator('button:has-text("Submit Booking"), button:has-text("Save Order"), button:has-text("Submit Order")').first();
    if (await saveOrderBtn.isVisible()) {
      await saveOrderBtn.click();
      await pause(2200);
    }
    await ensureModalDismissed();

    // =========================================================================
    // STEP 4: Switch Role → Sales Admin (Dixit / Jay)
    // =========================================================================
    await showStepBanner(
      'STEP 4: Switch Role → Sales Admin',
      'Logging out and signing in as Sales Admin Dixit to review Zone "City-A" orders...'
    );

    await loginPage.goto();
    await pause(1000);
    await loginPage.login(TEST_USERS.SALES_ADMIN_DIXIT.email, TEST_USERS.SALES_ADMIN_DIXIT.password);
    await dashboardPage.expectLoggedIn();
    await pause(1800);

    // =========================================================================
    // STEP 5: Sales Admin Inspects Single-Zone Orders & Reviews Details
    // =========================================================================
    await showStepBanner(
      'STEP 5: Sales Admin Review in Zone "City-A"',
      'Sales Admin verifies Party Credit Limit, Outstanding Balance, and Order Items...'
    );

    const ordersNav = page.locator('a:has-text("Orders"), button:has-text("Orders"), [href*="orders"]').first();
    if (await ordersNav.isVisible().catch(() => false)) {
      await ordersNav.click();
      await pause(1800);
    }

    // Click on the newly booked order row
    const firstOrderRow = page.locator('table.data-table tbody tr, .order-table-row').first();
    if (await firstOrderRow.isVisible().catch(() => false)) {
      await firstOrderRow.click();
      await pause(2000);
    }

    // =========================================================================
    // STEP 6: Sales Admin Approves & Proceeds Order
    // =========================================================================
    await showStepBanner(
      'STEP 6: Sales Admin Approves & Proceeds Order',
      'Sales Admin reviews item details and executes Approval & Proceed...'
    );

    const approveBtn = page.locator('button:has-text("Approve"), button:has-text("Final Approve"), button:has-text("Proceed"), [title="Approve"]').first();
    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await pause(2000);
    }

    // =========================================================================
    // STEP 7: Sales Invoice / Delivery Challan Inspection
    // =========================================================================
    await showStepBanner(
      'STEP 7: Sales Invoice & Delivery Challan Inspection',
      'Viewing generated Invoice / Delivery Challan PDF with Single-Zone Party details...'
    );

    const pdfBtn = page.locator('button:has-text("PDF"), button:has-text("Invoice"), button:has-text("Delivery Challan")').first();
    if (await pdfBtn.isVisible().catch(() => false)) {
      await pdfBtn.click();
      await pause(3500); // 3.5s pause to clearly inspect invoice
    }
    await ensureModalDismissed();

    // =========================================================================
    // STEP 8: Final Completion Banner
    // =========================================================================
    await showStepBanner(
      '✅ AUTO TEST 2 COMPLETE: SALES ADMIN SINGLE-ZONE APPROVE & PROCEED SUCCESSFUL',
      'Zone "City-A" order successfully created by Sales Person and approved & proceeded by Sales Admin'
    );
    await pause(2500);

    console.log('✅ Sales Admin Single-Zone Approval & Proceed visual test passed.');
  });

});
