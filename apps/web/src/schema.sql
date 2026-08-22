-- ============================================================================
-- PROLINE OMS 360 - SUPABASE CLOUD DATABASE SCHEMA & SEED DATA
-- Run this script inside your Supabase Project SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYSTEM USERS & USERS TABLE
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

CREATE TABLE IF NOT EXISTS public.users (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DROP REDUNDANT SEGMENTS TABLE (Replaced by System IndustrySegment Enum: 'FMCG' | 'FMCD')
DROP TABLE IF EXISTS public.segments CASCADE;

-- 3. COMPANY BRANDS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    handle TEXT,
    segment TEXT DEFAULT 'FMCG',
    brand_color TEXT DEFAULT '#38bdf8',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ZONES MASTER TABLE
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    zone_code TEXT UNIQUE NOT NULL,
    zone_name TEXT NOT NULL,
    region TEXT NOT NULL,
    major_areas JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AREAS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.areas (
    id TEXT PRIMARY KEY,
    area_code TEXT UNIQUE NOT NULL,
    area_name TEXT NOT NULL,
    city TEXT,
    zone_code TEXT,
    region TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AGENCIES / B2B PARTIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id TEXT PRIMARY KEY,
    agency_code TEXT UNIQUE NOT NULL,
    agency_name TEXT NOT NULL,
    company_id TEXT,
    area_id TEXT,
    area_name TEXT,
    city TEXT,
    gstin TEXT,
    gst_number TEXT,
    account_group TEXT DEFAULT 'FMCG',
    contact_person TEXT,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    credit_limit NUMERIC(15,2) DEFAULT 0,
    outstanding_balance NUMERIC(15,2) DEFAULT 0,
    zone_name TEXT,
    zone_region TEXT,
    assigned_salesperson TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    branch_name TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.agencies DROP CONSTRAINT IF EXISTS agencies_agency_name_key;
ALTER TABLE IF EXISTS public.agencies DROP CONSTRAINT IF EXISTS "agencies_agency_name_key";

-- 7. PRODUCTS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    company_id TEXT,
    segment TEXT DEFAULT 'FMCG',
    category TEXT,
    pcs_per_box INT NOT NULL DEFAULT 1,
    mrp_price NUMERIC(15,2) DEFAULT 0.00,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    stock_box_qty INT DEFAULT 0,
    total_stock_pcs INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS account_group;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS previous_mrp;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS mrp_updated_at;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS mrp_updated_by;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS mrp_history;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS stock_loose_pcs;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS reserved_stock_pcs;
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS hsn_code;

-- 8. ORDERS TRANSACTION TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    order_date TIMESTAMPTZ DEFAULT NOW(),
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
    status TEXT NOT NULL DEFAULT 'DRAFT',
    total_box_qty INT DEFAULT 0,
    total_loose_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    remarks TEXT,
    delivery_type TEXT DEFAULT 'F.O.R',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER ITEMS DETAILS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    product_id TEXT,
    product_name TEXT,
    product_code TEXT,
    pcs_per_box INT DEFAULT 1,
    box_qty INT DEFAULT 0,
    loose_pcs INT DEFAULT 0,
    free_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    unit_price NUMERIC(15,2) DEFAULT 0.00,
    mrp_price NUMERIC(15,2) DEFAULT 0.00,
    total_price NUMERIC(15,2) DEFAULT 0.00,
    dispatched_qty_pcs INT DEFAULT 0,
    pending_qty_pcs INT DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PARTY FINANCIAL LEDGER BALANCES TABLE
CREATE TABLE IF NOT EXISTS public.agency_financials (
    agency_id TEXT PRIMARY KEY,
    agency_code TEXT,
    agency_name TEXT,
    city TEXT,
    area_name TEXT,
    credit_limit NUMERIC(15,2) DEFAULT 500000,
    outstanding_balance NUMERIC(15,2) DEFAULT 0,
    available_credit NUMERIC(15,2) DEFAULT 500000,
    overdue_amount NUMERIC(15,2) DEFAULT 0,
    payment_terms_days INT DEFAULT 30,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Role Grants and Sequences Permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO anon, authenticated;

-- ============================================================================
-- Enable Row Level Security (RLS) & Configure CRUD Policies
-- ============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_financials ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS product_code TEXT;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS mrp_price NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure total_qty_pcs is a standard editable column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'order_items' 
          AND column_name = 'total_qty_pcs' 
          AND is_generated = 'ALWAYS'
    ) THEN
        ALTER TABLE public.order_items DROP COLUMN total_qty_pcs;
        ALTER TABLE public.order_items ADD COLUMN total_qty_pcs INT DEFAULT 0;
    END IF;
END $$;

-- Drop legacy policies
DROP POLICY IF EXISTS "companies_crud_policy" ON public.companies;
DROP POLICY IF EXISTS "users_crud_policy" ON public.users;
DROP POLICY IF EXISTS "system_users_crud_policy" ON public.system_users;
DROP POLICY IF EXISTS "agencies_crud_policy" ON public.agencies;
DROP POLICY IF EXISTS "products_crud_policy" ON public.products;
DROP POLICY IF EXISTS "orders_crud_policy" ON public.orders;
DROP POLICY IF EXISTS "order_items_crud_policy" ON public.order_items;
DROP POLICY IF EXISTS "zones_crud_policy" ON public.zones;
DROP POLICY IF EXISTS "areas_crud_policy" ON public.areas;
DROP POLICY IF EXISTS "agency_financials_crud_policy" ON public.agency_financials;

-- Create ALL operations policies
CREATE POLICY "companies_crud_policy" ON public.companies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "users_crud_policy" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "system_users_crud_policy" ON public.system_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agencies_crud_policy" ON public.agencies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_crud_policy" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "orders_crud_policy" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_items_crud_policy" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "zones_crud_policy" ON public.zones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "areas_crud_policy" ON public.areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agency_financials_crud_policy" ON public.agency_financials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Ensure Super Admin Users (Chirag & Harshad) are Mapped to All Companies
INSERT INTO public.users (id, full_name, email, role_name, company_handle, password, active)
VALUES 
  ('d36da19d-5c2f-48d6-9ebf-d4939b579c1f', 'Chirag', 'chirag@proline.com', 'SUPER_ADMIN', 'All', '1234', true),
  ('6aa82961-eb67-4efa-af56-31b60d73693e', 'Harshad', 'harshad@proline.com', 'SUPER_ADMIN', 'All', '1234', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_name = 'SUPER_ADMIN',
  company_handle = 'All',
  active = true;
