import { HoldReason } from '../types';

export const DEFAULT_HOLD_REASONS: HoldReason[] = [
  {
    id: 'hr_01',
    reason_code: 'CR-LIMIT',
    reason_description: 'Credit Limit Exceeded — Outstanding balance exceeds sanctioned credit line',
    category: 'FINANCIAL',
    action_rule: 'Accounts / Super Admin ledger review or partial payment clearance required',
    sla_hours: 24,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_02',
    reason_code: 'OVERDUE-INV',
    reason_description: 'Past Due Invoices Outstanding — Unpaid invoices exceeding agreed credit days',
    category: 'FINANCIAL',
    action_rule: 'Overdue invoice settlement or Accounts department clearance sign-off',
    sla_hours: 12,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_03',
    reason_code: 'CHEQUE-RETURN',
    reason_description: 'Cheque Return / Payment Instrument Dishonor flagged on agency ledger',
    category: 'FINANCIAL',
    action_rule: 'Immediate RTGS / NEFT / Cash realization mandatory before releasing load',
    sla_hours: 6,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_04',
    reason_code: 'PRICE-VARIANCE',
    reason_description: 'Price / Special Scheme Discrepancy — Order booked below Net Sales Price',
    category: 'DISPUTE',
    action_rule: 'Area Sales Manager (ASM) or Commercial Head rate exception authorization',
    sla_hours: 24,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_05',
    reason_code: 'MOQ-THRESHOLD',
    reason_description: 'Below Minimum Order Quantity (MOQ) or Cart Value for freight viability',
    category: 'OPERATIONAL',
    action_rule: 'Club with adjacent route orders or Sales Executive order value revision',
    sla_hours: 48,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_06',
    reason_code: 'STOCK-ALLOC',
    reason_description: 'Temporary Warehouse Inventory Shortage — Wait for inbound factory batch',
    category: 'INVENTORY',
    action_rule: 'Warehouse stock arrival inspection & FIFO batch allocation',
    sla_hours: 48,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_07',
    reason_code: 'GST-KYC-PENDING',
    reason_description: 'GST / Delivery Address Verification Discrepancy on e-Way portal',
    category: 'COMPLIANCE',
    action_rule: 'Valid GSTIN certificate & e-Way bill party delivery address verification',
    sla_hours: 24,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_08',
    reason_code: 'TERRITORY-DISP',
    reason_description: 'Territory / Cross-Border Sales Boundary Conflict under investigation',
    category: 'DISPUTE',
    action_rule: 'Zonal Sales Manager commercial dealer territory adjudication',
    sla_hours: 24,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_09',
    reason_code: 'DAMAGE-INSPECT',
    reason_description: 'Unsettled GRN / Transit Goods Return claim pending ledger reconciliation',
    category: 'DISPUTE',
    action_rule: 'Billing team credit note issuance and debit note adjustment approval',
    sla_hours: 24,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'hr_10',
    reason_code: 'MANAGEMENT-DIR',
    reason_description: 'Super Admin Commercial Review Directive / Strategic Administrative Hold',
    category: 'OPERATIONAL',
    action_rule: 'Exclusive Super Admin (Harshad Sir / Chirag Sir) release override',
    sla_hours: 12,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  }
];
