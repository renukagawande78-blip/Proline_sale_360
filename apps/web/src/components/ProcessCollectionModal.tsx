import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  PackageCheck,
  Calendar,
  Phone,
  User,
  AlertCircle
} from 'lucide-react';
import { Order, ReturnRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProcessCollectionModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCollection: (orderId: string, collectionData: {
    vehicle_number: string;
    tempo_number?: string;
    driver_name: string;
    driver_mobile: string;
    rental_agency_name?: string;
    transporter_name?: string;
    collected_at: string;
    collection_remarks: string;
    items: Array<{
      order_item_id?: string;
      collected_box_qty?: number;
      collected_loose_pcs?: number;
      collected_qty_pcs: number;
    }>;
  }) => void;
}

export const ProcessCollectionModal: React.FC<ProcessCollectionModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCollection
}) => {
  const { currentUser } = useAuth();

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [tempoNumber, setTempoNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [rentalAgencyName, setRentalAgencyName] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [collectionRemarks, setCollectionRemarks] = useState('');
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().substring(0, 10));

  // Item-level collection quantities
  const [itemQuantities, setItemQuantities] = useState<Record<string, { boxes: number; loose: number; total: number }>>({});

  useEffect(() => {
    if (!order || !isOpen || !order.return_request) {
      setVehicleNumber('');
      setTempoNumber('');
      setDriverName('');
      setDriverMobile('');
      setRentalAgencyName('');
      setTransporterName('');
      setCollectionRemarks('');
      setItemQuantities({});
      return;
    }

    const rr = order.return_request;
    setVehicleNumber(rr.vehicle_number || order.vehicle_number || '');
    setTempoNumber(rr.tempo_number || order.tempo_number || '');
    setDriverName(rr.driver_name || order.driver_name || '');
    setDriverMobile(rr.driver_mobile || order.driver_mobile || '');
    setRentalAgencyName(rr.rental_agency_name || order.rental_agency_name || '');
    setTransporterName(rr.transporter_name || '');
    setCollectionRemarks(rr.collection_remarks || '');
    setCollectedAt(new Date().toISOString().substring(0, 10));

    const initialQtys: Record<string, { boxes: number; loose: number; total: number }> = {};
    (rr.items || []).forEach(it => {
      const pcsPerBox = it.pcs_per_box && it.pcs_per_box > 0 ? it.pcs_per_box : 24;
      const key = it.order_item_id || it.id || it.product_name;
      initialQtys[key] = {
        boxes: it.box_qty || 0,
        loose: it.loose_pcs || 0,
        total: it.requested_qty_pcs || ((it.box_qty || 0) * pcsPerBox) + (it.loose_pcs || 0)
      };
    });
    setItemQuantities(initialQtys);
  }, [order, isOpen]);

  if (!isOpen || !order || !order.return_request) return null;

  const returnReq = order.return_request;
  const isFMCD = returnReq.segment === 'FMCD';

  const handleBoxChange = (key: string, boxes: number, pcsPerBox: number) => {
    setItemQuantities(prev => {
      const current = prev[key] || { boxes: 0, loose: 0, total: 0 };
      const b = Math.max(0, boxes || 0);
      const total = (b * pcsPerBox) + current.loose;
      return {
        ...prev,
        [key]: { boxes: b, loose: current.loose, total }
      };
    });
  };

  const handleLooseChange = (key: string, loose: number, pcsPerBox: number) => {
    setItemQuantities(prev => {
      const current = prev[key] || { boxes: 0, loose: 0, total: 0 };
      const l = Math.max(0, loose || 0);
      const total = isFMCD ? l : (current.boxes * pcsPerBox) + l;
      return {
        ...prev,
        [key]: { boxes: current.boxes, loose: l, total }
      };
    });
  };

  const handleSubmit = () => {
    if (!vehicleNumber.trim() && !driverName.trim()) {
      alert('Please enter at least the Vehicle Number or Driver Name.');
      return;
    }

    const itemsPayload = returnReq.items.map(it => {
      const key = it.order_item_id || it.id || it.product_name;
      const q = itemQuantities[key] || { boxes: it.box_qty || 0, loose: it.loose_pcs || 0, total: it.requested_qty_pcs };
      return {
        order_item_id: it.order_item_id || it.id,
        collected_box_qty: q.boxes,
        collected_loose_pcs: q.loose,
        collected_qty_pcs: q.total
      };
    });

    onConfirmCollection(order.id, {
      vehicle_number: vehicleNumber.trim(),
      tempo_number: tempoNumber.trim(),
      driver_name: driverName.trim(),
      driver_mobile: driverMobile.trim(),
      rental_agency_name: rentalAgencyName.trim(),
      transporter_name: transporterName.trim(),
      collected_at: collectedAt,
      collection_remarks: collectionRemarks.trim(),
      items: itemsPayload
    });

    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1150 }}>
      <div className="modal-card" style={{ maxWidth: 850, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(56,189,248,0.15)', padding: '0.4rem', borderRadius: 8, color: '#38bdf8' }}>
                <Truck size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Process Damaged / Return Stock Collection
                </h2>
                <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                  Assign collection vehicle, verify collected quantities, and confirm warehouse receipt
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.35rem' }}>
          
          {/* Order & Return Request Summary Banner */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 900, color: '#38bdf8', fontSize: '1rem' }}>Order: {order.order_number}</span>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 800 }}>
                  Admin Approved for Collection
                </span>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: returnReq.return_type === 'DAMAGED_RETURN' ? 'rgba(244,63,94,0.15)' : 'rgba(56,189,248,0.15)', color: returnReq.return_type === 'DAMAGED_RETURN' ? '#fb7185' : '#38bdf8', fontWeight: 800 }}>
                  {returnReq.return_type === 'DAMAGED_RETURN' ? 'Damaged Goods Return' : 'Stock Replacement'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 4 }}>
                Brand: <strong>{returnReq.brand_name || order.company_name}</strong> | Agency: <strong>{returnReq.agency_name || order.agency_name}</strong>
              </div>
              {returnReq.reason && (
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 2 }}>
                  Reason: <em>"{returnReq.reason}"</em>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', textAlign: 'right' }}>
              Approved By: <strong style={{ color: '#ffffff' }}>{returnReq.approved_by_name || 'Super Admin'}</strong>
            </div>
          </div>

          {/* Section 1: Vehicle & Driver Information */}
          <div style={{ background: '#141f36', border: '1px solid #1e293b', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Truck size={15} /> 1. COLLECTION VEHICLE &amp; DRIVER INFORMATION
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  VEHICLE / TEMPO NUMBER *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. GJ-05-BX-1234"
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  DRIVER NAME
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Bhai"
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  DRIVER CONTACT NUMBER
                </label>
                <input
                  type="text"
                  value={driverMobile}
                  onChange={e => setDriverMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  TRANSPORTER / RENTAL AGENCY
                </label>
                <input
                  type="text"
                  value={rentalAgencyName}
                  onChange={e => setRentalAgencyName(e.target.value)}
                  placeholder="e.g. Surat Fast Cargo"
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  COLLECTION DATE
                </label>
                <input
                  type="date"
                  value={collectedAt}
                  onChange={e => setCollectedAt(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items To Collect Verification */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <PackageCheck size={15} /> 2. VERIFY COLLECTED QUANTITIES (BOXES &amp; PIECES)
            </div>

            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style={{ textAlign: 'center', width: 90 }}>Approved Qty</th>
                    {!isFMCD && <th style={{ textAlign: 'center', width: 100 }}>Collected Boxes</th>}
                    <th style={{ textAlign: 'center', width: 100 }}>{isFMCD ? 'Collected Pcs' : 'Collected Loose'}</th>
                    <th style={{ textAlign: 'center', width: 110 }}>Total Verified (PCS)</th>
                  </tr>
                </thead>
                <tbody>
                  {returnReq.items.map(it => {
                    const key = it.order_item_id || it.id || it.product_name;
                    const q = itemQuantities[key] || { boxes: it.box_qty || 0, loose: it.loose_pcs || 0, total: it.requested_qty_pcs };
                    const pcsPerBox = it.pcs_per_box && it.pcs_per_box > 0 ? it.pcs_per_box : 24;

                    return (
                      <tr key={key}>
                        <td>
                          <strong style={{ color: '#f8fafc' }}>{it.product_name}</strong>
                          {it.is_custom_item && (
                            <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginLeft: 6 }}>
                              ★ Additional Brand SKU
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: '#fbbf24' }}>{it.requested_qty_pcs} PCS</strong>
                        </td>
                        {!isFMCD && (
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={q.boxes || ''}
                              onChange={e => handleBoxChange(key, parseInt(e.target.value) || 0, pcsPerBox)}
                              placeholder="0"
                              style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#38bdf8', fontWeight: 800, textAlign: 'center' }}
                            />
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={q.loose || ''}
                            onChange={e => handleLooseChange(key, parseInt(e.target.value) || 0, pcsPerBox)}
                            placeholder="0"
                            style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#fbbf24', fontWeight: 800, textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>
                            {q.total} PCS
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Collection Remarks */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
              DISPATCH WAREHOUSE COLLECTION REMARKS
            </label>
            <textarea
              rows={2}
              value={collectionRemarks}
              onChange={e => setCollectionRemarks(e.target.value)}
              placeholder="Remark..."
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <CheckCircle2 size={16} /> Mark Damaged &amp; Return Collected
          </button>
        </div>

      </div>
    </div>
  );
};
