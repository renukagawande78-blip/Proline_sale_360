import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, Check, PackageX, FileText } from 'lucide-react';
import { Order, ReturnType, ReturnRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface ReturnRequestModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReturnRequest: (orderId: string, returnRequestData: ReturnRequest) => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmitReturnRequest
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  const [returnType, setReturnType] = useState<ReturnType>('DAMAGED_RETURN');
  const [reason, setReason] = useState('Transit breakage & carton damage during F.O.R transport delivery');
  const [affectedQtys, setAffectedQtys] = useState<Record<string, number>>({});

  if (!isOpen || !order) return null;

  const handleQtyChange = (itemId: string, qty: number, maxQty: number) => {
    const validQty = Math.max(0, Math.min(qty, maxQty));
    setAffectedQtys(prev => ({ ...prev, [itemId]: validQty }));
  };

  const handleSubmit = () => {
    const returnItems = (order.items || []).map(item => {
      const affected = affectedQtys[item.id] !== undefined ? affectedQtys[item.id] : 0;
      return {
        order_item_id: item.id,
        product_name: item.product_name || 'Product Item',
        requested_qty_pcs: affected,
        replaced_qty_pcs: returnType === 'REPLACEMENT' ? affected : 0,
        damaged_returned_qty_pcs: returnType === 'DAMAGED_RETURN' ? affected : 0
      };
    }).filter(i => i.requested_qty_pcs > 0);

    if (returnItems.length === 0) {
      alert('Please specify at least 1 affected item quantity to process return/replacement.');
      return;
    }

    const newRequest: ReturnRequest = {
      id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      order_id: order.id,
      return_type: returnType,
      reason,
      status: 'PENDING_ADMIN_APPROVAL',
      requested_by_name: currentUser?.full_name || 'Salesperson',
      requested_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: returnItems
    };

    onSubmitReturnRequest(order.id, newRequest);

    addNotification({
      title: `🔁 Return/Replacement Request Raised: ${order.order_number}`,
      message: `Salesperson ${currentUser?.full_name} raised a ${returnType === 'REPLACEMENT' ? 'Stock Replacement' : 'Damaged Stock Return'} request. Pending System Admin Approval.`,
      event_type: 'RETURN_REQUESTED',
      order_id: order.id
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 750, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw color="#fbbf24" size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Raise Post-Delivery Return / Replacement Request
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              Order No: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong> | Agency: <strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Return Type Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div 
            onClick={() => setReturnType('DAMAGED_RETURN')}
            style={{ 
              background: returnType === 'DAMAGED_RETURN' ? 'rgba(244, 63, 94, 0.15)' : '#0f172a', 
              border: returnType === 'DAMAGED_RETURN' ? '2px solid #f43f5e' : '1px solid #334155', 
              borderRadius: 8, 
              padding: '1rem', 
              cursor: 'pointer' 
            }}
          >
            <div style={{ fontWeight: 800, color: '#f43f5e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageX size={18} /> DAMAGED GOODS RETURN
            </div>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>
              Return damaged stock back to warehouse for net quantity reduction & Credit Note issuance.
            </p>
          </div>

          <div 
            onClick={() => setReturnType('REPLACEMENT')}
            style={{ 
              background: returnType === 'REPLACEMENT' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a', 
              border: returnType === 'REPLACEMENT' ? '2px solid #38bdf8' : '1px solid #334155', 
              borderRadius: 8, 
              padding: '1rem', 
              cursor: 'pointer' 
            }}
          >
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={18} /> FRESH STOCK REPLACEMENT
            </div>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>
              Replace damaged/defective products with fresh warehouse inventory dispatch.
            </p>
          </div>
        </div>

        {/* Reason for Return */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
            REASON & DAMAGE EVIDENCE NOTES
          </label>
          <input 
            type="text" 
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe transit damage, manufacturing defect, or shortage details..."
            style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.825rem' }}
          />
        </div>

        {/* Item Quantity Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
            SELECT AFFECTED PRODUCTS & QUANTITY (PCS)
          </div>
          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Product SKU Name</th>
                  <th style={{ textAlign: 'center' }}>Total Delivered (PCS)</th>
                  <th style={{ textAlign: 'center' }}>Unit Price (₹)</th>
                  <th style={{ textAlign: 'center' }}>Affected / Returned Qty (PCS)</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map(item => {
                  const val = affectedQtys[item.id] !== undefined ? affectedQtys[item.id] : 0;
                  return (
                    <tr key={item.id}>
                      <td><strong style={{ color: '#f8fafc' }}>{item?.product_name || 'Product SKU'}</strong></td>
                      <td style={{ textAlign: 'center' }}>{item.dispatched_qty_pcs || item.total_qty_pcs}</td>
                      <td style={{ textAlign: 'center' }}>₹{item.unit_price}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number"
                          value={val}
                          onChange={e => handleQtyChange(item.id, parseInt(e.target.value) || 0, item.dispatched_qty_pcs || item.total_qty_pcs)}
                          style={{ width: 90, padding: '0.4rem', background: '#0f172a', border: '1px solid #fbbf24', borderRadius: 6, color: '#fbbf24', fontWeight: 800, textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-warning" onClick={handleSubmit} style={{ fontWeight: 800 }}>
            <Check size={16} /> Submit Request for System Admin Approval
          </button>
        </div>
      </div>
    </div>
  );
};
