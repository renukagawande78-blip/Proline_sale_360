import React, { useState, useEffect } from 'react';
import { Receipt, DollarSign, CheckCircle2, X, Truck, FileSpreadsheet, PackageX, FileCheck2, AlertTriangle, ArrowRight, ShieldCheck, FileText, MoreVertical, Lock } from 'lucide-react';
import { Order, Agency, isOrderDispatchedOrBeyond } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin, isCompanyAllowedForUser } from '../../lib/supabase';
import { UpdatePartyBalanceModal } from '../../components/UpdatePartyBalanceModal';
import { exportOrderProductSheet } from '../../utils/orderExcelExport';

interface AccountsViewProps {
  orders: Order[];
  agencies?: Agency[];
  onGenerateInvoice?: (order: Order, invoiceNumber: string, billingTotalQty: number, invoiceAmount: number, creditDays: number, remark: string, billedQtyByItem: Record<string, number>) => void;
  onCompleteGrn?: (orderId: string, grnNumber: string, grnDate: string, grnValue: number, grnRemark: string) => void;
  onReattemptDelivery?: (order: Order) => void;
  onViewInvoice?: (order: Order, mode?: 'SALES_ORDER' | 'DISPATCH_CHALLAN') => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ orders, agencies, onGenerateInvoice, onCompleteGrn, onReattemptDelivery, onViewInvoice }) => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const canViewAllCompanies = checkIsSuperAdmin(currentUser) || !currentUser?.company_handle || currentUser?.company_handle === 'All';
  const [activeTab, setActiveTab] = useState<'BILLS' | 'GRN'>('BILLS');
  const [billingFilter, setBillingFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Close 3-dot action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openActionMenuId && !(e.target as HTMLElement)?.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenuId]);

  const getPartyName = (ord: Order | null) => {
    if (!ord) return '—';
    if (ord.agency_name && ord.agency_name !== 'Agency Party') return ord.agency_name;
    const match = (agencies || []).find(a => a.id === ord.agency_id);
    return match?.agency_name || ord.agency_name || 'Direct Order';
  };

  const [creditDaysInput, setCreditDaysInput] = useState<number | ''>('');
  const [billingTotalQtyInput, setBillingTotalQtyInput] = useState<number>(0);
  const [billingAmountInput, setBillingAmountInput] = useState<number | ''>('');
  const [invoiceRemark, setInvoiceRemark] = useState('');
  const [billedQtyByItem, setBilledQtyByItem] = useState<Record<string, number>>({});
  const [billedBoxesByItem, setBilledBoxesByItem] = useState<Record<string, number | ''>>({});
  const [billedLooseByItem, setBilledLooseByItem] = useState<Record<string, number | ''>>({});
  const [selectedGrnOrder, setSelectedGrnOrder] = useState<Order | null>(null);
  const [selectedReattemptOrder, setSelectedReattemptOrder] = useState<Order | null>(null);
  const [grnNumberInput, setGrnNumberInput] = useState('');
  const [grnValueInput, setGrnValueInput] = useState(0);
  const [grnDateInput, setGrnDateInput] = useState(new Date().toISOString().substring(0, 10));
  const [grnRemarkInput, setGrnRemarkInput] = useState('');
  
  const grnQueueOrders = orders
    .filter(order => (order.grn_workflow_status === 'PENDING_BILLING' || (order.status === 'POD_ISSUE_RAISED' && !order.grn_number)) && order.status !== 'DELIVERY_REATTEMPTED' && !order.reattempt_order_number)
    .filter(order => canViewAllCompanies || isCompanyAllowedForUser(order.company_name, currentUser?.company_handle))
    .sort((a, b) => (b.order_date || '').localeCompare(a.order_date || ''));

  // Billing users see only companies mapped to their login; Super Admin / All
  // handles continue to see the complete queue through the same helper.
  const allBillingOrders = orders
    .filter(o => 
      o.status === 'APPROVED' || 
      o.status === 'ACCOUNTS_APPROVED' || 
      o.status === 'SALES_ADMIN_APPROVED' || 
      o.status === 'SUBMITTED' ||
      o.status === 'WAIT_FOR_STOCK' ||
      o.status === 'INVENTORY_AUDITED' ||
      o.status === 'BILLED' || 
      o.status === 'INVOICED' || 
      Boolean(o.invoice_number) ||
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

  // Upcoming For Billing: Orders pending invoice generation
  const upcomingBillingOrders = allBillingOrders.filter(o => 
    !o.invoice_number && 
    o.status !== 'BILLED' && 
    o.status !== 'INVOICED' && 
    o.status !== 'DISPATCHED' && 
    o.status !== 'DELIVERED' && 
    o.status !== 'COMPLETED'
  );

  // Completed Billing: Orders that have bill/invoice issued
  const completedBillingOrders = allBillingOrders.filter(o => 
    Boolean(o.invoice_number) || 
    o.status === 'BILLED' || 
    o.status === 'INVOICED' || 
    o.status === 'DISPATCHED' || 
    o.status === 'DELIVERED' || 
    o.status === 'COMPLETED'
  );

  // Filtered orders according to active sub-tab
  const displayedBillingOrders = billingFilter === 'UPCOMING'
    ? upcomingBillingOrders
    : billingFilter === 'COMPLETED'
    ? completedBillingOrders
    : allBillingOrders;

  const formatBilledQtyDisplay = (order: Order) => {
    if (!order.invoice_number && (order.billing_total_qty == null || order.billing_total_qty === 0)) return '—';
    
    const isFMCD = Boolean(
      (order as any).company_segment?.toUpperCase() === 'FMCD' ||
      (order as any).segment?.toUpperCase() === 'FMCD' ||
      ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].includes((order.company_name || (order as any).company_handle || '').toUpperCase()) ||
      ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].some(k => (order.order_number || '').toUpperCase().startsWith(k)) ||
      ((order.items || []).length > 0 && (order.items || []).every(it => !it.pcs_per_box || it.pcs_per_box <= 1))
    );

    const items = order.items || [];
    let totalBilledBoxes = 0;
    let totalBilledLoose = 0;
    let totalBilledPcs = 0;

    items.forEach(it => {
      const issued = it.issued_qty_pcs !== undefined ? Number(it.issued_qty_pcs) : (it.total_qty_pcs || 0);
      const pcsPerBox = it.pcs_per_box && it.pcs_per_box > 0 ? it.pcs_per_box : 1;
      if (!isFMCD && pcsPerBox > 1) {
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
      totalBilledPcs = order.billing_total_qty;
    }

    if (isFMCD) {
      return `${totalBilledPcs.toLocaleString()} PCS`;
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
    if (isOrderDispatchedOrBeyond(order.status)) {
      alert(`Order ${order.order_number} has already been dispatched (${order.status}). Billing invoice cannot be edited after dispatch.`);
      return;
    }
    setSelectedOrderForInvoice(order);
    setInvoiceNumberInput(order.invoice_number || '');
    setCreditDaysInput(order.payment_type === 'ADVANCE' ? 0 : (order.credit_days != null && order.credit_days > 0 ? order.credit_days : ''));

    const isOrderFMCD = Boolean(
      (order as any).company_segment?.toUpperCase() === 'FMCD' ||
      (order as any).segment?.toUpperCase() === 'FMCD' ||
      ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].includes((order.company_name || (order as any).company_handle || '').toUpperCase()) ||
      ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].some(k => (order.order_number || '').toUpperCase().startsWith(k)) ||
      ((order.items || []).length > 0 && (order.items || []).every(it => !it.pcs_per_box || it.pcs_per_box <= 1))
    );

    const initialBoxes: Record<string, number | ''> = {};
    const initialLoose: Record<string, number | ''> = {};
    const initialQty: Record<string, number> = {};

    (order.items || []).forEach(item => {
      const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
      const isItemFmcd = isOrderFMCD || pcsPerBox === 1;
      let bBox: number | '' = 0;
      let bLoose: number | '' = 0;

      if (item.issued_qty_pcs != null) {
        if (!isItemFmcd && pcsPerBox > 1) {
          bBox = Math.floor(Number(item.issued_qty_pcs) / pcsPerBox);
          bLoose = Number(item.issued_qty_pcs) % pcsPerBox;
        } else {
          bBox = 0;
          bLoose = Number(item.issued_qty_pcs);
        }
      } else {
        // Default value: EXACT ORDER QUANTITY
        if (isItemFmcd) {
          bBox = 0;
          bLoose = item.total_qty_pcs || item.loose_pcs || item.box_qty || 0;
        } else {
          if (item.box_qty != null && item.box_qty > 0) {
            bBox = item.box_qty;
            bLoose = item.loose_pcs || 0;
          } else if (item.total_qty_pcs != null && item.total_qty_pcs > 0) {
            bBox = Math.floor(item.total_qty_pcs / pcsPerBox);
            bLoose = item.total_qty_pcs % pcsPerBox;
          } else {
            bBox = 0;
            bLoose = item.loose_pcs || 0;
          }
        }
      }

      initialBoxes[item.id] = bBox;
      initialLoose[item.id] = bLoose;
      initialQty[item.id] = ((Number(bBox) || 0) * pcsPerBox) + (Number(bLoose) || 0);
    });

    setBilledBoxesByItem(initialBoxes);
    setBilledLooseByItem(initialLoose);
    setBilledQtyByItem(initialQty);

    const sumQty = Object.values(initialQty).reduce((sum, qty) => sum + qty, 0) || order.total_qty_pcs || 0;
    setBillingTotalQtyInput(order.billing_total_qty && order.billing_total_qty > 0 ? order.billing_total_qty : sumQty);
    setBillingAmountInput(order.invoice_amount && order.invoice_amount > 0 ? order.invoice_amount : '');
    setInvoiceRemark('');
  };

  const handleOpenGrnModal = (order: Order) => {
    setSelectedGrnOrder(order);
    const yr = new Date().getFullYear();
    const orderNumDigits = order.order_number.replace(/[^0-9]/g, '').slice(-4) || '0001';
    setGrnNumberInput(order.grn_number || `GRN-${yr}-${orderNumDigits}`);
    setGrnDateInput(new Date().toISOString().substring(0, 10));
    setGrnValueInput(order.grn_value && order.grn_value > 0 ? order.grn_value : (order.invoice_amount || order.total_amount || 0));
    setGrnRemarkInput(order.grn_remark || '');
  };

  const handleItemBoxChange = (itemId: string, rawVal: string, pcsPerBox: number) => {
    const nextBox: number | '' = rawVal === '' ? '' : Math.max(0, parseInt(rawVal, 10) || 0);
    const currentLoose = Number(billedLooseByItem[itemId]) || 0;
    const boxNum = Number(nextBox) || 0;
    const nextTotalPcs = (boxNum * pcsPerBox) + currentLoose;

    setBilledBoxesByItem(prev => ({ ...prev, [itemId]: nextBox }));
    setBilledQtyByItem(prev => {
      const updated = { ...prev, [itemId]: nextTotalPcs };
      const sum = Object.values(updated).reduce((s, q) => s + q, 0);
      setBillingTotalQtyInput(sum);
      return updated;
    });
  };

  const handleItemLooseChange = (itemId: string, rawVal: string, pcsPerBox: number) => {
    const nextLoose: number | '' = rawVal === '' ? '' : Math.max(0, parseInt(rawVal, 10) || 0);
    const currentBox = Number(billedBoxesByItem[itemId]) || 0;
    const looseNum = Number(nextLoose) || 0;
    const nextTotalPcs = (currentBox * pcsPerBox) + looseNum;

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
    if (isOrderDispatchedOrBeyond(selectedOrderForInvoice.status)) {
      alert(`Order ${selectedOrderForInvoice.order_number} has already been dispatched (${selectedOrderForInvoice.status}). Bill editing is locked.`);
      return;
    }

    const fallbackQty = (selectedOrderForInvoice.items || []).reduce((sum, it) => sum + (it.issued_qty_pcs || it.total_qty_pcs || 0), 0) || selectedOrderForInvoice.total_qty_pcs || 0;
    const finalBillingQty = billingTotalQtyInput > 0 ? billingTotalQtyInput : fallbackQty;
    const finalBillingAmount = typeof billingAmountInput === 'number' && billingAmountInput > 0 
      ? billingAmountInput 
      : (selectedOrderForInvoice.total_amount || 0);

    const lockedCreditDays = selectedOrderForInvoice.payment_type === 'ADVANCE' 
      ? 0 
      : (typeof creditDaysInput === 'number' ? Math.max(0, creditDaysInput) : 0);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Accounts &amp; Billing Console</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Tax Invoicing, GRN Generation, GST settlement, and Party Financial Balance Ledger Management
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

      {/* DUAL ACTION TABS: ISSUE BILLS vs ISSUE GRN */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('BILLS')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: 10,
            border: activeTab === 'BILLS' ? '2px solid #38bdf8' : '1px solid #334155',
            background: activeTab === 'BILLS' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
            color: activeTab === 'BILLS' ? '#38bdf8' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'BILLS' ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Receipt size={18} />
          <span>Issue Bills / Invoices ({allBillingOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('GRN')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: 10,
            border: activeTab === 'GRN' ? '2px solid #fb7185' : grnQueueOrders.length > 0 ? '1px solid #f43f5e' : '1px solid #334155',
            background: activeTab === 'GRN' ? 'rgba(244, 63, 94, 0.18)' : grnQueueOrders.length > 0 ? 'rgba(244, 63, 94, 0.08)' : '#0f172a',
            color: activeTab === 'GRN' ? '#fb7185' : grnQueueOrders.length > 0 ? '#fb7185' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'GRN' ? '0 0 15px rgba(244, 63, 94, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <PackageX size={18} />
          <span>Issue GRN / Delivery Returns ({grnQueueOrders.length})</span>
          {grnQueueOrders.length > 0 && (
            <span style={{ background: '#f43f5e', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: 9999, fontWeight: 900 }}>
              {grnQueueOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ALERT BANNER IF PENDING GRN ORDERS EXIST (WHEN ON BILLS TAB) */}
      {activeTab === 'BILLS' && grnQueueOrders.length > 0 && (
        <div 
          onClick={() => setActiveTab('GRN')}
          style={{ 
            marginBottom: '1.25rem', 
            padding: '0.85rem 1.15rem', 
            background: 'rgba(244,63,94,0.12)', 
            border: '1px solid #f43f5e', 
            borderRadius: 10, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} color="#fb7185" />
            <div>
              <strong style={{ color: '#fb7185', fontSize: '0.85rem' }}>{grnQueueOrders.length} GRN Request(s) Pending from POD Verification</strong>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                Orders flagged with shortage/damage during delivery drop require GRN issuance.
              </div>
            </div>
          </div>
          <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            Switch to Issue GRN <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: BILLING QUEUE (ISSUE BILLS) */}
      {activeTab === 'BILLS' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #334155', borderRadius: 12, background: 'var(--bg-card)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: '#0b1329' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                Billing Queue — {billingFilter === 'UPCOMING' ? 'Upcoming For Billing' : billingFilter === 'COMPLETED' ? 'Completed Billing' : 'All Orders'} ({displayedBillingOrders.length})
              </h2>
              <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                {billingFilter === 'UPCOMING' && 'Approved orders awaiting tax invoice generation and billing'}
                {billingFilter === 'COMPLETED' && 'Orders with completed tax invoicing and bill numbers'}
                {billingFilter === 'ALL' && 'All orders in billing lifecycle sorted by priority'}
              </span>
            </div>

            {/* Sub-Filter Pills for Billing */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setBillingFilter('ALL')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 20,
                  border: billingFilter === 'ALL' ? '1.5px solid #38bdf8' : '1px solid #334155',
                  background: billingFilter === 'ALL' ? 'rgba(56, 189, 248, 0.18)' : '#0f172a',
                  color: billingFilter === 'ALL' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>All Orders</span>
                <span style={{ background: billingFilter === 'ALL' ? '#38bdf8' : '#334155', color: billingFilter === 'ALL' ? '#090d16' : '#94a3b8', padding: '0.1rem 0.45rem', borderRadius: 9999, fontSize: '0.675rem', fontWeight: 900 }}>
                  {allBillingOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBillingFilter('UPCOMING')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 20,
                  border: billingFilter === 'UPCOMING' ? '1.5px solid #fbbf24' : '1px solid #334155',
                  background: billingFilter === 'UPCOMING' ? 'rgba(245, 158, 11, 0.18)' : '#0f172a',
                  color: billingFilter === 'UPCOMING' ? '#fbbf24' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⏳ Upcoming For Billing</span>
                <span style={{ background: billingFilter === 'UPCOMING' ? '#fbbf24' : '#334155', color: billingFilter === 'UPCOMING' ? '#090d16' : '#94a3b8', padding: '0.1rem 0.45rem', borderRadius: 9999, fontSize: '0.675rem', fontWeight: 900 }}>
                  {upcomingBillingOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBillingFilter('COMPLETED')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 20,
                  border: billingFilter === 'COMPLETED' ? '1.5px solid #34d399' : '1px solid #334155',
                  background: billingFilter === 'COMPLETED' ? 'rgba(52, 211, 153, 0.18)' : '#0f172a',
                  color: billingFilter === 'COMPLETED' ? '#34d399' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>✅ Completed Billing</span>
                <span style={{ background: billingFilter === 'COMPLETED' ? '#34d399' : '#334155', color: billingFilter === 'COMPLETED' ? '#090d16' : '#94a3b8', padding: '0.1rem 0.45rem', borderRadius: 9999, fontSize: '0.675rem', fontWeight: 900 }}>
                  {completedBillingOrders.length}
                </span>
              </button>
            </div>
          </div>

          <div
            className="data-table-container both-scrollbars scrollable-table"
            style={{
              maxHeight: 'calc(100vh - 270px)',
              minHeight: 340,
              overflowX: 'auto',
              overflowY: 'auto',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none'
            }}
          >
            <table className="data-table" style={{ minWidth: 1100, width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#0d1527' }}>
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
              {displayedBillingOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    {billingFilter === 'UPCOMING'
                      ? 'No upcoming orders waiting for billing. All verified orders are billed.'
                      : billingFilter === 'COMPLETED'
                      ? 'No completed billing orders yet.'
                      : 'No orders found in Billing Console.'}
                  </td>
                </tr>
              ) : (
                displayedBillingOrders.map((order, index) => {
                  const isLastItems = index >= displayedBillingOrders.length - 2 && displayedBillingOrders.length > 2;
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
                      <td><strong style={{ color: '#f8fafc' }}>{getPartyName(order)}</strong></td>
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
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        {!isBilled ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleOpenInvoiceModal(order)}
                              disabled={isOrderDispatchedOrBeyond(order.status)}
                              style={isOrderDispatchedOrBeyond(order.status) ? {
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                opacity: 0.6,
                                cursor: 'not-allowed',
                                background: '#1e293b',
                                borderColor: '#334155',
                                color: '#94a3b8'
                              } : {
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title={isOrderDispatchedOrBeyond(order.status) ? "Order has already been dispatched. Billing cannot be edited." : (order.reattempt_delivery ? 'Review / Modify Bill' : 'Issue Bill')}
                            >
                              {isOrderDispatchedOrBeyond(order.status) ? <Lock size={13} color="#94a3b8" /> : <Receipt size={14} />} {order.reattempt_delivery ? 'Review / Modify Bill' : 'Issue Bill'}
                            </button>
                            
                            <div className="action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(openActionMenuId === order.id ? null : order.id);
                                }}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.35rem 0.45rem',
                                  borderRadius: 6,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderColor: openActionMenuId === order.id ? '#38bdf8' : '#334155',
                                  background: openActionMenuId === order.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                                  color: openActionMenuId === order.id ? '#38bdf8' : '#cbd5e1',
                                  cursor: 'pointer'
                                }}
                                title="More actions (Sale Order PDF, Excel XLS, etc.)"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {openActionMenuId === order.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: isLastItems ? 'auto' : 'calc(100% + 4px)',
                                    bottom: isLastItems ? 'calc(100% + 4px)' : 'auto',
                                    zIndex: 150,
                                    minWidth: 190,
                                    background: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: 8,
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                                    padding: '0.35rem 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    textAlign: 'left'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      if (onViewInvoice) onViewInvoice(order, 'SALES_ORDER');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.5rem 0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#38bdf8',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    title="View or Print Sales Order Booking Form PDF"
                                  >
                                    <FileText size={15} color="#38bdf8" />
                                    <span>Sale Order PDF</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      exportOrderProductSheet(order);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.5rem 0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#34d399',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    title={`Download ${order.order_number}.xlsx`}
                                  >
                                    <FileSpreadsheet size={15} color="#34d399" />
                                    <span>Export Excel (XLS)</span>
                                  </button>

                                  <div style={{ height: 1, background: '#1e293b', margin: '0.25rem 0' }} />

                                  {isOrderDispatchedOrBeyond(order.status) ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        color: '#64748b',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'not-allowed',
                                        background: 'rgba(100, 116, 139, 0.05)'
                                      }}
                                      title="Order is already dispatched. Bill editing is deactivated."
                                    >
                                      <Lock size={15} color="#64748b" />
                                      <span>{order.reattempt_delivery ? 'Review Bill (Locked - Dispatched)' : 'Issue Bill (Locked - Dispatched)'}</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenuId(null);
                                        handleOpenInvoiceModal(order);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: 'none',
                                        border: 'none',
                                        color: '#f8fafc',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    >
                                      <Receipt size={15} color="#60a5fa" />
                                      <span>{order.reattempt_delivery ? 'Review / Modify Bill' : 'Issue Bill'}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => onViewInvoice && onViewInvoice(order, 'DISPATCH_CHALLAN')}
                              style={{ borderColor: '#f59e0b', color: '#fbbf24', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              title="View / Print Delivery Challan"
                            >
                              <Truck size={14} /> Delivery Challan
                            </button>

                            <div className="action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(openActionMenuId === order.id ? null : order.id);
                                }}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.35rem 0.45rem',
                                  borderRadius: 6,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderColor: openActionMenuId === order.id ? '#38bdf8' : '#334155',
                                  background: openActionMenuId === order.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                                  color: openActionMenuId === order.id ? '#38bdf8' : '#cbd5e1',
                                  cursor: 'pointer'
                                }}
                                title="More actions (Sale Order PDF, Excel XLS, Edit Invoice, etc.)"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {openActionMenuId === order.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: isLastItems ? 'auto' : 'calc(100% + 4px)',
                                    bottom: isLastItems ? 'calc(100% + 4px)' : 'auto',
                                    zIndex: 150,
                                    minWidth: 190,
                                    background: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: 8,
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                                    padding: '0.35rem 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    textAlign: 'left'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      if (onViewInvoice) onViewInvoice(order, 'SALES_ORDER');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.5rem 0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#38bdf8',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    title="View or Print Sales Order Booking Form PDF"
                                  >
                                    <FileText size={15} color="#38bdf8" />
                                    <span>Sale Order PDF</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      exportOrderProductSheet(order);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.5rem 0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#34d399',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    title={`Download ${order.order_number}.xlsx`}
                                  >
                                    <FileSpreadsheet size={15} color="#34d399" />
                                    <span>Export Excel (XLS)</span>
                                  </button>

                                  <div style={{ height: 1, background: '#1e293b', margin: '0.25rem 0' }} />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      if (onViewInvoice) onViewInvoice(order, 'DISPATCH_CHALLAN');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.5rem 0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#fbbf24',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  >
                                    <Truck size={15} color="#fbbf24" />
                                    <span>Delivery Challan</span>
                                  </button>

                                  {isOrderDispatchedOrBeyond(order.status) ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        color: '#64748b',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'not-allowed',
                                        background: 'rgba(100, 116, 139, 0.05)'
                                      }}
                                      title="Order is already dispatched. Bill editing is deactivated."
                                    >
                                      <Lock size={15} color="#64748b" />
                                      <span>Edit Invoice (Locked - Dispatched)</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenuId(null);
                                        handleOpenInvoiceModal(order);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: 'none',
                                        border: 'none',
                                        color: '#38bdf8',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    >
                                      <Receipt size={15} color="#38bdf8" />
                                      <span>Edit Invoice</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
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
      </div>
      )}

      {/* TAB 2: GRN QUEUE (ISSUE GRN) */}
      {activeTab === 'GRN' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #334155', borderRadius: 12, background: 'var(--bg-card)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#0b1329' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackageX size={20} /> GRN Issuance Queue — Returns &amp; Delivery Exceptions ({grnQueueOrders.length})
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
                Orders flagged with shortage, damage, or return from POD Verification. Billing can issue official GRN number and value.
              </p>
            </div>
          </div>

          <div
            className="data-table-container both-scrollbars scrollable-table"
            style={{
              maxHeight: 'calc(100vh - 270px)',
              minHeight: 340,
              overflowX: 'auto',
              overflowY: 'auto',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none'
            }}
          >
            <table className="data-table" style={{ minWidth: 1050, width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#0d1527' }}>
                <tr>
                  <th>Order Number</th>
                <th>Agency / Party</th>
                <th>Bill No &amp; Original Amount</th>
                <th>POD Exception / Reason</th>
                <th>Reported By / Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {grnQueueOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={32} color="#34d399" />
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>No Pending GRN Requests</strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        When POD verification reports a delivery shortage or damaged return, orders appear here for Billing to Issue GRN.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                grnQueueOrders.map((order, index) => {
                  const isLastGrnItem = index >= grnQueueOrders.length - 2 && grnQueueOrders.length > 2;
                  return (
                    <tr key={order.id} style={{ background: 'rgba(244, 63, 94, 0.04)' }}>
                      <td>
                        <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong>
                        {order.company_name && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{order.company_name}</div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#f8fafc' }}>{getPartyName(order)}</strong>
                      </td>
                      <td>
                        <div><code style={{ color: '#fbbf24', fontWeight: 800 }}>{order.invoice_number || 'Pending'}</code></div>
                        <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                          ₹{(order.invoice_amount || order.total_amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', fontWeight: 800, marginBottom: 4, display: 'inline-block' }}>
                          {order.pod_issue_type || 'DELIVERY EXCEPTION'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', maxWidth: 280, wordBreak: 'break-word', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem 0.5rem', borderRadius: 4, border: '1px solid #334155' }}>
                          💬 {order.pod_issue_details || order.remarks || 'Discrepancy reported during drop'}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#38bdf8', fontSize: '0.78rem' }}>{order.pod_query_raised_by || 'Billing / POD Desk'}</strong>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 2 }}>{order.pod_query_raised_at || 'Recently'}</div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontWeight: 800 }}>
                          PENDING GRN
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleOpenGrnModal(order)}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Issue GRN (Credit Note) for damaged or shortage items"
                          >
                            <PackageX size={15} /> 1. Issue GRN
                          </button>
                          <button
                            type="button"
                            className="btn btn-warning"
                            onClick={() => setSelectedReattemptOrder(order)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid #f59e0b',
                              color: '#fbbf24',
                              cursor: 'pointer',
                              borderRadius: 6
                            }}
                            title={`Create new order RN-${order.order_number.replace(/^RN-/, '')} to reattempt delivery`}
                          >
                            <Truck size={15} /> 2. Re-attempt Delivery
                          </button>

                          <div className="action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === order.id ? null : order.id);
                              }}
                              className="btn btn-outline"
                              style={{
                                padding: '0.4rem 0.5rem',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderColor: openActionMenuId === order.id ? '#38bdf8' : '#334155',
                                background: openActionMenuId === order.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                                color: openActionMenuId === order.id ? '#38bdf8' : '#cbd5e1',
                                cursor: 'pointer'
                              }}
                              title="More actions (Sale Order PDF, Excel XLS)"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openActionMenuId === order.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: isLastGrnItem ? 'auto' : 'calc(100% + 4px)',
                                  bottom: isLastGrnItem ? 'calc(100% + 4px)' : 'auto',
                                  zIndex: 150,
                                  minWidth: 190,
                                  background: '#0f172a',
                                  border: '1px solid #334155',
                                  borderRadius: 8,
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                                  padding: '0.35rem 0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  textAlign: 'left'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    if (onViewInvoice) onViewInvoice(order, 'SALES_ORDER');
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#38bdf8',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  title="View or Print Sales Order Booking Form PDF"
                                >
                                  <FileText size={15} color="#38bdf8" />
                                  <span>Sale Order PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    exportOrderProductSheet(order);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#34d399',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  title={`Download ${order.order_number}.xlsx`}
                                >
                                  <FileSpreadsheet size={15} color="#34d399" />
                                  <span>Export Excel (XLS)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

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

            {isOrderDispatchedOrBeyond(selectedOrderForInvoice.status) && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={16} color="#ef4444" />
                <span>Order has been dispatched ({selectedOrderForInvoice.status}). Bill modifications are locked.</span>
              </div>
            )}

            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ color: '#94a3b8' }}>Party Name: <strong style={{ color: '#f8fafc' }}>{getPartyName(selectedOrderForInvoice)}</strong></div>
              <div style={{ color: '#94a3b8', marginTop: 3 }}>Payment Type: <strong style={{ color: '#38bdf8' }}>{selectedOrderForInvoice.payment_type || 'CREDIT'}</strong></div>
              <div style={{ color: '#94a3b8', marginTop: 3 }}>
                New Bill Amount: <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>
                  {billingAmountInput !== '' ? `₹${Number(billingAmountInput).toLocaleString('en-IN')}` : '— (Pending Entry)'}
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
                  const isOrderFMCD = Boolean(
                    (selectedOrderForInvoice as any).company_segment?.toUpperCase() === 'FMCD' ||
                    (selectedOrderForInvoice as any).segment?.toUpperCase() === 'FMCD' ||
                    ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].includes((selectedOrderForInvoice.company_name || (selectedOrderForInvoice as any).company_handle || '').toUpperCase()) ||
                    ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].some(k => (selectedOrderForInvoice.order_number || '').toUpperCase().startsWith(k)) ||
                    ((selectedOrderForInvoice.items || []).length > 0 && (selectedOrderForInvoice.items || []).every(it => !it.pcs_per_box || it.pcs_per_box <= 1))
                  );
                  const isFmcd = isOrderFMCD || pcsPerBox === 1;
                  const ordBox = item.box_qty || 0;
                  const ordLoose = item.loose_pcs || 0;
                  const ordFree = item.free_pcs || 0;
                  const ordTotalPcs = item.total_qty_pcs || ((ordBox * pcsPerBox) + ordLoose + ordFree) || 0;

                  const curBox = billedBoxesByItem[item.id] !== undefined ? billedBoxesByItem[item.id] : (isFmcd ? 0 : ordBox);
                  const curLoose = billedLooseByItem[item.id] !== undefined ? billedLooseByItem[item.id] : (isFmcd ? ordTotalPcs : ordLoose);
                  const boxNum = Number(curBox) || 0;
                  const looseNum = Number(curLoose) || 0;
                  const curRowTotalPcs = (boxNum * pcsPerBox) + looseNum;

                  return (
                    <div key={item.id || idx} style={{ padding: '0.75rem 0.85rem', borderBottom: idx !== (selectedOrderForInvoice.items || []).length - 1 ? '1px solid #1e293b' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem', flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '0.825rem' }}>{item.product_name || item.product_code || 'Product SKU'}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>
                              Approved Qty: {isFmcd ? `${ordTotalPcs.toLocaleString()} PCS` : `${ordBox > 0 ? `${ordBox} BOX` : ''}${ordBox > 0 && ordLoose > 0 ? ', ' : ''}${ordLoose > 0 ? `${ordLoose} PCS` : ''}${ordBox === 0 && ordLoose === 0 ? `${ordTotalPcs} PCS` : ''}`}{ordFree > 0 ? ` (+${ordFree} Free)` : ''} ({ordTotalPcs.toLocaleString()} PCS Total)
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
                            Billed: {isFmcd ? `${curRowTotalPcs.toLocaleString()} PCS` : `${boxNum > 0 ? `${boxNum} BOX` : ''}${boxNum > 0 && looseNum > 0 ? ', ' : ''}${looseNum > 0 ? `${looseNum} PCS` : ''}${boxNum === 0 && looseNum === 0 ? '0 PCS' : ''} (${curRowTotalPcs.toLocaleString()} PCS)`}
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
                              value={curBox === '' ? '' : curBox}
                              onFocus={e => {
                                if (e.target.value === '0') e.target.select();
                              }}
                              onChange={e => handleItemBoxChange(item.id, e.target.value, pcsPerBox)}
                              placeholder="0"
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
                            value={curLoose === '' ? '' : curLoose}
                            onFocus={e => {
                              if (e.target.value === '0') e.target.select();
                            }}
                            onChange={e => handleItemLooseChange(item.id, e.target.value, pcsPerBox)}
                            placeholder="0"
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
                const isOrderFMCD = Boolean(
                  (selectedOrderForInvoice as any).company_segment?.toUpperCase() === 'FMCD' ||
                  (selectedOrderForInvoice as any).segment?.toUpperCase() === 'FMCD' ||
                  ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].includes((selectedOrderForInvoice.company_name || (selectedOrderForInvoice as any).company_handle || '').toUpperCase()) ||
                  ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].some(k => (selectedOrderForInvoice.order_number || '').toUpperCase().startsWith(k)) ||
                  ((selectedOrderForInvoice.items || []).length > 0 && (selectedOrderForInvoice.items || []).every(it => !it.pcs_per_box || it.pcs_per_box <= 1))
                );
                const totalBilledBoxes = Object.values(billedBoxesByItem).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                const totalBilledLoose = Object.values(billedLooseByItem).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                const totalOrderedFreePcs = (selectedOrderForInvoice.items || []).reduce((s, it) => s + (it.free_pcs || 0), 0);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: isOrderFMCD ? '1fr' : 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {!isOrderFMCD && (
                      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>BILLED BOXES</span>
                        <strong style={{ fontSize: '0.825rem', color: '#38bdf8' }}>{totalBilledBoxes} BOX</strong>
                      </div>
                    )}
                    {!isOrderFMCD && (
                      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>BILLED LOOSE PCS</span>
                        <strong style={{ fontSize: '0.825rem', color: '#34d399' }}>{totalBilledLoose} PCS</strong>
                      </div>
                    )}
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
                placeholder="Enter Invoice / Bill Number (Mandatory)"
                style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem' }}
              />
            </div>

            {(() => {
              const isOrderFMCD = Boolean(
                (selectedOrderForInvoice as any).company_segment?.toUpperCase() === 'FMCD' ||
                (selectedOrderForInvoice as any).segment?.toUpperCase() === 'FMCD' ||
                ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].includes((selectedOrderForInvoice.company_name || (selectedOrderForInvoice as any).company_handle || '').toUpperCase()) ||
                ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].some(k => (selectedOrderForInvoice.order_number || '').toUpperCase().startsWith(k)) ||
                ((selectedOrderForInvoice.items || []).length > 0 && (selectedOrderForInvoice.items || []).every(it => !it.pcs_per_box || it.pcs_per_box <= 1))
              );
              const totalBilledBoxes = Object.values(billedBoxesByItem).reduce<number>((a, b) => a + (Number(b) || 0), 0);
              const totalBilledLoose = Object.values(billedLooseByItem).reduce<number>((a, b) => a + (Number(b) || 0), 0);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>TOTAL BILLING QUANTITY</label>
                    <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 6, padding: '0.55rem 0.75rem', color: '#34d399', fontWeight: 800, fontSize: '0.85rem' }}>
                      {isOrderFMCD
                        ? `${billingTotalQtyInput.toLocaleString()} PCS`
                        : (totalBilledBoxes > 0 && totalBilledLoose > 0)
                          ? `${totalBilledBoxes} BOX, ${totalBilledLoose} PCS (${billingTotalQtyInput.toLocaleString()} PCS Total)`
                          : totalBilledBoxes > 0
                            ? `${totalBilledBoxes} BOX (${billingTotalQtyInput.toLocaleString()} PCS Total)`
                            : `${billingTotalQtyInput.toLocaleString()} PCS`
                      }
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>Calculated from item billing box &amp; loose quantities.</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>TOTAL BILL AMOUNT (₹)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={billingAmountInput} 
                      onChange={event => setBillingAmountInput(event.target.value === '' ? '' : Math.max(0, Number(event.target.value)))} 
                      placeholder="Enter Bill Amount (₹)" 
                      style={{ width: '100%', padding: '0.55rem 0.65rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', fontWeight: 800, fontSize: '0.85rem' }} 
                    />
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>Enter billing cost manually.</span>
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
                onChange={e => setCreditDaysInput(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="Enter Credit Days (e.g. 15, 30, 45)"
                style={{ width: '100%', padding: '0.5rem', background: selectedOrderForInvoice.payment_type === 'ADVANCE' ? '#334155' : '#0f172a', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 800, fontSize: '0.85rem' }}
              />
              {selectedOrderForInvoice.payment_type === 'ADVANCE' && (
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>🔒 Advance Orders automatically locked at 0 Credit Days</span>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>BILLING REMARK</label>
              <textarea rows={2} value={invoiceRemark || ''} onChange={event => setInvoiceRemark(event.target.value)} placeholder="Remark..." style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => selectedOrderForInvoice && onViewInvoice && onViewInvoice(selectedOrderForInvoice, 'SALES_ORDER')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                  title={`View / Print Sale Order PDF for ${selectedOrderForInvoice.order_number}`}
                >
                  <FileText size={16} /> View Sale Order PDF
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => selectedOrderForInvoice && exportOrderProductSheet(selectedOrderForInvoice)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                  title={`Download ${selectedOrderForInvoice.order_number}.xlsx (Ordered Products Sheet)`}
                >
                  <FileSpreadsheet size={16} /> Download Excel (XLS)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-outline" onClick={() => setSelectedOrderForInvoice(null)}>Cancel</button>
                <button 
                  className="btn btn-success" 
                  onClick={handleConfirmInvoice} 
                  disabled={isOrderDispatchedOrBeyond(selectedOrderForInvoice.status)}
                  style={{ 
                    fontWeight: 800,
                    ...(isOrderDispatchedOrBeyond(selectedOrderForInvoice.status) ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                  }}
                >
                  <CheckCircle2 size={16} /> {selectedOrderForInvoice.invoice_number ? 'Update & Save Invoice' : 'Confirm Bill & Lock Credit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRN Generation Modal */}
      {selectedGrnOrder && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackageX size={22} color="#fb7185" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Issue GRN (Goods Receipt Note)
                </h3>
              </div>
              <button onClick={() => setSelectedGrnOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Order & Exception Details Banner */}
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <div>Order Number: <strong style={{ color: '#38bdf8' }}>{selectedGrnOrder.order_number}</strong></div>
                <div>Bill No: <strong style={{ color: '#fbbf24' }}>{selectedGrnOrder.invoice_number || 'Pending'}</strong></div>
              </div>
              <div style={{ marginTop: 4 }}>B2B Agency: <strong style={{ color: '#f8fafc' }}>{getPartyName(selectedGrnOrder)}</strong></div>
              <div style={{ marginTop: 4 }}>Original Bill Value: <strong style={{ color: '#34d399' }}>₹{(selectedGrnOrder.invoice_amount || selectedGrnOrder.total_amount || 0).toLocaleString()}</strong></div>
              
              {selectedGrnOrder.pod_issue_type && (
                <div style={{ marginTop: 6, padding: '0.4rem 0.6rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6 }}>
                  <div style={{ color: '#fb7185', fontWeight: 800, fontSize: '0.75rem' }}>
                    ⚠️ POD Exception: {selectedGrnOrder.pod_issue_type}
                  </div>
                  {selectedGrnOrder.pod_issue_details && (
                    <div style={{ color: '#cbd5e1', fontSize: '0.72rem', marginTop: 2 }}>
                      {selectedGrnOrder.pod_issue_details}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GRN Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#fb7185', marginBottom: 4 }}>
                  GRN NUMBER (Mandatory)*
                </label>
                <input
                  type="text"
                  value={grnNumberInput}
                  onChange={event => setGrnNumberInput(event.target.value)}
                  placeholder="e.g. GRN-2026-0001"
                  style={{ width: '100%', padding: '0.55rem 0.65rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
                  GRN DATE (Mandatory)*
                </label>
                <input
                  type="date"
                  value={grnDateInput}
                  onChange={event => setGrnDateInput(event.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
                GRN VALUE / CREDIT SETTLEMENT AMOUNT (₹)*
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={grnValueInput}
                onChange={event => setGrnValueInput(Number(event.target.value) || 0)}
                placeholder="Enter credit note / GRN amount"
                style={{ width: '100%', padding: '0.55rem 0.65rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>
                Value of damaged/returned goods or shortage adjustment for accounting credit ledger.
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                GRN REMARK / SETTLEMENT REASON*
              </label>
              <textarea
                rows={3}
                value={grnRemarkInput || ''}
                onChange={event => setGrnRemarkInput(event.target.value)}
                placeholder="Remark..."
                style={{ width: '100%', padding: '0.55rem 0.65rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', fontSize: '0.8rem', resize: 'vertical' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedGrnOrder(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={!grnNumberInput.trim() || !grnDateInput || grnValueInput <= 0 || !grnRemarkInput.trim()}
                onClick={() => {
                  onCompleteGrn?.(selectedGrnOrder.id, grnNumberInput.trim(), grnDateInput, grnValueInput, grnRemarkInput.trim());
                  setSelectedGrnOrder(null);
                }}
                style={{ fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileCheck2 size={16} /> Confirm &amp; Issue GRN
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Re-attempt Delivery Confirmation Modal */}
      {selectedReattemptOrder && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={22} color="#fbbf24" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Re-attempt Delivery (Create New Order)
                </h3>
              </div>
              <button onClick={() => setSelectedReattemptOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ marginBottom: 6 }}>
                Parent Order: <strong style={{ color: '#f8fafc' }}>{selectedReattemptOrder.order_number}</strong>
              </div>
              <div style={{ marginBottom: 6 }}>
                New Order to be Created: <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>RN-{selectedReattemptOrder.order_number.replace(/^RN-/, '')}</strong>
              </div>
              <div style={{ marginBottom: 6 }}>
                B2B Agency / Party: <strong style={{ color: '#f8fafc' }}>{selectedReattemptOrder.agency_name}</strong>
              </div>
              <div>
                Order Value: <strong style={{ color: '#34d399' }}>₹{Number(selectedReattemptOrder.total_amount || 0).toLocaleString()}</strong> ({selectedReattemptOrder.items?.length || 0} product lines copied)
              </div>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              ℹ️ In accordance with standard SOP, creating a re-attempt delivery will generate a <strong>brand new order</strong> with order number <strong>RN-{selectedReattemptOrder.order_number.replace(/^RN-/, '')}</strong>. All items, quantities, and pricing are preserved so it can be billed and dispatched through the normal delivery process. The parent order will be marked as re-attempted.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedReattemptOrder(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={() => {
                  if (onReattemptDelivery) {
                    onReattemptDelivery(selectedReattemptOrder);
                  }
                  setSelectedReattemptOrder(null);
                }}
                style={{ fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Truck size={16} /> Confirm &amp; Create RN Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
