import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Building2, Store, Clock, Calendar, Truck, User, FileText, ShieldAlert, CreditCard, DollarSign, MessageSquare, Check, XCircle, RefreshCw } from 'lucide-react';
import { Order, HoldReason } from '../types';
import { MOCK_HOLD_REASONS, getOrderAccessPermission, getAgencyFinancialsByAgencyId, isCompanyAllowedForUser } from '../lib/supabase';
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
}

export const OrderApprovalModal: React.FC<OrderApprovalModalProps> = ({
  order,
  isOpen,
  onClose,
  onApprove,
  onHold,
  onReject,
  onRequestAccountsClearance,
  onApproveReturnRequest,
  onRejectReturnRequest
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const role = currentUser?.role_name || 'SALES_PERSON';
  
  const isChiragAdmin = (currentUser?.full_name || '').toLowerCase().includes('chirag');
  const isHarshadAdmin = (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const isSuperAdmin = role === 'SUPER_ADMIN' || isChiragAdmin || isHarshadAdmin;
  const isAccountsUser = role === 'ACCOUNTS' || hasPermission('order_transfer_to_billing');
  const canGrantAccountsApproval = isSuperAdmin || isAccountsUser;

  const accessPerm = order ? getOrderAccessPermission(order, currentUser) : { canExecuteActions: false, accessReason: '', isItemBrandOwner: false };
  const canApproveOrHold = isSuperAdmin || (accessPerm.canExecuteActions && (role === 'SALES_ADMIN' || role === 'ACCOUNTS' || hasPermission('order_transfer_to_billing')));

  const [selectedHoldReason, setSelectedHoldReason] = useState<string>(MOCK_HOLD_REASONS[0]?.id || '');
  const [remarks, setRemarks] = useState('');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  
  // Accounts Approval Query State
  const [queryText, setQueryText] = useState('');
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [accountsApprovalStatus, setAccountsApprovalStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');

  // Stage 2 & 3 Diagram Flow Controls
  const [paymentType, setPaymentType] = useState<'ADVANCE' | 'OVERDUE' | 'CREDIT'>(order?.payment_type || 'CREDIT');
  const [paymentReceiptNo, setPaymentReceiptNo] = useState(order?.payment_receipt_no || '');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(order?.priority || 'MEDIUM');
  const [inventoryStatus, setInventoryStatus] = useState<'IN_STOCK' | 'WAIT_FOR_STOCK'>(order?.inventory_status || 'IN_STOCK');

  if (!order || (isOpen !== undefined && !isOpen)) return null;

  const agencyFinancials = getAgencyFinancialsByAgencyId(order.agency_id);
  const availableCredit = agencyFinancials.available_credit || 0;
  const creditLimit = agencyFinancials.credit_limit || 250000;
  const currentOutstanding = agencyFinancials.current_outstanding || agencyFinancials.outstanding_amount || 0;
  const creditScore = agencyFinancials.credit_score || 90;
  const isCreditBreached = order.total_amount > availableCredit;
  const hasOverduePayment = (agencyFinancials.overdue_amount || 0) > 0;

  const handleSendAccountsQuery = () => {
    if (!queryText.trim()) return;
    
    setAccountsApprovalStatus('PENDING');
    setShowQueryPanel(false);
    
    addNotification({
      title: `Accounts Clearance Query: ${order.order_number}`,
      message: `System Admin query sent to Accounts Team. Query: "${queryText}"`,
      event_type: 'ACCOUNTS_QUERY_SENT',
      order_id: order.id
    });

    if (onRequestAccountsClearance) {
      onRequestAccountsClearance(order.id, queryText);
    }
  };

  const handleGrantAccountsApproval = () => {
    setAccountsApprovalStatus('APPROVED');
    addNotification({
      title: `Accounts Clearance Granted: ${order.order_number}`,
      message: `Accounts Admin / Chirag Sir granted credit waiver & payment clearance for ${order.agency_name}.`,
      event_type: 'ACCOUNTS_APPROVED',
      order_id: order.id
    });
  };

  const handleDeclineAccountsApproval = () => {
    setAccountsApprovalStatus('REJECTED');
    addNotification({
      title: `Accounts Clearance Declined: ${order.order_number}`,
      message: `Accounts Admin / Chirag Sir declined credit waiver for ${order.agency_name}. Order should be held or rejected.`,
      event_type: 'ACCOUNTS_REJECTED',
      order_id: order.id
    });
  };

  const handleApproveReturn = () => {
    if (!order) return;
    if (onApproveReturnRequest) {
      onApproveReturnRequest(order.id);
    }
    addNotification({
      title: `🔁 Return Request Approved: ${order.order_number}`,
      message: `System Admin approved return/replacement request. Alert sent to Dispatch Manager for inventory stock update.`,
      event_type: 'RETURN_APPROVED',
      order_id: order.id
    });
    onClose();
  };

  const handleRejectReturn = () => {
    if (!order) return;
    if (onRejectReturnRequest) {
      onRejectReturnRequest(order.id);
    }
    addNotification({
      title: `❌ Return Request Declined: ${order.order_number}`,
      message: `System Admin declined return/replacement request.`,
      event_type: 'RETURN_REJECTED',
      order_id: order.id
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 900, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Sales Order Details & Status Review
              </h2>
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
              {accountsApprovalStatus === 'APPROVED' && (
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>
                  ✅ Accounts Clearance Granted
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              Order No: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong> | Date: {order.order_date}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem', background: '#0f172a', padding: '1rem', borderRadius: 10, border: '1px solid #334155', fontSize: '0.825rem' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>COMPANY / SEGMENT</div>
            <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>{order.company_name || 'FMCG'}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>AGENCY / B2B PARTY</div>
            <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>{order.agency_name}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>BOOKED SALESPERSON</div>
            <div style={{ fontWeight: 700, color: '#34d399', marginTop: 2 }}>{order.salesperson_name || 'Amit Kumar'}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>DELIVERY TYPE</div>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>{order.delivery_type || 'F.O.R'}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>TOTAL VOLUME</div>
            <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>{order.total_box_qty} Boxes ({order.total_qty_pcs} PCS)</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>COSTING STAGE</div>
            <div style={{ fontWeight: 800, color: '#38bdf8', marginTop: 2, fontSize: '0.8rem' }}>🔒 Next Phase (Billing)</div>
          </div>
        </div>

        {/* AGENCY DETAILS & ORDER VERIFICATION BANNER */}
        <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} /> Agency Information: {order.agency_name}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>
                Territory: {order.area_name || 'Active Territory'}
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Booked Salesperson: <strong style={{ color: '#38bdf8' }}>{order.salesperson_name || 'Sales Representative'}</strong>
            </div>
          </div>
          {order.remarks && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.775rem', color: '#cbd5e1', background: '#1e293b', padding: '0.4rem 0.65rem', borderRadius: 6, border: '1px solid #334155' }}>
              <strong style={{ color: '#94a3b8' }}>Order Notes / Instructions: </strong> {order.remarks}
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>Line Items Summary</h3>
          <div className="data-table-container" style={{ maxHeight: 180, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Product Item ID</th>
                  <th>Product SKU Name</th>
                  <th>Brand / Company</th>
                  <th style={{ textAlign: 'center' }}>Admin Authority</th>
                  <th style={{ textAlign: 'center' }}>Pack Size</th>
                  <th style={{ textAlign: 'center' }}>Boxes</th>
                  <th style={{ textAlign: 'center' }}>Total Qty</th>
                  <th style={{ textAlign: 'right' }}>MRP Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const itemBrand = order.company_name || 'Priyagold';
                  const belongsToAdmin = isCompanyAllowedForUser(itemBrand, currentUser?.company_handle);
                  return (
                    <tr key={idx}>
                      <td><code style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{item.id}</code></td>
                      <td><strong style={{ color: '#f8fafc' }}>{item?.product_name || 'Product SKU'}</strong></td>
                      <td><span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>{itemBrand}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        {belongsToAdmin ? (
                          <span style={{ fontSize: '0.675rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 800 }}>
                            🟢 YOUR BRAND (ACTIONABLE)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.675rem', color: '#94a3b8', background: '#1e293b', border: '1px solid #334155', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 600 }}>
                            🔒 READ-ONLY (OTHER ADMIN)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.pcs_per_box} pcs/box</td>
                      <td style={{ textAlign: 'center' }}>{item.box_qty}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#34d399' }}>{item.total_qty_pcs}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.unit_price}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>₹{item.total_price.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Send Accounts Query Panel */}
        {showQueryPanel && (
          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid #38bdf8', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#38bdf8', marginBottom: 4 }}>
              SEND FINANCIAL CLEARANCE QUERY TO ACCOUNTS TEAM
            </label>
            <input 
              type="text" 
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              placeholder="e.g. Overdue payment waiver requested for Krishna Trading Agency due to PDC cheque submitted..."
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.825rem', marginBottom: '0.65rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowQueryPanel(false)} style={{ fontSize: '0.75rem' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendAccountsQuery} style={{ fontSize: '0.75rem' }}>
                Submit Query to Accounts
              </button>
            </div>
          </div>
        )}

        {/* Accounts Query Clearance Review Panel */}
        {accountsApprovalStatus === 'PENDING' && (
          canGrantAccountsApproval ? (
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.825rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} /> ACCOUNTS CLEARANCE APPROVAL REQUIRED (Query Pending Review)
              </div>
              <p style={{ fontSize: '0.775rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                Query submitted by System Admin: <strong style={{ color: '#f8fafc' }}>"{queryText || 'Credit limit & payment clearance waiver requested'}"</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-danger" 
                  onClick={handleDeclineAccountsApproval}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <XCircle size={14} /> Decline Waiver
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleGrantAccountsApproval}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <Check size={14} /> Grant Accounts Clearance Waiver (Accounts / Chirag Sir)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid #38bdf8', borderRadius: 8, padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.775rem', color: '#38bdf8', fontWeight: 700 }}>
                Query Pending Accounts Approval: Query sent to Accounts Team & Chirag Sir. Only Accounts personnel or Chirag Sir have authority to grant clearance waiver.
              </span>
            </div>
          )
        )}

        {/* Accounts Rejected Notice */}
        {accountsApprovalStatus === 'REJECTED' && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', borderRadius: 8, padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={16} color="#f43f5e" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.775rem', color: '#f43f5e', fontWeight: 700 }}>
              ❌ Accounts Clearance Declined: Accounts Team / Chirag Sir declined credit waiver for this order. System Admin should hold or reject order.
            </span>
          </div>
        )}

        {/* Post-Delivery Return & Replacement Approval Panel */}
        {order.return_request && order.return_request.status === 'PENDING_ADMIN_APPROVAL' && (
          <div style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid #fbbf24', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#fbbf24', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={16} /> POST-DELIVERY {order.return_request.return_type === 'REPLACEMENT' ? 'STOCK REPLACEMENT' : 'DAMAGED GOODS RETURN'} REQUEST PENDING APPROVAL
            </div>
            <p style={{ fontSize: '0.775rem', color: '#cbd5e1', marginBottom: '0.65rem' }}>
              Requested by Salesperson: <strong style={{ color: '#f8fafc' }}>{order.return_request.requested_by_name}</strong> | Reason: <em>"{order.return_request.reason}"</em>
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={handleRejectReturn} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                Decline Request
              </button>
              <button className="btn btn-success" onClick={handleApproveReturn} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}>
                <Check size={14} /> Approve Return/Replacement & Transfer to Dispatch Manager
              </button>
            </div>
          </div>
        )}

        {/* Hold Panel if selected */}
        {showHoldPanel && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>SELECT REASON FOR HOLDING ORDER</label>
            <select 
              value={selectedHoldReason}
              onChange={e => setSelectedHoldReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.825rem' }}
            >
              {MOCK_HOLD_REASONS.map(r => (
                <option key={r.id} value={r.id}>{r.reason_description} ({r.reason_code})</option>
              ))}
            </select>
            <input 
              type="text" 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter hold remarks for Salesperson & Field Exec..."
              style={{ width: '100%', padding: '0.45rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.8rem' }}
            />
          </div>
        )}

        {/* Stage 2 & Stage 3 Operational Audit Panel */}
        {canApproveOrHold && (
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              
              {/* Stage 2: Payment Type Gate */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: 4 }}>
                  STAGE 2: PAYMENT TYPE GATE
                </label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value as any)}
                  style={{ width: '100%', padding: '0.45rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  <option value="ADVANCE">Advance Payment (Sales Admin Approved)</option>
                  <option value="OVERDUE">Overdue Payment (Harshad Sir Approval)</option>
                  <option value="CREDIT">Credit Order (Harshad / Chirag Sir Approval)</option>
                </select>
                {paymentType === 'ADVANCE' && (
                  <input
                    type="text"
                    placeholder="Enter Payment Receipt No. (Mandatory)*"
                    value={paymentReceiptNo}
                    onChange={e => setPaymentReceiptNo(e.target.value)}
                    style={{ width: '100%', marginTop: 6, padding: '0.4rem 0.5rem', background: '#1e293b', border: paymentReceiptNo ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: 6, color: '#f8fafc', fontSize: '0.775rem' }}
                  />
                )}
              </div>

              {/* Stage 3: Order Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>
                  STAGE 3: ROUTING PRIORITY
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  style={{ width: '100%', padding: '0.45rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  <option value="HIGH">🔴 High Priority (Pinned at top of Billing)</option>
                  <option value="MEDIUM">🟡 Medium Priority</option>
                  <option value="LOW">🟢 Low Priority</option>
                </select>
              </div>

              {/* Stage 3: Inventory Stock Audit */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', marginBottom: 4 }}>
                  INVENTORY AUDIT ACTION
                </label>
                <select
                  value={inventoryStatus}
                  onChange={e => setInventoryStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '0.45rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  <option value="IN_STOCK">✅ Physical Stock Available (Approve for Billing)</option>
                  <option value="WAIT_FOR_STOCK">⏳ Out of Stock (Wait for Stock — Alert Salesman)</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          {!canApproveOrHold ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', border: '1px solid #334155', padding: '0.5rem 0.85rem', borderRadius: 6, fontSize: '0.775rem', color: '#fbbf24' }}>
              <ShieldAlert size={16} color="#fbbf24" />
              <span>
                {!accessPerm.canExecuteActions 
                  ? accessPerm.accessReason 
                  : 'Salesperson View Mode: Approve, Hold & Rejection authority is handled by System Admin.'
                }
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              
              {/* Send Accounts Query Button */}
              {!showQueryPanel && (
                <button 
                  className="btn btn-outline" 
                  onClick={() => setShowQueryPanel(true)}
                  style={{ borderColor: '#38bdf8', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <MessageSquare size={15} /> Send Accounts Query
                </button>
              )}

              {/* Reject Button */}
              <button className="btn btn-danger" onClick={() => onReject(order.id, remarks)}>
                Reject Order
              </button>

              {/* Hold Button */}
              {!showHoldPanel ? (
                <button className="btn btn-warning" onClick={() => setShowHoldPanel(true)}>
                  <AlertTriangle size={16} /> Hold Order
                </button>
              ) : (
                <button className="btn btn-warning" onClick={() => onHold(order.id, selectedHoldReason, remarks)}>
                  Confirm Hold
                </button>
              )}

              {/* Approve Button */}
              <button 
                className="btn btn-success" 
                onClick={() => onApprove(order.id, remarks, { payment_type: paymentType, payment_receipt_no: paymentReceiptNo, priority, inventory_status: inventoryStatus })}
              >
                <CheckCircle size={16} /> {inventoryStatus === 'WAIT_FOR_STOCK' ? 'Set Wait for Stock & Alert Salesman' : 'Approve & Route to Billing/Dispatch'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
