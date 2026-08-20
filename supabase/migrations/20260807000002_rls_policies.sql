-- Proline OMS 360 Migration 02: RLS Policies & Row Level Security Setup

-- Enable RLS on all operational tables safely
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agency_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper SQL function to get current user role name
CREATE OR REPLACE FUNCTION public.fn_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
    v_role_name VARCHAR;
BEGIN
    SELECT r.role_name INTO v_role_name
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();

    RETURN COALESCE(v_role_name, 'NONE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check company access
CREATE OR REPLACE FUNCTION public.fn_has_company_access(p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super Admin has access to all companies
    IF public.fn_current_user_role() = 'SUPER_ADMIN' THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = p_company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- RLS POLICIES FOR USERS & MASTERS
-- =========================================================

-- USERS: Everyone can read users in their system/team
DROP POLICY IF EXISTS policy_users_select ON public.users;
CREATE POLICY policy_users_select ON public.users
    FOR SELECT USING (true);

-- COMPANIES: Selectable based on company access
DROP POLICY IF EXISTS policy_companies_select ON public.companies;
CREATE POLICY policy_companies_select ON public.companies
    FOR SELECT USING (public.fn_has_company_access(id));

-- PRODUCTS: Selectable based on company access
DROP POLICY IF EXISTS policy_products_select ON public.products;
CREATE POLICY policy_products_select ON public.products
    FOR SELECT USING (public.fn_has_company_access(company_id));

-- AGENCIES: Selectable based on company & salesperson/ASM mappings
DROP POLICY IF EXISTS policy_agencies_select ON public.agencies;
CREATE POLICY policy_agencies_select ON public.agencies
    FOR SELECT USING (
        public.fn_current_user_role() IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACCOUNTS', 'BILLING', 'DISPATCH_MANAGER')
        OR (
            public.fn_current_user_role() = 'AREA_SALES_MANAGER' AND EXISTS (
                SELECT 1 FROM public.salesperson_agency_mappings sam
                JOIN public.manager_mappings mm ON sam.salesperson_id = mm.salesperson_id
                WHERE mm.manager_id = auth.uid() AND sam.agency_id = agencies.id
            )
        )
        OR (
            public.fn_current_user_role() = 'SALES_PERSON' AND EXISTS (
                SELECT 1 FROM public.salesperson_agency_mappings
                WHERE salesperson_id = auth.uid() AND agency_id = agencies.id
            )
        )
    );

DROP POLICY IF EXISTS policy_agencies_insert_public ON public.agencies;
CREATE POLICY policy_agencies_insert_public ON public.agencies
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS policy_agencies_update_public ON public.agencies;
CREATE POLICY policy_agencies_update_public ON public.agencies
    FOR UPDATE TO public USING (true) WITH CHECK (true);

-- =========================================================
-- RLS POLICIES FOR ORDERS
-- =========================================================

DROP POLICY IF EXISTS policy_orders_select ON public.orders;
CREATE POLICY policy_orders_select ON public.orders
    FOR SELECT USING (
        public.fn_current_user_role() IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACCOUNTS', 'BILLING')
        OR (public.fn_current_user_role() = 'DISPATCH_MANAGER' AND status IN ('APPROVED', 'DISPATCH_PENDING', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'COMPLETED'))
        OR (public.fn_current_user_role() = 'AREA_SALES_MANAGER' AND (asm_id = auth.uid() OR salesperson_id IN (
            SELECT salesperson_id FROM public.manager_mappings WHERE manager_id = auth.uid()
        )))
        OR (public.fn_current_user_role() = 'SALES_PERSON' AND salesperson_id = auth.uid())
    );

DROP POLICY IF EXISTS policy_orders_insert ON public.orders;
CREATE POLICY policy_orders_insert ON public.orders
    FOR INSERT WITH CHECK (
        public.fn_current_user_role() IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'SALES_PERSON')
    );

DROP POLICY IF EXISTS policy_orders_update ON public.orders;
CREATE POLICY policy_orders_update ON public.orders
    FOR UPDATE USING (
        public.fn_current_user_role() IN ('SUPER_ADMIN', 'SYSTEM_ADMIN')
        OR (public.fn_current_user_role() = 'SALES_PERSON' AND salesperson_id = auth.uid() AND status = 'DRAFT')
    );

-- ORDER ITEMS RLS
DROP POLICY IF EXISTS policy_order_items_select ON public.order_items;
CREATE POLICY policy_order_items_select ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
        )
    );

-- =========================================================
-- RLS POLICIES FOR NOTIFICATIONS
-- =========================================================

DROP POLICY IF EXISTS policy_notifications_select ON public.notifications;
CREATE POLICY policy_notifications_select ON public.notifications
    FOR SELECT USING (
        recipient_user_id = auth.uid()
        OR recipient_role_id IN (SELECT role_id FROM public.users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS policy_notifications_update ON public.notifications;
CREATE POLICY policy_notifications_update ON public.notifications
    FOR UPDATE USING (
        recipient_user_id = auth.uid()
    );
