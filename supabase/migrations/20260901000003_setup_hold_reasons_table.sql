-- ============================================================================
-- PROLINE OMS 360 - HOLD REASONS DIRECTORY TABLE & SEED DATA
-- Migration: 20260901000003_setup_hold_reasons_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hold_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason_code TEXT NOT NULL UNIQUE,
    reason_description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'OPERATIONAL',
    action_rule TEXT,
    sla_hours INTEGER DEFAULT 24,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hold_reasons ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anon users
DROP POLICY IF EXISTS "Allow select on hold_reasons" ON public.hold_reasons;
CREATE POLICY "Allow select on hold_reasons" ON public.hold_reasons
    FOR SELECT USING (true);

-- Allow insert/update to all for operational continuity
DROP POLICY IF EXISTS "Allow insert/update on hold_reasons" ON public.hold_reasons;
CREATE POLICY "Allow insert/update on hold_reasons" ON public.hold_reasons
    FOR ALL USING (true) WITH CHECK (true);

-- Seed standard 10 Hold Reasons
INSERT INTO public.hold_reasons (reason_code, reason_description, category, action_rule, sla_hours, active)
VALUES
('CR-LIMIT', 'Credit Limit Exceeded — Outstanding balance exceeds sanctioned credit line', 'FINANCIAL', 'Accounts / Super Admin ledger review or partial payment clearance required', 24, true),
('OVERDUE-INV', 'Past Due Invoices Outstanding — Unpaid invoices exceeding agreed credit days', 'FINANCIAL', 'Overdue invoice settlement or Accounts department clearance sign-off', 12, true),
('CHEQUE-RETURN', 'Cheque Return / Payment Instrument Dishonor flagged on agency ledger', 'FINANCIAL', 'Immediate RTGS / NEFT / Cash realization mandatory before releasing load', 6, true),
('PRICE-VARIANCE', 'Price / Special Scheme Discrepancy — Order booked below Net Sales Price', 'DISPUTE', 'Area Sales Manager (ASM) or Commercial Head rate exception authorization', 24, true),
('MOQ-THRESHOLD', 'Below Minimum Order Quantity (MOQ) or Cart Value for freight viability', 'OPERATIONAL', 'Club with adjacent route orders or Sales Executive order value revision', 48, true),
('STOCK-ALLOC', 'Temporary Warehouse Inventory Shortage — Wait for inbound factory batch', 'INVENTORY', 'Warehouse stock arrival inspection & FIFO batch allocation', 48, true),
('GST-KYC-PENDING', 'GST / Delivery Address Verification Discrepancy on e-Way portal', 'COMPLIANCE', 'Valid GSTIN certificate & e-Way bill party delivery address verification', 24, true),
('TERRITORY-DISP', 'Territory / Cross-Border Sales Boundary Conflict under investigation', 'DISPUTE', 'Zonal Sales Manager commercial dealer territory adjudication', 24, true),
('DAMAGE-INSPECT', 'Unsettled GRN / Transit Goods Return claim pending ledger reconciliation', 'DISPUTE', 'Billing team credit note issuance and debit note adjustment approval', 24, true),
('MANAGEMENT-DIR', 'Super Admin Commercial Review Directive / Strategic Administrative Hold', 'OPERATIONAL', 'Exclusive Super Admin (Harshad Sir / Chirag Sir) release override', 12, true)
ON CONFLICT (reason_code) DO UPDATE SET
    reason_description = EXCLUDED.reason_description,
    category = EXCLUDED.category,
    action_rule = EXCLUDED.action_rule,
    sla_hours = EXCLUDED.sla_hours,
    active = EXCLUDED.active,
    updated_at = NOW();
