import React, { useState } from 'react';
import { Search, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_COMPANIES } from '../lib/supabase';
import { Order } from '../types';

interface OrdersPageProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrderForApproval: (order: Order) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  onOpenCreateOrder,
  onSelectOrderForApproval
}) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.agency_name && o.agency_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCompany = selectedCompany === 'ALL' || o.company_id === selectedCompany;
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sales Orders Console</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>View and manage multi-company B2B sales orders</p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateOrder}>
          <Plus size={16} /> Create Agency Order
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.5rem 0.75rem', gap: '0.5rem' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by order number or agency..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <select 
            value={selectedCompany} 
            onChange={e => setSelectedCompany(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Companies / Brands</option>
            {MOCK_COMPANIES.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>

        <div>
          <select 
            value={selectedStatus} 
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="HELD">HELD</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Order Date</th>
              <th>Company</th>
              <th>Agency / Party</th>
              <th>Boxes / Loose</th>
              <th>Total PCS</th>
              <th>Order Total (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                <td>{order.order_date}</td>
                <td>{order.company_name}</td>
                <td>{order.agency_name}</td>
                <td>{order.total_box_qty} Boxes / {order.total_loose_pcs} Loose</td>
                <td><span style={{ fontWeight: 800, color: '#34d399' }}>{order.total_qty_pcs}</span></td>
                <td>₹{order.total_amount.toLocaleString()}</td>
                <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                <td>
                  {(role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN') && (order.status === 'SUBMITTED' || order.status === 'HELD') ? (
                    <button 
                      className="btn btn-warning"
                      onClick={() => onSelectOrderForApproval(order)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <ShieldCheck size={14} /> Account Check
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline"
                      onClick={() => onSelectOrderForApproval(order)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      View Details
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
