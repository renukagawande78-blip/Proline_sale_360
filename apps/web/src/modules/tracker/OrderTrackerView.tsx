import React, { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  ShieldCheck,
  Pause,
  Receipt,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  PackageX,
  RefreshCw,
  User,
  Building2,
  Calendar,
  ArrowRight,
  Boxes,
  IndianRupee,
  ScanSearch,
  AlertTriangle,
  ArrowLeft,
  Phone,
  Car,
  ExternalLink,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { Order, OrderStatus, Agency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isCompanyAllowedForUser } from '../../lib/supabase';
import { formatDisplayDateTime } from '../../utils/dateFormatter';

interface OrderTrackerViewProps {
  orders: Order[];
  agencies?: Agency[];
  onReleaseHold?: (orderId: string) => void;
}

interface TrackStage {
  id: string;
  label: string;
  sublabel: string;
  icon: any;
  color: string;
  glow: string;
}

const TRACKER_STAGES: TrackStage[] = [
  {
    id: 'stage_booking',
    label: '1. Order Ingestion & Booking',
    sublabel: 'Salesman logs party, product line items & commercial terms',
    icon: FileText,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.3)'
  },
  {
    id: 'stage_approval',
    label: '2. Credit & Admin Clearance',
    sublabel: 'Super Admin / Accounts review (Overdue, Credit limit & Stock)',
    icon: ShieldCheck,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.3)'
  },
  {
    id: 'stage_billing',
    label: '3. Accounts & Tax Invoicing',
    sublabel: 'B2B Tax invoice issuance & ledger posting',
    icon: Receipt,
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.3)'
  },
  {
    id: 'stage_dispatch',
    label: '4. Warehouse Packing & Vehicle Dispatch',
    sublabel: 'Warehouse stock picking, box packing & vehicle challan allocation',
    icon: Truck,
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)'
  },
  {
    id: 'stage_transit',
    label: '5. In Transit & Out for Delivery',
    sublabel: 'Driver delivery drop in transit to party premises',
    icon: MapPin,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.35)'
  },
  {
    id: 'stage_settlement',
    label: '6. POD Verification & Final Settlement',
    sublabel: 'Receiver sign-off, digital POD verification or GRN/Reattempt resolution',
    icon: CheckCircle2,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.4)'
  }
];

function getActiveStageIndex(status: OrderStatus): number {
  if (status === 'CANCELLED' || status === 'REJECTED') return -1;
  if (status === 'DRAFT' || status === 'SUBMITTED') return 0;
  if (status === 'WAIT_FOR_STOCK' || status === 'HELD' || status === 'SALES_ADMIN_APPROVED') return 1;
  if (status === 'APPROVED' || status === 'ACCOUNTS_APPROVED' || status === 'INVENTORY_AUDITED') return 2;
  if (
    status === 'BILLED' ||
    status === 'INVOICED' ||
    status === 'DISPATCH_PENDING' ||
    status === 'READY_FOR_PICKUP' ||
    status === 'READY_FOR_SELF_PICKUP' ||
    status === 'PARTIALLY_DISPATCHED'
  ) return 3;
  if (status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY') return 4;
  if (
    status === 'DELIVERED' ||
    status === 'POD_ISSUE_RAISED' ||
    status === 'DELIVERY_REATTEMPTED' ||
    status === 'COMPLETED'
  ) return 5;
  return 0;
}

function getStatusDetails(status: OrderStatus): { label: string; color: string; bg: string; border: string; desc: string } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft Order', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', desc: 'Order drafted by salesman, not yet submitted for approval.' };
    case 'SUBMITTED':
      return { label: 'Submitted for Review', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', desc: 'Submitted by salesman, pending Admin & Accounts clearance.' };
    case 'WAIT_FOR_STOCK':
      return { label: 'Waiting for Stock', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', desc: 'Warehouse stock audit flagged shortage; awaiting replenishment.' };
    case 'HELD':
      return { label: 'On Hold (Credit Review)', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', desc: 'Order placed on financial hold due to overdue or credit limits.' };
    case 'SALES_ADMIN_APPROVED':
      return { label: 'Sales Admin Approved', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)', desc: 'Endorsed by Sales Admin; awaiting final Super Admin sign-off.' };
    case 'ACCOUNTS_APPROVED':
    case 'APPROVED':
    case 'INVENTORY_AUDITED':
      return { label: 'Approved — Ready for Billing', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', desc: 'Credit and inventory cleared. Queued in Accounts for B2B Tax Invoice.' };
    case 'BILLED':
    case 'INVOICED':
      return { label: 'Billed — Ready for Dispatch', color: '#38bdf8', bg: 'rgba(56,189,248,0.2)', border: 'rgba(56,189,248,0.4)', desc: 'B2B Tax invoice generated; awaiting warehouse vehicle loading.' };
    case 'DISPATCH_PENDING':
    case 'READY_FOR_PICKUP':
    case 'READY_FOR_SELF_PICKUP':
    case 'PARTIALLY_DISPATCHED':
      return { label: 'Warehouse Packing & Staging', color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', desc: 'Order items being packed and vehicle challan assigned.' };
    case 'DISPATCHED':
      return { label: 'Dispatched — In Transit', color: '#f97316', bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.45)', desc: 'Vehicle loaded and dispatched from warehouse with Delivery Challan.' };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', color: '#a78bfa', bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.45)', desc: 'Driver is on the final drop route to party premises.' };
    case 'DELIVERED':
      return { label: 'Delivered — Awaiting POD', color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', desc: 'Goods delivered to party. Proof of Delivery verification in progress.' };
    case 'POD_ISSUE_RAISED':
      return { label: 'POD Exception Desk', color: '#f43f5e', bg: 'rgba(244,63,94,0.2)', border: 'rgba(244,63,94,0.45)', desc: 'Shortage, damage, or return flagged during POD verification.' };
    case 'DELIVERY_REATTEMPTED':
      return { label: 'Delivery Reattempted', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', desc: 'Parent order completed via fresh re-attempt delivery order generation.' };
    case 'COMPLETED':
      return { label: 'Completed & Settled', color: '#10b981', bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.45)', desc: 'Order delivered, clean POD verified, and accounts settled.' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: '#f43f5e', bg: 'rgba(244,63,94,0.2)', border: 'rgba(244,63,94,0.4)', desc: 'Order cancelled and archived.' };
    case 'REJECTED':
      return { label: 'Rejected', color: '#f43f5e', bg: 'rgba(244,63,94,0.2)', border: 'rgba(244,63,94,0.4)', desc: 'Order rejected during admin or credit review.' };
    default:
      return { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', desc: 'Status in tracking pipeline.' };
  }
}

export const OrderTrackerView: React.FC<OrderTrackerViewProps> = ({
  orders,
  agencies = [],
  onReleaseHold
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusTabFilter, setStatusTabFilter] = useState<'ALL' | 'PENDING_BILLING' | 'IN_DISPATCH' | 'DELIVERED' | 'EXCEPTIONS'>('ALL');
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Filter orders accessible by user's company scope
  const accessibleOrders = useMemo(() => {
    return orders.filter(o => isCompanyAllowedForUser(o.company_name, currentUser?.company_handle));
  }, [orders, currentUser]);

  // Helper to resolve accurate agency/party name
  const resolveAgencyName = (ord: Order): string => {
    if (ord.agency_name && ord.agency_name !== 'Agency Partner' && ord.agency_name !== 'Agency Party' && ord.agency_name !== 'N/A' && ord.agency_name !== 'Direct Order') {
      return ord.agency_name;
    }
    // If RN- order, check parent order agency name
    if (ord.order_number.startsWith('RN-')) {
      const parentNum = ord.order_number.replace(/^RN-/, '');
      const parent = accessibleOrders.find(o => o.order_number === parentNum);
      if (parent && parent.agency_name && parent.agency_name !== 'Agency Partner') {
        return parent.agency_name;
      }
    }
    if (ord.agency_id && agencies.length > 0) {
      const match = agencies.find(a => a.id === ord.agency_id);
      if (match?.agency_name) return match.agency_name;
    }
    if (ord.agency_code && agencies.length > 0) {
      const matchCode = agencies.find(a => a.agency_code === ord.agency_code);
      if (matchCode?.agency_name) return matchCode.agency_name;
    }
    return ord.agency_name && ord.agency_name !== 'Agency Partner' ? ord.agency_name : (ord.agency_code || 'Agency Partner');
  };

  // Helper to resolve agency territory/city
  const resolveAgencyLocation = (ord: Order): string => {
    if (ord.agency_id && agencies.length > 0) {
      const match = agencies.find(a => a.id === ord.agency_id);
      if (match?.area_name || match?.city) {
        return [match.area_name, match.city].filter(Boolean).join(', ');
      }
    }
    return [ord.area_name, ord.zone_name].filter(Boolean).join(', ') || 'Direct Area';
  };

  // Filtered orders for directory view
  const filteredDirectoryOrders = useMemo(() => {
    let result = accessibleOrders;

    // Filter by Tab
    if (statusTabFilter === 'PENDING_BILLING') {
      result = result.filter(o => o.status === 'APPROVED' || o.status === 'ACCOUNTS_APPROVED' || o.status === 'INVENTORY_AUDITED');
    } else if (statusTabFilter === 'IN_DISPATCH') {
      result = result.filter(o =>
        o.status === 'BILLED' ||
        o.status === 'INVOICED' ||
        o.status === 'DISPATCH_PENDING' ||
        o.status === 'READY_FOR_PICKUP' ||
        o.status === 'READY_FOR_SELF_PICKUP' ||
        o.status === 'PARTIALLY_DISPATCHED' ||
        o.status === 'DISPATCHED' ||
        o.status === 'OUT_FOR_DELIVERY'
      );
    } else if (statusTabFilter === 'DELIVERED') {
      result = result.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED');
    } else if (statusTabFilter === 'EXCEPTIONS') {
      result = result.filter(o => o.status === 'POD_ISSUE_RAISED' || o.status === 'DELIVERY_REATTEMPTED' || o.status === 'HELD');
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(o => {
        const orderNum = (o.order_number || '').toLowerCase();
        const agencyName = resolveAgencyName(o).toLowerCase();
        const companyName = (o.company_name || '').toLowerCase();
        const invoiceNum = (o.invoice_number || '').toLowerCase();
        const vehicleNum = (o.vehicle_number || o.tempo_number || '').toLowerCase();
        const salesperson = (o.salesperson_name || '').toLowerCase();
        const reattemptNum = (o.reattempt_order_number || o.original_reattempt_order_number || '').toLowerCase();
        const hasItem = (o.items || []).some(item => (item.product_name || '').toLowerCase().includes(q) || (item.product_code || '').toLowerCase().includes(q));

        return (
          orderNum.includes(q) ||
          agencyName.includes(q) ||
          companyName.includes(q) ||
          invoiceNum.includes(q) ||
          vehicleNum.includes(q) ||
          salesperson.includes(q) ||
          reattemptNum.includes(q) ||
          hasItem
        );
      });
    }

    return result;
  }, [accessibleOrders, statusTabFilter, searchQuery, agencies]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderNumber(true);
    setTimeout(() => setCopiedOrderNumber(false), 2000);
  };

  const isCancelled = selectedOrder && (selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'REJECTED');
  const isHeld = selectedOrder?.status === 'HELD';
  const activeIdx = selectedOrder ? getActiveStageIndex(selectedOrder.status) : -1;
  const statusInfo = selectedOrder ? getStatusDetails(selectedOrder.status) : null;
  const parentOrderNumber = selectedOrder?.original_reattempt_order_number || (selectedOrder?.order_number.startsWith('RN-') ? selectedOrder.order_number.replace(/^RN-/, '') : null);
  const childOrderNumber = selectedOrder?.reattempt_order_number || accessibleOrders.find(o => o.order_number === `RN-${selectedOrder?.order_number}` || o.original_reattempt_order_number === selectedOrder?.order_number)?.order_number || null;

  return (
    <div className="page-body">

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>Order Tracker</h1>
            <span style={{
              fontSize: '0.725rem', fontWeight: 800, padding: '0.2rem 0.6rem',
              borderRadius: 20, background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)'
            }}>
              Live Journey & Verification
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Track complete lifecycle from booking ➔ credit gate ➔ tax invoice ➔ warehouse dispatch ➔ digital POD
          </p>
        </div>

        {selectedOrder && (
          <button
            onClick={() => setSelectedOrder(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#141f36', border: '1px solid #1e3a5f',
              color: '#38bdf8', padding: '0.55rem 1.1rem', borderRadius: 10,
              fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <ArrowLeft size={16} /> Back to All Orders Directory
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div style={{
        background: '#141f36', border: '1px solid #1e3a5f',
        borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.75rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Main Search Input */}
          <div style={{
            flex: 1, minWidth: 280, display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: '#0d1527', border: '1px solid #1e293b', borderRadius: 10,
            padding: '0.65rem 1rem'
          }}>
            <Search size={18} color="#38bdf8" />
            <input
              type="text"
              placeholder="Search by Order #, RN- Reattempt, Party, Invoice #, Driver, Vehicle #, Product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#f8fafc', fontSize: '0.875rem', width: '100%', fontWeight: 600
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Orders', count: accessibleOrders.length },
              { id: 'PENDING_BILLING', label: 'Ready for Billing', count: accessibleOrders.filter(o => o.status === 'APPROVED' || o.status === 'ACCOUNTS_APPROVED' || o.status === 'INVENTORY_AUDITED').length },
              { id: 'IN_DISPATCH', label: 'Dispatch & Transit', count: accessibleOrders.filter(o => ['BILLED', 'DISPATCH_PENDING', 'READY_FOR_PICKUP', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status)).length },
              { id: 'DELIVERED', label: 'Delivered', count: accessibleOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length },
              { id: 'EXCEPTIONS', label: 'Exceptions & Reattempt', count: accessibleOrders.filter(o => ['POD_ISSUE_RAISED', 'DELIVERY_REATTEMPTED', 'HELD'].includes(o.status)).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusTabFilter(tab.id as any); setSelectedOrder(null); }}
                style={{
                  padding: '0.45rem 0.85rem', borderRadius: 8,
                  fontSize: '0.775rem', fontWeight: 700, cursor: 'pointer',
                  background: statusTabFilter === tab.id ? '#38bdf8' : '#0d1527',
                  color: statusTabFilter === tab.id ? '#0f172a' : '#94a3b8',
                  border: `1px solid ${statusTabFilter === tab.id ? '#38bdf8' : '#1e293b'}`,
                  transition: 'all 0.15s'
                }}
              >
                {tab.label} <span style={{ opacity: 0.85, fontSize: '0.72rem' }}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED TRACKER CARD (WHEN AN ORDER IS SELECTED) */}
      {selectedOrder ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Top Order Information & Operational Metrics Card */}
          <div style={{
            background: 'linear-gradient(135deg, #141f36, #0f172a)',
            border: `2px solid ${isCancelled ? 'rgba(244,63,94,0.4)' : isHeld ? 'rgba(251,191,36,0.4)' : 'rgba(56,189,248,0.3)'}`,
            borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)'
          }}>
            {/* Background Glow Accent */}
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 220, height: 220,
              borderRadius: '50%',
              background: isCancelled ? 'rgba(244,63,94,0.08)' : isHeld ? 'rgba(251,191,36,0.08)' : 'rgba(56,189,248,0.08)',
              pointerEvents: 'none'
            }} />

            {/* Header: Order Number, Reattempt Tags, and Status Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Order Identifier
                  </span>

                  {/* Reattempt Badges */}
                  {(selectedOrder.order_number.startsWith('RN-') || selectedOrder.reattempt_delivery) && (
                    <span style={{
                      fontSize: '0.685rem', fontWeight: 900, padding: '0.15rem 0.55rem',
                      borderRadius: 12, background: 'rgba(245,158,11,0.2)', color: '#fbbf24',
                      border: '1px solid rgba(245,158,11,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      <RefreshCw size={10} /> RE-ATTEMPT ORDER
                    </span>
                  )}

                  {parentOrderNumber && (
                    <button
                      onClick={() => {
                        const parent = accessibleOrders.find(o => o.order_number === parentOrderNumber);
                        if (parent) handleSelectOrder(parent);
                      }}
                      style={{
                        background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
                        borderRadius: 12, padding: '0.15rem 0.55rem', color: '#38bdf8',
                        fontSize: '0.685rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                      }}
                      title="Click to view original parent order"
                    >
                      <ArrowRight size={10} /> Original Parent: {parentOrderNumber}
                    </button>
                  )}

                  {childOrderNumber && (
                    <button
                      onClick={() => {
                        const child = accessibleOrders.find(o => o.order_number === childOrderNumber);
                        if (child) handleSelectOrder(child);
                      }}
                      style={{
                        background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                        borderRadius: 12, padding: '0.15rem 0.55rem', color: '#34d399',
                        fontSize: '0.685rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                      }}
                      title="Click to view newly generated re-attempt order"
                    >
                      <RefreshCw size={10} /> Re-attempt Created: {childOrderNumber}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                    {selectedOrder.order_number}
                  </div>
                  <button
                    onClick={() => handleCopyOrderNumber(selectedOrder.order_number)}
                    style={{
                      background: '#1e293b', border: '1px solid #334155', color: copiedOrderNumber ? '#34d399' : '#94a3b8',
                      borderRadius: 8, padding: '0.35rem 0.6rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.75rem', fontWeight: 700
                    }}
                    title="Copy Order Number"
                  >
                    {copiedOrderNumber ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: 6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={13} color="#38bdf8" /> Booked: {formatDisplayDateTime(selectedOrder.order_date)}
                </div>
              </div>

              {/* Status Badge with explanation */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Order Status
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.25rem', borderRadius: 30,
                  fontSize: '0.85rem', fontWeight: 900,
                  background: statusInfo?.bg, color: statusInfo?.color,
                  border: `1px solid ${statusInfo?.border}`,
                  boxShadow: `0 0 16px ${statusInfo?.bg}`
                }}>
                  {statusInfo?.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 280 }}>
                  {statusInfo?.desc}
                </span>

                {/* Hold Release Directive Button */}
                {isHeld && onReleaseHold && (
                  <button
                    onClick={() => onReleaseHold(selectedOrder.id)}
                    style={{
                      marginTop: 6, padding: '0.45rem 1rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white', border: 'none', borderRadius: 8,
                      fontWeight: 800, fontSize: '0.775rem', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    <CheckCircle2 size={13} /> Release Hold Directive (Resume Workflow)
                  </button>
                )}
              </div>
            </div>

            {/* 8-Grid Operational Details Panel */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.25rem', padding: '1.25rem', background: '#0d1527',
              borderRadius: 14, border: '1px solid #1e293b'
            }}>
              {/* 1. Party / Agency */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <Building2 size={12} color="#38bdf8" /> Party / Agency
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                  {resolveAgencyName(selectedOrder)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={11} color="#64748b" /> {resolveAgencyLocation(selectedOrder)}
                </div>
              </div>

              {/* 2. Order Value */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <IndianRupee size={12} color="#10b981" /> Total Order Value
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34d399' }}>
                  ₹{(selectedOrder.total_amount || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Payment: <strong style={{ color: '#f8fafc' }}>{selectedOrder.payment_type || 'CREDIT'}</strong>
                  {selectedOrder.credit_days ? ` (${selectedOrder.credit_days}d)` : ''}
                </div>
              </div>

              {/* 3. Ordered Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <Boxes size={12} color="#fbbf24" /> Total Order Volume
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedOrder.total_qty_pcs || 0} PCS
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                  📦 {selectedOrder.total_box_qty || 0} Boxes
                </div>
              </div>

              {/* 4. Company & Brand */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <Building2 size={12} color="#a78bfa" /> Company / Division
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedOrder.company_name || 'Standard Division'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Salesperson: <strong style={{ color: '#cbd5e1' }}>{selectedOrder.salesperson_name || 'Direct Order'}</strong>
                </div>
              </div>

              {/* 5. Invoice Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <Receipt size={12} color="#38bdf8" /> B2B Tax Invoice
                </div>
                {selectedOrder.invoice_number ? (
                  <>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>
                      #{selectedOrder.invoice_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {selectedOrder.invoice_date || 'Date recorded'} · ₹{(selectedOrder.invoice_amount || selectedOrder.total_amount || 0).toLocaleString('en-IN')}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                      Pending Invoicing
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      Ready in Billing Queue
                    </div>
                  </>
                )}
              </div>

              {/* 6. Vehicle & Driver Logistics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <Car size={12} color="#f97316" /> Logistics & Fleet
                </div>
                {selectedOrder.vehicle_number || selectedOrder.driver_name ? (
                  <>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                      {selectedOrder.vehicle_number || selectedOrder.tempo_number || 'Vehicle Assigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={11} /> {selectedOrder.driver_name || 'Driver'}
                      {selectedOrder.driver_mobile && ` (${selectedOrder.driver_mobile})`}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                      Vehicle Allocation Pending
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      Mode: {selectedOrder.delivery_type || 'F.O.R'}
                    </div>
                  </>
                )}
              </div>

              {/* 7. Transporter / Rental */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <Truck size={12} color="#fbbf24" /> Delivery Mode & Fleet
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedOrder.rental_agency_name || (selectedOrder.is_company_vehicle ? 'In-House Fleet' : 'Direct Transport')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Terms: {selectedOrder.delivery_type || 'F.O.R'}
                </div>
              </div>

              {/* 8. POD & Settlement Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.675rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <CheckCircle2 size={12} color="#10b981" /> POD Status
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedOrder.pod_status === 'ISSUE_RAISED' ? '#f43f5e' : selectedOrder.pod_status === 'CLEAN' ? '#34d399' : '#94a3b8' }}>
                  {selectedOrder.pod_status === 'ISSUE_RAISED'
                    ? `⚠️ Exception (${selectedOrder.pod_issue_type || 'Issue'})`
                    : selectedOrder.pod_status === 'CLEAN'
                    ? '✅ Verified Clean POD'
                    : selectedOrder.status === 'COMPLETED'
                    ? '✅ Clean & Settled'
                    : 'Awaiting Delivery Drop'}
                </div>
                {selectedOrder.grn_number && (
                  <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                    GRN Issued: #{selectedOrder.grn_number}
                  </div>
                )}
              </div>
            </div>

            {/* Hold Banner */}
            {isHeld && selectedOrder.hold_reason && (
              <div style={{
                marginTop: '1.25rem', padding: '0.85rem 1.1rem',
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
                borderRadius: 12, fontSize: '0.825rem', color: '#fbbf24',
                display: 'flex', alignItems: 'center', gap: '0.6rem'
              }}>
                <AlertTriangle size={18} color="#fbbf24" />
                <div>
                  <strong>Admin Financial Hold:</strong> {selectedOrder.hold_reason}
                  {selectedOrder.hold_remarks && <span style={{ color: '#cbd5e1' }}> — {selectedOrder.hold_remarks}</span>}
                </div>
              </div>
            )}
          </div>

          {/* VISUAL 6-STAGE TIMELINE JOURNEY */}
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 20, padding: '2rem 1.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  End-to-End Operational Lifecycle
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: 3 }}>
                  Order Journey Timeline
                </div>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem',
                borderRadius: 20, background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.3)'
              }}>
                Stage {activeIdx + 1} of {TRACKER_STAGES.length}
              </span>
            </div>

            {/* Vertical timeline */}
            <div style={{ position: 'relative' }}>
              {/* Connector line */}
              <div style={{
                position: 'absolute', left: 27, top: 28, bottom: 28, width: 2,
                background: 'linear-gradient(to bottom, #38bdf8 0%, #334155 60%, #1e293b 100%)',
                zIndex: 0
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TRACKER_STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isDone = idx < activeIdx;
                  const isActive = idx === activeIdx;
                  const isPending = idx > activeIdx;

                  const nodeColor = isDone || isActive ? stage.color : '#334155';
                  const nodeBorder = isDone || isActive ? stage.color : '#1e293b';
                  const nodeBg = isDone
                    ? `rgba(${hexToRgb(stage.color)}, 0.2)`
                    : isActive
                    ? `rgba(${hexToRgb(stage.color)}, 0.15)`
                    : '#0d1527';

                  // Dynamic Stage Metadata
                  let stageMeta: string | null = null;
                  if (idx === 0) {
                    stageMeta = `Salesperson: ${selectedOrder.salesperson_name || 'Field Salesman'} · Booked ${selectedOrder.items?.length || 0} line items (${selectedOrder.total_box_qty || 0} boxes)`;
                  } else if (idx === 1) {
                    if (selectedOrder.approved_by_name) {
                      stageMeta = `Approved by ${selectedOrder.approved_by_name}${selectedOrder.approved_at ? ' on ' + selectedOrder.approved_at : ''} · Credit cleared`;
                    } else if (isHeld) {
                      stageMeta = `Hold Directive: ${selectedOrder.hold_reason || 'Credit check needed'}`;
                    } else if (isDone) {
                      stageMeta = `Commercial & credit approval completed`;
                    }
                  } else if (idx === 2) {
                    if (selectedOrder.invoice_number) {
                      stageMeta = `Invoice #${selectedOrder.invoice_number}${selectedOrder.invoice_date ? ' · Date: ' + selectedOrder.invoice_date : ''} · Invoiced: ₹${(selectedOrder.invoice_amount || selectedOrder.total_amount || 0).toLocaleString('en-IN')}`;
                    } else if (isActive) {
                      stageMeta = `Queued in Billing Console · Awaiting B2B Tax Invoicing`;
                    }
                  } else if (idx === 3) {
                    if (selectedOrder.vehicle_number || selectedOrder.driver_name) {
                      stageMeta = `Vehicle: ${selectedOrder.vehicle_number || 'Assigned'}${selectedOrder.driver_name ? ` · Driver: ${selectedOrder.driver_name}` : ''}${selectedOrder.driver_mobile ? ` (${selectedOrder.driver_mobile})` : ''}`;
                    } else if (isActive) {
                      stageMeta = `Warehouse staging & box packing in progress`;
                    }
                  } else if (idx === 4) {
                    if (['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.status)) {
                      stageMeta = `Vehicle in transit · Mode: ${selectedOrder.delivery_type || 'F.O.R'}${selectedOrder.vehicle_number ? ` via ${selectedOrder.vehicle_number}` : ''}`;
                    }
                  } else if (idx === 5) {
                    if (selectedOrder.status === 'COMPLETED') {
                      stageMeta = `Settled & complete · Verified clean POD sign-off`;
                    } else if (selectedOrder.status === 'DELIVERED') {
                      stageMeta = `Delivered to party location · Pending POD verification`;
                    } else if (selectedOrder.status === 'POD_ISSUE_RAISED') {
                      stageMeta = `Exception Desk: ${selectedOrder.pod_issue_type || 'Shortage / Return'}${selectedOrder.pod_issue_details ? ` — ${selectedOrder.pod_issue_details}` : ''}`;
                    } else if (selectedOrder.status === 'DELIVERY_REATTEMPTED') {
                      stageMeta = `Reattempted: New delivery order created ${selectedOrder.reattempt_order_number || ''}`;
                    }
                  }

                  return (
                    <div
                      key={stage.id}
                      style={{
                        display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                        paddingBottom: idx < TRACKER_STAGES.length - 1 ? '2rem' : 0,
                        position: 'relative', zIndex: 1
                      }}
                    >
                      {/* Node Circle */}
                      <div style={{ flexShrink: 0, position: 'relative' }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          background: nodeBg,
                          border: `2px solid ${nodeBorder}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isActive
                            ? `0 0 0 4px ${stage.glow}, 0 0 20px ${stage.glow}`
                            : isDone
                            ? `0 0 10px ${stage.glow}`
                            : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          {isDone ? (
                            <CheckCircle2 size={24} color={stage.color} />
                          ) : isActive ? (
                            <Icon size={24} color={stage.color} />
                          ) : (
                            <Icon size={22} color="#334155" />
                          )}
                        </div>

                        {/* Active Pulse Ring */}
                        {isActive && (
                          <div style={{
                            position: 'absolute', inset: -6,
                            borderRadius: '50%',
                            border: `2px solid ${stage.color}`,
                            opacity: 0.4,
                            animation: 'pulse 2s ease-in-out infinite'
                          }} />
                        )}
                      </div>

                      {/* Stage Content */}
                      <div style={{ flex: 1, paddingTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '1rem', fontWeight: 800,
                            color: isActive ? stage.color : isDone ? '#f8fafc' : '#475569'
                          }}>
                            {stage.label}
                          </span>

                          {isActive && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.2rem 0.7rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 900,
                              background: `rgba(${hexToRgb(stage.color)}, 0.2)`,
                              color: stage.color,
                              border: `1px solid ${stage.color}`,
                              textTransform: 'uppercase', letterSpacing: '0.07em'
                            }}>
                              <Clock size={11} /> CURRENT ACTIVE STAGE
                            </span>
                          )}

                          {isDone && (
                            <span style={{
                              fontSize: '0.7rem', color: '#34d399', fontWeight: 800,
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                            }}>
                              <CheckCircle2 size={12} /> Done
                            </span>
                          )}

                          {isPending && (
                            <span style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 700 }}>
                              Pending
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontSize: '0.825rem', color: isPending ? '#334155' : '#94a3b8',
                          marginTop: 4, fontWeight: 500
                        }}>
                          {stage.sublabel}
                        </div>

                        {/* Node Metadata Card */}
                        {stageMeta && (isDone || isActive) && (
                          <div style={{
                            marginTop: 10, padding: '0.65rem 1rem',
                            background: '#141f36', border: '1px solid #1e293b',
                            borderRadius: 10, fontSize: '0.8rem', color: '#cbd5e1',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            maxWidth: 600
                          }}>
                            <ArrowRight size={13} color={stage.color} />
                            <span>{stageMeta}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PRODUCT LINE ITEMS TABLE */}
          {selectedOrder.items && selectedOrder.items.length > 0 && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 20, padding: '1.75rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Order Breakdown
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: 3 }}>
                    Product Line Items ({selectedOrder.items.length})
                  </div>
                </div>
                <div style={{ fontSize: '0.825rem', color: '#38bdf8', fontWeight: 800 }}>
                  Total: {selectedOrder.total_qty_pcs || 0} PCS · {selectedOrder.total_box_qty || 0} Boxes
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', background: '#141f36' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase' }}>Product Name / SKU</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Boxes</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Ordered PCS</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Dispatched</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Pending</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase' }}>Rate (₹)</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #141f36' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 600 }}>
                          <div>{item.product_name}</div>
                          {item.product_code && <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{item.product_code}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#fbbf24', fontWeight: 800, textAlign: 'center' }}>
                          {item.box_qty || 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#38bdf8', fontWeight: 800, textAlign: 'center' }}>
                          {item.total_qty_pcs || 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#34d399', fontWeight: 800, textAlign: 'center' }}>
                          {item.dispatched_qty_pcs > 0 ? item.dispatched_qty_pcs : <span style={{ color: '#475569' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800 }}>
                          {item.pending_qty_pcs > 0 ? (
                            <span style={{ color: '#fb7185' }}>{item.pending_qty_pcs}</span>
                          ) : (
                            <span style={{ color: '#34d399' }}>✓ Nil</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>
                          ₹{Number(item.unit_price || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 800, textAlign: 'right' }}>
                          ₹{Number(item.total_price || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #1e293b', background: '#141f36' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#94a3b8' }}>Grand Total</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#fbbf24', textAlign: 'center' }}>{selectedOrder.total_box_qty} Boxes</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#38bdf8', textAlign: 'center' }}>{selectedOrder.total_qty_pcs} PCS</td>
                      <td colSpan={3} style={{ padding: '0.85rem 1rem', color: '#64748b', textAlign: 'right' }}>Total Invoiced / Order Value:</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#34d399', fontSize: '0.95rem', textAlign: 'right' }}>
                        ₹{(selectedOrder.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* LIVE ORDERS DIRECTORY TABLE (DEFAULT / UNSELECTED STATE) */
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 20, padding: '1.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Operational Pipeline
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: 3 }}>
                Live Orders Directory ({filteredDirectoryOrders.length} Orders)
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Click on any order to open its complete tracking journey
            </div>
          </div>

          {filteredDirectoryOrders.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '4rem 2rem', textAlign: 'center', gap: '1rem'
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(56,189,248,0.1)', border: '2px solid rgba(56,189,248,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ScanSearch size={36} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  No Orders Found
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                  {searchQuery ? `No orders match query "${searchQuery}"` : 'No orders in current filter tab'}
                </div>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '0.45rem 1rem', background: '#141f36', border: '1px solid #1e3a5f',
                    color: '#38bdf8', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', background: '#141f36' }}>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase' }}>Order Number</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase' }}>Party / Agency</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase' }}>Company</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount (₹)</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Volume</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.7rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDirectoryOrders.map(ord => {
                    const statusDetail = getStatusDetails(ord.status);
                    const isRN = ord.order_number.startsWith('RN-') || ord.reattempt_delivery;

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => handleSelectOrder(ord)}
                        style={{
                          borderBottom: '1px solid #141f36',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#141f36')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Order Number */}
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {ord.order_number}
                            </span>
                            {isRN && (
                              <span style={{
                                fontSize: '0.625rem', fontWeight: 900, padding: '0.1rem 0.4rem',
                                borderRadius: 6, background: 'rgba(245,158,11,0.2)', color: '#fbbf24',
                                border: '1px solid rgba(245,158,11,0.4)'
                              }}>
                                RN
                              </span>
                            )}
                          </div>
                          {ord.invoice_number && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                              Inv: #{ord.invoice_number}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
                          {formatDisplayDateTime(ord.order_date)}
                        </td>

                        {/* Party / Agency */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {resolveAgencyName(ord)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {resolveAgencyLocation(ord)}
                          </div>
                        </td>

                        {/* Company */}
                        <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontWeight: 600 }}>
                          {ord.company_name || 'Standard'}
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>
                          ₹{(ord.total_amount || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Volume */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{ord.total_box_qty || 0} Bx</span>
                          <span style={{ color: '#64748b', fontSize: '0.725rem' }}> ({ord.total_qty_pcs || 0} pcs)</span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.25rem 0.65rem',
                            borderRadius: 16, fontSize: '0.725rem', fontWeight: 800,
                            background: statusDetail.bg, color: statusDetail.color,
                            border: `1px solid ${statusDetail.border}`
                          }}>
                            {statusDetail.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectOrder(ord);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.35rem 0.8rem', background: '#1e3a5f',
                              border: '1px solid #38bdf8', borderRadius: 8,
                              color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Track Journey <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

// Helper: hex to rgb string "r,g,b"
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return isNaN(r) ? '148,163,184' : `${r},${g},${b}`;
}
