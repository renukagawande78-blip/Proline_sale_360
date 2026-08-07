import React, { useState } from 'react';
import { X, Truck, Check } from 'lucide-react';
import { Order } from '../types';

interface DispatchModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch: (orderId: string, dispatchData: any) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmDispatch
}) => {
  const [dispatchType, setDispatchType] = useState<'DELIVERY' | 'SELF_PICKUP'>('DELIVERY');
  const [vehicleNumber, setVehicleNumber] = useState('DL-01-AB-1234');
  const [driverName, setDriverName] = useState('Mahesh Verma');
  const [driverMobile, setDriverMobile] = useState('+91 97777 22222');
  const [lrNumber, setLrNumber] = useState('LR-99887766');
  
  // Item-wise dispatch quantity state
  const [dispatchItems, setDispatchItems] = useState<Record<string, number>>({});

  if (!isOpen || !order) return null;

  const handleDispatchQtyChange = (itemId: string, qty: number, maxPending: number) => {
    const validQty = Math.max(0, Math.min(qty, maxPending));
    setDispatchItems(prev => ({ ...prev, [itemId]: validQty }));
  };

  const handleConfirm = () => {
    const payload = {
      dispatch_type: dispatchType,
      vehicle_number: vehicleNumber,
      driver_name: driverName,
      driver_mobile: driverMobile,
      lr_number: lrNumber,
      items: Object.entries(dispatchItems).map(([itemId, qty]) => ({
        order_item_id: itemId,
        dispatch_qty: qty
      }))
    };
    onConfirmDispatch(order.id, payload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck color="#38bdf8" size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Dispatch Execution & Quantity Allocation</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Order: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong> | Agency: {order.agency_name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Dispatch Type Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DISPATCH MODE</label>
            <select 
              value={dispatchType}
              onChange={e => setDispatchType(e.target.value as any)}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 700 }}
            >
              <option value="DELIVERY">DELIVERY / TRANSPORTER</option>
              <option value="SELF_PICKUP">SELF PICKUP BY AGENCY</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>VEHICLE NUMBER</label>
            <input 
              type="text" 
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
            />
          </div>
        </div>

        {/* Transporter Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DRIVER NAME</label>
            <input 
              type="text" 
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DRIVER MOBILE</label>
            <input 
              type="text" 
              value={driverMobile}
              onChange={e => setDriverMobile(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>LR / CHALLAN NO</label>
            <input 
              type="text" 
              value={lrNumber}
              onChange={e => setLrNumber(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
            />
          </div>
        </div>

        {/* Item-level Partial / Full Dispatch table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>ITEM-WISE DISPATCH ALLOCATION (PCS)</div>
          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Ordered (PCS)</th>
                <th>Prev Dispatched</th>
                <th>Pending (PCS)</th>
                <th>Dispatch Now</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map(item => {
                const pending = item.pending_qty_pcs;
                const currentVal = dispatchItems[item.id] !== undefined ? dispatchItems[item.id] : pending;

                return (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.total_qty_pcs}</td>
                    <td>{item.dispatched_qty_pcs}</td>
                    <td><strong style={{ color: '#fbbf24' }}>{pending}</strong></td>
                    <td>
                      <input 
                        type="number"
                        value={currentVal}
                        onChange={e => handleDispatchQtyChange(item.id, parseInt(e.target.value) || 0, pending)}
                        style={{ width: 90, padding: '0.4rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 4, color: '#38bdf8', fontWeight: 800, textAlign: 'center' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            <Check size={16} /> Confirm & Issue Dispatch Note
          </button>
        </div>
      </div>
    </div>
  );
};
