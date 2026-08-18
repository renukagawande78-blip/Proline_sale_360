import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { Order } from '../types';
import { MOCK_AGENCIES } from '../lib/supabase';

interface OrderInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const agency = MOCK_AGENCIES.find(a => a.id === order.agency_id) || {
    agency_name: order.agency_name || 'Agency Party',
    agency_code: 'AG-01',
    address: 'Commercial Complex, New Delhi',
    gst_number: '07AAAAA0000A1Z5',
    contact_person: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    email: 'contact@agency.com',
    area_name: order.area_name || 'Delhi NCR Territory',
    city: 'New Delhi'
  };

  const invoiceNumber = `INV-${order.order_number}`;
  const subtotal = order.total_amount;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card print-container" style={{ maxWidth: 880, padding: 0, overflow: 'hidden', background: '#0f172a' }}>
        
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle size={22} color="#34d399" />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Order Tax Invoice / Receipt</h2>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Order submitted successfully! Print or save PDF invoice for agency.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.4rem' }}
            >
              <Printer size={16} /> Print / Save PDF Invoice
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="invoice-sheet" style={{ padding: '2.5rem', background: '#ffffff', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
          
          {/* Header & Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                <div style={{ background: '#0f172a', color: 'white', fontWeight: 900, fontSize: '1.2rem', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>360</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a', margin: 0 }}>PROLINE OMS 360</h1>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#475569', margin: 0, fontWeight: 600 }}>ENTERPRISE B2B ORDER MANAGEMENT & LOGISTICS</p>
              <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '2px 0 0' }}>GSTIN: 07AAACP1234F1Z9 | PAN: AAACP1234F</p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ background: '#0f172a', color: 'white', padding: '0.35rem 0.85rem', borderRadius: 6, fontSize: '0.85rem', fontWeight: 800, display: 'inline-block', marginBottom: 6 }}>
                OFFICIAL B2B TAX INVOICE
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Invoice No: <span style={{ color: '#2563eb' }}>{invoiceNumber}</span></div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>Date: {order.order_date}</div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>Delivery Type: <strong style={{ color: '#0f172a' }}>{order.delivery_type || 'F.O.R'}</strong></div>
            </div>
          </div>

          {/* Billed To / Billed From Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>BILLED TO (AGENCY / PARTY):</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{order.agency_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>{agency.address || 'Commercial Complex'}</div>
              <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: 4 }}>
                <strong>Territory:</strong> {order.area_name || agency.area_name} | <strong>City:</strong> {agency.city || 'New Delhi'}
              </div>
              <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: 2 }}>
                <strong>GSTIN:</strong> {agency.gst_number || '07AAAAA0000A1Z5'} | <strong>Contact:</strong> {agency.contact_person} ({agency.mobile})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>ORDER DETAILS & BRAND SEGMENT:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Order Ref: {order.order_number}</div>
              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 2 }}>Segment: <strong>{order.company_name}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 2 }}>Sales Representative: {order.salesperson_name || 'Amit Kumar'}</div>
              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 2 }}>Status: <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 800, fontSize: '0.725rem' }}>{order.status}</span></div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.75rem', borderRadius: '6px 0 0 0' }}>#</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Product Line Item ID & Description</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Pack</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Box Qty</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Total Qty</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>MRP (₹)</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{item?.product_name || 'Product SKU'}</div>
                    <div style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 700 }}>ID: {item.id}</div>
                    {item.remark && <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>Note: {item.remark}</div>}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: '#475569' }}>{item.pcs_per_box} pcs/box</td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{item.box_qty}</td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#16a34a' }}>{item.total_qty_pcs}</td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{item.unit_price}</td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>₹{item.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Amount Calculation Summary & Tax Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: 4 }}>REMARKS & SPECIAL INSTRUCTIONS:</div>
              <div style={{ fontSize: '0.825rem', color: '#0f172a', fontStyle: 'italic' }}>
                {order.remarks || 'Standard delivery and billing schedule applies.'}
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.75rem', color: '#64748b' }}>
                <strong>Bank Wire Details:</strong> HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0000123
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: 4 }}>
                <span>Subtotal Value:</span>
                <span style={{ fontWeight: 700 }}>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: 4, color: '#475569' }}>
                <span>CGST (9%):</span>
                <span>₹{cgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: 6, color: '#475569' }}>
                <span>SGST (9%):</span>
                <span>₹{sgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, borderTop: '2px solid #0f172a', paddingTop: 6, color: '#2563eb' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
              <div>This is an official computer-generated B2B order invoice.</div>
              <div>Issued via Proline OMS 360 Enterprise Console.</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 40, borderBottom: '1px solid #0f172a', width: 180, marginBottom: 4 }}></div>
              <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#0f172a' }}>Authorized Signatory</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>For Proline OMS 360</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
