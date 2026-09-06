import React, { useState } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight,
  PackageCheck,
  Truck,
  BarChart3,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOrderAccessPermission } from '../../lib/supabase';
import { Order } from '../../types';
import { HoldReasonDirectoryModal } from '../../components/HoldReasonDirectoryModal';

interface DashboardViewProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onNavigateToReports?: (reportName?: string) => void;
  onReleaseHold?: (orderId: string, remarks?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onOpenCreateOrder,
  onSelectOrder,
  onNavigateToReports,
  onReleaseHold
}) => {
  const { currentUser } = useAuth();
  const [isHoldDirectoryOpen, setIsHoldDirectoryOpen] = useState(false);
  const role = currentUser?.role_name || 'SALES_PERSON';
  const roleDashboard = role === 'SUPER_ADMIN' ? {
    title: 'Super Admin Control Dashboard', focus: 'Approvals, holds, exceptions, company-wide order flow'
  } : role === 'BILLING' || role === 'ACCOUNTS' ? {
    title: 'Billing Dashboard', focus: 'Stock-verified orders, invoice readiness, issued value and credit terms'
  } : role === 'DISPATCH_MANAGER' ? {
    title: 'Dispatch Dashboard', focus: 'Invoice-ready loads, vehicle allocation, delivery and POD hand-off'
  } : {
    title: 'Sales Admin Dashboard', focus: 'New orders, Super Admin approvals, stock checks and POD exceptions'
  };

  // Filter orders matching user's Brand Handle Scope
  const scopeOrders = orders.filter(o => {
    const accessPerm = getOrderAccessPermission(o, currentUser);
    return accessPerm.canView;
  });

  const totalOrdersCount = scopeOrders.length;
  const totalVolumePcs = scopeOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 1. Pending for Approval (New / Submitted orders awaiting sign-off)
  const pendingApprovalOrders = scopeOrders.filter(o => 
    o.status === 'SUBMITTED' || o.status === 'DRAFT' || o.status === 'WAIT_FOR_STOCK' || (o.status as string) === 'PENDING'
  );
  const pendingApprovalVolume = pendingApprovalOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 2. Pending for Billing (Approved orders waiting for B2B Invoice creation)
  const pendingBillingOrders = scopeOrders.filter(o => 
    o.status === 'APPROVED' || o.status === 'ACCOUNTS_APPROVED' || o.status === 'INVENTORY_AUDITED' || (o.status as string) === 'SALES_ADMIN_APPROVED'
  );
  const pendingBillingVolume = pendingBillingOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 3. Pending for Dispatch (Billed orders waiting for Vehicle loading & Dispatch)
  const pendingDispatchOrders = scopeOrders.filter(o => 
    o.status === 'BILLED' || o.status === 'DISPATCH_PENDING' || o.status === 'READY_FOR_PICKUP' || o.status === 'READY_FOR_SELF_PICKUP' || o.status === 'PARTIALLY_DISPATCHED'
  );
  const pendingDispatchVolume = pendingDispatchOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 4. Secondary Pipeline Statuses
  const heldOrders = scopeOrders.filter(o => o.status === 'HELD');
  const completedOrders = scopeOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
  const completedVolumePcs = completedOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  return (
    <div className="page-body">
      {/* Header Bar */}
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            {roleDashboard.title}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {roleDashboard.focus} | Data Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All Companies' : currentUser?.company_handle}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsHoldDirectoryOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#f59e0b', color: '#fbbf24', fontWeight: 700 }}
            title="Open Hold Reason Directory & Orders on Hold Review"
          >
            <AlertTriangle size={16} /> Hold Reason Directory {heldOrders.length > 0 ? `(${heldOrders.length})` : ''}
          </button>

          {onNavigateToReports && (
            <button 
              className="btn btn-outline" 
              onClick={() => onNavigateToReports('Completed Orders Report')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <BarChart3 size={16} /> All Reports
            </button>
          )}
          <button className="btn btn-primary" onClick={onOpenCreateOrder}>
            <Plus size={16} /> Create Agency Order
          </button>
        </div>
      </div>

      {/* 4-Stage Operational Pipeline KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* KPI 1: TOTAL ORDERS */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title" style={{ color: '#38bdf8', fontWeight: 700 }}>TOTAL ORDERS</div>
              <div className="kpi-value">{totalOrdersCount}</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#38bdf8' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#94a3b8' }}>
            <ArrowUpRight size={14} style={{ color: '#38bdf8' }} /> {totalVolumePcs.toLocaleString()} Total PCS in scope
          </div>
        </div>

        {/* KPI 2: PENDING FOR APPROVAL */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title" style={{ color: '#818cf8', fontWeight: 700 }}>PENDING FOR APPROVAL</div>
              <div className="kpi-value" style={{ color: '#818cf8' }}>{pendingApprovalOrders.length}</div>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#6366f1' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#94a3b8' }}>
            {pendingApprovalVolume.toLocaleString()} PCS awaiting review
          </div>
        </div>

        {/* KPI 3: PENDING FOR BILLING */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title" style={{ color: '#fbbf24', fontWeight: 700 }}>PENDING FOR BILLING</div>
              <div className="kpi-value" style={{ color: '#fbbf24' }}>{pendingBillingOrders.length}</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#f59e0b' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#94a3b8' }}>
            {pendingBillingVolume.toLocaleString()} PCS approved & awaiting invoice
          </div>
        </div>

        {/* KPI 4: PENDING FOR DISPATCH */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title" style={{ color: '#c084fc', fontWeight: 700 }}>PENDING FOR DISPATCH</div>
              <div className="kpi-value" style={{ color: '#c084fc' }}>{pendingDispatchOrders.length}</div>
            </div>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#a855f7' }}>
              <PackageCheck size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#94a3b8' }}>
            {pendingDispatchVolume.toLocaleString()} PCS billed & ready for vehicle
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="dashboard-ops-grid">
        {/* Recent Orders Stream */}
        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Recent B2B Order Stream</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Showing latest {scopeOrders.length} orders</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Company</th>
                <th>Agency / Party</th>
                <th>Billing Status</th>
                <th>Billing Qty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {scopeOrders.slice(0, 7).map(order => {
                const billingQty = (order.billing_total_qty != null && order.billing_total_qty > 0)
                  ? order.billing_total_qty
                  : (order.items || []).reduce((sum, it) => sum + (it.issued_qty_pcs || it.total_qty_pcs || 0), 0)
                  || order.total_qty_pcs
                  || 0;

                return (
                  <tr key={order.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                    <td>{order.company_name}</td>
                    <td>{order.agency_name}</td>
                    <td>
                      {order.invoice_number ? (
                        <div>
                          <span style={{ color: '#34d399', fontWeight: 800 }}>✅ BILLING DONE</span>
                          <div style={{ color: '#fbbf24', fontSize: '0.7rem', marginTop: 2 }}>{order.invoice_number}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>⏳ BILLING PENDING</span>
                      )}
                    </td>
                    <td><strong style={{ color: '#38bdf8' }}>{order.invoice_number ? `${billingQty.toLocaleString()} PCS` : '—'}</strong></td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, borderColor: '#38bdf8', color: '#38bdf8' }}
                        onClick={() => onSelectOrder(order)}
                        title="View Order Details"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
      {/* Hold Reason Directory & Governance Modal */}
      <HoldReasonDirectoryModal
        isOpen={isHoldDirectoryOpen}
        onClose={() => setIsHoldDirectoryOpen(false)}
        orders={orders}
        onSelectOrder={onSelectOrder}
        onReleaseHold={onReleaseHold}
      />
    </div>
  );
};
