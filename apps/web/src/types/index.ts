export type RoleName =
  | 'SUPER_ADMIN'
  | 'ACCOUNTS'
  | 'SALES_ADMIN'
  | 'BILLING'
  | 'DISPATCH_MANAGER'
  | 'AREA_SALES_MANAGER'
  | 'SALES_PERSON';

export const PRODUCT_GROUP_NAMES = [
  'AKAI',
  'GANDOUR',
  'HELL',
  'MOGU MOGU',
  'ORION',
  'PG-OTHER',
  'PRAN',
  'PRIYAGOLD',
  'RCPL',
  'Waiwai',
  'WHIRLPOOL',
  'Daikin',
  'Cruise'
] as const;

export type ProductGroupName = typeof PRODUCT_GROUP_NAMES[number];

export const GROUP_CODE_MAP: Record<string, string> = {
  'AKAI': 'AK',
  'GANDOUR': 'GN',
  'HELL': 'HL',
  'MOGU MOGU': 'MM',
  'ORION': 'OR',
  'PG-OTHER': 'PO',
  'PRAN': 'PR',
  'PRIYAGOLD': 'PG',
  'RCPL': 'RC',
  'Waiwai': 'WW',
  'WHIRLPOOL': 'WP',
  'Daikin': 'DK',
  'Cruise': 'CR'
};

export const getGroupCode = (groupName?: string): string => {
  if (!groupName) return 'AK';
  const g = groupName.trim();
  if (GROUP_CODE_MAP[g]) return GROUP_CODE_MAP[g];
  const clean = g.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return clean.length >= 2 ? clean.substring(0, 2) : 'AK';
};

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCOUNTS_APPROVED'
  | 'APPROVED'
  | 'HELD'
  | 'REJECTED'
  | 'WAIT_FOR_STOCK'
  | 'INVENTORY_AUDITED'
  | 'BILLED'
  | 'DISPATCH_PENDING'
  | 'READY_FOR_PICKUP'
  | 'READY_FOR_SELF_PICKUP'
  | 'PARTIALLY_DISPATCHED'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'POD_ISSUE_RAISED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PermissionControl {
  add_order: boolean;                   // Add Order / Order Entry
  view_order: boolean;                  // View Order
  cancel_order: boolean;                // Cancel Order
  delete_order: boolean;                // Delete Order (Admin / System Admin Only)
  order_entry?: boolean;                // Alias for add_order
  party_view: boolean;                  // Party / Agency View
  new_party: boolean;                   // New Party Creation
  product_mgmt: boolean;                // Product Master Management
  order_transfer_to_billing: boolean;   // Order Transfer to Billing
  order_status_dashboard_all: boolean;  // Order Status Dashboard (All)
  company_order_status_dashboard: boolean; // Align Company's Order Status Dashboard
  company_order_form: boolean;          // Company's Order Form / Align
  order_transfer_to_dispatch: boolean; // Order Transfer to Dispatch
  order_transfer_out_for_delivery: boolean; // Order Transfer to Out for Delivery
  pod_verification: boolean;            // Pod Verification
  user_authority: boolean;              // User Passwords & Authority
}

export interface PermissionGroup {
  id: string;
  group_name: string;
  description: string;
  permissions: PermissionControl;
  is_system?: boolean;
}

export interface User {
  id: string;
  sno?: number;
  email: string;
  full_name: string;
  phone?: string;
  role_name: RoleName;
  permission_group_id?: string;
  permission_group_name?: string;
  company_handle?: string;
  password?: string;
  active?: boolean;
  permissions?: PermissionControl;
  assigned_segment?: SegmentType | 'ALL';
}

export type SegmentType = 'FMCG' | 'FMCD' | 'COMPANY';

export interface Company {
  id: string;
  company_code: string;
  company_name: string;
  segment?: SegmentType;
  handle?: string;
  brand_color?: string;
  active?: boolean;
}


export interface Area {
  id: string;
  area_code: string;
  area_name: string;
  region: string;
}

export type ZoneRegion = 'Surat City Zone' | 'South Gujarat Rural Zone';

export type ZoneName =
  | 'City-A'
  | 'City-B'
  | 'City-C'
  | 'City-D'
  | 'City-E'
  | 'Upper South'
  | 'South'
  | 'East'
  | 'North';

export interface ZoneMaster {
  id: string;
  zone_code: string;
  zone_name: ZoneName;
  region: ZoneRegion;
  major_areas: string[];
  description?: string;
  agency_count?: number;
}

export interface Agency {
  id: string;
  agency_code: string;
  agency_name: string;
  company_id?: string;
  area_id?: string;
  area_name?: string;
  city?: string;
  address?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  gst_number?: string;
  gstin?: string;
  account_group?: string;
  credit_limit: number;
  zone_id?: string;
  zone_name?: string;
  zone_region?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  assigned_salesperson?: string;
  active?: boolean;
}

export interface AgencyFinancials {
  agency_id: string;
  agency_name?: string;
  credit_limit?: number;
  current_outstanding?: number;
  outstanding_amount: number;
  overdue_amount: number;
  advance_amount?: number;
  oldest_overdue_days?: number;
  available_credit?: number;
  credit_score?: number;
  payment_terms_days?: number;
  accounts_clearance_status?: string;
  account_type?: string;
  remarks?: string;
  updated_at?: string;
  updated_by_name?: string;
}

export interface MRPHistoryEntry {
  previous_mrp: number;
  new_mrp: number;
  updated_at: string;
  updated_by: string;
  reason?: string;
}

export interface Product {
  id: string;
  company_id: string;
  product_code: string;
  product_name: string;
  mrp_price: number;
  pcs_per_box: number;
  unit_price: number;
  category?: string;
  account_group?: 'FMCG' | 'FMCD' | string;
  segment?: 'FMCG' | 'FMCD' | string;
  previous_mrp?: number;
  mrp_updated_at?: string;
  mrp_updated_by?: string;
  mrp_history?: MRPHistoryEntry[];
  stock_box_qty?: number;
  stock_loose_pcs?: number;
  total_stock_pcs?: number;
  reserved_stock_pcs?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  mrp_price?: number;
  pcs_per_box: number;
  box_qty: number;
  loose_pcs: number;
  free_pcs?: number;
  total_qty_pcs: number;
  unit_price: number;
  total_price: number;
  dispatched_qty_pcs: number;
  pending_qty_pcs: number;
  remark?: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_date: string;
  company_id: string;
  company_name?: string;
  agency_id: string;
  agency_name?: string;
  agency_code?: string;
  area_id: string;
  area_name?: string;
  salesperson_id: string;
  salesperson_name?: string;
  asm_id?: string;
  status: OrderStatus;
  total_box_qty: number;
  total_loose_pcs: number;
  total_qty_pcs: number;
  total_free_pcs?: number;
  total_amount: number;
  remarks?: string;
  delivery_type?: 'F.O.R' | 'Self Pickup';
  items?: OrderItem[];
  hold_reason?: string;
  hold_remarks?: string;
  approved_by_name?: string;
  approved_at?: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: number;
  return_request?: ReturnRequest;
  
  // Operational Workflow Diagram Fields
  payment_type?: 'ADVANCE' | 'OVERDUE' | 'CREDIT';
  payment_receipt_no?: string;
  financial_approval_by?: string;
  inventory_status?: 'IN_STOCK' | 'WAIT_FOR_STOCK';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  credit_days?: number;
  vehicle_number?: string;
  is_company_vehicle?: boolean;
  driver_name?: string;
  driver_mobile?: string;
  tempo_number?: string;
  booking_id?: string;
  freight_amount?: number;
  pod_status?: 'CLEAN' | 'ISSUE_RAISED';
  pod_issue_type?: 'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN';
  pod_issue_details?: string;
  grn_number?: string;
  grn_value?: number;
  previous_status_before_hold?: OrderStatus;
}

export type ReturnType = 'REPLACEMENT' | 'DAMAGED_RETURN';

export interface ReturnRequestItem {
  order_item_id: string;
  product_name: string;
  requested_qty_pcs: number;
  replaced_qty_pcs?: number;
  damaged_returned_qty_pcs?: number;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  return_type: ReturnType;
  reason: string;
  status: 'PENDING_ADMIN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DISPATCH_PROCESSED';
  requested_by_name: string;
  requested_at: string;
  approved_by_name?: string;
  approved_at?: string;
  items: ReturnRequestItem[];
  dispatch_notes?: string;
}

export interface HoldReason {
  id: string;
  reason_code: string;
  reason_description: string;
}

export interface Dispatch {
  id: string;
  dispatch_number: string;
  order_id: string;
  order_number?: string;
  agency_name?: string;
  dispatch_date: string;
  dispatch_type_name: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_mobile?: string;
  lr_number?: string;
  status: string;
  dispatched_by_name?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  event_type: string;
  order_id?: string;
  dispatch_id?: string;
  is_read: boolean;
  created_at: string;
}

export type DateRangeType = 'ALL_DATES' | 'TODAY' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM';

export interface GlobalFilterState {
  segment: 'ALL' | 'FMCG' | 'FMCD';
  companyId: string;
  status: string;
  salespersonId: string;
  agencyId: string;
  areaId: string;
  city: string;
  zoneId?: string;
  productId: string;
  mrpRange: 'ALL' | 'UNDER_50' | '50_500' | '500_5000' | 'ABOVE_5000';
  dateRangeType: DateRangeType;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface AreaMaster {
  id: string;
  area_code: string;
  area_name: string;
  city: string;
  zone_code?: string;
  region?: string;
  description?: string;
  created_at?: string;
}
