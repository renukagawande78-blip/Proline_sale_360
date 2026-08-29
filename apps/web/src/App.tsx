import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { MastersPage } from './pages/MastersPage';
import { DispatchPage } from './pages/DispatchPage';
import { AccountsPage } from './pages/AccountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReturnsRegisterView } from './modules/returns/ReturnsRegisterView';
import { OrderTrackerView } from './modules/tracker/OrderTrackerView';
import { PODQueueView } from './modules/pod/PODQueueView';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderApprovalModal } from './components/OrderApprovalModal';
import { DispatchModal } from './components/DispatchModal';
import { UserManagementModal } from './components/UserManagementModal';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { GlobalFilterModal } from './components/GlobalFilterModal';
import { ReturnRequestModal } from './components/ReturnRequestModal';
import { ProcessReturnModal } from './components/ProcessReturnModal';
import { PODVerificationModal } from './components/PODVerificationModal';
import { ZoneMasterModal } from './components/ZoneMasterModal';
import { RegisterAgencyModal } from './components/RegisterAgencyModal';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { 
  INITIAL_ORDERS, 
  MOCK_COMPANIES, 
  MOCK_AGENCIES, 
  MOCK_PRODUCTS, 
  MOCK_HOLD_REASONS,
  fetchOrdersFromSupabase,
  fetchCompaniesFromSupabase,
  getOrderAccessPermission,
  saveOrderToSupabase,
  deleteOrderFromSupabase,
  updateOrderStatusInSupabase,
  updateOrderAccountsApprovalInSupabase,
  saveOrderItemToSupabase,
  generateUuid,
  supabase
} from './lib/supabase';
import { Order, GlobalFilterState, Agency, Product, User, Company } from './types';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Proline OMS UI Catch:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#0f172a', color: 'white', minHeight: '100vh' }}>
          <h1 style={{ color: '#f43f5e', fontSize: '1.75rem', fontWeight: 800 }}>Proline OMS UI Recovered</h1>
          <p style={{ color: '#cbd5e1', margin: '1rem 0' }}>An isolated component error occurred. Reloading local state...</p>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, color: '#fbbf24', fontSize: '0.85rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1.5rem', padding: '0.65rem 1.25rem', background: '#38bdf8', border: 'none', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  if (!currentUser) {
    return <LoginPage />;
  }

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('proline_oms_orders_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ORDERS;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [liveCompanies, setLiveCompanies] = useState<Company[]>([]);

  // Automatically persist local copy
  React.useEffect(() => {
    if (orders && orders.length > 0) {
      try {
        localStorage.setItem('proline_oms_orders_v3', JSON.stringify(orders));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    }
  }, [orders]);

  // Initial fetch + Realtime Database Synchronization with Supabase
  React.useEffect(() => {
    fetchOrdersFromSupabase().then(({ orders: liveOrders, error }) => {
      if (liveOrders && liveOrders.length > 0 && !error) {
        setOrders(liveOrders);
        try {
          localStorage.setItem('proline_oms_orders_v3', JSON.stringify(liveOrders));
        } catch {}
      }
    });

    fetchCompaniesFromSupabase().then(comps => {
      if (comps && comps.length > 0) setLiveCompanies(comps);
    });

    // Use a unique Realtime topic. Supabase reuses channels with the same topic;
    // during React Strict Mode / hot reload an old channel can still be joining,
    // which makes `.on()` throw "cannot add callbacks after subscribe".
    const realtimeTopic = `orders_realtime_${generateUuid()}`;

    // Real-time listener for database updates across any Super Admin / Sales session
    const channel = supabase
      .channel(realtimeTopic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrdersFromSupabase().then(({ orders: liveOrders, error }) => {
          if (liveOrders && liveOrders.length > 0 && !error) {
            setOrders(liveOrders);
            try {
              localStorage.setItem('proline_oms_orders_v3', JSON.stringify(liveOrders));
            } catch {}
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const companiesPool = liveCompanies.length > 0 ? liveCompanies : MOCK_COMPANIES;

  React.useEffect(() => {
    if (!currentUser) return;
    const isChiragOrHarshad = (currentUser.full_name || '').toLowerCase().includes('chirag') || (currentUser.full_name || '').toLowerCase().includes('harshad');
    if (isChiragOrHarshad || currentUser.role_name === 'SUPER_ADMIN') return;

    setCurrentTab('dashboard');
  }, [currentUser?.id, currentUser?.role_name]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<Order | null>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForReturnRequest, setSelectedOrderForReturnRequest] = useState<Order | null>(null);
  const [selectedOrderForProcessReturn, setSelectedOrderForProcessReturn] = useState<Order | null>(null);
  const [selectedOrderForPOD, setSelectedOrderForPOD] = useState<Order | null>(null);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [userToEditInMgmt, setUserToEditInMgmt] = useState<User | null>(null);
  const [isZoneMasterOpen, setIsZoneMasterOpen] = useState(false);
  const [isRegisterAgencyOpen, setIsRegisterAgencyOpen] = useState(false);
  const [createOrderInitialAgencyId, setCreateOrderInitialAgencyId] = useState<string | undefined>(undefined);

  const handleOpenCreateOrderForAgency = (agencyId: string) => {
    setOrderToEdit(null);
    setCreateOrderInitialAgencyId(agencyId);
    setIsCreateOpen(true);
  };


  // Global App-Wide Filter Initial State
  const DEFAULT_GLOBAL_FILTER: GlobalFilterState = {
    segment: 'ALL',
    companyId: 'ALL',
    status: 'ALL',
    salespersonId: 'ALL',
    agencyId: 'ALL',
    areaId: 'ALL',
    city: 'ALL',
    zoneId: 'ALL',
    dispatchManagerId: 'ALL',
    vehicleNumber: '',
    productId: 'ALL',
    mrpRange: 'ALL',
    dateRangeType: 'ALL_DATES',
    startDate: '',
    endDate: '',
    isActive: false
  };

  const [globalFilterState, setGlobalFilterState] = useState<GlobalFilterState>(DEFAULT_GLOBAL_FILTER);
  const [isGlobalFilterOpen, setIsGlobalFilterOpen] = useState(false);

  // App-Wide Globally Filtered Orders List across all 10 dimensions + Role/Brand Access Scoping
  const globallyFilteredOrders = orders.filter(o => {
    // 0. User Access Scoping (Role & Brand Scoping)
    const accessPerm = getOrderAccessPermission(o, currentUser, companiesPool);
    if (!accessPerm.canView) return false;

    // 1. Segment Filter
    if (globalFilterState.segment !== 'ALL') {
      const comp = MOCK_COMPANIES.find(c => c.id === o.company_id || c.company_name === o.company_name);
      if (comp?.segment !== globalFilterState.segment) return false;
    }

    // 2. Brand / Company Filter
    if (globalFilterState.companyId !== 'ALL') {
      if (o.company_id !== globalFilterState.companyId) return false;
    }

    // 3. Order Status Filter
    if (globalFilterState.status !== 'ALL') {
      if (o.status !== globalFilterState.status) return false;
    }

    // 4. Salesperson Filter
    if (globalFilterState.salespersonId !== 'ALL') {
      if (o.salesperson_id !== globalFilterState.salespersonId) return false;
    }

    // 5. Agency Filter
    if (globalFilterState.agencyId !== 'ALL') {
      if (o.agency_id !== globalFilterState.agencyId) return false;
    }

    // 6. Area / Territory Filter
    if (globalFilterState.areaId !== 'ALL') {
      const agency = MOCK_AGENCIES.find(a => a.id === o.agency_id || a.agency_name === o.agency_name);
      if (agency?.area_name !== globalFilterState.areaId) return false;
    }

    // 7. City Filter
    if (globalFilterState.city !== 'ALL') {
      const agency = MOCK_AGENCIES.find(a => a.id === o.agency_id || a.agency_name === o.agency_name);
      if (agency?.city !== globalFilterState.city) return false;
    }

    if (globalFilterState.vehicleNumber && !(o.vehicle_number || '').toLowerCase().includes(globalFilterState.vehicleNumber.toLowerCase())) return false;

    // 8. Product SKU Filter
    if (globalFilterState.productId !== 'ALL') {
      const hasProduct = o.items?.some(i => i.product_id === globalFilterState.productId);
      if (!hasProduct) return false;
    }

    // 9. MRP Price Range Filter
    if (globalFilterState.mrpRange !== 'ALL') {
      const hasMatchingMRP = o.items?.some(i => {
        if (globalFilterState.mrpRange === 'UNDER_50') return i.unit_price < 50;
        if (globalFilterState.mrpRange === '50_500') return i.unit_price >= 50 && i.unit_price <= 500;
        if (globalFilterState.mrpRange === '500_5000') return i.unit_price > 500 && i.unit_price <= 5000;
        if (globalFilterState.mrpRange === 'ABOVE_5000') return i.unit_price > 5000;
        return true;
      });
      if (!hasMatchingMRP) return false;
    }

    // 10. Date Period Filter (Today, Month, Quarter, Year, Custom, All)
    if (globalFilterState.dateRangeType !== 'ALL_DATES') {
      const orderDate = new Date(o.order_date);
      const today = new Date();

      if (globalFilterState.dateRangeType === 'TODAY') {
        if (orderDate.toDateString() !== today.toDateString()) return false;
      } else if (globalFilterState.dateRangeType === 'THIS_MONTH') {
        if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) return false;
      } else if (globalFilterState.dateRangeType === 'THIS_QUARTER') {
        const orderQuarter = Math.floor(orderDate.getMonth() / 3);
        const currentQuarter = Math.floor(today.getMonth() / 3);
        if (orderQuarter !== currentQuarter || orderDate.getFullYear() !== today.getFullYear()) return false;
      } else if (globalFilterState.dateRangeType === 'THIS_YEAR') {
        if (orderDate.getFullYear() !== today.getFullYear()) return false;
      } else if (globalFilterState.dateRangeType === 'CUSTOM' && globalFilterState.startDate && globalFilterState.endDate) {
        const start = new Date(globalFilterState.startDate);
        const end = new Date(globalFilterState.endDate);
        if (orderDate < start || orderDate > end) return false;
      }
    }

    return true;
  });

  // Handlers
  const handleOpenEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setIsCreateOpen(true);
  };

  const handleCreateOrder = (orderData: Order) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === orderData.id);
      if (exists) {
        return prev.map(o => o.id === orderData.id ? { ...o, ...orderData } : o);
      }
      return [orderData, ...prev];
    });
    setIsCreateOpen(false);
    const isEditing = !!orderToEdit;
    setOrderToEdit(null);

    // Persist to Supabase
    saveOrderToSupabase(orderData);

    // Automatically open Sales Order Invoice / Dispatch Slip for the newly created order
    setSelectedOrderForInvoice(orderData);

    addNotification({
      title: isEditing ? `Order Modified: ${orderData.order_number}` : `New Order Created: ${orderData.order_number}`,
      message: isEditing 
        ? `Order updated before approval by ${orderData.salesperson_name}.`
        : `B2B Order for ${orderData.agency_name} (${orderData.total_qty_pcs} PCS). Created by ${orderData.salesperson_name}.`,
      event_type: isEditing ? 'ORDER_HELD' : 'ORDER_SUBMITTED',
      order_id: orderData.id
    });
  };

  const handleApproveOrder = (orderId: string, remarks: string, approvalDetails?: any) => {
    const approverName = currentUser ? `${currentUser.full_name}` : 'Admin';
    const approverRole = currentUser?.role_name || 'SALES_ADMIN';
    const timestamp = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (approvalDetails?.reattemptBilling) {
      const target = orders.find(order => order.id === orderId);
      const isWaiting = approvalDetails.inventory_status === 'WAIT_FOR_STOCK';
      const nextStatus = isWaiting ? 'WAIT_FOR_STOCK' : 'APPROVED';
      setOrders(prev => prev.map(order => order.id === orderId ? {
        ...order,
        status: nextStatus,
        inventory_status: approvalDetails.inventory_status,
        priority: 'HIGH',
        reattempt_delivery: true,
        pod_status: undefined,
        pod_issue_type: undefined,
        pod_issue_details: undefined,
        remarks
      } : order));
      updateOrderAccountsApprovalInSupabase(orderId, {
        status: nextStatus,
        inventory_status: approvalDetails.inventory_status,
        priority: 'HIGH',
        remarks
      });
      if (target) {
        addNotification({
          title: isWaiting ? `⏳ Reattempt Waiting for Stock: ${target.order_number}` : `🚚 Reattempt Ready for Dispatch: ${target.order_number}`,
          message: isWaiting
            ? 'Replacement stock is unavailable. Order remains at Stage 3.'
            : 'Replacement stock verified. Order sent to Billing for invoice review or modification before Stage 5 Dispatch.',
          event_type: isWaiting ? 'WAIT_FOR_STOCK' : 'REATTEMPT_DELIVERY',
          order_id: target.id
        });
      }
      setSelectedOrderForApproval(null);
      return;
    }

    if (approvalDetails?.stockReady) {
      const target = orders.find(order => order.id === orderId);
      setOrders(prev => prev.map(order => order.id === orderId ? {
        ...order,
        status: 'APPROVED',
        inventory_status: 'IN_STOCK',
        priority: approvalDetails.priority || order.priority || 'MEDIUM',
        remarks: remarks || 'Stock received and marked ready for billing'
      } : order));
      updateOrderAccountsApprovalInSupabase(orderId, {
        status: 'APPROVED',
        inventory_status: 'IN_STOCK',
        priority: approvalDetails.priority || target?.priority || 'MEDIUM',
        remarks: remarks || 'Stock received and marked ready for billing'
      });
      if (target) {
        addNotification({
          title: `✅ Stock Ready: ${target.order_number}`,
          message: `${approverName} marked stock ready. Order moved to the Stage 4 billing queue.`,
          event_type: 'ORDER_APPROVED',
          order_id: target.id
        });
      }
      setSelectedOrderForApproval(null);
      return;
    }

    const isSuperAdminUser = approverRole === 'SUPER_ADMIN' ||
      (currentUser?.full_name || '').toLowerCase().includes('chirag') ||
      (currentUser?.full_name || '').toLowerCase().includes('harshad');

    const isSalesAdminUser = approverRole === 'SALES_ADMIN';

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;

      const isWaitForStock = approvalDetails?.inventory_status === 'WAIT_FOR_STOCK';

      // ── Super Admin Final Sign-off ──────────────────────────────────────
      if (isSuperAdminUser) {
        // Super Admin can approve at any stage (SUBMITTED / SALES_ADMIN_APPROVED / HELD)
        const newStatus = isWaitForStock ? 'WAIT_FOR_STOCK' : 'APPROVED';
        return {
          ...o,
          status: newStatus,
          superadmin_approved: true,
          superadmin_approved_by: approverName,
          superadmin_approved_at: timestamp,
          superadmin_remarks: remarks || '',
          // If Sales Admin hasn't signed yet, record them too (Super Admin can approve directly)
          sales_admin_approved: o.sales_admin_approved ?? true,
          approved_by_name: approverName,
          approved_at: timestamp,
          payment_type: approvalDetails?.payment_type || o.payment_type || 'CREDIT',
          payment_receipt_no: approvalDetails?.payment_receipt_no || o.payment_receipt_no,
          priority: approvalDetails?.priority || o.priority || 'MEDIUM',
          inventory_status: approvalDetails?.inventory_status || 'IN_STOCK',
          credit_days: approvalDetails?.payment_type === 'ADVANCE' ? 0 : (approvalDetails?.credit_days || o.credit_days || 30)
        };
      }

      // ── Sales Admin Sign-off ──────────────────────────────────────────
      if (isSalesAdminUser || !isSuperAdminUser) {
        if (approvalDetails?.directApprove) {
          // Direct Approval: bypass higher authority and move straight to APPROVED (Stage 3)
          return {
            ...o,
            status: isWaitForStock ? 'WAIT_FOR_STOCK' : 'APPROVED',
            sales_admin_approved: true,
            sales_admin_approved_by: approverName,
            sales_admin_approved_at: timestamp,
            // No Super Admin approval was requested for this order. Do not
            // fabricate a Super Admin sign-off when Sales Admin proceeds.
            superadmin_approved: o.superadmin_approved || false,
            approved_by_name: approverName,
            approved_at: timestamp,
            sales_admin_remarks: remarks || 'Directly approved by Sales Admin',
            payment_type: approvalDetails?.payment_type || o.payment_type || 'CREDIT',
            payment_receipt_no: approvalDetails?.payment_receipt_no || o.payment_receipt_no,
            priority: approvalDetails?.priority || o.priority || 'MEDIUM',
            inventory_status: approvalDetails?.inventory_status || 'IN_STOCK',
            credit_days: approvalDetails?.payment_type === 'ADVANCE' ? 0 : (approvalDetails?.credit_days || o.credit_days || 30)
          };
        }

        if (isWaitForStock) {
          return {
            ...o,
            status: 'WAIT_FOR_STOCK',
            sales_admin_approved: true,
            sales_admin_approved_by: approverName,
            sales_admin_approved_at: timestamp,
            sales_admin_remarks: remarks || '',
            priority: approvalDetails?.priority || o.priority || 'MEDIUM',
            inventory_status: 'WAIT_FOR_STOCK'
          };
        }

        // Forward to Harshad Sir / Higher Authority for Approval
        return {
          ...o,
          status: 'SALES_ADMIN_APPROVED',
          sales_admin_approved: true,
          sales_admin_approved_by: approverName,
          sales_admin_approved_at: timestamp,
          sales_admin_remarks: remarks || 'Forwarded for Harshad Sir approval',
          payment_type: approvalDetails?.payment_type || o.payment_type || 'CREDIT',
          payment_receipt_no: approvalDetails?.payment_receipt_no || o.payment_receipt_no,
          priority: approvalDetails?.priority || o.priority || 'MEDIUM',
          inventory_status: approvalDetails?.inventory_status || 'IN_STOCK',
        };
      }

      return o;
    }));

    const target = orders.find(o => o.id === orderId);
    if (target) {
      const isWait = approvalDetails?.inventory_status === 'WAIT_FOR_STOCK';

      if (isSuperAdminUser) {
        updateOrderStatusInSupabase(orderId, isWait ? 'WAIT_FOR_STOCK' : 'APPROVED', remarks);
        addNotification({
          title: isWait ? `⚠️ Wait for Stock: ${target.order_number}` : `✅ Final Approval: ${target.order_number}`,
          message: isWait
            ? `Super Admin set Wait for Stock. Alert sent to Salesman (${target.salesperson_name}).`
            : `Super Admin ${approverName} gave final sign-off. Order fully APPROVED & routed to Stage 4 (Billing).`,
          event_type: isWait ? 'WAIT_FOR_STOCK' : 'ORDER_APPROVED',
          order_id: target.id
        });
      } else if (approvalDetails?.directApprove) {
        updateOrderStatusInSupabase(orderId, isWait ? 'WAIT_FOR_STOCK' : 'APPROVED', remarks);
        addNotification({
          title: isWait ? `⚠️ Wait for Stock: ${target.order_number}` : `✅ Direct Approval: ${target.order_number}`,
          message: `Sales Admin ${approverName} directly approved order without Higher Authority sign-off. Order routed to Stage 3.`,
          event_type: 'ORDER_APPROVED',
          order_id: target.id
        });
      } else {
        updateOrderStatusInSupabase(orderId, isWait ? 'WAIT_FOR_STOCK' : 'SALES_ADMIN_APPROVED', remarks);
        addNotification({
          title: isWait ? `⚠️ Wait for Stock: ${target.order_number}` : `🟡 Sent to Harshad Sir: ${target.order_number}`,
          message: `Sales Admin ${approverName} sent order to Harshad Sir for approval. Note: "${remarks || 'Approval requested'}".`,
          event_type: 'ORDER_APPROVED',
          order_id: target.id
        });
      }
    }

    setSelectedOrderForApproval(null);
  };



  const handleHoldOrder = (orderId: string, reasonId: string, remarks: string) => {
    const reasonObj = MOCK_HOLD_REASONS.find(r => r.id === reasonId);
    const holdReasonText = reasonObj ? reasonObj.reason_description : 'Super Admin Hold Directive';
    const heldByName = currentUser ? `${currentUser.full_name} (${currentUser.role_name === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'})` : 'Super Admin (Chirag / Harshad)';

    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      previous_status_before_hold: o.status !== 'HELD' ? o.status : o.previous_status_before_hold || 'SUBMITTED',
      status: 'HELD', 
      hold_reason: holdReasonText,
      hold_remarks: remarks || 'Executive directive hold applied.'
    } : o));

    updateOrderStatusInSupabase(orderId, 'HELD', remarks);

    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Order Placed on Hold: ${target.order_number}`,
        message: `Placed on Hold by ${heldByName}. Reason: ${holdReasonText}. Remarks: ${remarks || 'Check required'}`,
        event_type: 'ORDER_HELD',
        order_id: target.id
      });
    }
    setSelectedOrderForApproval(null);
  };

  const handleReleaseHold = (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;
    const restoredStatus = target.previous_status_before_hold || 'SUBMITTED';
    const releaserName = currentUser ? `${currentUser.full_name} (${currentUser.role_name === 'SUPER_ADMIN' ? 'Super Admin' : 'Accounts Admin'})` : 'Super Admin';

    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: restoredStatus,
      hold_reason: undefined,
      hold_remarks: undefined
    } : o));

    updateOrderStatusInSupabase(orderId, restoredStatus);

    addNotification({
      title: `▶️ Hold Released: ${target.order_number}`,
      message: `Hold released by ${releaserName}. Order resumed from exact pending stage (${restoredStatus}).`,
      event_type: 'HOLD_RELEASED',
      order_id: target.id
    });
  };

  const handleConfirmPOD = (orderId: string, podStatus: 'CLEAN' | 'ISSUE_RAISED', issueType?: 'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' | 'OTHER', details?: string) => {
    const timestamp = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const verifier = currentUser?.full_name || 'Sales Admin';
    const target = orders.find(order => order.id === orderId);
    const podHistoryEntry = podStatus === 'ISSUE_RAISED' ? {
      id: generateUuid(), order_id: orderId, action: 'POD_QUERY_RAISED', performed_by: verifier,
      performed_at: new Date().toISOString(), remarks: details,
      details: { issue_type: issueType, message: details, raised_by: verifier, raised_at: timestamp }
    } : undefined;
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: podStatus === 'CLEAN' ? 'COMPLETED' : 'POD_ISSUE_RAISED',
      pod_status: podStatus,
      pod_issue_type: issueType,
      pod_issue_details: details,
      pod_query_raised_by: podStatus === 'ISSUE_RAISED' ? verifier : o.pod_query_raised_by,
      pod_query_raised_at: podStatus === 'ISSUE_RAISED' ? timestamp : o.pod_query_raised_at,
      need_accounts_approval: podStatus === 'ISSUE_RAISED',
      accounts_approval_status: podStatus === 'ISSUE_RAISED' ? 'PENDING' : o.accounts_approval_status,
      accounts_approval_message: podStatus === 'ISSUE_RAISED' ? `POD ${issueType || 'ISSUE'}: ${details || 'Sales Admin requests a decision.'}` : o.accounts_approval_message,
      accounts_approval_requested_by: podStatus === 'ISSUE_RAISED' ? verifier : o.accounts_approval_requested_by,
      accounts_approval_requested_at: podStatus === 'ISSUE_RAISED' ? timestamp : o.accounts_approval_requested_at,
      order_history: podHistoryEntry ? [...(o.order_history || []), podHistoryEntry] : o.order_history
    } : o));
    if (podStatus === 'CLEAN') {
      updateOrderStatusInSupabase(orderId, 'COMPLETED', 'POD verified with no issue');
    } else {
      updateOrderAccountsApprovalInSupabase(orderId, {
        status: 'POD_ISSUE_RAISED',
        need_accounts_approval: true,
        accounts_approval_status: 'PENDING',
        accounts_approval_message: `POD ${issueType || 'ISSUE'}: ${details || 'Sales Admin requests a decision.'}`,
        accounts_approval_requested_by: verifier,
        accounts_approval_requested_at: timestamp,
        order_history: podHistoryEntry ? [...(target?.order_history || []), podHistoryEntry] : target?.order_history
      });
    }
  };

  const handleResolveException = (orderId: string, action: 'CREATE_GRN' | 'REATTEMPT_DELIVERY', grnNumber?: string, grnValue?: number) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    if (action === 'CREATE_GRN') {
      const historyEntry = { id: generateUuid(), order_id: orderId, action: 'GRN_REQUESTED_BY_ADMIN', performed_by: currentUser?.full_name || 'Admin', performed_at: new Date().toISOString(), remarks: 'GRN request forwarded to Sales Admin' };
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        grn_workflow_status: 'PENDING_SALES_ADMIN',
        order_history: [...(o.order_history || []), historyEntry]
      } : o));
      updateOrderAccountsApprovalInSupabase(orderId, { order_history: [...(target.order_history || []), historyEntry], remarks: 'GRN request forwarded to Sales Admin' });

      addNotification({
        title: `📋 GRN Request Sent to Sales Admin: ${target.order_number}`,
        message: 'Admin forwarded the delivery exception to Sales Admin for GRN review.',
        event_type: 'GRN_REQUESTED',
        order_id: target.id
      });
    } else {
      const historyEntry = {
        id: generateUuid(),
        order_id: orderId,
        action: 'REATTEMPT_DELIVERY',
        performed_by: currentUser?.full_name || 'Sales Admin',
        performed_at: new Date().toISOString(),
        remarks: 'Reattempt delivery routed to Stage 3 stock check'
      };
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'SALES_ADMIN_APPROVED',
        priority: 'HIGH',
        inventory_status: 'IN_STOCK',
        reattempt_delivery: true,
        need_accounts_approval: false,
        accounts_approval_status: 'NOT_REQUIRED',
        order_history: [...(o.order_history || []), historyEntry]
      } : o));

      updateOrderAccountsApprovalInSupabase(orderId, {
        status: 'SALES_ADMIN_APPROVED',
        priority: 'HIGH',
        inventory_status: 'IN_STOCK',
        need_accounts_approval: false,
        accounts_approval_status: 'NOT_REQUIRED',
        order_history: [...(target.order_history || []), historyEntry],
        remarks: 'Reattempt delivery — route to Stage 3 stock check'
      });

      addNotification({
        title: `🚨 Reattempt Delivery Dispatched: ${target.order_number}`,
        message: `Delivery exception resolved by Sales Admin. Order re-routed back to Stage 5 Dispatch Team with HIGH PRIORITY flag.`,
        event_type: 'REATTEMPT_DELIVERY',
        order_id: target.id
      });
    }
  };

  const handleForwardGrnToBilling = (orderId: string) => {
    const target = orders.find(order => order.id === orderId);
    if (!target) return;
    const historyEntry = { id: generateUuid(), order_id: orderId, action: 'GRN_FORWARDED_TO_BILLING', performed_by: currentUser?.full_name || 'Sales Admin', performed_at: new Date().toISOString(), remarks: 'GRN request approved and forwarded to Billing' };
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, grn_workflow_status: 'PENDING_BILLING', order_history: [...(order.order_history || []), historyEntry] } : order));
    updateOrderAccountsApprovalInSupabase(orderId, { order_history: [...(target.order_history || []), historyEntry], remarks: 'GRN request forwarded to Billing' });
    addNotification({ title: `📨 GRN Forwarded to Billing: ${target.order_number}`, message: 'Sales Admin approved the GRN request. Billing must enter the GRN number and value.', event_type: 'GRN_FORWARDED', order_id: orderId });
  };

  const handleCompleteGrn = (orderId: string, grnNumber: string, grnDate: string, grnValue: number, grnRemark: string) => {
    const target = orders.find(order => order.id === orderId);
    if (!target) return;
    const historyEntry = { id: generateUuid(), order_id: orderId, action: 'GRN_CREATED', performed_by: currentUser?.full_name || 'Billing', performed_at: new Date().toISOString(), remarks: grnRemark, details: { grn_number: grnNumber, grn_date: grnDate, grn_value: grnValue, grn_remark: grnRemark } };
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, grn_workflow_status: 'PENDING_SALES_ADMIN_COMPLETION', grn_number: grnNumber, grn_date: grnDate, grn_value: grnValue, grn_remark: grnRemark, order_history: [...(order.order_history || []), historyEntry] } : order));
    updateOrderAccountsApprovalInSupabase(orderId, { order_history: [...(target.order_history || []), historyEntry], remarks: `GRN ${grnNumber} created for ₹${grnValue}; awaiting Sales Admin completion` });
    addNotification({ title: `✅ GRN Created: ${grnNumber}`, message: `Billing created the GRN for ${target.order_number}. Sales Admin must mark the order completed.`, event_type: 'GRN_CREATED', order_id: orderId });
  };

  const handleCompleteOrderAfterGrn = (orderId: string) => {
    const target = orders.find(order => order.id === orderId);
    if (!target) return;
    const historyEntry = { id: generateUuid(), order_id: orderId, action: 'ORDER_COMPLETED_AFTER_GRN', performed_by: currentUser?.full_name || 'Sales Admin', performed_at: new Date().toISOString(), remarks: `Order completed after GRN ${target.grn_number}` };
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: 'COMPLETED', grn_workflow_status: 'COMPLETED', order_history: [...(order.order_history || []), historyEntry] } : order));
    updateOrderAccountsApprovalInSupabase(orderId, { status: 'COMPLETED', order_history: [...(target.order_history || []), historyEntry], remarks: `Completed by Sales Admin after GRN ${target.grn_number}` });
    addNotification({ title: `✅ Order Completed: ${target.order_number}`, message: `Sales Admin confirmed completion after GRN ${target.grn_number}.`, event_type: 'ORDER_COMPLETED', order_id: orderId });
  };

  const handleRejectOrder = (orderId: string, remarks: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'REJECTED' } : o));
    updateOrderStatusInSupabase(orderId, 'REJECTED', remarks);
    setSelectedOrderForApproval(null);
  };

  const handleConfirmDispatch = (orderId: string, dispatchData: any) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const isDeliveryDetailsUpdate = o.status === 'BILLED' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY_FOR_PICKUP';
        const updatedItems = isDeliveryDetailsUpdate ? o.items : o.items?.map(item => {
          const match = dispatchData.items.find((di: any) => di.order_item_id === item.id);
          const dispatchQty = match ? match.dispatch_qty : item.pending_qty_pcs;
          const newDispatched = item.dispatched_qty_pcs + dispatchQty;
          return {
            ...item,
            dispatched_qty_pcs: newDispatched,
            pending_qty_pcs: item.total_qty_pcs - newDispatched
          };
        });

        const totalOrdered = o.status === 'BILLED' ? (o.billing_total_qty || o.total_qty_pcs) : o.total_qty_pcs;
        const totalDispatched = updatedItems?.reduce((acc, i) => acc + i.dispatched_qty_pcs, 0) || 0;
        const newStatus = isDeliveryDetailsUpdate
          ? (dispatchData.dispatch_type === 'Self Pickup' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY')
          : (totalDispatched >= totalOrdered ? 'OUT_FOR_DELIVERY' : 'PARTIALLY_DISPATCHED');

        updateOrderAccountsApprovalInSupabase(orderId, {
          status: newStatus,
          vehicle_number: dispatchData.vehicle_number,
          is_company_vehicle: dispatchData.dispatch_type === 'Self Pickup' ? undefined : dispatchData.is_company_vehicle,
          driver_name: dispatchData.driver_name,
          driver_mobile: dispatchData.driver_mobile,
          tempo_number: dispatchData.tempo_number,
          booking_id: dispatchData.booking_id,
          rental_agency_name: dispatchData.rental_agency_name,
          freight_amount: dispatchData.freight_amount,
          dispatch_remark: dispatchData.dispatch_remark,
          order_history: [
            ...(o.order_history || []),
            {
              id: generateUuid(),
              order_id: orderId,
              action: 'DISPATCH_TRANSPORT_ASSIGNED',
              performed_by: currentUser?.full_name || 'Dispatch Manager',
              performed_at: new Date().toISOString(),
              remarks: dispatchData.dispatch_remark,
              details: {
                dispatch_type: dispatchData.dispatch_type,
                vehicle_number: dispatchData.vehicle_number,
                is_company_vehicle: dispatchData.is_company_vehicle,
                driver_name: dispatchData.driver_name,
                driver_mobile: dispatchData.driver_mobile,
                tempo_number: dispatchData.tempo_number,
                booking_id: dispatchData.booking_id,
                rental_agency_name: dispatchData.rental_agency_name,
                freight_amount: dispatchData.freight_amount,
                dispatch_remark: dispatchData.dispatch_remark
              }
            }
          ]
        });
        updatedItems?.forEach(item => { void saveOrderItemToSupabase(item); });

        return {
          ...o,
          status: newStatus,
          delivery_type: dispatchData.dispatch_type,
          vehicle_number: dispatchData.vehicle_number,
          is_company_vehicle: dispatchData.dispatch_type === 'Self Pickup' ? undefined : dispatchData.is_company_vehicle,
          driver_name: dispatchData.driver_name,
          driver_mobile: dispatchData.driver_mobile,
          tempo_number: dispatchData.tempo_number,
          booking_id: dispatchData.booking_id,
          rental_agency_name: dispatchData.rental_agency_name,
          freight_amount: dispatchData.freight_amount,
          dispatch_remark: dispatchData.dispatch_remark,
          items: updatedItems
        };
      }
      return o;
    }));

    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Dispatch Confirmed & Pushed to Accounts: ${target.order_number}`,
        message: `Invoice-ready goods dispatched via ${dispatchData.vehicle_number}. Sales Admin can now verify POD.`,
        event_type: 'DISPATCH_CONFIRMED',
        order_id: target.id
      });
    }
  };

  const handleGenerateInvoice = (order: Order, invoiceNumber: string, billingTotalQty: number, invoiceAmount: number, creditDays: number, remark: string, billedQtyByItem: Record<string, number>) => {
    const orderId = order.id;
    const invoiceDate = new Date().toISOString().substring(0, 10);
    const updatedItems = (order.items || []).map(item => ({
      ...item,
      issued_qty_pcs: Math.max(0, Math.min(item.total_qty_pcs || 0, billedQtyByItem[item.id] || 0))
    }));
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'BILLED',
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      invoice_amount: invoiceAmount,
      billing_total_qty: billingTotalQty,
      reattempt_delivery: false,
      credit_days: creditDays,
      remarks: remark,
      items: updatedItems
    } : o));
    updateOrderAccountsApprovalInSupabase(orderId, {
      status: 'BILLED',
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      invoice_amount: invoiceAmount,
      billing_total_qty: billingTotalQty,
      credit_days: creditDays,
      remarks: remark,
      order_history: order.reattempt_delivery ? [...(order.order_history || []), { id: generateUuid(), order_id: orderId, action: 'REATTEMPT_INVOICE_REVIEWED', performed_by: currentUser?.full_name || 'Billing', performed_at: new Date().toISOString(), remarks: remark || 'Invoice reviewed for delivery reattempt', details: { invoice_number: invoiceNumber, invoice_amount: invoiceAmount } }] : order.order_history
    });
    updatedItems.forEach(item => { void saveOrderItemToSupabase(item); });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: any) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    updateOrderStatusInSupabase(orderId, newStatus);
  };

  const handleRequestAccountsApproval = (orderId: string, message: string) => {
    const timestamp = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const requesterName = currentUser?.full_name || 'Sales Admin';

    const historyEntry: any = {
      id: generateUuid(),
      order_id: orderId,
      action: 'ACCOUNTS_APPROVAL_REQUESTED',
      performed_by: requesterName,
      performed_at: timestamp,
      remarks: message
    };

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        // Legacy `accounts_*` fields are retained for database compatibility;
        // in Stage 2 this is a Super Admin approval request.
        status: 'SALES_ADMIN_APPROVED',
        sales_admin_approved: true,
        sales_admin_approved_by: requesterName,
        sales_admin_approved_at: timestamp,
        sales_admin_remarks: message,
        need_accounts_approval: true,
        accounts_approval_status: 'PENDING',
        accounts_approval_message: message,
        accounts_approval_requested_by: requesterName,
        accounts_approval_requested_at: timestamp,
        order_history: [...(o.order_history || []), historyEntry]
      };
    }));

    updateOrderAccountsApprovalInSupabase(orderId, {
      status: 'SALES_ADMIN_APPROVED',
      sales_admin_approved: true,
      sales_admin_approved_by: requesterName,
      sales_admin_approved_at: timestamp,
      sales_admin_remarks: message,
      need_accounts_approval: true,
      accounts_approval_status: 'PENDING',
      accounts_approval_message: message,
      accounts_approval_requested_by: requesterName,
      accounts_approval_requested_at: timestamp
    });

    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Super Admin Approval Requested: ${target.order_number}`,
        message: `${requesterName} requested Super Admin approval: "${message}"`,
        event_type: 'ACCOUNTS_APPROVAL_REQUESTED',
        order_id: target.id
      });
    }
  };

  const handleAccountsApprovalResponse = (orderId: string, responseStatus: 'APPROVED' | 'HOLD' | 'REJECTED', remark: string) => {
    const timestamp = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const responderName = currentUser?.full_name || 'Super Admin';

    const historyEntry: any = {
      id: generateUuid(),
      order_id: orderId,
      action: `ACCOUNTS_${responseStatus}`,
      performed_by: responderName,
      performed_at: timestamp,
      remarks: remark
    };

    let targetStatus: any = undefined;

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;

      let newStatus = o.status;
      const isPodException = o.status === 'POD_ISSUE_RAISED';
      if (isPodException && responseStatus === 'APPROVED') {
        // Super Admin chose RESEND for a Stage 6 POD exception.
        newStatus = 'APPROVED';
      } else if (isPodException && responseStatus === 'REJECTED') {
        // Super Admin chose GRN settlement for the POD exception.
        newStatus = 'COMPLETED';
      } else if (responseStatus === 'APPROVED') {
        // Super Admin is the first approval. The Sales Admin must still do
        // the final review before the order can proceed to stock check.
        newStatus = o.status === 'POD_ISSUE_RAISED' ? 'POD_ISSUE_RAISED' : 'SALES_ADMIN_APPROVED';
      } else if (responseStatus === 'HOLD') {
        newStatus = 'HELD';
      } else if (responseStatus === 'REJECTED') {
        newStatus = 'REJECTED';
      }
      targetStatus = newStatus;

      return {
        ...o,
        status: newStatus,
        accounts_approval_status: responseStatus,
        accounts_approval_response_remark: remark,
        accounts_approval_responded_by: responderName,
        accounts_approval_responded_at: timestamp,
        superadmin_approved: responseStatus === 'APPROVED',
        superadmin_approved_by: responseStatus === 'APPROVED' ? responderName : o.superadmin_approved_by,
        superadmin_approved_at: responseStatus === 'APPROVED' ? timestamp : o.superadmin_approved_at,
        superadmin_remarks: responseStatus === 'APPROVED' ? remark : o.superadmin_remarks,
        priority: isPodException && responseStatus === 'APPROVED' ? 'HIGH' : o.priority,
        grn_number: isPodException && responseStatus === 'REJECTED' ? `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : o.grn_number,
        hold_reason: responseStatus === 'HOLD' ? 'Accounts Hold Directive' : o.hold_reason,
        hold_remarks: responseStatus === 'HOLD' ? remark : o.hold_remarks,
        order_history: [...(o.order_history || []), historyEntry]
      };
    }));

    updateOrderAccountsApprovalInSupabase(orderId, {
      status: targetStatus,
      accounts_approval_status: responseStatus,
      accounts_approval_response_remark: remark,
      accounts_approval_responded_by: responderName,
      accounts_approval_responded_at: timestamp,
      superadmin_approved: responseStatus === 'APPROVED',
      superadmin_approved_by: responseStatus === 'APPROVED' ? responderName : undefined,
      superadmin_approved_at: responseStatus === 'APPROVED' ? timestamp : undefined,
      superadmin_remarks: responseStatus === 'APPROVED' ? remark : undefined
    });

    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Super Admin Decision [${responseStatus}]: ${target.order_number}`,
        message: `${responderName} marked Super Admin approval as ${responseStatus}. Remark: "${remark || 'No remark'}"`,
        event_type: `ACCOUNTS_${responseStatus}`,
        order_id: target.id
      });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const cancelHistory: any = {
      id: generateUuid(),
      order_id: orderId,
      action: 'ORDER_CANCELLED',
      performed_by: currentUser?.full_name || 'Admin',
      performed_at: new Date().toISOString(),
      remarks: 'Order cancelled'
    };
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'CANCELLED',
      order_history: [...(o.order_history || []), cancelHistory]
    } : o));
    updateOrderStatusInSupabase(orderId, 'CANCELLED');
    addNotification({
      title: `Order Cancelled`,
      message: `Sales order ${orderId} has been cancelled.`,
      event_type: 'ORDER_CANCELLED',
      order_id: orderId
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    deleteOrderFromSupabase(orderId);
    addNotification({
      title: `Order Deleted (Admin Action)`,
      message: `Sales order removed permanently by System Admin.`,
      event_type: 'ORDER_DELETED',
      order_id: orderId
    });
  };

  const handleSubmitReturnRequest = (orderId: string, returnRequestData: any) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      return_request: returnRequestData
    } : o));
  };

  const handleApproveReturnRequest = (orderId: string) => {
    const approverName = currentUser ? `${currentUser.full_name} (${currentUser.role_name === 'SUPER_ADMIN' ? 'Super Admin' : 'System Admin'})` : 'System Admin';
    setOrders(prev => prev.map(o => o.id === orderId && o.return_request ? {
      ...o,
      return_request: {
        ...o.return_request,
        status: 'APPROVED',
        approved_by_name: approverName,
        approved_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
    } : o));
  };

  const handleRejectReturnRequest = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId && o.return_request ? {
      ...o,
      return_request: {
        ...o.return_request,
        status: 'REJECTED'
      }
    } : o));
  };

  const handleConfirmReturnSettlement = (orderId: string, settlementData: any) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId && o.return_request) {
        const isDamagedReturn = settlementData.return_type === 'DAMAGED_RETURN';
        
        let updatedItems = o.items;
        if (isDamagedReturn) {
          // Less in quantity for damaged returns
          updatedItems = o.items?.map(item => {
            const match = settlementData.items.find((si: any) => si.order_item_id === item.id);
            const reducedQty = match ? match.settled_qty_pcs : 0;
            const newDispatched = Math.max(0, (item.dispatched_qty_pcs || item.total_qty_pcs) - reducedQty);
            return {
              ...item,
              dispatched_qty_pcs: newDispatched
            };
          });
        }

        return {
          ...o,
          items: updatedItems,
          return_request: {
            ...o.return_request,
            status: 'DISPATCH_PROCESSED',
            dispatch_notes: settlementData.dispatch_notes
          }
        };
      }
      return o;
    }));
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="main-content">
        <Header 
          onToggleSidebarCollapse={() => {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
            setIsSidebarCollapsed(!isSidebarCollapsed);
          }}
          onOpenUserManagement={() => setIsUserMgmtOpen(true)}
          onOpenGlobalFilter={() => setIsGlobalFilterOpen(true)}
          globalFilterState={globalFilterState}
        />

        {currentTab === 'dashboard' && (
          <DashboardPage 
            orders={globallyFilteredOrders} 
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrder={(o) => setSelectedOrderForApproval(o)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersPage 
            orders={globallyFilteredOrders} 
            onOpenCreateOrder={() => { setOrderToEdit(null); setIsCreateOpen(true); }}
            onOpenEditOrder={handleOpenEditOrder}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={handleDeleteOrder}
            onOpenReturnRequestModal={(o) => setSelectedOrderForReturnRequest(o)}
            onApprove={handleApproveOrder}
            onHold={handleHoldOrder}
            onReject={handleRejectOrder}
            onRequestAccountsApproval={handleRequestAccountsApproval}
            onAccountsApprovalResponse={handleAccountsApprovalResponse}
            onOpenPODModal={(o) => setSelectedOrderForPOD(o)}
          />
        )}

        {currentTab === 'approvals' && (
          <OrdersPage 
            orders={globallyFilteredOrders.filter(o => 
              o.status === 'SUBMITTED' || 
              o.status === 'SALES_ADMIN_APPROVED' || 
              o.status === 'HELD' ||
              o.status === 'POD_ISSUE_RAISED' ||
              o.status === 'REJECTED'
            )} 
            onOpenCreateOrder={() => { setOrderToEdit(null); setIsCreateOpen(true); }}
            onOpenEditOrder={handleOpenEditOrder}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onApprove={handleApproveOrder}
            onHold={handleHoldOrder}
            onReject={handleRejectOrder}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={handleDeleteOrder}
            onOpenReturnRequestModal={(o) => setSelectedOrderForReturnRequest(o)}
            onRequestAccountsApproval={handleRequestAccountsApproval}
            onAccountsApprovalResponse={handleAccountsApprovalResponse}
            onOpenPODModal={(o) => setSelectedOrderForPOD(o)}
          />
        )}


        {currentTab === 'masters' && (
          <MastersPage 
            initialTab="agencies" 
            onOpenUserMgmtModal={(user) => { setUserToEditInMgmt(user || null); setIsUserMgmtOpen(true); }} 
            onOpenCreateOrderForAgency={handleOpenCreateOrderForAgency}
          />
        )}

        {currentTab === 'zones' && (
          <MastersPage 
            initialTab="areas" 
            onOpenUserMgmtModal={(user) => { setUserToEditInMgmt(user || null); setIsUserMgmtOpen(true); }} 
            onOpenCreateOrderForAgency={handleOpenCreateOrderForAgency}
          />
        )}


        {currentTab === 'dispatch' && (
          <DispatchPage 
            orders={globallyFilteredOrders} 
            onOpenDispatchModal={(o) => setSelectedOrderForDispatch(o)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenProcessReturnModal={(o) => setSelectedOrderForProcessReturn(o)}
            onOpenPODModal={(o) => setSelectedOrderForPOD(o)}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsPage 
            orders={globallyFilteredOrders} 
            onGenerateInvoice={handleGenerateInvoice}
            onCompleteGrn={handleCompleteGrn}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsPage 
            orders={globallyFilteredOrders} 
          />
        )}

        {currentTab === 'returns' && (
          <ReturnsRegisterView
            orders={orders}
            onOpenProcessReturnModal={(o) => setSelectedOrderForProcessReturn(o)}
            onSelectOrder={(o) => setSelectedOrderForApproval(o)}
            onResolveException={handleResolveException}
            onForwardGrnToBilling={handleForwardGrnToBilling}
            onCompleteOrderAfterGrn={handleCompleteOrderAfterGrn}
          />
        )}

        {currentTab === 'pod' && (
          <PODQueueView
            orders={orders}
            onVerifyPOD={(order) => setSelectedOrderForPOD(order)}
            onResolveQuery={handleResolveException}
          />
        )}

        {currentTab === 'tracker' && (
          <OrderTrackerView
            orders={orders}
            onReleaseHold={handleReleaseHold}
          />
        )}
      </div>

      {/* Global Modals */}
      <CreateOrderModal 
        isOpen={isCreateOpen}
        orderToEdit={orderToEdit}
        initialAgencyId={createOrderInitialAgencyId}
        onClose={() => { setIsCreateOpen(false); setOrderToEdit(null); setCreateOrderInitialAgencyId(undefined); }}
        onSubmitOrder={handleCreateOrder}
      />


      <OrderApprovalModal 
        order={selectedOrderForApproval}
        isOpen={!!selectedOrderForApproval}
        onClose={() => setSelectedOrderForApproval(null)}
        onApprove={handleApproveOrder}
        onHold={handleHoldOrder}
        onReject={handleRejectOrder}
        onApproveReturnRequest={handleApproveReturnRequest}
        onRejectReturnRequest={handleRejectReturnRequest}
      />

      <DispatchModal 
        order={selectedOrderForDispatch}
        isOpen={!!selectedOrderForDispatch}
        onClose={() => setSelectedOrderForDispatch(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <ReturnRequestModal 
        order={selectedOrderForReturnRequest}
        isOpen={!!selectedOrderForReturnRequest}
        onClose={() => setSelectedOrderForReturnRequest(null)}
        onSubmitReturnRequest={handleSubmitReturnRequest}
      />

      <ProcessReturnModal 
        order={selectedOrderForProcessReturn}
        isOpen={!!selectedOrderForProcessReturn}
        onClose={() => setSelectedOrderForProcessReturn(null)}
        onConfirmReturnSettlement={handleConfirmReturnSettlement}
      />

      <UserManagementModal 
        isOpen={isUserMgmtOpen}
        onClose={() => { setIsUserMgmtOpen(false); setUserToEditInMgmt(null); }}
        initialUserToEdit={userToEditInMgmt}
      />

      <ZoneMasterModal 
        isOpen={isZoneMasterOpen}
        onClose={() => setIsZoneMasterOpen(false)}
        agencies={MOCK_AGENCIES}
      />

      <OrderInvoiceModal 
        order={selectedOrderForInvoice}
        isOpen={!!selectedOrderForInvoice}
        onClose={() => setSelectedOrderForInvoice(null)}
      />

      <GlobalFilterModal 
        isOpen={isGlobalFilterOpen}
        filterState={globalFilterState}
        onClose={() => setIsGlobalFilterOpen(false)}
        onApplyFilter={(state) => setGlobalFilterState(state)}
        onResetFilter={() => setGlobalFilterState(DEFAULT_GLOBAL_FILTER)}
      />

      <RegisterAgencyModal
        isOpen={isRegisterAgencyOpen}
        onClose={() => setIsRegisterAgencyOpen(false)}
        onSuccess={(newAgency) => {
          addNotification({
            title: `🏪 New Sales Agency Registered: ${newAgency.agency_name}`,
            message: `Party registered & mapped to ${newAgency.zone_name} (${newAgency.zone_region}). Assigned Salesperson: ${newAgency.assigned_salesperson || 'Field Exec'}.`,
            event_type: 'AGENCY_REGISTERED'
          });
        }}
      />

      <PODVerificationModal
        order={selectedOrderForPOD}
        isOpen={!!selectedOrderForPOD}
        onClose={() => setSelectedOrderForPOD(null)}
        onConfirmPOD={handleConfirmPOD}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <MainLayout />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
