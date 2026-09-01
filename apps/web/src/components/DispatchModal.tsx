import React, { useEffect, useState } from 'react';
import { X, Truck, Check, PackageCheck } from 'lucide-react';
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
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [tempoNumber, setTempoNumber] = useState('');
  const [rentalAgencyName, setRentalAgencyName] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [lrNumber, setLrNumber] = useState('LR-99887766');
  const [dispatchRemark, setDispatchRemark] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Item-wise dispatch quantity state
  const [dispatchItems, setDispatchItems] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!order || !isOpen) return;
    setDispatchType(order.delivery_type || 'F.O.R');
    setIsCompanyVehicle(order.is_company_vehicle ?? true);
    setVehicleNumber(order.vehicle_number || '');
    setTempoNumber(order.tempo_number || '');
    setDriverName(order.driver_name || '');
    setDriverMobile(order.driver_mobile || '');
    setRentalAgencyName(order.rental_agency_name || '');
    setBookingId(order.booking_id || '');
    setFreightAmount(order.freight_amount || 0);
    setDispatchRemark(order.dispatch_remark || '');
    setValidationError('');
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleDispatchQtyChange = (itemId: string, qty: number, maxPending: number) => {
    const validQty = Math.max(0, Math.min(qty, maxPending));
    setDispatchItems(prev => ({ ...prev, [itemId]: validQty }));
  };

  const handleConfirm = () => {
    const finalVehicleNumber = dispatchType === 'Self Pickup' || isCompanyVehicle ? vehicleNumber.trim() : tempoNumber.trim();
    if (!finalVehicleNumber || !driverName.trim() || !driverMobile.trim()) {
      setValidationError('Vehicle number, driver name, and driver mobile number are mandatory.');
      return;
    }
    if (dispatchType === 'F.O.R' && !isCompanyVehicle && (!rentalAgencyName.trim() || freightAmount <= 0)) {
      setValidationError('Rental agency name and rent amount are mandatory for rented vehicles.');
      return;
    }
    const payload = {
      dispatch_type: dispatchType,
      is_company_vehicle: isCompanyVehicle,
      vehicle_number: finalVehicleNumber,
      driver_name: driverName.trim(),
      driver_mobile: driverMobile.trim(),
      tempo_number: tempoNumber,
      booking_id: bookingId,
      rental_agency_name: dispatchType === 'F.O.R' && !isCompanyVehicle ? rentalAgencyName.trim() : '',
      freight_amount: freightAmount,
      dispatch_remark: dispatchRemark.trim(),
      lr_number: lrNumber,
      items: (order.items || []).map(item => {
        const itemTargetQty = (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) ? item.issued_qty_pcs : item.total_qty_pcs;
        return {
          order_item_id: item.id,
          dispatch_qty: dispatchItems[item.id] !== undefined ? dispatchItems[item.id] : itemTargetQty
        };
      })
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
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>VEHICLE NUMBER*</label>
                  <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="e.g. GJ-05-AB-1234" style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
                </div>
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
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>COMPANY VEHICLE NO.*</label>
                      <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="e.g. GJ-05-AB-1234" style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DRIVER NAME*</label>
                      <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DRIVER MOBILE NO.*</label>
                      <input type="tel" value={driverMobile} onChange={e => setDriverMobile(e.target.value)} placeholder="Mobile number" style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
                    </div>
                  </>
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
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#f43f5e', marginBottom: 4 }}>RENTAL AGENCY NAME*</label>
                      <input 
                        type="text" 
                        value={rentalAgencyName}
                        onChange={e => setRentalAgencyName(e.target.value)}
                        placeholder="e.g. Porter, Bluestock"
                        style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#f43f5e', marginBottom: 4 }}>RENT AMOUNT (₹)*</label>
                      <input 
                        type="number" 
                        value={freightAmount}
                        onChange={e => setFreightAmount(Number(e.target.value))}
                        placeholder="Rent INR"
                        style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DRIVER NAME*</label>
                      <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DRIVER MOBILE NO.*</label>
                      <input type="text" value={driverMobile} onChange={e => setDriverMobile(e.target.value)} placeholder="+91 Mobile No." style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DISPATCH REMARK</label>
            <textarea rows={2} value={dispatchRemark} onChange={e => setDispatchRemark(e.target.value)} placeholder="Transport or delivery instructions" style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', resize: 'vertical' }} />
          </div>
          {validationError && <div style={{ marginTop: '0.75rem', color: '#fb7185', fontSize: '0.75rem', fontWeight: 800 }}>{validationError}</div>}
        </div>

        {/* Item-level Dispatch Allocation Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageCheck size={16} color="#34d399" /> Order Items for Dispatch
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Verify quantities to load and deliver
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th style={{ textAlign: 'center' }}>Total Ordered (PCS)</th>
                  <th style={{ textAlign: 'center' }}>Billing Qty (PCS)</th>
                  <th style={{ textAlign: 'center' }}>Dispatch Qty (PCS)</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map(item => {
                  const targetQty = (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) ? item.issued_qty_pcs : item.total_qty_pcs;
                  const currentVal = dispatchItems[item.id] !== undefined ? dispatchItems[item.id] : targetQty;

                  return (
                    <tr key={item.id}>
                      <td><strong style={{ color: '#f8fafc' }}>{item?.product_name || 'Product SKU'}</strong></td>
                      <td style={{ textAlign: 'center', color: '#94a3b8' }}>{item.total_qty_pcs || 0} PCS</td>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#38bdf8' }}>{item.issued_qty_pcs || item.total_qty_pcs || 0} PCS</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number"
                          value={currentVal}
                          onChange={e => handleDispatchQtyChange(item.id, parseInt(e.target.value) || 0, item.total_qty_pcs || 999999)}
                          style={{ width: 110, padding: '0.4rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontWeight: 900, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleConfirm} style={{ fontWeight: 800 }}>
            <Check size={16} /> Confirm Dispatch & Assign Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};
