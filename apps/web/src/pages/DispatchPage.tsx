import React from 'react';
import { Truck, CheckCircle, Clock } from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { isCompanyAllowedForUser } from '../lib/supabase';

interface DispatchPageProps {
  orders: Order[];
  onOpenDispatchModal: (order: Order) => void;
}

export const DispatchPage: React.FC<DispatchPageProps> = ({ orders, onOpenDispatchModal }) => {
  const { currentUser } = useAuth();

  const approvedOrders = orders.filter(o => 
    (o.status === 'APPROVED' || o.status === 'PARTIALLY_DISPATCHED') &&
    isCompanyAllowedForUser(o.company_name, currentUser?.company_handle)
  );

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dispatch Operations Management</h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Queue for approved orders ready for full or partial warehouse dispatch | Brand Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All 13 Brands' : currentUser?.company_handle}</strong>
        </p>
      </div>

      <div className="data-table-container">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Ready for Dispatch ({approvedOrders.length})</h2>
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>Approved Queue</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Agency / Party</th>
              <th>Segment</th>
              <th>Ordered PCS</th>
              <th>Dispatched PCS</th>
              <th>Pending PCS</th>
              <th>Dispatch Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {approvedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No orders currently in dispatch queue for your brand scope.
                </td>
              </tr>
            ) : (
              approvedOrders.map(order => {
                const totalOrdered = order.total_qty_pcs || 0;
                const totalDispatched = order.items?.reduce((acc, i) => acc + (i.dispatched_qty_pcs || 0), 0) || 0;
                const pendingPcs = totalOrdered - totalDispatched;

                return (
                  <tr key={order.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                    <td>{order.order_date}</td>
                    <td>{order.agency_name}</td>
                    <td>{order.company_name}</td>
                    <td><span style={{ fontWeight: 800, color: '#f8fafc' }}>{totalOrdered}</span></td>
                    <td><span style={{ fontWeight: 800, color: '#34d399' }}>{totalDispatched}</span></td>
                    <td><span style={{ fontWeight: 800, color: pendingPcs > 0 ? '#fbbf24' : '#94a3b8' }}>{pendingPcs}</span></td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                    <td>
                      <button 
                        className="btn btn-primary"
                        onClick={() => onOpenDispatchModal(order)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <Truck size={14} /> Dispatch
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
  );
};
