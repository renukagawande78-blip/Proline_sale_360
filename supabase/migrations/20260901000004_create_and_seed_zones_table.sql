-- ============================================================================
-- Proline OMS 360 - Official Zones & Areas Master Schema & Seed Migration
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create public.zones table
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    major_areas JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Configure RLS and Full Public/Authenticated Permissions
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on zones" ON public.zones;
CREATE POLICY "Allow full access on zones" ON public.zones
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.zones TO anon, authenticated, service_role;

-- 3. Seed the 9 Official Zones (Surat City & South Gujarat Rural)
INSERT INTO public.zones (zone_code, zone_name, region, major_areas, description)
VALUES
  (
    'ZN-CTA',
    'City-A',
    'City',
    '["Mini Bazar", "Hirabaug", "Sarthana", "Nana Varachha", "AK Road", "Katargam", "Amroli", "Ved Road", "Mota Varachha", "LH Road"]'::jsonb,
    'Surat City North-East Diamond & Varachha Corridor'
  ),
  (
    'ZN-CTB',
    'City-B',
    'City',
    '["Parvat Patiya", "Puna", "Yogichowk", "Vraj Chowk", "Saroli", "Sahara Darwaja", "Textile Market", "Bombay Market"]'::jsonb,
    'Surat City East Textile Market & Puna Belt'
  ),
  (
    'ZN-CTC',
    'City-C',
    'City',
    '["Ring Road", "Majura Gate", "Nanpura", "Bhagal", "Old City", "Adajan", "Rander", "Hazira", "Pal", "Jangirpura"]'::jsonb,
    'Surat City Central & West Old City / Adajan Belt'
  ),
  (
    'ZN-CTD',
    'City-D',
    'City',
    '["Udhana", "Dindoli", "Godadara", "Sachin", "Pandesara", "Unn", "Bamroli"]'::jsonb,
    'Surat City South Industrial & Udhana / Sachin Belt'
  ),
  (
    'ZN-CTE',
    'City-E',
    'City',
    '["New City", "Ghoddod Road", "Citylight", "Parle Point", "Vesu", "Althan", "Sarsana", "VIP Road"]'::jsonb,
    'Surat City South-West Modern Retail & Vesu / VIP Road'
  ),
  (
    'ZN-UPS',
    'Upper South',
    'Rural',
    '["Vapi", "Umbergaon", "Daman", "Silvassa", "Valsad", "Pardi", "Sanjan", "Bhilad", "Dharampur"]'::jsonb,
    'South Gujarat Industrial Belt: Vapi, Valsad, Daman, Silvassa'
  ),
  (
    'ZN-SOU',
    'South',
    'Rural',
    '["Kadodara", "Navsari", "Bilimora", "Chikhli", "Vasda", "Waghai", "Palsana"]'::jsonb,
    'South Highway & Navsari, Bilimora, Chikhli Corridor'
  ),
  (
    'ZN-EAS',
    'East',
    'Rural',
    '["Jolwa", "Bardoli", "Mandavi", "Karcheliya", "Madhi", "Vyara", "Songadh", "Navapur"]'::jsonb,
    'East Agricultural & Bardoli, Vyara, Mandavi Belt'
  ),
  (
    'ZN-NOR',
    'North',
    'Rural',
    '["Bharuch", "Ankleshwar", "Kim", "Kosamba", "Pipodra", "Kamrej", "Oldpad", "Sayan"]'::jsonb,
    'North Chemical & Industrial: Bharuch, Ankleshwar, Kamrej'
  ),
  (
    'ZN-OTH',
    'Other Z',
    'Other',
    '["Other / Pan-India"]'::jsonb,
    'Out-of-state consignments, Pan-India transport, SEZ, or non-standard custom delivery territories'
  )
ON CONFLICT (zone_code) DO UPDATE SET
    zone_name = EXCLUDED.zone_name,
    region = EXCLUDED.region,
    major_areas = EXCLUDED.major_areas,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Ensure areas table RLS policy allows inserts and updates
ALTER TABLE IF EXISTS public.areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "areas_crud_policy" ON public.areas;
CREATE POLICY "areas_crud_policy" ON public.areas
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.areas TO anon, authenticated, service_role;
