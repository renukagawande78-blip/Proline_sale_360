-- ============================================================================
-- Proline OMS 360 - Schema Fix Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/psaguppgoigpxumzgvjx/sql/new
-- ============================================================================

-- 1. FIX AGENCIES TABLE — Drop bad FKs, add missing columns
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS "agencies_Area_fkey";
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_area_id_fkey;
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_company_id_fkey;

ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS area_name TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS zone_name TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS zone_region TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS account_group TEXT DEFAULT 'FMCG';
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS assigned_salesperson TEXT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS sno INT;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FIX USERS TABLE — Add role & authority columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT 'SALES_PERSON';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_handle TEXT DEFAULT 'All';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '1234';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permission_group_id TEXT DEFAULT 'pg_sales_person';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permission_group_name TEXT DEFAULT 'Sales Person Group';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sno INT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_handle TEXT DEFAULT 'All';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_scope TEXT DEFAULT 'All';

-- 3. FIX PRODUCTS TABLE — Add missing columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS account_group TEXT DEFAULT 'FMCG Goods';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'FMCG';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pcs_per_box INT DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp_price NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_box_qty INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_loose_pcs INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sno INT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. FIX COMPANIES TABLE — Add missing columns
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'FMCG';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#38bdf8';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. DISABLE RLS on all core tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 6. Grant public access to anon + authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agencies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;

-- 7. Schema check RPC (callable from anon key)
CREATE OR REPLACE FUNCTION public.fn_schema_check()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'users_columns', (SELECT array_agg(column_name) FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'),
    'agencies_columns', (SELECT array_agg(column_name) FROM information_schema.columns WHERE table_name = 'agencies' AND table_schema = 'public'),
    'products_columns', (SELECT array_agg(column_name) FROM information_schema.columns WHERE table_name = 'products' AND table_schema = 'public')
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.fn_schema_check() TO anon, authenticated;
