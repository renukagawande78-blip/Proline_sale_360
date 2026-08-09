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
  onApprove: (orderId: string, remarks: string) => void;
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
  
  const accessPerm = order ? getOrderAccessPermission(order, currentUser) : { canExecuteActions: false, accessReason: '', isItemBrandOwner: false };
  const canApproveOrHold = accessPerm.canExecuteActions && (role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN' || role === 'SALES_ADMIN' || role === 'ACCOUNTS' || hasPermission('order_transfer_to_billing'));

  const [selectedHoldReason, setSelectedHoldReason] = useState<string>(MOCK_HOLD_REASONS[0].id);
  const [remarks, setRemarks] = useState('');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  
  // Accounts Approval Query State
  const [queryText, setQueryText] = useState('');
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [accountsApprovalStatus, setAccountsApprovalStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');

  if (!order || (isOpen !== undefined && !isOpen)) return null;

  const agencyFinancials = getAgencyFinancialsByAgencyId(order.agency_id);
  const availableCredit = agencyFinancials.available_credit || 0;
  const creditLimit = agencyFinancials.credit_limit || 250000;
  const currentOutstanding = agencyFinancials.current_outstanding || agencyFinancials.outstanding_amount || 0;
  const creditScore = agencyFinancials.credit_score || 90;
  const isCreditBreached = order.total_amount > availableCredit;
  const hasOverduePayment = (agencyFinancials.overdue_amount || 0) > 0;

  const isChiragAdmin = (currentUser?.full_name || '').toLowerCase().includes('chirag');
  const isAccountsUser = role === 'ACCOUNTS' || hasPermission('order_transfer_to_billing');
  const canGrantAccountsApproval = isChiragAdmin || isAccountsUser || role === 'SUPER_ADMIN';

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
            <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>{order.total_box_qty} Boxes / {order.total_loose_pcs} Loose ({order.total_qty_pcs} PCS)</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem', fontWeight: 700 }}>GROSS ORDER AMOUNT</div>
            <div style={{ fontWeight: 900, color: '#34d399', marginTop: 2, fontSize: '0.95rem' }}>₹{order.total_amount.toLocaleString()}</div>
          </div>
        </div>

        {/* AGENCY FINANCIAL HEALTH & LIVE CREDIT LINE DETAILS */}
        <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} /> Agency Financial Analysis & Ledger ({order.agency_name})
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>
                Type: {agencyFinancials.account_type || 'Sundry Debtors-Electronics'}
              </span>
            </div>

            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '0.2rem 0.55rem', borderRadius: 6 }}>
              Credit Score: {creditScore}/100
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#1e293b', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 700 }}>CREDIT LIMIT</div>
              <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>₹{creditLimit.toLocaleString()}</div>
            </div>

            <div style={{ background: '#1e293b', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 700 }}>OUTSTANDING BAL</div>
              <div style={{ fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>₹{currentOutstanding.toLocaleString()}</div>
            </div>

            <div style={{ background: '#1e293b', padding: '0.65rem', borderRadius: 8, border: hasOverduePayment ? '1px solid #f43f5e' : '1px solid #334155' }}>
              <div style={{ fontSize: '0.675rem', color: hasOverduePayment ? '#f43f5e' : '#94a3b8', fontWeight: 700 }}>OVERDUE (&gt; 30 DAYS)</div>
              <div style={{ fontWeight: 800, color: hasOverduePayment ? '#f43f5e' : '#34d399', marginTop: 2 }}>
                ₹{(agencyFinancials.overdue_amount || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.675rem', color: '#34d399', fontWeight: 700 }}>ADVANCE DEPOSIT</div>
              <div style={{ fontWeight: 800, color: '#34d399', marginTop: 2 }}>₹{(agencyFinancials.advance_amount || 0).toLocaleString()}</div>
            </div>

            <div style={{ background: '#1e293b', padding: '0.65rem', borderRadius: 8, border: isCreditBreached ? '1px solid #f59e0b' : '1px solid #334155' }}>
              <div style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 700 }}>AVAILABLE CREDIT</div>
              <div style={{ fontWeight: 800, color: isCreditBreached ? '#f59e0b' : '#34d399', marginTop: 2 }}>
                ₹{availableCredit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Accounts Audit Notes, Officer & Timestamp */}
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '0.65rem 0.85rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#94a3b8' }}>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>ACCOUNTS UPDATE REMARK:</span>
              <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
                Updated by <strong>{agencyFinancials.updated_by_name || 'Accounts Officer'}</strong> at {agencyFinancials.updated_at ? new Date(agencyFinancials.updated_at).toLocaleString() : 'Recent Session'}
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: '#e2e8f0', margin: 0, fontStyle: 'italic' }}>
              "{agencyFinancials.remarks || 'Account active & verified'}"
            </p>
          </div>

          {(isCreditBreached || hasOverduePayment) && (
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, padding: '0.65rem', marginTop: '0.75rem', fontSize: '0.775rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
              <span>
                {isCreditBreached && `Order total (₹${order.total_amount.toLocaleString()}) exceeds Available Credit (₹${availableCredit.toLocaleString()}). `}
                {hasOverduePayment && `Agency has ₹${(agencyFinancials.overdue_amount || 0).toLocaleString()} overdue beyond 30 days terms. `}
                Send query to Accounts for clearance waiver before final approval.
              </span>
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
                  <th style={{ textAlign: 'center' }}>Loose PCS</th>
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
                      <td><strong style={{ color: '#f8fafc' }}>{item.product_name}</strong></td>
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
                      <td style={{ textAlign: 'center' }}>{item.loose_pcs}</td>
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
              <button className="btn btn-success" onClick={() => onApprove(order.id, remarks)}>
                <CheckCircle size={16} /> Approve & Transfer to Dispatch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
