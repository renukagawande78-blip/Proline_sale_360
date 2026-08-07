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

-- 7. Agencies Seed
INSERT INTO public.agencies (id, agency_code, agency_name, company_id, area_id, address, contact_person, mobile, email, gst_number, credit_limit) VALUES
('a0111111-1111-1111-1111-111111111111', 'AG-KRS-01', 'Krishna Trading Agency', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '102 Commercial Complex, Connaught Place, New Delhi', 'Rajesh Sharma', '+91 98765 43210', 'rajesh@krishnatrading.com', '07AAAAA0000A1Z5', 250000.00),
('a0222222-2222-2222-2222-222222222222', 'AG-APX-02', 'Apex Distributors Pvt Ltd', 'c5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 'G-45 MIDC Industrial Area, Andheri East, Mumbai', 'Vikram Mehta', '+91 98111 22334', 'orders@apexdistributors.com', '27BBBBB1111B1Z2', 500000.00),
('a0333333-3333-3333-3333-333333333333', 'AG-STR-03', 'Star Retail Logistics', 'c4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', '88 Ring Road, Indiranagar, Bangalore', 'Suresh Reddy', '+91 99000 55443', 'suresh@starlogistics.com', '29CCCCC2222C1Z9', 150000.00)
ON CONFLICT (agency_code) DO NOTHING;

-- 8. Agency Financials Seed
INSERT INTO public.agency_financials (agency_id, outstanding_amount, overdue_amount, advance_amount, oldest_overdue_days) VALUES
('a0111111-1111-1111-1111-111111111111', 125000.00, 35000.00, 20000.00, 18),
('a0222222-2222-2222-2222-222222222222', 480000.00, 120000.00, 0.00, 45),
('a0333333-3333-3333-3333-333333333333', 25000.00, 0.00, 50000.00, 0)
ON CONFLICT (agency_id) DO NOTHING;

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
