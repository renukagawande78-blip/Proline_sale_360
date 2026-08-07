import React from 'react';
import { Receipt, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order } from '../types';

interface AccountsPageProps {
  orders: Order[];
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ orders }) => {
  const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED' || o.status === 'PARTIALLY_DISPATCHED');

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Accounts & Billing Console</h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Invoicing and payment settlement based on actual warehouse dispatches</p>
      </div>

      <div className="data-table-container">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Dispatched Invoicing Queue</h2>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Billed on Dispatched Qty</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Agency / B2B Party</th>
              <th>Order Amount (₹)</th>
              <th>Dispatched Value (₹)</th>
              <th>Billing Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {dispatchedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No confirmed dispatches pending billing yet. Process a dispatch to trigger billing.
                </td>
              </tr>
            ) : (
              dispatchedOrders.map(order => (
                <tr key={order.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                  <td>{order.agency_name}</td>
                  <td>₹{order.total_amount.toLocaleString()}</td>
                  <td><strong style={{ color: '#34d399' }}>₹{order.total_amount.toLocaleString()}</strong></td>
                  <td><span className="status-badge status-SUBMITTED">BILLING PENDING</span></td>
                  <td>
                    <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      <Receipt size={14} /> Generate Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
