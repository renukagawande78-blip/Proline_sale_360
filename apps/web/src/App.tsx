import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { DispatchPage } from './pages/DispatchPage';
import { AccountsPage } from './pages/AccountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { MastersPage } from './pages/MastersPage';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderApprovalModal } from './components/OrderApprovalModal';
import { DispatchModal } from './components/DispatchModal';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { UserManagementModal } from './components/UserManagementModal';
import { INITIAL_ORDERS } from './lib/supabase';
import { Order } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorText: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorText: error?.toString() || 'Unknown Error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Proline OMS ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2.5rem', color: '#fb7185', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>⚠️ System Console Component Exception</h2>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>The console encountered a runtime error during component rendering:</p>
          <pre style={{ background: '#1e293b', border: '1px solid #334155', padding: '1.25rem', borderRadius: 10, marginTop: '1.25rem', color: '#38bdf8', fontSize: '0.9rem', overflowX: 'auto' }}>
            {this.state.errorText}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
          >
            Reload Proline OMS Console
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<Order | null>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  const { addNotification } = useNotifications();

  // If user is not logged in, render the Login Screen!
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handlers
  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    addNotification({
      title: `New Order ${newOrder.order_number} (${newOrder.status})`,
      message: `${newOrder.agency_name} - Total: ₹${newOrder.total_amount.toLocaleString()}`,
      event_type: newOrder.status === 'SUBMITTED' ? 'ORDER_SUBMITTED' : 'ORDER_DRAFT',
      order_id: newOrder.id
    });
    // Open Tax Invoice modal immediately for the Agency!
    setSelectedOrderForInvoice(newOrder);
  };

  const handleApproveOrder = (orderId: string, remarks: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'APPROVED', remarks } : o));
    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Order Approved: ${target.order_number}`,
        message: `${target.agency_name} approved by System Admin. Sent to Dispatch Queue.`,
        event_type: 'ORDER_APPROVED',
        order_id: target.id
      });
    }
    setSelectedOrderForApproval(null);
  };

  const handleHoldOrder = (orderId: string, holdReasonId: string, remarks: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'HELD', hold_remarks: remarks } : o));
    const target = orders.find(o => o.id === orderId);
    if (target) {
      addNotification({
        title: `Order Held: ${target.order_number}`,
        message: `Account check hold applied for ${target.agency_name}.`,
        event_type: 'ORDER_HELD',
        order_id: target.id
      });
    }
    setSelectedOrderForApproval(null);
  };

  const handleRejectOrder = (orderId: string, remarks: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'REJECTED', remarks } : o));
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
        title: `Dispatch Confirmed: ${target.order_number}`,
        message: `Dispatch issued via ${dispatchData.vehicle_number}. Billed on actual dispatches.`,
        event_type: 'DISPATCH_CONFIRMED',
        order_id: target.id
      });
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-content">
        <Header 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenUserManagement={() => setIsUserMgmtOpen(true)}
        />

        {currentTab === 'dashboard' && (
          <DashboardPage 
            orders={orders} 
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrder={(o) => setSelectedOrderForApproval(o)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersPage 
            orders={orders} 
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
          />
        )}

        {currentTab === 'approvals' && (
          <OrdersPage 
            orders={orders.filter(o => o.status === 'SUBMITTED' || o.status === 'HELD')} 
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
          />
        )}

        {currentTab === 'masters' && (
          <MastersPage />
        )}

        {currentTab === 'dispatch' && (
          <DispatchPage 
            orders={orders} 
            onOpenDispatchModal={(o) => setSelectedOrderForDispatch(o)}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsPage orders={orders} />
        )}

        {currentTab === 'reports' && (
          <ReportsPage orders={orders} />
        )}
      </div>

      {/* Modals & Drawers */}
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
      />

      <DispatchModal 
        order={selectedOrderForDispatch}
        isOpen={!!selectedOrderForDispatch}
        onClose={() => setSelectedOrderForDispatch(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <UserManagementModal 
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
      />

      <OrderInvoiceModal 
        order={selectedOrderForInvoice}
        isOpen={!!selectedOrderForInvoice}
        onClose={() => setSelectedOrderForInvoice(null)}
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
