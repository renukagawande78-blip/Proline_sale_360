// ============================================================================
// AUTOMATED ERP SYSTEM TEST SUITE: ORDER WORKFLOWS & LIFECYCLES
// Scenarios Tested:
// 1. FMCD Order Creation with 3 Products (Consumer Durables: TVs, ACs, Fridges)
// 2. FMCG Order Creation with 4 Products (Cartons, Loose pcs: Biscuits, Drinks)
// 3. Single-Product Order (1 Product SKU)
// 4. Super Admin Approval Flow (Submitted -> Super Admin Reviewed -> Approved)
// 5. Direct Proceed Flow (Auto/Sales Admin Proceed to next stage)
// 6. Wait-For-Stock Flow (HELD / WAIT_FOR_STOCK -> Stock Available -> Released)
// 7. Billing with Same Quantity (100% full invoice & dispatch)
// 8. Billing with Changed Quantity (Partial billing / quantity edit)
// 9. Order Editing / Mutation (Modifying items, quantities, remarks on active orders)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const testResults = [];

function assertTest(scenarioName, condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${scenarioName}: ${message}`);
    testResults.push({ scenario: scenarioName, status: 'PASS', message });
  } else {
    console.error(`  ❌ [FAIL] ${scenarioName}: ${message}`);
    testResults.push({ scenario: scenarioName, status: 'FAIL', message });
  }
}

async function runErpAutoTests() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE AUTOMATED ERP ORDER LIFECYCLE TESTS');
  console.log('================================================================\n');

  // Fetch Master Data
  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  const { data: agencies, error: agnErr } = await supabase.from('agencies').select('*').limit(20);
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  const { data: users, error: userErr } = await supabase.from('users').select('*');

  if (compErr || agnErr || prodErr || !companies?.length || !agencies?.length || !products?.length) {
    console.error('Failed to load master records:', { compErr, agnErr, prodErr });
    return;
  }

  const testSuffix = Date.now().toString().slice(-5);
  const fmcdCompanies = companies.filter(c => c.segment === 'FMCD' || ['AK', 'WP', 'DK', 'CR'].includes(c.company_code));
  const fmcgCompanies = companies.filter(c => c.segment === 'FMCG' || ['PG', 'MG', 'HL', 'OR', 'GD', 'PR', 'RC', 'WI'].includes(c.company_code));

  const fmcdComp = fmcdCompanies[0] || companies[0];
  const fmcgComp = fmcgCompanies[0] || companies[1] || companies[0];

  const fmcdProducts = products.filter(p => p.company_id === fmcdComp.id || p.segment === 'FMCD');
  const fmcgProducts = products.filter(p => p.company_id === fmcgComp.id || p.segment === 'FMCG');

  const testAgency1 = agencies[0];
  const testAgency2 = agencies[1] || agencies[0];
  const testSalesperson = users?.find(u => u.role_name === 'SALES_PERSON') || users?.[0] || { id: uuidv4(), full_name: 'Test Sales Rep' };

  console.log(`Master Data Loaded:`);
  console.log(`- FMCD Company: ${fmcdComp.company_name} (${fmcdComp.company_code}) | Available Products: ${fmcdProducts.length}`);
  console.log(`- FMCG Company: ${fmcgComp.company_name} (${fmcgComp.company_code}) | Available Products: ${fmcgProducts.length}`);
  console.log(`- Test Agencies: ${testAgency1.agency_name}, ${testAgency2.agency_name}\n`);

  // ============================================================================
  // TEST SCENARIO 1: FMCD Order with 3 Products & Super Admin Approval
  // ============================================================================
  console.log('----------------------------------------------------------------');
  console.log('📌 SCENARIO 1: FMCD Order with 3 Products + Super Admin Approval Workflow');
  console.log('----------------------------------------------------------------');

  const order1Id = uuidv4();
  const order1Num = `TEST-FMCD-${testSuffix}-01`;
  const selectedFmcd3 = (fmcdProducts.length >= 3 ? fmcdProducts.slice(0, 3) : products.slice(0, 3));

  let order1TotalBoxes = 0;
  let order1TotalQty = 0;
  let order1TotalAmt = 0;

  const order1Items = selectedFmcd3.map((p, idx) => {
    const pcsPerBox = p.pcs_per_box || 1;
    const boxQty = (idx + 1) * 2; // 2, 4, 6 boxes
    const loosePcs = 0;
    const totalPcs = (boxQty * pcsPerBox) + loosePcs;
    const unitPrice = Number(p.unit_price || 12500);
    const totalPrice = totalPcs * unitPrice;

    order1TotalBoxes += boxQty;
    order1TotalQty += totalPcs;
    order1TotalAmt += totalPrice;

    return {
      id: uuidv4(),
      order_id: order1Id,
      product_id: p.id,
      pcs_per_box: pcsPerBox,
      box_qty: boxQty,
      loose_pcs: loosePcs,
      unit_price: unitPrice,
      total_price: totalPrice,
      dispatched_qty_pcs: 0,
      pending_qty_pcs: totalPcs,
      issued_qty_pcs: 0
    };
  });

  // Step 1.1: Insert Initial FMCD Order with 3 products (Status: SUBMITTED, awaiting Super Admin approval)
  const { error: ord1Err } = await supabase.from('orders').insert([{
    id: order1Id,
    order_number: order1Num,
    company_id: fmcdComp.id,
    agency_id: testAgency1.id,
    salesperson_id: testSalesperson.id,
    status: 'SUBMITTED',
    total_box_qty: order1TotalBoxes,
    total_loose_pcs: 0,
    total_qty_pcs: order1TotalQty,
    total_amount: order1TotalAmt,
    sales_admin_approved: true,
    sales_admin_approved_by: 'Dixit Patel',
    sales_admin_approved_at: new Date().toISOString(),
    superadmin_approved: false,
    remarks: 'Auto-test: FMCD 3-product order booked. Waiting for Super Admin Harshad approval.'
  }]);

  const { error: itm1Err } = await supabase.from('order_items').insert(order1Items);
  assertTest('Scenario 1.1', !ord1Err && !itm1Err, `Created FMCD Order ${order1Num} with 3 products (Total Qty: ${order1TotalQty} pcs, Amount: ₹${order1TotalAmt.toLocaleString()})`);

  // Step 1.2: Super Admin Approves Order
  const { error: ord1ApproveErr } = await supabase.from('orders').update({
    status: 'APPROVED',
    superadmin_approved: true,
    superadmin_approved_by: 'Harshad',
    superadmin_approved_at: new Date().toISOString(),
    superadmin_remarks: 'Approved by Super Admin for high-value dispatch.',
    remarks: 'Auto-test: Super Admin approval granted by Harshad.'
  }).eq('id', order1Id);

  const { data: readOrd1 } = await supabase.from('orders').select('*, order_items(*)').eq('id', order1Id).single();
  assertTest('Scenario 1.2', !ord1ApproveErr && readOrd1?.status === 'APPROVED' && readOrd1?.superadmin_approved === true && readOrd1?.order_items?.length === 3, 
    `Super Admin Approval granted -> Status updated to APPROVED, superadmin_approved = true, 3 items verified`);

  // ============================================================================
  // TEST SCENARIO 2: FMCG Order with 4 Products + Wait-For-Stock & Stock Available
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📌 SCENARIO 2: FMCG Order with 4 Products + Wait For Stock & Stock Available');
  console.log('----------------------------------------------------------------');

  const order2Id = uuidv4();
  const order2Num = `TEST-FMCG-${testSuffix}-02`;
  const selectedFmcg4 = (fmcgProducts.length >= 4 ? fmcgProducts.slice(0, 4) : products.slice(0, 4));

  let order2TotalBoxes = 0;
  let order2TotalLoose = 0;
  let order2TotalQty = 0;
  let order2TotalAmt = 0;

  const order2Items = selectedFmcg4.map((p, idx) => {
    const pcsPerBox = p.pcs_per_box || 24;
    const boxQty = (idx + 1) * 5; // 5, 10, 15, 20 boxes
    const loosePcs = idx % 2 === 0 ? 6 : 0; // loose pieces
    const totalPcs = (boxQty * pcsPerBox) + loosePcs;
    const unitPrice = Number(p.unit_price || 150);
    const totalPrice = totalPcs * unitPrice;

    order2TotalBoxes += boxQty;
    order2TotalLoose += loosePcs;
    order2TotalQty += totalPcs;
    order2TotalAmt += totalPrice;

    return {
      id: uuidv4(),
      order_id: order2Id,
      product_id: p.id,
      pcs_per_box: pcsPerBox,
      box_qty: boxQty,
      loose_pcs: loosePcs,
      unit_price: unitPrice,
      total_price: totalPrice,
      dispatched_qty_pcs: 0,
      pending_qty_pcs: totalPcs,
      issued_qty_pcs: 0
    };
  });

  // Step 2.1: Insert Order with Wait For Stock state (Status: HELD)
  const { error: ord2Err } = await supabase.from('orders').insert([{
    id: order2Id,
    order_number: order2Num,
    company_id: fmcgComp.id,
    agency_id: testAgency2.id,
    salesperson_id: testSalesperson.id,
    status: 'HELD',
    total_box_qty: order2TotalBoxes,
    total_loose_pcs: order2TotalLoose,
    total_qty_pcs: order2TotalQty,
    total_amount: order2TotalAmt,
    inventory_status: 'WAIT_FOR_STOCK',
    remarks: 'Auto-test: FMCG 4-product order placed on hold (WAIT_FOR_STOCK) awaiting factory replenishment.'
  }]);

  const { error: itm2Err } = await supabase.from('order_items').insert(order2Items);
  assertTest('Scenario 2.1', !ord2Err && !itm2Err, `Created FMCG Order ${order2Num} with 4 products in HELD / WAIT_FOR_STOCK state`);

  // Step 2.2: Stock arrives and is allocated -> Order released from hold to APPROVED (inventory_status: null)
  const { error: ord2StockErr } = await supabase.from('orders').update({
    status: 'APPROVED',
    inventory_status: null,
    remarks: 'Auto-test: Stock is now AVAILABLE in warehouse. Released from hold to APPROVED queue.'
  }).eq('id', order2Id);

  const { data: readOrd2 } = await supabase.from('orders').select('*, order_items(*)').eq('id', order2Id).single();
  assertTest('Scenario 2.2', !ord2StockErr && readOrd2?.status === 'APPROVED' && readOrd2?.inventory_status === null && readOrd2?.order_items?.length === 4,
    `Stock Allocated & Available -> Order ${order2Num} released from HELD to APPROVED (4 items confirmed)`);

  // ============================================================================
  // TEST SCENARIO 3: Single Product Order (1 Product SKU) + Edit Order
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📌 SCENARIO 3: Single-Product Order (1 Product) + In-Flight Order Editing');
  console.log('----------------------------------------------------------------');

  const order3Id = uuidv4();
  const order3Num = `TEST-SINGLE-${testSuffix}-03`;
  const singleProd = products[0];
  const singlePcsPerBox = singleProd.pcs_per_box || 10;
  const initialBoxes = 10;
  const initialLoose = 2;
  const initialTotalQty = (initialBoxes * singlePcsPerBox) + initialLoose;
  const initialUnitPrice = Number(singleProd.unit_price || 200);
  const initialTotalAmt = initialTotalQty * initialUnitPrice;

  const item3Id = uuidv4();

  // Step 3.1: Create Order with 1 Product
  const { error: ord3Err } = await supabase.from('orders').insert([{
    id: order3Id,
    order_number: order3Num,
    company_id: singleProd.company_id || fmcdComp.id,
    agency_id: testAgency1.id,
    salesperson_id: testSalesperson.id,
    status: 'DRAFT',
    total_box_qty: initialBoxes,
    total_loose_pcs: initialLoose,
    total_qty_pcs: initialTotalQty,
    total_amount: initialTotalAmt,
    remarks: 'Auto-test: 1 product single SKU order draft.'
  }]);

  const { error: itm3Err } = await supabase.from('order_items').insert([{
    id: item3Id,
    order_id: order3Id,
    product_id: singleProd.id,
    pcs_per_box: singlePcsPerBox,
    box_qty: initialBoxes,
    loose_pcs: initialLoose,
    unit_price: initialUnitPrice,
    total_price: initialTotalAmt,
    dispatched_qty_pcs: 0,
    pending_qty_pcs: initialTotalQty,
    issued_qty_pcs: 0
  }]);

  assertTest('Scenario 3.1', !ord3Err && !itm3Err, `Created Single-Product Order ${order3Num} with 1 SKU (Qty: ${initialTotalQty} pcs, Amount: ₹${initialTotalAmt.toLocaleString()})`);

  // Step 3.2: Edit Order (Update quantity: increase boxes from 10 to 18, loose pcs to 5)
  const editedBoxes = 18;
  const editedLoose = 5;
  const editedTotalQty = (editedBoxes * singlePcsPerBox) + editedLoose;
  const editedTotalAmt = editedTotalQty * initialUnitPrice;

  const { error: editItemErr } = await supabase.from('order_items').update({
    box_qty: editedBoxes,
    loose_pcs: editedLoose,
    total_price: editedTotalAmt,
    pending_qty_pcs: editedTotalQty
  }).eq('id', item3Id);

  const { error: editOrdErr } = await supabase.from('orders').update({
    total_box_qty: editedBoxes,
    total_loose_pcs: editedLoose,
    total_qty_pcs: editedTotalQty,
    total_amount: editedTotalAmt,
    status: 'SUBMITTED',
    remarks: 'Auto-test: Order edited by customer request. Qty increased from 10 boxes to 18 boxes.'
  }).eq('id', order3Id);

  const { data: readOrd3 } = await supabase.from('orders').select('*, order_items(*)').eq('id', order3Id).single();
  assertTest('Scenario 3.2', !editItemErr && !editOrdErr && readOrd3?.total_box_qty === 18 && readOrd3?.total_qty_pcs === editedTotalQty && readOrd3?.order_items?.length === 1, 
    `Order Edited successfully: Total boxes updated to 18 (${readOrd3?.total_qty_pcs} pcs, Amount ₹${readOrd3?.total_amount})`);

  // ============================================================================
  // TEST SCENARIO 4: Billing with SAME Quantity (100% Full Dispatch)
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📌 SCENARIO 4: Billing & Invoicing with SAME Quantity (100% Full Billing)');
  console.log('----------------------------------------------------------------');

  const invoiceNum1 = `INV-FULL-${testSuffix}-01`;

  // Update order items: dispatched_qty = total_qty, pending_qty = 0, issued_qty = total_qty
  for (const item of order1Items) {
    const totalItemQty = (item.box_qty * item.pcs_per_box) + item.loose_pcs;
    await supabase.from('order_items').update({
      dispatched_qty_pcs: totalItemQty,
      pending_qty_pcs: 0,
      issued_qty_pcs: totalItemQty
    }).eq('id', item.id);
  }

  // Update order: status = DISPATCHED, invoice info
  const { error: billOrdErr1 } = await supabase.from('orders').update({
    status: 'DISPATCHED',
    invoice_number: invoiceNum1,
    invoice_date: new Date().toISOString(),
    invoice_amount: order1TotalAmt,
    billing_remark: '100% matched billing. Full quantity billed and dispatched.',
    remarks: `<!--INVOICE:{"invoice_number":"${invoiceNum1}","billed_qty":${order1TotalQty},"total_amount":${order1TotalAmt}}-->Billed 100% same quantity (${order1TotalQty} pcs). Dispatched via tempo.`
  }).eq('id', order1Id);

  const { data: readBilled1 } = await supabase.from('orders').select('*, order_items(*)').eq('id', order1Id).single();
  const allDispatched = readBilled1?.order_items?.every(it => it.dispatched_qty_pcs === it.total_qty_pcs && it.pending_qty_pcs === 0);

  assertTest('Scenario 4', !billOrdErr1 && readBilled1?.status === 'DISPATCHED' && allDispatched && readBilled1?.invoice_number === invoiceNum1,
    `Order ${order1Num} Billed with SAME Quantity: ${order1TotalQty}/${order1TotalQty} pcs dispatched under Invoice ${invoiceNum1}`);

  // ============================================================================
  // TEST SCENARIO 5: Billing with CHANGED Quantity (Partial Billing / Short Dispatch)
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📌 SCENARIO 5: Billing with CHANGED Quantity (Partial Billing / Short Dispatch)');
  console.log('----------------------------------------------------------------');

  const invoiceNum2 = `INV-PARTIAL-${testSuffix}-02`;
  let totalDispatchedQty = 0;
  let totalPendingQty = 0;

  // Let's modify dispatched quantity for each item (dispatch ~60% of total)
  for (const item of order2Items) {
    const totalItemQty = (item.box_qty * item.pcs_per_box) + item.loose_pcs;
    const partialDispatch = Math.floor(totalItemQty * 0.6);
    const pendingQty = totalItemQty - partialDispatch;
    totalDispatchedQty += partialDispatch;
    totalPendingQty += pendingQty;

    await supabase.from('order_items').update({
      dispatched_qty_pcs: partialDispatch,
      pending_qty_pcs: pendingQty,
      issued_qty_pcs: partialDispatch
    }).eq('id', item.id);
  }

  // Update order status to PARTIALLY_DISPATCHED
  const partialAmount = Math.round(order2TotalAmt * 0.6);
  const { error: billOrdErr2 } = await supabase.from('orders').update({
    status: 'PARTIALLY_DISPATCHED',
    invoice_number: invoiceNum2,
    invoice_date: new Date().toISOString(),
    invoice_amount: partialAmount,
    billing_remark: `Partial Billing: ${totalDispatchedQty} pcs billed, ${totalPendingQty} pcs pending.`,
    remarks: `<!--INVOICE:{"invoice_number":"${invoiceNum2}","billed_qty":${totalDispatchedQty},"pending_qty":${totalPendingQty}}-->Partial billing executed: Dispatched ${totalDispatchedQty} pcs, ${totalPendingQty} pcs pending next batch.`
  }).eq('id', order2Id);

  const { data: readBilled2 } = await supabase.from('orders').select('*, order_items(*)').eq('id', order2Id).single();
  const partialItemsVerified = readBilled2?.order_items?.every(it => it.dispatched_qty_pcs > 0 && it.pending_qty_pcs > 0);

  assertTest('Scenario 5', !billOrdErr2 && readBilled2?.status === 'PARTIALLY_DISPATCHED' && partialItemsVerified,
    `Order ${order2Num} Billed with CHANGED Quantity: ${totalDispatchedQty} pcs dispatched, ${totalPendingQty} pcs remaining pending under Invoice ${invoiceNum2}`);

  // ============================================================================
  // TEST SCENARIO 6: Direct Proceed Workflow (Proceed from Draft -> Submitted -> Approved)
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📌 SCENARIO 6: Direct Proceed Workflow');
  console.log('----------------------------------------------------------------');

  const { error: proceedErr } = await supabase.from('orders').update({
    status: 'APPROVED',
    sales_admin_approved: true,
    sales_admin_approved_by: 'Dixit Patel',
    sales_admin_approved_at: new Date().toISOString(),
    remarks: 'Auto-test: Standard routine order directly proceeded to warehouse dispatch queue.'
  }).eq('id', order3Id);

  const { data: readOrd3Proceed } = await supabase.from('orders').select('*').eq('id', order3Id).single();
  assertTest('Scenario 6', !proceedErr && readOrd3Proceed?.status === 'APPROVED' && readOrd3Proceed?.sales_admin_approved === true,
    `Order ${order3Num} directly proceeded to APPROVED queue for warehouse packing.`);

  // ============================================================================
  // SUMMARY OF ALL TESTS
  // ============================================================================
  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY REPORT');
  console.log('================================================================');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  console.log(`Total Scenarios Tested: ${testResults.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);

  if (failed === 0) {
    console.log('\n🎉 ALL ERP ORDER AUTOMATED TEST WORKFLOWS COMPLETED SUCCESSFULLY!');
  } else {
    console.error('\n⚠️ SOME TESTS FAILED. Review logs above.');
  }

  return { passed, failed, results: testResults };
}

runErpAutoTests().catch(console.error);
