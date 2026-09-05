import React, { useEffect, useState } from 'react';
import { X, Truck, Check, PackageCheck, Layers, Boxes } from 'lucide-react';
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
  
  // Item-wise dispatch box, loose, and total pcs state
  const [dispatchBoxes, setDispatchBoxes] = useState<Record<string, number>>({});
  const [dispatchLoose, setDispatchLoose] = useState<Record<string, number>>({});
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

    const initialBoxes: Record<string, number> = {};
    const initialLoose: Record<string, number> = {};
    const initialItems: Record<string, number> = {};

    (order.items || []).forEach(item => {
      const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
      const isFMCD = pcsPerBox === 1;
      const targetQty = (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) ? item.issued_qty_pcs : (item.total_qty_pcs || 0);

      let dBox = 0;
      let dLoose = 0;
      if (!isFMCD) {
        dBox = Math.floor(targetQty / pcsPerBox);
        dLoose = targetQty % pcsPerBox;
      } else {
        dBox = 0;
        dLoose = targetQty;
      }

      initialBoxes[item.id] = dBox;
      initialLoose[item.id] = dLoose;
      initialItems[item.id] = targetQty;
    });

    setDispatchBoxes(initialBoxes);
    setDispatchLoose(initialLoose);
    setDispatchItems(initialItems);
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleDispatchBoxChange = (itemId: string, boxVal: number, pcsPerBox: number) => {
    const validBox = Math.max(0, boxVal);
    const currentLoose = dispatchLoose[itemId] ?? 0;
    const newTotalPcs = (validBox * pcsPerBox) + currentLoose;
    setDispatchBoxes(prev => ({ ...prev, [itemId]: validBox }));
    setDispatchItems(prev => ({ ...prev, [itemId]: newTotalPcs }));
  };

  const handleDispatchLooseChange = (itemId: string, looseVal: number, pcsPerBox: number) => {
    const validLoose = Math.max(0, looseVal);
    const currentBox = dispatchBoxes[itemId] ?? 0;
    const newTotalPcs = (currentBox * pcsPerBox) + validLoose;
    setDispatchLoose(prev => ({ ...prev, [itemId]: validLoose }));
    setDispatchItems(prev => ({ ...prev, [itemId]: newTotalPcs }));
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

  // Calculations for bottom totals
  const itemsList = order.items || [];
  let totalOrderedBoxes = 0;
  let totalOrderedLoose = 0;
  let totalOrderedFree = 0;
  let totalOrderedPcs = 0;

  let totalBilledBoxes = 0;
  let totalBilledLoose = 0;
  let totalBilledPcs = 0;

  let totalDispatchBoxes = 0;
  let totalDispatchLoose = 0;
  let totalDispatchPcs = 0;

  itemsList.forEach(item => {
    const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
    const isFMCD = pcsPerBox === 1;

    // Ordered
    const ordBox = item.box_qty || 0;
    const ordLoose = item.loose_pcs || 0;
    const ordFree = item.free_pcs || 0;
    const ordPcs = item.total_qty_pcs || ((ordBox * pcsPerBox) + ordLoose + ordFree) || 0;
    totalOrderedBoxes += ordBox;
    totalOrderedLoose += ordLoose;
    totalOrderedFree += ordFree;
    totalOrderedPcs += ordPcs;

    // Billed
    const billedPcs = (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) ? item.issued_qty_pcs : (item.total_qty_pcs || 0);
    const bBox = !isFMCD ? Math.floor(billedPcs / pcsPerBox) : 0;
    const bLoose = !isFMCD ? (billedPcs % pcsPerBox) : billedPcs;
    totalBilledBoxes += bBox;
    totalBilledLoose += bLoose;
    totalBilledPcs += billedPcs;

    // Dispatch
    const dBox = dispatchBoxes[item.id] ?? bBox;
    const dLoose = dispatchLoose[item.id] ?? bLoose;
    const dPcs = dispatchItems[item.id] ?? billedPcs;
    totalDispatchBoxes += dBox;
    totalDispatchLoose += dLoose;
    totalDispatchPcs += dPcs;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 960, width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
        
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

        {/* Item-level Dispatch Allocation Table with Box, Loose PCS, Free PCS and Bottom Totals */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: 6 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageCheck size={16} color="#34d399" /> Order Items for Dispatch
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Verify quantities in Boxes, Loose PCS &amp; Free PCS
            </span>
          </div>

          <div className="data-table-container" style={{ border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' }}>
            <table className="data-table" style={{ fontSize: '0.8rem', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 160 }}>Product SKU</th>
                  <th style={{ textAlign: 'center', minWidth: 120 }}>Ordered Qty</th>
                  <th style={{ textAlign: 'center', minWidth: 130 }}>Billing Qty</th>
                  <th style={{ textAlign: 'center', minWidth: 180 }}>Dispatch Allocation</th>
                </tr>
              </thead>
              <tbody>
                {itemsList.map(item => {
                  const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1;
                  const isFMCD = pcsPerBox === 1;

                  // Ordered breakdown
                  const ordBox = item.box_qty || 0;
                  const ordLoose = item.loose_pcs || 0;
                  const ordFree = item.free_pcs || 0;
                  const ordTotalPcs = item.total_qty_pcs || ((ordBox * pcsPerBox) + ordLoose + ordFree) || 0;

                  // Billed breakdown
                  const billedPcs = (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) ? item.issued_qty_pcs : (item.total_qty_pcs || 0);
                  const bBox = !isFMCD ? Math.floor(billedPcs / pcsPerBox) : 0;
                  const bLoose = !isFMCD ? (billedPcs % pcsPerBox) : billedPcs;

                  // Dispatch state
                  const curBox = dispatchBoxes[item.id] ?? bBox;
                  const curLoose = dispatchLoose[item.id] ?? bLoose;
                  const curRowTotalPcs = (curBox * pcsPerBox) + curLoose;

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.825rem' }}>{item?.product_name || item?.product_code || 'Product SKU'}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                          {!isFMCD ? (
                            <span style={{ fontSize: '0.675rem', color: '#94a3b8', background: '#1e293b', padding: '1px 5px', borderRadius: 4 }}>
                              Pack: {pcsPerBox} pcs/box
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.675rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: 4 }}>
                              FMCD Unit
                            </span>
                          )}
                          {ordFree > 0 && (
                            <span style={{ fontSize: '0.675rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              🎁 {ordFree} Free PCS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ordered Qty */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.8rem' }}>
                          {!isFMCD ? (
                            <>
                              {ordBox > 0 ? `${ordBox} BOX` : ''}
                              {ordBox > 0 && ordLoose > 0 ? ', ' : ''}
                              {ordLoose > 0 ? `${ordLoose} PCS` : ''}
                              {ordBox === 0 && ordLoose === 0 ? `${ordTotalPcs} PCS` : ''}
                            </>
                          ) : (
                            `${ordTotalPcs} PCS`
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>
                          ({ordTotalPcs.toLocaleString()} PCS Total)
                        </div>
                      </td>

                      {/* Billing Qty */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.825rem' }}>
                          {!isFMCD ? (
                            <>
                              {bBox > 0 ? `${bBox} BOX` : ''}
                              {bBox > 0 && bLoose > 0 ? ', ' : ''}
                              {bLoose > 0 ? `${bLoose} PCS` : ''}
                              {bBox === 0 && bLoose === 0 ? '0 PCS' : ''}
                            </>
                          ) : (
                            `${billedPcs} PCS`
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#38bdf8', opacity: 0.8, marginTop: 1 }}>
                          ({billedPcs.toLocaleString()} PCS Total)
                        </div>
                      </td>

                      {/* Dispatch Allocation Inputs */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {!isFMCD && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: 1, fontWeight: 700 }}>Boxes</span>
                              <input 
                                type="number"
                                min="0"
                                value={curBox}
                                onChange={e => handleDispatchBoxChange(item.id, parseInt(e.target.value) || 0, pcsPerBox)}
                                style={{ width: 65, padding: '0.35rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#38bdf8', fontWeight: 800, textAlign: 'center', fontSize: '0.825rem' }}
                                aria-label="Dispatch box quantity"
                              />
                            </div>
                          )}
                          <div>
                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: 1, fontWeight: 700 }}>{isFMCD ? 'Dispatch (PCS)' : 'Loose PCS'}</span>
                            <input 
                              type="number"
                              min="0"
                              value={curLoose}
                              onChange={e => handleDispatchLooseChange(item.id, parseInt(e.target.value) || 0, pcsPerBox)}
                              style={{ width: isFMCD ? 95 : 65, padding: '0.35rem', background: '#0f172a', border: '1px solid #34d399', borderRadius: 6, color: '#34d399', fontWeight: 800, textAlign: 'center', fontSize: '0.825rem' }}
                              aria-label="Dispatch loose quantity"
                            />
                          </div>
                          <div style={{ minWidth: 65, textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: 1 }}>Total</span>
                            <strong style={{ fontSize: '0.8rem', color: '#34d399' }}>{curRowTotalPcs} PCS</strong>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* TABLE FOOTER WITH TOTAL BOX, TOTAL PCS, TOTAL FREE PCS */}
              <tfoot style={{ background: '#0b1329', borderTop: '2px solid #38bdf8' }}>
                <tr>
                  <td style={{ padding: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Boxes size={16} color="#38bdf8" />
                      <span>TOTAL SUMMARY</span>
                    </div>
                  </td>

                  {/* Total Ordered */}
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.825rem' }}>
                      {totalOrderedBoxes > 0 ? `${totalOrderedBoxes} BOX` : ''}
                      {totalOrderedBoxes > 0 && totalOrderedLoose > 0 ? ', ' : ''}
                      {totalOrderedLoose > 0 ? `${totalOrderedLoose} PCS` : ''}
                      {totalOrderedBoxes === 0 && totalOrderedLoose === 0 ? `${totalOrderedPcs} PCS` : ''}
                    </div>
                    {totalOrderedFree > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>
                        + {totalOrderedFree} Free PCS
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      ({totalOrderedPcs.toLocaleString()} PCS Total)
                    </div>
                  </td>

                  {/* Total Billed */}
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.825rem' }}>
                      {totalBilledBoxes > 0 ? `${totalBilledBoxes} BOX` : ''}
                      {totalBilledBoxes > 0 && totalBilledLoose > 0 ? ', ' : ''}
                      {totalBilledLoose > 0 ? `${totalBilledLoose} PCS` : ''}
                      {totalBilledBoxes === 0 && totalBilledLoose === 0 ? '0 PCS' : ''}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8', opacity: 0.8 }}>
                      ({totalBilledPcs.toLocaleString()} PCS Total)
                    </div>
                  </td>

                  {/* Total Dispatched */}
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ color: '#34d399', fontWeight: 900, fontSize: '0.875rem' }}>
                      {totalDispatchBoxes > 0 ? `${totalDispatchBoxes} BOX` : ''}
                      {totalDispatchBoxes > 0 && totalDispatchLoose > 0 ? ', ' : ''}
                      {totalDispatchLoose > 0 ? `${totalDispatchLoose} PCS` : ''}
                      {totalDispatchBoxes === 0 && totalDispatchLoose === 0 ? '0 PCS' : ''}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 800 }}>
                      ({totalDispatchPcs.toLocaleString()} PCS Total)
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Quick Total KPI Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }}>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.5rem 0.65rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.675rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>TOTAL BOXES</span>
              <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>{totalDispatchBoxes} BOX</strong>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.5rem 0.65rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.675rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>TOTAL LOOSE PCS</span>
              <strong style={{ fontSize: '0.9rem', color: '#34d399' }}>{totalDispatchLoose} PCS</strong>
            </div>
            {totalOrderedFree > 0 && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.5rem 0.65rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.675rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>TOTAL FREE PCS</span>
                <strong style={{ fontSize: '0.9rem', color: '#fbbf24' }}>{totalOrderedFree} PCS</strong>
              </div>
            )}
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.5rem 0.65rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.675rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>GRAND TOTAL PCS</span>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{totalDispatchPcs.toLocaleString()} PCS</strong>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleConfirm} style={{ fontWeight: 800 }}>
            <Check size={16} /> Confirm Dispatch &amp; Assign Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

