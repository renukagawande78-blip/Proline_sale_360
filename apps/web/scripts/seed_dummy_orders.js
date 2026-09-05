import { createClient } from '@supabase/supabase-js';

const url = 'https://psaguppgoigpxumzgvjx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';
const sb = createClient(url, key);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function seedOrders() {
  const { data: companies } = await sb.from('companies').select('*');
  const { data: agencies } = await sb.from('agencies').select('*').limit(30);
  const { data: products } = await sb.from('products').select('*').limit(150);
  const { data: users } = await sb.from('users').select('*');

  if (!companies?.length || !agencies?.length || !products?.length || !users?.length) {
    console.error('Missing master records');
    return;
  }

  const findComp = (code) => companies.find(c => c.company_code === code) || companies[0];
  const findProdsByComp = (comp) => products.filter(p => p.company_id === comp.id);
  const findUser = (name) => users.find(u => u.full_name?.toLowerCase().includes(name.toLowerCase())) || users[0];

  const pgComp = findComp('PG');
  const akComp = findComp('AK');
  const mgComp = findComp('MG');
  const wpComp = findComp('WP');
  const orComp = findComp('OR');
  const hlComp = findComp('HL');
  const gdComp = findComp('GD');
  const dkComp = findComp('DK');
  const prComp = findComp('PR');
  const rcComp = findComp('RC');
  const wiComp = findComp('WI');

  const nikhil = findUser('Nikhil');
  const rahul = findUser('Rahul');
  const ashish = findUser('Ashish');
  const taral = findUser('Taral');
  const keyur = findUser('Keyur');

  const dummySpecs = [
    // 1. APPROVAL PENDING - SUPER ADMIN (Harshad Approval Pending)
    {
      order_number: 'ORD-2026-0901',
      company: pgComp,
      agency: agencies[0],
      salesperson: nikhil,
      status: 'SUBMITTED',
      sales_admin_approved: true,
      sales_admin_approved_by: 'Dixit',
      sales_admin_approved_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      order_date: new Date(Date.now() - 3600000 * 5).toISOString(),
      remarks: 'Priyagold monthly replenishment for Lalgate market. Ready for Harshad approval.'
    },
    // 2. REVIEW REQUIRED - SALES ADMIN (New Submission)
    {
      order_number: 'ORD-2026-0902',
      company: akComp,
      agency: agencies[1],
      salesperson: taral,
      status: 'SUBMITTED',
      sales_admin_approved: false,
      order_date: new Date(Date.now() - 3600000 * 2).toISOString(),
      remarks: 'Urgent Diwali display booking for Smart LED TVs & Soundbars.'
    },
    // 3. APPROVAL NEEDED - ACCOUNTS REVIEW (Credit Limit Check)
    {
      order_number: 'ORD-2026-0903',
      company: mgComp,
      agency: agencies[2],
      salesperson: rahul,
      status: 'SUBMITTED',
      need_accounts_approval: true,
      accounts_approval_status: 'PENDING',
      accounts_approval_message: 'Agency current balance Rs 1,20,000 exceeds standard limit. Special approval requested.',
      accounts_approval_requested_by: rahul.full_name,
      accounts_approval_requested_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      order_date: new Date(Date.now() - 3600000 * 8).toISOString(),
      remarks: 'Mogu Mogu assorted juice crates for Godadra supermarket chain.'
    },
    // 4. WAIT FOR STOCK / ON HOLD (Factory Inventory Arrival)
    {
      order_number: 'ORD-2026-0904',
      company: wpComp,
      agency: agencies[3],
      salesperson: keyur,
      status: 'HELD',
      hold_reason_id: 'hr02',
      hold_reason_desc: 'Waiting for factory stock arrival',
      stock_status: 'WAIT_FOR_STOCK',
      order_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      remarks: 'Whirlpool Double-Door Refrigerators on hold awaiting plant dispatch container.'
    },
    // 5. ON HOLD - ACCOUNTS HOLD
    {
      order_number: 'ORD-2026-0905',
      company: dkComp,
      agency: agencies[4],
      salesperson: ashish,
      status: 'HELD',
      hold_reason_id: 'hr01',
      hold_reason_desc: 'Party Outstanding Overdue > 45 Days',
      accounts_approval_status: 'HOLD',
      accounts_approval_response_remark: 'Please clear previous invoice INV-2026-0740 before release.',
      order_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      remarks: 'Daikin 1.5 Ton 5-Star Split AC units for Amroli electronics store.'
    },
    // 6. APPROVED - DISPATCH PENDING (In Warehouse Ready for Picking / Transport)
    {
      order_number: 'ORD-2026-0906',
      company: orComp,
      agency: agencies[5],
      salesperson: nikhil,
      status: 'APPROVED',
      sales_admin_approved: true,
      superadmin_approved: true,
      superadmin_approved_by: 'Harshad',
      superadmin_approved_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      order_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      remarks: 'Orion Choco-Pie 16-packs. Approved by Harshad. Pick list generated in warehouse.'
    },
    // 7. APPROVED - READY FOR DISPATCH / EXPRESS
    {
      order_number: 'ORD-2026-0907',
      company: gdComp,
      agency: agencies[6],
      salesperson: taral,
      status: 'APPROVED',
      sales_admin_approved: true,
      superadmin_approved: true,
      superadmin_approved_by: 'Chirag',
      superadmin_approved_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      order_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      remarks: 'Gandour Safari Wafer Bars. Ready for transport vehicle allocation.'
    },
    // 8. BILLING PENDING (Dispatched, Awaiting Accounts Invoice Generation)
    {
      order_number: 'ORD-2026-0908',
      company: hlComp,
      agency: agencies[7],
      salesperson: rahul,
      status: 'DISPATCHED',
      vehicle_number: 'GJ-05-BX-1024',
      is_company_vehicle: true,
      driver_name: 'Ramesh Patel',
      driver_mobile: '9825102938',
      lr_number: 'LR-SUR-8841',
      dispatched_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      invoice_number: null,
      order_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      remarks: '<!--DISPATCH:{"vehicle_number":"GJ-05-BX-1024","driver_name":"Ramesh Patel","driver_mobile":"9825102938","is_company_vehicle":true,"freight_amount":450}-->Hell Energy Drink Classic cans dispatched via Tempo #4.'
    },
    // 9. BILLING PENDING (Dispatched via Rental Truck)
    {
      order_number: 'ORD-2026-0909',
      company: prComp,
      agency: agencies[8],
      salesperson: nikhil,
      status: 'DISPATCHED',
      vehicle_number: 'GJ-05-CT-3390',
      is_company_vehicle: false,
      rental_agency_name: 'Shreeji Roadways',
      driver_name: 'Kamleshbhai',
      driver_mobile: '9879012345',
      lr_number: 'LR-SUR-8890',
      dispatched_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      invoice_number: null,
      order_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      remarks: '<!--DISPATCH:{"vehicle_number":"GJ-05-CT-3390","driver_name":"Kamleshbhai","driver_mobile":"9879012345","is_company_vehicle":false,"rental_agency_name":"Shreeji Roadways","freight_amount":700}-->PRAN Potata Spicy Crackers dispatched to Khatodara.'
    },
    // 10. POD IN-TRANSIT / PENDING (Billed & Dispatched, awaiting Delivery POD)
    {
      order_number: 'ORD-2026-0910',
      company: rcComp,
      agency: agencies[9],
      salesperson: rahul,
      status: 'DISPATCHED',
      invoice_number: 'INV-2026-0912',
      invoice_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      invoice_amount: 48500,
      vehicle_number: 'GJ-05-AZ-9921',
      is_company_vehicle: true,
      driver_name: 'Suresh Yadav',
      driver_mobile: '9428019283',
      lr_number: 'LR-SUR-9102',
      dispatched_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      pod_status: 'PENDING',
      order_date: new Date(Date.now() - 86400000 * 3).toISOString(),
      remarks: '<!--DISPATCH:{"vehicle_number":"GJ-05-AZ-9921","driver_name":"Suresh Yadav","driver_mobile":"9428019283","is_company_vehicle":true}-->RCPL Campa Cola PET bottles in transit.'
    },
    // 11. POD ISSUE RAISED (Exception in Delivery)
    {
      order_number: 'ORD-2026-0911',
      company: wiComp,
      agency: agencies[10],
      salesperson: taral,
      status: 'POD_ISSUE_RAISED',
      invoice_number: 'INV-2026-0915',
      invoice_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      invoice_amount: 32400,
      vehicle_number: 'GJ-05-BY-6612',
      lr_number: 'LR-SUR-9118',
      pod_status: 'ISSUE_RAISED',
      pod_issue_reason: '2 outer cartons water soaked during sudden rain. Party requested return replacement.',
      order_date: new Date(Date.now() - 86400000 * 3).toISOString(),
      remarks: 'Waiwai Chicken & Masala noodles delivered with damage exception.'
    },
    // 12. POD COMPLETE & VERIFIED (Completed Lifecycle)
    {
      order_number: 'ORD-2026-0912',
      company: akComp,
      agency: agencies[11],
      salesperson: keyur,
      status: 'COMPLETED',
      invoice_number: 'INV-2026-0880',
      invoice_date: new Date(Date.now() - 86400000 * 4).toISOString(),
      invoice_amount: 87500,
      vehicle_number: 'GJ-05-BW-4421',
      lr_number: 'LR-SUR-8711',
      pod_status: 'VERIFIED',
      pod_verified_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      pod_verified_by: 'Dharmik',
      order_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      remarks: 'AKAI Home Appliances delivered, signed & stamped POD uploaded and verified.'
    },
    // 13. COMPLETED - PRIYAGOLD BULK
    {
      order_number: 'ORD-2026-0913',
      company: pgComp,
      agency: agencies[12],
      salesperson: nikhil,
      status: 'COMPLETED',
      invoice_number: 'INV-2026-0895',
      invoice_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      invoice_amount: 114200,
      vehicle_number: 'GJ-05-CX-1210',
      lr_number: 'LR-SUR-8750',
      pod_status: 'VERIFIED',
      pod_verified_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      pod_verified_by: 'Dharmik',
      order_date: new Date(Date.now() - 86400000 * 6).toISOString(),
      remarks: 'Priyagold Butter Delite bulk order delivered & closed successfully.'
    }
  ];

  console.log(`Inserting ${dummySpecs.length} dummy orders...`);

  for (const spec of dummySpecs) {
    const orderId = uuidv4();
    const compProds = findProdsByComp(spec.company);
    const selectedProds = compProds.length > 0 ? compProds.slice(0, 2) : products.slice(0, 2);

    let totalBox = 0;
    let totalLoose = 0;
    let totalQty = 0;
    let totalAmt = 0;

    const orderItems = selectedProds.map((p, pIdx) => {
      const pcsPerBox = p.pcs_per_box || (spec.company.segment === 'FMCD' ? 1 : 24);
      const boxQty = spec.company.segment === 'FMCD' ? (pIdx === 0 ? 3 : 2) : (pIdx === 0 ? 15 : 10);
      const loosePcs = spec.company.segment === 'FMCD' ? 0 : (pIdx === 0 ? 4 : 0);
      const itemTotalQty = (boxQty * pcsPerBox) + loosePcs;
      const unitPrice = Number(p.unit_price || 150);
      const itemTotalAmt = itemTotalQty * unitPrice;

      totalBox += boxQty;
      totalLoose += loosePcs;
      totalQty += itemTotalQty;
      totalAmt += itemTotalAmt;

      return {
        id: uuidv4(),
        order_id: orderId,
        product_id: p.id,
        pcs_per_box: pcsPerBox,
        box_qty: boxQty,
        loose_pcs: loosePcs,
        unit_price: unitPrice,
        total_price: itemTotalAmt,
        dispatched_qty_pcs: spec.status === 'DISPATCHED' || spec.status === 'COMPLETED' || spec.status === 'POD_ISSUE_RAISED' ? itemTotalQty : 0,
        issued_qty_pcs: spec.status === 'DISPATCHED' || spec.status === 'COMPLETED' ? itemTotalQty : 0,
        pending_qty_pcs: spec.status === 'DISPATCHED' || spec.status === 'COMPLETED' ? 0 : itemTotalQty
      };
    });

    const orderRow = {
      id: orderId,
      order_number: spec.order_number,
      order_date: spec.order_date,
      company_id: spec.company.id,
      agency_id: spec.agency.id,
      salesperson_id: spec.salesperson.id,
      status: spec.status,
      total_box_qty: totalBox,
      total_loose_pcs: totalLoose,
      total_qty_pcs: totalQty,
      total_amount: spec.invoice_amount || totalAmt,
      remarks: spec.remarks,
      need_accounts_approval: spec.need_accounts_approval || false,
      accounts_approval_status: spec.accounts_approval_status || 'NOT_REQUIRED',
      accounts_approval_message: spec.accounts_approval_message || null,
      accounts_approval_requested_by: spec.accounts_approval_requested_by || null,
      accounts_approval_requested_at: spec.accounts_approval_requested_at || null,
      accounts_approval_response_remark: spec.accounts_approval_response_remark || null,
      created_at: spec.order_date,
      updated_at: new Date().toISOString()
    };

    const { error: ordErr } = await sb.from('orders').upsert([orderRow]);
    if (ordErr) {
      console.error('Error inserting order ' + spec.order_number + ':', ordErr.message);
    } else {
      console.log('✓ Inserted order ' + spec.order_number + ' [' + spec.status + '] (' + spec.company.company_name + ')');
    }

    if (orderItems.length > 0) {
      const { error: itmErr } = await sb.from('order_items').upsert(orderItems);
      if (itmErr) {
        console.warn('Notice inserting items for ' + spec.order_number + ':', itmErr.message);
      }
    }
  }

  console.log('All dummy orders successfully seeded into Supabase!');
}

seedOrders();
