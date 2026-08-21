-- Proline OMS 360 Migration 01: Initial Schema
-- PostgreSQL Schema setup for Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. SECURITY & ROLES MASTERS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role_id UUID REFERENCES public.roles(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 2. DOMAIN MASTERS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_code VARCHAR(50) UNIQUE NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_code VARCHAR(50) UNIQUE NOT NULL,
    agency_name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    area_id UUID REFERENCES public.areas(id) ON DELETE RESTRICT,
    address TEXT,
    contact_person VARCHAR(100),
    mobile VARCHAR(50),
    email VARCHAR(255),
    gst_number VARCHAR(50),
    credit_limit NUMERIC(15, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_financials (
    agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
    outstanding_amount NUMERIC(15, 2) DEFAULT 0.00,
    overdue_amount NUMERIC(15, 2) DEFAULT 0.00,
    advance_amount NUMERIC(15, 2) DEFAULT 0.00,
    oldest_overdue_days INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_type_id UUID REFERENCES public.product_types(id),
    item_type_id UUID REFERENCES public.item_categories(id),
    pcs_per_box INT NOT NULL CHECK (pcs_per_box > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hold_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason_code VARCHAR(50) UNIQUE NOT NULL,
    reason_description VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.dispatch_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    driver_name VARCHAR(100),
    driver_mobile VARCHAR(50),
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.transporters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    mobile VARCHAR(50),
    active BOOLEAN DEFAULT true
);

-- =========================================================
-- 3. MAPPINGS & ACCESS SCOPING
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_company_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.sales_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) NOT NULL,
    area_sales_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.manager_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    salesperson_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE(manager_id, salesperson_id)
);

CREATE TABLE IF NOT EXISTS public.salesperson_agency_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salesperson_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    UNIQUE(salesperson_id, agency_id)
);

-- =========================================================
-- 4. ORDER TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE RESTRICT,
    area_id UUID REFERENCES public.areas(id) ON DELETE RESTRICT,
    salesperson_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    asm_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'HELD', 'REJECTED', 'DISPATCH_PENDING', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'COMPLETED', 'CANCELLED')
    ),
    total_box_qty INT DEFAULT 0,
    total_loose_pcs INT DEFAULT 0,
    total_qty_pcs INT DEFAULT 0,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    pcs_per_box INT NOT NULL CHECK (pcs_per_box > 0),
    box_qty INT NOT NULL DEFAULT 0 CHECK (box_qty >= 0),
    loose_pcs INT NOT NULL DEFAULT 0 CHECK (loose_pcs >= 0),
    total_qty_pcs INT GENERATED ALWAYS AS ((box_qty * pcs_per_box) + loose_pcs) STORED,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) DEFAULT 0.00,
    dispatched_qty_pcs INT DEFAULT 0 CHECK (dispatched_qty_pcs >= 0),
    pending_qty_pcs INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.order_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('APPROVED', 'HELD', 'RELEASED', 'REJECTED')),
    action_by UUID REFERENCES public.users(id),
    action_at TIMESTAMPTZ DEFAULT NOW(),
    hold_reason_id UUID REFERENCES public.hold_reasons(id),
    remarks TEXT,
    snapshot_outstanding NUMERIC(15, 2) DEFAULT 0.00,
    snapshot_overdue NUMERIC(15, 2) DEFAULT 0.00,
    snapshot_credit_limit NUMERIC(15, 2) DEFAULT 0.00
);

-- =========================================================
-- 5. DISPATCH & BILLING TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    dispatch_date TIMESTAMPTZ DEFAULT NOW(),
    dispatch_type_id UUID REFERENCES public.dispatch_types(id),
    status VARCHAR(50) DEFAULT 'CONFIRMED' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    pickup_person VARCHAR(100),
    pickup_mobile VARCHAR(50),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_mobile VARCHAR(50),
    lr_number VARCHAR(100),
    transporter_id UUID REFERENCES public.transporters(id),
    expected_delivery_date TIMESTAMPTZ,
    pod_url TEXT,
    received_by VARCHAR(100),
    signature_url TEXT,
    dispatched_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispatch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID REFERENCES public.dispatches(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE RESTRICT,
    ordered_qty_pcs INT NOT NULL,
    previously_dispatched_qty_pcs INT NOT NULL DEFAULT 0,
    dispatch_qty_pcs INT NOT NULL CHECK (dispatch_qty_pcs > 0),
    balance_qty_pcs INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    dispatch_id UUID REFERENCES public.dispatches(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE RESTRICT,
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVOICED', 'PAID', 'PARTIAL_PAID')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id),
    invoiced_qty_pcs INT NOT NULL,
    rate NUMERIC(15, 2) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL
);

-- =========================================================
-- 6. NOTIFICATIONS & AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    dispatch_id UUID REFERENCES public.dispatches(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    source VARCHAR(50) DEFAULT 'WEB' CHECK (source IN ('WEB', 'ANDROID', 'WHATSAPP', 'SYSTEM')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_orders_salesperson ON public.orders(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_orders_agency ON public.orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_order ON public.dispatches(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read);
-- Proline OMS 360 Migration 02: RLS Policies & Row Level Security Setup

-- Enable RLS on all operational tables safely
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agencies ENABLE ROW LEVEL SECURITY;
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
-- Proline OMS 360 Migration 03: RPC Functions & Triggers

-- 1. Auto-generate Order Number
CREATE OR REPLACE FUNCTION public.fn_generate_order_number(p_company_code VARCHAR DEFAULT 'PRL')
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_seq INT;
    v_order_num VARCHAR(50);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    SELECT COUNT(*) + 1 INTO v_seq
    FROM public.orders
    WHERE order_number LIKE p_company_code || '-' || v_year || '-%';

    v_order_num := p_company_code || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
    RETURN v_order_num;
END;
$$ LANGUAGE plpgsql;

-- 2. Submit Order RPC
CREATE OR REPLACE FUNCTION public.fn_submit_order(
    p_order_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_sys_admin_role_id UUID;
BEGIN
    -- Fetch order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status != 'DRAFT' THEN
        RAISE EXCEPTION 'Only DRAFT orders can be submitted';
    END IF;

    -- Update Order Status
    UPDATE public.orders
    SET status = 'SUBMITTED',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Fetch System Admin role
    SELECT id INTO v_sys_admin_role_id FROM public.roles WHERE role_name = 'SYSTEM_ADMIN';

    -- Generate Notification for System Admins
    INSERT INTO public.notifications (
        recipient_role_id,
        event_type,
        title,
        message,
        order_id
    ) VALUES (
        v_sys_admin_role_id,
        'ORDER_SUBMITTED',
        'New Order Submitted: ' || v_order.order_number,
        'Order ' || v_order.order_number || ' has been submitted and is pending account approval.',
        p_order_id
    );

    -- Log Audit
    INSERT INTO public.audit_logs (
        user_id, action, entity, entity_id, new_value, source
    ) VALUES (
        p_user_id, 'ORDER_SUBMITTED', 'orders', p_order_id, jsonb_build_object('status', 'SUBMITTED'), 'SYSTEM'
    );

    RETURN jsonb_build_object('success', true, 'status', 'SUBMITTED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Approve Order RPC
CREATE OR REPLACE FUNCTION public.fn_approve_order(
    p_order_id UUID,
    p_user_id UUID,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_financials public.agency_financials%ROWTYPE;
    v_dispatch_role_id UUID;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    IF v_order.status NOT IN ('SUBMITTED', 'HELD') THEN
        RAISE EXCEPTION 'Order cannot be approved from status %', v_order.status;
    END IF;

    SELECT * INTO v_financials FROM public.agency_financials WHERE agency_id = v_order.agency_id;

    -- Update Order
    UPDATE public.orders
    SET status = 'APPROVED', updated_at = NOW()
    WHERE id = p_order_id;

    -- Record Approval
    INSERT INTO public.order_approvals (
        order_id, action, action_by, remarks,
        snapshot_outstanding, snapshot_overdue, snapshot_credit_limit
    ) VALUES (
        p_order_id, 'APPROVED', p_user_id, p_remarks,
        COALESCE(v_financials.outstanding_amount, 0),
        COALESCE(v_financials.overdue_amount, 0),
        0
    );

    -- Notify Dispatch Manager, Salesperson, ASM
    SELECT id INTO v_dispatch_role_id FROM public.roles WHERE role_name = 'DISPATCH_MANAGER';

    INSERT INTO public.notifications (recipient_role_id, event_type, title, message, order_id)
    VALUES (v_dispatch_role_id, 'ORDER_APPROVED', 'Order Ready for Dispatch: ' || v_order.order_number, 'Order ' || v_order.order_number || ' has been approved.', p_order_id);

    INSERT INTO public.notifications (recipient_user_id, event_type, title, message, order_id)
    VALUES (v_order.salesperson_id, 'ORDER_APPROVED', 'Your Order ' || v_order.order_number || ' is Approved', 'Order approved by admin.', p_order_id);

    IF v_order.asm_id IS NOT NULL THEN
        INSERT INTO public.notifications (recipient_user_id, event_type, title, message, order_id)
        VALUES (v_order.asm_id, 'ORDER_APPROVED', 'Team Order ' || v_order.order_number || ' Approved', 'Order approved by admin.', p_order_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'APPROVED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Hold Order RPC
CREATE OR REPLACE FUNCTION public.fn_hold_order(
    p_order_id UUID,
    p_user_id UUID,
    p_hold_reason_id UUID,
    p_remarks TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_reason_desc VARCHAR(255);
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    SELECT reason_description INTO v_reason_desc FROM public.hold_reasons WHERE id = p_hold_reason_id;

    -- Update Order
    UPDATE public.orders SET status = 'HELD', updated_at = NOW() WHERE id = p_order_id;

    -- Record Approval History
    INSERT INTO public.order_approvals (order_id, action, action_by, hold_reason_id, remarks)
    VALUES (p_order_id, 'HELD', p_user_id, p_hold_reason_id, p_remarks);

    -- Notify Salesperson & ASM
    INSERT INTO public.notifications (recipient_user_id, event_type, title, message, order_id)
    VALUES (v_order.salesperson_id, 'ORDER_HELD', 'Order Held: ' || v_order.order_number, 'Reason: ' || COALESCE(v_reason_desc, 'Account Check') || '. ' || COALESCE(p_remarks, ''), p_order_id);

    IF v_order.asm_id IS NOT NULL THEN
        INSERT INTO public.notifications (recipient_user_id, event_type, title, message, order_id)
        VALUES (v_order.asm_id, 'ORDER_HELD', 'Team Order Held: ' || v_order.order_number, 'Reason: ' || COALESCE(v_reason_desc, 'Account Check'), p_order_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'HELD');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create & Confirm Dispatch RPC
CREATE OR REPLACE FUNCTION public.fn_create_dispatch(
    p_order_id UUID,
    p_dispatch_type_id UUID,
    p_items JSONB, -- Array of { order_item_id, dispatch_qty }
    p_dispatch_metadata JSONB,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_dispatch_id UUID;
    v_dispatch_num VARCHAR(50);
    v_item JSONB;
    v_order_item public.order_items%ROWTYPE;
    v_item_id UUID;
    v_dispatch_qty INT;
    v_total_ordered INT := 0;
    v_total_dispatched INT := 0;
    v_new_order_status VARCHAR(50);
    v_accounts_role_id UUID;
    v_order public.orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    v_dispatch_num := 'DSP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((FLOOR(RANDOM()*10000))::TEXT, 4, '0');

    INSERT INTO public.dispatches (
        dispatch_number, order_id, dispatch_type_id, status,
        pickup_person, pickup_mobile, vehicle_number, driver_name, driver_mobile,
        lr_number, transporter_id, expected_delivery_date, dispatched_by
    ) VALUES (
        v_dispatch_num, p_order_id, p_dispatch_type_id, 'CONFIRMED',
        p_dispatch_metadata->>'pickup_person',
        p_dispatch_metadata->>'pickup_mobile',
        p_dispatch_metadata->>'vehicle_number',
        p_dispatch_metadata->>'driver_name',
        p_dispatch_metadata->>'driver_mobile',
        p_dispatch_metadata->>'lr_number',
        (p_dispatch_metadata->>'transporter_id')::UUID,
        (p_dispatch_metadata->>'expected_delivery_date')::TIMESTAMPTZ,
        p_user_id
    ) RETURNING id INTO v_dispatch_id;

    -- Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'order_item_id')::UUID;
        v_dispatch_qty := (v_item->>'dispatch_qty')::INT;

        SELECT * INTO v_order_item FROM public.order_items WHERE id = v_item_id;

        IF v_dispatch_qty > (v_order_item.total_qty_pcs - v_order_item.dispatched_qty_pcs) THEN
            RAISE EXCEPTION 'Dispatch quantity exceeds pending quantity for product';
        END IF;

        -- Record Dispatch Item
        INSERT INTO public.dispatch_items (
            dispatch_id, order_item_id, ordered_qty_pcs,
            previously_dispatched_qty_pcs, dispatch_qty_pcs, balance_qty_pcs
        ) VALUES (
            v_dispatch_id, v_item_id, v_order_item.total_qty_pcs,
            v_order_item.dispatched_qty_pcs, v_dispatch_qty,
            (v_order_item.total_qty_pcs - (v_order_item.dispatched_qty_pcs + v_dispatch_qty))
        );

        -- Update Order Item dispatched and pending quantities
        UPDATE public.order_items
        SET dispatched_qty_pcs = dispatched_qty_pcs + v_dispatch_qty,
            pending_qty_pcs = total_qty_pcs - (dispatched_qty_pcs + v_dispatch_qty)
        WHERE id = v_item_id;
    END LOOP;

    -- Check overall order status
    SELECT SUM(total_qty_pcs), SUM(dispatched_qty_pcs)
    INTO v_total_ordered, v_total_dispatched
    FROM public.order_items
    WHERE order_id = p_order_id;

    IF v_total_dispatched >= v_total_ordered THEN
        v_new_order_status := 'DISPATCHED';
    ELSE
        v_new_order_status := 'PARTIALLY_DISPATCHED';
    END IF;

    UPDATE public.orders SET status = v_new_order_status, updated_at = NOW() WHERE id = p_order_id;

    -- Notify Accounts/Billing
    SELECT id INTO v_accounts_role_id FROM public.roles WHERE role_name = 'ACCOUNTS';

    INSERT INTO public.notifications (recipient_role_id, event_type, title, message, order_id, dispatch_id)
    VALUES (v_accounts_role_id, 'DISPATCH_COMPLETED', 'Dispatch ' || v_dispatch_num || ' Ready for Invoicing', 'New dispatch generated for order ' || v_order.order_number, p_order_id, v_dispatch_id);

    RETURN jsonb_build_object(
        'success', true,
        'dispatch_id', v_dispatch_id,
        'dispatch_number', v_dispatch_num,
        'order_status', v_new_order_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Proline OMS 360 Migration 04: Seed Master Data & Sample Workflows

-- 1. Roles Seed
INSERT INTO public.roles (id, role_name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'SUPER_ADMIN', 'Global system administrative access'),
('22222222-2222-2222-2222-222222222222', 'SYSTEM_ADMIN', 'System Admin order check, hold, release & approval'),
('33333333-3333-3333-3333-333333333333', 'ACCOUNTS', 'Financial accounting & credit management'),
('44444444-4444-4444-4444-444444444444', 'BILLING', 'Billing, invoicing & payment processing'),
('55555555-5555-5555-5555-555555555555', 'DISPATCH_MANAGER', 'Warehouse dispatch execution & tracking'),
('66666666-6666-6666-6666-666666666666', 'AREA_SALES_MANAGER', 'Sales team management & order oversight'),
('77777777-7777-7777-7777-777777777777', 'SALES_PERSON', 'Field salesperson order creation & agency sales')
ON CONFLICT (role_name) DO NOTHING;

-- 2. Companies Seed
INSERT INTO public.companies (id, company_code, company_name) VALUES
('c1111111-1111-1111-1111-111111111111', 'PRY', 'Priyagold Foods'),
('c2222222-2222-2222-2222-222222222222', 'ORN', 'Orion Confectionery'),
('c3333333-3333-3333-3333-333333333333', 'DKN', 'Daikin Appliances'),
('c4444444-4444-4444-4444-444444444444', 'WAI', 'Waiwai Foods'),
('c5555555-5555-5555-5555-555555555555', 'MOG', 'Mogu Mogu Beverages')
ON CONFLICT (company_code) DO NOTHING;

-- 3. Product Types Seed
INSERT INTO public.product_types (id, type_code, type_name) VALUES
('d1111111-1111-1111-1111-111111111111', 'FMCG', 'Fast-Moving Consumer Goods'),
('d2222222-2222-2222-2222-222222222222', 'FMES', 'Fast-Moving Electrical & Appliances')
ON CONFLICT (type_code) DO NOTHING;

-- 4. Item Categories Seed
INSERT INTO public.item_categories (id, category_name) VALUES
('ca711111-1111-1111-1111-111111111111', 'Biscuits & Cookies'),
('ca722222-2222-2222-2222-222222222222', 'Beverages & Juices'),
('ca733333-3333-3333-3333-333333333333', 'Instant Noodles & Snacks'),
('ca744444-4444-4444-4444-444444444444', 'Air Conditioners & Cooling')
ON CONFLICT (category_name) DO NOTHING;

-- 5. Products Seed
INSERT INTO public.products (id, company_id, product_code, product_name, product_type_id, item_type_id, pcs_per_box, unit_price) VALUES
('f1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'PRY-BUT-01', 'Priyagold Butter Delite 100g', 'd1111111-1111-1111-1111-111111111111', 'ca711111-1111-1111-1111-111111111111', 24, 25.00),
('f2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'PRY-CNC-02', 'Priyagold CNC Crackers 150g', 'd1111111-1111-1111-1111-111111111111', 'ca711111-1111-1111-1111-111111111111', 24, 30.00),
('f3333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', 'MOG-LYC-300', 'Mogu Mogu Lychee Juice 300ml', 'd1111111-1111-1111-1111-111111111111', 'ca722222-2222-2222-2222-222222222222', 24, 65.00),
('f4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'WAI-EXP-70', 'Waiwai Express Masala Noodles 70g', 'd1111111-1111-1111-1111-111111111111', 'ca733333-3333-3333-3333-333333333333', 30, 15.00),
('f5555555-5555-5555-5555-555555555555', 'c3333333-3333-3333-3333-333333333333', 'DKN-AC-15T', 'Daikin 1.5 Ton 5 Star Inverter AC', 'd2222222-2222-2222-2222-222222222222', 'ca744444-4444-4444-4444-444444444444', 1, 42500.00)
ON CONFLICT (product_code) DO NOTHING;

-- 6. Areas Seed
INSERT INTO public.areas (id, area_code, area_name, region) VALUES
('a1111111-1111-1111-1111-111111111111', 'NORTH-DEL', 'Delhi NCR Territory', 'North'),
('a2222222-2222-2222-2222-222222222222', 'WEST-MUM', 'Mumbai Metro Region', 'West'),
('a3333333-3333-3333-3333-333333333333', 'SOUTH-BLR', 'Bangalore Urban Area', 'South')
ON CONFLICT (area_code) DO NOTHING;

-- 7. Agencies Seed (Cleared as requested)

-- 8. Agency Financials Seed (Cleared as requested)

-- 9. Hold Reasons Seed
INSERT INTO public.hold_reasons (id, reason_code, reason_description) VALUES
('eb111111-1111-1111-1111-111111111111', 'OVERDUE_PAYMENT', 'Overdue Payment Pending'),
('eb222222-2222-2222-2222-222222222222', 'CREDIT_LIMIT_EXCEEDED', 'Credit Limit Exceeded'),
('eb333333-3333-3333-3333-333333333333', 'ADVANCE_REQUIRED', 'Advance Payment Required'),
('eb444444-4444-4444-4444-444444444444', 'PRICE_APPROVAL_PENDING', 'Price / Scheme Approval Pending'),
('eb555555-5555-5555-5555-555555555555', 'DOCUMENT_ISSUE', 'Document / GST Compliance Issue')
ON CONFLICT (reason_code) DO NOTHING;

-- 10. Dispatch Types Seed
INSERT INTO public.dispatch_types (id, type_code, type_name) VALUES
('d0111111-1111-1111-1111-111111111111', 'SELF_PICKUP', 'Self Pickup by Agency'),
('d0222222-2222-2222-2222-222222222222', 'DELIVERY', 'Delivery / Transporter Dispatch')
ON CONFLICT (type_code) DO NOTHING;

-- 11. Transporters & Vehicles
INSERT INTO public.transporters (id, transporter_name, contact_person, mobile) VALUES
('fe111111-1111-1111-1111-111111111111', 'Express Cargo Logistics', 'Ramesh Kumar', '+91 98888 11111')
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicles (id, vehicle_number, driver_name, driver_mobile) VALUES
('ed111111-1111-1111-1111-111111111111', 'DL-01-AB-1234', 'Mahesh Verma', '+91 97777 22222')
ON CONFLICT (vehicle_number) DO NOTHING;

-- 12. Users Seed (System Demo Accounts)
INSERT INTO public.users (id, email, full_name, phone, role_id) VALUES
('e1111111-1111-1111-1111-111111111111', 'superadmin@proline.com', 'System Super Admin', '+91 90000 00001', '11111111-1111-1111-1111-111111111111'),
('e2222222-2222-2222-2222-222222222222', 'sysadmin@proline.com', 'Vikram Malhotra (System Admin)', '+91 90000 00002', '22222222-2222-2222-2222-222222222222'),
('e3333333-3333-3333-3333-333333333333', 'accounts@proline.com', 'Anjali Gupta (Accounts Manager)', '+91 90000 00003', '33333333-3333-3333-3333-333333333333'),
('e4444444-4444-4444-4444-444444444444', 'billing@proline.com', 'Rohan Shah (Billing Executive)', '+91 90000 00004', '44444444-4444-4444-4444-444444444444'),
('e5555555-5555-5555-5555-555555555555', 'dispatch@proline.com', 'Sanjay Yadav (Dispatch Manager)', '+91 90000 00005', '55555555-5555-5555-5555-555555555555'),
('e6666666-6666-6666-6666-666666666666', 'asm.north@proline.com', 'Sunil Kapoor (Area Sales Manager)', '+91 90000 00006', '66666666-6666-6666-6666-666666666666'),
('e7777777-7777-7777-7777-777777777777', 'amit.sales@proline.com', 'Amit Kumar (Sales Person)', '+91 90000 00007', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (email) DO NOTHING;

-- 13. Mappings Seed
INSERT INTO public.user_company_access (user_id, company_id) VALUES
('e7777777-7777-7777-7777-777777777777', 'c1111111-1111-1111-1111-111111111111'),
('e7777777-7777-7777-7777-777777777777', 'c5555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

INSERT INTO public.manager_mappings (manager_id, salesperson_id) VALUES
('e6666666-6666-6666-6666-666666666666', 'e7777777-7777-7777-7777-777777777777')
ON CONFLICT DO NOTHING;

INSERT INTO public.salesperson_agency_mappings (salesperson_id, agency_id) VALUES
('e7777777-7777-7777-7777-777777777777', 'a0111111-1111-1111-1111-111111111111'),
('e7777777-7777-7777-7777-777777777777', 'a0222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- 14. Sample Initial Orders Seed
INSERT INTO public.orders (
    id, order_number, order_date, company_id, agency_id, area_id, salesperson_id, asm_id, status, total_box_qty, total_loose_pcs, total_qty_pcs, total_amount, remarks
) VALUES
('b1111111-1111-1111-1111-111111111111', 'PRL-2026-001054', NOW() - INTERVAL '2 days', 'c1111111-1111-1111-1111-111111111111', 'a0111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'e7777777-7777-7777-7777-777777777777', 'e6666666-6666-6666-6666-666666666666', 'SUBMITTED', 10, 5, 245, 6125.00, 'Urgent delivery requested for festivity stock'),
('b2222222-2222-2222-2222-222222222222', 'PRL-2026-001055', NOW() - INTERVAL '1 day', 'c5555555-5555-5555-5555-555555555555', 'a0222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'e7777777-7777-7777-7777-777777777777', 'e6666666-6666-6666-6666-666666666666', 'APPROVED', 20, 0, 480, 31200.00, 'Regular monthly restock')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, pcs_per_box, box_qty, loose_pcs, unit_price, total_price, pending_qty_pcs) VALUES
('ba111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 24, 10, 5, 25.00, 6125.00, 245),
('ba222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', 24, 20, 0, 65.00, 31200.00, 480)
ON CONFLICT DO NOTHING;
