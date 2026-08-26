-- Keep the database status contract aligned with the application workflow.
-- Without these values, forwarding an order to Higher Authority is rejected
-- by the orders.status CHECK constraint and the order reappears as NEW.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'DRAFT',
      'SUBMITTED',
      'SALES_ADMIN_APPROVED',
      'ACCOUNTS_APPROVED',
      'APPROVED',
      'HELD',
      'REJECTED',
      'WAIT_FOR_STOCK',
      'INVENTORY_AUDITED',
      'BILLED',
      'INVOICED',
      'DISPATCH_PENDING',
      'READY_FOR_PICKUP',
      'READY_FOR_SELF_PICKUP',
      'PARTIALLY_DISPATCHED',
      'DISPATCHED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'POD_ISSUE_RAISED',
      'COMPLETED',
      'CANCELLED'
    )
  );
