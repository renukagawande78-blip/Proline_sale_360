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
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderApprovalModal } from './components/OrderApprovalModal';
import { DispatchModal } from './components/DispatchModal';
import { UserManagementModal } from './components/UserManagementModal';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { GlobalFilterModal } from './components/GlobalFilterModal';
import { ReturnRequestModal } from './components/ReturnRequestModal';
import { ProcessReturnModal } from './components/ProcessReturnModal';
import { ZoneMasterModal } from './components/ZoneMasterModal';
import { RegisterAgencyModal } from './components/RegisterAgencyModal';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { INITIAL_ORDERS, MOCK_COMPANIES, MOCK_AGENCIES, MOCK_PRODUCTS } from './lib/supabase';
import { Order, GlobalFilterState, Agency, Product } from './types';

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
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<Order | null>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForReturnRequest, setSelectedOrderForReturnRequest] = useState<Order | null>(null);
  const [selectedOrderForProcessReturn, setSelectedOrderForProcessReturn] = useState<Order | null>(null);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [isZoneMasterOpen, setIsZoneMasterOpen] = useState(false);
  const [isRegisterAgencyOpen, setIsRegisterAgencyOpen] = useState(false);

  // Global App-Wide Filter Initial State
  const DEFAULT_GLOBAL_FILTER: GlobalFilterState = {
    segment: 'ALL',
    companyId: 'ALL',
    status: 'ALL',
    salespersonId: 'ALL',
    agencyId: 'ALL',
    areaId: 'ALL',
    city: 'ALL',
    productId: 'ALL',
    mrpRange: 'ALL',
    dateRangeType: 'ALL_DATES',
    startDate: '',
    endDate: '',
    isActive: false
  };

  const [globalFilterState, setGlobalFilterState] = useState<GlobalFilterState>(DEFAULT_GLOBAL_FILTER);
  const [isGlobalFilterOpen, setIsGlobalFilterOpen] = useState(false);

  // App-Wide Globally Filtered Orders List across all 10 dimensions
  const globallyFilteredOrders = orders.filter(o => {
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
  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    addNotification({
      title: `New Order Created: ${newOrder.order_number}`,
      message: `B2B Order for ${newOrder.agency_name} (${newOrder.total_qty_pcs} PCS). Created by ${newOrder.salesperson_name}.`,
      event_type: 'ORDER_SUBMITTED',
      order_id: newOrder.id
    });
  };

  const handleApproveOrder = (orderId: string, remarks: string) => {
    const approverName = currentUser ? `${currentUser.full_name} (${currentUser.role_name === 'SUPER_ADMIN' ? 'Super Admin' : 'System Admin'})` : 'System Admin';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      status: 'APPROVED',
      approved_by_name: approverName,
      approved_at: timestamp
    } : o));

    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Order Approved: ${target.order_number}`,
        message: `Approved by ${approverName}. Transferred to Dispatch Queue.`,
        event_type: 'ORDER_APPROVED',
        order_id: target.id
      });
    }
    setSelectedOrderForApproval(null);
  };

  const handleHoldOrder = (orderId: string, reasonId: string, remarks: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'HELD' } : o));
    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Order Placed on Hold: ${target.order_number}`,
        message: `Held due to credit/overdue policy check. Remarks: ${remarks || 'Check required'}`,
        event_type: 'ORDER_HELD',
        order_id: target.id
      });
    }
    setSelectedOrderForApproval(null);
  };

  const handleRejectOrder = (orderId: string, remarks: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'REJECTED' } : o));
    setSelectedOrderForApproval(null);
  };

  const handleConfirmDispatch = (orderId: string, dispatchData: any) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items?.map(item => {
          const match = dispatchData.items.find((di: any) => di.order_item_id === item.id);
          const dispatchQty = match ? match.dispatch_qty : item.pending_qty_pcs;
          const newDispatched = item.dispatched_qty_pcs + dispatchQty;
          return {
            ...item,
            dispatched_qty_pcs: newDispatched,
            pending_qty_pcs: item.total_qty_pcs - newDispatched
          };
        });

        const totalOrdered = o.total_qty_pcs;
        const totalDispatched = updatedItems?.reduce((acc, i) => acc + i.dispatched_qty_pcs, 0) || 0;
        const newStatus = totalDispatched >= totalOrdered ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED';

        return {
          ...o,
          status: newStatus,
          items: updatedItems
        };
      }
      return o;
    }));

    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Dispatch Confirmed & Pushed to Accounts: ${target.order_number}`,
        message: `Stock verified & allocated. Dispatched via ${dispatchData.vehicle_number}. Pushed to Accounts Console for Invoice Generation.`,
        event_type: 'DISPATCH_CONFIRMED',
        order_id: target.id
      });
    }
  };

  const handleGenerateInvoice = (orderId: string, invoiceNumber: string, invoiceAmount: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'BILLED',
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().substring(0, 10),
      invoice_amount: invoiceAmount
    } : o));
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: any) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    addNotification({
      title: `Order Cancelled`,
      message: `Sales order ${orderId} has been cancelled.`,
      event_type: 'ORDER_CANCELLED',
      order_id: orderId
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
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
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={handleDeleteOrder}
            onOpenReturnRequestModal={(o) => setSelectedOrderForReturnRequest(o)}
          />
        )}

        {currentTab === 'approvals' && (
          <OrdersPage 
            orders={globallyFilteredOrders.filter(o => o.status === 'SUBMITTED' || o.status === 'HELD')} 
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={handleDeleteOrder}
            onOpenReturnRequestModal={(o) => setSelectedOrderForReturnRequest(o)}
          />
        )}

        {currentTab === 'masters' && (
          <MastersPage initialTab="agencies" />
        )}

        {currentTab === 'zones' && (
          <MastersPage initialTab="zones" />
        )}

        {currentTab === 'dispatch' && (
          <DispatchPage 
            orders={globallyFilteredOrders} 
            onOpenDispatchModal={(o) => setSelectedOrderForDispatch(o)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenProcessReturnModal={(o) => setSelectedOrderForProcessReturn(o)}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsPage 
            orders={globallyFilteredOrders} 
            onGenerateInvoice={handleGenerateInvoice}
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
          />
        )}

        {currentTab === 'tracker' && (
          <OrderTrackerView
            orders={orders}
          />
        )}
      </div>

      {/* Global Modals */}
      <CreateOrderModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
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
        onClose={() => setIsUserMgmtOpen(false)}
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
