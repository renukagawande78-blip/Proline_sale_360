import React from 'react';
import { AlertTriangle, CheckCircle2, FileCheck2, Truck } from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin, isCompanyAllowedForUser } from '../../lib/supabase';

interface PODQueueViewProps {
  orders: Order[];
  onVerifyPOD: (order: Order) => void;
  onResolveQuery: (orderId: string, action: 'CREATE_GRN' | 'REATTEMPT_DELIVERY') => void;
}

export const PODQueueView: React.FC<PODQueueViewProps> = ({ orders, onVerifyPOD, onResolveQuery }) => {
  const { currentUser } = useAuth();
  const canViewAll = checkIsSuperAdmin(currentUser);
  const scopedOrders = orders.filter(order => canViewAll || isCompanyAllowedForUser(order.company_name, currentUser?.company_handle));
  const pending = scopedOrders.filter(order => ['DISPATCHED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(order.status) && !order.pod_status);
  const verified = scopedOrders.filter(order => order.pod_status === 'CLEAN');
  const exceptions = scopedOrders.filter(order => order.pod_status === 'ISSUE_RAISED' || order.status === 'POD_ISSUE_RAISED');

  const renderTable = (rows: Order[], type: 'PENDING' | 'VERIFIED' | 'ISSUE') => (
    <div className="data-table-container" style={{ marginBottom: '1.25rem' }}>
      <table className="data-table">
        <thead><tr><th>Order No.</th><th>Agency</th><th>Invoice</th><th>Driver / Vehicle</th>{type === 'ISSUE' && <th>Query Raised By</th>}<th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={type === 'ISSUE' ? 7 : 6} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>No records</td></tr> : rows.map(order => (
            <tr key={order.id}>
              <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
              <td>{order.agency_name}</td>
              <td><span style={{ color: '#fbbf24' }}>{order.invoice_number || '—'}</span></td>
              <td>{order.driver_name || '—'}<div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{order.vehicle_number || '—'}</div></td>
              {type === 'ISSUE' && (
                <td>
                  <strong style={{ color: '#38bdf8' }}>{order.pod_query_raised_by || order.accounts_approval_requested_by || 'Sales Admin'}</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 2 }}>{order.pod_query_raised_at || order.accounts_approval_requested_at || 'Recently'}</div>
                </td>
              )}
              <td>
                <strong style={{ color: type === 'PENDING' ? '#fbbf24' : type === 'VERIFIED' ? '#34d399' : '#fb7185' }}>
                  {type === 'PENDING' ? 'Awaiting POD' : type === 'VERIFIED' ? 'POD Verified' : `Issue: ${order.pod_issue_type || 'Raised'}`}
                </strong>
                {type === 'ISSUE' && <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 2 }}>{order.pod_issue_details}</div>}
              </td>
              <td>
                {type === 'PENDING' ? (
                  <button className="btn btn-success" onClick={() => onVerifyPOD(order)}><FileCheck2 size={14} /> Verify POD</button>
                ) : type === 'ISSUE' && canViewAll && !order.grn_workflow_status && !order.reattempt_delivery ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-success" onClick={() => onResolveQuery(order.id, 'CREATE_GRN')} style={{ fontSize: '0.72rem' }}>
                      Create GRN
                    </button>
                    <button className="btn btn-warning" onClick={() => onResolveQuery(order.id, 'REATTEMPT_DELIVERY')} style={{ fontSize: '0.72rem' }}>
                      <Truck size={13} /> Reattempt Delivery
                    </button>
                  </div>
                ) : order.grn_workflow_status === 'PENDING_SALES_ADMIN' ? (
                  <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 800 }}>GRN sent to Sales Admin</span>
                ) : order.reattempt_delivery ? (
                  <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 800 }}>Reattempt sent to Stage 3</span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return <div className="page-body">
    <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>POD Verification Queue</h1>
    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Verify delivered orders and monitor POD exceptions.</p>
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <span style={{ padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontWeight: 800 }}><Truck size={14} /> Pending: {pending.length}</span>
      <span style={{ padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(52,211,153,.12)', color: '#34d399', fontWeight: 800 }}><CheckCircle2 size={14} /> Verified: {verified.length}</span>
      <span style={{ padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(244,63,94,.12)', color: '#fb7185', fontWeight: 800 }}><AlertTriangle size={14} /> Issues: {exceptions.length}</span>
    </div>
    <h2 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '0.65rem' }}>Pending POD Verification</h2>
    {renderTable(pending, 'PENDING')}
    <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', color: '#fb7185', marginBottom: '0.25rem' }}>POD Queries Raised by Sales Admin</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Shortage, damaged goods, and good-return queries are tracked separately here.</p>
      {renderTable(exceptions, 'ISSUE')}
    </div>
    <h2 style={{ fontSize: '1rem', color: '#34d399', marginBottom: '0.65rem' }}>Verified POD</h2>
    {renderTable(verified, 'VERIFIED')}
  </div>;
};
