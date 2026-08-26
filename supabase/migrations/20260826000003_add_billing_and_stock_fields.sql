-- Persist the Stage 3 stock decision and Stage 4 billing details on the order.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS inventory_status TEXT
    CHECK (inventory_status IN ('IN_STOCK', 'WAIT_FOR_STOCK')),
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_date DATE,
  ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC(15, 2);

CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_number_unique_idx
  ON public.orders (invoice_number)
  WHERE invoice_number IS NOT NULL;
