import { createClient } from '@supabase/supabase-js';
import { Company, Agency, Product, Order, HoldReason, AgencyFinancials } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isCompanyAllowedForUser = (companyNameOrCode?: string, userCompanyHandle?: string): boolean => {
  if (!userCompanyHandle || userCompanyHandle === 'All') return true;
  const allowedBrands = userCompanyHandle.split(',').map(b => b.trim().toLowerCase());
  const target = (companyNameOrCode || '').toLowerCase().trim();
  
  return allowedBrands.some(allowed => {
    if (!allowed) return false;
    return target.includes(allowed) || allowed.includes(target);
  });
};

// Master Brand Companies
export const MOCK_COMPANIES: Company[] = [
  { id: 'c01', company_code: 'PRG', company_name: 'Pringod (Priyagold)' },
  { id: 'c02', company_code: 'RCPL', company_name: 'RCPL' },
  { id: 'c03', company_code: 'ORN', company_name: 'Orion' },
  { id: 'c04', company_code: 'GND', company_name: 'Gandour' },
  { id: 'c05', company_code: 'HPP', company_name: 'HPPL' },
  { id: 'c06', company_code: 'WPL', company_name: 'Whirlpool' },
  { id: 'c07', company_code: 'DKN', company_name: 'Daikin' },
  { id: 'c08', company_code: 'CRS', company_name: 'Cruise' },
  { id: 'c09', company_code: 'MOG', company_name: 'Mogu Mogu' },
  { id: 'c10', company_code: 'HEL', company_name: 'Heli' },
  { id: 'c11', company_code: 'WAI', company_name: 'Waiwai' },
  { id: 'c12', company_code: 'PRN', company_name: 'PRAN' },
  { id: 'c13', company_code: 'AK', company_name: 'AK Group' }
];

export const MOCK_AGENCIES: Agency[] = [
  {
    id: 'a0111111-1111-1111-1111-111111111111',
    agency_code: 'AG-KRS-01',
    agency_name: 'Krishna Trading Agency',
    company_id: 'c01',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Delhi NCR Territory',
    city: 'New Delhi',
    address: '102 Commercial Complex, CP, New Delhi',
    contact_person: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    email: 'rajesh@krishnatrading.com',
    credit_limit: 250000
  },
  {
    id: 'a0222222-2222-2222-2222-222222222222',
    agency_code: 'AG-APX-02',
    agency_name: 'Apex Distributors Pvt Ltd',
    company_id: 'c07',
    area_id: 'a2222222-2222-2222-2222-222222222222',
    area_name: 'Mumbai Metro Region',
    city: 'Mumbai',
    address: 'G-45 MIDC Industrial Area, Andheri East, Mumbai',
    contact_person: 'Vikram Mehta',
    mobile: '+91 98111 22334',
    email: 'orders@apexdistributors.com',
    credit_limit: 500000
  },
  {
    id: 'a0333333-3333-3333-3333-333333333333',
    agency_code: 'AG-STR-03',
    agency_name: 'Star Retail Logistics',
    company_id: 'c09',
    area_id: 'a3333333-3333-3333-3333-333333333333',
    area_name: 'Bangalore Urban Area',
    city: 'Bangalore',
    address: '88 Ring Road, Indiranagar, Bangalore',
    contact_person: 'Suresh Reddy',
    mobile: '+91 99000 55443',
    email: 'suresh@starlogistics.com',
    credit_limit: 150000
  },
  {
    id: 'a0444444-4444-4444-4444-444444444444',
    agency_code: 'AG-RNJ-04',
    agency_name: 'Ranjeet Enterprise',
    company_id: 'c11',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Ahmedabad West',
    city: 'Ahmedabad',
    address: 'Commercial Zone, Ashram Road, Ahmedabad',
    contact_person: 'Ranjeet Singh',
    mobile: '+91 97123 45678',
    email: 'ranjeet@enterprise.com',
    credit_limit: 300000
  }
];

export const MOCK_AGENCY_FINANCIALS: Record<string, AgencyFinancials> = {
  'a0111111-1111-1111-1111-111111111111': {
    agency_id: 'a0111111-1111-1111-1111-111111111111',
    outstanding_amount: 125000,
    overdue_amount: 35000,
    advance_amount: 20000,
    oldest_overdue_days: 18
  },
  'a0222222-2222-2222-2222-222222222222': {
    agency_id: 'a0222222-2222-2222-2222-222222222222',
    outstanding_amount: 480000,
    overdue_amount: 120000,
    advance_amount: 0,
    oldest_overdue_days: 45
  }
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    company_id: 'c01',
    product_code: 'PRY-BUT-01',
    product_name: 'Priyagold Butter Delite 100g',
    pcs_per_box: 24,
    unit_price: 25.00
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    company_id: 'c01',
    product_code: 'PRY-CNC-02',
    product_name: 'Priyagold CNC Crackers 150g',
    pcs_per_box: 24,
    unit_price: 30.00
  },
  {
    id: 'f3333333-3333-3333-3333-333333333333',
    company_id: 'c09',
    product_code: 'MOG-LYC-300',
    product_name: 'Mogu Mogu Lychee Juice 300ml',
    pcs_per_box: 24,
    unit_price: 65.00
  },
  {
    id: 'f4444444-4444-4444-4444-444444444444',
    company_id: 'c11',
    product_code: 'WAI-EXP-70',
    product_name: 'Waiwai Express Masala Noodles 70g',
    pcs_per_box: 30,
    unit_price: 15.00
  },
  {
    id: 'f5555555-5555-5555-5555-555555555555',
    company_id: 'c07',
    product_code: 'DKN-INV-1.5T',
    product_name: 'Daikin 1.5 Ton 5-Star Inverter Split AC',
    pcs_per_box: 1,
    unit_price: 38500.00
  },
  {
    id: 'f6666666-6666-6666-6666-666666666666',
    company_id: 'c06',
    product_code: 'WPL-REF-265L',
    product_name: 'Whirlpool 265L Frost-Free Double Door Refrigerator',
    pcs_per_box: 1,
    unit_price: 24500.00
  }
];

export const MOCK_HOLD_REASONS: HoldReason[] = [
  { id: 'eb111111-1111-1111-1111-111111111111', reason_code: 'OVERDUE_PAYMENT', reason_description: 'Overdue Payment Pending' },
  { id: 'eb222222-2222-2222-2222-222222222222', reason_code: 'CREDIT_LIMIT_EXCEEDED', reason_description: 'Credit Limit Exceeded' },
  { id: 'eb333333-3333-3333-3333-333333333333', reason_code: 'ADVANCE_REQUIRED', reason_description: 'Advance Payment Required' },
  { id: 'eb444444-4444-4444-4444-444444444444', reason_code: 'PRICE_APPROVAL_PENDING', reason_description: 'Price / Scheme Approval Pending' },
  { id: 'eb555555-5555-5555-5555-555555555555', reason_code: 'DOCUMENT_ISSUE', reason_description: 'Document / GST Compliance Issue' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    order_number: 'PRG-08082026-001',
    order_date: '2026-08-05 10:30',
    company_id: 'c01',
    company_name: 'Pringod (Priyagold)',
    agency_id: 'a0111111-1111-1111-1111-111111111111',
    agency_name: 'Krishna Trading Agency',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Delhi NCR Territory',
    salesperson_id: 'u24',
    salesperson_name: 'Shailendra',
    asm_id: 'u12',
    status: 'SUBMITTED',
    total_box_qty: 10,
    total_loose_pcs: 5,
    total_qty_pcs: 245,
    total_amount: 6125.00,
    remarks: 'Urgent delivery requested for festivity stock',
    delivery_type: 'F.O.R',
    items: [
      {
        id: 'PRG-08082026-001/PRY-1',
        order_id: 'b1111111-1111-1111-1111-111111111111',
        product_id: 'f1111111-1111-1111-1111-111111111111',
        product_name: 'Priyagold Butter Delite 100g',
        pcs_per_box: 24,
        box_qty: 10,
        loose_pcs: 5,
        total_qty_pcs: 245,
        unit_price: 25.00,
        total_price: 6125.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 245,
        remark: 'Urgent festivity packing'
      }
    ]
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    order_number: 'DKN-08082026-002',
    order_date: '2026-08-06 14:15',
    company_id: 'c07',
    company_name: 'Daikin',
    agency_id: 'a0222222-2222-2222-2222-222222222222',
    agency_name: 'Apex Distributors Pvt Ltd',
    area_id: 'a2222222-2222-2222-2222-222222222222',
    area_name: 'Mumbai Metro Region',
    salesperson_id: 'u31',
    salesperson_name: 'Taral',
    asm_id: 'u18',
    status: 'APPROVED',
    total_box_qty: 10,
    total_loose_pcs: 0,
    total_qty_pcs: 10,
    total_amount: 385000.00,
    remarks: 'Commercial air conditioner order',
    delivery_type: 'Self Pickup',
    items: [
      {
        id: 'DKN-08082026-002/DKN-1',
        order_id: 'b2222222-2222-2222-2222-222222222222',
        product_id: 'f5555555-5555-5555-5555-555555555555',
        product_name: 'Daikin 1.5 Ton 5-Star Inverter Split AC',
        pcs_per_box: 1,
        box_qty: 10,
        loose_pcs: 0,
        total_qty_pcs: 10,
        unit_price: 38500.00,
        total_price: 385000.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 10,
        remark: 'Includes installation kit'
      }
    ]
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    order_number: 'MOG-08082026-003',
    order_date: '2026-08-07 09:20',
    company_id: 'c09',
    company_name: 'Mogu Mogu',
    agency_id: 'a0333333-3333-3333-3333-333333333333',
    agency_name: 'Star Retail Logistics',
    area_id: 'a3333333-3333-3333-3333-333333333333',
    area_name: 'Bangalore Urban Area',
    salesperson_id: 'u30',
    salesperson_name: 'Sagar',
    asm_id: 'u20',
    status: 'SUBMITTED',
    total_box_qty: 30,
    total_loose_pcs: 0,
    total_qty_pcs: 720,
    total_amount: 46800.00,
    remarks: 'Beverage retail distribution',
    delivery_type: 'F.O.R',
    items: [
      {
        id: 'MOG-08082026-003/MOG-1',
        order_id: 'b3333333-3333-3333-3333-333333333333',
        product_id: 'f3333333-3333-3333-3333-333333333333',
        product_name: 'Mogu Mogu Lychee Juice 300ml',
        pcs_per_box: 24,
        box_qty: 30,
        loose_pcs: 0,
        total_qty_pcs: 720,
        unit_price: 65.00,
        total_price: 46800.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 720,
        remark: 'Keep refrigerated'
      }
    ]
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    order_number: 'WAI-08082026-004',
    order_date: '2026-08-07 11:45',
    company_id: 'c11',
    company_name: 'Waiwai',
    agency_id: 'a0444444-4444-4444-4444-444444444444',
    agency_name: 'Ranjeet Enterprise',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Ahmedabad West',
    salesperson_id: 'u22',
    salesperson_name: 'Keyur (Waiwai)',
    asm_id: 'u22',
    status: 'DISPATCHED',
    total_box_qty: 40,
    total_loose_pcs: 0,
    total_qty_pcs: 1200,
    total_amount: 18000.00,
    remarks: 'Dispatched via Transporter RJ-14-GA-9022',
    delivery_type: 'F.O.R',
    items: [
      {
        id: 'WAI-08082026-004/WAI-1',
        order_id: 'b4444444-4444-4444-4444-444444444444',
        product_id: 'f4444444-4444-4444-4444-444444444444',
        product_name: 'Waiwai Express Masala Noodles 70g',
        pcs_per_box: 30,
        box_qty: 40,
        loose_pcs: 0,
        total_qty_pcs: 1200,
        unit_price: 15.00,
        total_price: 18000.00,
        dispatched_qty_pcs: 1200,
        pending_qty_pcs: 0,
        remark: 'Fully dispatched'
      }
    ]
  }
];
