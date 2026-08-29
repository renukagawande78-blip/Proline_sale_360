-- Store the manually entered aggregate quantity from Stage 4 billing.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS billing_total_qty INTEGER
    CHECK (billing_total_qty >= 0);
