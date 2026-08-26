-- Stage 2 approval data.  The `accounts_approval_*` names are retained so
-- existing clients continue to work, but they represent Super Admin approval
-- in this workflow.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sales_admin_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sales_admin_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS sales_admin_approved_at TEXT,
  ADD COLUMN IF NOT EXISTS sales_admin_remarks TEXT,
  ADD COLUMN IF NOT EXISTS superadmin_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS superadmin_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS superadmin_approved_at TEXT,
  ADD COLUMN IF NOT EXISTS superadmin_remarks TEXT,
  ADD COLUMN IF NOT EXISTS need_accounts_approval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accounts_approval_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED'
    CHECK (accounts_approval_status IN ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'HOLD', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS accounts_approval_message TEXT,
  ADD COLUMN IF NOT EXISTS accounts_approval_requested_by TEXT,
  ADD COLUMN IF NOT EXISTS accounts_approval_requested_at TEXT,
  ADD COLUMN IF NOT EXISTS accounts_approval_responded_by TEXT,
  ADD COLUMN IF NOT EXISTS accounts_approval_responded_at TEXT,
  ADD COLUMN IF NOT EXISTS accounts_approval_response_remark TEXT;

CREATE INDEX IF NOT EXISTS orders_super_admin_approval_pending_idx
  ON public.orders (accounts_approval_status)
  WHERE need_accounts_approval = true AND accounts_approval_status = 'PENDING';
