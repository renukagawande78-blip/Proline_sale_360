import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, ShieldAlert, ShieldCheck, Check, XCircle, RefreshCw, Lock, Unlock, User, Edit } from 'lucide-react';
import { Order, HoldReason } from '../types';
import { MOCK_HOLD_REASONS, getOrderAccessPermission, getAgencyFinancialsByAgencyId } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface OrderApprovalModalProps {
  order: Order | null;
  isOpen?: boolean;
  onClose: () => void;
  onApprove: (orderId: string, remarks: string, approvalDetails?: any) => void;
  onHold: (orderId: string, reasonId: string, remarks: string) => void;
  onReject: (orderId: string, remarks: string) => void;
  onRequestAccountsClearance?: (orderId: string, queryMsg: string) => void;
  onApproveReturnRequest?: (orderId: string) => void;
  onRejectReturnRequest?: (orderId: string) => void;
  onOpenEditOrder?: (order: Order) => void;
}

export const OrderApprovalModal: React.FC<OrderApprovalModalProps> = ({
  order, isOpen, onClose, onApprove, onHold, onReject,
  onRequestAccountsClearance, onApproveReturnRequest, onRejectReturnRequest,
  onOpenEditOrder
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const isSuperAdmin = role === 'SUPER_ADMIN'
    || (currentUser?.full_name || '').toLowerCase().includes('chirag')
    || (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const isSalesAdmin = role === 'SALES_ADMIN';

  const accessPerm = order ? getOrderAccessPermission(order, currentUser) : { canExecuteActions: false, accessReason: '', isItemBrandOwner: false };

  const [selectedHoldReason, setSelectedHoldReason] = useState<string>(MOCK_HOLD_REASONS[0]?.id || '');
  const [salesAdminRemarks, setSalesAdminRemarks] = useState('');
  const [superAdminRemarks, setSuperAdminRemarks] = useState('');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  const [paymentType, setPaymentType] = useState<'ADVANCE' | 'OVERDUE' | 'CREDIT'>(order?.payment_type || 'CREDIT');
  const [paymentReceiptNo, setPaymentReceiptNo] = useState(order?.payment_receipt_no || '');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(order?.priority || 'MEDIUM');
  const [inventoryStatus, setInventoryStatus] = useState<'IN_STOCK' | 'WAIT_FOR_STOCK'>(order?.inventory_status || 'IN_STOCK');

  if (!order || (isOpen !== undefined && !isOpen)) return null;

  const salesAdminSigned = !!order.sales_admin_approved;
  const superAdminSigned = !!order.superadmin_approved;
  const bothApproved = salesAdminSigned && superAdminSigned;
  const waitingForSuperAdmin = salesAdminSigned && !superAdminSigned && order.status === 'SALES_ADMIN_APPROVED';

  const fmtDate = (d?: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const handleApproveReturn = () => {
    if (onApproveReturnRequest) onApproveReturnRequest(order.id);
    addNotification({ title: 'Return Approved: ' + order.order_number, message: 'Return approved. Dispatch alerted.', event_type: 'RETURN_APPROVED', order_id: order.id });
    onClose();
  };
  const handleRejectReturn = () => {
    if (onRejectReturnRequest) onRejectReturnRequest(order.id);
    addNotification({ title: 'Return Declined: ' + order.order_number, message: 'Return declined.', event_type: 'RETURN_REJECTED', order_id: order.id });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 980, width: '96vw', maxHeight: '93vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Order Review — Stage 2: Dual Approval Gate
              </h2>
              <span className={'status-badge status-' + order.status}>{order.status}</span>
              {bothApproved && <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>✅ Both Approvals Complete</span>}
              {waitingForSuperAdmin && <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>🔔 Awaiting Super Admin Final Sign-off</span>}
              {onOpenEditOrder && (isSalesAdmin || isSuperAdmin) && order.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditOrder(order);
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    borderRadius: 6,
                    color: '#38bdf8',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                  title="Edit Order"
                >
                  <Edit size={13} /> Edit Order
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 3 }}>
              Order: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong>
              &nbsp;|&nbsp; Date: {fmtDate(order.order_date)}
              &nbsp;|&nbsp; Brand: <strong style={{ color: '#fbbf24' }}>{order.company_name}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>

        {/* Order Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem', background: '#0f172a', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid #334155' }}>
          {[
            { label: 'AGENCY / PARTY', value: order.agency_name, color: '#38bdf8' },
            { label: 'TERRITORY', value: order.area_name || '—', color: '#94a3b8' },
            { label: 'SALESPERSON', value: order.salesperson_name || 'Sales Rep', color: '#34d399' },
            { label: 'DELIVERY', value: order.delivery_type || 'F.O.R', color: '#fbbf24' },
            { label: 'TOTAL BOXES', value: order.total_box_qty + ' Boxes', color: '#f8fafc' },
            { label: 'TOTAL PCS', value: order.total_qty_pcs + ' PCS', color: '#38bdf8' },
            { label: 'LOOSE PCS', value: (order.total_loose_pcs || 0) + ' PCS', color: '#94a3b8' },
          ].map(function(item) {
            return (
              <div key={item.label}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontWeight: 700, color: item.color, fontSize: '0.825rem' }}>{item.value}</div>
              </div>
            );
          })}
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={14} /> Line Items
          </h3>
          <div className="data-table-container" style={{ maxHeight: 170, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.775rem' }}>
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Brand</th>
                  <th style={{ textAlign: 'center' }}>Pack</th>
                  <th style={{ textAlign: 'center' }}>Boxes</th>
                  <th style={{ textAlign: 'center' }}>Total PCS</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map(function(item, idx) {
                  return (
                    <tr key={idx}>
                      <td><strong style={{ color: '#f8fafc' }}>{item.product_name || 'Product'}</strong></td>
                      <td><span style={{ color: '#fbbf24', fontWeight: 700 }}>{order.company_name}</span></td>
                      <td style={{ textAlign: 'center' }}>{item.pcs_per_box} pcs/box</td>
                      <td style={{ textAlign: 'center' }}>{item.box_qty}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#34d399' }}>{item.total_qty_pcs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DUAL APPROVAL GATE */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
              Stage 2 Dual-Review Gate — Both Sign-offs Required Before Billing
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>

            {/* Card 1: Sales Admin */}
            <div style={{
              background: salesAdminSigned ? 'rgba(16,185,129,0.07)' : 'rgba(56,189,248,0.05)',
              border: salesAdminSigned ? '1.5px solid #10b981' : '1.5px solid #475569',
              borderRadius: 12, padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} color={salesAdminSigned ? '#10b981' : '#94a3b8'} />
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: salesAdminSigned ? '#34d399' : '#f8fafc' }}>
                    1 — SALES ADMIN SIGN-OFF
                  </span>
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  color: salesAdminSigned ? '#34d399' : '#fb923c',
                  background: salesAdminSigned ? 'rgba(52,211,153,0.15)' : 'rgba(234,88,12,0.15)',
                  border: '1px solid ' + (salesAdminSigned ? 'rgba(52,211,153,0.3)' : 'rgba(234,88,12,0.3)'),
                  padding: '0.15rem 0.5rem', borderRadius: 20
                }}>
                  {salesAdminSigned ? '✅ SIGNED' : '⏳ PENDING'}
                </span>
              </div>

              {salesAdminSigned ? (
                <div style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <div style={{ color: '#34d399', fontWeight: 700, marginBottom: 2 }}>{order.sales_admin_approved_by}</div>
                  <div>Signed at: {order.sales_admin_approved_at}</div>
                  {order.sales_admin_remarks && <div style={{ marginTop: 4, fontStyle: 'italic', color: '#cbd5e1' }}>"{order.sales_admin_remarks}"</div>}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
                    Assigned to: <strong style={{ color: '#f8fafc' }}>Dixit / Jay / Sumit</strong> (Sales Admin for {order.company_name})
                  </div>
                  {(isSalesAdmin || isSuperAdmin) && (order.status === 'SUBMITTED' || order.status === 'HELD') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <select value={paymentType} onChange={function(e) { setPaymentType(e.target.value as any); }}
                        style={{ padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', fontWeight: 600 }}>
                        <option value="CREDIT">💳 Credit Order (Standard)</option>
                        <option value="ADVANCE">💰 Advance Payment</option>
                        <option value="OVERDUE">⚠️ Overdue (Needs Clearance)</option>
                      </select>
                      {paymentType === 'ADVANCE' && (
                        <input type="text" placeholder="Payment Receipt No. (mandatory)*" value={paymentReceiptNo}
                          onChange={function(e) { setPaymentReceiptNo(e.target.value); }}
                          style={{ padding: '0.4rem 0.5rem', background: '#0f172a', border: paymentReceiptNo ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: 6, color: '#f8fafc', fontSize: '0.775rem' }} />
                      )}
                      <select value={priority} onChange={function(e) { setPriority(e.target.value as any); }}
                        style={{ padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', fontWeight: 600 }}>
                        <option value="HIGH">🔴 High Priority (Top of Billing Queue)</option>
                        <option value="MEDIUM">🟡 Medium Priority</option>
                        <option value="LOW">🟢 Low Priority</option>
                      </select>
                      <select value={inventoryStatus} onChange={function(e) { setInventoryStatus(e.target.value as any); }}
                        style={{ padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', fontWeight: 600 }}>
                        <option value="IN_STOCK">✅ Stock Available — Approve for Billing</option>
                        <option value="WAIT_FOR_STOCK">⏳ Wait for Stock — Alert Salesman</option>
                      </select>
                      <input type="text" placeholder="Sales Admin remarks (optional)..." value={salesAdminRemarks}
                        onChange={function(e) { setSalesAdminRemarks(e.target.value); }}
                        style={{ padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem' }} />
                      {isSalesAdmin && (
                        <button className="btn btn-primary"
                          style={{ fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                          onClick={function() { onApprove(order.id, salesAdminRemarks, { payment_type: paymentType, payment_receipt_no: paymentReceiptNo, priority: priority, inventory_status: inventoryStatus }); }}>
                          <CheckCircle size={14} />
                          {inventoryStatus === 'WAIT_FOR_STOCK' ? 'Flag: Wait for Stock' : 'Sales Admin Sign-off ✓'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Super Admin */}
            <div style={{
              background: superAdminSigned ? 'rgba(99,102,241,0.09)' : waitingForSuperAdmin ? 'rgba(251,191,36,0.07)' : 'rgba(99,102,241,0.03)',
              border: superAdminSigned ? '1.5px solid #6366f1' : waitingForSuperAdmin ? '1.5px solid #f59e0b' : '1.5px solid #475569',
              borderRadius: 12, padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={15} color={superAdminSigned ? '#818cf8' : waitingForSuperAdmin ? '#fbbf24' : '#64748b'} />
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: superAdminSigned ? '#818cf8' : waitingForSuperAdmin ? '#fbbf24' : '#94a3b8' }}>
                    2 — SUPER ADMIN FINAL SIGN-OFF
                  </span>
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  color: superAdminSigned ? '#818cf8' : waitingForSuperAdmin ? '#fbbf24' : '#64748b',
                  background: superAdminSigned ? 'rgba(99,102,241,0.15)' : waitingForSuperAdmin ? 'rgba(245,158,11,0.15)' : '#1e293b',
                  border: '1px solid ' + (superAdminSigned ? 'rgba(99,102,241,0.3)' : waitingForSuperAdmin ? 'rgba(245,158,11,0.3)' : '#334155'),
                  padding: '0.15rem 0.5rem', borderRadius: 20
                }}>
                  {superAdminSigned ? '✅ APPROVED' : waitingForSuperAdmin ? '🔔 AWAITING' : '🔒 LOCKED'}
                </span>
              </div>

              {superAdminSigned ? (
                <div style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <div style={{ color: '#818cf8', fontWeight: 700, marginBottom: 2 }}>{order.superadmin_approved_by}</div>
                  <div>Final sign-off at: {order.superadmin_approved_at}</div>
                  {order.superadmin_remarks && <div style={{ marginTop: 4, fontStyle: 'italic', color: '#cbd5e1' }}>"{order.superadmin_remarks}"</div>}
                </div>
              ) : isSuperAdmin ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {waitingForSuperAdmin && (
                    <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, padding: '0.35rem 0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: 6, marginBottom: 2 }}>
                      🔔 Sales Admin signed off. Your final approval routes order to Billing.
                    </div>
                  )}
                  {!salesAdminSigned && (
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginBottom: 2 }}>
                      Sales Admin has not signed yet. You may approve directly or wait.
                    </div>
                  )}
                  {!salesAdminSigned && (
                    <>
                      <select value={priority} onChange={function(e) { setPriority(e.target.value as any); }}
                        style={{ padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', fontWeight: 600 }}>
                        <option value="HIGH">🔴 High Priority</option>
                        <option value="MEDIUM">🟡 Medium Priority</option>
                        <option value="LOW">🟢 Low Priority</option>
                      </select>
                      <select value={inventoryStatus} onChange={function(e) { setInventoryStatus(e.target.value as any); }}
                        style={{ padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', fontWeight: 600 }}>
                        <option value="IN_STOCK">✅ Stock Available</option>
                        <option value="WAIT_FOR_STOCK">⏳ Wait for Stock</option>
                      </select>
                    </>
                  )}
                  <input type="text" placeholder="Super Admin remarks (optional)..." value={superAdminRemarks}
                    onChange={function(e) { setSuperAdminRemarks(e.target.value); }}
                    style={{ padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #6366f1', borderRadius: 6, color: 'white', fontSize: '0.775rem' }} />
                  {order.status !== 'HELD' && order.status !== 'APPROVED' && order.status !== 'CANCELLED' && (
                    <button className="btn btn-success"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                      onClick={function() { onApprove(order.id, superAdminRemarks, { payment_type: paymentType, payment_receipt_no: paymentReceiptNo, priority: priority, inventory_status: inventoryStatus }); }}>
                      <ShieldCheck size={14} />
                      {inventoryStatus === 'WAIT_FOR_STOCK' ? 'Set Wait for Stock' : salesAdminSigned ? 'Final Approval ✓ (Route to Billing)' : 'Approve Directly (Super Admin)'}
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 4 }}>Authority: <strong style={{ color: '#f8fafc' }}>Chirag Sir / Harshad Sir</strong></div>
                  <div>{salesAdminSigned ? '✅ Sales Admin signed. Awaiting Super Admin final sign-off.' : '🔒 Locked until Sales Admin completes Stage 2a sign-off.'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '0.85rem', background: '#0f172a', borderRadius: 8, padding: '0.7rem 0.9rem', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: 7, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: bothApproved ? '100%' : salesAdminSigned ? '50%' : '0%',
                  background: bothApproved ? 'linear-gradient(90deg,#10b981,#6366f1)' : 'linear-gradient(90deg,#38bdf8,#10b981)',
                  borderRadius: 4, transition: 'width 0.45s ease'
                }} />
              </div>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, whiteSpace: 'nowrap',
                color: bothApproved ? '#34d399' : salesAdminSigned ? '#fbbf24' : '#94a3b8' }}>
                {bothApproved ? '✅ Both Approved — Ready for Billing (Stage 4)' : salesAdminSigned ? '1 of 2 — Awaiting Super Admin' : '0 of 2 — Pending Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Hold Freeze Banner */}
        {order.status === 'HELD' && (
          <div style={{ background: 'rgba(245,158,11,0.15)', border: '1.5px solid #f59e0b', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.85rem' }}>ORDER ON HOLD — ALL ACTIVITIES FROZEN</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>Reason: <strong>{order.hold_reason || 'Admin directive'}</strong>. Only Super Admin can release hold to resume workflow.</div>
            </div>
          </div>
        )}

        {/* Return Request Panel */}
        {order.return_request?.status === 'PENDING_ADMIN_APPROVAL' && (
          <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#fbbf24', marginBottom: 4 }}>🔁 RETURN / REPLACEMENT REQUEST PENDING</div>
            <p style={{ fontSize: '0.775rem', color: '#cbd5e1', marginBottom: '0.65rem' }}>By: <strong>{order.return_request.requested_by_name}</strong> — "{order.return_request.reason}"</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={handleRejectReturn} style={{ fontSize: '0.75rem' }}>Decline</button>
              <button className="btn btn-success" onClick={handleApproveReturn} style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                <Check size={13} /> Approve & Transfer to Dispatch
              </button>
            </div>
          </div>
        )}

        {/* Hold Reason Input */}
        {showHoldPanel && (
          <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>SELECT HOLD REASON</label>
            <select value={selectedHoldReason} onChange={function(e) { setSelectedHoldReason(e.target.value); }}
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              {MOCK_HOLD_REASONS.map(function(r) { return <option key={r.id} value={r.id}>{r.reason_description} ({r.reason_code})</option>; })}
            </select>
            <input type="text" value={superAdminRemarks} onChange={function(e) { setSuperAdminRemarks(e.target.value); }}
              placeholder="Hold remarks for salesperson..."
              style={{ width: '100%', padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem' }} />
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700 }}>
            {isSuperAdmin
              ? <span style={{ color: '#818cf8' }}>👑 Super Admin — Hold Authority & Final Sign-off Power</span>
              : isSalesAdmin
                ? <span style={{ color: '#34d399' }}>🏢 Sales Admin — Stage 2a Sign-off Authority</span>
                : <span style={{ color: '#fbbf24' }}><ShieldAlert size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Read-Only — Approval by Sales Admin & Super Admin</span>
            }
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            {onOpenEditOrder && (isSalesAdmin || isSuperAdmin) && order.status !== 'CANCELLED' && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onClose();
                  onOpenEditOrder(order);
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
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
            {order.status === 'WAIT_FOR_STOCK' && bothApproved && (isSalesAdmin || isSuperAdmin) && (
              <button
                className="btn btn-success"
                onClick={function() {
                  onApprove(order.id, 'Stock received and marked ready for billing', {
                    stockReady: true,
                    inventory_status: 'IN_STOCK',
                    priority: order.priority || priority
                  });
                }}
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontSize: '0.8rem', fontWeight: 800 }}
              >
                <RefreshCw size={14} /> Mark Stock Ready &amp; Send to Billing
              </button>
            )}
            {(isSalesAdmin || isSuperAdmin) && order.status !== 'APPROVED' && order.status !== 'COMPLETED' && (
              <button className="btn btn-danger" onClick={function() { onReject(order.id, superAdminRemarks || salesAdminRemarks); }} style={{ fontSize: '0.8rem' }}>
                <XCircle size={14} /> Reject Order
              </button>
            )}
            {isSuperAdmin && (
              order.status === 'HELD' ? (
                <button className="btn btn-success"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontSize: '0.8rem' }}
                  onClick={function() { onApprove(order.id, 'Hold released by Super Admin', { payment_type: paymentType, priority: priority, inventory_status: inventoryStatus }); }}>
                  <Unlock size={14} /> Release Hold & Resume
                </button>
              ) : !showHoldPanel ? (
                <button className="btn btn-warning" onClick={function() { setShowHoldPanel(true); }} style={{ fontSize: '0.8rem' }}>
                  <Lock size={14} /> Hold Order (Super Admin)
                </button>
              ) : (
                <button className="btn btn-warning" onClick={function() { onHold(order.id, selectedHoldReason, superAdminRemarks); }} style={{ fontSize: '0.8rem' }}>
                  Confirm Hold
                </button>
              )
            )}
            {order.status === 'APPROVED' && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8 }}>
                <CheckCircle size={14} /> Fully Approved — In Billing Queue (Stage 4)
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
