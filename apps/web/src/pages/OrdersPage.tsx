import React, { useState } from 'react';
import { Search, Plus, ShieldCheck, Ban, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_COMPANIES, isCompanyAllowedForUser } from '../lib/supabase';
import { Order, PermissionControl } from '../types';
import { PermissionDeniedModal } from '../components/PermissionDeniedModal';

interface OrdersPageProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrderForApproval: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  onOpenCreateOrder,
  onSelectOrderForApproval,
  onViewInvoice,
  onCancelOrder,
  onDeleteOrder
}) => {
  const { currentUser, hasPermission } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const canAddOrder = hasPermission('add_order') || hasPermission('order_entry');
  const canCancelOrder = hasPermission('cancel_order');
  const canDeleteOrder = hasPermission('delete_order');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Permission Denied Modal State
  const [deniedModal, setDeniedModal] = useState<{ isOpen: boolean; actionName: string; key: keyof PermissionControl }>({
    isOpen: false,
    actionName: '',
    key: 'add_order'
  });

  const triggerPermissionDenied = (actionName: string, key: keyof PermissionControl) => {
    setDeniedModal({
      isOpen: true,
      actionName,
      key
    });
  };

  const handleCreateOrderClick = () => {
    if (canAddOrder) {
      onOpenCreateOrder();
    } else {
      triggerPermissionDenied('Add Sales Order / Order Entry', 'add_order');
    }
  };

  const handleConfirmCancel = (order: Order) => {
    if (!canCancelOrder) {
      triggerPermissionDenied(`Cancel Sales Order ${order.order_number}`, 'cancel_order');
      return;
    }
    if (window.confirm(`Are you sure you want to cancel Sales Order ${order.order_number}?`)) {
      if (onCancelOrder) {
        onCancelOrder(order.id);
      }
    }
  };

  const handleConfirmDelete = (order: Order) => {
    if (!canDeleteOrder) {
      triggerPermissionDenied(`Delete Sales Order ${order.order_number}`, 'delete_order');
      return;
    }
    if (window.confirm(`⚠️ PERMANENT DELETE WARNING: Delete Sales Order ${order.order_number}? This action can only be done by System Admin.`)) {
      if (onDeleteOrder) {
        onDeleteOrder(order.id);
      }
    }
  };

  const allowedCompanies = MOCK_COMPANIES.filter(c => 
    isCompanyAllowedForUser(c.company_name, currentUser?.company_handle)
  );

  const filteredOrders = orders.filter(o => {
    const matchesBrandScope = isCompanyAllowedForUser(o.company_name, currentUser?.company_handle);
    const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.agency_name && o.agency_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCompany = selectedCompany === 'ALL' || o.company_id === selectedCompany;
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

    return matchesBrandScope && matchesSearch && matchesCompany && matchesStatus;
  });

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sales Orders Console</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            View, Add, Cancel, or Delete multi-company B2B sales orders | Brand Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All 13 Brands' : currentUser?.company_handle}</strong>
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleCreateOrderClick}>
          <Plus size={16} /> Create Agency Order
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.5rem 0.75rem', gap: '0.5rem' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by order number or agency name..."
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
            <option value="ALL">All Segments</option>
            {allowedCompanies.map(c => (
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
            <option value="CANCELLED">CANCELLED</option>
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
              <th>Salesperson / Exec</th>
              <th>Boxes / Loose</th>
              <th>Total PCS</th>
              <th>Order Total (₹)</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions Authority</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td><strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></td>
                <td>{order.order_date}</td>
                <td>{order.company_name}</td>
                <td>{order.agency_name}</td>
                <td><span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>{order.salesperson_name || 'Field Exec'}</span></td>
                <td>{order.total_box_qty} Boxes / {order.total_loose_pcs} Loose</td>
                <td><span style={{ fontWeight: 800, color: '#34d399' }}>{order.total_qty_pcs}</span></td>
                <td>₹{order.total_amount.toLocaleString()}</td>
                <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* View Details */}
                    <button 
                      className="btn btn-outline"
                      onClick={() => onSelectOrderForApproval(order)}
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      title="View Details"
                    >
                      <FileText size={13} /> View
                    </button>

                    {/* Account Check Approval */}
                    {(role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN' || role === 'SALES_ADMIN') && (order.status === 'SUBMITTED' || order.status === 'HELD') && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => onSelectOrderForApproval(order)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <ShieldCheck size={13} /> Check
                      </button>
                    )}

                    {/* Invoice */}
                    {onViewInvoice && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => onViewInvoice(order)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: '#3b82f6' }}
                        title="Print / Download Invoice"
                      >
                        Invoice
                      </button>
                    )}

                    {/* Cancel Order Action */}
                    {order.status !== 'CANCELLED' && order.status !== 'DISPATCHED' && order.status !== 'COMPLETED' && (
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleConfirmCancel(order)}
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', borderColor: canCancelOrder ? '#f59e0b' : '#64748b', color: canCancelOrder ? '#fbbf24' : '#64748b' }}
                        title={canCancelOrder ? "Cancel Order" : "Cancel Order (Permission NO: Click to request access)"}
                      >
                        <Ban size={13} /> Cancel
                      </button>
                    )}

                    {/* Delete Order Action (Admin Only!) */}
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleConfirmDelete(order)}
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', background: canDeleteOrder ? '#e11d48' : 'rgba(244, 63, 94, 0.2)', opacity: canDeleteOrder ? 1 : 0.6 }}
                      title={canDeleteOrder ? "Delete Order (Admin Only)" : "Delete Order (Restricted: Click to request Admin permission)"}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Denied & Admin Request Modal */}
      <PermissionDeniedModal 
        isOpen={deniedModal.isOpen}
        actionName={deniedModal.actionName}
        requiredPermissionKey={deniedModal.key}
        onClose={() => setDeniedModal({ ...deniedModal, isOpen: false })}
      />
    </div>
  );
};
