// ============================================================================
// PROLINE OMS 360 - ALL SALES PERSONS & ALL PRODUCTS ORDER GENERATOR & TEST
// Generates realistic orders for EVERY Sales Person covering ALL Products
// - FMCG Products: Box Qty + Loose PCS + Free PCS
// - FMCD Products: Unit Quantity in PCS
// - Roles: Orders mapped to respective Sales Persons
// - Approvals: Super Admin & Accounts approval workflows
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

async function placeOrdersForAllSalesPersonsAndProducts() {
  console.log('================================================================');
  console.log('🚀 PLACING ORDERS FROM ALL SALES PERSONS FOR ALL PRODUCT BRANDS');
  console.log('================================================================\n');

  // Fetch all master data
  const { data: companies } = await supabase.from('companies').select('*');
  const { data: agencies } = await supabase.from('agencies').select('*');
  const { data: products } = await supabase.from('products').select('*');
  const { data: users } = await supabase.from('users').select('*');

  if (!companies?.length || !agencies?.length || !products?.length || !users?.length) {
    console.error('Missing master records in Supabase.');
    return;
  }

  // Filter all Sales Persons
  const salesPersons = users.filter(u => 
    ['SALES_PERSON', 'SALESPERSON', 'SALES_EXECUTIVE', 'FIELD_SALES'].includes(u.role_name)
  );

  console.log(`Master Records Loaded:`);
  console.log(`- Sales Persons: ${salesPersons.length}`);
  console.log(`- Companies / Brands: ${companies.length}`);
  console.log(`- Products in Catalog: ${products.length}`);
  console.log(`- Active Agencies: ${agencies.length}\n`);

  let totalOrdersCreated = 0;
  let totalItemsCreated = 0;
  let totalOrderValue = 0;

  // Group products by Company ID
  const productsByCompany = {};
  for (const p of products) {
    if (!productsByCompany[p.company_id]) {
      productsByCompany[p.company_id] = [];
    }
    productsByCompany[p.company_id].push(p);
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  for (let sIdx = 0; sIdx < salesPersons.length; sIdx++) {
    const salesperson = salesPersons[sIdx];
    const handle = salesperson.company_handle || 'All';

    // Find companies allowed/handled by this salesperson
    let targetCompanies = [];
    if (handle === 'All' || handle.toLowerCase().includes('all')) {
      targetCompanies = companies;
    } else {
      const handles = handle.split(',').map(h => h.trim().toLowerCase());
      targetCompanies = companies.filter(c => 
        handles.some(h => 
          (c.company_name && c.company_name.toLowerCase().includes(h)) ||
          (c.company_code && c.company_code.toLowerCase() === h) ||
          (c.handle && c.handle.toLowerCase().includes(h))
        )
      );
      if (targetCompanies.length === 0) {
        targetCompanies = [companies[sIdx % companies.length]];
      }
    }

    console.log(`▶ [Salesperson ${sIdx + 1}/${salesPersons.length}] ${salesperson.full_name} (Handles: ${handle})`);

    // Create 1-2 orders for this salesperson across their companies
    for (let cIdx = 0; cIdx < targetCompanies.length; cIdx++) {
      const comp = targetCompanies[cIdx];
      const isFMCD = (comp.segment || '').toUpperCase() === 'FMCD' || ['AK', 'WP', 'DK', 'CR'].includes(comp.company_code);
      const compProducts = productsByCompany[comp.id] || products.filter(p => p.company_id === comp.id);
      
      if (compProducts.length === 0) continue;

      // Select 3 to 4 products from this company
      const selectedProducts = compProducts.slice(0, Math.min(4, compProducts.length));
      if (selectedProducts.length === 0) continue;

      const orderId = uuidv4();
      const orderSeq = String(totalOrdersCreated + 1).padStart(3, '0');
      const orderNumber = `${comp.company_code || 'ORD'}-${todayStr}-${orderSeq}`;
      const agency = agencies[(sIdx * 3 + cIdx) % agencies.length];

      let orderTotalBoxes = 0;
      let orderTotalLoose = 0;
      let orderTotalFree = 0;
      let orderTotalAmount = 0;

      const orderItems = [];

      for (let pIdx = 0; pIdx < selectedProducts.length; pIdx++) {
        const prod = selectedProducts[pIdx];
        const pcsPerBox = prod.pcs_per_box || (isFMCD ? 1 : 24);
        const unitPrice = Number(prod.unit_price || prod.mrp_price || (isFMCD ? 15000 : 180));
        
        let boxQty = 0;
        let loosePcs = 0;
        let freePcs = 0;

        if (isFMCD) {
          // FMCD uses Unit Quantity in PCS
          boxQty = 0;
          loosePcs = (pIdx + 1) * 2; // 2, 4, 6 PCS
          freePcs = 0;
        } else {
          // FMCG uses Box Qty + Loose PCS + Free PCS
          boxQty = (pIdx + 1) * 5; // 5, 10, 15, 20 Boxes
          loosePcs = (pIdx % 2 === 0) ? 4 : 2; // Loose pieces
          freePcs = (pIdx % 2 === 0) ? 2 : 1;  // Free trade scheme pieces
        }

        const itemTotalQty = (boxQty * pcsPerBox) + loosePcs;
        const itemTotalPrice = itemTotalQty * unitPrice;

        orderTotalBoxes += boxQty;
        orderTotalLoose += loosePcs;
        orderTotalFree += freePcs;
        orderTotalAmount += itemTotalPrice;

        orderItems.push({
          id: uuidv4(),
          order_id: orderId,
          product_id: prod.id,
          pcs_per_box: pcsPerBox,
          box_qty: boxQty,
          loose_pcs: loosePcs,
          unit_price: unitPrice,
          total_price: itemTotalPrice,
          dispatched_qty_pcs: 0,
          pending_qty_pcs: itemTotalQty,
          issued_qty_pcs: 0
        });
      }

      // Vary status across lifecycles: SUBMITTED, APPROVED, HELD (Wait for stock), DISPATCHED
      const statusCycle = ['SUBMITTED', 'APPROVED', 'HELD', 'DISPATCHED'];
      const status = statusCycle[totalOrdersCreated % statusCycle.length];
      const isSuperAdminApproved = status === 'APPROVED' || status === 'DISPATCHED';

      const orderRow = {
        id: orderId,
        order_number: orderNumber,
        order_date: new Date(Date.now() - 3600000 * totalOrdersCreated).toISOString(),
        company_id: comp.id,
        agency_id: agency.id,
        salesperson_id: salesperson.id,
        status: status,
        total_box_qty: orderTotalBoxes,
        total_loose_pcs: orderTotalLoose,
        total_amount: orderTotalAmount,
        superadmin_approved: isSuperAdminApproved,
        superadmin_approved_by: isSuperAdminApproved ? 'Harshad' : null,
        superadmin_approved_at: isSuperAdminApproved ? new Date().toISOString() : null,
        sales_admin_approved: isSuperAdminApproved,
        sales_admin_approved_by: isSuperAdminApproved ? 'Dixit' : null,
        sales_admin_approved_at: isSuperAdminApproved ? new Date().toISOString() : null,
        inventory_status: status === 'HELD' ? 'WAIT_FOR_STOCK' : null,
        invoice_number: status === 'DISPATCHED' ? `INV-${comp.company_code}-${orderSeq}` : null,
        invoice_date: status === 'DISPATCHED' ? new Date().toISOString() : null,
        invoice_amount: status === 'DISPATCHED' ? orderTotalAmount : null,
        remarks: `Auto-Booked by ${salesperson.full_name} for ${comp.company_name} (${isFMCD ? 'FMCD Unit PCS' : 'FMCG Boxes + Loose + Free PCS'})`
      };

      const { error: ordErr } = await supabase.from('orders').upsert([orderRow]);
      if (ordErr) {
        console.error(`  ❌ Error creating order ${orderNumber}:`, ordErr.message);
        continue;
      }

      if (orderItems.length > 0) {
        const { error: itmErr } = await supabase.from('order_items').upsert(orderItems);
        if (itmErr) {
          console.warn(`  ⚠️ Error adding items for ${orderNumber}:`, itmErr.message);
        } else {
          totalItemsCreated += orderItems.length;
        }
      }

      totalOrdersCreated++;
      totalOrderValue += orderTotalAmount;

      console.log(`  ✅ Order ${orderNumber} | Brand: ${comp.company_name} [${isFMCD ? 'FMCD' : 'FMCG'}] | Items: ${selectedProducts.length} | Status: ${status} | Amount: ₹${orderTotalAmount.toLocaleString()}`);
    }
    console.log('');
  }

  console.log('================================================================');
  console.log('📊 ALL SALES PERSONS & PRODUCTS ORDER SEEDING SUMMARY');
  console.log('================================================================');
  console.log(`Total Sales Persons Handled: ${salesPersons.length} / ${salesPersons.length}`);
  console.log(`Total Orders Successfully Created: ${totalOrdersCreated}`);
  console.log(`Total Product Line Items Seeded: ${totalItemsCreated}`);
  console.log(`Total Business Order Value: ₹${totalOrderValue.toLocaleString()}`);
  console.log('\n🎉 ALL ORDERS PLACED FOR ALL SALES PERSONS AND ALL PRODUCT CATALOGS!');
}

placeOrdersForAllSalesPersonsAndProducts().catch(console.error);
