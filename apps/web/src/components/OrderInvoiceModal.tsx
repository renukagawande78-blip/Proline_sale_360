import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, SlidersHorizontal } from 'lucide-react';
import { Order, Agency } from '../types';
import { fetchAgenciesFromSupabaseTable, MOCK_AGENCIES } from '../lib/supabase';

interface OrderInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  agencies?: Agency[];
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, isOpen, onClose, agencies }) => {
  if (!isOpen || !order) return null;

  // Column and section visibility states
  const [showHsn, setShowHsn] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showBoxQty, setShowBoxQty] = useState(true);
  const [showFree, setShowFree] = useState(true);
  const [showRate, setShowRate] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showGstBreakup, setShowGstBreakup] = useState(true);
  const [showNetAmount, setShowNetAmount] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);

  const [liveAgency, setLiveAgency] = useState<any>(null);

  useEffect(() => {
    if (!order) return;
    if (agencies && agencies.length > 0) {
      const match = agencies.find(a => a.id === order.agency_id || a.agency_name === order.agency_name);
      if (match) {
        setLiveAgency(match);
        return;
      }
    }
    fetchAgenciesFromSupabaseTable().then(({ agencies: fetchedAgencies }) => {
      if (fetchedAgencies && fetchedAgencies.length > 0) {
        const match = fetchedAgencies.find(a => a.id === order.agency_id || a.agency_name === order.agency_name);
        if (match) setLiveAgency(match);
      }
    }).catch(err => console.warn('Supabase fetch error in invoice:', err));
  }, [order?.agency_id, order?.agency_name, agencies]);

  const agency = liveAgency || (agencies?.find(a => a.id === order.agency_id)) || MOCK_AGENCIES.find(a => a.id === order.agency_id) || {};

  // Clean Agency Address check: omit if null/empty/whitespace
  const rawAddress = agency?.address || agency?.agency_address || '';
  const cleanAddress = (typeof rawAddress === 'string' && rawAddress.trim() !== '' && rawAddress.toLowerCase() !== 'null') ? rawAddress.trim() : null;

  const billNumber = order.invoice_number || `WP/${order.order_number.replace(/[^0-9]/g, '').slice(-3) || '808'}`;
  const subtotal = order.total_amount;
  const taxableAmount = subtotal / 1.18;
  const totalCgst = (subtotal - taxableAmount) / 2;
  const totalSgst = totalCgst;

  // Preset Configurations
  const applyPreset = (preset: 'FULL' | 'DISPATCH_CHALLAN' | 'MRP_ONLY') => {
    if (preset === 'FULL') {
      setShowHsn(true);
      setShowMrp(true);
      setShowBoxQty(true);
      setShowFree(true);
      setShowRate(true);
      setShowAmount(true);
      setShowGstBreakup(true);
      setShowNetAmount(true);
      setShowQrCode(true);
    } else if (preset === 'DISPATCH_CHALLAN') {
      setShowHsn(false);
      setShowMrp(false);
      setShowBoxQty(true);
      setShowFree(true);
      setShowRate(false);
      setShowAmount(false);
      setShowGstBreakup(false);
      setShowNetAmount(false);
      setShowQrCode(false);
    } else if (preset === 'MRP_ONLY') {
      setShowHsn(true);
      setShowMrp(true);
      setShowBoxQty(true);
      setShowFree(true);
      setShowRate(false);
      setShowAmount(false);
      setShowGstBreakup(false);
      setShowNetAmount(false);
      setShowQrCode(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card print-container" style={{ maxWidth: 1000, width: '98vw', padding: 0, overflow: 'hidden', background: '#0f172a', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print" style={{ padding: '0.85rem 1.25rem', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle size={22} color="#34d399" />
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>PROLINE SALES AGENCY - Tax Invoice & Sales Bill</h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>Order #{order.order_number} | Agency: <strong style={{ color: '#38bdf8' }}>{order.agency_name}</strong></p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                onClick={handlePrint}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.825rem', gap: '0.4rem', fontWeight: 800 }}
              >
                <Printer size={16} /> Print / Save PDF
              </button>
              <button 
                onClick={onClose}
                style={{ background: '#334155', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.4rem', borderRadius: 6 }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Column Visibility & Presets */}
          <div style={{ marginTop: '0.65rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                <SlidersHorizontal size={13} /> CUSTOMIZE BILL / INVOICE COLUMNS:
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>Presets:</span>
                <button 
                  type="button"
                  onClick={() => applyPreset('FULL')}
                  style={{ background: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '0.675rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, cursor: 'pointer' }}
                >
                  Full Tax Invoice
                </button>
                <button 
                  type="button"
                  onClick={() => applyPreset('DISPATCH_CHALLAN')}
                  style={{ background: '#0f172a', border: '1px solid #fbbf24', color: '#fbbf24', fontSize: '0.675rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, cursor: 'pointer' }}
                >
                  Delivery Slip (Hide Rates & Taxes)
                </button>
                <button 
                  type="button"
                  onClick={() => applyPreset('MRP_ONLY')}
                  style={{ background: '#0f172a', border: '1px solid #a855f7', color: '#a855f7', fontSize: '0.675rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, cursor: 'pointer' }}
                >
                  MRP Only
                </button>
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.725rem', color: '#e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showHsn} onChange={e => setShowHsn(e.target.checked)} />
                HSN Code
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMrp} onChange={e => setShowMrp(e.target.checked)} />
                DP / MRP
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showBoxQty} onChange={e => setShowBoxQty(e.target.checked)} />
                Qty / Boxes
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showFree} onChange={e => setShowFree(e.target.checked)} />
                Free Pcs
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#34d399', fontWeight: 700 }}>
                <input type="checkbox" checked={showRate} onChange={e => setShowRate(e.target.checked)} />
                Rate (₹)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#38bdf8', fontWeight: 700 }}>
                <input type="checkbox" checked={showAmount} onChange={e => setShowAmount(e.target.checked)} />
                Amount (₹)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#f59e0b', fontWeight: 700 }}>
                <input type="checkbox" checked={showGstBreakup} onChange={e => setShowGstBreakup(e.target.checked)} />
                GST % & Tax Breakup
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#f43f5e', fontWeight: 700 }}>
                <input type="checkbox" checked={showNetAmount} onChange={e => setShowNetAmount(e.target.checked)} />
                Net Amount
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showQrCode} onChange={e => setShowQrCode(e.target.checked)} />
                QR Code
              </label>
            </div>
          </div>
        </div>

        {/* Printable Official Invoice Sheet matching exact Proline Format */}
        <div id="invoice-sheet" style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', background: '#ffffff', color: '#000000', fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
          
          {/* Outer Border Container */}
          <div style={{ border: '2px solid #000000', borderRadius: 2 }}>
            
            {/* Top Invocation Header Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 8px', fontSize: '0.675rem', fontWeight: 700, borderBottom: '1px solid #000000' }}>
              <span style={{ color: '#dc2626' }}>: SHREE GANESHAY NAMAH:</span>
              <span style={{ color: '#475569', fontSize: '0.6rem' }}>29a7f572006502745f481cfa273745db1b98f6777d19ee4f321300fc7531bcb9</span>
              <span style={{ color: '#000000' }}>Generate by: <strong>PROLINE OMS</strong></span>
            </div>

            {/* Proline Sales Agency Main Banner */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '2px solid #000000' }}>
              {/* Circular Logo Badge */}
              <img 
                src="/proline-logo.png" 
                alt="PROLINE SALES AGENCY" 
                style={{ 
                  width: 85, 
                  height: 85, 
                  objectFit: 'contain', 
                  marginRight: 15,
                  flexShrink: 0 
                }} 
              />

              {/* Company Title & Registered Address */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#000000', margin: 0, letterSpacing: '0.03em', lineHeight: 1.1 }}>
                  PROLINE SALES AGENCY
                </h1>
                <p style={{ fontSize: '0.725rem', color: '#1e293b', margin: '3px 0 2px', fontWeight: 600, lineHeight: 1.3 }}>
                  Plot no.6, TP Block 69-70, Ladvi Patiya, Opp. Blueroof Industries, Puna-Valthan Canal Rd., Ladvi, Surat-394325
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#000000', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: 2 }}>
                  <span><strong>GST No.:</strong> 24AANFP1334M1Z2</span>
                  <span><strong>Contact:</strong> 9825148776 &nbsp; 9377648776</span>
                  <span><strong>Email:</strong> info@prolinesales.in</span>
                </div>
              </div>
            </div>

            {/* Sub-Header Bar: Debit Memo | TAX INVOICE | Original */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', background: '#e2e8f0', borderBottom: '2px solid #000000', padding: '3px 8px', fontWeight: 900, fontSize: '0.85rem' }}>
              <div style={{ textAlign: 'left' }}>Debit Memo</div>
              <div style={{ textAlign: 'center', fontSize: '0.95rem', letterSpacing: '0.08em' }}>
                {showRate ? 'TAX INVOICE' : 'DELIVERY DISPATCH CHALLAN'}
              </div>
              <div style={{ textAlign: 'right' }}>Original</div>
            </div>

            {/* Billed To / Party Section & Invoice Details 2-Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', borderBottom: '2px solid #000000' }}>
              
              {/* Left Column: Billed To / Party */}
              <div style={{ padding: '8px 10px', borderRight: '2px solid #000000', fontSize: '0.775rem', lineHeight: 1.35 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div><strong>M/s. : </strong> <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{order.agency_name}</span></div>
                  <div style={{ fontSize: '0.725rem' }}><strong>CODE:</strong> 0</div>
                </div>

                {/* ONLY SHOW ADDRESS IF AGENCY HAS A VALID ADDRESS RECORD */}
                {cleanAddress && (
                  <div style={{ textTransform: 'uppercase', fontWeight: 600, color: '#1e293b' }}>
                    {cleanAddress}
                  </div>
                )}

                <div style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {order.area_name && <span>{order.area_name}, </span>}
                  {agency?.city && <span>{agency.city}</span>}
                  {agency?.pincode ? ` - ${agency.pincode}` : ''}
                </div>

                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span><strong>Place Of Supply:</strong> 24 - Gujarat</span>
                  {agency?.phone && <span><strong>(M):</strong> {agency.phone}</span>}
                </div>

                <div style={{ marginTop: 2, fontWeight: 900 }}>
                  GSTN: {agency?.gst_number || 'UNREGISTERED'}
                </div>
              </div>

              {/* Right Column: Order & Bill Details */}
              <div style={{ padding: '8px 10px', fontSize: '0.775rem', lineHeight: 1.35, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div><strong>Order No.:</strong> <span style={{ fontWeight: 900, color: '#000000' }}>{order.order_number}</span></div>
                  <div style={{ marginTop: 2 }}><strong>Order Date:</strong> <strong>{order.order_date}</strong></div>
                  <div style={{ marginTop: 3, fontSize: '0.75rem', color: '#1e293b' }}>Company / Brand: <strong>{order.company_name}</strong></div>
                  <div style={{ marginTop: 2, fontSize: '0.75rem', color: '#1e293b' }}>Delivery Mode: <strong>{order.delivery_type || 'F.O.R'}</strong></div>
                  <div style={{ marginTop: 2, fontSize: '0.75rem', color: '#1e293b' }}>Salesperson: <strong>{order.salesperson_name || 'Amit Kumar'}</strong></div>
                </div>

                {/* QR Code Graphic Box */}
                {showQrCode && (
                  <div style={{ width: 75, height: 75, border: '1.5px solid #000000', padding: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: 8, background: '#ffffff' }}>
                    <svg viewBox="0 0 100 100" width="65" height="65">
                      <rect width="100" height="100" fill="white" />
                      <rect x="5" y="5" width="30" height="30" fill="black" />
                      <rect x="10" y="10" width="20" height="20" fill="white" />
                      <rect x="15" y="15" width="10" height="10" fill="black" />
                      <rect x="65" y="5" width="30" height="30" fill="black" />
                      <rect x="70" y="10" width="20" height="20" fill="white" />
                      <rect x="75" y="15" width="10" height="10" fill="black" />
                      <rect x="5" y="65" width="30" height="30" fill="black" />
                      <rect x="10" y="70" width="20" height="20" fill="white" />
                      <rect x="15" y="75" width="10" height="10" fill="black" />
                      <rect x="45" y="15" width="10" height="25" fill="black" />
                      <rect x="45" y="55" width="25" height="10" fill="black" />
                      <rect x="75" y="55" width="20" height="35" fill="black" />
                    </svg>
                  </div>
                )}
              </div>

            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.725rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #000000', textAlign: 'center', fontWeight: 900 }}>
                  <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 26 }}>Sr.</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '4px 6px', textAlign: 'left' }}>Product Name</th>
                  {showHsn && <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 60 }}>HSN</th>}
                  {showMrp && <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 45 }}>DP</th>}
                  {showBoxQty && <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 45 }}>Qty</th>}
                  {showFree && <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 35 }}>Free</th>}
                  {showRate && <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 55, textAlign: 'right' }}>Rate</th>}
                  {showAmount && <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 60, textAlign: 'right' }}>Amount</th>}
                  {showGstBreakup && (
                    <>
                      <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 40 }}>GST%</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 50 }}>CGST</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '4px', width: 50 }}>SGST</th>
                    </>
                  )}
                  {showNetAmount && <th style={{ padding: '4px 6px', width: 65, textAlign: 'right' }}>Net Amount</th>}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const lineTotal = item.total_price || (item.box_qty * item.pcs_per_box * item.unit_price);
                  const lineTaxable = lineTotal / 1.18;
                  const lineCgst = (lineTotal - lineTaxable) / 2;
                  const lineSgst = lineCgst;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <td style={{ borderRight: '1px solid #000000', padding: '4px', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '4px 6px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 800 }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.625rem', color: '#64748b' }}>Pack: {item.pcs_per_box} pcs/box {item.remark ? `| Note: ${item.remark}` : ''}</div>
                      </td>
                      {showHsn && <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>84501100</td>}
                      {showMrp && <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{item.unit_price}</td>}
                      {showBoxQty && <td style={{ borderRight: '1px solid #000000', padding: '4px', fontWeight: 800 }}>{item.box_qty}</td>}
                      {showFree && <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{item.free_pcs || 0}</td>}
                      {showRate && <td style={{ borderRight: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{lineTaxable.toFixed(2)}</td>}
                      {showAmount && <td style={{ borderRight: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{lineTaxable.toFixed(2)}</td>}
                      {showGstBreakup && (
                        <>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>18%</td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{lineCgst.toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{lineSgst.toFixed(2)}</td>
                        </>
                      )}
                      {showNetAmount && (
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800 }}>
                          ₹{lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #000000' }}>
                  <td colSpan={2} style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'left' }}>
                    TOTAL SUMMARY ({order.items?.length || 0} ITEMS)
                  </td>
                  {showHsn && <td style={{ borderRight: '1px solid #000000' }}></td>}
                  {showMrp && <td style={{ borderRight: '1px solid #000000' }}></td>}
                  {showBoxQty && <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{order.total_box_qty} Boxes</td>}
                  {showFree && <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center' }}>0</td>}
                  {showRate && <td style={{ borderRight: '1px solid #000000' }}></td>}
                  {showAmount && <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'right' }}>₹{taxableAmount.toFixed(2)}</td>}
                  {showGstBreakup && (
                    <>
                      <td style={{ borderRight: '1px solid #000000' }}></td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px' }}>₹{totalCgst.toFixed(2)}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px' }}>₹{totalSgst.toFixed(2)}</td>
                    </>
                  )}
                  {showNetAmount && (
                    <td style={{ padding: '6px', textAlign: 'right', fontSize: '0.85rem', color: '#000000' }}>
                      ₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>

            {/* Bottom Remarks & Authorized Signatory */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderTop: '2px solid #000000', padding: '8px 10px', fontSize: '0.725rem' }}>
              <div>
                <strong>Terms & Remarks: </strong>
                <span>{order.remarks || 'Goods once sold will not be taken back or exchanged. Standard dispatch terms apply.'}</span>
                <div style={{ marginTop: 4, color: '#475569', fontSize: '0.675rem' }}>
                  Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0000123 | Surat Main Branch
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900 }}>For PROLINE SALES AGENCY</div>
                <div style={{ height: 35, width: 140, borderBottom: '1px solid #000000', marginTop: 4 }}></div>
                <div style={{ fontSize: '0.675rem', color: '#475569', marginTop: 2 }}>Authorized Signatory</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
