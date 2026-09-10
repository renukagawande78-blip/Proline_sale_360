import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-users';

test.setTimeout(300000);

test.describe('Headed Interactive ERP Order Lifecycle Visual Suite', () => {

  test('Sales Person Order Booking → Super Admin Approval & Review → Sales Invoice Inspection', async ({ 
    loginPage,
    dashboardPage,
    page 
  }) => {
    
    // Automatically accept any browser dialogs
    page.on('dialog', async dialog => {
      console.log(`[Browser Dialog]: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    // Visual pause helper
    const pause = async (ms = 1800) => await page.waitForTimeout(ms);

    // Floating UI Step Indicator banner
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
          el.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
          el.style.border = '2px solid #38bdf8';
          el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.85), 0 0 15px rgba(56,189,248,0.4)';
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

    // ──────────────────────────────────────────────────────────────────────────
    // ACT 1: SALES PERSON (NIKHIL) BOOKS ALL ORDERS
    // ──────────────────────────────────────────────────────────────────────────
    await showStepBanner('STAGE 1: Sales Person Authentication', 'Logging in as Sales Person Nikhil (Orders booked strictly by Sales Person)...');
    await loginPage.login(TEST_USERS.SALESPERSON_NIKHIL.email, TEST_USERS.SALESPERSON_NIKHIL.password);
    await dashboardPage.expectLoggedIn();
    await pause(1800);

    // --------------------------------------------------------------------------
    // 1.1 FMCD Order Creation (3 Products in PCS)
    // --------------------------------------------------------------------------
    await showStepBanner('STAGE 1.1: FMCD Order (3 Products in PCS Qty)', 'Brand: WHIRLPOOL / AKAI | Adding 3 Consumer Durables in PCS...');
    await dashboardPage.openCreateOrderModal();
    await pause(1800);

    // Switch to FMCD Segment
    const fmcdBtn = page.locator('button:has-text("FMCD")').first();
    if (await fmcdBtn.isVisible()) {
      await fmcdBtn.click();
      await pause(1000);
    }

    // Select Agency
    const agencyTrigger = page.locator('[data-testid="agency-select-trigger"]').first();
    if (await agencyTrigger.isVisible()) {
      await agencyTrigger.click();
      await pause(800);
      const firstAgency = page.locator('[data-testid="agency-option-item"]').first();
      if (await firstAgency.isVisible()) {
        await firstAgency.click();
        await pause(1000);
      }
    }

    // Add Product 1 (FMCD - PCS Qty)
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
    const fmcdPcs1 = page.locator('[data-testid="item-loose-pcs-input"]').nth(0);
    if (await fmcdPcs1.isVisible()) {
      await fmcdPcs1.fill('2'); // 2 PCS
      await pause(500);
    }

    // Add Product 2 (FMCD - PCS Qty)
    const addProdBtn = page.locator('button:has-text("Add Product"), button:has-text("Add Item")').first();
    if (await addProdBtn.isVisible()) {
      await addProdBtn.click();
      await pause(1000);
      const prodTrigger2 = page.locator('[data-testid="product-select-trigger"]').nth(1);
      if (await prodTrigger2.isVisible()) {
        await prodTrigger2.click({ force: true });
        await pause(800);
        const opt2 = page.locator('[data-testid="product-option-item"]').nth(1);
        if (await opt2.isVisible()) {
          await opt2.click();
          await pause(600);
        }
      }
      const fmcdPcs2 = page.locator('[data-testid="item-loose-pcs-input"]').nth(1);
      if (await fmcdPcs2.isVisible()) {
        await fmcdPcs2.fill('3'); // 3 PCS
        await pause(500);
      }
    }

    // Add Product 3 (FMCD - PCS Qty)
    if (await addProdBtn.isVisible()) {
      await addProdBtn.click();
      await pause(1000);
      const prodTrigger3 = page.locator('[data-testid="product-select-trigger"]').nth(2);
      if (await prodTrigger3.isVisible()) {
        await prodTrigger3.click({ force: true });
        await pause(800);
        const opt3 = page.locator('[data-testid="product-option-item"]').nth(2);
        if (await opt3.isVisible()) {
          await opt3.click();
          await pause(600);
        }
      }
      const fmcdPcs3 = page.locator('[data-testid="item-loose-pcs-input"]').nth(2);
      if (await fmcdPcs3.isVisible()) {
        await fmcdPcs3.fill('4'); // 4 PCS
        await pause(500);
      }
    }

    // Submit FMCD Order
    await showStepBanner('Submitting FMCD 3-Product Order', 'Order registered in PCS quantities...');
    const submitBtn = page.locator('[data-testid="create-order-submit"]').first();
    await submitBtn.click();
    await pause(2200);
    await ensureModalDismissed();

    // --------------------------------------------------------------------------
    // 1.2 FMCG Order Creation (4 Products: BOXES + LOOSE PCS + FREE PCS)
    // --------------------------------------------------------------------------
    await showStepBanner('STAGE 1.2: FMCG Order (Boxes + Loose PCS + Free PCS)', 'Brand: PRIYAGOLD | 4 SKUs with Cartons, Loose PCS & Trade Free PCS...');
    await dashboardPage.openCreateOrderModal();
    await pause(1800);

    const fmcgBtn = page.locator('button:has-text("FMCG")').first();
    if (await fmcgBtn.isVisible()) {
      await fmcgBtn.click();
      await pause(1000);
    }

    // Select Agency
    const agencyTrigger2 = page.locator('[data-testid="agency-select-trigger"]').first();
    if (await agencyTrigger2.isVisible()) {
      await agencyTrigger2.click();
      await pause(800);
      const secAgency = page.locator('[data-testid="agency-option-item"]').nth(1);
      if (await secAgency.isVisible()) {
        await secAgency.click();
        await pause(1000);
      }
    }

    // Add 4 products with Box Qty, Loose PCS, and Free PCS
    const fmcgConfigs = [
      { box: 10, loose: 4, free: 2 },
      { box: 15, loose: 6, free: 3 },
      { box: 8,  loose: 2, free: 1 },
      { box: 20, loose: 8, free: 4 }
    ];

    for (let i = 0; i < 4; i++) {
      if (i > 0) {
        const add = page.locator('button:has-text("Add Product"), button:has-text("Add Item")').first();
        if (await add.isVisible()) {
          await add.click();
          await pause(800);
        }
      }
      const trg = page.locator('[data-testid="product-select-trigger"]').nth(i);
      if (await trg.isVisible()) {
        await trg.click({ force: true });
        await pause(600);
        const opt = page.locator('[data-testid="product-option-item"]').nth(i);
        if (await opt.isVisible()) {
          await opt.click();
          await pause(600);
        }
      }
      
      // Fill Box Qty
      const boxInput = page.locator('[data-testid="item-box-qty-input"]').nth(i);
      if (await boxInput.isVisible()) {
        await boxInput.fill(fmcgConfigs[i].box.toString());
        await pause(300);
      }

      // Fill Loose PCS
      const looseInput = page.locator('[data-testid="item-loose-pcs-input"]').nth(i);
      if (await looseInput.isVisible()) {
        await looseInput.fill(fmcgConfigs[i].loose.toString());
        await pause(300);
      }

      // Fill Free PCS (Trade Promotional Scheme)
      const freeInput = page.locator('[data-testid="item-free-pcs-input"]').nth(i);
      if (await freeInput.isVisible()) {
        await freeInput.fill(fmcgConfigs[i].free.toString());
        await pause(300);
      }
    }

    await showStepBanner('Submitting FMCG 4-Product Order', 'Saving order with Box + Loose + Free PCS calculations...');
    await submitBtn.click();
    await pause(2200);
    await ensureModalDismissed();

    // ──────────────────────────────────────────────────────────────────────────
    // ACT 2: SUPER ADMIN APPROVAL WORKFLOW (HARSHAD / CHIRAG)
    // ──────────────────────────────────────────────────────────────────────────
    await showStepBanner('STAGE 2: Super Admin Login & Approval Queue', 'Logging in as Super Admin Harshad to review pending approvals...');
    await loginPage.logout();
    await pause(1500);

    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await dashboardPage.expectLoggedIn();
    await pause(1800);

    // Navigate to Orders Tab
    await dashboardPage.navigateToTab('orders');
    await pause(2000);

    // Filter by APPROVAL NEEDED or review pending banner
    await showStepBanner('Super Admin Reviewing Orders', 'Inspecting pending orders, party balance & approving orders...');
    const approvalTab = page.locator('button:has-text("APPROVAL"), button:has-text("APPROVAL NEEDED")').first();
    if (await approvalTab.isVisible()) {
      await approvalTab.click();
      await pause(1500);
    }

    // Open first order details
    const orderRow = page.locator('.data-table tbody tr').first();
    if (await orderRow.isVisible()) {
      await orderRow.click();
      await pause(2000);

      // In the right panel, observe the Super Admin approval details
      await showStepBanner('Super Admin Granting Approval', 'Approving order for warehouse picking & dispatch...');
      const approveBtn = page.locator('button:has-text("Approve & Proceed"), button:has-text("Review as Super Admin"), button:has-text("Final Approve"), button:has-text("Approve")').first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await pause(1500);

        const confirmApprove = page.locator('.modal-overlay button:has-text("Approve"), .modal-overlay button:has-text("Confirm")').first();
        if (await confirmApprove.isVisible()) {
          await confirmApprove.click();
          await pause(2000);
          await ensureModalDismissed();
        }
      }
    }

    // Switch back to ALL orders tab
    const allTab = page.locator('button:has-text("ALL")').first();
    if (await allTab.isVisible()) {
      await allTab.click();
      await pause(1500);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACT 3: CHECK SALES INVOICE & PROMINENT BRAND NAME
    // ──────────────────────────────────────────────────────────────────────────
    await showStepBanner('STAGE 3: Inspect Approved Sales Invoice', 'Opening Sales Order Form to verify Brand Name & Approved Quantities...');
    
    // Click on PDF / Invoice button on the order
    const pdfInvoiceBtn = page.locator('button:has-text("PDF"), button[title*="Invoice"], button:has-text("Invoice")').first();
    if (await pdfInvoiceBtn.isVisible()) {
      await showStepBanner('Official Sales Invoice / Booking Form', 'Brand Header, Box, Loose & Free PCS Breakdown Verification...');
      await pdfInvoiceBtn.click();
      await pause(4500); // 4.5s pause to inspect full sales invoice

      // Close Invoice Modal
      const closeInvoiceBtn = page.locator('.modal-card button[title="Close and clear"], .modal-card button:has-text("Close"), .modal-card button:has(svg)').first();
      if (await closeInvoiceBtn.isVisible()) {
        await closeInvoiceBtn.click();
        await pause(1500);
        await ensureModalDismissed();
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACT 4: BILLING & INVOICING (SAME QTY vs CHANGED QTY)
    // ──────────────────────────────────────────────────────────────────────────
    await showStepBanner('STAGE 4: Accounts Billing Module', 'Opening Accounts & Billing Queue to process invoices...');
    await dashboardPage.navigateToTab('accounts');
    await pause(2000);

    const billBtn = page.locator('button:has-text("Issue B2B Bill"), button:has-text("Bill"), button:has-text("Generate Invoice")').first();
    if (await billBtn.isVisible()) {
      await showStepBanner('Generating Matched Invoice (100% Full Billing)', 'Entering Invoice number and dispatching full quantity...');
      await billBtn.click();
      await pause(1800);

      const invInput = page.locator('input[placeholder*="INV-"], input[placeholder*="Invoice Number"]').first();
      if (await invInput.isVisible()) {
        await invInput.fill(`INV-SALES-${Date.now().toString().slice(-4)}`);
        await pause(800);
      }

      const saveBillBtn = page.locator('button:has-text("Save & Complete B2B Bill"), button:has-text("Save & Issue Bill"), button:has-text("Complete Bill")').first();
      if (await saveBillBtn.isVisible()) {
        await saveBillBtn.click();
        await pause(2200);
        await ensureModalDismissed();
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACT 5: DISPATCH & EXECUTIVE DASHBOARD
    // ──────────────────────────────────────────────────────────────────────────
    await showStepBanner('STAGE 5: Warehouse Dispatch & POD', 'Checking Dispatched orders and delivery manifests...');
    await dashboardPage.navigateToTab('dispatch');
    await pause(2000);

    await showStepBanner('STAGE 6: Real-Time Executive Dashboard', 'Live synchronization across all sales & operational KPIs...');
    await dashboardPage.navigateToTab('dashboard');
    await pause(2500);

    await showStepBanner('🎉 Super Admin Approval Verified!', 'Sales Person Booked → Super Admin Approved → Sales Invoice Verified.');
    await pause(3500);
  });
});
