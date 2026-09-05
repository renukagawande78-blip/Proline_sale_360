// ============================================================================
// SYSTEM ENUMS & CONSTANTS
// ============================================================================

export enum IndustrySegment {
  FMCG = 'FMCG',
  FMCD = 'FMCD'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ACCOUNTS = 'ACCOUNTS',
  SALES_ADMIN = 'SALES_ADMIN',
  BILLING = 'BILLING',
  DISPATCH_MANAGER = 'DISPATCH_MANAGER',
  AREA_SALES_MANAGER = 'AREA_SALES_MANAGER',
  SALES_PERSON = 'SALES_PERSON',
  SALES_EXECUTIVE = 'SALES_EXECUTIVE'
}

export enum OrderStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCOUNTS_APPROVED = 'ACCOUNTS_APPROVED',
  APPROVED = 'APPROVED',
  HELD = 'HELD',
  REJECTED = 'REJECTED',
  WAIT_FOR_STOCK = 'WAIT_FOR_STOCK',
  INVENTORY_AUDITED = 'INVENTORY_AUDITED',
  BILLED = 'BILLED',
  DISPATCH_PENDING = 'DISPATCH_PENDING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  READY_FOR_SELF_PICKUP = 'READY_FOR_SELF_PICKUP',
  PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED',
  DISPATCHED = 'DISPATCHED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  POD_ISSUE_RAISED = 'POD_ISSUE_RAISED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum DispatchMode {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SELF_PICKUP = 'SELF_PICKUP',
  DIRECT_PARTY_DELIVERY = 'DIRECT_PARTY_DELIVERY'
}

export enum MasterType {
  COMPANIES = 'companies',
  USERS = 'users',
  AGENCIES = 'agencies',
  PRODUCTS = 'products',
  ORDERS = 'orders'
}

export enum PriorityLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ACCOUNTS'
  | 'SALES_ADMIN'
  | 'BILLING'
  | 'DISPATCH_MANAGER'
  | 'AREA_SALES_MANAGER'
  | 'SALES_PERSON';

// ============================================================================
// BRAND MASTER ARRAY & REGISTRY
// ============================================================================

export interface BrandDefinition {
  code: string;
  name: string;
  segment: IndustrySegment;
  defaultPcsPerBox: number;
  description?: string;
  active?: boolean;
}

export const SYSTEM_BRANDS: BrandDefinition[] = [
  { code: 'AK', name: 'AKAI', segment: IndustrySegment.FMCD, defaultPcsPerBox: 1, description: 'Smart LED TVs, Home Theatres & Appliances', active: true },
  { code: 'WP', name: 'WHIRLPOOL', segment: IndustrySegment.FMCD, defaultPcsPerBox: 1, description: 'Refrigerators, Washing Machines & ACs', active: true },
  { code: 'DK', name: 'Daikin', segment: IndustrySegment.FMCD, defaultPcsPerBox: 1, description: 'Inverter Air Conditioners & Climate Systems', active: true },
  { code: 'CR', name: 'Cruise', segment: IndustrySegment.FMCD, defaultPcsPerBox: 1, description: 'Heavy-Duty Commercial & Home ACs', active: true },
  { code: 'PG', name: 'PRIYAGOLD', segment: IndustrySegment.FMCG, defaultPcsPerBox: 24, description: 'Biscuits, Cookies & Confectionery', active: true },
  { code: 'OR', name: 'ORION', segment: IndustrySegment.FMCG, defaultPcsPerBox: 16, description: 'Choco-Pie, Custard Cakes & Snacks', active: true },
  { code: 'MM', name: 'MOGU MOGU', segment: IndustrySegment.FMCG, defaultPcsPerBox: 24, description: 'Nata De Coco Fruit Juice Drinks', active: true },
  { code: 'HL', name: 'HELL', segment: IndustrySegment.FMCG, defaultPcsPerBox: 24, description: 'Energy Drinks & Functional Beverages', active: true },
  { code: 'GN', name: 'GANDOUR', segment: IndustrySegment.FMCG, defaultPcsPerBox: 24, description: 'Safari, Tofiluk Wafers & Chocolates', active: true },
  { code: 'PR', name: 'PRAN', segment: IndustrySegment.FMCG, defaultPcsPerBox: 30, description: 'Potata Crackers, Drinks & Snacks', active: true },
  { code: 'WW', name: 'Waiwai', segment: IndustrySegment.FMCG, defaultPcsPerBox: 30, description: 'Instant Ready-to-Eat Noodles', active: true },
  { code: 'RC', name: 'RCPL', segment: IndustrySegment.FMCG, defaultPcsPerBox: 24, description: 'Reliance Consumer Products / Campa Cola', active: true },
  { code: 'PO', name: 'PG-OTHER', segment: IndustrySegment.FMCG, defaultPcsPerBox: 24, description: 'Priyagold Specialty & Allied Products', active: true }
];

export const PRODUCT_GROUP_NAMES = SYSTEM_BRANDS.map(b => b.name) as readonly string[];
export type ProductGroupName = typeof SYSTEM_BRANDS[number]['name'];

export const GROUP_CODE_MAP: Record<string, string> = SYSTEM_BRANDS.reduce((acc, b) => {
  acc[b.name] = b.code;
  return acc;
}, {} as Record<string, string>);

export const getBrandByCode = (code?: string): BrandDefinition | undefined => {
  if (!code) return undefined;
  const clean = code.trim().toUpperCase();
  return SYSTEM_BRANDS.find(b => b.code.toUpperCase() === clean);
};

export const getBrandByName = (name?: string): BrandDefinition | undefined => {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return SYSTEM_BRANDS.find(b => 
    b.name.toLowerCase() === clean || 
    clean.includes(b.name.toLowerCase()) || 
    b.code.toLowerCase() === clean
  );
};

export const getGroupCode = (groupName?: string): string => {
  if (!groupName) return 'AK';
  const brand = getBrandByName(groupName);
  if (brand) return brand.code;
  const clean = groupName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return clean.length >= 2 ? clean.substring(0, 2) : 'AK';
};

export const getBrandSegment = (brandNameOrCode?: string): IndustrySegment => {
  const brand = getBrandByName(brandNameOrCode) || getBrandByCode(brandNameOrCode);
  return brand?.segment || IndustrySegment.FMCG;
};

export const getBrandDefaultPackSize = (brandNameOrCode?: string): number => {
  const brand = getBrandByName(brandNameOrCode) || getBrandByCode(brandNameOrCode);
  return brand?.defaultPcsPerBox || 1;
};

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SALES_ADMIN_APPROVED'     // Stage 2a: Sales Admin signed off, waiting for Super Admin
  | 'ACCOUNTS_APPROVED'
  | 'APPROVED'                  // Stage 2b: Both Sales Admin + Super Admin signed off → ready for Billing
  | 'HELD'
  | 'REJECTED'
  | 'WAIT_FOR_STOCK'
  | 'INVENTORY_AUDITED'
  | 'BILLED'
  | 'INVOICED'
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

export type ZoneRegion = 'Surat City' | 'Surat Rural' | 'Surat City Zone' | 'South Gujarat Rural Zone' | 'City' | 'Rural' | 'Other';

export type ZoneName =
  | 'City-A'
  | 'City-B'
  | 'City-C'
  | 'City-D'
  | 'City-E'
  | 'Upper South'
  | 'South'
  | 'East'
  | 'North'
  | 'Other Z';

export interface ZoneMaster {
  id: string;
  zone_code: string;
  zone_name: ZoneName;
  region: ZoneRegion;
  major_areas: string[];
  description?: string;
  agency_count?: number;
}

export type AreaTypeName = 'Surat City' | 'Surat Rural' | 'City' | 'Rural' | 'Other';

export interface AreaTypeMaster {
  id: string;
  type_code: string;
  type_name: AreaTypeName;
  description: string;
  delivery_sla: string;
  default_vehicle_mode: string;
  associated_zones: ZoneName[];
  localities_count?: number;
  agency_count?: number;
  active: boolean;
  created_at?: string;
}

export interface Agency {
  id: string;
  agency_code: string;
  agency_name: string;
  company_id?: string;
  area_id?: string;
  area_name?: string;
  city?: string;
  pincode?: string;
  pin_code?: string;
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

export interface Product {
  id: string;
  company_id: string;
  company_name?: string;
  Product_Company_Name?: string;
  Product_Company_Segment?: string;
  Product_Company_Code?: string;
  product_code: string;
  product_name: string;
  segment?: 'FMCG' | 'FMCD' | string;
  category?: string;
  pcs_per_box: number;
  mrp_price: number;
  unit_price: number;
  active?: boolean;
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
  issued_qty_pcs?: number;
  pending_qty_pcs: number;
  remark?: string;
}

export type AccountsApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'HOLD'
  | 'REJECTED';

export interface OrderHistoryEntry {
  id: string;
  order_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  remarks?: string;
  details?: any;
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
  zone_name?: string;
  zone_region?: string;
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
  billing_total_qty?: number;
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
  rental_agency_name?: string;
  freight_amount?: number;
  dispatch_remark?: string;
  reattempt_delivery?: boolean;
  pod_status?: 'CLEAN' | 'ISSUE_RAISED';
  pod_issue_type?: 'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' | 'OTHER';
  pod_issue_details?: string;
  pod_query_raised_by?: string;
  pod_query_raised_at?: string;
  grn_number?: string;
  grn_date?: string;
  grn_value?: number;
  grn_remark?: string;
  grn_workflow_status?: 'PENDING_SALES_ADMIN' | 'PENDING_BILLING' | 'PENDING_SALES_ADMIN_COMPLETION' | 'COMPLETED';
  previous_status_before_hold?: OrderStatus;

  // Dual-Approval Gate (Stage 2: Sales Admin + Super Admin)
  sales_admin_approved?: boolean;
  sales_admin_approved_by?: string;
  sales_admin_approved_at?: string;
  sales_admin_remarks?: string;
  superadmin_approved?: boolean;
  superadmin_approved_by?: string;
  superadmin_approved_at?: string;
  superadmin_remarks?: string;

  // Accounts Approval Workflow Fields
  need_accounts_approval?: boolean;
  accounts_approval_status?: AccountsApprovalStatus;
  accounts_approval_message?: string;
  accounts_approval_requested_by?: string;
  accounts_approval_requested_at?: string;
  accounts_approval_responded_by?: string;
  accounts_approval_responded_at?: string;
  accounts_approval_response_remark?: string;

  // Audit & Transaction History
  order_history?: OrderHistoryEntry[];
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

export type HoldReasonCategory = 'FINANCIAL' | 'OPERATIONAL' | 'INVENTORY' | 'DISPUTE' | 'COMPLIANCE';

export interface HoldReason {
  id: string;
  reason_code: string;
  reason_description: string;
  category?: HoldReasonCategory;
  action_rule?: string;
  sla_hours?: number;
  active?: boolean;
  created_at?: string;
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

export type NotificationCategory = 
  | 'ORDER'      // New order created / modified
  | 'APPROVAL'   // Super Admin approval / review required
  | 'INVENTORY'  // Wait for stock / stock availability
  | 'DISPATCH'   // Out for delivery / dispatched / reattempt delivery
  | 'BILLING'    // Tax invoice / GRN checked / GRN forwarded
  | 'POD'        // POD query raised / POD verified
  | 'SYSTEM';    // System notices

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  event_type: string;
  order_id?: string;
  dispatch_id?: string;
  is_read: boolean;
  created_at: string;
  target_roles?: RoleName[];
  category?: NotificationCategory;
  brand_name?: string;
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
  dispatchManagerId?: string;
  vehicleNumber?: string;
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
