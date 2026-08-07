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
