import React, { useState } from 'react';
import { Truck, CheckCircle, Clock, ShieldCheck, PackageCheck, Send, Check, Boxes, Plus, Edit3, Search, Building2, Tag, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { isCompanyAllowedForUser, MOCK_PRODUCTS, MOCK_COMPANIES } from '../../lib/supabase';
import { UpdateProductStockModal } from '../../components/UpdateProductStockModal';
import { RegisterProductModal } from '../../components/RegisterProductModal';

interface DispatchViewProps {
  orders: Order[];
  onOpenDispatchModal: (order: Order) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, notificationMsg?: string) => void;
}

export const DispatchView: React.FC<DispatchViewProps> = ({ 
  orders, 
  onOpenDispatchModal,
  onUpdateOrderStatus 
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // Tab State
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory'>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedProductForStockUpdate, setSelectedProductForStockUpdate] = useState<Product | null>(null);
  const [isRegisterProductOpen, setIsRegisterProductOpen] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);

  const dispatchQueueOrders = orders.filter(o => 
    (o.status === 'APPROVED' || 
     o.status === 'PARTIALLY_DISPATCHED' || 
     o.status === 'DISPATCHED' || 
     o.status === 'BILLED' || 
     o.status === 'READY_FOR_PICKUP' || 
     o.status === 'OUT_FOR_DELIVERY' ||
     o.status === 'DELIVERED' ||
     o.status === 'COMPLETED') &&
    isCompanyAllowedForUser(o.company_name, currentUser?.company_handle)
  );

  // Scoped Warehouse Products for Brand Handle Scope
  const scopedProducts = productsList.filter(p => {
    const parentCompany = MOCK_COMPANIES.find(c => c.id === p.company_id);
    return isCompanyAllowedForUser(parentCompany?.company_name, currentUser?.company_handle);
  });

  const filteredProducts = scopedProducts.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const parentCompany = MOCK_COMPANIES.find(c => c.id === p.company_id);
    return (
      p.product_name.toLowerCase().includes(q) ||
      p.product_code.toLowerCase().includes(q) ||
      (parentCompany?.company_name || '').toLowerCase().includes(q)
    );
  });

  const handleMarkReadyForPickup = (order: Order) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, 'READY_FOR_PICKUP');
    }
    addNotification({
      title: `📦 Ready for Self Pickup: ${order.order_number}`,
      message: `Goods packed at warehouse bay. Invoice ${order.invoice_number || ''} attached. Ready for ${order.agency_name} self pickup.`,
      event_type: 'ORDER_READY_FOR_PICKUP',
      order_id: order.id
    });
  };

  const handleMarkOutForDelivery = (order: Order) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY');
    }
    addNotification({
      title: `🚚 Out for Delivery: ${order.order_number}`,
      message: `Products loaded into vehicle. Tax Invoice ${order.invoice_number || ''} attached. Order OUT FOR DELIVERY to ${order.agency_name}.`,
      event_type: 'ORDER_OUT_FOR_DELIVERY',
      order_id: order.id
    });
  };

  const handleMarkDelivered = (order: Order) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, 'COMPLETED');
    }
    addNotification({
      title: `✅ Order Delivered & Completed: ${order.order_number}`,
      message: `Shipment successfully delivered to ${order.agency_name}. Order status marked COMPLETED.`,
      event_type: 'ORDER_DELIVERED',
      order_id: order.id
    });
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dispatch & Warehouse Operations Console</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Manage warehouse inventory stock, MRP, pack size, delivery queue, and new SKU registrations | Brand Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All 13 Brands' : currentUser?.company_handle}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => setIsRegisterProductOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.15rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.825rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={16} /> Register New Product SKU
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '0.4rem', borderRadius: 10, border: '1px solid #334155', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.25rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'queue' ? '#38bdf8' : 'transparent',
            color: activeTab === 'queue' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer'
          }}
        >
          <Truck size={16} /> Dispatch & Delivery Queue ({dispatchQueueOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.25rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'inventory' ? '#38bdf8' : 'transparent',
            color: activeTab === 'inventory' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer'
          }}
        >
          <Boxes size={16} /> Warehouse Inventory & Stock Master ({scopedProducts.length} SKUs)
        </button>
      </div>

      {/* Modals */}
      <UpdateProductStockModal
        isOpen={!!selectedProductForStockUpdate}
        onClose={() => setSelectedProductForStockUpdate(null)}
        product={selectedProductForStockUpdate}
        onSuccess={(updated) => {
          setProductsList(prev => prev.map(p => p.id === updated.id ? updated : p));
          addNotification({
            title: `📦 Stock Updated: ${updated.product_name}`,
            message: `MRP set to ₹${updated.mrp_price}, Pack: ${updated.pcs_per_box} pcs/box, Stock: ${updated.stock_box_qty} Boxes (${updated.total_stock_pcs} Total PCS).`,
            event_type: 'STOCK_UPDATED'
          });
        }}
      />

      <RegisterProductModal
        isOpen={isRegisterProductOpen}
        onClose={() => setIsRegisterProductOpen(false)}
        onSuccess={(newProd) => {
          setProductsList(prev => [newProd, ...prev]);
          addNotification({
            title: `✨ New SKU Registered: ${newProd.product_name}`,
            message: `Registered code ${newProd.product_code} into warehouse catalog with initial stock of ${newProd.stock_box_qty} Boxes.`,
            event_type: 'NEW_SKU_REGISTERED'
          });
        }}
      />

      {/* VIEW 1: Dispatch Processing Queue */}
      {activeTab === 'queue' && (
        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Dispatch & Delivery Queue ({dispatchQueueOrders.length})</h2>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Real-time Delivery Pipeline</span>
          </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Agency / Party</th>
              <th>Mode</th>
              <th>System Approver</th>
              <th>Tax Invoice</th>
              <th>Delivery Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {dispatchQueueOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No active orders in dispatch or delivery pipeline for your brand scope.
                </td>
              </tr>
            ) : (
              dispatchQueueOrders.map(order => {
                const totalQty = order.total_qty_pcs;
                const dispatchedQty = order.items?.reduce((sum, item) => sum + (item.dispatched_qty_pcs || 0), 0) || 0;
                const isSelfPickup = order.delivery_type === 'Self Pickup';

                return (
                  <tr key={order.id}>
                    <td>
                      <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong>
                      {order.invoice_number && (
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '0.1rem 0.45rem', borderRadius: 6 }}>
                            🧾 Bill Ready: {order.invoice_number}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>{order.order_date}</td>
                    <td><strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong></td>
                    <td>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: isSelfPickup ? '#38bdf8' : '#fbbf24' }}>
                        {order.delivery_type || 'F.O.R'}
                      </span>
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: '#34d399', 
                          background: 'rgba(52, 211, 153, 0.12)', 
                          border: '1px solid rgba(52, 211, 153, 0.25)', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap'
                        }}
                        title={`System Admin Approval Granted by: ${order.approved_by_name || 'System Admin'}${order.approved_at ? ` at ${order.approved_at}` : ''}`}
                      >
                        <ShieldCheck size={13} color="#34d399" />
                        {order.approved_by_name || 'System Admin'}
                      </span>
                    </td>
                    <td>
                      {order.invoice_number ? (
                        <code style={{ color: '#34d399', fontWeight: 800, fontSize: '0.75rem' }}>{order.invoice_number}</code>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.725rem' }}>Pending Accounts Invoice</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status === 'BILLED' && '🧾 BILL READY FOR DELIVERY'}
                        {order.status === 'READY_FOR_PICKUP' && '📦 READY FOR PICKUP'}
                        {order.status === 'OUT_FOR_DELIVERY' && '🚚 OUT FOR DELIVERY'}
                        {order.status === 'COMPLETED' && '✅ DELIVERED & COMPLETED'}
                        {order.status !== 'BILLED' && order.status !== 'READY_FOR_PICKUP' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'COMPLETED' && order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {/* Step 1: Initial Warehouse Dispatch Allocation */}
                      {(order.status === 'APPROVED' || order.status === 'PARTIALLY_DISPATCHED') && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => onOpenDispatchModal(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Truck size={14} /> Stock Check & Send to Accounts
                        </button>
                      )}

                      {/* Step 2: Waiting for Accounts to issue Tax Invoice */}
                      {order.status === 'DISPATCHED' && (
                        <span style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} color="#fbbf24" /> Pending Accounts Invoicing
                        </span>
                      )}

                      {/* Step 3: Bill is Ready (Accounts Issued Invoice) -> Execute Delivery based on Self Pickup vs F.O.R */}
                      {order.status === 'BILLED' && (
                        isSelfPickup ? (
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleMarkReadyForPickup(order)}
                            style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <PackageCheck size={14} /> Mark Ready for Self Pickup
                          </button>
                        ) : (
                          <button 
                            className="btn btn-success"
                            onClick={() => handleMarkOutForDelivery(order)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Truck size={14} /> Load & Mark Out for Delivery
                          </button>
                        )
                      )}

                      {/* Step 4: Ready for Pickup -> Mark Delivered */}
                      {order.status === 'READY_FOR_PICKUP' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => handleMarkDelivered(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle size={14} /> Mark Agency Collected
                        </button>
                      )}

                      {/* Step 5: Out for Delivery -> Mark Delivered */}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => handleMarkDelivered(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle size={14} /> Mark Delivered & Completed
                        </button>
                      )}

                      {/* Step 6: Completed */}
                      {order.status === 'COMPLETED' && (
                        <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 800 }}>
                          ✅ Delivered
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* VIEW 2: Warehouse Inventory & Stock Master */}
      {activeTab === 'inventory' && (
        <div>
          {/* Search Toolbar */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: 450 }}>
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search product SKU name, SKU code, or brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <div className="data-table-container">
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Warehouse Stock & Product Master ({filteredProducts.length} SKUs)</h2>
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>Dispatch Manager Physical Inventory Control</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product SKU Description</th>
                  <th>Brand Company</th>
                  <th>MRP Unit Price</th>
                  <th>Wholesale Price</th>
                  <th>Pack Size</th>
                  <th>Stock In Boxes</th>
                  <th>Loose PCS Stock</th>
                  <th>Total Available Stock (PCS)</th>
                  <th>Stock Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No product SKUs found matching search query. Click "+ Register New Product SKU" to add new products into catalog.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const comp = MOCK_COMPANIES.find(c => c.id === p.company_id);
                    const totalPcs = p.total_stock_pcs || ((p.stock_box_qty || 0) * (p.pcs_per_box || 1) + (p.stock_loose_pcs || 0));
                    const isLowStock = totalPcs < 50;

                    return (
                      <tr key={p.id}>
                        <td><code style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.75rem' }}>{p.product_code}</code></td>
                        <td><strong style={{ color: '#f8fafc' }}>{p.product_name}</strong></td>
                        <td><span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>{comp?.company_name || 'Brand SKU'}</span></td>
                        <td><strong style={{ color: '#34d399' }}>₹{(p.mrp_price || Math.round(p.unit_price * 1.15)).toLocaleString()}</strong></td>
                        <td><span>₹{p.unit_price.toLocaleString()}</span></td>
                        <td><span style={{ fontWeight: 700, color: '#38bdf8' }}>{p.pcs_per_box} pcs/box</span></td>
                        <td><strong style={{ color: '#f8fafc' }}>{p.stock_box_qty || 0} Boxes</strong></td>
                        <td><span>{p.stock_loose_pcs || 0} PCS</span></td>
                        <td><strong style={{ color: isLowStock ? '#f43f5e' : '#34d399', fontSize: '0.85rem' }}>{totalPcs.toLocaleString()} PCS</strong></td>
                        <td>
                          {isLowStock ? (
                            <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>
                              ⚠️ LOW STOCK
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.55rem', borderRadius: 6 }}>
                              🟢 IN STOCK
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => setSelectedProductForStockUpdate(p)}
                            style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Edit3 size={13} /> Update Stock / MRP
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
      )}
    </div>
  );
};
