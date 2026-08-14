import React, { useState } from 'react';
import { X, Truck, Check, PackageCheck, AlertTriangle, Layers, Send } from 'lucide-react';
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
  const [dispatchType, setDispatchType] = useState<'F.O.R' | 'Self Pickup'>(order?.delivery_type || 'F.O.R');
  const [isCompanyVehicle, setIsCompanyVehicle] = useState<boolean>(true);
  const [vehicleNumber, setVehicleNumber] = useState('MH-04-AB-1234');
  const [driverName, setDriverName] = useState('Mahesh Verma');
  const [driverMobile, setDriverMobile] = useState('+91 97777 22222');
  const [tempoNumber, setTempoNumber] = useState('MH-12-TR-9090');
  const [bookingId, setBookingId] = useState('PORTER-88221');
  const [freightAmount, setFreightAmount] = useState<number>(1850);
  const [lrNumber, setLrNumber] = useState('LR-99887766');
  
  // Item-wise dispatch quantity state
  const [dispatchItems, setDispatchItems] = useState<Record<string, number>>({});

  if (!isOpen || !order) return null;

  // Mock Warehouse Live Inventory Fetcher
  const getWarehouseStock = (productId?: string, totalNeeded: number = 10) => {
    const seed = productId ? productId.charCodeAt(0) : 75;
    const stockAvailable = Math.floor((seed * 185) % 650) + 15;
    let status: 'IN_STOCK' | 'PARTIAL_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (stockAvailable === 0) status = 'OUT_OF_STOCK';
    else if (stockAvailable < totalNeeded) status = 'PARTIAL_STOCK';
    return { stockAvailable, status };
  };

  const handleDispatchQtyChange = (itemId: string, qty: number, maxPending: number) => {
    const validQty = Math.max(0, Math.min(qty, maxPending));
    setDispatchItems(prev => ({ ...prev, [itemId]: validQty }));
  };

  const handleConfirm = () => {
    const payload = {
      dispatch_type: dispatchType,
      is_company_vehicle: isCompanyVehicle,
      vehicle_number: isCompanyVehicle ? vehicleNumber : tempoNumber,
      driver_name: driverName,
      driver_mobile: driverMobile,
      tempo_number: tempoNumber,
      booking_id: bookingId,
      freight_amount: freightAmount,
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
      <div className="modal-card" style={{ maxWidth: 920, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Truck color="#38bdf8" size={22} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Stage 5: Warehouse Packing & Logistics Allocation
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              Order No: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong> | Agency: <strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong> | Delivery Type: <strong style={{ color: '#34d399' }}>{dispatchType}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Logistics & Transporter Form */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck size={16} /> STAGE 5 LOGISTICS & FLEET ALLOCATION
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DELIVERY TYPE</label>
              <select 
                value={dispatchType}
                onChange={e => setDispatchType(e.target.value as any)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 700 }}
              >
                <option value="F.O.R">F.O.R DELIVERY</option>
                <option value="Self Pickup">SELF PICKUP (Record Driver & Mobile)</option>
              </select>
            </div>

            {dispatchType === 'Self Pickup' ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>PICKUP DRIVER NAME*</label>
                  <input 
                    type="text" 
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Driver Name"
                    style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>DRIVER MOBILE NO.*</label>
                  <input 
                    type="text" 
                    value={driverMobile}
                    onChange={e => setDriverMobile(e.target.value)}
                    placeholder="+91 Mobile No"
                    style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>COMPANY VEHICLE?</label>
                  <select 
                    value={isCompanyVehicle ? 'YES' : 'NO'}
                    onChange={e => setIsCompanyVehicle(e.target.value === 'YES')}
                    style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 700 }}
                  >
                    <option value="YES">YES — Company Owned Vehicle</option>
                    <option value="NO">NO — Rental / Porter Transporter</option>
                  </select>
                </div>

                {isCompanyVehicle ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>COMPANY VEHICLE NO.</label>
                    <input 
                      type="text" 
                      value={vehicleNumber}
                      onChange={e => setVehicleNumber(e.target.value)}
                      placeholder="e.g. MH-04-AB-1234"
                      style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#f43f5e', marginBottom: 4 }}>TEMPO NUMBER*</label>
                      <input 
                        type="text" 
                        value={tempoNumber}
                        onChange={e => setTempoNumber(e.target.value)}
                        placeholder="e.g. MH-12-TR-9090"
                        style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#f43f5e', marginBottom: 4 }}>BOOKING ID / CHALLAN*</label>
                      <input 
                        type="text" 
                        value={bookingId}
                        onChange={e => setBookingId(e.target.value)}
                        placeholder="e.g. PORTER-88221"
                        style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#f43f5e', marginBottom: 4 }}>FREIGHT AMOUNT (₹)*</label>
                      <input 
                        type="number" 
                        value={freightAmount}
                        onChange={e => setFreightAmount(Number(e.target.value))}
                        placeholder="Freight INR"
                        style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 700 }}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Item-level Warehouse Stock & Allocation Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageCheck size={16} color="#34d399" /> Central Warehouse Live Stock & Item Dispatch Allocation
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Auto-allocated based on available warehouse inventory
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th style={{ textAlign: 'center' }}>Ordered (PCS)</th>
                  <th style={{ textAlign: 'center' }}>Warehouse Live Stock</th>
                  <th style={{ textAlign: 'center' }}>Stock Availability</th>
                  <th style={{ textAlign: 'center' }}>Pending (PCS)</th>
                  <th style={{ textAlign: 'center' }}>Dispatch Now (PCS)</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map(item => {
                  const pending = item.pending_qty_pcs;
                  const { stockAvailable, status } = getWarehouseStock(item.product_id || item.id, pending);
                  
                  // Pre-fill input value
                  const defaultQty = Math.min(pending, stockAvailable);
                  const currentVal = dispatchItems[item.id] !== undefined ? dispatchItems[item.id] : defaultQty;

                  return (
                    <tr key={item.id}>
                      <td><strong style={{ color: '#f8fafc' }}>{item.product_name}</strong></td>
                      <td style={{ textAlign: 'center' }}>{item.total_qty_pcs}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color: stockAvailable > 0 ? '#34d399' : '#f43f5e' }}>
                          {stockAvailable} PCS
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {status === 'IN_STOCK' && (
                          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                            🟢 Full Stock
                          </span>
                        )}
                        {status === 'PARTIAL_STOCK' && (
                          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                            🟡 Partial Stock
                          </span>
                        )}
                        {status === 'OUT_OF_STOCK' && (
                          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                            🔴 Out of Stock
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}><strong style={{ color: '#fbbf24' }}>{pending}</strong></td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number"
                          value={currentVal}
                          onChange={e => handleDispatchQtyChange(item.id, parseInt(e.target.value) || 0, pending)}
                          style={{ width: 100, padding: '0.4rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontWeight: 900, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accounts Invoicing Notification Info Box */}
        <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 8, padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.775rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={16} color="#34d399" style={{ flexShrink: 0 }} />
          <span>
            <strong>Accounts Invoicing Workflow:</strong> Confirming warehouse dispatch updates item availability, generates the Dispatch Challan, and automatically pushes the shipment to the <strong>Accounts & Billing Console</strong> for immediate Tax Invoice generation.
          </span>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleConfirm} style={{ fontWeight: 800 }}>
            <Check size={16} /> Confirm Dispatch & Send to Accounts for Invoicing
          </button>
        </div>
      </div>
    </div>
  );
};
