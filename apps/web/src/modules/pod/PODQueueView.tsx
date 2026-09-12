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
  const { currentUser, hasPermission } = useAuth();
  const isSuperAdminUser = checkIsSuperAdmin(currentUser);
  const isBillingUser = currentUser?.role_name === 'BILLING' || currentUser?.role_name === 'ACCOUNTS';
  const isDispatchManager = currentUser?.role_name === 'DISPATCH_MANAGER';
  const isSalesAdminUser = currentUser?.role_name === 'SALES_ADMIN';
  // canVerifyPOD: only BILLING, ACCOUNTS, SUPER_ADMIN, or those with explicit pod_verification permission
  const canVerifyPOD = isSuperAdminUser || isBillingUser || hasPermission('pod_verification');

  // Scope: Super Admin, Billing, Dispatch see all orders; others filtered by brand
  const canViewAll = isSuperAdminUser || isBillingUser || isDispatchManager;
  const scopedOrders = orders.filter(order =>
    canViewAll || isCompanyAllowedForUser(order.company_name, currentUser?.company_handle)
  );

  // Verified: pod marked clean, or order completed/delivered (with or without pod_status)
  const verified = scopedOrders.filter(order =>
    order.pod_status === 'CLEAN' ||
    order.status === 'COMPLETED' ||
    order.status === 'DELIVERED'
  );
  const exceptions = scopedOrders.filter(order => order.pod_status === 'ISSUE_RAISED' || order.status === 'POD_ISSUE_RAISED');
  const pending = scopedOrders.filter(order =>
    ['DISPATCHED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(order.status) &&
    order.status !== 'COMPLETED' &&
    order.status !== 'DELIVERED' &&
    order.pod_status !== 'CLEAN' &&
    order.pod_status !== 'ISSUE_RAISED' &&
    order.status !== 'POD_ISSUE_RAISED'
  );

  const renderTable = (rows: Order[], type: 'PENDING' | 'VERIFIED' | 'ISSUE') => (
    <div className="data-table-container" style={{ marginBottom: '1.25rem' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Order No.</th>
            <th>Agency</th>
            <th>Bill No.</th>
            <th>Driver / Vehicle</th>
            {type === 'ISSUE' && <th>Query Raised By (Billing)</th>}
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={type === 'ISSUE' ? 7 : 6} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                No records
              </td>
            </tr>
          ) : (
            rows.map(order => (
              <tr key={order.id}>
                <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                <td>{order.agency_name}</td>
                <td><span style={{ color: '#fbbf24' }}>{order.invoice_number || '—'}</span></td>
                <td>
                  {order.driver_name || '—'}
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{order.vehicle_number || '—'}</div>
                </td>
                {type === 'ISSUE' && (
                  <td>
                    <strong style={{ color: '#38bdf8' }}>{order.pod_query_raised_by || order.accounts_approval_requested_by || 'Billing Executive'}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 2 }}>{order.pod_query_raised_at || order.accounts_approval_requested_at || 'Recently'}</div>
                  </td>
                )}
                <td>
                  <strong style={{ color: type === 'PENDING' ? '#fbbf24' : type === 'VERIFIED' ? '#34d399' : '#fb7185' }}>
                    {type === 'PENDING' ? 'Awaiting POD' : type === 'VERIFIED' ? 'POD Verified' : `Issue: ${order.pod_issue_type || 'Raised'}`}
                  </strong>
                  {type === 'ISSUE' && <div style={{ color: '#f8fafc', fontSize: '0.72rem', marginTop: 2, background: 'rgba(244,63,94,0.1)', padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid rgba(244,63,94,0.2)' }}>💬 Remarks: {order.pod_issue_details || 'Delivery exception reported.'}</div>}
                </td>
                <td>
                  {type === 'PENDING' ? (
                    canVerifyPOD ? (
                      <button className="btn btn-success" onClick={() => onVerifyPOD(order)}>
                        <FileCheck2 size={14} /> Verify POD
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                        —
                      </span>
                    )
                  ) : type === 'ISSUE' ? (
                    isSalesAdminUser && !order.grn_workflow_status && !order.reattempt_delivery ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-success" onClick={() => onResolveQuery(order.id, 'CREATE_GRN')} style={{ fontSize: '0.72rem' }}>
                          Create GRN
                        </button>
                        <button className="btn btn-warning" onClick={() => onResolveQuery(order.id, 'REATTEMPT_DELIVERY')} style={{ fontSize: '0.72rem' }}>
                          <Truck size={13} /> Reattempt Delivery
                        </button>
                      </div>
                    ) : isSuperAdminUser ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>
                        👁️ View Only (Routed to Sales Admin)
                      </span>
                    ) : order.grn_workflow_status === 'PENDING_SALES_ADMIN' ? (
                      <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 800 }}>GRN in Progress</span>
                    ) : order.reattempt_delivery ? (
                      <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 800 }}>Reattempt sent to Stage 3</span>
                    ) : (
                      <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700 }}>Under Sales Admin Review</span>
                    )
                  ) : order.grn_workflow_status === 'PENDING_SALES_ADMIN' ? (
                    <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 800 }}>GRN sent to Sales Admin</span>
                  ) : order.reattempt_delivery ? (
                    <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 800 }}>Reattempt sent to Stage 3</span>
                  ) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page-body">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>POD Verification Queue</h1>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Billing Executive verifies delivered orders. Unverified exceptions with remarks are routed to Sales Admin.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(251,191,36,.12)', color: '#fbbf24', fontWeight: 800 }}>
          <Truck size={14} /> Pending (Billing): {pending.length}
        </span>
        <span style={{ padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(52,211,153,.12)', color: '#34d399', fontWeight: 800 }}>
          <CheckCircle2 size={14} /> Verified (Completed): {verified.length}
        </span>
        <span style={{ padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(244,63,94,.12)', color: '#fb7185', fontWeight: 800 }}>
          <AlertTriangle size={14} /> Unverified Issues (Sales Admin Desk): {exceptions.length}
        </span>
      </div>

      <h2 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '0.65rem' }}>Pending POD Verification (Billing Desk)</h2>
      {renderTable(pending, 'PENDING')}

      <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#fb7185', marginBottom: '0.25rem' }}>POD Queries & Exceptions Raised by Billing (Sales Admin Action Desk)</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
          Unverified remarks from Billing verification. Sales Admin can review remarks and create GRN or schedule delivery reattempt.
        </p>
        {renderTable(exceptions, 'ISSUE')}
      </div>

      <h2 style={{ fontSize: '1rem', color: '#34d399', marginBottom: '0.65rem' }}>Verified POD (Completed Orders)</h2>
      {renderTable(verified, 'VERIFIED')}
    </div>
  );
};
