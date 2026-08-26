import React, { useState } from 'react';
import { Receipt, DollarSign, CheckCircle2, AlertCircle, FileText, Check, Send, X, PlusCircle } from 'lucide-react';
import { Order } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin, isCompanyAllowedForUser } from '../../lib/supabase';
import { UpdatePartyBalanceModal } from '../../components/UpdatePartyBalanceModal';

interface AccountsViewProps {
  orders: Order[];
  onGenerateInvoice?: (order: Order, invoiceNumber: string, invoiceAmount: number, creditDays: number, remark: string, issuedQtyByItem: Record<string, number>) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ orders, onGenerateInvoice }) => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const canViewAllCompanies = checkIsSuperAdmin(currentUser);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const [creditDaysInput, setCreditDaysInput] = useState<number>(30);
  const [invoiceRemark, setInvoiceRemark] = useState('');
  const [issuedQtyByItem, setIssuedQtyByItem] = useState<Record<string, number>>({});

  // Billing users see only companies mapped to their login; Super Admin / All
  // handles continue to see the complete queue through the same helper.
  const billingQueueOrders = orders
    .filter(o => o.status === 'APPROVED' || o.status === 'ACCOUNTS_APPROVED' || o.status === 'BILLED' || o.status === 'DISPATCHED' || o.status === 'PARTIALLY_DISPATCHED')
    .filter(o => canViewAllCompanies || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
    .sort((a, b) => {
      const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const weightA = priorityWeight[a.priority || 'MEDIUM'] || 2;
      const weightB = priorityWeight[b.priority || 'MEDIUM'] || 2;
      return weightB - weightA;
    });

  const handleOpenInvoiceModal = (order: Order) => {
    setSelectedOrderForInvoice(order);
    const autoInv = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setInvoiceNumberInput(autoInv);
    setCreditDaysInput(order.payment_type === 'ADVANCE' ? 0 : (order.credit_days || 30));
    setInvoiceRemark(order.remarks || '');
    setIssuedQtyByItem(Object.fromEntries((order.items || []).map(item => [item.id, item.dispatched_qty_pcs || item.total_qty_pcs])));
  };

  const handleConfirmInvoice = () => {
    if (!selectedOrderForInvoice || !invoiceNumberInput.trim()) return;

    const totalDispatchedVal = (selectedOrderForInvoice.items || []).reduce((sum, item) => sum + ((issuedQtyByItem[item.id] || 0) * item.unit_price), 0);
    const issuedQty = Object.values(issuedQtyByItem).reduce((sum, qty) => sum + qty, 0);
    if (issuedQty <= 0) return;

    if (onGenerateInvoice) {
      onGenerateInvoice(selectedOrderForInvoice, invoiceNumberInput, totalDispatchedVal, creditDaysInput, invoiceRemark, issuedQtyByItem);
    }

    addNotification({
      title: `🧾 Tax Invoice Issued: ${invoiceNumberInput}`,
      message: `Tax Invoice of ₹${totalDispatchedVal.toLocaleString()} issued for ${selectedOrderForInvoice.agency_name}. Alert sent to Dispatch Manager for delivery dispatch.`,
      event_type: 'INVOICE_GENERATED',
      order_id: selectedOrderForInvoice.id
    });

    setSelectedOrderForInvoice(null);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Accounts & Billing Console</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Tax Invoicing, GST settlement, and Party Financial Balance Ledger Management
          </p>
        </div>

        <button
          onClick={() => setIsBalanceModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.85rem',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          <DollarSign size={18} /> Update Party Financial Balance
        </button>
      </div>

      <UpdatePartyBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={() => {
          addNotification({
            title: `💰 Party Balance Updated`,
            message: `Party ledger balance and clearance status updated by Accounts Officer.`,
            event_type: 'FINANCIAL_UPDATE'
          });
        }}
      />

      <div className="data-table-container">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Billing Queue — Stock Verified Orders ({billingQueueOrders.length})</h2>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Priority Sorted (High Priority at Top)</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Priority</th>
              <th>Agency / B2B Party</th>
              <th>Payment Type</th>
              <th>Order Value (₹)</th>
              <th>Tax Invoice No</th>
              <th>Billing Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {billingQueueOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No orders pending invoicing. Orders marked In Stock in Order Approvals appear here sorted by priority.
                </td>
              </tr>
            ) : (
              billingQueueOrders.map(order => {
                const totalDispatchedVal = order.items?.reduce((sum, item) => {
                  return sum + ((item.dispatched_qty_pcs || 0) * item.unit_price);
                }, 0) || order.total_amount;

                const isBilled = order.status === 'BILLED' || !!order.invoice_number;
                const isHigh = order.priority === 'HIGH';

                return (
                  <tr key={order.id} style={{ background: isHigh ? 'rgba(244, 63, 94, 0.05)' : undefined }}>
                    <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                    <td>
                      <span className="status-badge" style={{
                        background: order.priority === 'HIGH' ? 'rgba(244, 63, 94, 0.2)' : order.priority === 'LOW' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: order.priority === 'HIGH' ? '#fb7185' : order.priority === 'LOW' ? '#34d399' : '#fbbf24',
                        fontWeight: 800
                      }}>
                        {order.priority === 'HIGH' ? '🔴 HIGH' : order.priority === 'LOW' ? '🟢 LOW' : '🟡 MEDIUM'}
                      </span>
                    </td>
                    <td><strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong></td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: order.payment_type === 'ADVANCE' ? '#34d399' : order.payment_type === 'OVERDUE' ? '#fb7185' : '#38bdf8' }}>
                        {order.payment_type || 'CREDIT'}
                      </span>
                    </td>
                    <td>₹{totalDispatchedVal.toLocaleString()}</td>
                    <td>
                      {order.invoice_number ? (
                        <code style={{ color: '#fbbf24', fontSize: '0.775rem', fontWeight: 800 }}>{order.invoice_number}</code>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Pending Invoice</span>
                      )}
                    </td>
                    <td>
                      {isBilled ? (
                        <span className="status-badge status-APPROVED" style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399' }}>
                          ✅ INVOICED
                        </span>
                      ) : (
                        <span className="status-badge status-SUBMITTED">READY FOR INVOICE</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!isBilled ? (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleOpenInvoiceModal(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Receipt size={14} /> Issue Tax Invoice
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>
                          Invoice Sent to Dispatch
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tax Invoice Generation Modal */}
      {selectedOrderForInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#34d399" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Stage 4: Issue B2B Tax Invoice & Credit Lock</h3>
              </div>
              <button onClick={() => setSelectedOrderForInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ color: '#94a3b8' }}>Party Name: <strong style={{ color: '#f8fafc' }}>{selectedOrderForInvoice.agency_name}</strong></div>
              <div style={{ color: '#94a3b8', marginTop: 3 }}>Payment Type: <strong style={{ color: '#38bdf8' }}>{selectedOrderForInvoice.payment_type || 'CREDIT'}</strong></div>
              <div style={{ color: '#94a3b8', marginTop: 3 }}>
                Dispatched Bill Value: <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>
                  ₹{(selectedOrderForInvoice.items?.reduce((sum, i) => sum + ((i.dispatched_qty_pcs || 0) * i.unit_price), 0) || selectedOrderForInvoice.total_amount).toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>ISSUED PRODUCT QUANTITY &amp; PRICE</label>
              <div style={{ border: '1px solid #334155', borderRadius: 7, overflow: 'hidden' }}>
                {(selectedOrderForInvoice.items || []).map(item => {
                  const ordered = item.total_qty_pcs || 0;
                  const issued = issuedQtyByItem[item.id] || 0;
                  return <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, alignItems: 'center', padding: '0.65rem', borderBottom: '1px solid #1e293b', fontSize: '0.75rem' }}>
                    <div><strong style={{ color: '#f8fafc' }}>{item.product_name || item.product_code || 'Product'}</strong><div style={{ color: '#94a3b8', marginTop: 2 }}>Ordered: {ordered} PCS · ₹{item.unit_price}/PCS</div></div>
                    <input type="number" min="0" max={ordered} value={issued} onChange={event => setIssuedQtyByItem(current => ({ ...current, [item.id]: Math.max(0, Math.min(ordered, Number(event.target.value) || 0)) }))} style={{ width: '100%', padding: '0.45rem', background: '#0b1120', color: '#38bdf8', border: '1px solid #475569', borderRadius: 5, fontWeight: 800 }} aria-label={`Issued quantity for ${item.product_name || 'product'}`} />
                    <strong style={{ color: '#34d399', textAlign: 'right' }}>₹{(issued * item.unit_price).toLocaleString()}</strong>
                  </div>;
                })}
              </div>
              <div style={{ textAlign: 'right', color: '#34d399', fontWeight: 900, marginTop: 6 }}>Total issued value: ₹{(selectedOrderForInvoice.items || []).reduce((sum, item) => sum + ((issuedQtyByItem[item.id] || 0) * item.unit_price), 0).toLocaleString()}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>TAX INVOICE NUMBER (Mandatory)*</label>
              <input 
                type="text" 
                value={invoiceNumberInput}
                onChange={e => setInvoiceNumberInput(e.target.value)}
                placeholder="e.g. INV-2026-9042"
                style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', marginBottom: 4 }}>CREDIT DAYS LOCK (0 for Advance Orders)</label>
              <input 
                type="number" 
                disabled={selectedOrderForInvoice.payment_type === 'ADVANCE'}
                value={creditDaysInput}
                onChange={e => setCreditDaysInput(Number(e.target.value))}
                placeholder="e.g. 15, 30, 45 Days"
                style={{ width: '100%', padding: '0.5rem', background: selectedOrderForInvoice.payment_type === 'ADVANCE' ? '#334155' : '#0f172a', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 800, fontSize: '0.85rem' }}
              />
              {selectedOrderForInvoice.payment_type === 'ADVANCE' && (
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>🔒 Advance Orders automatically locked at 0 Credit Days</span>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>BILLING REMARK</label>
              <textarea rows={2} value={invoiceRemark} onChange={event => setInvoiceRemark(event.target.value)} placeholder="Example: 4 of 5 units issued; 1 pending stock." style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedOrderForInvoice(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleConfirmInvoice} style={{ fontWeight: 800 }}>
                <CheckCircle2 size={16} /> Confirm Tax Invoice & Lock Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
