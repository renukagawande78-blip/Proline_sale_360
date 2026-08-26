ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS credit_days INTEGER,
  ADD COLUMN IF NOT EXISTS billing_remark TEXT;
