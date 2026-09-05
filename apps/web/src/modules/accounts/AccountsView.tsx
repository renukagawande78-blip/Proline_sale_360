import React, { useState } from 'react';
import { Receipt, DollarSign, CheckCircle2, X, Truck } from 'lucide-react';
import { Order } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin, isCompanyAllowedForUser } from '../../lib/supabase';
import { UpdatePartyBalanceModal } from '../../components/UpdatePartyBalanceModal';

interface AccountsViewProps {
  orders: Order[];
  onGenerateInvoice?: (order: Order, invoiceNumber: string, billingTotalQty: number, invoiceAmount: number, creditDays: number, remark: string, billedQtyByItem: Record<string, number>) => void;
  onCompleteGrn?: (orderId: string, grnNumber: string, grnDate: string, grnValue: number, grnRemark: string) => void;
  onViewInvoice?: (order: Order) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ orders, onGenerateInvoice, onCompleteGrn, onViewInvoice }) => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const canViewAllCompanies = checkIsSuperAdmin(currentUser) || !currentUser?.company_handle || currentUser?.company_handle === 'All';
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const [creditDaysInput, setCreditDaysInput] = useState<number>(30);
  const [billingTotalQtyInput, setBillingTotalQtyInput] = useState<number>(0);
  const [billingAmountInput, setBillingAmountInput] = useState<number>(0);
  const [invoiceRemark, setInvoiceRemark] = useState('');
  const [billedQtyByItem, setBilledQtyByItem] = useState<Record<string, number>>({});
  const [billedBoxesByItem, setBilledBoxesByItem] = useState<Record<string, number>>({});
  const [billedLooseByItem, setBilledLooseByItem] = useState<Record<string, number>>({});
  const [selectedGrnOrder, setSelectedGrnOrder] = useState<Order | null>(null);
  const [grnNumberInput, setGrnNumberInput] = useState('');
  const [grnValueInput, setGrnValueInput] = useState(0);
  const [grnDateInput, setGrnDateInput] = useState(new Date().toISOString().substring(0, 10));
  const [grnRemarkInput, setGrnRemarkInput] = useState('');
  const grnQueueOrders = orders
    .filter(order => order.grn_workflow_status === 'PENDING_BILLING')
    .filter(order => canViewAllCompanies || isCompanyAllowedForUser(order.company_name, currentUser?.company_handle));

  // Billing users see only companies mapped to their login; Super Admin / All
  // handles continue to see the complete queue through the same helper.
  const billingQueueOrders = orders
    .filter(o => 
      o.status === 'APPROVED' || 
      o.status === 'ACCOUNTS_APPROVED' || 
      o.status === 'SALES_ADMIN_APPROVED' || 
      o.status === 'BILLED' || 
      o.status === 'DISPATCHED' || 
      o.status === 'PARTIALLY_DISPATCHED' ||
      o.status === 'OUT_FOR_DELIVERY' ||
      o.status === 'READY_FOR_PICKUP' ||
      o.status === 'DELIVERED' ||
      o.status === 'COMPLETED'
    )
    .filter(o => canViewAllCompanies || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
    .sort((a, b) => {
      const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const weightA = priorityWeight[a.priority || 'MEDIUM'] || 2;
      const weightB = priorityWeight[b.priority || 'MEDIUM'] || 2;
      return weightB - weightA;
    });

  const formatBilledQtyDisplay = (order: Order) => {
    if (!order.invoice_number && (order.billing_total_qty == null || order.billing_total_qty === 0)) return '—';
    
    const items = order.items || [];
    let totalBilledBoxes = 0;
    let totalBilledLoose = 0;
    let totalBilledPcs = 0;

    items.forEach(it => {
      const issued = it.issued_qty_pcs != null && it.issued_qty_pcs > 0 ? it.issued_qty_pcs : (it.total_qty_pcs || 0);
      const pcsPerBox = it.pcs_per_box && it.pcs_per_box > 0 ? it.pcs_per_box : 1;
      if (pcsPerBox > 1) {
        const boxes = Math.floor(issued / pcsPerBox);
        const loose = issued % pcsPerBox;
        totalBilledBoxes += boxes;
        totalBilledLoose += loose;
      } else {
        totalBilledLoose += issued;
      }
      totalBilledPcs += issued;
    });

    if (totalBilledPcs === 0 && order.billing_total_qty) {
      return `${order.billing_total_qty.toLocaleString()} PCS`;
    }

    if (totalBilledBoxes > 0 && totalBilledLoose > 0) {
      return `${totalBilledBoxes} BOX, ${totalBilledLoose} PCS (${totalBilledPcs.toLocaleString()} PCS)`;
    } else if (totalBilledBoxes > 0) {
      return `${totalBilledBoxes} BOX (${totalBilledPcs.toLocaleString()} PCS)`;
    } else {
      return `${totalBilledPcs.toLocaleString()} PCS`;
    }
  };

  const handleOpenInvoiceModal = (order: Order) => {
    setSelectedOrderForInvoice(order);
    const autoInv = order.invoice_number || `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setInvoiceNumberInput(autoInv);
    setCreditDaysInput(order.payment_type === 'ADVANCE' ? 0 : (order.credit_days || 30));

    const initialBoxes: Record<string, number> = {};
    const initialLoose: Record<string, number> = {};
    const initialQty: Record<string, number> = {};

    (order.items || []).forEach(item => {
      const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
      let bBox = 0;
      let bLoose = 0;

      if (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) {
        if (pcsPerBox > 1) {
          bBox = Math.floor(item.issued_qty_pcs / pcsPerBox);
          bLoose = item.issued_qty_pcs % pcsPerBox;
        } else {
          bBox = 0;
          bLoose = item.issued_qty_pcs;
        }
      } else {
        bBox = item.box_qty || 0;
        bLoose = item.loose_pcs || 0;
        if (bBox === 0 && bLoose === 0 && (item.total_qty_pcs || 0) > 0) {
          if (pcsPerBox > 1) {
            bBox = Math.floor(item.total_qty_pcs / pcsPerBox);
            bLoose = item.total_qty_pcs % pcsPerBox;
          } else {
            bLoose = item.total_qty_pcs;
          }
        }
      }

      initialBoxes[item.id] = bBox;
      initialLoose[item.id] = bLoose;
      initialQty[item.id] = (bBox * pcsPerBox) + bLoose;
    });

    setBilledBoxesByItem(initialBoxes);
    setBilledLooseByItem(initialLoose);
    setBilledQtyByItem(initialQty);

    const sumQty = Object.values(initialQty).reduce((sum, qty) => sum + qty, 0) || order.total_qty_pcs || 0;
    setBillingTotalQtyInput(order.billing_total_qty && order.billing_total_qty > 0 ? order.billing_total_qty : sumQty);
    setBillingAmountInput(order.invoice_amount && order.invoice_amount > 0 ? order.invoice_amount : (order.total_amount || 0));
    setInvoiceRemark(order.remarks || '');
  };

  const handleItemBoxChange = (itemId: string, val: number, pcsPerBox: number) => {
    const nextBox = Math.max(0, val);
    const currentLoose = billedLooseByItem[itemId] ?? 0;
    const nextTotalPcs = (nextBox * pcsPerBox) + currentLoose;

    setBilledBoxesByItem(prev => ({ ...prev, [itemId]: nextBox }));
    setBilledQtyByItem(prev => {
      const updated = { ...prev, [itemId]: nextTotalPcs };
      const sum = Object.values(updated).reduce((s, q) => s + q, 0);
      setBillingTotalQtyInput(sum);
      return updated;
    });
  };

  const handleItemLooseChange = (itemId: string, val: number, pcsPerBox: number) => {
    const nextLoose = Math.max(0, val);
    const currentBox = billedBoxesByItem[itemId] ?? 0;
    const nextTotalPcs = (currentBox * pcsPerBox) + nextLoose;

    setBilledLooseByItem(prev => ({ ...prev, [itemId]: nextLoose }));
    setBilledQtyByItem(prev => {
      const updated = { ...prev, [itemId]: nextTotalPcs };
      const sum = Object.values(updated).reduce((s, q) => s + q, 0);
      setBillingTotalQtyInput(sum);
      return updated;
    });
  };

  const handleConfirmInvoice = () => {
    if (!selectedOrderForInvoice || !invoiceNumberInput.trim()) return;

    const fallbackQty = (selectedOrderForInvoice.items || []).reduce((sum, it) => sum + (it.issued_qty_pcs || it.total_qty_pcs || 0), 0) || selectedOrderForInvoice.total_qty_pcs || 0;
    const finalBillingQty = billingTotalQtyInput > 0 ? billingTotalQtyInput : fallbackQty;
    const finalBillingAmount = billingAmountInput > 0 ? billingAmountInput : (selectedOrderForInvoice.total_amount || 0);

    const lockedCreditDays = selectedOrderForInvoice.payment_type === 'ADVANCE' ? 0 : Math.max(0, creditDaysInput);
    const finalInvNo = invoiceNumberInput.trim();

    if (onGenerateInvoice) {
      onGenerateInvoice(selectedOrderForInvoice, finalInvNo, finalBillingQty, finalBillingAmount, lockedCreditDays, invoiceRemark, billedQtyByItem);
    }

    addNotification({
      title: `🧾 Tax Invoice Issued: ${finalInvNo}`,
      message: `Billing invoice ${finalInvNo} for ${finalBillingQty.toLocaleString()} PCS and ₹${finalBillingAmount.toLocaleString()} issued for ${selectedOrderForInvoice.agency_name}.`,
      event_type: 'INVOICE_GENERATED',
      order_id: selectedOrderForInvoice.id
    });

    const billedOrder: Order = {
      ...selectedOrderForInvoice,
      status: 'BILLED',
      invoice_number: finalInvNo,
      invoice_amount: finalBillingAmount,
      billing_total_qty: finalBillingQty,
      credit_days: lockedCreditDays,
      remarks: invoiceRemark || selectedOrderForInvoice.remarks,
      items: (selectedOrderForInvoice.items || []).map(item => ({
        ...item,
        issued_qty_pcs: billedQtyByItem[item.id] !== undefined ? billedQtyByItem[item.id] : (item.total_qty_pcs || 0)
      }))
    };

    setSelectedOrderForInvoice(null);

    // Promptly open the Delivery Challan for the billed order
    if (onViewInvoice) {
      setTimeout(() => {
        onViewInvoice(billedOrder);
      }, 100);
    }
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

      {grnQueueOrders.length > 0 && (
        <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(244,63,94,0.1)', border: '1px solid #f43f5e', borderRadius: 10 }}>
          <strong style={{ color: '#fb7185' }}>GRN Requests Pending from Sales Admin ({grnQueueOrders.length})</strong>
          {grnQueueOrders.map(order => (
            <button key={order.id} onClick={() => { setSelectedGrnOrder(order); setGrnNumberInput(''); setGrnDateInput(new Date().toISOString().substring(0, 10)); setGrnValueInput(order.invoice_amount || 0); setGrnRemarkInput(''); }} className="btn btn-outline" style={{ marginLeft: 10 }}>
              Create GRN — {order.order_number}
            </button>
          ))}
        </div>
      )}

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
              <th>Bill No</th>
              <th>Total Billing Qty</th>
              <th>Total Bill Amount (₹)</th>
              <th>Credit Lock</th>
              <th>Billing Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {billingQueueOrders.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No orders pending billing. Orders marked In Stock in Order Approvals appear here sorted by priority.
                </td>
              </tr>
            ) : (
              billingQueueOrders.map(order => {
                const totalDispatchedVal = order.items?.reduce((sum, item) => {
                  return sum + ((item.dispatched_qty_pcs || 0) * item.unit_price);
                }, 0) || order.total_amount;

                const isBilled = !order.reattempt_delivery && (order.status === 'BILLED' || !!order.invoice_number);
                const isHigh = order.priority === 'HIGH';

                return (
                  <tr key={order.id} style={{ background: isHigh ? 'rgba(244, 63, 94, 0.05)' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong>
                        {order.reattempt_delivery && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                            🔄 REATTEMPT
                          </span>
                        )}
                      </div>
                    </td>
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
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Pending Bill</span>
                      )}
                    </td>
                    <td><strong style={{ color: '#38bdf8' }}>{formatBilledQtyDisplay(order)}</strong></td>
                    <td>{order.invoice_amount != null ? `₹${order.invoice_amount.toLocaleString()}` : '—'}</td>
                    <td>{order.invoice_number ? `${order.payment_type === 'ADVANCE' ? 0 : (order.credit_days || 0)} Days` : '—'}</td>
                    <td>
                      {isBilled ? (
                        <span className="status-badge status-BILLED" style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399' }}>
                          BILLED
                        </span>
                      ) : (
                        <span className="status-badge status-SUBMITTED">READY FOR BILL</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!isBilled ? (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleOpenInvoiceModal(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Receipt size={14} /> {order.reattempt_delivery ? 'Review / Modify Bill' : 'Issue Bill'}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => onViewInvoice && onViewInvoice(order)}
                            style={{ borderColor: '#f59e0b', color: '#fbbf24', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="View / Print Delivery Challan"
                          >
                            <Truck size={14} /> Delivery Challan
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleOpenInvoiceModal(order)}
                            style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Edit Invoice details on this order"
                          >
                            <Receipt size={14} /> Edit Invoice
                          </button>
                        </div>
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
          <div className="modal-card" style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#34d399" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedOrderForInvoice.invoice_number 
                    ? `Update Invoice — ${selectedOrderForInvoice.order_number}` 
                    : 'Stage 4: Issue B2B Bill & Credit Lock'}
                </h3>
              </div>
              <button onClick={() => setSelectedOrderForInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#38bdf8' }}>
              ℹ️ <strong>Order Reference:</strong> {selectedOrderForInvoice.order_number} &bull; Directly modifies billing details for this existing order. <em>No duplicate or new order will be created.</em>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ color: '#94a3b8' }}>Party Name: <strong style={{ color: '#f8fafc' }}>{selectedOrderForInvoice.agency_name}</strong></div>
              <div style={{ color: '#94a3b8', marginTop: 3 }}>Payment Type: <strong style={{ color: '#38bdf8' }}>{selectedOrderForInvoice.payment_type || 'CREDIT'}</strong></div>
              <div style={{ color: '#94a3b8', marginTop: 3 }}>
                New Bill Amount: <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>
                  ₹{billingAmountInput.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* ORDERED ITEMS & BILLING QUANTITY WITH BOX & LOOSE PCS */}
            <div style={{ marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>ORDERED ITEMS &amp; BILLING QUANTITY</label>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Enter Boxes &amp; Loose PCS</span>
              </div>

              <div style={{ border: '1px solid #334155', borderRadius: 8, overflow: 'hidden', background: '#0b1120' }}>
                {(selectedOrderForInvoice.items || []).map((item, idx) => {
                  const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
                  const isFmcd = pcsPerBox === 1;
                  const ordBox = item.box_qty || 0;
                  const ordLoose = item.loose_pcs || 0;
                  const ordFree = item.free_pcs || 0;
                  const ordTotalPcs = item.total_qty_pcs || ((ordBox * pcsPerBox) + ordLoose + ordFree) || 0;

                  const curBox = billedBoxesByItem[item.id] ?? 0;
                  const curLoose = billedLooseByItem[item.id] ?? 0;
                  const curRowTotalPcs = (curBox * pcsPerBox) + curLoose;

                  return (
                    <div key={item.id || idx} style={{ padding: '0.75rem 0.85rem', borderBottom: idx !== (selectedOrderForInvoice.items || []).length - 1 ? '1px solid #1e293b' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem', flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '0.825rem' }}>{item.product_name || item.product_code || 'Product SKU'}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>
                              Approved Qty: {ordBox > 0 ? `${ordBox} BOX` : ''}{ordBox > 0 && ordLoose > 0 ? ', ' : ''}{ordLoose > 0 ? `${ordLoose} PCS` : ''}{ordBox === 0 && ordLoose === 0 ? `${ordTotalPcs} PCS` : ''}{ordFree > 0 ? ` (+${ordFree} Free)` : ''} ({ordTotalPcs.toLocaleString()} PCS Total)
                            </span>
                            {!isFmcd && (
                              <span style={{ fontSize: '0.675rem', color: '#94a3b8', background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>
                                Pack: {pcsPerBox} PCS/Box
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '2px 8px', borderRadius: 6 }}>
                            Billed: {!isFmcd && curBox > 0 ? `${curBox} BOX` : ''}{!isFmcd && curBox > 0 && curLoose > 0 ? ', ' : ''}{curLoose > 0 || (isFmcd && curBox === 0) ? `${curLoose} PCS` : ''}{!isFmcd && curBox === 0 && curLoose === 0 ? '0 PCS' : ''} ({curRowTotalPcs.toLocaleString()} PCS)
                          </span>
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: isFmcd ? '1fr' : '1fr 1fr', gap: '0.65rem' }}>
                        {!isFmcd && (
                          <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 700, marginBottom: 2 }}>Billing Boxes</label>
                            <input
                              type="number"
                              min="0"
                              value={curBox}
                              onChange={e => handleItemBoxChange(item.id, Number(e.target.value) || 0, pcsPerBox)}
                              style={{ width: '100%', padding: '0.45rem 0.6rem', background: '#0f172a', color: '#38bdf8', border: '1px solid #475569', borderRadius: 6, fontWeight: 800, fontSize: '0.85rem' }}
                              aria-label={`Billing box quantity for ${item.product_name || 'product'}`}
                            />
                          </div>
                        )}
                        <div>
                          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 700, marginBottom: 2 }}>
                            {isFmcd ? 'Billing Quantity (PCS)' : 'Billing Loose PCS'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={curLoose}
                            onChange={e => handleItemLooseChange(item.id, Number(e.target.value) || 0, pcsPerBox)}
                            style={{ width: '100%', padding: '0.45rem 0.6rem', background: '#0f172a', color: '#38bdf8', border: '1px solid #475569', borderRadius: 6, fontWeight: 800, fontSize: '0.85rem' }}
                            aria-label={`Billing loose quantity for ${item.product_name || 'product'}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Totals KPI Strip for Billing Modal */}
              {(() => {
                const totalBilledBoxes = Object.values(billedBoxesByItem).reduce((a, b) => a + b, 0);
                const totalBilledLoose = Object.values(billedLooseByItem).reduce((a, b) => a + b, 0);
                const totalOrderedFreePcs = (selectedOrderForInvoice.items || []).reduce((s, it) => s + (it.free_pcs || 0), 0);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>BILLED BOXES</span>
                      <strong style={{ fontSize: '0.825rem', color: '#38bdf8' }}>{totalBilledBoxes} BOX</strong>
                    </div>
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>BILLED LOOSE PCS</span>
                      <strong style={{ fontSize: '0.825rem', color: '#34d399' }}>{totalBilledLoose} PCS</strong>
                    </div>
                    {totalOrderedFreePcs > 0 && (
                      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>FREE PCS</span>
                        <strong style={{ fontSize: '0.825rem', color: '#fbbf24' }}>{totalOrderedFreePcs} PCS</strong>
                      </div>
                    )}
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>TOTAL PCS</span>
                      <strong style={{ fontSize: '0.825rem', color: '#f8fafc' }}>{billingTotalQtyInput.toLocaleString()} PCS</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>BILL NUMBER (Mandatory)*</label>
              <input 
                type="text" 
                value={invoiceNumberInput}
                onChange={e => setInvoiceNumberInput(e.target.value)}
                placeholder="e.g. BILL-2026-9042"
                style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem' }}
              />
            </div>

            {(() => {
              const totalBilledBoxes = Object.values(billedBoxesByItem).reduce((a, b) => a + b, 0);
              const totalBilledLoose = Object.values(billedLooseByItem).reduce((a, b) => a + b, 0);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>TOTAL BILLING QUANTITY</label>
                    <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 6, padding: '0.55rem 0.75rem', color: '#34d399', fontWeight: 800, fontSize: '0.85rem' }}>
                      {totalBilledBoxes > 0 ? `${totalBilledBoxes} BOX` : ''}{totalBilledBoxes > 0 && totalBilledLoose > 0 ? ', ' : ''}{totalBilledLoose > 0 ? `${totalBilledLoose} PCS` : ''}{totalBilledBoxes === 0 && totalBilledLoose === 0 ? '0 PCS' : ''} ({billingTotalQtyInput.toLocaleString()} PCS Total)
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>Calculated from item billing box &amp; loose quantities.</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>TOTAL BILL AMOUNT (₹)</label>
                    <input type="number" min="0" step="0.01" value={billingAmountInput} onChange={event => setBillingAmountInput(Math.max(0, Number(event.target.value) || 0))} placeholder="Enter bill amount" style={{ width: '100%', padding: '0.55rem 0.65rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', fontWeight: 800, fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>Entered manually or auto-filled.</span>
                  </div>
                </div>
              );
            })()}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', marginBottom: 4 }}>CREDIT DAYS LOCK (0 for Advance Orders)</label>
              <input 
                type="number" 
                disabled={selectedOrderForInvoice.payment_type === 'ADVANCE'}
                value={creditDaysInput}
                onChange={e => setCreditDaysInput(Math.max(0, Number(e.target.value) || 0))}
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
                <CheckCircle2 size={16} /> {selectedOrderForInvoice.invoice_number ? 'Update & Save Invoice' : 'Confirm Bill & Lock Credit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGrnOrder && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Billing: Create GRN — {selectedGrnOrder.order_number}</h3>
            <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>GRN Number*</label>
            <input value={grnNumberInput} onChange={event => setGrnNumberInput(event.target.value)} placeholder="GRN-2026-0001" style={{ width: '100%', padding: '0.6rem', margin: '0.35rem 0 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
            <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>GRN Value (₹)*</label>
            <input type="number" min="0" value={grnValueInput} onChange={event => setGrnValueInput(Number(event.target.value) || 0)} style={{ width: '100%', padding: '0.6rem', margin: '0.35rem 0 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
            <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>GRN Date*</label>
            <input type="date" value={grnDateInput} onChange={event => setGrnDateInput(event.target.value)} style={{ width: '100%', padding: '0.6rem', margin: '0.35rem 0 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
            <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>GRN Remark*</label>
            <textarea rows={3} value={grnRemarkInput} onChange={event => setGrnRemarkInput(event.target.value)} placeholder="Enter GRN settlement remark" style={{ width: '100%', padding: '0.6rem', margin: '0.35rem 0 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setSelectedGrnOrder(null)}>Cancel</button>
              <button className="btn btn-success" disabled={!grnNumberInput.trim() || !grnDateInput || grnValueInput <= 0 || !grnRemarkInput.trim()} onClick={() => { onCompleteGrn?.(selectedGrnOrder.id, grnNumberInput.trim(), grnDateInput, grnValueInput, grnRemarkInput.trim()); setSelectedGrnOrder(null); }}>Create GRN &amp; Send to Sales Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
