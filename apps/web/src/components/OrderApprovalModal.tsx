import React from 'react';
import { X, FileText, Truck, Edit, AlertTriangle, CheckCircle2, Package, MapPin, User, Building2 } from 'lucide-react';
import { Order, isOrderDispatchedOrBeyond } from '../types';
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
  onApproveReturnRequest,
  onRejectReturnRequest,
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
              &nbsp;|&nbsp; Brand: <strong style={{ color: '#fbbf24' }}>{order.company_name || 'PROKAP'}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onOpenEditOrder && canEditOriginalOrder && order.status !== 'CANCELLED' && !isOrderDispatchedOrBeyond(order.status) && (
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
                  {order.invoice_number && <th style={{ textAlign: 'center', color: '#34d399' }}>BILLED QTY</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={order.invoice_number ? 8 : 7} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
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
                        <td><span style={{ color: '#fbbf24', fontWeight: 700 }}>{order.company_name || 'PROKAP'}</span></td>
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
                        {order.invoice_number && (
                          <td style={{ textAlign: 'center', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
                            {(() => {
                              const issued = item.issued_qty_pcs !== undefined ? Number(item.issued_qty_pcs) : (item.total_qty_pcs || 0);
                              const pack = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
                              if (isFMCDItem || pack <= 1) {
                                return `${issued.toLocaleString()} PCS`;
                              }
                              const bBox = Math.floor(issued / pack);
                              const bLoose = issued % pack;
                              return bBox > 0 && bLoose > 0
                                ? `${bBox} BOX, ${bLoose} PCS`
                                : bBox > 0
                                  ? `${bBox} BOX`
                                  : `${bLoose} PCS`;
                            })()}
                          </td>
                        )}
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
                    {order.invoice_number && (
                      <td style={{ textAlign: 'center', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
                        {order.billing_total_qty ? `${order.billing_total_qty.toLocaleString()} PCS` : `${totPcs.toLocaleString()} PCS`}
                      </td>
                    )}
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

        {/* Return & Damaged Goods Request Section */}
        {order.return_request && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.05)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 10,
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <Package size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                    {order.return_request.return_type === 'DAMAGED_RETURN' ? 'Damaged Goods Return Request' : 'Stock Replacement Request'}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Raised by {order.return_request.raised_by_name || 'Sales Person'} on {fmtDate(order.return_request.created_at)}
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: 6,
                background: order.return_request.status === 'PENDING_ADMIN_APPROVAL' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: order.return_request.status === 'PENDING_ADMIN_APPROVAL' ? '#fbbf24' : '#38bdf8',
                border: order.return_request.status === 'PENDING_ADMIN_APPROVAL' ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)'
              }}>
                {order.return_request.status === 'PENDING_ADMIN_APPROVAL' 
                  ? '⏳ Pending Sale Admin Approval' 
                  : order.return_request.status === 'APPROVED_FOR_COLLECTION'
                  ? '🚚 Sale Admin Approved for Collect'
                  : order.return_request.status === 'COLLECTED'
                  ? '📦 Damaged Stock Collected'
                  : order.return_request.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 8, marginBottom: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Total Damaged / Return: </span>
                <strong style={{ color: '#fbbf24' }}>{order.return_request.total_damaged_pcs} PCS</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Primary Reason: </span>
                <span style={{ color: '#cbd5e1' }}>{order.return_request.reason}</span>
              </div>
              {order.return_request.remarks && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b' }}>Remarks: </span>
                  <span style={{ color: '#cbd5e1' }}>{order.return_request.remarks}</span>
                </div>
              )}
            </div>

            {/* If Pending Approval and user is Sales Admin or Super Admin */}
            {order.return_request.status === 'PENDING_ADMIN_APPROVAL' && (isSalesAdmin || isSuperAdmin) && onApproveReturnRequest && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(251, 191, 36, 0.2)' }}>
                {onRejectReturnRequest && (
                  <button
                    type="button"
                    onClick={() => {
                      onRejectReturnRequest(order.id);
                      onClose();
                    }}
                    style={{
                      padding: '0.45rem 0.95rem',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.35)',
                      color: '#fb7185',
                      borderRadius: 7,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Reject Return Request
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onApproveReturnRequest(order.id);
                    onClose();
                  }}
                  style={{
                    padding: '0.45rem 1.1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: 7,
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                  title="Sale Admin approves request for physical collection by Dispatched person"
                >
                  <CheckCircle2 size={15} /> Sale Admin: Approve for Collect
                </button>
              </div>
            )}

            {order.return_request.status === 'APPROVED_FOR_COLLECTION' && (
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                <Truck size={14} /> Approved by Sale Admin — Dispatched person can now allocate vehicle and collect damaged stock.
              </div>
            )}

            {order.return_request.status === 'COLLECTED' && (
              <div style={{ fontSize: '0.78rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                <CheckCircle2 size={14} color="#a78bfa" /> Physical collection completed by Dispatched person. Vehicle: {order.return_request.vehicle_number || 'Recorded'}, Driver: {order.return_request.driver_name || 'Recorded'}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={14} color="#34d399" /> PROKAP OMS 360 Order Telemetry View
          </div>

          <div style={{ display: 'flex', gap: '0.55rem' }}>
            {onOpenEditOrder && canEditOriginalOrder && order.status !== 'CANCELLED' && !isOrderDispatchedOrBeyond(order.status) && (
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
