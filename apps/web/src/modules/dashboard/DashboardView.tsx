import React from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isCompanyAllowedForUser, getOrderAccessPermission } from '../../lib/supabase';
import { Order } from '../../types';

interface DashboardViewProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onOpenCreateOrder,
  onSelectOrder
}) => {
  const { currentUser } = useAuth();

  // Filter orders matching user's Brand Handle Scope (including cross-brand item read-only match)
  const scopeOrders = orders.filter(o => {
    const accessPerm = getOrderAccessPermission(o, currentUser);
    return accessPerm.canView;
  });

  const totalOrdersCount = scopeOrders.length;
  const totalGrossAmount = scopeOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalVolumePcs = scopeOrders.reduce((sum, o) => sum + o.total_qty_pcs, 0);

  const approvedOrders = scopeOrders.filter(o => o.status === 'APPROVED');
  const heldOrders = scopeOrders.filter(o => o.status === 'HELD');
  const pendingOrders = scopeOrders.filter(o => o.status === 'SUBMITTED' || o.status === 'DRAFT');

  return (
    <div className="page-body">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Multi-Tenant Sales Operations Executive Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time B2B Order Flow, Hold Reason Tracking & Operational Control Center | Data Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All 13 Brands' : currentUser?.company_handle}</strong>
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateOrder}>
          <Plus size={16} /> Create Agency Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* KPI 1: Gross Sales */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">TOTAL ORDER VALUE (GROSS)</div>
              <div className="kpi-value">₹{totalGrossAmount.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#38bdf8' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#34d399' }}>
            <ArrowUpRight size={14} /> +12.4% vs last period ({totalOrdersCount} Total Orders)
          </div>
        </div>

        {/* KPI 2: Approved Orders */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">APPROVED FOR DISPATCH</div>
              <div className="kpi-value">{approvedOrders.length}</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="kpi-subtext">
            ₹{approvedOrders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()} ready for billing
          </div>
        </div>

        {/* KPI 3: Held Orders */}
        <div className="kpi-card" style={{ borderColor: heldOrders.length > 0 ? '#f59e0b' : 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">ORDERS ON HOLD</div>
              <div className="kpi-value" style={{ color: '#fbbf24' }}>{heldOrders.length}</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#f59e0b' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-subtext" style={{ color: '#fbbf24' }}>
            Credit limit / Overdue invoice review
          </div>
        </div>

        {/* KPI 4: Pending Review */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">PENDING APPROVAL</div>
              <div className="kpi-value">{pendingOrders.length}</div>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: 8, color: '#6366f1' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-subtext">
            Awaiting System Admin / ASM Verification
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
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
                <th>Total Volume</th>
                <th>Gross Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {scopeOrders.slice(0, 7).map(order => (
                <tr key={order.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                  <td>{order.company_name}</td>
                  <td>{order.agency_name}</td>
                  <td>{order.total_box_qty} Box / {order.total_loose_pcs} Pcs</td>
                  <td><strong style={{ color: '#34d399' }}>₹{order.total_amount.toLocaleString()}</strong></td>
                  <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  <td>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => onSelectOrder(order)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hold Reasons Operational Monitor */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#f59e0b" /> Hold Reason Directory
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: 8, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fbbf24' }}>CREDIT_LIMIT_EXCEEDED</div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>Agency credit line has breached allowed threshold.</p>
            </div>

            <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f87171' }}>OVERDUE_PAYMENT_PENDING</div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>Invoices pending settlement beyond credit days limit.</p>
            </div>

            <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: 8, borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8' }}>STOCK_OUT_OFFLINE</div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>Warehouse temporary stock out for specific SKU item.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
