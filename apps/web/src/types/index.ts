export type RoleName =
  | 'SUPER_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'ACCOUNTS'
  | 'BILLING'
  | 'DISPATCH_MANAGER'
  | 'AREA_SALES_MANAGER'
  | 'SALES_PERSON';

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'HELD'
  | 'REJECTED'
  | 'DISPATCH_PENDING'
  | 'PARTIALLY_DISPATCHED'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role_name: RoleName;
  password?: string;
  active?: boolean;
}

export interface Company {
  id: string;
  company_code: string;
  company_name: string;
}

export interface Area {
  id: string;
  area_code: string;
  area_name: string;
  region: string;
}

export interface Agency {
  id: string;
  agency_code: string;
  agency_name: string;
  company_id: string;
  area_id: string;
  area_name?: string;
  city?: string;
  address: string;
  contact_person: string;
  mobile: string;
  email: string;
  credit_limit: number;
}

export interface AgencyFinancials {
  agency_id: string;
  outstanding_amount: number;
  overdue_amount: number;
  advance_amount: number;
  oldest_overdue_days: number;
}

export interface Product {
  id: string;
  company_id: string;
  product_code: string;
  product_name: string;
  pcs_per_box: number;
  unit_price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  pcs_per_box: number;
  box_qty: number;
  loose_pcs: number;
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
  area_id: string;
  area_name?: string;
  salesperson_id: string;
  salesperson_name?: string;
  asm_id?: string;
  status: OrderStatus;
  total_box_qty: number;
  total_loose_pcs: number;
  total_qty_pcs: number;
  total_amount: number;
  remarks?: string;
  delivery_type?: 'F.O.R' | 'Self Pickup';
  items?: OrderItem[];
  hold_reason?: string;
  hold_remarks?: string;
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
