-- Supabase Migration: Full RLS Bypass & Bulk RPC Function Setup

-- 1. Disable RLS on core tables to allow direct client writes
ALTER TABLE IF EXISTS public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- 2. Grant public INSERT / UPDATE policies as fallback
DROP POLICY IF EXISTS policy_agencies_insert_public ON public.agencies;
CREATE POLICY policy_agencies_insert_public ON public.agencies FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS policy_agencies_update_public ON public.agencies;
CREATE POLICY policy_agencies_update_public ON public.agencies FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 3. Create SECURITY DEFINER RPC function for bulletproof bulk agencies import
CREATE OR REPLACE FUNCTION public.fn_import_bulk_agencies(p_agencies JSONB)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_count INT := 0;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_agencies)
    LOOP
        INSERT INTO public.agencies (
            id,
            agency_code,
            agency_name,
            city,
            area_name,
            gstin,
            account_group,
            contact_person,
            phone,
            mobile,
            email,
            credit_limit,
            zone_name,
            zone_region,
            active
        ) VALUES (
            COALESCE(NULLIF(v_item->>'id', '')::UUID, gen_random_uuid()),
            COALESCE(v_item->>'agency_code', 'AG-GEN'),
            COALESCE(v_item->>'agency_name', 'Unnamed Agency'),
            COALESCE(v_item->>'city', 'Surat'),
            COALESCE(v_item->>'area_name', 'Surat'),
            NULLIF(v_item->>'gstin', ''),
            COALESCE(v_item->>'account_group', 'FMCG'),
            NULLIF(v_item->>'contact_person', ''),
            NULLIF(v_item->>'mobile', ''),
            NULLIF(v_item->>'mobile', ''),
            NULLIF(v_item->>'email', ''),
            COALESCE((v_item->>'credit_limit')::NUMERIC, 0),
            COALESCE(v_item->>'zone_name', 'Surat City Zone'),
            COALESCE(v_item->>'zone_region', 'Gujarat'),
            COALESCE((v_item->>'active')::BOOLEAN, true)
        )
        ON CONFLICT (id) DO UPDATE SET
            agency_name = EXCLUDED.agency_name,
            city = EXCLUDED.city,
            area_name = EXCLUDED.area_name,
            gstin = EXCLUDED.gstin,
            credit_limit = EXCLUDED.credit_limit,
            updated_at = NOW();

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'count', v_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_import_bulk_agencies(JSONB) TO anon, authenticated, service_role, postgres;
