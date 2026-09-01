-- ============================================================================
-- Proline OMS 360 - Seed Official 75 Areas across 9 Delivery Zones
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure table has necessary columns
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Surat';
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS zone_code TEXT DEFAULT 'City-A';
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS and Grant Full CRUD Permissions
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_crud_policy" ON public.areas;
CREATE POLICY "areas_crud_policy" ON public.areas
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.areas TO anon, authenticated, service_role;

-- Upsert All 75 Official Localities across 9 Zones
INSERT INTO public.areas (area_code, area_name, city, zone_code, region, description, active) VALUES
-- --- City-A (City) ---
('AR-CTA-001', 'Mini Bazar', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-002', 'Hirabaug', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-003', 'Sarthana', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-004', 'Nana Varachha', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-005', 'AK Road', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-006', 'Katargam', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-007', 'Amroli', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-008', 'Ved Road', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-009', 'Mota Varachha', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),
('AR-CTA-010', 'LH Road', 'Surat', 'City-A', 'City', 'City-A Zone • Commercial Market Corridor', true),

-- --- City-B (City) ---
('AR-CTB-011', 'Parvat Patiya', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-012', 'Puna', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-013', 'Yogichowk', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-014', 'Vraj Chowk', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-015', 'Saroli', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-016', 'Sahara Darwaja', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-017', 'Textile Market', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),
('AR-CTB-018', 'Bombay Market', 'Surat', 'City-B', 'City', 'City-B Zone • Textile Market Belt', true),

-- --- City-C (City) ---
('AR-CTC-019', 'Ring Road', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-020', 'Majura Gate', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-021', 'Nanpura', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-022', 'Bhagal', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-023', 'Old City', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-024', 'Adajan', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-025', 'Rander', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-026', 'Hazira', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-027', 'Pal', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),
('AR-CTC-028', 'Jangirpura', 'Surat', 'City-C', 'City', 'City-C Zone • Central Commercial Sector', true),

-- --- City-D (City) ---
('AR-CTD-029', 'Udhana', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),
('AR-CTD-030', 'Dindoli', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),
('AR-CTD-031', 'Godadara', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),
('AR-CTD-032', 'Sachin', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),
('AR-CTD-033', 'Pandesara', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),
('AR-CTD-034', 'Unn', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),
('AR-CTD-035', 'Bamroli', 'Surat', 'City-D', 'City', 'City-D Zone • Industrial & Manufacturing Sector', true),

-- --- City-E (City) ---
('AR-CTE-036', 'New City', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-037', 'Ghoddod Road', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-038', 'Citylight', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-039', 'Parle Point', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-040', 'Vesu', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-041', 'Althan', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-042', 'Sarsana', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),
('AR-CTE-043', 'VIP Road', 'Surat', 'City-E', 'City', 'City-E Zone • Modern Trade & Premium Sector', true),

-- --- Upper South (Rural) ---
('AR-UPS-044', 'Vapi', 'Vapi', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-045', 'Umbergaon', 'Umbergaon', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-046', 'Daman', 'Daman', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-047', 'Silvassa', 'Silvassa', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-048', 'Valsad', 'Valsad', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-049', 'Pardi', 'Pardi', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-050', 'Sanjan', 'Sanjan', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-051', 'Bhilad', 'Bhilad', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),
('AR-UPS-052', 'Dharampur', 'Dharampur', 'Upper South', 'Rural', 'Upper South Zone • Industrial Hub', true),

-- --- South (Rural) ---
('AR-SOU-053', 'Kadodara', 'Kadodara', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),
('AR-SOU-054', 'Navsari', 'Navsari', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),
('AR-SOU-055', 'Bilimora', 'Bilimora', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),
('AR-SOU-056', 'Chikhli', 'Chikhli', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),
('AR-SOU-057', 'Vasda', 'Vasda', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),
('AR-SOU-058', 'Waghai', 'Waghai', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),
('AR-SOU-059', 'Palsana', 'Palsana', 'South', 'Rural', 'South Zone • Highway Distribution Corridor', true),

-- --- East (Rural) ---
('AR-EAS-060', 'Jolwa', 'Jolwa', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-061', 'Bardoli', 'Bardoli', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-062', 'Mandavi', 'Mandavi', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-063', 'Karcheliya', 'Karcheliya', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-064', 'Madhi', 'Madhi', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-065', 'Vyara', 'Vyara', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-066', 'Songadh', 'Songadh', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),
('AR-EAS-067', 'Navapur', 'Navapur', 'East', 'Rural', 'East Zone • Agriculture & Industrial Corridor', true),

-- --- North (Rural) ---
('AR-NOR-068', 'Bharuch', 'Bharuch', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-069', 'Ankleshwar', 'Ankleshwar', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-070', 'Kim', 'Kim', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-071', 'Kosamba', 'Kosamba', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-072', 'Pipodra', 'Pipodra', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-073', 'Kamrej', 'Kamrej', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-074', 'Oldpad', 'Oldpad', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true),
('AR-NOR-075', 'Sayan', 'Sayan', 'North', 'Rural', 'North Zone • Industrial & Chemical Hub', true)
ON CONFLICT (area_code) DO UPDATE SET
    area_name = EXCLUDED.area_name,
    city = EXCLUDED.city,
    zone_code = EXCLUDED.zone_code,
    region = EXCLUDED.region,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = NOW();
