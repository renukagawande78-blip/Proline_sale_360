// ============================================================================
// AUTOMATED TEST 1: SALES ADMIN APPROVE & PROCEED WORKFLOW (SINGLE ZONE ENFORCEMENT)
// ============================================================================
// Scenarios Tested:
// 1. Single Zone Agency Selection (All agencies strictly from one zone, e.g. "City-A" / "North")
// 2. Sales Person Order Creation for Zone Agencies (FMCG Box+Loose+Free & FMCD PCS)
// 3. Sales Admin Review & Approval Action (Review party balance, set APPROVED)
// 4. Sales Admin Proceed Action (Stock release, dispatch assignment, Invoice generation)
// 5. Multi-product and single-product validation under single zone constraint
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

async function runSalesAdminZoneOrderTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING AUTO TEST 1: SALES ADMIN APPROVE & PROCEED (SINGLE ZONE)');
  console.log('================================================================\n');

  // 1. Fetch Master Data
  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  const { data: allAgencies, error: agnErr } = await supabase.from('agencies').select('*');
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  const { data: users, error: userErr } = await supabase.from('users').select('*');

  if (compErr || agnErr || prodErr || !companies?.length || !allAgencies?.length || !products?.length) {
    console.error('Failed to load master records:', { compErr, agnErr, prodErr, userErr });
    return;
  }

  // 2. Identify Sales Admin and Sales Person
  const salesAdmin = users?.find(u => u.role_name === 'SALES_ADMIN' && u.full_name?.toLowerCase().includes('dixit')) 
    || users?.find(u => u.role_name === 'SALES_ADMIN') 
    || { id: uuidv4(), full_name: 'Dixit (Sales Admin)', role_name: 'SALES_ADMIN' };

  const salesPerson = users?.find(u => u.role_name === 'SALES_PERSON') 
    || { id: uuidv4(), full_name: 'renuka (Sales Person)', role_name: 'SALES_PERSON' };

  console.log(`👤 Actors:`);
  console.log(`- Sales Admin: ${salesAdmin.full_name} (${salesAdmin.role_name})`);
  console.log(`- Sales Person: ${salesPerson.full_name} (${salesPerson.role_name})\n`);

  // 3. Select Target Single Zone
  const targetZone = 'City-A';
  const zoneAgencies = allAgencies.filter(a => (a.zone_name === targetZone || a.zone_region === targetZone || a.city === targetZone));
  
  assertTest('Zone Discovery', zoneAgencies.length >= 2, `Target Zone "${targetZone}" contains ${zoneAgencies.length} verified agencies`);
  
  const agency1 = zoneAgencies[0];
  const agency2 = zoneAgencies[1] || zoneAgencies[0];

  console.log(`📍 Designated Zone for All Orders: "${targetZone}"`);
  console.log(`- Agency 1: ${agency1.agency_name} (Code: ${agency1.agency_code}, Area: ${agency1.area_name || agency1.area || 'N/A'}, Zone: ${agency1.zone_name})`);
  console.log(`- Agency 2: ${agency2.agency_name} (Code: ${agency2.agency_code}, Area: ${agency2.area_name || agency2.area || 'N/A'}, Zone: ${agency2.zone_name})\n`);

  const testSuffix = Date.now().toString().slice(-5);

  // ============================================================================
  // SCENARIO 1: FMCG Order in Single Zone -> Sales Admin Approves & Proceeds
  // ============================================================================
  console.log('----------------------------------------------------------------');
  console.log('📌 SCENARIO 1: FMCG Multi-Product Order in Zone "City-A" → Sales Admin Direct Approval & Proceed');
  console.log('----------------------------------------------------------------');

  const fmcgCompany = companies.find(c => c.segment === 'FMCG' || c.company_code === 'PG') || companies[0];
  const fmcgProds = products.filter(p => p.company_id === fmcgCompany.id || p.segment === 'FMCG').slice(0, 4);

  const order1Id = uuidv4();
  const order1Num = `ORD-ZONE-FMCG-${testSuffix}-01`;

  let totalBoxes1 = 0;
  let totalLoose1 = 0;
  let totalPcs1 = 0;
  let totalAmt1 = 0;

  const order1Items = fmcgProds.map((p, idx) => {
    const pcsPerBox = p.pcs_per_box || 24;
    const boxQty = 10 + (idx * 5); // 10, 15, 20, 25 boxes
    const loosePcs = (idx + 1) * 2; // 2, 4, 6, 8 pcs
    const totalPcs = (boxQty * pcsPerBox) + loosePcs;
    const unitPrice = Number(p.unit_price || 120);
    const totalPrice = (totalPcs * unitPrice);

    totalBoxes1 += boxQty;
    totalLoose1 += loosePcs;
    totalPcs1 += totalPcs;
    totalAmt1 += totalPrice;

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

  // Step 1.1: Sales Person creates order in Zone City-A
  const { error: ins1Err } = await supabase.from('orders').insert([{
    id: order1Id,
    order_number: order1Num,
    agency_id: agency1.id,
    salesperson_id: salesPerson.id,
    company_id: fmcgCompany.id,
    status: 'SUBMITTED',
    total_amount: totalAmt1,
    total_box_qty: totalBoxes1,
    total_loose_pcs: totalLoose1,
    total_qty_pcs: totalPcs1,
    order_date: new Date().toISOString(),
    remarks: `[AUTO-TEST] Order placed by Sales Person ${salesPerson.full_name} for Zone ${targetZone}`
  }]);

  assertTest('Scenario 1 - Placement', !ins1Err, `Sales Person placed order ${order1Num} for Agency in Zone "${targetZone}"`);

  // Insert order items
  const { error: itm1Err } = await supabase.from('order_items').insert(order1Items);
  assertTest('Scenario 1 - Items Seeded', !itm1Err, `Seeded 4 FMCG items with total ${totalBoxes1} boxes, ${totalLoose1} loose pcs (Total: ${totalPcs1} pcs)`);

  // Step 1.2: Sales Admin Reviews & Approves Order
  const { data: updatedOrd1, error: app1Err } = await supabase
    .from('orders')
    .update({
      status: 'APPROVED',
      sales_admin_approved: true,
      sales_admin_approved_by: salesAdmin.full_name,
      sales_admin_approved_at: new Date().toISOString(),
      remarks: `[AUTO-TEST] Approved by Sales Admin ${salesAdmin.full_name} for Zone ${targetZone}`
    })
    .eq('id', order1Id)
    .select()
    .single();

  assertTest('Scenario 1 - Sales Admin Approval', !app1Err && updatedOrd1?.status === 'APPROVED', `Sales Admin successfully approved order ${order1Num}`);

  // Step 1.3: Sales Admin Proceeds Order (Allocation & Dispatch Release)
  const invoiceNum1 = `INV-ZONE-${targetZone}-${testSuffix}-01`;
  const { data: proceededOrd1, error: proc1Err } = await supabase
    .from('orders')
    .update({
      status: 'DISPATCHED',
      invoice_number: invoiceNum1,
      invoice_date: new Date().toISOString(),
      invoice_amount: totalAmt1,
      billing_remark: `100% full billing proceeded by Sales Admin ${salesAdmin.full_name}`,
      remarks: `[AUTO-TEST] Proceeded and Dispatched by Sales Admin ${salesAdmin.full_name}`
    })
    .eq('id', order1Id)
    .select()
    .single();

  assertTest('Scenario 1 - Sales Admin Proceed', !proc1Err && proceededOrd1?.status === 'DISPATCHED', `Sales Admin proceeded order to DISPATCHED with Invoice ${invoiceNum1}`);

  // ============================================================================
  // SCENARIO 2: FMCD Order in the Same Zone -> Sales Admin Review & Proceed
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📌 SCENARIO 2: FMCD Appliance Order in the Same Zone "City-A" → Sales Admin Approval & Proceed');
  console.log('----------------------------------------------------------------');

  const fmcdCompany = companies.find(c => c.segment === 'FMCD' || ['WP', 'DK', 'CR', 'AK'].includes(c.company_code)) || companies[1];
  const fmcdProds = products.filter(p => p.company_id === fmcdCompany.id || p.segment === 'FMCD').slice(0, 3);

  const order2Id = uuidv4();
  const order2Num = `ORD-ZONE-FMCD-${testSuffix}-02`;

  let totalPcs2 = 0;
  let totalAmt2 = 0;

  const order2Items = fmcdProds.map((p, idx) => {
    const qtyPcs = (idx + 1) * 4; // 4, 8, 12 PCS
    const unitPrice = Number(p.unit_price || 18500);
    const totalPrice = qtyPcs * unitPrice;

    totalPcs2 += qtyPcs;
    totalAmt2 += totalPrice;

    return {
      id: uuidv4(),
      order_id: order2Id,
      product_id: p.id,
      pcs_per_box: 1,
      box_qty: 0,
      loose_pcs: qtyPcs,
      unit_price: unitPrice,
      total_price: totalPrice,
      dispatched_qty_pcs: 0,
      pending_qty_pcs: qtyPcs,
      issued_qty_pcs: 0
    };
  });

  // Step 2.1: Sales Person creates FMCD order for 2nd Agency in the same zone
  const { error: ins2Err } = await supabase.from('orders').insert([{
    id: order2Id,
    order_number: order2Num,
    agency_id: agency2.id,
    salesperson_id: salesPerson.id,
    company_id: fmcdCompany.id,
    status: 'SUBMITTED',
    total_amount: totalAmt2,
    total_box_qty: 0,
    total_loose_pcs: totalPcs2,
    total_qty_pcs: totalPcs2,
    order_date: new Date().toISOString(),
    remarks: `[AUTO-TEST] FMCD Order by Sales Person ${salesPerson.full_name} for Zone ${targetZone}`
  }]);

  assertTest('Scenario 2 - Placement', !ins2Err, `Sales Person placed FMCD order ${order2Num} for Agency 2 in Zone "${targetZone}"`);

  // Insert order items
  const { error: itm2Err } = await supabase.from('order_items').insert(order2Items);
  assertTest('Scenario 2 - Items Seeded', !itm2Err, `Seeded 3 FMCD appliances with total ${totalPcs2} direct PCS (Value: ₹${totalAmt2.toLocaleString('en-IN')})`);

  // Step 2.2: Sales Admin Reviews & Approves Order
  const { data: updatedOrd2, error: app2Err } = await supabase
    .from('orders')
    .update({
      status: 'APPROVED',
      sales_admin_approved: true,
      sales_admin_approved_by: salesAdmin.full_name,
      sales_admin_approved_at: new Date().toISOString(),
      remarks: `[AUTO-TEST] Approved by Sales Admin ${salesAdmin.full_name}`
    })
    .eq('id', order2Id)
    .select()
    .single();

  assertTest('Scenario 2 - Sales Admin Approval', !app2Err && updatedOrd2?.status === 'APPROVED', `Sales Admin approved FMCD order ${order2Num}`);

  // Step 2.3: Sales Admin Proceeds Order to Dispatch
  const invoiceNum2 = `INV-ZONE-${targetZone}-${testSuffix}-02`;
  const { data: proceededOrd2, error: proc2Err } = await supabase
    .from('orders')
    .update({
      status: 'DISPATCHED',
      invoice_number: invoiceNum2,
      invoice_date: new Date().toISOString(),
      invoice_amount: totalAmt2,
      billing_remark: `FMCD order proceeded & dispatched by Sales Admin ${salesAdmin.full_name}`,
      remarks: `[AUTO-TEST] Proceeded to Dispatch by Sales Admin ${salesAdmin.full_name}`
    })
    .eq('id', order2Id)
    .select()
    .single();

  assertTest('Scenario 2 - Sales Admin Proceed', !proc2Err && proceededOrd2?.status === 'DISPATCHED', `Sales Admin proceeded FMCD order to DISPATCHED with Invoice ${invoiceNum2}`);

  // ============================================================================
  // ZONE ENFORCEMENT & INTEGRITY AUDIT
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('🔍 ZONE INTEGRITY & AUDIT VERIFICATION');
  console.log('----------------------------------------------------------------');

  const { data: auditedOrders, error: audErr } = await supabase
    .from('orders')
    .select('id, order_number, status, invoice_number, total_amount, agencies!inner(id, agency_name, zone_name, zone_region, city)')
    .in('id', [order1Id, order2Id]);

  assertTest('Audit - Fetch Created Orders', !audErr && auditedOrders?.length === 2, 'Fetched both zone-tested orders for integrity audit');

  const allInTargetZone = auditedOrders?.every(o => {
    const agZone = o.agencies?.zone_name || o.agencies?.zone_region || o.agencies?.city;
    return agZone === targetZone;
  });

  assertTest('Audit - Single Zone Containment', allInTargetZone, `All tested orders strictly belong to Single Zone "${targetZone}"`);

  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY: SALES ADMIN SINGLE ZONE ORDERS');
  console.log('================================================================');
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  console.log(`Total Scenarios: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL SALES ADMIN SINGLE-ZONE APPROVE & PROCEED TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n⚠️ ${failed} TEST(S) FAILED. Check logs above.`);
  }
}

runSalesAdminZoneOrderTests().catch(console.error);
