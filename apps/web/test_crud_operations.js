// ============================================================================
// Proline OMS 360 - Verification Test Suite for Supabase CRUD Operations
// Verifies: Create, Read, Update, Delete across all 6 main tables:
// 1. companies
// 2. users
// 3. agencies
// 4. products
// 5. orders
// 6. order_items
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = [];

function recordResult(entity, operation, success, message, details = null) {
  results.push({ entity, operation, success, message });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${entity.toUpperCase()}] ${operation}: ${message}`);
  if (details && !success) {
    console.error('   Details:', details);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('Starting Proline OMS 360 Supabase CRUD Operations Verification');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('================================================================\n');

  const testSuffix = Date.now().toString().slice(-6);

  // --------------------------------------------------------------------------
  // 1. COMPANIES CRUD
  // --------------------------------------------------------------------------
  console.log('--- 1. Testing Companies ---');
  const compId = crypto.randomUUID();
  const compCode = `TC_${testSuffix}`;

  // 1.1 Create Company
  const { data: compIns, error: compInsErr } = await supabase.from('companies').insert([{
    id: compId,
    company_code: compCode,
    company_name: `Test Company ${testSuffix}`,
    segment: 'FMCG',
    brand_color: '#38bdf8'
  }]).select();
  recordResult('companies', 'CREATE', !compInsErr, compInsErr ? compInsErr.message : `Inserted company ${compCode}`, compInsErr);

  // 1.2 Read Company
  const { data: compRead, error: compReadErr } = await supabase.from('companies').select('*').eq('id', compId);
  recordResult('companies', 'READ', !compReadErr && compRead && compRead.length > 0, compReadErr ? compReadErr.message : `Read company ${compCode}`, compReadErr);

  // 1.3 Update Company
  const { data: compUpd, error: compUpdErr } = await supabase.from('companies').update({
    company_name: `Updated Company ${testSuffix}`
  }).eq('id', compId).select();
  recordResult('companies', 'UPDATE', !compUpdErr, compUpdErr ? compUpdErr.message : `Updated company ${compCode}`, compUpdErr);

  // 1.4 Delete Company
  const { error: compDelErr } = await supabase.from('companies').delete().eq('id', compId);
  recordResult('companies', 'DELETE', !compDelErr, compDelErr ? compDelErr.message : `Deleted company ${compCode}`, compDelErr);

  // --------------------------------------------------------------------------
  // 2. USERS CRUD
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Users ---');
  const userId = crypto.randomUUID();
  const userEmail = `test_user_${testSuffix}@proline.com`;

  // 2.1 Create User
  const { data: userIns, error: userInsErr } = await supabase.from('users').insert([{
    id: userId,
    email: userEmail,
    full_name: `Test User ${testSuffix}`,
    role_name: 'SALES_PERSON',
    company_handle: 'All'
  }]).select();
  recordResult('users', 'CREATE', !userInsErr, userInsErr ? userInsErr.message : `Inserted user ${userEmail}`, userInsErr);

  // 2.2 Read User
  const { data: userRead, error: userReadErr } = await supabase.from('users').select('*').eq('id', userId);
  recordResult('users', 'READ', !userReadErr && userRead && userRead.length > 0, userReadErr ? userReadErr.message : `Read user ${userEmail}`, userReadErr);

  // 2.3 Update User
  const { data: userUpd, error: userUpdErr } = await supabase.from('users').update({
    full_name: `Updated User ${testSuffix}`
  }).eq('id', userId).select();
  recordResult('users', 'UPDATE', !userUpdErr, userUpdErr ? userUpdErr.message : `Updated user ${userEmail}`, userUpdErr);

  // 2.4 Delete User
  const { error: userDelErr } = await supabase.from('users').delete().eq('id', userId);
  recordResult('users', 'DELETE', !userDelErr, userDelErr ? userDelErr.message : `Deleted user ${userEmail}`, userDelErr);

  // --------------------------------------------------------------------------
  // 3. AGENCIES CRUD
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing Agencies ---');
  const agencyId = crypto.randomUUID();
  const agencyCode = `AG_${testSuffix}`;

  // 3.1 Create Agency
  const { data: agIns, error: agInsErr } = await supabase.from('agencies').insert([{
    id: agencyId,
    agency_code: agencyCode,
    agency_name: `Test Agency ${testSuffix}`,
    city: 'Surat',
    area_name: 'Katargam',
    credit_limit: 500000
  }]).select();
  recordResult('agencies', 'CREATE', !agInsErr, agInsErr ? agInsErr.message : `Inserted agency ${agencyCode}`, agInsErr);

  // 3.2 Read Agency
  const { data: agRead, error: agReadErr } = await supabase.from('agencies').select('*').eq('id', agencyId);
  recordResult('agencies', 'READ', !agReadErr && agRead && agRead.length > 0, agReadErr ? agReadErr.message : `Read agency ${agencyCode}`, agReadErr);

  // 3.3 Update Agency
  const { data: agUpd, error: agUpdErr } = await supabase.from('agencies').update({
    agency_name: `Updated Agency ${testSuffix}`,
    credit_limit: 750000
  }).eq('id', agencyId).select();
  recordResult('agencies', 'UPDATE', !agUpdErr, agUpdErr ? agUpdErr.message : `Updated agency ${agencyCode}`, agUpdErr);

  // 3.4 Delete Agency
  const { error: agDelErr } = await supabase.from('agencies').delete().eq('id', agencyId);
  recordResult('agencies', 'DELETE', !agDelErr, agDelErr ? agDelErr.message : `Deleted agency ${agencyCode}`, agDelErr);

  // --------------------------------------------------------------------------
  // 4. PRODUCTS CRUD
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing Products ---');
  const prodId = crypto.randomUUID();
  const prodCode = `SKU_${testSuffix}`;

  // 4.1 Create Product
  const { data: prodIns, error: prodInsErr } = await supabase.from('products').insert([{
    id: prodId,
    product_code: prodCode,
    product_name: `Test Product ${testSuffix}`,
    pcs_per_box: 24,
    unit_price: 100,
    mrp_price: 120,
    'Product Category': 'Biscuits',
    Product_Company_Segment: 'FMCG'
  }]).select();
  recordResult('products', 'CREATE', !prodInsErr, prodInsErr ? prodInsErr.message : `Inserted product ${prodCode}`, prodInsErr);

  // 4.2 Read Product
  const { data: prodRead, error: prodReadErr } = await supabase.from('products').select('*').eq('id', prodId);
  recordResult('products', 'READ', !prodReadErr && prodRead && prodRead.length > 0, prodReadErr ? prodReadErr.message : `Read product ${prodCode}`, prodReadErr);

  // 4.3 Update Product
  const { data: prodUpd, error: prodUpdErr } = await supabase.from('products').update({
    product_name: `Updated Product ${testSuffix}`,
    unit_price: 110
  }).eq('id', prodId).select();
  recordResult('products', 'UPDATE', !prodUpdErr, prodUpdErr ? prodUpdErr.message : `Updated product ${prodCode}`, prodUpdErr);

  // --------------------------------------------------------------------------
  // 5. ORDERS CRUD
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Testing Orders ---');
  const orderId = crypto.randomUUID();
  const orderNumber = `ORD_${testSuffix}`;

  // 6.1 Create Order
  const { data: ordIns, error: ordInsErr } = await supabase.from('orders').insert([{
    id: orderId,
    order_number: orderNumber,
    status: 'DRAFT',
    total_box_qty: 10,
    total_qty_pcs: 240,
    total_amount: 24000
  }]).select();
  recordResult('orders', 'CREATE', !ordInsErr, ordInsErr ? ordInsErr.message : `Inserted order ${orderNumber}`, ordInsErr);

  // 6.2 Read Order
  const { data: ordRead, error: ordReadErr } = await supabase.from('orders').select('*').eq('id', orderId);
  recordResult('orders', 'READ', !ordReadErr && ordRead && ordRead.length > 0, ordReadErr ? ordReadErr.message : `Read order ${orderNumber}`, ordReadErr);

  // 6.3 Update Order
  const { data: ordUpd, error: ordUpdErr } = await supabase.from('orders').update({
    status: 'SUBMITTED',
    remarks: 'Urgent festival stock'
  }).eq('id', orderId).select();
  recordResult('orders', 'UPDATE', !ordUpdErr, ordUpdErr ? ordUpdErr.message : `Updated order ${orderNumber}`, ordUpdErr);

  // --------------------------------------------------------------------------
  // 7. ORDER ITEMS CRUD
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Testing Order Items ---');
  const itemId = crypto.randomUUID();

  // 7.1 Create Order Item
  const { data: itemIns, error: itemInsErr } = await supabase.from('order_items').insert([{
    id: itemId,
    order_id: orderId,
    product_id: prodId,
    pcs_per_box: 24,
    box_qty: 10,
    loose_pcs: 0,
    unit_price: 100,
    total_price: 24000,
    dispatched_qty_pcs: 0,
    pending_qty_pcs: 240
  }]).select();
  recordResult('order_items', 'CREATE', !itemInsErr, itemInsErr ? itemInsErr.message : `Inserted item ${itemId}`, itemInsErr);

  // 7.2 Read Order Item
  const { data: itemRead, error: itemReadErr } = await supabase.from('order_items').select('*').eq('id', itemId);
  recordResult('order_items', 'READ', !itemReadErr && itemRead && itemRead.length > 0, itemReadErr ? itemReadErr.message : `Read item ${itemId}`, itemReadErr);

  // 7.3 Update Order Item
  const { data: itemUpd, error: itemUpdErr } = await supabase.from('order_items').update({
    unit_price: 105,
    total_price: 25200
  }).eq('id', itemId).select();
  recordResult('order_items', 'UPDATE', !itemUpdErr, itemUpdErr ? itemUpdErr.message : `Updated item ${itemId}`, itemUpdErr);

  // 7.4 Delete Order Item
  const { error: itemDelErr } = await supabase.from('order_items').delete().eq('id', itemId);
  recordResult('order_items', 'DELETE', !itemDelErr, itemDelErr ? itemDelErr.message : `Deleted item ${itemId}`, itemDelErr);

  // 6.4 Delete Order (after deleting child item)
  const { error: ordDelErr } = await supabase.from('orders').delete().eq('id', orderId);
  recordResult('orders', 'DELETE', !ordDelErr, ordDelErr ? ordDelErr.message : `Deleted order ${orderNumber}`, ordDelErr);

  // 4.4 Delete Product (after deleting child order_items)
  const { error: prodDelErr } = await supabase.from('products').delete().eq('id', prodId);
  recordResult('products', 'DELETE', !prodDelErr, prodDelErr ? prodDelErr.message : `Deleted product ${prodCode}`, prodDelErr);

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('SUMMARY OF CRUD OPERATIONS');
  console.log('================================================================');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Total Operations Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Operations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- [${r.entity.toUpperCase()}] ${r.operation}: ${r.message}`);
    });
    console.log('\nNOTE: Run the migration script in Supabase SQL Editor to grant permissions/RLS:');
    console.log('https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new');
  } else {
    console.log('\n🎉 ALL CRUD OPERATIONS PASSED SUCCESSFULLY!');
  }
}

runAllTests().catch(err => {
  console.error('Test Suite Failed Exception:', err);
  process.exit(1);
});
