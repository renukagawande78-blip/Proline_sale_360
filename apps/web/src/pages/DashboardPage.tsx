import React from 'react';
import { ShoppingCart, Clock, CheckCircle2, AlertTriangle, Truck, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

interface DashboardPageProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: Order) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ orders, onOpenCreateOrder, onSelectOrder }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const fullName = currentUser?.full_name || 'User';

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'SUBMITTED').length;
  const approvedOrders = orders.filter(o => o.status === 'APPROVED').length;
  const heldOrders = orders.filter(o => o.status === 'HELD').length;
  const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED' || o.status === 'PARTIALLY_DISPATCHED').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="page-body">
      {/* Role Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: 12, border: '1px solid #334155' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Welcome back, {fullName}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: 4 }}>
            Role Context: <strong style={{ color: '#38bdf8' }}>{role.replace('_', ' ')}</strong> | Multi-Company B2B Order Console
          </p>
        </div>

        {role === 'SALES_PERSON' && (
          <button className="btn btn-primary" onClick={onOpenCreateOrder}>
            + Create New Agency Order
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">TOTAL ORDERS</span>
            <ShoppingCart size={20} color="#38bdf8" />
          </div>
          <div className="kpi-value">{totalOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Across all companies</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">PENDING APPROVAL</span>
            <Clock size={20} color="#fbbf24" />
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>{pendingOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Awaiting System Admin check</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">APPROVED ORDERS</span>
            <CheckCircle2 size={20} color="#34d399" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>{approvedOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ready for dispatch queue</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">HELD ORDERS</span>
            <AlertTriangle size={20} color="#fb7185" />
          </div>
          <div className="kpi-value" style={{ color: '#fb7185' }}>{heldOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Overdue / Credit limit hold</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">DISPATCHED</span>
            <Truck size={20} color="#c084fc" />
          </div>
          <div className="kpi-value" style={{ color: '#c084fc' }}>{dispatchedOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Full & partial dispatches</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">TOTAL VALUE</span>
            <TrendingUp size={20} color="#38bdf8" />
          </div>
          <div className="kpi-value">₹{totalRevenue.toLocaleString()}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gross order value</span>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="data-table-container">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent Operational Orders</h2>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Realtime Sync Active</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Segment</th>
              <th>Agency / Party</th>
              <th>Total PCS</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                <td>{order.order_date}</td>
                <td>{order.company_name}</td>
                <td>{order.agency_name}</td>
                <td><span style={{ fontWeight: 800, color: '#34d399' }}>{order.total_qty_pcs}</span></td>
                <td>₹{order.total_amount.toLocaleString()}</td>
                <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                <td>
                  <button 
                    className="btn btn-outline"
                    onClick={() => onSelectOrder(order)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
