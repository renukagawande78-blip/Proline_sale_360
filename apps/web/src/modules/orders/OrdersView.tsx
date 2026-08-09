import React, { useState } from 'react';
import { Search, Plus, ShieldCheck, Ban, Trash2, FileText, MoreVertical, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_COMPANIES, isCompanyAllowedForUser, getOrderAccessPermission } from '../../lib/supabase';
import { Order, PermissionControl } from '../../types';
import { PermissionDeniedModal } from '../../components/PermissionDeniedModal';

interface OrdersViewProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrderForApproval: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onOpenReturnRequestModal?: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenCreateOrder,
  onSelectOrderForApproval,
  onViewInvoice,
  onCancelOrder,
  onDeleteOrder,
  onOpenReturnRequestModal
}) => {
  const { currentUser, hasPermission } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const canAddOrder = hasPermission('add_order') || hasPermission('order_entry');
  const canCancelOrder = hasPermission('cancel_order');
  const canDeleteOrder = hasPermission('delete_order');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 3-Dot Action Menu Popup state
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

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
    const accessPerm = getOrderAccessPermission(o, currentUser);
    const matchesBrandScope = accessPerm.canView;
    const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.agency_name && o.agency_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCompany = selectedCompany === 'ALL' || o.company_id === selectedCompany;
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

    return matchesBrandScope && matchesSearch && matchesCompany && matchesStatus;
  });

  // Calculate available action buttons for an order
  const getOrderActions = (order: Order) => {
    const accessPerm = getOrderAccessPermission(order, currentUser);

    const actions: { id: string; label: string; icon: any; color: string; onClick: () => void }[] = [
      {
        id: 'view',
        label: accessPerm.canExecuteActions ? 'View Details' : 'View (Read-Only)',
        icon: FileText,
        color: '#38bdf8',
        onClick: () => onSelectOrderForApproval(order)
      }
    ];

    // Read-only cross-brand product view -> No operations allowed!
    if (!accessPerm.canExecuteActions) {
      return actions;
    }

    if ((role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN' || role === 'SALES_ADMIN') && (order.status === 'SUBMITTED' || order.status === 'HELD')) {
      actions.push({
        id: 'check',
        label: 'Account Check',
        icon: ShieldCheck,
        color: '#fbbf24',
        onClick: () => onSelectOrderForApproval(order)
      });
    }

    if (onViewInvoice) {
      actions.push({
        id: 'invoice',
        label: 'Print Invoice',
        icon: FileText,
        color: '#3b82f6',
        onClick: () => onViewInvoice(order)
      });
    }

    if (order.status !== 'CANCELLED' && order.status !== 'DISPATCHED' && order.status !== 'COMPLETED') {
      actions.push({
        id: 'cancel',
        label: 'Cancel Order',
        icon: Ban,
        color: '#f59e0b',
        onClick: () => handleConfirmCancel(order)
      });
    }

    if ((order.status === 'COMPLETED' || order.status === 'DELIVERED' || order.status === 'DISPATCHED') && onOpenReturnRequestModal) {
      actions.push({
        id: 'return',
        label: 'Raise Return / Replacement',
        icon: RefreshCw,
        color: '#fbbf24',
        onClick: () => onOpenReturnRequestModal(order)
      });
    }

    actions.push({
      id: 'delete',
      label: 'Delete Order (Admin)',
      icon: Trash2,
      color: '#f43f5e',
      onClick: () => handleConfirmDelete(order)
    });

    return actions;
  };

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
              <th style={{ textAlign: 'center', width: 140 }}>Actions Authority</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const allActions = getOrderActions(order);
              const isMenuOpen = activeMenuOrderId === order.id;
              const accessPerm = getOrderAccessPermission(order, currentUser);

              return (
                <tr key={order.id}>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong>
                    {!accessPerm.canExecuteActions && accessPerm.isItemBrandOwner && (
                      <span 
                        style={{ 
                          fontSize: '0.625rem', 
                          fontWeight: 800, 
                          color: '#fbbf24', 
                          background: 'rgba(251, 191, 36, 0.15)', 
                          border: '1px solid rgba(251, 191, 36, 0.3)', 
                          padding: '0.15rem 0.45rem', 
                          borderRadius: 6, 
                          marginLeft: 6,
                          display: 'inline-block'
                        }} 
                        title={accessPerm.accessReason}
                      >
                        👁️ Read-Only Item Match
                      </span>
                    )}
                  </td>
                  <td>{order.order_date}</td>
                  <td>{order.company_name}</td>
                  <td>{order.agency_name}</td>
                  <td><span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>{order.salesperson_name || 'Field Exec'}</span></td>
                  <td>{order.total_box_qty} Boxes / {order.total_loose_pcs} Loose</td>
                  <td><span style={{ fontWeight: 800, color: '#34d399' }}>{order.total_qty_pcs}</span></td>
                  <td>₹{order.total_amount.toLocaleString()}</td>
                  <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  <td style={{ position: 'relative', textAlign: 'center' }}>
                    
                    {allActions.length <= 3 ? (
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        {allActions.map(act => {
                          const IconComp = act.icon;
                          return (
                            <button
                              key={act.id}
                              className="btn btn-outline"
                              onClick={act.onClick}
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.725rem', borderColor: act.color, color: act.color }}
                              title={act.label}
                            >
                              <IconComp size={13} /> {act.label.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
                        <button 
                          className="btn btn-outline"
                          onClick={() => onSelectOrderForApproval(order)}
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.725rem' }}
                          title="View Order Details"
                        >
                          <FileText size={13} /> View
                        </button>

                        <button
                          onClick={() => setActiveMenuOrderId(isMenuOpen ? null : order.id)}
                          style={{
                            background: isMenuOpen ? 'rgba(56, 189, 248, 0.25)' : '#0f172a',
                            border: isMenuOpen ? '1px solid #38bdf8' : '1px solid #334155',
                            color: isMenuOpen ? '#38bdf8' : '#f8fafc',
                            padding: '0.35rem 0.55rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}
                          title="More Order Actions Menu (3-Dot View)"
                        >
                          <MoreVertical size={15} color="#38bdf8" /> Actions ({allActions.length})
                        </button>

                        {isMenuOpen && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 10,
                              zIndex: 999,
                              background: '#1e293b',
                              border: '1px solid #38bdf8',
                              borderRadius: 8,
                              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                              padding: '0.4rem',
                              minWidth: 190,
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', borderBottom: '1px solid #334155', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>AVAILABLE ACTIONS</span>
                              <X size={13} style={{ cursor: 'pointer' }} onClick={() => setActiveMenuOrderId(null)} />
                            </div>

                            {allActions.map(act => {
                              const IconComp = act.icon;
                              return (
                                <div
                                  key={act.id}
                                  onClick={() => {
                                    setActiveMenuOrderId(null);
                                    act.onClick();
                                  }}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 6,
                                    color: act.color,
                                    fontWeight: 700,
                                    fontSize: '0.775rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.15s ease'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <IconComp size={14} color={act.color} />
                                  <span>{act.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PermissionDeniedModal 
        isOpen={deniedModal.isOpen}
        actionName={deniedModal.actionName}
        requiredPermissionKey={deniedModal.key}
        onClose={() => setDeniedModal({ ...deniedModal, isOpen: false })}
      />
    </div>
  );
};
