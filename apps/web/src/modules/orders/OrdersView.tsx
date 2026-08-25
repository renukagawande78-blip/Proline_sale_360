import React, { useState } from 'react';
import {
  Search, Plus, ShieldCheck, Ban, Trash2, FileText, MoreVertical, X,
  RefreshCw, Edit, PauseCircle, CheckCircle, Clock, AlertTriangle,
  Truck, Receipt, CheckCircle2, User, Building2, Phone, CreditCard,
  Package, MapPin, MessageSquare, Send, ChevronRight, Zap, Shield,
  XCircle, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCompaniesFromSupabase, isCompanyAllowedForUser, getOrderAccessPermission, MOCK_COMPANIES } from '../../lib/supabase';
import { Order, Company, PermissionControl } from '../../types';
import { PermissionDeniedModal } from '../../components/PermissionDeniedModal';

interface OrdersViewProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onOpenEditOrder?: (order: Order) => void;
  onSelectOrderForApproval: (order: Order) => void;
  onApprove?: (orderId: string, remarks: string, details?: any) => void;
  onHold?: (orderId: string, reasonId: string, remarks: string) => void;
  onReject?: (orderId: string, remarks: string) => void;
  onViewInvoice?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onOpenReturnRequestModal?: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenCreateOrder,
  onOpenEditOrder,
  onSelectOrderForApproval,
  onApprove,
  onHold,
  onReject,
  onViewInvoice,
  onCancelOrder,
  onDeleteOrder,
  onOpenReturnRequestModal
}) => {
  const { currentUser, hasPermission } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const isSuperAdmin = role === 'SUPER_ADMIN'
    || (currentUser?.full_name || '').toLowerCase().includes('chirag')
    || (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const isSalesAdmin = role === 'SALES_ADMIN';

  const canAddOrder = hasPermission('add_order') || hasPermission('order_entry');

  // Active tab for filtering
  type Stage2Tab = 'ALL' | 'NEW' | 'REVIEW_REQUIRED' | 'APPROVAL_NEEDED' | 'HARSHAD_APPROVED' | 'ON_HOLD' | 'REJECTED';
  const [activeTab, setActiveTab] = useState<Stage2Tab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [liveCompanies, setLiveCompanies] = useState<Company[]>([]);

  // Selected order for right-side panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Super Admin Approval Modal
  const [approvalModal, setApprovalModal] = useState<Order | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [showHoldInput, setShowHoldInput] = useState(false);
  const [sentToHarshad, setSentToHarshad] = useState(false);
  const [approvedBySuperAdmin, setApprovedBySuperAdmin] = useState(false);

  // Sales Admin quick actions
  const [salesActionRemarks, setSalesActionRemarks] = useState('');

  const [deniedModal, setDeniedModal] = useState<{ isOpen: boolean; actionName: string; key: keyof PermissionControl }>({
    isOpen: false, actionName: '', key: 'add_order'
  });

  React.useEffect(() => {
    fetchCompaniesFromSupabase().then(comps => {
      if (comps && comps.length > 0) setLiveCompanies(comps);
    });
  }, []);

  const companiesPool = liveCompanies.length > 0 ? liveCompanies : MOCK_COMPANIES;
  const allowedCompanies = isSuperAdmin
    ? companiesPool
    : companiesPool.filter(c => isCompanyAllowedForUser(c.company_name, currentUser?.company_handle, c.company_code));


  // Scoped orders
  const scopedOrders = orders.filter(o => {
    const accessPerm = getOrderAccessPermission(o, currentUser, companiesPool);
    return accessPerm.canView;
  });

  // Count buckets (matching screenshot labels)
  const countNew = scopedOrders.filter(o => o.status === 'SUBMITTED').length;
  const countReviewRequired = scopedOrders.filter(o => o.status === 'SUBMITTED' && !o.sales_admin_approved).length;
  const countApprovalNeeded = scopedOrders.filter(o => o.status === 'SALES_ADMIN_APPROVED').length;
  const countHarshadApproved = scopedOrders.filter(o => o.status === 'APPROVED').length;
  const countOnHold = scopedOrders.filter(o => o.status === 'HELD').length;
  const countRejected = scopedOrders.filter(o => o.status === 'REJECTED').length;

  const valueNew = scopedOrders.filter(o => o.status === 'SUBMITTED').reduce((s, o) => s + (o.total_amount || 0), 0);
  const valueReview = scopedOrders.filter(o => o.status === 'SUBMITTED' && !o.sales_admin_approved).reduce((s, o) => s + (o.total_amount || 0), 0);
  const valueApprovalNeeded = scopedOrders.filter(o => o.status === 'SALES_ADMIN_APPROVED').reduce((s, o) => s + (o.total_amount || 0), 0);
  const valueHarshadApproved = scopedOrders.filter(o => o.status === 'APPROVED').reduce((s, o) => s + (o.total_amount || 0), 0);
  const valueOnHold = scopedOrders.filter(o => o.status === 'HELD').reduce((s, o) => s + (o.total_amount || 0), 0);
  const valueRejected = scopedOrders.filter(o => o.status === 'REJECTED').reduce((s, o) => s + (o.total_amount || 0), 0);

  // Tab filters
  const filteredOrders = scopedOrders.filter(o => {
    if (activeTab === 'NEW' && o.status !== 'SUBMITTED') return false;
    if (activeTab === 'REVIEW_REQUIRED' && !(o.status === 'SUBMITTED' && !o.sales_admin_approved)) return false;
    if (activeTab === 'APPROVAL_NEEDED' && o.status !== 'SALES_ADMIN_APPROVED') return false;
    if (activeTab === 'HARSHAD_APPROVED' && o.status !== 'APPROVED') return false;
    if (activeTab === 'ON_HOLD' && o.status !== 'HELD') return false;
    if (activeTab === 'REJECTED' && o.status !== 'REJECTED') return false;

    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q
      || o.order_number.toLowerCase().includes(q)
      || (o.agency_name || '').toLowerCase().includes(q)
      || (o.salesperson_name || '').toLowerCase().includes(q)
      || (o.company_name || '').toLowerCase().includes(q);

    const matchCompany = selectedCompany === 'ALL'
      || o.company_id === selectedCompany
      || isCompanyAllowedForUser(o.company_name, selectedCompany);

    return matchSearch && matchCompany;
  });

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '\n' +
        dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return d; }
  };

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  // Stage 2 action label per order/role
  const getStage2Action = (order: Order) => {
    if (order.status === 'SUBMITTED' && !order.sales_admin_approved) return { label: 'Review Required', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)' };
    if (order.status === 'SUBMITTED' && order.sales_admin_approved) return { label: 'Review Required', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)' };
    if (order.status === 'SALES_ADMIN_APPROVED') return { label: 'Approval Needed', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
    if (order.status === 'APPROVED') return { label: '— Ready for Stage 3', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' };
    if (order.status === 'HELD') return { label: 'Order On Hold', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
    if (order.status === 'REJECTED') return { label: 'Rejected', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)' };
    return { label: order.status, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
  };

  const getStatusBadge = (order: Order) => {
    if (order.status === 'SUBMITTED') return { label: 'NEW', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' };
    if (order.status === 'SALES_ADMIN_APPROVED') return { label: 'APPROVAL NEEDED', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
    if (order.status === 'APPROVED') return { label: 'HARSHAD SIR APPROVED', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' };
    if (order.status === 'HELD') return { label: 'ON HOLD', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    if (order.status === 'REJECTED') return { label: 'REJECTED', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)' };
    return { label: order.status, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
  };

  // Is Harshad Sir Approval Needed state
  const [needsHarshadApproval, setNeedsHarshadApproval] = useState<'YES' | 'NO'>('YES');
  const [harshadMessage, setHarshadMessage] = useState('Please approve this order. Customer requires urgent dispatch.');
  const [directActionType, setDirectActionType] = useState<'APPROVE' | 'HOLD' | 'REJECT'>('APPROVE');
  const [directReasonInput, setDirectReasonInput] = useState('');

  const openReviewModal = (order: Order) => {
    setApprovalModal(order);
    setNeedsHarshadApproval(order.status === 'SALES_ADMIN_APPROVED' ? 'NO' : 'YES');
    setHarshadMessage(order.sales_admin_remarks || 'Please approve this order. Customer requires urgent dispatch.');
    setDirectActionType('APPROVE');
    setDirectReasonInput('');
    setApprovalRemarks('');
    setHoldReason('');
    setShowHoldInput(false);
  };

  const handleForwardToHarshadSir = (order: Order) => {
    if (onApprove) {
      onApprove(order.id, harshadMessage || 'Forwarded for Harshad Sir approval', {
        directApprove: false,
        payment_type: order.payment_type || 'CREDIT',
        priority: order.priority || 'MEDIUM',
        inventory_status: 'IN_STOCK'
      });
    }
    // Show success confirmation briefly before closing
    setSentToHarshad(true);
    setTimeout(() => {
      setSentToHarshad(false);
      setApprovalModal(null);
      setSelectedOrder(null);
      setHarshadMessage('Please approve this order. Customer requires urgent dispatch.');
    }, 1800);
  };

  const handleDirectApprove = (order: Order) => {
    if (onApprove) {
      onApprove(order.id, directReasonInput || 'Approved directly by Sales Admin', {
        directApprove: true,
        payment_type: order.payment_type || 'CREDIT',
        priority: order.priority || 'MEDIUM',
        inventory_status: 'IN_STOCK'
      });
    }
    setApprovalModal(null);
    setSelectedOrder(null);
    setDirectReasonInput('');
  };

  const handleDirectHold = (order: Order) => {
    if (onHold) {
      onHold(order.id, 'SALES_ADMIN_HOLD', directReasonInput || 'Hold requested by Sales Admin');
    }
    setApprovalModal(null);
    setSelectedOrder(null);
    setDirectReasonInput('');
  };

  const handleDirectReject = (order: Order) => {
    if (onReject) {
      onReject(order.id, directReasonInput || 'Rejected by Sales Admin');
    }
    setApprovalModal(null);
    setSelectedOrder(null);
    setDirectReasonInput('');
  };

  const handleSuperAdminApprove = (order: Order) => {
    if (onApprove) {
      onApprove(order.id, approvalRemarks || 'Approved by Harshad Sir', {
        payment_type: order.payment_type || 'CREDIT',
        priority: order.priority || 'MEDIUM',
        inventory_status: 'IN_STOCK'
      });
    }
    // Show approval success screen briefly before closing
    setApprovedBySuperAdmin(true);
    setTimeout(() => {
      setApprovedBySuperAdmin(false);
      setApprovalModal(null);
      setApprovalRemarks('');
    }, 2000);
  };

  const handleSuperAdminHold = (order: Order) => {
    if (onHold) onHold(order.id, 'ADMIN_HOLD', holdReason || 'Held by Harshad Sir');
    setApprovalModal(null);
    setHoldReason('');
    setShowHoldInput(false);
  };

  const handleSuperAdminReject = (order: Order) => {
    if (onReject) onReject(order.id, approvalRemarks || 'Rejected by Harshad Sir / Chirag Sir');
    setApprovalModal(null);
    setApprovalRemarks('');
  };


  // KPI card definitions matching screenshot
  const kpiCards = [
    {
      id: 'NEW' as Stage2Tab,
      label: 'NEW ORDERS',
      count: countNew,
      value: valueNew,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.12)',
      activeBg: 'rgba(56,189,248,0.2)',
      border: 'rgba(56,189,248,0.3)',
      icon: '📦',
      sub: 'Just Added'
    },
    {
      id: 'REVIEW_REQUIRED' as Stage2Tab,
      label: 'REVIEW REQUIRED',
      count: countReviewRequired,
      value: valueReview,
      color: '#fb923c',
      bg: 'rgba(251,146,60,0.12)',
      activeBg: 'rgba(251,146,60,0.2)',
      border: 'rgba(251,146,60,0.3)',
      icon: '👁️',
      sub: 'Sales Admin Review'
    },
    {
      id: 'APPROVAL_NEEDED' as Stage2Tab,
      label: 'APPROVAL NEEDED',
      count: countApprovalNeeded,
      value: valueApprovalNeeded,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.12)',
      activeBg: 'rgba(251,191,36,0.2)',
      border: 'rgba(251,191,36,0.3)',
      icon: '⚠️',
      sub: 'Awaiting Harshad Sir'
    },
    {
      id: 'HARSHAD_APPROVED' as Stage2Tab,
      label: 'HARSHAD SIR APPROVED',
      count: countHarshadApproved,
      value: valueHarshadApproved,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.12)',
      activeBg: 'rgba(52,211,153,0.2)',
      border: 'rgba(52,211,153,0.3)',
      icon: '✅',
      sub: 'Ready for Stage 3'
    },
    {
      id: 'ON_HOLD' as Stage2Tab,
      label: 'ON HOLD (FROZEN)',
      count: countOnHold,
      value: valueOnHold,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      activeBg: 'rgba(245,158,11,0.2)',
      border: 'rgba(245,158,11,0.3)',
      icon: '⏸️',
      sub: 'By Harshad Sir'
    },
    {
      id: 'REJECTED' as Stage2Tab,
      label: 'REJECTED',
      count: countRejected,
      value: valueRejected,
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.12)',
      activeBg: 'rgba(244,63,94,0.2)',
      border: 'rgba(244,63,94,0.3)',
      icon: '❌',
      sub: 'By Chirag Sir'
    },
  ];

  // Tab labels
  const tabDefs: { id: Stage2Tab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Orders', count: scopedOrders.length },
    { id: 'NEW', label: 'New', count: countNew },
    { id: 'REVIEW_REQUIRED', label: 'Review Required', count: countReviewRequired },
    { id: 'APPROVAL_NEEDED', label: 'Approval Needed', count: countApprovalNeeded },
    { id: 'HARSHAD_APPROVED', label: 'Approved', count: countHarshadApproved },
    { id: 'ON_HOLD', label: 'On Hold', count: countOnHold },
    { id: 'REJECTED', label: 'Rejected', count: countRejected },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, overflow: 'hidden' }}>

      {/* ── LEFT MAIN COLUMN ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minWidth: 0 }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Home &rsaquo; Orders &rsaquo;</span>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>Review &amp; Approvals (Stage 2)</span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Review &amp; Approvals (Stage 2)</h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 3 }}>Sales Admin Review, Super Admin Approval &amp; On Hold Management</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#1e293b', border: '1px solid #334155', padding: '0.35rem 0.65rem', borderRadius: 6 }}>
              📅 Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            {canAddOrder && (
              <button className="btn btn-primary" onClick={onOpenCreateOrder} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.85rem' }}>
                <Plus size={15} /> Create Order
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {kpiCards.map(card => {
            const isActive = activeTab === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                style={{
                  background: isActive ? card.activeBg : '#0f172a',
                  border: isActive ? `2px solid ${card.color}` : `1px solid ${card.border}`,
                  borderRadius: 10,
                  padding: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.count}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>{fmt(card.value)}</div>
                  </div>
                  <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: card.color, fontWeight: 700, marginTop: 6, opacity: 0.8 }}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '0.35rem', marginBottom: '1rem', overflowX: 'auto' }}>
          {tabDefs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 7,
                  border: 'none',
                  background: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#f8fafc' : '#64748b',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800,
                    background: isActive ? '#38bdf8' : '#334155',
                    color: isActive ? '#0f172a' : '#94a3b8',
                    padding: '0.1rem 0.45rem', borderRadius: 20
                  }}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Filter Bar */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 7, padding: '0.45rem 0.75rem', gap: '0.5rem' }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search by Order No., Customer, Sales Person..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '0.825rem', width: '100%' }}
            />
          </div>
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 7, color: 'white', fontSize: '0.825rem', fontWeight: 600 }}>
            <option value="ALL">All Companies</option>
            {allowedCompanies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 7, color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
            🔽 Filters
          </button>
        </div>

        {/* Orders Table */}
        <div className="data-table-container">
          <table className="data-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: 24 }}></th>
                <th>ORDER NO.</th>
                <th>ORDER DATE</th>
                <th>CUSTOMER / PARTY</th>
                <th>SALES PERSON</th>
                <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                <th style={{ textAlign: 'center', width: 160 }}>STATUS</th>
                <th style={{ textAlign: 'center', width: 170 }}>STAGE 2 ACTION</th>
                <th style={{ textAlign: 'center', width: 80 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                    No orders found for this filter.
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                const badge = getStatusBadge(order);
                const stage2 = getStage2Action(order);
                const isSelected = selectedOrder?.id === order.id;
                const accessPerm = getOrderAccessPermission(order, currentUser, companiesPool);

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(56,189,248,0.06)' : undefined,
                      borderLeft: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Star / pin */}
                    <td style={{ textAlign: 'center', color: '#334155', fontSize: '0.9rem' }}>☆</td>

                    {/* Order Number */}
                    <td>
                      <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.825rem' }}>{order.order_number}</div>
                      {order.status === 'SUBMITTED' && !order.sales_admin_approved && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>NEW</span>
                      )}
                    </td>

                    {/* Order Date */}
                    <td style={{ fontSize: '0.775rem', color: '#cbd5e1', whiteSpace: 'pre-line' }}>
                      {formatDate(order.order_date)}
                    </td>

                    {/* Customer / Party */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.825rem' }}>{order.agency_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{order.area_name || order.company_name}</div>
                    </td>

                    {/* Salesperson */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.8rem' }}>{order.salesperson_name || '—'}</div>
                      {order.company_name && (
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>{order.company_name}</div>
                      )}
                    </td>

                    {/* Amount */}
                    <td style={{ textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: '0.875rem' }}>
                      {Number(order.total_amount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td style={{ textAlign: 'center' }}>
                      <div>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800,
                          color: badge.color, background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem', borderRadius: 20,
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                        }}>
                          {badge.label}
                        </span>
                        {order.status === 'HELD' && order.hold_reason && (
                          <div style={{ fontSize: '0.62rem', color: '#f59e0b', marginTop: 3 }}>By Harshad Sir</div>
                        )}
                        {order.status === 'REJECTED' && (
                          <div style={{ fontSize: '0.62rem', color: '#f43f5e', marginTop: 3 }}>By Chirag Sir</div>
                        )}
                        {order.status === 'APPROVED' && (
                          <div style={{ fontSize: '0.62rem', color: '#34d399', marginTop: 3 }}>Ready for Stage 3</div>
                        )}
                      </div>
                    </td>

                    {/* Stage 2 Action */}
                    <td style={{ textAlign: 'center' }}>
                      {order.status === 'SUBMITTED' && (isSalesAdmin || isSuperAdmin) ? (
                        <button
                          onClick={e => { e.stopPropagation(); openReviewModal(order); }}
                          style={{
                            fontSize: '0.72rem', fontWeight: 800,
                            color: '#fb923c',
                            background: 'rgba(251,146,60,0.12)',
                            border: '1px solid rgba(251,146,60,0.35)',
                            padding: '0.25rem 0.65rem', borderRadius: 6,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                          }}
                        >
                          <Clock size={11} /> Review
                        </button>
                      ) : order.status === 'SALES_ADMIN_APPROVED' && isSuperAdmin ? (
                        <button
                          onClick={e => { e.stopPropagation(); openReviewModal(order); }}
                          style={{
                            fontSize: '0.72rem', fontWeight: 800,
                            color: '#fbbf24',
                            background: 'rgba(251,191,36,0.12)',
                            border: '1px solid rgba(251,191,36,0.3)',
                            padding: '0.25rem 0.65rem', borderRadius: 6,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                          }}
                        >
                          <ShieldCheck size={11} /> Approval Needed
                        </button>
                      ) : (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700,
                          color: stage2.color, background: stage2.bg,
                          border: `1px solid ${stage2.border}`,
                          padding: '0.2rem 0.55rem', borderRadius: 6,
                          display: 'inline-block'
                        }}>
                          {stage2.label}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                          style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.3rem 0.55rem', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          View
                        </button>
                        {onViewInvoice && (
                          <button
                            onClick={e => { e.stopPropagation(); onViewInvoice(order); }}
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#fbbf24', padding: '0.3rem 0.35rem', borderRadius: 5, cursor: 'pointer' }}
                            title="Invoice"
                          >
                            <Receipt size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RIGHT PANEL: Order Details ──────────────────────────────── */}
      {selectedOrder && (
        <div style={{
          width: 320,
          flexShrink: 0,
          background: '#0b1120',
          borderLeft: '1px solid #1e293b',
          overflowY: 'auto',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Order Details</h3>
            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* Order Number + Status */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>{selectedOrder.order_number}</span>
              {(() => { const b = getStatusBadge(selectedOrder); return (
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: b.color, background: b.bg, border: `1px solid ${b.border}`, padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                  {b.label}
                </span>
              ); })()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
              Created on {formatDate(selectedOrder.order_date)}
            </div>
          </div>

          {/* Customer & Party */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Building2 size={13} color="#64748b" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>CUSTOMER / PARTY</span>
            </div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.875rem' }}>{selectedOrder.agency_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{selectedOrder.area_name || '—'}</div>
          </div>

          {/* Sales Person */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <User size={13} color="#64748b" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>SALES PERSON</span>
            </div>
            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>{selectedOrder.salesperson_name || '—'}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>Company / Brand: <strong style={{ color: '#fbbf24' }}>{selectedOrder.company_name}</strong></div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Currency: INR</div>
          </div>

          {/* Order Summary */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.6rem' }}>ORDER SUMMARY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { label: 'Order Amount', value: '₹ ' + Number(selectedOrder.total_amount || 0).toLocaleString('en-IN'), color: '#10b981' },
                { label: 'Total Boxes', value: selectedOrder.total_box_qty + ' Boxes', color: '#f8fafc' },
                { label: 'Total Qty (Pcs)', value: selectedOrder.total_qty_pcs + ' PCS', color: '#38bdf8' },
                { label: 'Est. CTS', value: selectedOrder.items?.length ? selectedOrder.items.reduce((s, i) => s + (i.unit_price || 0), 0).toFixed(2) : '—', color: '#94a3b8' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#0b1120', padding: '0.5rem', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 800, color, fontSize: '0.825rem' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit & Payment */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.55rem' }}>
              <CreditCard size={13} color="#64748b" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>CREDIT &amp; PAYMENT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.775rem' }}>
              <div><span style={{ color: '#64748b' }}>Payment Type</span><br /><strong style={{ color: '#f8fafc' }}>{selectedOrder.payment_type || 'Credit'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Credit Days</span><br /><strong style={{ color: '#f8fafc' }}>{selectedOrder.credit_days || 30} Days</strong></div>
              <div><span style={{ color: '#64748b' }}>Credit Limit</span><br /><strong style={{ color: '#fbbf24' }}>₹ 5,00,000</strong></div>
              <div><span style={{ color: '#64748b' }}>Available Limit</span><br /><strong style={{ color: '#10b981' }}>₹ 2,80,000</strong></div>
            </div>
          </div>

          {/* Delivery */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>ORDER TYPE / DELIVERY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.775rem' }}>
              <div><span style={{ color: '#64748b' }}>Order Type</span><br /><strong style={{ color: '#f8fafc' }}>Regular Order</strong></div>
              <div><span style={{ color: '#64748b' }}>Delivery Type</span><br /><strong style={{ color: '#f8fafc' }}>{selectedOrder.delivery_type || 'F.O.R'} {selectedOrder.area_name ? '· ' + selectedOrder.area_name : ''}</strong></div>
              {selectedOrder.remarks && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#64748b' }}>Remarks</span><br /><em style={{ color: '#94a3b8' }}>{selectedOrder.remarks}</em></div>}
            </div>
          </div>

          {/* Sales Admin Actions (shown when order is SUBMITTED and user is Sales Admin / Super Admin) */}
          {(order => order.status === 'SUBMITTED' && (isSalesAdmin || isSuperAdmin))(selectedOrder) && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🛡️</span> IS HARSHAD SIR APPROVAL NEEDED?
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => openReviewModal(selectedOrder)}
                  style={{
                    flex: 1, padding: '0.5rem 0.4rem', borderRadius: 6,
                    background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
                    color: '#fbbf24', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem'
                  }}
                >
                  <MessageSquare size={14} color="#fbbf24" />
                  <span>YES - Send to Harshad Sir</span>
                </button>
                <button
                  type="button"
                  onClick={() => openReviewModal(selectedOrder)}
                  style={{
                    flex: 1, padding: '0.5rem 0.4rem', borderRadius: 6,
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                    color: '#34d399', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem'
                  }}
                >
                  <Zap size={14} color="#34d399" />
                  <span>NO - Direct Action</span>
                </button>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center' }}>
                Click either button to open the Stage 2 Review Console
              </div>
            </div>
          )}

          {/* View Full Details button */}
          <button
            onClick={() => onSelectOrderForApproval(selectedOrder)}
            style={{ width: '100%', padding: '0.55rem', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, color: '#38bdf8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <FileText size={14} /> View Full Order Details
          </button>
        </div>
      )}

      {/* ── STAGE 2 REVIEW & APPROVAL MODAL ───────────────────────── */}
      {approvalModal && (
        <div className="modal-overlay">
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 14,
            width: '96vw',
            maxWidth: 960,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
          }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isSuperAdmin && approvalModal.status === 'SALES_ADMIN_APPROVED' ? (
                    <><span>👑</span> Super Admin Final Sign-off (Harshad Sir / Chirag Sir)</>
                  ) : (
                    <><span>📋</span> Sales Admin Review &amp; Approval Routing (Stage 2)</>
                  )}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.775rem', color: '#94a3b8' }}>
                  <strong style={{ color: '#38bdf8' }}>{approvalModal.order_number}</strong> · {approvalModal.agency_name} ({approvalModal.area_name}) · <strong style={{ color: '#10b981' }}>₹ {Number(approvalModal.total_amount || 0).toLocaleString('en-IN')}</strong>
                  {approvalModal.company_name && <span style={{ marginLeft: 8, color: '#fbbf24' }}>[{approvalModal.company_name}]</span>}
                </p>
              </div>
              <button onClick={() => setApprovalModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>

                <X size={20} />
              </button>
            </div>

            {/* ── SUCCESS: Forwarded to Harshad Sir ── */}
            {sentToHarshad ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '3.5rem 2rem', gap: '1rem', textAlign: 'center'
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(251,191,36,0.15)', border: '2.5px solid #f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.2rem'
                }}>
                  ✈️
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24' }}>
                  Sent to Harshad Sir!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: 340, lineHeight: 1.6 }}>
                  Order <strong style={{ color: '#38bdf8' }}>{approvalModal.order_number}</strong> has been forwarded to Harshad Sir for final approval. It will no longer appear in your queue.
                </div>
                <div style={{
                  marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b',
                  background: '#0f172a', padding: '0.45rem 1rem', borderRadius: 20,
                  border: '1px solid #1e293b'
                }}>
                  Closing automatically…
                </div>
              </div>

            ) : approvedBySuperAdmin ? (

              /* ── SUCCESS: Super Admin Final Approval ── */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '3.5rem 2rem', gap: '1.1rem', textAlign: 'center'
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.15)', border: '2.5px solid #6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.4rem'
                }}>
                  ✅
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#818cf8' }}>
                  Order Approved!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: 380, lineHeight: 1.7 }}>
                  Order <strong style={{ color: '#38bdf8' }}>{approvalModal.order_number}</strong> has received <strong style={{ color: '#818cf8' }}>Super Admin final sign-off</strong>. It has been routed to <strong style={{ color: '#34d399' }}>Stage 3 — Billing & Dispatch</strong>.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.35rem 0.85rem', borderRadius: 20 }}>
                    ✅ Both Approvals Complete
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.35rem 0.85rem', borderRadius: 20 }}>
                    🚚 Ready for Billing
                  </div>
                </div>
                <div style={{
                  marginTop: '0.25rem', fontSize: '0.72rem', color: '#64748b',
                  background: '#0f172a', padding: '0.45rem 1rem', borderRadius: 20,
                  border: '1px solid #1e293b'
                }}>
                  Closing automatically…
                </div>
              </div>

            ) : (
            <>{/* If Super Admin is approving an order in SALES_ADMIN_APPROVED */}
            {isSuperAdmin && approvalModal.status === 'SALES_ADMIN_APPROVED' ? (

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 0 }}>
                {/* Left: Message from Sales Admin */}
                <div style={{ padding: '1.25rem', borderRight: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.85rem' }}>ROUTING &amp; MESSAGE</div>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>From</div>
                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>
                      {approvalModal.sales_admin_approved_by || 'Sales Admin'} <span style={{ color: '#64748b', fontWeight: 400 }}>(Sales Admin)</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>To</div>
                    <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>Harshad Sir <span style={{ color: '#64748b', fontWeight: 400 }}>(Central Accounts)</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.35rem' }}>Message from Sales Admin</div>
                    <div style={{ background: '#1e293b', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic', lineHeight: 1.6, border: '1px solid rgba(251,191,36,0.2)' }}>
                      "{approvalModal.sales_admin_remarks || 'Please approve this order. Customer requires urgent dispatch.'}"
                    </div>
                  </div>
                </div>

                {/* Middle: Super Admin Decision */}
                <div style={{ padding: '1.25rem', borderRight: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.85rem' }}>SUPER ADMIN DECISION</div>
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                    <button
                      onClick={() => handleSuperAdminApprove(approvalModal)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: 10, cursor: 'pointer' }}
                    >
                      <CheckCircle size={22} color="#34d399" />
                      <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.85rem' }}>Approve</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center' }}>Move to Stage 3 (Billing/Dispatch)</span>
                    </button>
                    <button
                      onClick={() => setShowHoldInput(true)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', background: 'rgba(251,191,36,0.12)', border: '2px solid rgba(251,191,36,0.35)', borderRadius: 10, cursor: 'pointer' }}
                    >
                      <Lock size={22} color="#fbbf24" />
                      <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.85rem' }}>Hold</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center' }}>Freeze Order</span>
                    </button>
                    <button
                      onClick={() => handleSuperAdminReject(approvalModal)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', background: 'rgba(244,63,94,0.12)', border: '2px solid rgba(244,63,94,0.3)', borderRadius: 10, cursor: 'pointer' }}
                    >
                      <XCircle size={22} color="#f43f5e" />
                      <span style={{ fontWeight: 800, color: '#f43f5e', fontSize: '0.85rem' }}>Reject</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center' }}>Decline Order</span>
                    </button>
                  </div>

                  {showHoldInput && (
                    <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '0.65rem', marginBottom: '0.65rem' }}>
                      <input type="text" placeholder="Reason for hold..." value={holdReason} onChange={e => setHoldReason(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', marginBottom: '0.5rem' }} />
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setShowHoldInput(false)} style={{ flex: 1, padding: '0.4rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: '0.775rem' }}>Cancel</button>
                        <button onClick={() => handleSuperAdminHold(approvalModal)} style={{ flex: 1, padding: '0.4rem', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fbbf24', cursor: 'pointer', fontSize: '0.775rem', fontWeight: 800 }}>Confirm Hold</button>
                      </div>
                    </div>
                  )}

                  <input type="text" placeholder="Add your remarks (optional)..." value={approvalRemarks} onChange={e => setApprovalRemarks(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem', marginBottom: '0.75rem' }} />

                  <button onClick={() => setApprovalModal(null)} style={{ width: '100%', padding: '0.45rem', background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                </div>

                {/* Right: Approval Timeline */}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.85rem' }}>APPROVAL TIMELINE</div>
                  <div style={{ position: 'relative', paddingLeft: '1.25rem' }}>
                    <div style={{ position: 'absolute', left: '0.45rem', top: 8, bottom: 8, width: 1, background: '#1e293b' }} />
                    {[
                      { time: formatDate(approvalModal.order_date), text: `Created by ${approvalModal.salesperson_name || 'Sales Representative'}`, color: '#38bdf8', dot: '#38bdf8' },
                      { time: formatDate(approvalModal.sales_admin_approved_at), text: `Reviewed by Sales Admin (${approvalModal.sales_admin_approved_by || 'Sales Admin'})`, color: '#fbbf24', dot: '#fbbf24' },
                      { time: 'Awaiting Sign-off', text: 'Harshad Sir / Chirag Sir (Super Admin)', color: '#a855f7', dot: '#a855f7' }
                    ].map((ev, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: '0.9rem' }}>
                        <div style={{ position: 'absolute', left: '-1.25rem', width: 9, height: 9, borderRadius: '50%', background: ev.dot, top: 3, border: '2px solid #0f172a' }} />
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: ev.color }}>{ev.time}</div>
                        <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: 1 }}>{ev.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Sales Admin Review Workflow: Is Harshad Sir Approval Needed? */
              <div style={{ padding: '1.25rem' }}>

                {/* ── QUESTION BANNER ────────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(135deg, #111e38, #0b1528)',
                  border: '1px solid #1e3a5f',
                  borderRadius: 12,
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🛡️</span> Is Harshad Sir Approval Needed?
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 3 }}>
                        Select <strong>YES</strong> to forward this order to Higher Authority (Harshad Sir) with your message, or <strong>NO</strong> to take direct action yourself.
                      </div>
                    </div>

                    {/* Toggle Buttons */}
                    <div style={{ display: 'flex', gap: '0.6rem', background: '#070d19', padding: '0.3rem', borderRadius: 10, border: '1px solid #1e293b' }}>
                      <button
                        type="button"
                        onClick={() => setNeedsHarshadApproval('YES')}
                        style={{
                          padding: '0.55rem 1.15rem',
                          borderRadius: 8,
                          border: 'none',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: needsHarshadApproval === 'YES' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                          color: needsHarshadApproval === 'YES' ? '#0f172a' : '#94a3b8',
                          boxShadow: needsHarshadApproval === 'YES' ? '0 2px 10px rgba(245,158,11,0.45)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>🟡</span> YES (Forward to Harshad Sir)
                      </button>

                      <button
                        type="button"
                        onClick={() => setNeedsHarshadApproval('NO')}
                        style={{
                          padding: '0.55rem 1.15rem',
                          borderRadius: 8,
                          border: 'none',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: needsHarshadApproval === 'NO' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                          color: needsHarshadApproval === 'NO' ? '#ffffff' : '#94a3b8',
                          boxShadow: needsHarshadApproval === 'NO' ? '0 2px 10px rgba(16,185,129,0.45)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>⚡</span> NO (Direct Action)
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>

                  {/* LEFT COLUMN: The Active Path */}
                  <div>
                    {needsHarshadApproval === 'YES' ? (
                      /* ── YES PATH: Message Window to Harshad Sir ── */
                      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12, padding: '1.15rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MessageSquare size={15} /> COMPOSE MESSAGE FOR HIGHER AUTHORITY (HARSHAD SIR)
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
                          <div style={{ background: '#0f172a', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                            <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700 }}>FROM</div>
                            <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.825rem' }}>
                              {currentUser?.full_name || 'Sales Admin'} <span style={{ color: '#64748b', fontWeight: 400 }}>(Sales Admin)</span>
                            </div>
                          </div>
                          <div style={{ background: '#0f172a', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                            <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700 }}>TO (HIGHER AUTHORITY)</div>
                            <div style={{ color: '#818cf8', fontWeight: 800, fontSize: '0.825rem' }}>
                              Harshad Sir <span style={{ color: '#64748b', fontWeight: 400 }}>(Central Accounts)</span>
                            </div>
                          </div>
                        </div>

                        <label style={{ display: 'block', fontSize: '0.725rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 700 }}>
                          Message / Remarks for Harshad Sir:
                        </label>
                        <textarea
                          rows={3}
                          value={harshadMessage}
                          onChange={e => setHarshadMessage(e.target.value)}
                          placeholder="e.g. Please approve this order. Customer requires urgent dispatch, credit limit verified."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            color: '#f8fafc',
                            fontSize: '0.825rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            marginBottom: '0.65rem',
                            lineHeight: 1.5
                          }}
                        />

                        {/* Quick Templates */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '0.35rem' }}>QUICK TEMPLATES:</div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[
                              'Please approve, urgent dispatch needed.',
                              'Credit limit verified with accounts.',
                              'Advance payment received.',
                              'VIP customer, priority order.',
                              'High value order, special pricing.'
                            ].map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setHarshadMessage(tmpl)}
                                style={{
                                  fontSize: '0.675rem',
                                  padding: '0.25rem 0.55rem',
                                  background: 'rgba(56,189,248,0.08)',
                                  border: '1px solid rgba(56,189,248,0.2)',
                                  borderRadius: 6,
                                  color: '#38bdf8',
                                  cursor: 'pointer'
                                }}
                              >
                                + {tmpl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Forward Button */}
                        <button
                          type="button"
                          onClick={() => handleForwardToHarshadSir(approvalModal)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none',
                            borderRadius: 8,
                            color: '#0f172a',
                            fontWeight: 900,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            boxShadow: '0 4px 12px rgba(245,158,11,0.35)'
                          }}
                        >
                          <Send size={16} /> Send to Harshad Sir for Approval
                        </button>
                      </div>
                    ) : (
                      /* ── NO PATH: Direct Actions by Sales Admin ── */
                      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 12, padding: '1.15rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Zap size={15} /> SELECT DIRECT ACTION (NO HARSHAD SIR APPROVAL)
                        </div>

                        {/* 3 Action Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                          {/* 1. Direct Approve */}
                          <div
                            onClick={() => setDirectActionType('APPROVE')}
                            style={{
                              padding: '0.85rem 0.5rem',
                              borderRadius: 10,
                              cursor: 'pointer',
                              border: `2px solid ${directActionType === 'APPROVE' ? '#10b981' : '#1e293b'}`,
                              background: directActionType === 'APPROVE' ? 'rgba(16,185,129,0.15)' : '#0f172a',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle size={18} color="#34d399" />
                            </div>
                            <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.8rem' }}>Direct Approve</div>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Move to Stage 3 (Billing/Dispatch)</div>
                          </div>

                          {/* 2. Hold */}
                          <div
                            onClick={() => setDirectActionType('HOLD')}
                            style={{
                              padding: '0.85rem 0.5rem',
                              borderRadius: 10,
                              cursor: 'pointer',
                              border: `2px solid ${directActionType === 'HOLD' ? '#fbbf24' : '#1e293b'}`,
                              background: directActionType === 'HOLD' ? 'rgba(251,191,36,0.15)' : '#0f172a',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Lock size={18} color="#fbbf24" />
                            </div>
                            <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.8rem' }}>Put On Hold</div>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Freeze order</div>
                          </div>

                          {/* 3. Reject */}
                          <div
                            onClick={() => setDirectActionType('REJECT')}
                            style={{
                              padding: '0.85rem 0.5rem',
                              borderRadius: 10,
                              cursor: 'pointer',
                              border: `2px solid ${directActionType === 'REJECT' ? '#f43f5e' : '#1e293b'}`,
                              background: directActionType === 'REJECT' ? 'rgba(244,63,94,0.15)' : '#0f172a',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <XCircle size={18} color="#f43f5e" />
                            </div>
                            <div style={{ fontWeight: 800, color: '#f43f5e', fontSize: '0.8rem' }}>Reject Order</div>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Decline order</div>
                          </div>
                        </div>

                        {/* Reason / Remarks Input */}
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.725rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 700 }}>
                            {directActionType === 'APPROVE' && 'Approval Remarks (Optional):'}
                            {directActionType === 'HOLD' && 'Reason for Hold (Required):'}
                            {directActionType === 'REJECT' && 'Rejection Reason (Required):'}
                          </label>
                          <input
                            type="text"
                            value={directReasonInput}
                            onChange={e => setDirectReasonInput(e.target.value)}
                            placeholder={
                              directActionType === 'APPROVE' ? 'e.g. Approved directly, standard order within credit limit' :
                              directActionType === 'HOLD' ? 'e.g. Payment clearance pending from party' :
                              'e.g. Item discontinued / Party requested cancellation'
                            }
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.75rem',
                              background: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: 8,
                              color: '#f8fafc',
                              fontSize: '0.825rem'
                            }}
                          />
                        </div>

                        {/* Confirm Button */}
                        {directActionType === 'APPROVE' && (
                          <button
                            type="button"
                            onClick={() => handleDirectApprove(approvalModal)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                              borderRadius: 8,
                              color: '#ffffff',
                              fontWeight: 900,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(16,185,129,0.35)'
                            }}
                          >
                            <CheckCircle size={16} /> Confirm Direct Approval &amp; Move to Stage 3
                          </button>
                        )}

                        {directActionType === 'HOLD' && (
                          <button
                            type="button"
                            onClick={() => handleDirectHold(approvalModal)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              border: 'none',
                              borderRadius: 8,
                              color: '#0f172a',
                              fontWeight: 900,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(245,158,11,0.35)'
                            }}
                          >
                            <Lock size={16} /> Confirm Put Order On Hold
                          </button>
                        )}

                        {directActionType === 'REJECT' && (
                          <button
                            type="button"
                            onClick={() => handleDirectReject(approvalModal)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                              border: 'none',
                              borderRadius: 8,
                              color: '#ffffff',
                              fontWeight: 900,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(244,63,94,0.35)'
                            }}
                          >
                            <XCircle size={16} /> Confirm Reject Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Order Summary & Workflow Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Order Highlights */}
                    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 10, padding: '0.85rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.55rem' }}>ORDER SUMMARY</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.75rem' }}>
                        <div><span style={{ color: '#64748b' }}>Boxes</span><br /><strong style={{ color: '#38bdf8' }}>{approvalModal.total_box_qty} Boxes</strong></div>
                        <div><span style={{ color: '#64748b' }}>Total Qty</span><br /><strong style={{ color: '#f8fafc' }}>{approvalModal.total_qty_pcs} PCS</strong></div>
                        <div><span style={{ color: '#64748b' }}>Payment Type</span><br /><strong style={{ color: '#fbbf24' }}>{approvalModal.payment_type || 'Credit'}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Delivery</span><br /><strong style={{ color: '#34d399' }}>{approvalModal.delivery_type || 'F.O.R'}</strong></div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 10, padding: '0.85rem', flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.65rem' }}>STAGE 2 WORKFLOW STATUS</div>
                      <div style={{ position: 'relative', paddingLeft: '1.15rem' }}>
                        <div style={{ position: 'absolute', left: '0.35rem', top: 6, bottom: 6, width: 1, background: '#1e293b' }} />
                        {[
                          { title: 'Stage 1: Order Entry', sub: `Booked by ${approvalModal.salesperson_name || 'Sales Representative'}`, done: true, color: '#38bdf8' },
                          { title: 'Stage 2: Sales Admin Review', sub: `${currentUser?.full_name || 'Sales Admin'} reviewing now`, done: true, color: '#fbbf24' },
                          { title: 'Stage 2: Higher Authority', sub: needsHarshadApproval === 'YES' ? 'Will be forwarded to Harshad Sir' : 'Bypassed (Direct Approval)', done: false, color: '#a855f7' },
                          { title: 'Stage 3: Billing & Dispatch', sub: 'Ready after Stage 2 completion', done: false, color: '#64748b' }
                        ].map((step, idx) => (
                          <div key={idx} style={{ position: 'relative', marginBottom: '0.75rem' }}>
                            <div style={{ position: 'absolute', left: '-1.15rem', width: 8, height: 8, borderRadius: '50%', background: step.color, top: 3, border: '2px solid #0f172a' }} />
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: step.color }}>{step.title}</div>
                            <div style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: 1 }}>{step.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer Cancel */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setApprovalModal(null)}
                    style={{ padding: '0.45rem 1.25rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Close
                  </button>
                </div>

              </div>
            )}\n
            </>
            )}

          </div>
        </div>

      )}

      <PermissionDeniedModal
        isOpen={deniedModal.isOpen}
        actionName={deniedModal.actionName}
        requiredPermissionKey={deniedModal.key}
        onClose={() => setDeniedModal({ ...deniedModal, isOpen: false })}
      />
    </div>
  );
};
