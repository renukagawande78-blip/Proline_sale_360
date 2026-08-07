import React from 'react';
import { Truck, CheckCircle, Clock } from 'lucide-react';
import { Order } from '../types';

interface DispatchPageProps {
  orders: Order[];
  onOpenDispatchModal: (order: Order) => void;
}

export const DispatchPage: React.FC<DispatchPageProps> = ({ orders, onOpenDispatchModal }) => {
  const approvedOrders = orders.filter(o => o.status === 'APPROVED' || o.status === 'PARTIALLY_DISPATCHED');

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dispatch Operations Management</h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Queue for approved orders ready for full or partial warehouse dispatch</p>
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
            {approvedOrders.map(order => {
              const totalOrdered = order.total_qty_pcs;
              const totalDispatched = order.items?.reduce((acc, i) => acc + (i.dispatched_qty_pcs || 0), 0) || 0;
              const totalPending = totalOrdered - totalDispatched;

              return (
                <tr key={order.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                  <td>{order.order_date}</td>
                  <td>{order.agency_name}</td>
                  <td>{order.company_name}</td>
                  <td>{totalOrdered}</td>
                  <td><span style={{ color: '#34d399', fontWeight: 700 }}>{totalDispatched}</span></td>
                  <td><span style={{ color: '#fbbf24', fontWeight: 800 }}>{totalPending}</span></td>
                  <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  <td>
                    <button 
                      className="btn btn-primary"
                      onClick={() => onOpenDispatchModal(order)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <Truck size={14} /> Process Dispatch
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
