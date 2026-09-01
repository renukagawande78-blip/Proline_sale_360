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
  onRequestAccountsApproval?: (orderId: string, message: string) => void;
  onAccountsApprovalResponse?: (orderId: string, status: 'APPROVED' | 'HOLD' | 'REJECTED', remark: string) => void;
  onOpenPODModal?: (order: Order) => void;
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
  onOpenReturnRequestModal,
  onRequestAccountsApproval,
  onAccountsApprovalResponse
  , onOpenPODModal
}) => {
  const { currentUser, hasPermission } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const isSuperAdmin = role === 'SUPER_ADMIN'
    || (currentUser?.full_name || '').toLowerCase().includes('chirag')
    || (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const isAccounts = role === 'ACCOUNTS' || isSuperAdmin;
  const isSalesAdmin = role === 'SALES_ADMIN';
  const isSalesPerson = (role as string) === 'SALES_PERSON' || (role as string) === 'SALESPERSON';
  // Stage 2 uses the Details panel as the single Sales Admin table action.
  const showLegacyTableActions = false;

  const canAddOrder = hasPermission('add_order') || hasPermission('order_entry');

  // Active tab for filtering
  type Stage2Tab = 'ALL' | 'NEW' | 'REVIEW_REQUIRED' | 'APPROVAL_NEEDED' | 'HARSHAD_APPROVED' | 'ON_HOLD' | 'REJECTED' | 'COMPLETED';
  const [activeTab, setActiveTab] = useState<Stage2Tab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [liveCompanies, setLiveCompanies] = useState<Company[]>([]);

  // Selected order for right-side panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Section 2 & 3: Accounts Approval Request Modal (for Sales Admin)
  const [accountsModalOrder, setAccountsModalOrder] = useState<Order | null>(null);
  const [accountsMessage, setAccountsMessage] = useState('Please review and approve this order.');
  const [isSendingAccounts, setIsSendingAccounts] = useState(false);
  const [accountsSentSuccess, setAccountsSentSuccess] = useState(false);

  // Section 4: Accounts Approver Response Modal (for Accounts / Super Admin)
  const [accountsApproverOrder, setAccountsApproverOrder] = useState<Order | null>(null);
  const [accountsResponseRemark, setAccountsResponseRemark] = useState('');
  const [accountsResponseAction, setAccountsResponseAction] = useState<'APPROVED' | 'HOLD' | 'REJECTED'>('APPROVED');
  const [isRespondingAccounts, setIsRespondingAccounts] = useState(false);
  const [accountsResponseSuccess, setAccountsResponseSuccess] = useState(false);
  const [stockCheckOrder, setStockCheckOrder] = useState<Order | null>(null);
  const [stockCheckResult, setStockCheckResult] = useState<'IN_STOCK' | 'WAIT_FOR_STOCK'>('IN_STOCK');
  const [stockCheckPriority, setStockCheckPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

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

  // Cancel Order Modal with Order Number verification
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelOrderInput, setCancelOrderInput] = useState('');
  const [cancelOrderError, setCancelOrderError] = useState('');

  React.useEffect(() => {
    fetchCompaniesFromSupabase().then(comps => {
      if (comps && comps.length > 0) setLiveCompanies(comps);
    });
  }, []);

  const companiesPool = liveCompanies.length > 0 ? liveCompanies : MOCK_COMPANIES;
  const allowedCompanies = isSuperAdmin
    ? companiesPool
    : companiesPool.filter(c => isCompanyAllowedForUser(c.company_name, currentUser?.company_handle, c.company_code));

  // Scoped orders (Sales Admin sees only orders mapped to their salespersons / brands)
  const scopedOrders = orders.filter(o => {
    const accessPerm = getOrderAccessPermission(o, currentUser, companiesPool);
    return accessPerm.canView;
  });

  // Count buckets
  const countNew = scopedOrders.filter(o => o.status === 'SUBMITTED').length;
  const countReviewRequired = scopedOrders.filter(o => (o.status === 'SUBMITTED' && !o.sales_admin_approved) || o.reattempt_delivery).length;
  const countApprovalNeeded = scopedOrders.filter(o => o.need_accounts_approval && o.accounts_approval_status === 'PENDING').length;
  const countHarshadApproved = scopedOrders.filter(o => o.status === 'APPROVED').length;
  const countOnHold = scopedOrders.filter(o => o.status === 'HELD' || o.accounts_approval_status === 'HOLD').length;
  const countRejected = scopedOrders.filter(o => o.status === 'REJECTED' || o.accounts_approval_status === 'REJECTED').length;
  const countCompleted = scopedOrders.filter(o => o.status === 'COMPLETED').length;

  const qtyNew = scopedOrders.filter(o => o.status === 'SUBMITTED').reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
  const qtyReview = scopedOrders.filter(o => (o.status === 'SUBMITTED' && !o.sales_admin_approved) || o.reattempt_delivery).reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
  const qtyApprovalNeeded = scopedOrders.filter(o => o.need_accounts_approval && o.accounts_approval_status === 'PENDING').reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
  const qtyHarshadApproved = scopedOrders.filter(o => o.status === 'APPROVED').reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
  const qtyOnHold = scopedOrders.filter(o => o.status === 'HELD' || o.accounts_approval_status === 'HOLD').reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
  const qtyRejected = scopedOrders.filter(o => o.status === 'REJECTED' || o.accounts_approval_status === 'REJECTED').reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
  const qtyCompleted = scopedOrders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + (o.total_qty_pcs || 0), 0);

  // Tab filters
  const filteredOrders = scopedOrders.filter(o => {
    if (activeTab === 'NEW' && o.status !== 'SUBMITTED') return false;
    if (activeTab === 'REVIEW_REQUIRED' && !((o.status === 'SUBMITTED' && !o.sales_admin_approved) || o.reattempt_delivery)) return false;
    if (activeTab === 'APPROVAL_NEEDED' && !(o.need_accounts_approval && o.accounts_approval_status === 'PENDING')) return false;
    if (activeTab === 'HARSHAD_APPROVED' && o.status !== 'APPROVED') return false;
    if (activeTab === 'ON_HOLD' && o.status !== 'HELD' && o.accounts_approval_status !== 'HOLD') return false;
    if (activeTab === 'REJECTED' && o.status !== 'REJECTED' && o.accounts_approval_status !== 'REJECTED') return false;
    if (activeTab === 'COMPLETED' && o.status !== 'COMPLETED') return false;

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

  /**
   * Section 6: UI Status Display (Accounts Approval Badge)
   */
  const getAccountsApprovalBadge = (order: Order) => {
    const status = order.accounts_approval_status || (order.need_accounts_approval ? 'PENDING' : 'NOT_REQUIRED');
    if (!order.need_accounts_approval || status === 'NOT_REQUIRED') {
      return {
        label: 'Not Required',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.12)',
        border: 'rgba(148, 163, 184, 0.25)',
        sub: 'Super Admin approval not required',
        icon: '⚪'
      };
    }
    if (status === 'PENDING') {
      return {
        label: 'Pending',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.35)',
        sub: 'Waiting for Super Admin approval',
        icon: '⏳'
      };
    }
    if (status === 'APPROVED') {
      const name = order.accounts_approval_responded_by || 'Super Admin';
      const date = order.accounts_approval_responded_at ? ` on ${order.accounts_approval_responded_at}` : '';
      return {
        label: 'Approved',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.35)',
        sub: `Approved by ${name}${date}`,
        icon: '✅'
      };
    }
    if (status === 'HOLD') {
      return {
        label: 'Hold',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.35)',
        sub: 'Order placed on hold by Super Admin',
        icon: '⏸️'
      };
    }
    if (status === 'REJECTED') {
      return {
        label: 'Rejected',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.35)',
        sub: 'Order rejected by Super Admin',
        icon: '❌'
      };
    }
    return {
      label: 'Not Required',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.25)',
      sub: '',
      icon: '⚪'
    };
  };

  // Section 2 & 3: Open Accounts Approval Request Modal
  const handleOpenAccountsRequestModal = (order: Order) => {
    setAccountsModalOrder(order);
    setAccountsMessage(order.accounts_approval_message || 'Please review and approve this order.');
    setIsSendingAccounts(false);
    setAccountsSentSuccess(false);
  };

  // Section 3: Submit Accounts Approval Request (One-Time Message Rule)
  const handleSendAccountsApprovalRequest = () => {
    if (!accountsModalOrder || isSendingAccounts) return;
    if (accountsModalOrder.need_accounts_approval && accountsModalOrder.accounts_approval_status === 'PENDING') {
      return; // Prevent duplicate
    }
    setIsSendingAccounts(true);
    if (onRequestAccountsApproval) {
      onRequestAccountsApproval(accountsModalOrder.id, accountsMessage);
    }
    setAccountsSentSuccess(true);
    setTimeout(() => {
      setIsSendingAccounts(false);
      setAccountsSentSuccess(false);
      setAccountsModalOrder(null);
    }, 1800);
  };

  const handleOpenStockCheck = (order: Order) => {
    setStockCheckOrder(order);
    setStockCheckResult(order.inventory_status === 'WAIT_FOR_STOCK' ? 'WAIT_FOR_STOCK' : 'IN_STOCK');
    setStockCheckPriority((order.priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM');
  };

  const handleConfirmStockCheck = () => {
    if (!stockCheckOrder || !onApprove) return;
    const isWaiting = stockCheckResult === 'WAIT_FOR_STOCK';
    onApprove(stockCheckOrder.id, isWaiting
      ? 'Physical stock check: stock unavailable. Salesperson has been alerted.'
      : stockCheckOrder.reattempt_delivery
        ? 'Physical stock verified for delivery reattempt. Existing invoice retained; billing skipped.'
        : 'Physical stock verified. Approved for billing.', {
      directApprove: true,
      reattemptBilling: !!stockCheckOrder.reattempt_delivery,
      payment_type: stockCheckOrder.payment_type || 'CREDIT',
      priority: stockCheckPriority,
      inventory_status: stockCheckResult
    });
    setSelectedOrder(null);
    setStockCheckOrder(null);
  };

  // Section 4: Open Accounts Approver Response Modal
  const handleOpenAccountsResponseModal = (order: Order) => {
    setAccountsApproverOrder(order);
    setAccountsResponseRemark(order.accounts_approval_response_remark || '');
    setAccountsResponseAction('APPROVED');
    setIsRespondingAccounts(false);
    setAccountsResponseSuccess(false);
  };

  // Section 4: Submit Accounts Approver Response
  const handleSubmitAccountsResponse = (action: 'APPROVED' | 'HOLD' | 'REJECTED') => {
    if (!accountsApproverOrder || isRespondingAccounts) return;
    setIsRespondingAccounts(true);
    if (onAccountsApprovalResponse) {
      onAccountsApprovalResponse(accountsApproverOrder.id, action, accountsResponseRemark);
    }
    setAccountsResponseSuccess(true);
    setTimeout(() => {
      setIsRespondingAccounts(false);
      setAccountsResponseSuccess(false);
      setAccountsApproverOrder(null);
    }, 1800);
  };

  // Stage 2 action label per order/role
  const getStage2Action = (order: Order) => {
    if (order.status === 'SUBMITTED' && !order.sales_admin_approved) return { label: 'Review Required', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)' };
    if (order.status === 'SUBMITTED' && order.sales_admin_approved) return { label: 'Review Required', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)' };
    if (order.status === 'SALES_ADMIN_APPROVED' && order.superadmin_approved) return { label: 'SUPER ADMIN APPROVED', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' };
    if (order.status === 'SALES_ADMIN_APPROVED') return { label: 'SUPER ADMIN PENDING', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
    if (order.status === 'APPROVED') return { label: '— Ready for Stage 3', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' };
    if (order.status === 'HELD') return { label: 'Order On Hold', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
    if (order.status === 'REJECTED') return { label: 'Rejected', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)' };
    return { label: order.status, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
  };

  const getStatusBadge = (order: Order) => {
    if (order.reattempt_delivery) return { label: '🔄 REATTEMPT DELIVERY', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)' };
    if (order.status === 'SUBMITTED') return { label: 'NEW', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' };
    if (order.status === 'SALES_ADMIN_APPROVED') return { label: 'ACCOUNTS PENDING', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
    if (order.status === 'APPROVED') return { label: 'HARSHAD SIR APPROVED', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' };
    if (order.status === 'HELD') return { label: 'ON HOLD', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    if (order.status === 'REJECTED') return { label: 'REJECTED', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)' };
    return { label: order.status, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
  };

  // Account Department confirmation state
  const [needsHarshadApproval, setNeedsHarshadApproval] = useState<'YES' | 'NO'>('YES');
  const [harshadMessage, setHarshadMessage] = useState('Please approve this order. Customer requires urgent dispatch.');
  const [directActionType, setDirectActionType] = useState<'APPROVE' | 'HOLD' | 'REJECT'>('APPROVE');
  const [directReasonInput, setDirectReasonInput] = useState('');

  const openReviewModal = (order: Order) => {
    setApprovalModal(order);
    setSentToHarshad(false);
    setNeedsHarshadApproval(order.status === 'SALES_ADMIN_APPROVED' ? 'YES' : 'NO');
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
    // Keep the confirmation visible so the sender knows the order is now
    // waiting for Higher Authority's response. The order status is persisted
    // as SALES_ADMIN_APPROVED by the approval handler above.
    setSentToHarshad(true);
  };

  const closeSentToHarshadConfirmation = () => {
    setSentToHarshad(false);
    setApprovalModal(null);
    setSelectedOrder(null);
    setHarshadMessage('Please approve this order. Customer requires urgent dispatch.');
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
    if (onReject) onReject(order.id, approvalRemarks || 'Rejected by Accounts Department');
    setApprovalModal(null);
    setApprovalRemarks('');
  };


  // KPI card definitions matching screenshot
  const kpiCards = [
    {
      id: 'NEW' as Stage2Tab,
      label: 'NEW ORDERS',
      count: countNew,
      quantity: qtyNew,
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
      quantity: qtyReview,
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
      quantity: qtyApprovalNeeded,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.12)',
      activeBg: 'rgba(251,191,36,0.2)',
      border: 'rgba(251,191,36,0.3)',
      icon: '⚠️',
      sub: 'Awaiting Super Admin decision'
    },
    {
      id: 'HARSHAD_APPROVED' as Stage2Tab,
      label: 'HARSHAD SIR APPROVED',
      count: countHarshadApproved,
      quantity: qtyHarshadApproved,
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
      quantity: qtyOnHold,
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
      quantity: qtyRejected,
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.12)',
      activeBg: 'rgba(244,63,94,0.2)',
      border: 'rgba(244,63,94,0.3)',
      icon: '❌',
      sub: 'By Chirag Sir'
    },
    {
      id: 'COMPLETED' as Stage2Tab,
      label: 'COMPLETED ORDERS',
      count: countCompleted,
      quantity: qtyCompleted,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      activeBg: 'rgba(16,185,129,0.2)',
      border: 'rgba(16,185,129,0.3)',
      icon: '📦',
      sub: 'Delivered & Settled'
    },
  ];

  // Tab labels
  const tabDefs: { id: Stage2Tab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Orders', count: scopedOrders.length },
    { id: 'COMPLETED', label: 'Completed', count: countCompleted },
    { id: 'NEW', label: 'New', count: countNew },
    { id: 'REVIEW_REQUIRED', label: 'Review Required', count: countReviewRequired },
    { id: 'APPROVAL_NEEDED', label: 'Super Admin Pending', count: countApprovalNeeded },
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
            {canAddOrder && (
              <button className="btn btn-primary" onClick={onOpenCreateOrder} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.85rem' }}>
                <Plus size={15} /> Create Order
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="orders-kpi-grid">
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
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>{card.quantity.toLocaleString('en-IN')} PCS</div>
                  </div>
                  <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: card.color, fontWeight: 700, marginTop: 6, opacity: 0.8 }}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Tab Bar */}
        <div className="orders-tab-scroll" style={{ display: 'flex', gap: 0, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '0.35rem', marginBottom: '1rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
        <div className="orders-filter-bar">
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

        {/* Super Admin Highlight Alert Banner */}
        {isSuperAdmin && countApprovalNeeded > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.08))',
            border: '1px solid rgba(249,115,22,0.4)',
            borderRadius: 10,
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 4px 15px rgba(249,115,22,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.35rem' }}>🔔</span>
              <div>
                <div style={{ fontWeight: 900, color: '#f8fafc', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{countApprovalNeeded} Order{countApprovalNeeded > 1 ? 's' : ''} Awaiting Super Admin Approval</span>
                  <span style={{ fontSize: '0.65rem', background: '#f97316', color: '#fff', padding: '0.1rem 0.45rem', borderRadius: 10, fontWeight: 800 }}>ACTION REQUIRED</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fb923c', marginTop: 2 }}>
                  Sales Admins have requested your approval. Click to filter and review these orders immediately.
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('APPROVAL_NEEDED')}
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                border: 'none',
                borderRadius: 7,
                padding: '0.45rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(249,115,22,0.4)'
              }}
            >
              ⚡ View {countApprovalNeeded} Pending Orders
            </button>

          </div>
        )}

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
                <th style={{ textAlign: 'right' }}>TOTAL QTY (PCS)</th>
                <th style={{ textAlign: 'center', width: 165 }}>SUPER ADMIN APPROVAL</th>
                <th style={{ textAlign: 'center', width: 140 }}>ORDER STATUS</th>
                <th style={{ textAlign: 'center', width: 175 }}>ACTIONS</th>
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
                const accountsBadge = getAccountsApprovalBadge(order);
                const isSelected = selectedOrder?.id === order.id;

                const isPendingSuperAdminApproval = isSuperAdmin && (
                  (order.need_accounts_approval && order.accounts_approval_status === 'PENDING') ||
                  order.status === 'SALES_ADMIN_APPROVED'
                );

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(56,189,248,0.12)'
                        : isPendingSuperAdminApproval
                        ? 'linear-gradient(90deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.03) 100%)'
                        : undefined,
                      borderLeft: isPendingSuperAdminApproval
                        ? '4px solid #f97316'
                        : isSelected
                        ? '2px solid #38bdf8'
                        : '2px solid transparent',
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Star / pin */}
                    <td style={{ textAlign: 'center', color: isPendingSuperAdminApproval ? '#f97316' : '#334155', fontSize: '0.9rem' }}>
                      {isPendingSuperAdminApproval ? '★' : '☆'}
                    </td>

                    {/* Order Number */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.825rem' }}>{order.order_number}</div>
                        {order.reattempt_delivery && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            color: '#fbbf24',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            padding: '0.12rem 0.45rem',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}>
                            🔄 REATTEMPT
                          </span>
                        )}
                      </div>
                      {isPendingSuperAdminApproval ? (
                        <div style={{
                          marginTop: 3,
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          background: 'linear-gradient(135deg, #f97316, #ea580c)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          boxShadow: '0 2px 6px rgba(249,115,22,0.4)'
                        }}>
                          <span>⏳</span> PENDING APPROVAL
                        </div>
                      ) : order.status === 'SUBMITTED' && !order.sales_admin_approved ? (
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>NEW</span>
                      ) : null}
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

                    {/* Quantity */}
                    <td style={{ textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: '0.875rem' }}>
                      {Number(order.total_qty_pcs || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Section 6: Accounts Approval Badge */}
                    <td style={{ textAlign: 'center' }}>
                      <div>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800,
                          color: accountsBadge.color, background: accountsBadge.bg,
                          border: `1px solid ${accountsBadge.border}`,
                          padding: '0.2rem 0.55rem', borderRadius: 20,
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          boxShadow: isPendingSuperAdminApproval ? '0 0 8px rgba(249,115,22,0.3)' : undefined
                        }}>
                          <span>{accountsBadge.icon}</span> {accountsBadge.label}
                        </span>
                        {order.need_accounts_approval && order.accounts_approval_status === 'PENDING' && order.accounts_approval_requested_by ? (
                          <div style={{ fontSize: '0.62rem', color: '#fb923c', marginTop: 3, fontWeight: 700 }}>
                            By {order.accounts_approval_requested_by}
                          </div>
                        ) : accountsBadge.sub ? (
                          <div style={{ fontSize: '0.62rem', color: accountsBadge.color, marginTop: 3, maxWidth: 145, marginInline: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={accountsBadge.sub}>
                            {accountsBadge.sub}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Order Status Badge */}
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
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                          style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.3rem 0.5rem', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 800 }}
                          title="View order details and approval history"
                        >
                          <FileText size={13} /> Details
                        </button>
                        {isSalesAdmin && onOpenPODModal && ['DISPATCHED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(order.status) && !order.pod_status && (
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              onOpenPODModal(order);
                            }}
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#ffffff', padding: '0.3rem 0.55rem', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(16,185,129,0.35)' }}
                            title="Verify proof of delivery"
                          >
                            <CheckCircle2 size={12} /> Verify POD
                          </button>
                        )}
                        {/* Super Admin Quick Response Button */}
                        {isSuperAdmin && order.need_accounts_approval && order.accounts_approval_status === 'PENDING' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenAccountsResponseModal(order);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                              color: '#ffffff',
                              padding: '0.3rem 0.55rem',
                              borderRadius: 5,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '0.72rem',
                              fontWeight: 900,
                              boxShadow: '0 2px 6px rgba(16,185,129,0.35)'
                            }}
                            title="Approve / Review as Super Admin"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                        )}

                        {/* 1. View PDF */}
                        {onViewInvoice && showLegacyTableActions && (
                          <button
                            onClick={e => { e.stopPropagation(); onViewInvoice(order); }}
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#fbbf24', padding: '0.3rem 0.45rem', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}
                            title="View PDF / Print Invoice"
                          >
                            <Receipt size={13} /> PDF
                          </button>
                        )}

                        {/* 2. Edit Order */}
                        {onOpenEditOrder && showLegacyTableActions && (isSalesAdmin || isSuperAdmin) && order.status !== 'CANCELLED' && (
                          <button
                            onClick={e => { e.stopPropagation(); onOpenEditOrder(order); }}
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.3rem 0.45rem', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}
                            title="Edit Order"
                          >
                            <Edit size={13} />
                          </button>
                        )}

                        {/* Sales Admin may request Super Admin approval only once. */}
                        {isSalesAdmin && !order.need_accounts_approval && order.status === 'SUBMITTED' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenAccountsRequestModal(order);
                            }}
                            style={{
                              background: order.need_accounts_approval ? 'rgba(249,115,22,0.12)' : 'rgba(56,189,248,0.08)',
                              border: `1px solid ${order.need_accounts_approval ? 'rgba(249,115,22,0.35)' : 'rgba(56,189,248,0.25)'}`,
                              color: order.need_accounts_approval ? '#f97316' : '#38bdf8',
                              padding: '0.3rem 0.45rem', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: 3
                            }}
                            title="Request Super Admin approval"
                          >
                            <ShieldCheck size={13} />
                          </button>
                        )}

                        {/* 3. Cancel Order */}
                        {onCancelOrder && showLegacyTableActions && (isSalesAdmin || isSuperAdmin) && order.status !== 'CANCELLED' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setCancelModalOrder(order);
                              setCancelOrderInput('');
                              setCancelOrderError('');
                            }}
                            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', padding: '0.3rem 0.45rem', borderRadius: 5, cursor: 'pointer' }}
                            title="Cancel Order"
                          >
                            <Ban size={13} />
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

      {/* ── RIGHT PANEL: Order Details (Drawer on Mobile) ─────────── */}
      {selectedOrder && (
        <>
          <div 
            className="order-details-overlay open" 
            onClick={() => setSelectedOrder(null)} 
          />
          <div className="order-details-panel">
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

          {/* PROMINENT REATTEMPT DELIVERY BANNER */}
          {selectedOrder.reattempt_delivery && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(239, 68, 68, 0.12))',
              border: '1.5px solid #f59e0b',
              borderRadius: 8,
              padding: '0.85rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🔄</span>
                <span style={{ fontSize: '0.825rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.04em' }}>
                  REATTEMPT DELIVERY IN PROGRESS
                </span>
              </div>
              <div style={{ fontSize: '0.725rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.45 }}>
                Delivery exception resolved by Sales Admin. Priority elevated to <strong style={{ color: '#f87171' }}>HIGH PRIORITY</strong> for immediate stock re-check and dispatch reattempt.
              </div>
            </div>
          )}

          {/* TOP VIEW: SUPER ADMIN APPROVAL WORKFLOW CARD */}
          <div style={{ background: '#0f172a', border: '1.5px solid #334155', borderRadius: 10, padding: '0.85rem', marginBottom: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>SUPER ADMIN APPROVAL</span>
              </div>
              {(() => {
                const b = getAccountsApprovalBadge(selectedOrder);
                return (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: b.color, background: b.bg, border: `1px solid ${b.border}`, padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                    {b.icon} {b.label}
                  </span>
                );
              })()}
            </div>

            {/* Need Accounts Approval Toggle / Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', background: '#0b1120', borderRadius: 6, marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Super Admin Approval Needed</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800,
                color: selectedOrder.need_accounts_approval ? '#f97316' : '#94a3b8'
              }}>
                {selectedOrder.need_accounts_approval ? 'YES' : 'NO'}
              </span>
            </div>

            {/* If Not Required */}
            {!selectedOrder.need_accounts_approval && (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                  No Super Admin approval is required. Sales Admin can send this order to stock check.
                </div>
                {(isSalesAdmin || isSuperAdmin) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <button
                      onClick={() => handleOpenStockCheck(selectedOrder)}
                      style={{ width: '100%', padding: '0.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#34d399', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <CheckCircle2 size={13} /> Approve &amp; Proceed to Stock Check
                    </button>

                    {/* TOP VIEW REQUEST BUTTON INSIDE CARD */}
                    {isSalesAdmin && selectedOrder.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenAccountsRequestModal(selectedOrder)}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.25))',
                          border: '1.5px solid #f97316',
                          borderRadius: 6,
                          color: '#fb923c',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(249,115,22,0.2)'
                        }}
                      >
                        <ShieldCheck size={14} /> Request Super Admin Approval
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* If Requested and PENDING (Section 3: One-Time Message Rule View) */}
            {selectedOrder.need_accounts_approval && selectedOrder.accounts_approval_status === 'PENDING' && (
              <div>
                <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, padding: '0.6rem', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f97316', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    ⚠️ Super Admin approval request already sent
                  </div>
                  <div style={{ fontSize: '0.675rem', color: '#fb923c' }}>
                    Waiting for Super Admin approval
                  </div>
                  {selectedOrder.accounts_approval_message && (
                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: 4, background: '#0b1120', padding: '0.35rem 0.5rem', borderRadius: 4 }}>
                      "{selectedOrder.accounts_approval_message}"
                    </div>
                  )}
                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 4 }}>
                    Sent by {selectedOrder.accounts_approval_requested_by || 'Sales Admin'} on {selectedOrder.accounts_approval_requested_at || 'Recently'}
                  </div>
                </div>

                {/* Super Admin action console */}
                {isSuperAdmin && (
                  <div>
                    <button
                      onClick={() => handleOpenAccountsResponseModal(selectedOrder)}
                      style={{ width: '100%', padding: '0.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 6, color: '#ffffff', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <ShieldCheck size={14} /> Review as Super Admin
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* If APPROVED */}
            {selectedOrder.need_accounts_approval && selectedOrder.accounts_approval_status === 'APPROVED' && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✅ Approved by {selectedOrder.accounts_approval_responded_by || 'Super Admin'}
                </div>
                {selectedOrder.accounts_approval_responded_at && (
                  <div style={{ fontSize: '0.65rem', color: '#6ee7b7', marginTop: 2 }}>
                    on {selectedOrder.accounts_approval_responded_at}
                  </div>
                )}
                {selectedOrder.accounts_approval_response_remark && (
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: 4, background: '#0b1120', padding: '0.35rem 0.5rem', borderRadius: 4 }}>
                    "{selectedOrder.accounts_approval_response_remark}"
                  </div>
                )}
              </div>
            )}

            {selectedOrder.need_accounts_approval && selectedOrder.accounts_approval_status === 'APPROVED' && isSalesAdmin && selectedOrder.status === 'SALES_ADMIN_APPROVED' && (
              <button
                onClick={() => handleOpenStockCheck(selectedOrder)}
                style={{ width: '100%', marginTop: '0.6rem', padding: '0.45rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <CheckCircle2 size={13} /> Final Approve &amp; Proceed to Stock Check
              </button>
            )}

            {/* If HOLD */}
            {selectedOrder.need_accounts_approval && selectedOrder.accounts_approval_status === 'HOLD' && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ⏸️ Order placed on hold by Accounts
                </div>
                {selectedOrder.accounts_approval_response_remark && (
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: 4, background: '#0b1120', padding: '0.35rem 0.5rem', borderRadius: 4 }}>
                    "{selectedOrder.accounts_approval_response_remark}"
                  </div>
                )}
                {isAccounts && (
                  <button
                    onClick={() => handleOpenAccountsResponseModal(selectedOrder)}
                    style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}
                  >
                    Change Response
                  </button>
                )}
              </div>
            )}

            {/* If REJECTED */}
            {selectedOrder.need_accounts_approval && selectedOrder.accounts_approval_status === 'REJECTED' && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ❌ Order rejected by Accounts
                </div>
                {selectedOrder.accounts_approval_response_remark && (
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: 4, background: '#0b1120', padding: '0.35rem 0.5rem', borderRadius: 4 }}>
                    "{selectedOrder.accounts_approval_response_remark}"
                  </div>
                )}
              </div>
            )}
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
          </div>

          {/* Order Summary */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.6rem' }}>ORDER SUMMARY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { label: 'Total Boxes', value: selectedOrder.total_box_qty + ' Boxes', color: '#f8fafc' },
                { label: 'Total Qty (Pcs)', value: selectedOrder.total_qty_pcs + ' PCS', color: '#38bdf8' },
                { label: 'Loose PCS', value: (selectedOrder.total_loose_pcs || 0) + ' PCS', color: '#94a3b8' },
                { label: 'Products', value: (selectedOrder.items?.length || 0) + ' SKU(s)', color: '#fbbf24' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#0b1120', padding: '0.5rem', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 800, color, fontSize: '0.825rem' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Sales Admin 4 Required Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.75rem' }}>
            {/* Top View: Request Super Admin Approval Button */}
            {isSalesAdmin && !selectedOrder.need_accounts_approval && selectedOrder.status === 'SUBMITTED' && (
              <button
                type="button"
                onClick={() => handleOpenAccountsRequestModal(selectedOrder)}
                style={{ 
                  width: '100%', 
                  padding: '0.65rem', 
                  background: 'linear-gradient(135deg, #ea580c, #c2410c)', 
                  border: 'none', 
                  borderRadius: 8, 
                  color: '#ffffff', 
                  cursor: 'pointer', 
                  fontWeight: 800, 
                  fontSize: '0.82rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.4rem', 
                  boxShadow: '0 4px 14px rgba(234,88,12,0.35)',
                  marginBottom: '0.35rem'
                }}
              >
                <ShieldCheck size={16} /> Request Super Admin Approval
              </button>
            )}

            {isSalesAdmin && (selectedOrder.status === 'OUT_FOR_DELIVERY' || selectedOrder.status === 'DISPATCHED') && onOpenPODModal && (
              <button
                type="button"
                onClick={() => onOpenPODModal(selectedOrder)}
                style={{ width: '100%', padding: '0.65rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 8, color: '#ffffff', cursor: 'pointer', fontWeight: 900, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
              >
                <CheckCircle2 size={15} /> Verify POD After Delivery
              </button>
            )}

            {selectedOrder.pod_status === 'CLEAN' && (
              <div style={{ width: '100%', padding: '0.55rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#34d399', fontWeight: 800, fontSize: '0.78rem', textAlign: 'center' }}>
                ✅ POD Verified — No Issue
              </div>
            )}

            {selectedOrder.pod_status === 'ISSUE_RAISED' && (
              <div style={{ width: '100%', padding: '0.55rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, color: '#fb7185', fontWeight: 800, fontSize: '0.78rem', textAlign: 'center' }}>
                ⚠️ POD Issue Raised — {selectedOrder.pod_issue_type || 'Exception'}
              </div>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectOrderForApproval(selectedOrder);
              }}
              style={{ width: '100%', padding: '0.55rem', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, color: '#38bdf8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <FileText size={14} /> View Full Order Details
            </button>

            {/* 1. View PDF */}
            {onViewInvoice && (
              <button
                onClick={() => onViewInvoice(selectedOrder)}
                style={{ width: '100%', padding: '0.55rem', background: selectedOrder.invoice_number ? 'rgba(245,158,11,0.15)' : 'rgba(251,191,36,0.08)', border: selectedOrder.invoice_number ? '1px solid #f59e0b' : '1px solid rgba(251,191,36,0.25)', borderRadius: 8, color: selectedOrder.invoice_number ? '#fbbf24' : '#fbbf24', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {selectedOrder.invoice_number ? <Truck size={15} /> : <Receipt size={14} />} 
                {selectedOrder.invoice_number ? 'View / Print Delivery Challan' : '1. View Booking Form / PDF'}
              </button>
            )}

            {/* 2. Edit Order */}
            {onOpenEditOrder && (isSalesAdmin || isSuperAdmin) && selectedOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => onOpenEditOrder(selectedOrder)}
                style={{ width: '100%', padding: '0.55rem', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, color: '#38bdf8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Edit size={14} /> 2. Edit Order
              </button>
            )}

            {/* 3. Cancel Order */}
            {(isSalesAdmin || isSuperAdmin) && onCancelOrder && selectedOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => {
                  setCancelModalOrder(selectedOrder);
                  setCancelOrderInput('');
                  setCancelOrderError('');
                }}
                style={{ width: '100%', padding: '0.55rem', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, color: '#f43f5e', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Ban size={14} /> 3. Cancel Order
              </button>
            )}
          </div>
        </div>
        </>
      )}

      {/* ── SECTION 2 & 3: SALES ADMIN ACCOUNTS APPROVAL CONFIRMATION / MESSAGE WINDOW ── */}
      {accountsModalOrder && (
        <div className="modal-overlay">
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 14,
            width: '94vw',
            maxWidth: 580,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            padding: 0
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#f97316" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Send for Super Admin Approval
                </h3>
              </div>
              <button onClick={() => setAccountsModalOrder(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {accountsSentSuccess ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  ✅
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                  Super Admin Approval Requested Successfully
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: 360, lineHeight: 1.5 }}>
                  The approval request for order <strong style={{ color: '#38bdf8' }}>{accountsModalOrder.order_number}</strong> has been sent to Super Admin. It cannot be sent again.
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.25rem' }}>
                {/* Order Information Card */}
                <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>ORDER NUMBER</div>
                      <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', marginTop: 2 }}>{accountsModalOrder.order_number}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>ORDER AMOUNT</div>
                      <div style={{ color: '#10b981', fontWeight: 900, fontSize: '0.95rem', marginTop: 2 }}>
                        ₹ {Number(accountsModalOrder.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>CUSTOMER NAME</div>
                      <div style={{ color: '#f8fafc', fontWeight: 700, marginTop: 2 }}>{accountsModalOrder.agency_name}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>SALESPERSON</div>
                      <div style={{ color: '#34d399', fontWeight: 700, marginTop: 2 }}>{accountsModalOrder.salesperson_name || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Check if already requested (One-Time Message Rule: Section 3) */}
                {accountsModalOrder.need_accounts_approval && accountsModalOrder.accounts_approval_status === 'PENDING' ? (
                  <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f97316', marginBottom: 4 }}>
                      ⚠️ Super Admin approval request already sent
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#cbd5e1', marginBottom: 8 }}>
                      Waiting for Super Admin approval. You cannot send duplicate requests for this order.
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', background: '#0b1120', padding: '0.5rem', borderRadius: 6 }}>
                      "{accountsModalOrder.accounts_approval_message || 'Please review and approve this order.'}"
                    </div>
                    <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: 6 }}>
                      Requested by {accountsModalOrder.accounts_approval_requested_by} on {accountsModalOrder.accounts_approval_requested_at}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Message Textbox */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                        Message for Super Admin:
                      </label>
                      <textarea
                        rows={3}
                        value={accountsMessage}
                        onChange={e => setAccountsMessage(e.target.value)}
                        placeholder="Please review and approve this order."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#0b1120',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#f8fafc',
                          fontSize: '0.825rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          lineHeight: 1.5
                        }}
                      />
                      <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: 4 }}>
                        Default: "Please review and approve this order."
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setAccountsModalOrder(null)}
                        style={{ padding: '0.55rem 1.25rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendAccountsApprovalRequest}
                        disabled={isSendingAccounts}
                        style={{
                          padding: '0.55rem 1.5rem',
                          background: 'linear-gradient(135deg, #f97316, #ea580c)',
                          border: 'none',
                          borderRadius: 8,
                          color: '#ffffff',
                          cursor: isSendingAccounts ? 'not-allowed' : 'pointer',
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 12px rgba(249,115,22,0.35)'
                        }}
                      >
                        <Send size={14} /> Send for Super Admin Approval
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 4: ACCOUNTS APPROVER RESPONSE CONSOLE / MODAL ── */}
      {accountsApproverOrder && (
        <div className="modal-overlay">
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 14,
            width: '94vw',
            maxWidth: 640,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            padding: 0
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Super Admin Decision Console
                </h3>
              </div>
              <button onClick={() => setAccountsApproverOrder(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {accountsResponseSuccess ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  ✅
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                  Decision Recorded Successfully
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: 360, lineHeight: 1.5 }}>
                  Order <strong style={{ color: '#38bdf8' }}>{accountsApproverOrder.order_number}</strong> status has been updated.
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.25rem' }}>
                {/* Order & Request Information Card */}
                <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>ORDER NUMBER</div>
                      <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', marginTop: 2 }}>{accountsApproverOrder.order_number}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>ORDER AMOUNT</div>
                      <div style={{ color: '#10b981', fontWeight: 900, fontSize: '0.95rem', marginTop: 2 }}>
                        ₹ {Number(accountsApproverOrder.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>CUSTOMER</div>
                      <div style={{ color: '#f8fafc', fontWeight: 700, marginTop: 2 }}>{accountsApproverOrder.agency_name}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>SALESPERSON</div>
                      <div style={{ color: '#34d399', fontWeight: 700, marginTop: 2 }}>{accountsApproverOrder.salesperson_name || '—'}</div>
                    </div>
                  </div>

                  <div style={{ background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: 6, border: '1px solid #1e293b' }}>
                    <div style={{ color: '#fb923c', fontSize: '0.7rem', fontWeight: 800, marginBottom: 2 }}>MESSAGE FROM SALES ADMIN:</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      "{accountsApproverOrder.accounts_approval_message || 'Please review and approve this order.'}"
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: 4 }}>
                      Requested by {accountsApproverOrder.accounts_approval_requested_by || 'Sales Admin'} on {accountsApproverOrder.accounts_approval_requested_at || 'Recently'}
                    </div>
                  </div>
                </div>

                {/* Super Admin Stage 6 exception decision / standard approval decision */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.6rem' }}>
                    {accountsApproverOrder.status === 'POD_ISSUE_RAISED' ? 'Stage 6 Exception Decision:' : 'Select Super Admin Decision:'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    {/* Approve */}
                    <button
                      type="button"
                      onClick={() => setAccountsResponseAction('APPROVED')}
                      style={{
                        padding: '0.85rem 0.5rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: `2px solid ${accountsResponseAction === 'APPROVED' ? '#10b981' : '#1e293b'}`,
                        background: accountsResponseAction === 'APPROVED' ? 'rgba(16,185,129,0.15)' : '#0b1120',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <CheckCircle size={22} color="#10b981" />
                      <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem' }}>{accountsApproverOrder.status === 'POD_ISSUE_RAISED' ? '1. Resend' : '1. Approve'}</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center' }}>{accountsApproverOrder.status === 'POD_ISSUE_RAISED' ? 'Send replacement order' : 'Approve request'}</span>
                    </button>

                    {/* Hold */}
                    <button
                      type="button"
                      onClick={() => setAccountsResponseAction('HOLD')}
                      style={{
                        padding: '0.85rem 0.5rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: `2px solid ${accountsResponseAction === 'HOLD' ? '#f59e0b' : '#1e293b'}`,
                        background: accountsResponseAction === 'HOLD' ? 'rgba(245,158,11,0.15)' : '#0b1120',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <PauseCircle size={22} color="#f59e0b" />
                      <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.85rem' }}>2. Hold</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center' }}>Freeze order</span>
                    </button>

                    {/* Reject */}
                    <button
                      type="button"
                      onClick={() => setAccountsResponseAction('REJECTED')}
                      style={{
                        padding: '0.85rem 0.5rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: `2px solid ${accountsResponseAction === 'REJECTED' ? '#ef4444' : '#1e293b'}`,
                        background: accountsResponseAction === 'REJECTED' ? 'rgba(239,68,68,0.15)' : '#0b1120',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <XCircle size={22} color="#ef4444" />
                      <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.85rem' }}>{accountsApproverOrder.status === 'POD_ISSUE_RAISED' ? '3. Create GRN' : '3. Reject'}</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center' }}>{accountsApproverOrder.status === 'POD_ISSUE_RAISED' ? 'Close exception with GRN' : 'Decline order'}</span>
                    </button>
                  </div>
                </div>

                {/* Response Remark Textbox */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                    Response Remark:
                  </label>
                  <textarea
                    rows={2}
                    value={accountsResponseRemark}
                    onChange={e => setAccountsResponseRemark(e.target.value)}
                    placeholder="Enter approval remarks or reason for hold / rejection..."
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0b1120',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: '0.825rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Submit Decision Button */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setAccountsApproverOrder(null)}
                    style={{ padding: '0.55rem 1.25rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitAccountsResponse(accountsResponseAction)}
                    disabled={isRespondingAccounts}
                    style={{
                      padding: '0.55rem 1.5rem',
                      background: accountsResponseAction === 'APPROVED' ? 'linear-gradient(135deg, #10b981, #059669)' :
                        accountsResponseAction === 'HOLD' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                        'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: 'none',
                      borderRadius: 8,
                      color: '#ffffff',
                      cursor: isRespondingAccounts ? 'not-allowed' : 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    Confirm {accountsResponseAction}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {stockCheckOrder && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520, width: '94vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem' }}>Physical Stock Check</h3>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', marginTop: 3 }}>{stockCheckOrder.order_number}</div>
              </div>
              <button type="button" onClick={() => setStockCheckOrder(null)} style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {stockCheckOrder.reattempt_delivery
                ? 'Verify replacement stock for this delivery reattempt. If stock is ready, send it to Billing for any required invoice modification before Dispatch.'
                : 'Verify physical stock before routing this order. A wait-for-stock decision alerts the salesperson; an in-stock decision routes the order to Billing.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { value: 'IN_STOCK' as const, title: 'In Stock', note: stockCheckOrder.reattempt_delivery ? 'Send to Billing Review' : 'Approve for Billing', color: '#10b981', icon: '✅' },
                { value: 'WAIT_FOR_STOCK' as const, title: 'Wait for Stock', note: 'Alert salesperson', color: '#f59e0b', icon: '⏳' }
              ].map(option => (
                <button key={option.value} type="button" onClick={() => setStockCheckResult(option.value)} style={{ padding: '0.9rem', textAlign: 'left', borderRadius: 10, cursor: 'pointer', border: `2px solid ${stockCheckResult === option.value ? option.color : '#334155'}`, background: stockCheckResult === option.value ? `${option.color}20` : '#0b1120', color: '#f8fafc' }}>
                  <div style={{ fontWeight: 800, color: option.color, fontSize: '0.85rem' }}>{option.icon} {option.title}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 3 }}>{option.note}</div>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', color: '#cbd5e1', fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.4rem' }}>Billing Priority</label>
            <select value={stockCheckPriority} onChange={event => setStockCheckPriority(event.target.value as 'HIGH' | 'MEDIUM' | 'LOW')} style={{ width: '100%', padding: '0.6rem', background: '#0b1120', color: '#f8fafc', border: '1px solid #334155', borderRadius: 7, marginBottom: '1.2rem' }}>
              <option value="HIGH">High — top of billing queue</option>
              <option value="MEDIUM">Medium — standard queue</option>
              <option value="LOW">Low — normal queue</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStockCheckOrder(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmStockCheck} style={{ background: stockCheckResult === 'IN_STOCK' ? '#059669' : '#d97706' }}>
                {stockCheckResult === 'IN_STOCK' ? 'Approve for Billing' : 'Set Wait for Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL ORDER CONFIRMATION MODAL (Requires typing Order Number) ── */}
      {cancelModalOrder && (
        <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
          <div style={{
            background: '#0f172a',
            border: '1.5px solid #ef4444',
            borderRadius: 12,
            padding: '1.4rem',
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(239,68,68,0.2)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ban size={18} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.025rem', fontWeight: 800, color: '#f8fafc' }}>Cancel Order</h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Type order number to confirm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setCancelModalOrder(null); setCancelOrderInput(''); setCancelOrderError(''); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Details Brief */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Order Number:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#38bdf8' }}>{cancelModalOrder.order_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Customer / Party:</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>{cancelModalOrder.agency_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Quantity:</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>{cancelModalOrder.total_box_qty} Boxes ({cancelModalOrder.total_qty_pcs} PCS)</span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.65rem', lineHeight: 1.4 }}>
              To verify and cancel this order, please type the exact Order Number <strong style={{ color: '#ef4444' }}>{cancelModalOrder.order_number}</strong>:
            </p>

            {/* Input to write Order Number */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                value={cancelOrderInput}
                onChange={(e) => {
                  setCancelOrderInput(e.target.value);
                  setCancelOrderError('');
                }}
                placeholder={`Type ${cancelModalOrder.order_number} here`}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  background: '#020617',
                  border: cancelOrderError ? '1.5px solid #ef4444' : '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (cancelOrderInput.trim().toUpperCase() !== cancelModalOrder.order_number.trim().toUpperCase()) {
                      setCancelOrderError(`Order number does not match "${cancelModalOrder.order_number}". Please re-type.`);
                      return;
                    }
                    if (onCancelOrder) onCancelOrder(cancelModalOrder.id);
                    if (selectedOrder?.id === cancelModalOrder.id) setSelectedOrder(null);
                    setCancelModalOrder(null);
                    setCancelOrderInput('');
                    setCancelOrderError('');
                  }
                }}
              />
              {cancelOrderError && (
                <div style={{ color: '#f87171', fontSize: '0.72rem', fontWeight: 600, marginTop: 4 }}>
                  {cancelOrderError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => { setCancelModalOrder(null); setCancelOrderInput(''); setCancelOrderError(''); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cancelOrderInput.trim().toUpperCase() !== cancelModalOrder.order_number.trim().toUpperCase()) {
                    setCancelOrderError(`Order number does not match "${cancelModalOrder.order_number}". Please re-type.`);
                    return;
                  }
                  if (onCancelOrder) {
                    onCancelOrder(cancelModalOrder.id);
                  }
                  if (selectedOrder?.id === cancelModalOrder.id) {
                    setSelectedOrder(null);
                  }
                  setCancelModalOrder(null);
                  setCancelOrderInput('');
                  setCancelOrderError('');
                }}
                style={{
                  flex: 1.3,
                  padding: '0.6rem',
                  background: cancelOrderInput.trim().toUpperCase() === cancelModalOrder.order_number.trim().toUpperCase()
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : '#331515',
                  border: 'none',
                  borderRadius: 8,
                  color: cancelOrderInput.trim().toUpperCase() === cancelModalOrder.order_number.trim().toUpperCase() ? '#ffffff' : '#9ca3af',
                  cursor: cancelOrderInput.trim().toUpperCase() === cancelModalOrder.order_number.trim().toUpperCase() ? 'pointer' : 'not-allowed',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: cancelOrderInput.trim().toUpperCase() === cancelModalOrder.order_number.trim().toUpperCase() ? '0 4px 14px rgba(239,68,68,0.4)' : 'none'
                }}
              >
                <Ban size={15} /> Confirm Cancel
              </button>
            </div>
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
