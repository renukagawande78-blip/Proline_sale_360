-- ============================================================================
-- Proline OMS 360 - Areas Master Schema & RLS Policy
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure public.areas table exists with all modern columns
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_code VARCHAR(50) UNIQUE NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    city TEXT DEFAULT 'Surat',
    zone_code TEXT DEFAULT 'ZN-SUR-A',
    region VARCHAR(100) DEFAULT 'Surat City Zone',
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns if table already existed previously with only base columns
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Surat';
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS zone_code TEXT DEFAULT 'ZN-SUR-A';
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Enable RLS and Grant Full CRUD Permissions to anon and authenticated roles
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_crud_policy" ON public.areas;
DROP POLICY IF EXISTS "Allow public all areas" ON public.areas;
DROP POLICY IF EXISTS "Allow public read areas" ON public.areas;

CREATE POLICY "areas_crud_policy" ON public.areas
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.areas TO anon, authenticated, service_role;

-- 4. Seed Default Surat & Gujarat Locality Areas into public.areas
INSERT INTO public.areas (area_code, area_name, city, zone_code, region, description, active) VALUES
('AR-SUR-001', 'Varachha Main Road', 'Surat', 'ZN-SUR-A', 'Surat City Zone', 'Diamond & Commercial Wholesale Market Corridor', true),
('AR-SUR-002', 'Mini Bazar & L.H. Road', 'Surat', 'ZN-SUR-A', 'Surat City Zone', 'High-density Diamond & Retail Commerce Hub', true),
('AR-SUR-003', 'Mota Varachha & VIP Circle', 'Surat', 'ZN-SUR-A', 'Surat City Zone', 'Rapid Growth Commercial & Residential Belt', true),
('AR-SUR-004', 'Sarthana Jakatnaka & Kamrej Road', 'Surat', 'ZN-SUR-A', 'Surat City Zone', 'Key Highway Transit & Logistics Point', true),
('AR-SUR-005', 'Katargam GIDC', 'Surat', 'ZN-SUR-B', 'Surat City Zone', 'Commercial Diamond & FMCG Retail Network', true),
('AR-SUR-006', 'Athwa Lines & Ghoddod Road', 'Surat', 'ZN-SUR-C', 'Surat City Zone', 'Premium FMCG & FMCD Retail Showroom Corridor', true),
('AR-SUR-007', 'Piplod & VIP Road', 'Surat', 'ZN-SUR-C', 'Surat City Zone', 'Modern Retail Malls & FMCD Electronics Hub', true),
('AR-SUR-008', 'Vesu University Road', 'Surat', 'ZN-SUR-C', 'Surat City Zone', 'New Residential & Modern Trade Retail Market', true),
('AR-NAV-001', 'Navsari Central Market', 'Navsari', 'ZN-NAV-01', 'South Gujarat Rural Zone', 'District Commercial Center & Agro Hub', true),
('AR-VAP-001', 'Vapi GIDC Industrial Belt', 'Vapi', 'ZN-VAP-01', 'South Gujarat Rural Zone', 'Major Chemical & Manufacturing Hub', true)
ON CONFLICT (area_code) DO UPDATE SET
    area_name = EXCLUDED.area_name,
    city = EXCLUDED.city,
    zone_code = EXCLUDED.zone_code,
    region = EXCLUDED.region,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = NOW();
