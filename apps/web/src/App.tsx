import React, { useState } from 'react';
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
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderApprovalModal } from './components/OrderApprovalModal';
import { DispatchModal } from './components/DispatchModal';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { INITIAL_ORDERS } from './lib/supabase';
import { Order } from './types';

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

        {(currentTab === 'approvals' || currentTab === 'masters') && (
          <OrdersPage 
            orders={orders.filter(o => o.status === 'SUBMITTED' || o.status === 'HELD')} 
            onOpenCreateOrder={() => setIsCreateOpen(true)}
            onSelectOrderForApproval={(o) => setSelectedOrderForApproval(o)}
            onViewInvoice={(o) => setSelectedOrderForInvoice(o)}
          />
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
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
};
