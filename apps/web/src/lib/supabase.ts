import { createClient } from '@supabase/supabase-js';
import { Company, Agency, Product, Order, HoldReason, AgencyFinancials } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock Master Data for instant runtime demonstration
export const MOCK_COMPANIES: Company[] = [
  { id: 'c1111111-1111-1111-1111-111111111111', company_code: 'PRY', company_name: 'Priyagold Foods' },
  { id: 'c2222222-2222-2222-2222-222222222222', company_code: 'ORN', company_name: 'Orion Confectionery' },
  { id: 'c3333333-3333-3333-3333-333333333333', company_code: 'DKN', company_name: 'Daikin Air Conditioners' },
  { id: 'c4444444-4444-4444-4444-444444444444', company_code: 'WAI', company_name: 'Waiwai Foods' },
  { id: 'c5555555-5555-5555-5555-555555555555', company_code: 'MOG', company_name: 'Mogu Mogu Beverages' }
];

export const MOCK_AGENCIES: Agency[] = [
  {
    id: 'ag111111-1111-1111-1111-111111111111',
    agency_code: 'AG-KRS-01',
    agency_name: 'Krishna Trading Agency',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    address: '102 Commercial Complex, CP, New Delhi',
    contact_person: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    email: 'rajesh@krishnatrading.com',
    credit_limit: 250000
  },
  {
    id: 'ag222222-2222-2222-2222-222222222222',
    agency_code: 'AG-APX-02',
    agency_name: 'Apex Distributors Pvt Ltd',
    company_id: 'c5555555-5555-5555-5555-555555555555',
    area_id: 'a2222222-2222-2222-2222-222222222222',
    address: 'G-45 MIDC Industrial Area, Andheri East, Mumbai',
    contact_person: 'Vikram Mehta',
    mobile: '+91 98111 22334',
    email: 'orders@apexdistributors.com',
    credit_limit: 500000
  }
];

export const MOCK_AGENCY_FINANCIALS: Record<string, AgencyFinancials> = {
  'ag111111-1111-1111-1111-111111111111': {
    agency_id: 'ag111111-1111-1111-1111-111111111111',
    outstanding_amount: 125000,
    overdue_amount: 35000,
    advance_amount: 20000,
    oldest_overdue_days: 18
  },
  'ag222222-2222-2222-2222-222222222222': {
    agency_id: 'ag222222-2222-2222-2222-222222222222',
    outstanding_amount: 480000,
    overdue_amount: 120000,
    advance_amount: 0,
    oldest_overdue_days: 45
  }
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    product_code: 'PRY-BUT-01',
    product_name: 'Priyagold Butter Delite 100g',
    pcs_per_box: 24,
    unit_price: 25.00
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    product_code: 'PRY-CNC-02',
    product_name: 'Priyagold CNC Crackers 150g',
    pcs_per_box: 24,
    unit_price: 30.00
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    company_id: 'c5555555-5555-5555-5555-555555555555',
    product_code: 'MOG-LYC-300',
    product_name: 'Mogu Mogu Lychee Juice 300ml',
    pcs_per_box: 24,
    unit_price: 65.00
  },
  {
    id: 'p4444444-4444-4444-4444-444444444444',
    company_id: 'c4444444-4444-4444-4444-444444444444',
    product_code: 'WAI-EXP-70',
    product_name: 'Waiwai Express Masala Noodles 70g',
    pcs_per_box: 30,
    unit_price: 15.00
  }
];

export const MOCK_HOLD_REASONS: HoldReason[] = [
  { id: 'hr1', reason_code: 'OVERDUE_PAYMENT', reason_description: 'Overdue Payment Pending' },
  { id: 'hr2', reason_code: 'CREDIT_LIMIT_EXCEEDED', reason_description: 'Credit Limit Exceeded' },
  { id: 'hr3', reason_code: 'ADVANCE_REQUIRED', reason_description: 'Advance Payment Required' },
  { id: 'hr4', reason_code: 'PRICE_APPROVAL_PENDING', reason_description: 'Price / Scheme Approval Pending' },
  { id: 'hr5', reason_code: 'DOCUMENT_ISSUE', reason_description: 'Document / GST Compliance Issue' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'o1111111-1111-1111-1111-111111111111',
    order_number: 'PRL-2026-001054',
    order_date: '2026-08-05 10:30',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    company_name: 'Priyagold Foods',
    agency_id: 'ag111111-1111-1111-1111-111111111111',
    agency_name: 'Krishna Trading Agency',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Delhi NCR Territory',
    salesperson_id: 'u7777777-7777-7777-7777-777777777777',
    salesperson_name: 'Amit Kumar',
    asm_id: 'u6666666-6666-6666-6666-666666666666',
    status: 'SUBMITTED',
    total_box_qty: 10,
    total_loose_pcs: 5,
    total_qty_pcs: 245,
    total_amount: 6125.00,
    remarks: 'Urgent delivery requested for festivity stock',
    items: [
      {
        id: 'oi1',
        order_id: 'o1111111-1111-1111-1111-111111111111',
        product_id: 'p1111111-1111-1111-1111-111111111111',
        product_name: 'Priyagold Butter Delite 100g',
        pcs_per_box: 24,
        box_qty: 10,
        loose_pcs: 5,
        total_qty_pcs: 245,
        unit_price: 25.00,
        total_price: 6125.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 245
      }
    ]
  },
  {
    id: 'o2222222-2222-2222-2222-222222222222',
    order_number: 'PRL-2026-001055',
    order_date: '2026-08-06 14:15',
    company_id: 'c5555555-5555-5555-5555-555555555555',
    company_name: 'Mogu Mogu Beverages',
    agency_id: 'ag222222-2222-2222-2222-222222222222',
    agency_name: 'Apex Distributors Pvt Ltd',
    area_id: 'a2222222-2222-2222-2222-222222222222',
    area_name: 'Mumbai Metro Region',
    salesperson_id: 'u7777777-7777-7777-7777-777777777777',
    salesperson_name: 'Amit Kumar',
    asm_id: 'u6666666-6666-6666-6666-666666666666',
    status: 'APPROVED',
    total_box_qty: 20,
    total_loose_pcs: 0,
    total_qty_pcs: 480,
    total_amount: 31200.00,
    remarks: 'Regular monthly restock',
    items: [
      {
        id: 'oi2',
        order_id: 'o2222222-2222-2222-2222-222222222222',
        product_id: 'p3333333-3333-3333-3333-333333333333',
        product_name: 'Mogu Mogu Lychee Juice 300ml',
        pcs_per_box: 24,
        box_qty: 20,
        loose_pcs: 0,
        total_qty_pcs: 480,
        unit_price: 65.00,
        total_price: 31200.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 480
      }
    ]
  }
];
