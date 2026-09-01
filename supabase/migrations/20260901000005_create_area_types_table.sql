-- ============================================================================
-- Proline OMS 360 - Area Types Master Schema & Seed Migration (City & Rural)
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create public.area_types table
CREATE TABLE IF NOT EXISTS public.area_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    delivery_sla VARCHAR(150) DEFAULT 'Standard Delivery',
    default_vehicle_mode VARCHAR(150) DEFAULT 'F.O.R (Vehicle)',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Configure RLS and Full Permissions
ALTER TABLE public.area_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on area_types" ON public.area_types;
CREATE POLICY "Allow full access on area_types" ON public.area_types
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.area_types TO anon, authenticated, service_role;

-- 3. Seed City and Rural Area Types
INSERT INTO public.area_types (type_code, type_name, description, delivery_sla, default_vehicle_mode, active)
VALUES
  (
    'CITY',
    'City',
    'Surat Municipal Corporation urban areas, textile markets, diamond corridor & local industrial belts (City-A through City-E)',
    'Within 4-8 Hours (Same Day Delivery)',
    'Local Tempo / Van / Chhota Hathi',
    true
  ),
  (
    'RURAL',
    'Rural',
    'South Gujarat highway, outstation, taluka, and industrial belts (Upper South, South, East, North)',
    'Within 24-48 Hours (Next Day Delivery)',
    'Heavy Vehicle / F.O.R Truck / Dedicated Transport Cargo',
    true
  )
ON CONFLICT (type_code) DO UPDATE SET
    type_name = EXCLUDED.type_name,
    description = EXCLUDED.description,
    delivery_sla = EXCLUDED.delivery_sla,
    default_vehicle_mode = EXCLUDED.default_vehicle_mode,
    active = EXCLUDED.active,
    updated_at = NOW();
