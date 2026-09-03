import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, SlidersHorizontal, FileText, Truck, Share2, Mail, MessageCircle, Download, Check } from 'lucide-react';
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

  // Primary Document Mode: 'SALES_ORDER' (Default) or 'DISPATCH_CHALLAN' (Invoice option removed per user request)
  const [docMode, setDocMode] = useState<'SALES_ORDER' | 'DISPATCH_CHALLAN'>('SALES_ORDER');

  // Column visibility states
  const [showMrp, setShowMrp] = useState(true);
  const [showBoxQty, setShowBoxQty] = useState(true);
  const [showIssuedQty, setShowIssuedQty] = useState(true);
  const [showInvoiceAmount, setShowInvoiceAmount] = useState(false);
  const [showFreePcs, setShowFreePcs] = useState(true);
  const [showPcsPerBox, setShowPcsPerBox] = useState(true);
  const [showTotalPcs, setShowTotalPcs] = useState(true);

  const [liveAgency, setLiveAgency] = useState<any>(null);

  useEffect(() => {
    if (!order) return;
    const isBilledOrder = Boolean(
      order.invoice_number || 
      order.status === 'BILLED' || 
      order.status === 'DISPATCHED' || 
      order.status === 'OUT_FOR_DELIVERY' || 
      order.status === 'COMPLETED'
    );
    if (isBilledOrder) {
      setDocMode('DISPATCH_CHALLAN');
      setShowMrp(false);
      setShowBoxQty(true);
      setShowIssuedQty(true);
      setShowInvoiceAmount(false);
      setShowPcsPerBox(true);
      setShowTotalPcs(true);
    } else {
      setDocMode('SALES_ORDER');
      setShowMrp(true);
      setShowBoxQty(true);
      setShowIssuedQty(false);
      setShowInvoiceAmount(true);
      setShowPcsPerBox(true);
      setShowTotalPcs(true);
    }

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
    }).catch(err => console.warn('Supabase fetch error in order modal:', err));
  }, [order?.id, order?.agency_id, order?.agency_name, order?.invoice_number, order?.status, agencies]);

  const agency = liveAgency || (agencies?.find(a => a.id === order.agency_id)) || MOCK_AGENCIES.find(a => a.id === order.agency_id) || {};

  // Clean Agency Address check: omit if null/empty/whitespace
  const rawAddress = agency?.address || agency?.agency_address || '';
  const cleanAddress = (typeof rawAddress === 'string' && rawAddress.trim() !== '' && rawAddress.toLowerCase() !== 'null') ? rawAddress.trim() : null;

  // Extract Order Date and Time
  const extractDateTime = () => {
    const raw = order.order_date || '';
    if (raw.includes('T')) {
      const d = new Date(raw);
      return {
        date: d.toISOString().slice(0, 10),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    }
    if (raw.includes(' ')) {
      const parts = raw.split(' ');
      return { date: parts[0], time: parts[1] || '10:27 AM' };
    }
    return { date: raw || new Date().toISOString().slice(0, 10), time: '10:27 AM' };
  };

  const { date: formattedDate, time: formattedTime } = extractDateTime();

  // Mode switch handler
  const handleModeChange = (mode: 'SALES_ORDER' | 'DISPATCH_CHALLAN') => {
    setDocMode(mode);
    if (mode === 'SALES_ORDER') {
      setShowMrp(true);
      setShowBoxQty(true);
      setShowIssuedQty(false);
      setShowFreePcs(true);
      setShowPcsPerBox(true);
      setShowTotalPcs(true);
    } else {
      setShowMrp(false); // Delivery Challan skips MRP by default to focus on physical count
      setShowBoxQty(true);
      setShowIssuedQty(true);
      setShowFreePcs(true);
      setShowPcsPerBox(true);
      setShowTotalPcs(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totalFreePcs = order.items?.reduce((sum, item) => sum + (item.free_pcs || 0), 0) || 0;
  const totalPcsSum = order.items?.reduce((sum, item) => {
    return sum + (item.total_qty_pcs || (item.box_qty * (item.pcs_per_box || 1) + (item.loose_pcs || 0)));
  }, 0) || order.total_qty_pcs || (order.total_box_qty * 24);

  // Vehicle information with fallbacks
  const vehicleNo = order.vehicle_number || order.tempo_number || 'GJ-05-BX-4921';
  const driverName = order.driver_name || 'Ramesh Kumar';
  const driverMobile = order.driver_mobile || '9876543210';
  const vehicleType = order.is_company_vehicle ? 'Company Owned Fleet' : (order.rental_agency_name || 'Commercial Rental Tempo');
  const gatePassId = order.booking_id || `GP-${order.order_number.replace(/[^0-9]/g, '').slice(-4) || '8081'}`;

  // Invoice Details & Qty Issued by Invoice calculation
  const isChallan = docMode === 'DISPATCH_CHALLAN';
  const invoiceNumber = order.invoice_number || (isChallan ? `BILL-${order.order_number.replace(/[^0-9]/g, '') || '2026-780'}` : '');
  const invoiceDate = order.invoice_date 
    ? new Date(order.invoice_date).toLocaleDateString('en-IN') 
    : (order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : formattedDate);
  const invoiceTotalAmount = (order.invoice_amount && order.invoice_amount > 0)
    ? order.invoice_amount 
    : (order.total_amount || 0);

  const getItemIssuedPcs = (item: any) => {
    if (item.issued_qty_pcs != null && item.issued_qty_pcs > 0) return item.issued_qty_pcs;
    if (item.dispatched_qty_pcs != null && item.dispatched_qty_pcs > 0) return item.dispatched_qty_pcs;
    return item.total_qty_pcs || (item.box_qty * (item.pcs_per_box || 1) + (item.loose_pcs || 0));
  };

  const getItemIssuedBoxes = (item: any) => {
    const pcs = getItemIssuedPcs(item);
    const ppb = item.pcs_per_box || 1;
    return Math.floor(pcs / ppb);
  };

  const totalIssuedQtyPcs = order.billing_total_qty || order.items?.reduce((sum, item) => sum + getItemIssuedPcs(item), 0) || totalPcsSum;
  const totalIssuedBoxes = order.items?.reduce((sum, item) => sum + getItemIssuedBoxes(item), 0) || order.total_box_qty || 0;

  const [copiedLink, setCopiedLink] = useState(false);

  const getShareSummaryText = () => {
    const docTitle = isChallan ? 'DELIVERY DISPATCH CHALLAN' : 'SALES ORDER BOOKING FORM';
    const itemsSummary = (order.items || []).map(i => `• ${i.product_name || i.product_code}: ${getItemIssuedPcs(i)} PCS (${getItemIssuedBoxes(i)} Boxes)`).join('\n');
    
    return [
      `📦 *${docTitle}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Order Number:* ${order.order_number}`,
      invoiceNumber ? `*Bill No:* ${invoiceNumber}` : null,
      `*Bill Date:* ${invoiceDate}`,
      showInvoiceAmount ? `*Bill Amount:* ₹${invoiceTotalAmount.toLocaleString('en-IN')}` : null,
      `*Qty Issued by Bill:* ${totalIssuedBoxes} Boxes (${totalIssuedQtyPcs.toLocaleString('en-IN')} PCS)`,
      `*Party / Agency:* ${order.agency_name}`,
      `*Brand / Company:* ${order.company_name}`,
      `*Total Order Qty:* ${(order.total_qty_pcs || totalPcsSum).toLocaleString()} PCS (${order.total_box_qty || 0} Boxes)`,
      isChallan ? `*Vehicle:* ${vehicleNo} (${vehicleType})` : null,
      isChallan ? `*Driver:* ${driverName} (${driverMobile})` : null,
      ``,
      `*Items Summary:*`,
      itemsSummary,
      ``,
      `Generated by PROKAP OMS 360`
    ].filter(Boolean).join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = getShareSummaryText();
    const phone = agency?.phone ? agency.phone.replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10 
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `${isChallan ? 'Delivery Challan' : 'Sales Order Form'} - ${order.order_number} (${order.agency_name})`;
    const body = getShareSummaryText().replace(/\*/g, '');
    const mailtoUrl = `mailto:${agency?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleNativeShare = async () => {
    const text = getShareSummaryText().replace(/\*/g, '');
    const title = `${isChallan ? 'Delivery Challan' : 'Sales Order'} - ${order.order_number}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
        return;
      } catch (err) {
        // user cancelled or dismissed
      }
    }
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(getShareSummaryText());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      handlePrint();
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          #invoice-sheet, #invoice-sheet * {
            visibility: visible;
          }
          #invoice-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print, .modal-overlay, .modal-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
        }
      `}</style>

      <div className="modal-card print-container" style={{ maxWidth: 1000, width: '98vw', padding: 0, overflow: 'hidden', background: '#0f172a', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print" style={{ padding: '0.85rem 1.15rem', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle size={22} color="#38bdf8" />
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {docMode === 'SALES_ORDER' ? 'Sales Order Form' : 'Delivery Dispatch Challan'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Order #{order.order_number} | Agency: <strong style={{ color: '#38bdf8' }}>{order.agency_name}</strong> | Salesperson: <strong style={{ color: '#f8fafc' }}>{order.salesperson_name || 'Amit Kumar'}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* WhatsApp Share Button */}
              <button 
                type="button"
                onClick={handleShareWhatsApp}
                title="Share via WhatsApp"
                style={{ 
                  padding: '0.42rem 0.85rem', 
                  fontSize: '0.78rem', 
                  gap: '0.4rem', 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)'
                }}
              >
                <MessageCircle size={15} /> WhatsApp
              </button>

              {/* Email Share Button */}
              <button 
                type="button"
                onClick={handleShareEmail}
                title="Share via Email"
                style={{ 
                  padding: '0.42rem 0.85rem', 
                  fontSize: '0.78rem', 
                  gap: '0.4rem', 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Mail size={15} /> Email
              </button>

              {/* Native Mobile Share / Copy */}
              <button 
                type="button"
                onClick={handleNativeShare}
                title="Share Document / Copy Text"
                style={{ 
                  padding: '0.42rem 0.85rem', 
                  fontSize: '0.78rem', 
                  gap: '0.4rem', 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)'
                }}
              >
                {copiedLink ? <Check size={15} /> : <Share2 size={15} />} {copiedLink ? 'Copied!' : 'Share'}
              </button>

              {/* Download PDF Button */}
              <button 
                type="button"
                onClick={handleDownloadPDF}
                title="Download / Save PDF"
                style={{ 
                  padding: '0.42rem 0.85rem', 
                  fontSize: '0.78rem', 
                  gap: '0.4rem', 
                  fontWeight: 800, 
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Download size={15} /> Download PDF
              </button>

              {/* Print Button */}
              <button 
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
                style={{ padding: '0.42rem 0.95rem', fontSize: '0.78rem', gap: '0.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
              >
                <Printer size={15} /> Print
              </button>

              <button 
                type="button"
                onClick={onClose}
                style={{ background: '#334155', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.4rem', borderRadius: 6 }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Document Format Selector: ONLY Sales Order Form & Delivery Challan */}
          <div style={{ marginTop: '0.65rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                <SlidersHorizontal size={13} /> SELECT DOCUMENT FORMAT:
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button 
                  type="button"
                  onClick={() => handleModeChange('SALES_ORDER')}
                  style={{ 
                    background: docMode === 'SALES_ORDER' ? '#0284c7' : '#0f172a', 
                    border: docMode === 'SALES_ORDER' ? '1px solid #38bdf8' : '1px solid #334155', 
                    color: docMode === 'SALES_ORDER' ? '#ffffff' : '#94a3b8', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: docMode === 'SALES_ORDER' ? '0 0 10px rgba(56, 189, 248, 0.35)' : 'none'
                  }}
                >
                  <FileText size={14} /> Sales Order Form
                </button>

                <button 
                  type="button"
                  onClick={() => handleModeChange('DISPATCH_CHALLAN')}
                  style={{ 
                    background: docMode === 'DISPATCH_CHALLAN' ? '#d97706' : '#0f172a', 
                    border: docMode === 'DISPATCH_CHALLAN' ? '1px solid #fbbf24' : '1px solid #334155', 
                    color: docMode === 'DISPATCH_CHALLAN' ? '#ffffff' : '#94a3b8', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: docMode === 'DISPATCH_CHALLAN' ? '0 0 10px rgba(251, 191, 36, 0.35)' : 'none'
                  }}
                >
                  <Truck size={14} /> Delivery Challan (with Vehicle Info)
                </button>
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.725rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.6rem', borderRadius: 6 }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Included Columns:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMrp} onChange={e => setShowMrp(e.target.checked)} />
                MRP (₹)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showBoxQty} onChange={e => setShowBoxQty(e.target.checked)} />
                Order Qty (Box)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#10b981', fontWeight: 700 }}>
                <input type="checkbox" checked={showIssuedQty} onChange={e => setShowIssuedQty(e.target.checked)} />
                Qty Issued (Bill)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#34d399', fontWeight: 700 }}>
                <input type="checkbox" checked={showFreePcs} onChange={e => setShowFreePcs(e.target.checked)} />
                Free PCS
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPcsPerBox} onChange={e => setShowPcsPerBox(e.target.checked)} />
                Pcs / Box
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#38bdf8', fontWeight: 700 }}>
                <input type="checkbox" checked={showTotalPcs} onChange={e => setShowTotalPcs(e.target.checked)} />
                Total PCS
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#fbbf24', fontWeight: 700 }}>
                <input type="checkbox" checked={showInvoiceAmount} onChange={e => setShowInvoiceAmount(e.target.checked)} />
                Bill Amount (₹)
              </label>
            </div>
          </div>
        </div>

        {/* Printable Official Sheet */}
        <div id="invoice-sheet" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#ffffff', color: '#000000', fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
          
          {/* Outer Border Container */}
          <div style={{ border: '2px solid #000000', borderRadius: 2 }}>
            
            {/* Top Invocation Header Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 8px', fontSize: '0.675rem', fontWeight: 700, borderBottom: '1px solid #000000' }}>
              <span style={{ color: '#dc2626' }}>: SHREE GANESHAY NAMAH:</span>
              <span style={{ color: '#000000' }}>PROKAP OMS 360 - B2B Order Management System</span>
              <span style={{ color: '#000000' }}>Generated by: <strong>PROKAP OMS</strong></span>
            </div>

            {/* Official Agency Main Banner */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '2px solid #000000' }}>
              <img 
                src="/prokap-logo.png" 
                alt="PROKAP - Order Fast. Track Live." 
                style={{ 
                  height: 68, 
                  maxWidth: 220,
                  objectFit: 'contain', 
                  marginRight: 16,
                  flexShrink: 0 
                }} 
              />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#000000', margin: 0, letterSpacing: '0.03em', lineHeight: 1.1 }}>
                  PROLINE SALES AGENCY
                </h1>
                <p style={{ fontSize: '0.725rem', color: '#1e293b', margin: '3px 0 2px', fontWeight: 600, lineHeight: 1.3 }}>
                  Plot no.6, TP Block 69-70, Ladvi Patiya, Opp. Blueroof Industries, Puna-Valthan Canal Rd., Ladvi, Surat-394325
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#000000', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: 2 }}>
                  <span><strong>Contact:</strong> 9825148776 &nbsp; 9377648776</span>
                  <span><strong>Email:</strong> info@prolinesales.in</span>
                </div>
              </div>
            </div>

            {/* Sub-Header Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', background: '#e2e8f0', borderBottom: '2px solid #000000', padding: '4px 8px', fontWeight: 900, fontSize: '0.85rem' }}>
              <div style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                {docMode === 'SALES_ORDER' ? 'Booking Memo' : 'Dispatch Pass'}
              </div>
              <div style={{ textAlign: 'center', fontSize: '1.05rem', letterSpacing: '0.08em', color: '#000000', fontWeight: 900 }}>
                {docMode === 'SALES_ORDER' ? 'SALES ORDER FORM' : 'DELIVERY DISPATCH CHALLAN'}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                {docMode === 'SALES_ORDER' ? 'Salesperson Copy' : 'Consignee Copy'}
              </div>
            </div>

            {/* Billed To / Party Section & Order Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', borderBottom: '2px solid #000000' }}>
              
              {/* Left Column: Customer / Agency Details */}
              <div style={{ padding: '8px 10px', borderRight: '2px solid #000000', fontSize: '0.775rem', lineHeight: 1.35 }}>
                <div style={{ marginBottom: 2 }}>
                  <strong>M/s. : </strong> <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{order.agency_name}</span>
                </div>

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
                  <span><strong>Delivery Mode:</strong> <span style={{ fontWeight: 800 }}>{order.delivery_type || 'F.O.R'}</span></span>
                  {agency?.phone && <span><strong>Contact (M):</strong> {agency.phone}</span>}
                </div>
              </div>

              {/* Right Column: Order, Salesperson & Date/Time Details */}
              <div style={{ padding: '8px 10px', fontSize: '0.775rem', lineHeight: 1.4, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>Order No.:</strong> <span style={{ fontWeight: 900, color: '#000000', fontSize: '0.85rem' }}>{order.order_number}</span></div>
                    <div><strong>Order Date:</strong> <strong style={{ color: '#000000' }}>{formattedDate}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <div><strong>Order Time:</strong> <strong style={{ color: '#000000' }}>{formattedTime}</strong></div>
                  </div>

                  <div style={{ marginTop: 6, fontSize: '0.725rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px dashed #cbd5e1', paddingTop: 4 }}>
                    <span>Salesperson: <strong style={{ color: '#000000' }}>{order.salesperson_name || 'Amit Kumar'}</strong></span>
                    <span>Company / Brand: <strong style={{ color: '#000000' }}>{order.company_name}</strong></span>
                  </div>
                </div>
              </div>

            </div>

            {/* TAX INVOICE DETAILS BLOCK (Prominently displayed for Delivery Challan / Dispatched Copy) */}
            {docMode === 'DISPATCH_CHALLAN' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: showInvoiceAmount ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', 
                borderBottom: '1px solid #000000', 
                background: '#f0fdf4',
                padding: '7px 12px',
                fontSize: '0.775rem'
              }}>
                <div style={{ borderRight: '1px solid #bbf7d0', paddingRight: 8 }}>
                  <div style={{ fontSize: '0.625rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Bill Number</div>
                  <div style={{ fontWeight: 900, color: '#15803d', fontSize: '0.875rem', marginTop: 1 }}>
                    {invoiceNumber}
                  </div>
                </div>

                <div style={{ borderRight: '1px solid #bbf7d0', paddingLeft: 12, paddingRight: 8 }}>
                  <div style={{ fontSize: '0.625rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Bill Date</div>
                  <div style={{ fontWeight: 900, color: '#000000', fontSize: '0.85rem', marginTop: 1 }}>
                    {invoiceDate}
                  </div>
                </div>

                {showInvoiceAmount && (
                  <div style={{ borderRight: '1px solid #bbf7d0', paddingLeft: 12, paddingRight: 8 }}>
                    <div style={{ fontSize: '0.625rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Bill Amount</div>
                    <div style={{ fontWeight: 900, color: '#15803d', fontSize: '0.875rem', marginTop: 1 }}>
                      ₹{invoiceTotalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                <div style={{ paddingLeft: 12 }}>
                  <div style={{ fontSize: '0.625rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Qty Issued by Bill</div>
                  <div style={{ fontWeight: 900, color: '#000000', fontSize: '0.85rem', marginTop: 1 }}>
                    {totalIssuedBoxes} Boxes ({totalIssuedQtyPcs.toLocaleString('en-IN')} PCS)
                  </div>
                </div>
              </div>
            )}

            {/* VEHICLE & TRANSPORTER DISPATCH INFO BLOCK (Prominently displayed for Delivery Challan) */}
            {docMode === 'DISPATCH_CHALLAN' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                borderBottom: '2px solid #000000', 
                background: '#f8fafc',
                padding: '8px 12px',
                fontSize: '0.775rem'
              }}>
                <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: 8 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Vehicle / Tempo No.</div>
                  <div style={{ fontWeight: 900, color: '#000000', fontSize: '0.875rem', marginTop: 1 }}>
                    {vehicleNo}
                  </div>
                </div>

                <div style={{ borderRight: '1px solid #cbd5e1', paddingLeft: 12, paddingRight: 8 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Driver Name</div>
                  <div style={{ fontWeight: 800, color: '#000000', marginTop: 1 }}>
                    {driverName}
                  </div>
                </div>

                <div style={{ borderRight: '1px solid #cbd5e1', paddingLeft: 12, paddingRight: 8 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Driver Mobile</div>
                  <div style={{ fontWeight: 800, color: '#000000', marginTop: 1 }}>
                    {driverMobile}
                  </div>
                </div>

                <div style={{ paddingLeft: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Fleet & Gate Pass</div>
                  <div style={{ fontWeight: 800, color: '#000000', marginTop: 1 }}>
                    {vehicleType} ({gatePassId})
                  </div>
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #000000', textAlign: 'center', fontWeight: 900 }}>
                  <th style={{ borderRight: '1px solid #000000', padding: '5px 4px', width: 28 }}>Sr.</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'left' }}>Product Name</th>
                  {showMrp && <th style={{ borderRight: '1px solid #000000', padding: '5px 4px', width: 75 }}>MRP (₹)</th>}
                  {showBoxQty && <th style={{ borderRight: '1px solid #000000', padding: '5px 4px', width: 85 }}>Order Qty (Box)</th>}
                  {showIssuedQty && <th style={{ borderRight: '1px solid #000000', padding: '5px 4px', width: 100, color: '#166534', background: '#f0fdf4' }}>Qty Issued (Bill)</th>}
                  {showFreePcs && <th style={{ borderRight: '1px solid #000000', padding: '5px 4px', width: 75, color: '#059669' }}>Free PCS</th>}
                  {showPcsPerBox && <th style={{ borderRight: '1px solid #000000', padding: '5px 4px', width: 75 }}>Pcs / Box</th>}
                  {showTotalPcs && <th style={{ padding: '5px 4px', width: 90, fontWeight: 900 }}>Total PCS</th>}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const itemIssuedPcs = getItemIssuedPcs(item);
                  const itemIssuedBoxes = getItemIssuedBoxes(item);
                  const itemTotalPcs = item.total_qty_pcs || (item.box_qty * (item.pcs_per_box || 1) + (item.loose_pcs || 0));

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.775rem' }}>{item.product_name}</div>
                        {item.remark && <div style={{ fontSize: '0.65rem', color: '#475569' }}>Note: {item.remark}</div>}
                      </td>
                      {showMrp && <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', fontWeight: 700 }}>₹{item.unit_price}</td>}
                      {showBoxQty && (
                        <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', fontWeight: 900, fontSize: '0.8rem' }}>
                          {item.box_qty > 0 && (item.loose_pcs || 0) > 0 
                            ? `${item.box_qty} Box + ${item.loose_pcs} Pcs`
                            : item.box_qty > 0 
                              ? `${item.box_qty} Box`
                              : `${item.loose_pcs || 0} Pcs`
                          }
                        </td>
                      )}
                      {showIssuedQty && (
                        <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', fontWeight: 900, fontSize: '0.8rem', color: '#15803d', background: '#f0fdf4' }}>
                          {itemIssuedBoxes} Box{itemIssuedPcs % (item.pcs_per_box || 1) > 0 ? ` + ${itemIssuedPcs % (item.pcs_per_box || 1)} Pcs` : ''}
                        </td>
                      )}
                      {showFreePcs && (
                        <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', fontWeight: 800, color: (item.free_pcs || 0) > 0 ? '#059669' : '#64748b' }}>
                          {(item.free_pcs || 0) > 0 ? `${item.free_pcs} Free` : '0'}
                        </td>
                      )}
                      {showPcsPerBox && <td style={{ borderRight: '1px solid #000000', padding: '5px 4px' }}>{item.pcs_per_box || 1}</td>}
                      {showTotalPcs && (
                        <td style={{ padding: '5px 4px', fontWeight: 900, fontSize: '0.825rem' }}>
                          {showIssuedQty ? itemIssuedPcs : itemTotalPcs}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #000000' }}>
                  <td colSpan={2} style={{ borderRight: '1px solid #000000', padding: '6px 8px', textAlign: 'left', fontSize: '0.8rem' }}>
                    TOTAL SUMMARY ({order.items?.length || 0} ITEMS)
                  </td>
                  {showMrp && <td style={{ borderRight: '1px solid #000000' }}></td>}
                  {showBoxQty && (
                    <td style={{ borderRight: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontSize: '0.825rem', fontWeight: 900 }}>
                      {order.total_box_qty > 0 && (order.total_loose_pcs || 0) > 0
                        ? `${order.total_box_qty} Boxes + ${order.total_loose_pcs} Pcs`
                        : `${order.total_box_qty || 0} Boxes`
                      }
                    </td>
                  )}
                  {showIssuedQty && (
                    <td style={{ borderRight: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontSize: '0.825rem', fontWeight: 900, color: '#15803d', background: '#f0fdf4' }}>
                      {totalIssuedBoxes} Boxes
                    </td>
                  )}
                  {showFreePcs && (
                    <td style={{ borderRight: '1px solid #000000', padding: '6px 4px', textAlign: 'center', fontSize: '0.825rem', fontWeight: 900, color: '#059669' }}>
                      {totalFreePcs > 0 ? `${totalFreePcs} Free` : '0'}
                    </td>
                  )}
                  {showPcsPerBox && <td style={{ borderRight: '1px solid #000000' }}></td>}
                  {showTotalPcs && (
                    <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 900 }}>
                      {showIssuedQty ? totalIssuedQtyPcs : totalPcsSum} PCS
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>

            {/* Bottom Remarks & Signatories */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', borderTop: '2px solid #000000', padding: '10px 12px', fontSize: '0.725rem' }}>
              <div>
                <strong>Terms & Instructions: </strong>
                <span>
                  {docMode === 'DISPATCH_CHALLAN' 
                    ? 'Received the above goods in good order and condition. Any shortages or damage must be endorsed on this delivery challan immediately upon unloading.' 
                    : (order.remarks || 'Standard order booking terms apply. Delivery subject to stock confirmation.')}
                </span>

                <div style={{ marginTop: 8, fontSize: '0.675rem', color: '#64748b' }}>
                  Booked by Salesperson: <strong>{order.salesperson_name || 'Amit Kumar'}</strong> &nbsp;|&nbsp; Order Timestamp: <strong>{formattedDate} {formattedTime}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900 }}>
                  {docMode === 'DISPATCH_CHALLAN' ? 'For RECEIVER / CONSIGNEE' : 'For PROLINE SALES AGENCY'}
                </div>
                <div style={{ height: 35, width: 150, borderBottom: '1px solid #000000', marginTop: 4 }}></div>
                <div style={{ fontSize: '0.675rem', color: '#475569', marginTop: 2 }}>
                  {docMode === 'DISPATCH_CHALLAN' ? 'Authorized Receiver Stamp & Signature' : 'Salesperson / Authorized Signatory'}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
