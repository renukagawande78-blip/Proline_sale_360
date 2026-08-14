-- ============================================================================
-- PROLINE OMS 360 - SUPABASE CLOUD DATABASE SCHEMA & SEED DATA
-- Run this script inside your Supabase Project SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

-- 1. SYSTEM USERS TABLE
CREATE TABLE IF NOT EXISTS public.system_users (
    id TEXT PRIMARY KEY,
    sno INT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_name TEXT NOT NULL,
    permission_group_id TEXT,
    permission_group_name TEXT,
    company_handle TEXT,
    password TEXT DEFAULT '1234',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANY BRANDS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    company_code VARCHAR(10) UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    segment VARCHAR(10) NOT NULL CHECK (segment IN ('FMCG', 'FMCD')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ZONES MASTER TABLE
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    zone_code TEXT UNIQUE NOT NULL,
    zone_name TEXT NOT NULL,
    region TEXT NOT NULL,
    major_areas JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AGENCIES / B2B PARTIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id TEXT PRIMARY KEY,
    agency_code TEXT UNIQUE NOT NULL,
    agency_name TEXT NOT NULL,
    area_id TEXT,
    area_name TEXT,
    city TEXT,
    gstin TEXT,
    contact_person TEXT,
    phone TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 0,
    outstanding_balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    company_id TEXT REFERENCES public.companies(id),
    pcs_per_box INT NOT NULL DEFAULT 24,
    unit_price NUMERIC(10,2) NOT NULL,
    mrp_price NUMERIC(10,2),
    hsn_code TEXT,
    segment VARCHAR(10) CHECK (segment IN ('FMCG', 'FMCD')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS TRANSACTION TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    company_id TEXT,
    company_name TEXT,
    agency_id TEXT,
    agency_name TEXT,
    agency_code TEXT,
    area_id TEXT,
    area_name TEXT,
    salesperson_id TEXT,
    salesperson_name TEXT,
    asm_id TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    total_box_qty INT DEFAULT 0,
    total_loose_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    remarks TEXT,
    delivery_type TEXT DEFAULT 'F.O.R',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER ITEMS DETAILS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT,
    product_code TEXT,
    pcs_per_box INT,
    box_qty INT DEFAULT 0,
    loose_pcs INT DEFAULT 0,
    free_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    dispatched_qty_pcs INT DEFAULT 0,
    pending_qty_pcs INT DEFAULT 0,
    unit_price NUMERIC(10,2),
    mrp_price NUMERIC(10,2),
    total_price NUMERIC(12,2),
    remark TEXT
);

-- 8. PARTY FINANCIAL LEDGER BALANCES TABLE
CREATE TABLE IF NOT EXISTS public.agency_financials (
    agency_id TEXT PRIMARY KEY REFERENCES public.agencies(id),
    agency_code TEXT NOT NULL,
    agency_name TEXT NOT NULL,
    city TEXT,
    area_name TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 500000,
    outstanding_balance NUMERIC(12,2) DEFAULT 0,
    available_credit NUMERIC(12,2) DEFAULT 500000,
    overdue_amount NUMERIC(12,2) DEFAULT 0,
    payment_terms_days INT DEFAULT 30,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Grant Public Access
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read system_users" ON public.system_users FOR SELECT USING (true);
CREATE POLICY "Allow public all system_users" ON public.system_users FOR ALL USING (true);

CREATE POLICY "Allow public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow public all companies" ON public.companies FOR ALL USING (true);

CREATE POLICY "Allow public read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Allow public all zones" ON public.zones FOR ALL USING (true);

CREATE POLICY "Allow public read agencies" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "Allow public all agencies" ON public.agencies FOR ALL USING (true);

CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public all products" ON public.products FOR ALL USING (true);

CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public all orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "Allow public read order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public all order_items" ON public.order_items FOR ALL USING (true);

CREATE POLICY "Allow public read agency_financials" ON public.agency_financials FOR SELECT USING (true);
CREATE POLICY "Allow public all agency_financials" ON public.agency_financials FOR ALL USING (true);


-- ============================================================================
-- SEED DATA INSERTS
-- ============================================================================

-- 1. SEED COMPANIES
INSERT INTO public.companies (id, company_code, company_name, segment) VALUES
('c01', 'PG', 'Pringod (Priyagold)', 'FMCG'),
('c02', 'RC', 'RCPL', 'FMCG'),
('c03', 'OR', 'Orion', 'FMCG'),
('c04', 'GD', 'Gandour', 'FMCG'),
('c05', 'HP', 'HPPL', 'FMCG'),
('c06', 'WP', 'Whirlpool', 'FMCD'),
('c07', 'DK', 'Daikin', 'FMCD'),
('c08', 'CR', 'Cruise', 'FMCD'),
('c09', 'MG', 'Mogu Mogu', 'FMCG'),
('c10', 'HL', 'Heli', 'FMCG'),
('c11', 'WI', 'Waiwai', 'FMCG'),
('c12', 'PR', 'PRAN', 'FMCG'),
('c13', 'AK', 'AKAI', 'FMCD')
ON CONFLICT (id) DO UPDATE SET 
  company_name = EXCLUDED.company_name,
  company_code = EXCLUDED.company_code,
  segment = EXCLUDED.segment;

-- 2. SEED SYSTEM USERS (EXACT VERIFIED REVISED MAPPING)
INSERT INTO public.system_users (sno, id, full_name, email, role_name, permission_group_id, permission_group_name, company_handle, password, active) VALUES
(1, 'u01', 'Chirag', 'chirag@proline.com', 'SUPER_ADMIN', 'pg_admin', 'Full Super Admin Authority', 'All', '1234', true),
(2, 'u02', 'Harshad', 'harshad@proline.com', 'SUPER_ADMIN', 'pg_admin', 'Full Super Admin Authority', 'All', '1234', true),
(3, 'u03', 'Jay', 'jay@proline.com', 'SALES_ADMIN', 'pg_sales_admin', 'Sales Admin Authority Group', 'Priyagold, RCPL, Orion, Gandour, HPPL', '1234', true),
(4, 'u04', 'Dixit', 'dixit@proline.com', 'SALES_ADMIN', 'pg_sales_admin', 'Sales Admin Authority Group', 'Heli, Waiwai, PRAN, Mogu mogu', '1234', true),
(5, 'u05', 'Sumit', 'sumit@proline.com', 'SALES_ADMIN', 'pg_sales_admin', 'Sales Admin Authority Group', 'Whirlpool, Daikin, Cruise, Akai', '1234', true),
(6, 'u06', 'Riddhi', 'riddhi@proline.com', 'BILLING', 'pg_billing', 'Billing & Accounts Group', 'Priyagold, RCPL, Orion, Gandour, HPPL', '1234', true),
(7, 'u07', 'Mansi', 'mansi.billing@proline.com', 'BILLING', 'pg_billing', 'Billing & Accounts Group', 'Heli, Waiwai, PRAN, Mogu mogu', '1234', true),
(8, 'u08', 'Sneha', 'sneha@proline.com', 'BILLING', 'pg_billing', 'Billing & Accounts Group', 'Whirlpool, Daikin, Cruise, Akai', '1234', true),
(9, 'u09', 'Dhruv', 'dhruv@proline.com', 'DISPATCH_MANAGER', 'pg_dispatch', 'Dispatch Operations Group', 'Heli, Waiwai, PRAN, Mogu mogu', '1234', true),
(10, 'u10', 'Dharmik', 'dharmik@proline.com', 'DISPATCH_MANAGER', 'pg_dispatch', 'Dispatch Operations Group', 'Priyagold, RCPL, Orion, Gandour, HPPL', '1234', true),
(11, 'u11', 'Jitendra', 'jitendra@proline.com', 'DISPATCH_MANAGER', 'pg_dispatch', 'Dispatch Operations Group', 'Whirlpool, Daikin, Cruise, Akai', '1234', true),
(12, 'u12', 'Brijesh', 'brijesh@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Whirlpool', '1234', true),
(13, 'u13', 'Kamal', 'kamal@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Cruise', '1234', true),
(14, 'u14', 'Ashish', 'ashish@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Priyagold', '1234', true),
(15, 'u15', 'Ankit', 'ankit@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Orion', '1234', true),
(16, 'u16', 'Tushar', 'tushar@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Waiwai', '1234', true),
(17, 'u17', 'Shakti', 'shakti@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'PRAN', '1234', true),
(18, 'u18', 'Sanjay', 'sanjay@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'HPPL', '1234', true),
(19, 'u19', 'Keyur (ASM)', 'keyur.asm@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Heli', '1234', true),
(20, 'u20', 'Jagrut', 'jagrut@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Daikin', '1234', true),
(21, 'u21', 'Dinesh (ASM)', 'dinesh.asm@proline.com', 'AREA_SALES_MANAGER', 'pg_asm', 'Area Sales Manager Group', 'Akai', '1234', true),
(22, 'u22', 'Keyur (Field Sales)', 'keyur.field@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Heli', '1234', true),
(23, 'u23', 'Shailendra', 'shailendra@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Orion', '1234', true),
(24, 'u24', 'Jayendra', 'jayendra@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Waiwai', '1234', true),
(25, 'u25', 'Nikhil', 'nikhil@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Priyagold', '1234', true),
(26, 'u26', 'Jay (Field Sales)', 'jay.field@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Gandour', '1234', true),
(27, 'u27', 'Sahil', 'sahil@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'HPPL', '1234', true),
(28, 'u28', 'Milan', 'milan@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'PRAN', '1234', true),
(29, 'u29', 'Rahul', 'rahul@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Mogu mogu', '1234', true),
(30, 'u30', 'Sagar', 'sagar@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'RCPL', '1234', true),
(31, 'u31', 'Taral', 'taral@proline.com', 'SALES_PERSON', 'pg_sales_person', 'Sales Person / Field Sales Group', 'Daikin, Whirlpool, Cruise, Akai', '1234', true)
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role_name = EXCLUDED.role_name,
  company_handle = EXCLUDED.company_handle,
  password = EXCLUDED.password,
  active = EXCLUDED.active;

-- 3. SEED ZONES
INSERT INTO public.zones (id, zone_code, zone_name, region, major_areas, description) VALUES
('zn_01', 'ZN-SUR-A', 'City-A', 'Surat City Zone', '["Mini Bazar", "Hira bag", "Sarthana", "Nana Varacha", "AK road", "Katargam", "Amroli", "Ved road", "Mota Varacha", "LH Road"]'::jsonb, 'Surat City Zone A - Varachha, Katargam, Amroli Corridor'),
('zn_02', 'ZN-SUR-B', 'City-B', 'Surat City Zone', '["Ring Road", "Salabatpura", "Udhana", "Pandesara", "Bhestan", "Sachin", "Dindoli", "Limbayat", "Bhatar", "Althan", "Citylight", "Vesu", "Piplod", "Adajan", "Rander"]'::jsonb, 'Surat City Zone B - Ring Road, Vesu, Udhna Corridor'),
('zn_03', 'ZN-SUR-R1', 'Rural-1', 'Surat Rural Zone', '["Kamrej", "Pasodara", "Valak", "Kholvad", "Kathor", "Valthan", "Niyol", "Kadodara", "Tantiithaiya", "Palsana"]'::jsonb, 'Surat Rural Zone 1 - Kamrej to Kadodara Corridor'),
('zn_04', 'ZN-SUR-R2', 'Rural-2', 'Surat Rural Zone', '["Kim", "Kosamba", "Kharach", "Velachha", "Zankhvav", "Mandvi", "Tardeshwar", "Areth", "Mota Miya Mangrol", "Bodhthan"]'::jsonb, 'Surat Rural Zone 2 - Kim to Mandvi Corridor'),
('zn_05', 'ZN-SUR-R3', 'Rural-3', 'Surat Rural Zone', '["B Bardoli", "Mota", "Khadupa", "Mahi", "Sarbon", "Valod", "Buhari", "Bajipura", "Vyara", "Mahuva", "Anaval"]'::jsonb, 'Surat Rural Zone 3 - Bardoli to Vyara Corridor')
ON CONFLICT (id) DO UPDATE SET 
  zone_name = EXCLUDED.zone_name,
  region = EXCLUDED.region;

-- 4. SEED AGENCIES
INSERT INTO public.agencies (id, agency_code, agency_name, area_id, area_name, city, gstin, contact_person, phone, credit_limit, outstanding_balance) VALUES
('ag_001', 'AG-SUR-001', 'Shree Ram Agency', 'ar_01', 'Nana Varacha', 'Surat', '24AAACS1234A1Z1', 'Ramesh Bhai Patel', '9825012345', 500000, 125000),
('ag_002', 'AG-SUR-002', 'Mahadev Traders', 'ar_02', 'Katargam', 'Surat', '24BBBCD5678B2Z2', 'Suresh Shah', '9898023456', 750000, 45000),
('ag_003', 'AG-SUR-003', 'Jay Ambe Enterprises', 'ar_03', 'Udhana', 'Surat', '24CCCDE9012C3Z3', 'Mahesh Parikh', '9727034567', 600000, 210000),
('ag_004', 'AG-SUR-004', 'Ganesh Sales Corporation', 'ar_04', 'Bardoli', 'Surat Rural', '24DDDEF3456D4Z4', 'Dinesh Desai', '9879045678', 400000, 85000),
('ag_005', 'AG-SUR-005', 'Krishna Marketing', 'ar_05', 'Kamrej', 'Surat Rural', '24EEEFG7890E5Z5', 'Kishore Varma', '9909056789', 500000, 0)
ON CONFLICT (id) DO UPDATE SET 
  agency_name = EXCLUDED.agency_name,
  credit_limit = EXCLUDED.credit_limit;

-- 5. SEED PRODUCTS
INSERT INTO public.products (id, product_code, product_name, company_id, pcs_per_box, unit_price, mrp_price, hsn_code, segment) VALUES
('p01', 'PRG-BISC-01', 'Butter Delite 100g', 'c01', 24, 25.00, 30.00, '19053100', 'FMCG'),
('p02', 'PRG-BISC-02', 'Marie Gold 200g', 'c02', 24, 30.00, 35.00, '19053100', 'FMCG'),
('p03', 'RC-SOAP-01', 'Pure Glow Soap 125g', 'c02', 36, 40.00, 48.00, '34011110', 'FMCG'),
('p04', 'OR-CHOCO-01', 'Choco Pie 6 Pack', 'c03', 12, 120.00, 140.00, '19059090', 'FMCG'),
('p05', 'GD-WAFER-01', 'Safari Wafer Bar 30g', 'c04', 48, 15.00, 20.00, '19053210', 'FMCG'),
('p06', 'WP-REF-01', 'Double Door Refrigerator 265L', 'c06', 1, 24500.00, 28900.00, '84182100', 'FMCD'),
('p07', 'DK-AC-01', 'Split AC 1.5 Ton 5 Star', 'c07', 1, 38500.00, 44500.00, '84151010', 'FMCD')
ON CONFLICT (id) DO UPDATE SET 
  product_name = EXCLUDED.product_name,
  unit_price = EXCLUDED.unit_price;
