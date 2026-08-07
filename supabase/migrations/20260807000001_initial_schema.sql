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
