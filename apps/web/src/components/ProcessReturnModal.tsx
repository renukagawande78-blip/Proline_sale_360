import React, { useState } from 'react';
import { X, RefreshCw, Check, PackageCheck, AlertTriangle, ArrowDown, Send } from 'lucide-react';
import { Order, ReturnRequest } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface ProcessReturnModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReturnSettlement: (orderId: string, settlementData: any) => void;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmReturnSettlement
}) => {
  const { addNotification } = useNotifications();

  const [settlementItems, setSettlementItems] = useState<Record<string, number>>({});
  const [dispatchNotes, setDispatchNotes] = useState('Damaged stock received back at warehouse & processed in inventory log.');

  if (!isOpen || !order || !order.return_request) return null;

  const returnReq = order.return_request;
  const isReplacement = returnReq.return_type === 'REPLACEMENT';

  const handleQtyChange = (itemId: string, qty: number, requestedQty: number) => {
    const validQty = Math.max(0, Math.min(qty, requestedQty));
    setSettlementItems(prev => ({ ...prev, [itemId]: validQty }));
  };

  const handleConfirm = () => {
    const payload = {
      return_request_id: returnReq.id,
      return_type: returnReq.return_type,
      dispatch_notes: dispatchNotes,
      items: returnReq.items.map(item => {
        const val = settlementItems[item.order_item_id] !== undefined 
          ? settlementItems[item.order_item_id] 
          : item.requested_qty_pcs;
        return {
          order_item_id: item.order_item_id,
          settled_qty_pcs: val
        };
      })
    };

    onConfirmReturnSettlement(order.id, payload);

    if (isReplacement) {
      addNotification({
        title: `🔄 Stock Replacement Dispatched: ${order.order_number}`,
        message: `Dispatch Manager processed fresh stock replacement dispatch. Inventory stock log updated.`,
        event_type: 'REPLACEMENT_DISPATCHED',
        order_id: order.id
      });
    } else {
      addNotification({
        title: `📉 Damaged Return Processed (Less in Quantity): ${order.order_number}`,
        message: `Dispatch Manager received damaged goods back into warehouse. Net order quantity reduced. Sent to Accounts for Credit Note issuance.`,
        event_type: 'DAMAGED_RETURN_PROCESSED',
        order_id: order.id
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 800, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw color="#34d399" size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {isReplacement ? 'Dispatch Fresh Replacement Inventory' : 'Process Damaged Goods Return & Net Quantity Reduction'}
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              Order No: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong> | Agency: <strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong> | Approved By: <strong style={{ color: '#34d399' }}>{returnReq.approved_by_name || 'System Admin'}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* System Admin Approved Request Banner */}
        <div style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 800, color: '#34d399', marginBottom: 2 }}>
            ✅ SYSTEM ADMIN APPROVED RETURN/REPLACEMENT REQUEST ({returnReq.id})
          </div>
          <div style={{ color: '#cbd5e1' }}>Reason: <em>"{returnReq.reason}"</em></div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 3 }}>
            Requested by {returnReq.requested_by_name} at {returnReq.requested_at} | Approved by {returnReq.approved_by_name || 'System Admin'}
          </div>
        </div>

        {/* Item Settlement Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
            {isReplacement ? 'REPLACEMENT QUANTITY TO DISPATCH (PCS)' : 'ACTUAL DAMAGED STOCK RECEIVED AT WAREHOUSE (LESS IN QTY)'}
          </div>

          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Product SKU Name</th>
                  <th style={{ textAlign: 'center' }}>Admin Approved Qty (PCS)</th>
                  <th style={{ textAlign: 'center' }}>{isReplacement ? 'Dispatch Now (PCS)' : 'Damaged Stock Recd (PCS)'}</th>
                  <th style={{ textAlign: 'center' }}>Status Effect</th>
                </tr>
              </thead>
              <tbody>
                {returnReq.items.map(item => {
                  const val = settlementItems[item.order_item_id] !== undefined 
                    ? settlementItems[item.order_item_id] 
                    : item.requested_qty_pcs;

                  return (
                    <tr key={item.order_item_id}>
                      <td><strong style={{ color: '#f8fafc' }}>{item.product_name}</strong></td>
                      <td style={{ textAlign: 'center' }}><strong style={{ color: '#fbbf24' }}>{item.requested_qty_pcs} PCS</strong></td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number"
                          value={val}
                          onChange={e => handleQtyChange(item.order_item_id, parseInt(e.target.value) || 0, item.requested_qty_pcs)}
                          style={{ width: 100, padding: '0.4rem', background: '#0f172a', border: '1px solid #34d399', borderRadius: 6, color: '#34d399', fontWeight: 900, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isReplacement ? (
                          <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>
                            📦 Fresh Stock Dispatched
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ArrowDown size={12} /> Less by {val} PCS (Accounts Billed Qty Reduced)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch Manager Warehouse Remarks */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
            DISPATCH MANAGER WAREHOUSE STOCK NOTES
          </label>
          <input 
            type="text" 
            value={dispatchNotes}
            onChange={e => setDispatchNotes(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.8rem' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleConfirm} style={{ fontWeight: 800 }}>
            <Check size={16} /> Confirm Settlement & Update Inventory Log
          </button>
        </div>
      </div>
    </div>
  );
};
