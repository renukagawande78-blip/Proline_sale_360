import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Building2,
  PackageX,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  Receipt,
  Truck,
  ChevronDown,
  ChevronUp,
  Store,
  Calendar,
  AlertCircle,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Order, ReturnRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface BrandDamagedReportModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onMarkTalkedWithCompany: (orderId: string, notes: string) => void;
  onReleaseGRN: (orderId: string, grnData: { grn_number: string; grn_amount: number; grn_date: string; grn_remark: string }) => void;
  onCreateReplacementOrder: (orderId: string, replacementData: { order_number: string; reference_number?: string; delivery_type: string }) => void;
}

export const BrandDamagedReportModal: React.FC<BrandDamagedReportModalProps> = ({
  orders,
  isOpen,
  onClose,
  onMarkTalkedWithCompany,
  onReleaseGRN,
  onCreateReplacementOrder
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  // Sub-modal states for Super Admin actions
  const [talkModalOrder, setTalkModalOrder] = useState<Order | null>(null);
  const [talkNotes, setTalkNotes] = useState('');

  const [grnModalOrder, setGrnModalOrder] = useState<Order | null>(null);
  const [grnNumber, setGrnNumber] = useState('');
  const [grnAmount, setGrnAmount] = useState<number>(0);
  const [grnDate, setGrnDate] = useState(new Date().toISOString().substring(0, 10));
  const [grnRemark, setGrnRemark] = useState('');

  const [replaceModalOrder, setReplaceModalOrder] = useState<Order | null>(null);
  const [rnOrderNumber, setRnOrderNumber] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [useReferenceNumber, setUseReferenceNumber] = useState(false);
  const [deliveryType, setDeliveryType] = useState('F.O.R');

  // Filter orders that have collected return requests
  const collectedReturnOrders = useMemo(() => {
    return orders.filter(o => {
      const rr = o.return_request;
      if (!rr) return false;
      return [
        'COLLECTED',
        'DISPATCH_PROCESSED',
        'WAITING_FOR_COMPANY_APPROVAL',
        'TALKED_WITH_COMPANY',
        'GRN_RELEASED',
        'REPLACEMENT_ORDER_CREATED'
      ].includes(rr.status);
    });
  }, [orders]);

  // Aggregate by Brand
  const brandGroupedData = useMemo(() => {
    const groups: Record<string, {
      brandName: string;
      orders: Order[];
      totalBoxes: number;
      totalLoosePcs: number;
      totalPcs: number;
      totalValue: number;
      pendingCompanyTalk: number;
      readyForSettlement: number;
      completedSettlement: number;
    }> = {};

    collectedReturnOrders.forEach(ord => {
      const brand = ord.company_name || ord.return_request?.brand_name || 'Generic Brand';
      if (!groups[brand]) {
        groups[brand] = {
          brandName: brand,
          orders: [],
          totalBoxes: 0,
          totalLoosePcs: 0,
          totalPcs: 0,
          totalValue: 0,
          pendingCompanyTalk: 0,
          readyForSettlement: 0,
          completedSettlement: 0
        };
      }

      const g = groups[brand];
      g.orders.push(ord);

      const rr = ord.return_request!;
      let orderPcs = 0;
      let orderBoxes = 0;
      let orderLoose = 0;

      (rr.items || []).forEach(it => {
        const b = it.collected_box_qty || it.box_qty || 0;
        const l = it.collected_loose_pcs || it.loose_pcs || 0;
        const t = it.collected_qty_pcs || it.requested_qty_pcs || 0;
        orderBoxes += b;
        orderLoose += l;
        orderPcs += t;
        g.totalValue += (t * (it.unit_price || 0));
      });

      g.totalBoxes += orderBoxes;
      g.totalLoosePcs += orderLoose;
      g.totalPcs += orderPcs;

      if (rr.status === 'COLLECTED' || rr.status === 'DISPATCH_PROCESSED') {
        g.pendingCompanyTalk += 1;
      } else if (rr.status === 'WAITING_FOR_COMPANY_APPROVAL' || rr.status === 'TALKED_WITH_COMPANY') {
        g.readyForSettlement += 1;
      } else if (rr.status === 'GRN_RELEASED' || rr.status === 'REPLACEMENT_ORDER_CREATED') {
        g.completedSettlement += 1;
      }
    });

    return Object.values(groups);
  }, [collectedReturnOrders]);

  const allBrandNames = useMemo(() => {
    return Array.from(new Set(brandGroupedData.map(b => b.brandName))).sort();
  }, [brandGroupedData]);

  const filteredBrandGroups = useMemo(() => {
    return brandGroupedData.filter(b => {
      if (selectedBrandFilter !== 'ALL' && b.brandName !== selectedBrandFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBrand = b.brandName.toLowerCase().includes(q);
        const matchesOrder = b.orders.some(o => 
          o.order_number.toLowerCase().includes(q) ||
          (o.agency_name || '').toLowerCase().includes(q) ||
          (o.return_request?.vehicle_number || '').toLowerCase().includes(q)
        );
        return matchesBrand || matchesOrder;
      }
      return true;
    });
  }, [brandGroupedData, selectedBrandFilter, searchQuery]);

  if (!isOpen) return null;

  // Open Talk with Company dialog
  const handleOpenTalkModal = (order: Order) => {
    setTalkModalOrder(order);
    setTalkNotes(order.return_request?.company_discussion_notes || '');
  };

  const handleConfirmTalk = () => {
    if (!talkModalOrder) return;
    onMarkTalkedWithCompany(talkModalOrder.id, talkNotes.trim());
    setTalkModalOrder(null);
  };

  // Open Release GRN dialog
  const handleOpenGrnModal = (order: Order) => {
    setGrnModalOrder(order);
    const yr = new Date().getFullYear();
    const orderDigits = order.order_number.replace(/[^0-9]/g, '').slice(-4) || '0001';
    setGrnNumber(order.return_request?.grn_number || `GRN-${yr}-${orderDigits}`);
    setGrnAmount(order.return_request?.grn_amount || order.invoice_amount || order.total_amount || 0);
    setGrnDate(new Date().toISOString().substring(0, 10));
    setGrnRemark(order.return_request?.grn_remark || '');
  };

  const handleConfirmGrn = () => {
    if (!grnModalOrder) return;
    onReleaseGRN(grnModalOrder.id, {
      grn_number: grnNumber.trim(),
      grn_amount: Number(grnAmount) || 0,
      grn_date: grnDate,
      grn_remark: grnRemark.trim()
    });
    setGrnModalOrder(null);
  };

  // Open Replace Product dialog
  const handleOpenReplaceModal = (order: Order) => {
    setReplaceModalOrder(order);
    const rawNum = order.order_number.replace(/^RN-/, '');
    setRnOrderNumber(`RN-${rawNum}`);
    setRefNumber(`REF-${Date.now().toString().slice(-6)}`);
    setUseReferenceNumber(false);
    setDeliveryType(order.delivery_type || 'F.O.R');
  };

  const handleConfirmReplace = () => {
    if (!replaceModalOrder) return;
    const finalOrderNumber = useReferenceNumber ? (refNumber.trim() || `RN-${Date.now()}`) : rnOrderNumber.trim();
    onCreateReplacementOrder(replaceModalOrder.id, {
      order_number: finalOrderNumber,
      reference_number: useReferenceNumber ? refNumber.trim() : undefined,
      delivery_type: deliveryType
    });
    setReplaceModalOrder(null);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: 1100, width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(251,191,36,0.15)', padding: '0.45rem', borderRadius: 8, color: '#fbbf24' }}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Brand-Wise Damaged Stock Collection &amp; Settlement Report
                </h2>
                <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                  Super Admin Desk: Review collected returns by Brand, record company communication, and release GRN or Replacement RN orders
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Brand, Order #, Agency, or Vehicle..."
            style={{ flex: '1 1 250px', padding: '0.5rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#ffffff', fontSize: '0.825rem' }}
          />

          <select
            value={selectedBrandFilter}
            onChange={e => setSelectedBrandFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#ffffff', fontSize: '0.825rem', fontWeight: 700 }}
          >
            <option value="ALL">All Brands ({allBrandNames.length})</option>
            {allBrandNames.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
            {filteredBrandGroups.length} Brands | {collectedReturnOrders.length} Collected Orders
          </span>
        </div>

        {/* Scrollable Brands Group List */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {filteredBrandGroups.length === 0 ? (
            <div style={{ background: '#0f172a', border: '1px dashed #334155', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <AlertCircle size={36} style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No Collected Returns Found</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                Damaged goods must be marked as Collected by the Dispatch person before appearing in this report.
              </div>
            </div>
          ) : (
            filteredBrandGroups.map(group => {
              const isExpanded = expandedBrand === group.brandName;
              return (
                <div key={group.brandName} style={{ background: '#141f36', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
                  
                  {/* Brand Group Card Header */}
                  <div 
                    onClick={() => setExpandedBrand(isExpanded ? null : group.brandName)}
                    style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: isExpanded ? '#1e293b' : 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', padding: '0.45rem', borderRadius: 8 }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#f8fafc' }}>
                          {group.brandName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                          {group.orders.length} Return Collection(s)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.675rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Collected</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#38bdf8' }}>
                          {group.totalBoxes > 0 ? `${group.totalBoxes} BOX, ` : ''}{group.totalPcs} PCS
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.675rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Pending Action</div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {group.pendingCompanyTalk > 0 && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 800 }}>
                              {group.pendingCompanyTalk} To Talk
                            </span>
                          )}
                          {group.readyForSettlement > 0 && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 800 }}>
                              {group.readyForSettlement} To Settle
                            </span>
                          )}
                          {group.completedSettlement > 0 && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 800 }}>
                              {group.completedSettlement} Settled
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ color: '#94a3b8' }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Brand Orders Table */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #1e293b', background: '#0b1120', padding: '1rem' }}>
                      <table className="data-table" style={{ fontSize: '0.78rem' }}>
                        <thead>
                          <tr>
                            <th>Order No.</th>
                            <th>Agency / Party</th>
                            <th>Return Type</th>
                            <th>Vehicle &amp; Driver</th>
                            <th>Collected Quantities</th>
                            <th>Company Discussion</th>
                            <th>Status / Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.orders.map(ord => {
                            const rr = ord.return_request!;
                            const isDamaged = rr.return_type === 'DAMAGED_RETURN';
                            const hasWaitingCompany = Boolean(rr.talked_with_company || rr.status === 'WAITING_FOR_COMPANY_APPROVAL' || rr.status === 'TALKED_WITH_COMPANY');
                            const isSettled = ['GRN_RELEASED', 'REPLACEMENT_ORDER_CREATED'].includes(rr.status);

                            return (
                              <tr key={ord.id}>
                                <td>
                                  <strong style={{ color: '#38bdf8' }}>{ord.order_number}</strong>
                                  <div style={{ fontSize: '0.675rem', color: '#64748b' }}>Date: {ord.order_date?.slice(0, 10)}</div>
                                </td>
                                <td>
                                  <strong style={{ color: '#f8fafc' }}>{ord.agency_name}</strong>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: isDamaged ? 'rgba(244,63,94,0.15)' : 'rgba(56,189,248,0.15)', color: isDamaged ? '#fb7185' : '#38bdf8', fontWeight: 800 }}>
                                    {isDamaged ? 'Damaged Return' : 'Replacement'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.75rem', color: '#f8fafc' }}>
                                    🚗 {rr.vehicle_number || ord.vehicle_number || 'N/A'}
                                  </div>
                                  <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                                    Driver: {rr.driver_name || ord.driver_name || 'N/A'} ({rr.collected_at || 'Collected'})
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: '#34d399', fontWeight: 800 }}>
                                    {(rr.items || []).reduce((s, i) => s + (i.collected_qty_pcs || i.requested_qty_pcs || 0), 0)} PCS Total
                                  </div>
                                  <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                                    {rr.items?.map(i => `${i.product_name}: ${i.collected_qty_pcs || i.requested_qty_pcs}P`).join(', ')}
                                  </div>
                                </td>
                                <td>
                                  {hasWaitingCompany ? (
                                    <div>
                                      <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={12} /> Waiting for Company Approval
                                      </span>
                                      {rr.company_discussion_notes && (
                                        <div style={{ fontSize: '0.675rem', color: '#cbd5e1', fontStyle: 'italic', maxWidth: 180 }}>
                                          "{rr.company_discussion_notes}"
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenTalkModal(ord)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        padding: '0.35rem 0.65rem',
                                        background: 'rgba(251,191,36,0.15)',
                                        border: '1px solid rgba(251,191,36,0.3)',
                                        color: '#fbbf24',
                                        borderRadius: 6,
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Clock size={12} /> Wait for Company Approval
                                    </button>
                                  )}
                                </td>
                                <td>
                                  {isSettled ? (
                                    <div>
                                      {rr.status === 'GRN_RELEASED' ? (
                                        <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.75rem' }}>
                                          ✅ GRN Released: {rr.grn_number} (₹{rr.grn_amount})
                                        </div>
                                      ) : (
                                        <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.75rem' }}>
                                          📦 Replaced via {rr.replacement_order_number || 'RN Order'}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      <button
                                        onClick={() => handleOpenGrnModal(ord)}
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          background: 'rgba(52,211,153,0.15)',
                                          border: '1px solid rgba(52,211,153,0.3)',
                                          color: '#34d399',
                                          borderRadius: 6,
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          cursor: 'pointer'
                                        }}
                                        title="Issue Goods Return Note (Credit Note)"
                                      >
                                        Release GRN
                                      </button>
                                      <button
                                        onClick={() => handleOpenReplaceModal(ord)}
                                        style={{
                                          padding: '0.35rem 0.6rem',
                                          background: 'rgba(56,189,248,0.15)',
                                          border: '1px solid rgba(56,189,248,0.3)',
                                          color: '#38bdf8',
                                          borderRadius: 6,
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          cursor: 'pointer'
                                        }}
                                        title="Create Replacement Order (RN)"
                                      >
                                        Replace Product
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>

        {/* Sub-Modal 1: Wait For Company Approval */}
        {talkModalOrder && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-card" style={{ maxWidth: 500, width: '90vw', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} /> Wait for Company Approval
                </h3>
                <button onClick={() => setTalkModalOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                Record discussion details / submission sent to <strong>{talkModalOrder.company_name}</strong> for order <strong>{talkModalOrder.order_number}</strong>:
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  APPROVAL SUBMISSION NOTES / DETAILS FOR COMPANY
                </label>
                <textarea
                  rows={3}
                  value={talkNotes}
                  onChange={e => setTalkNotes(e.target.value)}
                  placeholder="e.g. Sent damaged stock report and photos to Brand Manager. Waiting for company approval on Credit Note / Fresh stock replacement."
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => setTalkModalOrder(null)}>Cancel</button>
                <button className="btn btn-warning" onClick={handleConfirmTalk} style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} /> Confirm: Wait for Company Approval
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Modal 2: Release GRN */}
        {grnModalOrder && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-card" style={{ maxWidth: 500, width: '90vw', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Receipt size={16} /> Release GRN (Goods Return Note)
                </h3>
                <button onClick={() => setGrnModalOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    GRN NUMBER *
                  </label>
                  <input
                    type="text"
                    value={grnNumber}
                    onChange={e => setGrnNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. GRN-2026-0042"
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    GRN SETTLEMENT VALUE (₹) *
                  </label>
                  <input
                    type="number"
                    value={grnAmount}
                    onChange={e => setGrnAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#34d399', fontSize: '0.85rem', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    GRN DATE
                  </label>
                  <input
                    type="date"
                    value={grnDate}
                    onChange={e => setGrnDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    SETTLEMENT REMARK
                  </label>
                  <input
                    type="text"
                    value={grnRemark}
                    onChange={e => setGrnRemark(e.target.value)}
                    placeholder="Remark..."
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => setGrnModalOrder(null)}>Cancel</button>
                <button className="btn btn-success" onClick={handleConfirmGrn} style={{ fontWeight: 800 }}>
                  Confirm &amp; Release GRN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Modal 3: Replace Product (Create New RN Order) */}
        {replaceModalOrder && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-card" style={{ maxWidth: 520, width: '90vw', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={16} /> Create Replacement RN Order
                </h3>
                <button onClick={() => setReplaceModalOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.85rem' }}>
                Creates a new fresh stock dispatch order for <strong>{replaceModalOrder.agency_name}</strong> ({replaceModalOrder.company_name}) replacing collected damaged stock.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                
                {/* Reference Number Toggle */}
                <div style={{ background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>Numbering Mode</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {useReferenceNumber ? 'Using manual reference number' : 'Using RN- prefix on original order number'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseReferenceNumber(!useReferenceNumber)}
                    style={{ background: '#1e293b', border: '1px solid #475569', color: '#38bdf8', fontSize: '0.725rem', padding: '0.3rem 0.6rem', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}
                  >
                    {useReferenceNumber ? 'Use RN- Number' : 'Use Reference Number'}
                  </button>
                </div>

                {!useReferenceNumber ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      REPLACEMENT ORDER NUMBER (RN-) *
                    </label>
                    <input
                      type="text"
                      value={rnOrderNumber}
                      onChange={e => setRnOrderNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. RN-ORD-9284"
                      style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#38bdf8', fontSize: '0.85rem', fontWeight: 900 }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                      MANUAL REFERENCE NUMBER *
                    </label>
                    <input
                      type="text"
                      value={refNumber}
                      onChange={e => setRefNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. REF-2026-9812"
                      style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #fbbf24', borderRadius: 6, color: '#fbbf24', fontSize: '0.85rem', fontWeight: 900 }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    DELIVERY MODE
                  </label>
                  <select
                    value={deliveryType}
                    onChange={e => setDeliveryType(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem', fontWeight: 700 }}
                  >
                    <option value="F.O.R">F.O.R (Freight on Road Delivery)</option>
                    <option value="Self Pickup">Self Pickup (Customer Warehouse Pickup)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => setReplaceModalOrder(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleConfirmReplace} style={{ fontWeight: 800 }}>
                  Generate Replacement Order
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
