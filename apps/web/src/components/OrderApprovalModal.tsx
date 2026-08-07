import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert, FileText } from 'lucide-react';
import { MOCK_AGENCY_FINANCIALS, MOCK_HOLD_REASONS } from '../lib/supabase';
import { Order } from '../types';

interface OrderApprovalModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (orderId: string, remarks: string) => void;
  onHold: (orderId: string, holdReasonId: string, remarks: string) => void;
  onReject: (orderId: string, remarks: string) => void;
}

export const OrderApprovalModal: React.FC<OrderApprovalModalProps> = ({
  order,
  isOpen,
  onClose,
  onApprove,
  onHold,
  onReject
}) => {
  const [selectedHoldReason, setSelectedHoldReason] = useState(MOCK_HOLD_REASONS[0].id);
  const [remarks, setRemarks] = useState('');
  const [showHoldPanel, setShowHoldPanel] = useState(false);

  if (!isOpen || !order) return null;

  const financials = MOCK_AGENCY_FINANCIALS[order.agency_id] || {
    agency_id: order.agency_id,
    outstanding_amount: 125000,
    overdue_amount: 35000,
    advance_amount: 20000,
    oldest_overdue_days: 18
  };

  const creditLimit = 250000;
  const availableCredit = creditLimit - financials.outstanding_amount;
  const isCreditExceeded = availableCredit < order.total_amount;
  const hasOverdue = financials.overdue_amount > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>System Admin Account Check</h2>
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Order: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong> | Date: {order.order_date}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Agency & Order Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: '#0f172a', padding: '1rem', borderRadius: 8, border: '1px solid #334155' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>AGENCY / PARTY DETAILS</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>{order.agency_name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Segment: {order.company_name} | Delivery: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{order.delivery_type || 'F.O.R'}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>SALESPERSON & ASM</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sales: {order.salesperson_name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ASM: {order.asm_id ? 'Sunil Kapoor' : 'Unassigned'}</div>
          </div>
        </div>

        {/* Financial Risk Assessment Card */}
        <div style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 800, fontSize: '0.95rem' }}>
              <ShieldAlert size={18} />
              <span>FINANCIAL ACCOUNT ASSESSMENT</span>
            </div>
            {(hasOverdue || isCreditExceeded) && (
              <span style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                RISK WARNING DETECTED
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 6, border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>OUTSTANDING</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>₹{financials.outstanding_amount.toLocaleString()}</div>
            </div>

            <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 6, border: hasOverdue ? '1px solid #f43f5e' : '1px solid #334155' }}>
              <div style={{ fontSize: '0.7rem', color: hasOverdue ? '#f43f5e' : '#94a3b8', fontWeight: 700 }}>OVERDUE AMOUNT</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: hasOverdue ? '#fb7185' : '#f8fafc' }}>
                ₹{financials.overdue_amount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({financials.oldest_overdue_days} Days Overdue)</div>
            </div>

            <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 6, border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>CREDIT LIMIT</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>₹{creditLimit.toLocaleString()}</div>
              <div style={{ fontSize: '0.65rem', color: availableCredit >= 0 ? '#34d399' : '#f43f5e' }}>
                Avail: ₹{availableCredit.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Snapshot */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#94a3b8' }}>ORDER ITEMS SNAPSHOT</div>
          <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #334155', borderRadius: 6 }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Box Qty</th>
                  <th>Loose PCS</th>
                  <th>Total PCS</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>ID: {item.id} {item.remark ? `| Note: ${item.remark}` : ''}</div>
                    </td>
                    <td>{item.box_qty}</td>
                    <td>{item.loose_pcs}</td>
                    <td><strong style={{ color: '#34d399' }}>{item.total_qty_pcs}</strong></td>
                    <td>₹{item.total_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hold Reason selection panel if Hold clicked */}
        {showHoldPanel && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: 8, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.5rem' }}>
              SELECT MANDATORY HOLD REASON
            </div>
            <select 
              value={selectedHoldReason}
              onChange={e => setSelectedHoldReason(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, marginBottom: '0.75rem' }}
            >
              {MOCK_HOLD_REASONS.map(r => (
                <option key={r.id} value={r.id}>{r.reason_description} ({r.reason_code})</option>
              ))}
            </select>
            <input 
              type="text" 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter hold remarks for Salesperson & ASM..."
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-danger" onClick={() => onReject(order.id, remarks)}>
              Reject Order
            </button>

            {!showHoldPanel ? (
              <button className="btn btn-warning" onClick={() => setShowHoldPanel(true)}>
                <AlertTriangle size={16} /> Hold Order
              </button>
            ) : (
              <button className="btn btn-warning" onClick={() => onHold(order.id, selectedHoldReason, remarks)}>
                Confirm Hold
              </button>
            )}

            <button className="btn btn-success" onClick={() => onApprove(order.id, remarks)}>
              <CheckCircle size={16} /> Approve Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
