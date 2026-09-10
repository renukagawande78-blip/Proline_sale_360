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
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOrderAccessPermission, getOrderSegment, resolveSegmentForUser } from '../../lib/supabase';
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
  
  // Initialize segment based on user profile or default to FMCG
  const userAssignedSegment = resolveSegmentForUser(currentUser);
  const initialSegment = userAssignedSegment === 'FMCD' ? 'FMCD' : 'FMCG';
  const [activeSegment, setActiveSegment] = useState<'FMCG' | 'FMCD' | 'ALL'>(initialSegment);

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

  // Split into FMCG and FMCD
  const fmcgOrders = scopeOrders.filter(o => getOrderSegment(o) === 'FMCG');
  const fmcdOrders = scopeOrders.filter(o => getOrderSegment(o) === 'FMCD');

  // Currently displayed orders based on active tab
  const displayedOrders = activeSegment === 'ALL'
    ? scopeOrders
    : activeSegment === 'FMCD'
      ? fmcdOrders
      : fmcgOrders;

  const totalOrdersCount = displayedOrders.length;
  const totalVolumePcs = displayedOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 1. Pending for Approval (New / Submitted orders awaiting sign-off)
  const pendingApprovalOrders = displayedOrders.filter(o => 
    o.status === 'SUBMITTED' || o.status === 'DRAFT' || o.status === 'WAIT_FOR_STOCK' || (o.status as string) === 'PENDING'
  );
  const pendingApprovalVolume = pendingApprovalOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 2. Pending for Billing (Approved orders waiting for B2B Invoice creation)
  const pendingBillingOrders = displayedOrders.filter(o => 
    o.status === 'APPROVED' || o.status === 'ACCOUNTS_APPROVED' || o.status === 'INVENTORY_AUDITED' || (o.status as string) === 'SALES_ADMIN_APPROVED'
  );
  const pendingBillingVolume = pendingBillingOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 3. Pending for Dispatch (Billed orders waiting for Vehicle loading & Dispatch)
  const pendingDispatchOrders = displayedOrders.filter(o => 
    o.status === 'BILLED' || o.status === 'DISPATCH_PENDING' || o.status === 'READY_FOR_PICKUP' || o.status === 'READY_FOR_SELF_PICKUP' || o.status === 'PARTIALLY_DISPATCHED'
  );
  const pendingDispatchVolume = pendingDispatchOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);

  // 4. Secondary Pipeline Statuses
  const heldOrders = displayedOrders.filter(o => o.status === 'HELD');
  const completedOrders = displayedOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
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

      {/* 2-Segment Tab Control: Tab 1 is FMCG, Tab 2 is FMCD (plus ALL view) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        margin: '1.25rem 0 1.25rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
        border: '1px solid #334155',
        borderRadius: 14,
        padding: '0.45rem 0.65rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Tab 1: FMCG */}
          <button
            type="button"
            data-testid="tab-segment-fmcg"
            onClick={() => setActiveSegment('FMCG')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.55rem 1.15rem',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeSegment === 'FMCG' ? '1px solid #10b981' : '1px solid transparent',
              background: activeSegment === 'FMCG' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))' : 'transparent',
              color: activeSegment === 'FMCG' ? '#34d399' : '#94a3b8',
              boxShadow: activeSegment === 'FMCG' ? '0 0 16px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🍪 FMCG (Food & Consumer Goods)</span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '0.15rem 0.55rem',
              borderRadius: 12,
              background: activeSegment === 'FMCG' ? '#10b981' : 'rgba(148, 163, 184, 0.15)',
              color: activeSegment === 'FMCG' ? '#064e3b' : '#94a3b8'
            }}>
              {fmcgOrders.length}
            </span>
          </button>

          {/* Tab 2: FMCD */}
          <button
            type="button"
            data-testid="tab-segment-fmcd"
            onClick={() => setActiveSegment('FMCD')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.55rem 1.15rem',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeSegment === 'FMCD' ? '1px solid #f59e0b' : '1px solid transparent',
              background: activeSegment === 'FMCD' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))' : 'transparent',
              color: activeSegment === 'FMCD' ? '#fbbf24' : '#94a3b8',
              boxShadow: activeSegment === 'FMCD' ? '0 0 16px rgba(245, 158, 11, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>⚡ FMCD (Appliances & Durables)</span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '0.15rem 0.55rem',
              borderRadius: 12,
              background: activeSegment === 'FMCD' ? '#f59e0b' : 'rgba(148, 163, 184, 0.15)',
              color: activeSegment === 'FMCD' ? '#78350f' : '#94a3b8'
            }}>
              {fmcdOrders.length}
            </span>
          </button>

          {/* Tab 3: ALL DATA */}
          <button
            type="button"
            data-testid="tab-segment-all"
            onClick={() => setActiveSegment('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.55rem 1rem',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeSegment === 'ALL' ? '1px solid #38bdf8' : '1px solid transparent',
              background: activeSegment === 'ALL' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.15))' : 'transparent',
              color: activeSegment === 'ALL' ? '#38bdf8' : '#94a3b8',
              boxShadow: activeSegment === 'ALL' ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🌐 All Segments</span>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '0.15rem 0.55rem',
              borderRadius: 12,
              background: activeSegment === 'ALL' ? '#38bdf8' : 'rgba(148, 163, 184, 0.15)',
              color: activeSegment === 'ALL' ? '#0c4a6e' : '#94a3b8'
            }}>
              {scopeOrders.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span>Active Pipeline:</span>
          <span style={{ 
            fontWeight: 800,
            padding: '0.2rem 0.6rem',
            borderRadius: 6,
            background: activeSegment === 'FMCD' ? 'rgba(245, 158, 11, 0.15)' : activeSegment === 'FMCG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: activeSegment === 'FMCD' ? '1px solid rgba(245, 158, 11, 0.3)' : activeSegment === 'FMCG' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
            color: activeSegment === 'FMCD' ? '#fbbf24' : activeSegment === 'FMCG' ? '#34d399' : '#38bdf8'
          }}>
            {activeSegment === 'ALL' ? `Combined (${displayedOrders.length} Orders)` : `${activeSegment} (${displayedOrders.length} Orders)`}
          </span>
        </div>
      </div>

      {/* 4-Stage Operational Pipeline KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* KPI 1: TOTAL ORDERS */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title" style={{ color: '#38bdf8', fontWeight: 700 }}>
                {activeSegment === 'ALL' ? 'TOTAL ORDERS' : `TOTAL ${activeSegment} ORDERS`}
              </div>
              <div className="kpi-value">{totalOrdersCount}</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#38bdf8' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#94a3b8' }}>
            <ArrowUpRight size={14} style={{ color: '#38bdf8' }} /> {totalVolumePcs.toLocaleString()} Total PCS in {activeSegment === 'ALL' ? 'pipeline' : activeSegment}
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
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Recent B2B Order Stream
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 6,
                  background: activeSegment === 'FMCD' ? 'rgba(245, 158, 11, 0.15)' : activeSegment === 'FMCG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: activeSegment === 'FMCD' ? '1px solid rgba(245, 158, 11, 0.3)' : activeSegment === 'FMCG' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                  color: activeSegment === 'FMCD' ? '#fbbf24' : activeSegment === 'FMCG' ? '#34d399' : '#38bdf8'
                }}>
                  {activeSegment}
                </span>
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Showing {displayedOrders.length} orders</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Company / Brand</th>
                <th>Segment</th>
                <th>Agency / Party</th>
                <th>Billing Status</th>
                <th>Billing Qty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                      No orders found in {activeSegment} segment
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                      Orders created under {activeSegment} brands will appear here in real-time.
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={onOpenCreateOrder}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                    >
                      <Plus size={14} /> Create {activeSegment === 'ALL' ? '' : activeSegment} Order
                    </button>
                  </td>
                </tr>
              ) : (
                displayedOrders.slice(0, 10).map(order => {
                  const seg = getOrderSegment(order);
                  const billingQty = (order.billing_total_qty != null && order.billing_total_qty > 0)
                    ? order.billing_total_qty
                    : (order.items || []).reduce((sum, it) => sum + (it.issued_qty_pcs || it.total_qty_pcs || 0), 0)
                    || order.total_qty_pcs
                    || 0;

                  return (
                    <tr key={order.id}>
                      <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{order.company_name}</div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.675rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 4,
                          background: seg === 'FMCD' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: seg === 'FMCD' ? '#fbbf24' : '#34d399',
                          border: seg === 'FMCD' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {seg}
                        </span>
                      </td>
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
                })
              )}
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
