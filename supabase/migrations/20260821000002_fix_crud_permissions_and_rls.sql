-- ============================================================================
-- Proline OMS 360 - Complete CRUD Permissions, Sequences, and RLS Fix
-- Target Tables: companies, users, agencies, products, segments, orders, order_items
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Step 1: Ensure Tables & Columns Exist with Safe Types
-- ============================================================================

-- 1.1 SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_code VARCHAR(50) UNIQUE NOT NULL,
    segment_name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.segments ALTER COLUMN segment_code TYPE VARCHAR(50);
ALTER TABLE IF EXISTS public.segments ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.segments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.segments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.2 COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    handle TEXT,
    segment TEXT DEFAULT 'FMCG',
    brand_color TEXT DEFAULT '#38bdf8',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'FMCG';
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#38bdf8';
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.3 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role_id UUID,
    role_name TEXT DEFAULT 'SALES_PERSON',
    company_handle TEXT DEFAULT 'All',
    password TEXT DEFAULT '1234',
    permission_group_id TEXT DEFAULT 'pg_sales_person',
    permission_group_name TEXT DEFAULT 'Sales Person Group',
    sno INT,
    brand_handle TEXT DEFAULT 'All',
    brand_scope TEXT DEFAULT 'All',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT 'SALES_PERSON';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS company_handle TEXT DEFAULT 'All';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '1234';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS permission_group_id TEXT DEFAULT 'pg_sales_person';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS permission_group_name TEXT DEFAULT 'Sales Person Group';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS sno INT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS brand_handle TEXT DEFAULT 'All';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS brand_scope TEXT DEFAULT 'All';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.4 AGENCIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_code VARCHAR(50) UNIQUE NOT NULL,
    agency_name VARCHAR(255) NOT NULL,
    company_id UUID,
    city TEXT,
    area_name TEXT,
    contact_person VARCHAR(100),
    mobile VARCHAR(50),
    phone TEXT,
    email VARCHAR(255),
    gst_number VARCHAR(50),
    gstin TEXT,
    account_group TEXT DEFAULT 'FMCG',
    credit_limit NUMERIC(15, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(15, 2) DEFAULT 0.00,
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
ALTER TABLE IF EXISTS public.agencies DROP CONSTRAINT IF EXISTS "agencies_Area_fkey";
ALTER TABLE IF EXISTS public.agencies DROP CONSTRAINT IF EXISTS agencies_area_id_fkey;
ALTER TABLE IF EXISTS public.agencies DROP CONSTRAINT IF EXISTS agencies_company_id_fkey;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS area_name TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS account_group TEXT DEFAULT 'FMCG';
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS zone_name TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS zone_region TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS assigned_salesperson TEXT;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.agencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.5 PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category TEXT,
    account_group TEXT DEFAULT 'FMCG Goods',
    segment TEXT DEFAULT 'FMCG',
    pcs_per_box INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    mrp_price NUMERIC(15, 2) DEFAULT 0.00,
    stock_box_qty INT DEFAULT 0,
    stock_loose_pcs INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.products DROP CONSTRAINT IF EXISTS products_company_id_fkey;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS product_code TEXT;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS account_group TEXT DEFAULT 'FMCG Goods';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'FMCG';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS pcs_per_box INT DEFAULT 1;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS mrp_price NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS stock_box_qty INT DEFAULT 0;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS stock_loose_pcs INT DEFAULT 0;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.6 ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID,
    company_name TEXT,
    agency_id UUID,
    agency_name TEXT,
    agency_code TEXT,
    area_id UUID,
    area_name TEXT,
    salesperson_id UUID,
    salesperson_name TEXT,
    asm_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    total_box_qty INT DEFAULT 0,
    total_loose_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    remarks TEXT,
    delivery_type TEXT DEFAULT 'F.O.R',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_company_id_fkey;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_agency_id_fkey;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_area_id_fkey;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_salesperson_id_fkey;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS agency_name TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS agency_code TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS area_name TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS salesperson_name TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'F.O.R';
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.7 ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID,
    product_id UUID,
    product_name TEXT,
    product_code TEXT,
    pcs_per_box INT NOT NULL DEFAULT 1,
    box_qty INT NOT NULL DEFAULT 0,
    loose_pcs INT NOT NULL DEFAULT 0,
    free_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    mrp_price NUMERIC(15, 2) DEFAULT 0.00,
    total_price NUMERIC(15, 2) DEFAULT 0.00,
    dispatched_qty_pcs INT DEFAULT 0,
    pending_qty_pcs INT DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
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

-- ============================================================================
-- Step 2: Configure Database Role Permissions (PostgreSQL GRANTs)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agencies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;

-- Ensure future created tables also inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

-- ============================================================================
-- Step 3: Handle Sequence and Auto-Generated Key Permissions
-- ============================================================================
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO anon, authenticated;

-- ============================================================================
-- Step 4: Enable Row Level Security (RLS) on all 7 Target Tables
-- ============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 5: Safely Drop Existing / Duplicate Policies Before Creating New Ones
-- ============================================================================
-- COMPANIES
DROP POLICY IF EXISTS "companies_crud_policy" ON public.companies;
DROP POLICY IF EXISTS "allow_all_companies_select" ON public.companies;
DROP POLICY IF EXISTS "allow_all_companies_insert" ON public.companies;
DROP POLICY IF EXISTS "allow_all_companies_update" ON public.companies;
DROP POLICY IF EXISTS "allow_all_companies_delete" ON public.companies;
DROP POLICY IF EXISTS "policy_companies_select" ON public.companies;
DROP POLICY IF EXISTS "policy_companies_all" ON public.companies;
DROP POLICY IF EXISTS "Allow public read companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public all companies" ON public.companies;

-- USERS
DROP POLICY IF EXISTS "users_crud_policy" ON public.users;
DROP POLICY IF EXISTS "allow_all_users_select" ON public.users;
DROP POLICY IF EXISTS "allow_all_users_insert" ON public.users;
DROP POLICY IF EXISTS "allow_all_users_update" ON public.users;
DROP POLICY IF EXISTS "allow_all_users_delete" ON public.users;
DROP POLICY IF EXISTS "policy_users_select" ON public.users;
DROP POLICY IF EXISTS "policy_users_all" ON public.users;
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public all users" ON public.users;

-- AGENCIES
DROP POLICY IF EXISTS "agencies_crud_policy" ON public.agencies;
DROP POLICY IF EXISTS "allow_all_agencies_select" ON public.agencies;
DROP POLICY IF EXISTS "allow_all_agencies_insert" ON public.agencies;
DROP POLICY IF EXISTS "allow_all_agencies_update" ON public.agencies;
DROP POLICY IF EXISTS "allow_all_agencies_delete" ON public.agencies;
DROP POLICY IF EXISTS "policy_agencies_select" ON public.agencies;
DROP POLICY IF EXISTS "policy_agencies_all" ON public.agencies;
DROP POLICY IF EXISTS "Allow public read agencies" ON public.agencies;
DROP POLICY IF EXISTS "Allow public all agencies" ON public.agencies;

-- PRODUCTS
DROP POLICY IF EXISTS "products_crud_policy" ON public.products;
DROP POLICY IF EXISTS "allow_all_products_select" ON public.products;
DROP POLICY IF EXISTS "allow_all_products_insert" ON public.products;
DROP POLICY IF EXISTS "allow_all_products_update" ON public.products;
DROP POLICY IF EXISTS "allow_all_products_delete" ON public.products;
DROP POLICY IF EXISTS "policy_products_select" ON public.products;
DROP POLICY IF EXISTS "policy_products_all" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public all products" ON public.products;

-- SEGMENTS
DROP POLICY IF EXISTS "segments_crud_policy" ON public.segments;
DROP POLICY IF EXISTS "allow_all_segments_select" ON public.segments;
DROP POLICY IF EXISTS "allow_all_segments_insert" ON public.segments;
DROP POLICY IF EXISTS "allow_all_segments_update" ON public.segments;
DROP POLICY IF EXISTS "allow_all_segments_delete" ON public.segments;
DROP POLICY IF EXISTS "policy_segments_all" ON public.segments;
DROP POLICY IF EXISTS "Allow public read segments" ON public.segments;
DROP POLICY IF EXISTS "Allow public all segments" ON public.segments;

-- ORDERS
DROP POLICY IF EXISTS "orders_crud_policy" ON public.orders;
DROP POLICY IF EXISTS "allow_all_orders_select" ON public.orders;
DROP POLICY IF EXISTS "allow_all_orders_insert" ON public.orders;
DROP POLICY IF EXISTS "allow_all_orders_update" ON public.orders;
DROP POLICY IF EXISTS "allow_all_orders_delete" ON public.orders;
DROP POLICY IF EXISTS "policy_orders_select" ON public.orders;
DROP POLICY IF EXISTS "policy_orders_insert" ON public.orders;
DROP POLICY IF EXISTS "policy_orders_update" ON public.orders;
DROP POLICY IF EXISTS "policy_orders_all" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public all orders" ON public.orders;

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_crud_policy" ON public.order_items;
DROP POLICY IF EXISTS "allow_all_order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "allow_all_order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "allow_all_order_items_update" ON public.order_items;
DROP POLICY IF EXISTS "allow_all_order_items_delete" ON public.order_items;
DROP POLICY IF EXISTS "policy_order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "policy_order_items_all" ON public.order_items;
DROP POLICY IF EXISTS "Allow public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public all order_items" ON public.order_items;

-- ============================================================================
-- Step 6: Create Clean, Comprehensive RLS Policies for Authenticated & Anon Roles
-- (Supports full SELECT, INSERT, UPDATE, DELETE with USING (true) WITH CHECK (true))
-- ============================================================================

-- 1. COMPANIES POLICY
CREATE POLICY "companies_crud_policy" ON public.companies
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 2. USERS POLICY
CREATE POLICY "users_crud_policy" ON public.users
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. AGENCIES POLICY
CREATE POLICY "agencies_crud_policy" ON public.agencies
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. PRODUCTS POLICY
CREATE POLICY "products_crud_policy" ON public.products
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. SEGMENTS POLICY
CREATE POLICY "segments_crud_policy" ON public.segments
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. ORDERS POLICY
CREATE POLICY "orders_crud_policy" ON public.orders
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 7. ORDER ITEMS POLICY
CREATE POLICY "order_items_crud_policy" ON public.order_items
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Step 7: Verification Schema Check Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_schema_check()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tables_configured', (
      SELECT jsonb_agg(table_name)
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('companies', 'users', 'agencies', 'products', 'segments', 'orders', 'order_items')
    ),
    'rls_enabled_tables', (
      SELECT jsonb_agg(relname)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relrowsecurity = true
    ),
    'policies_count', (
      SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_schema_check() TO anon, authenticated;

-- ============================================================================
-- Step 8: Ensure Super Admin Users (Chirag & Harshad) are Mapped to All Companies
-- ============================================================================
INSERT INTO public.users (id, full_name, email, role_name, company_handle, password, active)
VALUES 
  ('d36da19d-5c2f-48d6-9ebf-d4939b579c1f', 'Chirag', 'chirag@proline.com', 'SUPER_ADMIN', 'All', '1234', true),
  ('6aa82961-eb67-4efa-af56-31b60d73693e', 'Harshad', 'harshad@proline.com', 'SUPER_ADMIN', 'All', '1234', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_name = 'SUPER_ADMIN',
  company_handle = 'All',
  active = true;
