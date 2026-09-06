import React from 'react';
import { X, FileText, Truck, Edit, AlertTriangle, CheckCircle2, Package, MapPin, User, Building2 } from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface OrderApprovalModalProps {
  order: Order | null;
  isOpen?: boolean;
  onClose: () => void;
  onApprove?: (orderId: string, remarks: string, approvalDetails?: any) => void;
  onHold?: (orderId: string, reasonId: string, remarks: string) => void;
  onReject?: (orderId: string, remarks: string) => void;
  onRequestAccountsClearance?: (orderId: string, queryMsg: string) => void;
  onApproveReturnRequest?: (orderId: string) => void;
  onRejectReturnRequest?: (orderId: string) => void;
  onOpenEditOrder?: (order: Order) => void;
}

export const OrderApprovalModal: React.FC<OrderApprovalModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenEditOrder
}) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const isSuperAdmin = role === 'SUPER_ADMIN'
    || (currentUser?.full_name || '').toLowerCase().includes('chirag')
    || (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const isSalesAdmin = role === 'SALES_ADMIN';
  const isBillingOrAccounts = role === 'BILLING' || role === 'ACCOUNTS';
  const isDispatchUser = role === 'DISPATCH_MANAGER' || (role as string) === 'DISPATCH';
  const canEditOriginalOrder = (isSuperAdmin || isSalesAdmin || role === 'AREA_SALES_MANAGER' || (role as string) === 'SALES_PERSON' || (role as string) === 'SALESPERSON') && !isBillingOrAccounts && !isDispatchUser;

  if (!order || (isOpen !== undefined && !isOpen)) return null;

  const fmtDate = (d?: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const items = order.items || [];
  const totBox = items.reduce((s, it) => s + (it.box_qty || 0), 0) || order.total_box_qty || 0;
  const totLoose = items.reduce((s, it) => s + (it.loose_pcs || 0), 0) || order.total_loose_pcs || 0;
  const totFree = items.reduce((s, it) => s + (it.free_pcs || 0), 0) || order.total_free_pcs || 0;
  const totPcs = items.reduce((s, it) => s + (it.total_qty_pcs || 0), 0) || order.total_qty_pcs || 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 960, width: '96vw', maxHeight: '92vh', overflowY: 'auto', background: '#0b1329', border: '1px solid #1e293b', borderRadius: 14, padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Order Details — <span style={{ color: '#38bdf8' }}>{order.order_number}</span>
              </h2>
              <span className={'status-badge status-' + order.status} style={{ fontSize: '0.725rem', fontWeight: 800 }}>
                {order.status.replace(/_/g, ' ')}
              </span>
              {order.invoice_number && (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>
                  ✅ Invoiced: {order.invoice_number}
                </span>
              )}
              {order.reattempt_delivery && (
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                  🔄 Reattempt Delivery
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0' }}>
              Date: <strong style={{ color: '#cbd5e1' }}>{fmtDate(order.order_date)}</strong>
              &nbsp;|&nbsp; Brand: <strong style={{ color: '#fbbf24' }}>{order.company_name || 'PROLINE'}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onOpenEditOrder && canEditOriginalOrder && order.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditOrder(order);
                }}
                className="btn btn-outline"
                style={{
                  borderColor: '#38bdf8',
                  color: '#38bdf8',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Edit Order"
              >
                <Edit size={13} /> Edit Order
              </button>
            )}
            <button 
              onClick={onClose} 
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Order Summary Metric Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem', background: '#0f172a', padding: '1rem', borderRadius: 10, border: '1px solid #1e293b' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
              AGENCY / PARTY
            </div>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.875rem' }}>
              {order.agency_name || 'Direct Order'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{order.area_name || 'Surat Area'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
              SALESPERSON
            </div>
            <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.85rem' }}>
              {order.salesperson_name || '—'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: 1 }}>{order.company_name}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
              DELIVERY MODE
            </div>
            <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.85rem' }}>
              {order.delivery_type || 'F.O.R'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{order.payment_type || 'Credit'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
              TOTAL BOXES (FMCG)
            </div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.875rem' }}>
              {order.total_box_qty > 0 ? `${order.total_box_qty} Boxes` : '—'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{order.total_loose_pcs || 0} Loose PCS</div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
              TOTAL DEMAND (PCS)
            </div>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.875rem' }}>
              {order.total_qty_pcs?.toLocaleString() || 0} PCS
            </div>
            <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: 1 }}>
              {order.billing_total_qty ? `${order.billing_total_qty} Issued PCS` : 'Fulfillment pending'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
              INVOICED VALUE (₹)
            </div>
            <div style={{ fontWeight: 800, color: order.invoice_amount ? '#10b981' : '#64748b', fontSize: '0.875rem' }}>
              {order.invoice_amount ? `₹${order.invoice_amount.toLocaleString()}` : '— (Pending Billing)'}
            </div>
            <div style={{ fontSize: '0.7rem', color: order.invoice_number ? '#34d399' : '#94a3b8', marginTop: 1 }}>
              {order.invoice_number ? order.invoice_number : 'Post-billing settled'}
            </div>
          </div>
        </div>

        {/* Hold Notice Banner */}
        {order.status === 'HELD' && (
          <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid #f59e0b', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.825rem' }}>ORDER ON HOLD</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>Reason: <strong>{order.hold_reason || 'Admin directive'}</strong></div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={15} color="#38bdf8" /> Ordered SKUs & Line Items ({items.length} Items)
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Segment: <strong style={{ color: order.total_box_qty > 0 ? '#38bdf8' : '#34d399' }}>{order.total_box_qty > 0 ? 'FMCG (Box + PCS)' : 'FMCD (Unit PCS)'}</strong>
            </span>
          </div>

          <div className="data-table-container" style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #1e293b', borderRadius: 8 }}>
            <table className="data-table" style={{ fontSize: '0.775rem', width: '100%' }}>
              <thead>
                <tr>
                  <th>PRODUCT SKU</th>
                  <th>BRAND</th>
                  <th style={{ textAlign: 'center' }}>PACK</th>
                  <th style={{ textAlign: 'center' }}>BOXES</th>
                  <th style={{ textAlign: 'center' }}>LOOSE PCS</th>
                  <th style={{ textAlign: 'center' }}>FREE PCS</th>
                  <th style={{ textAlign: 'center' }}>ORDERED DEMAND</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No SKU line items attached to this order.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const isFMCDItem = item.box_qty === 0 && (item.loose_pcs || item.total_qty_pcs || 0) > 0;
                    const qtyDisplay = isFMCDItem
                      ? `${item.loose_pcs || item.total_qty_pcs} PCS`
                      : (item.box_qty > 0 && (item.loose_pcs || 0) > 0)
                        ? `${item.box_qty} BOX, ${item.loose_pcs} PCS`
                        : item.box_qty > 0
                          ? `${item.box_qty} BOX`
                          : `${item.loose_pcs || 0} PCS`;

                    return (
                      <tr key={item.id || idx}>
                        <td>
                          <strong style={{ color: '#f8fafc' }}>{item.product_name || 'Product Item'}</strong>
                          {item.product_code && <div style={{ fontSize: '0.675rem', color: '#64748b' }}>{item.product_code}</div>}
                        </td>
                        <td><span style={{ color: '#fbbf24', fontWeight: 700 }}>{order.company_name || 'PROLINE'}</span></td>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>{isFMCDItem ? '1 pc (Unit)' : `${item.pcs_per_box} pcs/box`}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: item.box_qty > 0 ? '#38bdf8' : '#64748b' }}>
                          {item.box_qty > 0 ? `${item.box_qty} Bx` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#38bdf8' }}>
                          {item.loose_pcs || (isFMCDItem ? item.total_qty_pcs : 0)} PCS
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#fbbf24' }}>
                          {(item.free_pcs || 0) > 0 ? `+${item.free_pcs} Free` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#34d399' }}>
                          {qtyDisplay} ({item.total_qty_pcs?.toLocaleString() || 0} PCS)
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot style={{ background: '#090f1d', borderTop: '2px solid #1e293b' }}>
                  <tr>
                    <td colSpan={3} style={{ fontWeight: 800, color: '#f8fafc' }}>
                      TOTAL SUMMARY
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#38bdf8' }}>
                      {totBox > 0 ? `${totBox} BOX` : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#38bdf8' }}>
                      {totLoose > 0 ? `${totLoose} PCS` : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#fbbf24' }}>
                      {totFree > 0 ? `+${totFree} Free` : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900, color: '#34d399' }}>
                      {totBox > 0 ? `${totBox} BOX` : ''}{totBox > 0 && totLoose > 0 ? ', ' : ''}{totLoose > 0 ? `${totLoose} PCS` : ''}{totBox === 0 && totLoose === 0 ? `${totPcs} PCS` : ''} ({totPcs.toLocaleString()} PCS)
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Logistics & Dispatch Telemetry */}
        {(order.invoice_number || order.vehicle_number || order.driver_name || order.rental_agency_name || order.remarks) && (
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Truck size={14} /> Logistics & Fulfillment Telemetry
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
              {order.invoice_number && (
                <div>
                  <span style={{ color: '#64748b' }}>Invoice No: </span>
                  <strong style={{ color: '#34d399' }}>{order.invoice_number}</strong>
                </div>
              )}
              {order.driver_name && (
                <div>
                  <span style={{ color: '#64748b' }}>Driver / Vehicle: </span>
                  <strong style={{ color: '#f8fafc' }}>{order.driver_name} {order.vehicle_number ? `(${order.vehicle_number})` : ''}</strong>
                </div>
              )}
              {order.rental_agency_name && (
                <div>
                  <span style={{ color: '#64748b' }}>Transporter: </span>
                  <strong style={{ color: '#fbbf24' }}>{order.rental_agency_name}</strong>
                </div>
              )}
              {order.remarks && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b' }}>Remarks: </span>
                  <span style={{ color: '#cbd5e1' }}>{order.remarks.replace(/<!--.*?-->/g, '')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={14} color="#34d399" /> Proline OMS 360 Order Telemetry View
          </div>

          <div style={{ display: 'flex', gap: '0.55rem' }}>
            {onOpenEditOrder && canEditOriginalOrder && order.status !== 'CANCELLED' && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  onClose();
                  onOpenEditOrder(order);
                }}
                style={{
                  borderColor: '#38bdf8',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Edit size={14} /> Edit Order
              </button>
            )}
            <button 
              className="btn btn-primary" 
              onClick={onClose}
              style={{ fontSize: '0.8rem', padding: '0.45rem 1.1rem' }}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
