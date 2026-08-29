ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
  ADD COLUMN IF NOT EXISTS is_company_vehicle BOOLEAN,
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS driver_mobile TEXT,
  ADD COLUMN IF NOT EXISTS tempo_number TEXT,
  ADD COLUMN IF NOT EXISTS booking_id TEXT,
  ADD COLUMN IF NOT EXISTS rental_agency_name TEXT,
  ADD COLUMN IF NOT EXISTS freight_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS dispatch_remark TEXT;
