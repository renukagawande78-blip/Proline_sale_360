import React, { useState } from 'react';
import {
  PackageX,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
  AlertTriangle,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowRight,
  Package,
  Inbox
} from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isCompanyAllowedForUser } from '../../lib/supabase';

interface ReturnsRegisterViewProps {
  orders: Order[];
  onOpenProcessReturnModal?: (order: Order) => void;
  onSelectOrder?: (order: Order) => void;
  onResolveException?: (orderId: string, action: 'CREATE_GRN' | 'REATTEMPT_DELIVERY', grnNumber?: string, grnValue?: number) => void;
  onForwardGrnToBilling?: (orderId: string) => void;
  onCompleteOrderAfterGrn?: (orderId: string) => void;
}

type ReturnStatusFilter = 'ALL' | 'PENDING_ADMIN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DISPATCH_PROCESSED';
type ReturnTypeFilter = 'ALL' | 'DAMAGED_RETURN' | 'REPLACEMENT';

const FLOW_STEPS = [
  { key: 'raised', label: 'Return Raised', color: '#94a3b8', icon: Package },
  { key: 'approved', label: 'Admin Approved', color: '#34d399', icon: CheckCircle2 },
  { key: 'dispatch', label: 'Dispatch Action', color: '#38bdf8', icon: Truck },
  { key: 'closed', label: 'Closed / Settled', color: '#fbbf24', icon: CheckCircle2 },
];

function getActiveStep(status: string): number {
  if (status === 'PENDING_ADMIN_APPROVAL') return 0;
  if (status === 'APPROVED') return 1;
  if (status === 'DISPATCH_PROCESSED') return 3;
  if (status === 'REJECTED') return -1;
  return 0;
}

export const ReturnsRegisterView: React.FC<ReturnsRegisterViewProps> = ({
  orders,
  onOpenProcessReturnModal,
  onSelectOrder,
  onResolveException,
  onForwardGrnToBilling,
  onCompleteOrderAfterGrn
}) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role_name || '';
  const isDispatch = ['DISPATCH_MANAGER', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(role);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<ReturnTypeFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stage 7 Exception Desk State
  const [selectedExceptionOrder, setSelectedExceptionOrder] = useState<Order | null>(null);
  const [exceptionAction, setExceptionAction] = useState<'CREATE_GRN' | 'REATTEMPT_DELIVERY'>('CREATE_GRN');
  const [grnNumberInput, setGrnNumberInput] = useState('');
  const [grnValueInput, setGrnValueInput] = useState<number>(0);

  // All orders with a return request or delivery exception visible to this user
  const returnOrders = orders.filter(o => {
    const accessible = isCompanyAllowedForUser(o.company_name, currentUser?.company_handle);
    return accessible && (!!o.return_request || o.status === 'POD_ISSUE_RAISED');
  });

  const podExceptionOrders = orders.filter(o => o.status === 'POD_ISSUE_RAISED');

  const filtered = returnOrders.filter(o => {
    const rr = o.return_request!;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      o.order_number.toLowerCase().includes(q) ||
      (o.agency_name || '').toLowerCase().includes(q) ||
      (rr.requested_by_name || '').toLowerCase().includes(q) ||
      (rr.reason || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || rr.status === statusFilter;
    const matchType = typeFilter === 'ALL' || rr.return_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // KPI counts
  const kpiPending   = returnOrders.filter(o => o.return_request?.status === 'PENDING_ADMIN_APPROVAL').length;
  const kpiApproved  = returnOrders.filter(o => o.return_request?.status === 'APPROVED').length;
  const kpiProcessed = returnOrders.filter(o => o.return_request?.status === 'DISPATCH_PROCESSED').length;
  const kpiRejected  = returnOrders.filter(o => o.return_request?.status === 'REJECTED').length;
  const kpiDamaged   = returnOrders.filter(o => o.return_request?.return_type === 'DAMAGED_RETURN').length;
  const kpiReplace   = returnOrders.filter(o => o.return_request?.return_type === 'REPLACEMENT').length;

  return (
    <div className="page-body">

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Returns & Damage Register</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Centralized register for all Damaged Goods Returns & Stock Replacement Requests — from Salesperson raise to Dispatch settlement
          </p>
        </div>
        {kpiPending > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.35)',
            borderRadius: 10, padding: '0.5rem 1rem', color: '#fb7185', fontSize: '0.825rem', fontWeight: 800
          }}>
            <AlertTriangle size={16} /> {kpiPending} Awaiting Admin Approval
          </div>
        )}
        {kpiApproved > 0 && isDispatch && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.35)',
            borderRadius: 10, padding: '0.5rem 1rem', color: '#38bdf8', fontSize: '0.825rem', fontWeight: 800
          }}>
            <Truck size={16} /> {kpiApproved} Approved — Dispatch Action Required
          </div>
        )}
      </div>

      {/* Flow Guide Banner */}
      <div style={{
        background: '#141f36', border: '1px solid #1e293b', borderRadius: 14,
        padding: '1rem 1.25rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap'
      }}>
        {[
          { label: '1. Salesperson Raises Request', color: '#94a3b8', icon: Package },
          { label: '2. System Admin Reviews & Approves', color: '#34d399', icon: CheckCircle2 },
          { label: '3. Dispatch Collects Damage / Dispatches Replacement', color: '#38bdf8', icon: Truck },
          { label: '4. Closed & Settled', color: '#fbbf24', icon: CheckCircle2 }
        ].map((step, idx, arr) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 800, color: step.color }}>
                <Icon size={14} /> {step.label}
              </div>
              {idx < arr.length - 1 && <ArrowRight size={16} color="#334155" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage 7: Admin Exception Desk Banner */}
      {podExceptionOrders.length > 0 && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid #f43f5e', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185', fontWeight: 900, fontSize: '0.95rem' }}>
                <AlertTriangle size={18} /> STAGE 7: ADMIN EXCEPTION DESK — {podExceptionOrders.length} DELIVERY EXCEPTION(S) PENDING RESOLUTION
              </div>
              <p style={{ fontSize: '0.775rem', color: '#cbd5e1', marginTop: 4 }}>
                Delivery exceptions reported by Driver/Sales Admin. Option A: Create GRN to complete order. Option B: Reattempt delivery to Stage 5 with High Priority alert.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {podExceptionOrders.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setSelectedExceptionOrder(ex);
                    setExceptionAction('CREATE_GRN');
                    setGrnNumberInput('');
                    setGrnValueInput(ex.invoice_amount || ex.total_amount || 0);
                  }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: '#f43f5e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.775rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Resolve Order {ex.order_number}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Pending Approval', value: kpiPending, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', sub: 'Awaiting System Admin' },
          { label: 'Admin Approved', value: kpiApproved, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', sub: 'Dispatch Action Needed' },
          { label: 'Settled / Closed', value: kpiProcessed, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)', sub: 'Dispatch Processed' },
          { label: 'Rejected', value: kpiRejected, color: '#fb7185', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.25)', sub: 'Admin Rejected' },
          { label: 'Damaged Returns', value: kpiDamaged, color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', sub: 'Credit Note Required' },
          { label: 'Replacements', value: kpiReplace, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', sub: 'Fresh Stock Dispatch' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</span>
            <span style={{ fontSize: '0.675rem', color: '#64748b' }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#141f36', border: '1px solid #1e293b', borderRadius: 10,
          padding: '0.5rem 0.75rem', flex: '1 1 240px'
        }}>
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Search by order no., agency, salesperson, or reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.825rem', width: '100%' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ReturnStatusFilter)}
          style={{ padding: '0.5rem 0.85rem', background: '#141f36', border: '1px solid #1e293b', borderRadius: 10, color: '#f8fafc', fontSize: '0.825rem', outline: 'none', fontWeight: 700 }}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING_ADMIN_APPROVAL">⏳ Pending Approval</option>
          <option value="APPROVED">✅ Admin Approved</option>
          <option value="REJECTED">❌ Rejected</option>
          <option value="DISPATCH_PROCESSED">📦 Dispatch Processed</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ReturnTypeFilter)}
          style={{ padding: '0.5rem 0.85rem', background: '#141f36', border: '1px solid #1e293b', borderRadius: 10, color: '#f8fafc', fontSize: '0.825rem', outline: 'none', fontWeight: 700 }}>
          <option value="ALL">All Types</option>
          <option value="DAMAGED_RETURN">⚠️ Damaged Return</option>
          <option value="REPLACEMENT">🔄 Replacement</option>
        </select>
        <span style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {filtered.length} / {returnOrders.length} records
        </span>
      </div>

      {/* Returns Register Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ORDER NO.</th>
              <th>TYPE</th>
              <th>AGENCY / PARTY</th>
              <th>RAISED BY</th>
              <th>DATE</th>
              <th>REASON</th>
              <th>WORKFLOW STATUS</th>
              <th style={{ textAlign: 'center' }}>DISPATCH ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <Inbox size={44} color="#1e293b" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>No return or damage requests found</span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {returnOrders.length === 0
                        ? 'Returns are raised from Sales Orders → order Actions → Raise Return / Replacement'
                        : 'Try clearing your search or filter'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(order => {
                const rr = order.return_request!;
                const isDamaged = rr.return_type === 'DAMAGED_RETURN';
                const isExpanded = expandedId === order.id;
                const activeStep = getActiveStep(rr.status);
                const totalRequestedPcs = rr.items.reduce((s, i) => s + i.requested_qty_pcs, 0);
                const isAdminApproved = rr.status === 'APPROVED';
                const isProcessed = rr.status === 'DISPATCH_PROCESSED';
                const isPending = rr.status === 'PENDING_ADMIN_APPROVAL';
                const isRejected = rr.status === 'REJECTED';

                // Status badge config
                const statusBadge = isRejected
                  ? { label: 'Rejected by Admin', color: '#fb7185', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)' }
                  : isPending
                  ? { label: 'Pending Admin Approval', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' }
                  : isAdminApproved
                  ? { label: 'Admin Approved — Dispatch Pending', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)' }
                  : { label: 'Dispatch Processed & Closed', color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)' };

                return (
                  <React.Fragment key={order.id}>
                    <tr style={{ opacity: isRejected ? 0.6 : 1 }}>
                      <td>
                        <button
                          onClick={() => onSelectOrder?.(order)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.875rem' }}>{order.order_number}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{order.company_name}</div>
                        </button>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.25rem 0.65rem', borderRadius: 8, fontSize: '0.725rem', fontWeight: 800,
                          background: isDamaged ? 'rgba(249,115,22,0.15)' : 'rgba(167,139,250,0.15)',
                          color: isDamaged ? '#f97316' : '#a78bfa',
                          border: `1px solid ${isDamaged ? 'rgba(249,115,22,0.3)' : 'rgba(167,139,250,0.3)'}`
                        }}>
                          {isDamaged ? <PackageX size={12} /> : <RefreshCw size={12} />}
                          {isDamaged ? 'Damaged Return' : 'Replacement'}
                        </span>
                        <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: 3 }}>{totalRequestedPcs} PCS</div>
                      </td>

                      <td>
                        <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{order.agency_name}</strong>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} color="#94a3b8" />
                          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.825rem' }}>{rr.requested_by_name}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                          <Calendar size={13} />
                          <span>{new Date(rr.requested_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rr.reason}>
                          {rr.reason}
                        </span>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.3rem 0.65rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800,
                          background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`
                        }}>
                          {statusBadge.label}
                        </span>
                        {rr.approved_by_name && (
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 3 }}>
                            By: {rr.approved_by_name}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Details toggle */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            style={{
                              padding: '0.35rem 0.6rem',
                              background: isExpanded ? 'rgba(56,189,248,0.2)' : '#1e293b',
                              border: `1px solid ${isExpanded ? '#38bdf8' : '#334155'}`,
                              borderRadius: 7, color: isExpanded ? '#38bdf8' : '#94a3b8',
                              fontSize: '0.725rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700
                            }}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Items
                          </button>

                          {/* DISPATCH ACTION BUTTON — shown when Admin Approved */}
                          {isAdminApproved && isDispatch && onOpenProcessReturnModal && (
                            <button
                              onClick={() => onOpenProcessReturnModal(order)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                background: isDamaged
                                  ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))'
                                  : 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(56,189,248,0.1))',
                                border: isDamaged ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(56,189,248,0.5)',
                                borderRadius: 7,
                                color: isDamaged ? '#f97316' : '#38bdf8',
                                fontSize: '0.75rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800
                              }}
                              title={isDamaged ? 'Collect damaged stock from party & update inventory' : 'Dispatch fresh replacement stock to party'}
                            >
                              {isDamaged
                                ? <><ArrowDown size={13} /> Collect Damaged</>
                                : <><Truck size={13} /> Dispatch Replacement</>}
                            </button>
                          )}

                          {/* Already processed indicator */}
                          {isProcessed && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              fontSize: '0.7rem', color: '#34d399', fontWeight: 800
                            }}>
                              <CheckCircle2 size={13} /> Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: '0 1.25rem 1.25rem', background: 'rgba(15,23,42,0.97)' }}>
                          <div style={{
                            background: '#0f172a', border: `1px solid ${isDamaged ? 'rgba(249,115,22,0.3)' : 'rgba(167,139,250,0.3)'}`,
                            borderRadius: 14, padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem'
                          }}>
                            {/* Workflow Progress Bar */}
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                                Workflow Progress
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {[
                                  { label: 'Request Raised', done: true, active: false },
                                  { label: 'Admin Approval', done: !isPending && !isRejected, active: isPending, rejected: isRejected },
                                  { label: isDamaged ? 'Collect Damaged Stock' : 'Dispatch Replacement', done: isProcessed, active: isAdminApproved },
                                  { label: 'Closed & Settled', done: isProcessed, active: false }
                                ].map((step, idx, arr) => (
                                  <React.Fragment key={idx}>
                                    <div style={{
                                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                                      padding: '0.3rem 0.65rem', borderRadius: 8,
                                      fontSize: '0.7rem', fontWeight: 800,
                                      background: step.rejected ? 'rgba(244,63,94,0.15)' : step.done ? 'rgba(52,211,153,0.15)' : step.active ? 'rgba(56,189,248,0.15)' : '#141f36',
                                      color: step.rejected ? '#fb7185' : step.done ? '#34d399' : step.active ? '#38bdf8' : '#475569',
                                      border: `1px solid ${step.rejected ? 'rgba(244,63,94,0.3)' : step.done ? 'rgba(52,211,153,0.3)' : step.active ? 'rgba(56,189,248,0.3)' : '#1e293b'}`
                                    }}>
                                      {step.rejected ? <XCircle size={12} /> : step.done ? <CheckCircle2 size={12} /> : step.active ? <Clock size={12} /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #334155' }} />}
                                      {step.label}
                                    </div>
                                    {idx < arr.length - 1 && <ArrowRight size={14} color="#334155" />}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>

                            {/* Info Row */}
                            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                              <div>
                                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Request ID</div>
                                <div style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 800 }}>{rr.id}</div>
                              </div>
                              <div>
                                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Reason</div>
                                <div style={{ color: '#cbd5e1', fontStyle: 'italic' }}>"{rr.reason}"</div>
                              </div>
                              {rr.approved_by_name && (
                                <div>
                                  <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Approved By</div>
                                  <div style={{ color: '#34d399', fontWeight: 800 }}>{rr.approved_by_name}</div>
                                </div>
                              )}
                            </div>

                            {/* Items breakdown */}
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isDamaged ? '#f97316' : '#a78bfa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {isDamaged ? <><PackageX size={14} /> Damaged Stock Items — To Be Collected Back from Party</> : <><RefreshCw size={14} /> Replacement Items — Fresh Stock to Dispatch to Party</>}
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                    <th style={{ padding: '0.45rem 0.75rem', color: '#64748b', fontWeight: 800, textAlign: 'left', fontSize: '0.675rem', textTransform: 'uppercase' }}>Product / SKU</th>
                                    <th style={{ padding: '0.45rem 0.75rem', color: '#fbbf24', fontWeight: 800, textAlign: 'center', fontSize: '0.675rem', textTransform: 'uppercase' }}>Requested PCS</th>
                                    <th style={{ padding: '0.45rem 0.75rem', color: isDamaged ? '#f97316' : '#a78bfa', fontWeight: 800, textAlign: 'center', fontSize: '0.675rem', textTransform: 'uppercase' }}>
                                      {isDamaged ? 'Damaged Collected PCS' : 'Replacement Dispatched PCS'}
                                    </th>
                                    <th style={{ padding: '0.45rem 0.75rem', color: '#64748b', fontWeight: 800, textAlign: 'center', fontSize: '0.675rem', textTransform: 'uppercase' }}>Net Effect</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rr.items.map((item, idx) => {
                                    const settledQty = isDamaged ? (item.damaged_returned_qty_pcs ?? null) : (item.replaced_qty_pcs ?? null);
                                    return (
                                      <tr key={idx} style={{ borderBottom: '1px solid #0d1527' }}>
                                        <td style={{ padding: '0.5rem 0.75rem', color: '#f8fafc', fontWeight: 600 }}>{item?.product_name || 'Product SKU'}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', color: '#fbbf24', fontWeight: 800, textAlign: 'center' }}>{item.requested_qty_pcs}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, textAlign: 'center', color: isDamaged ? '#f97316' : '#a78bfa' }}>
                                          {settledQty !== null ? settledQty : <span style={{ color: '#475569' }}>Pending</span>}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                          {settledQty !== null ? (
                                            isDamaged
                                              ? <span style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><ArrowDown size={11} /> Billed Qty −{settledQty} PCS (Credit Note)</span>
                                              : <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>📦 +{settledQty} PCS Fresh Stock Sent</span>
                                          ) : (
                                            <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>Awaiting Dispatch Processing</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {rr.dispatch_notes && (
                              <div style={{ padding: '0.65rem 0.85rem', background: '#141f36', borderRadius: 8, border: '1px solid #1e293b', fontSize: '0.775rem', color: '#94a3b8' }}>
                                📋 <strong style={{ color: '#cbd5e1' }}>Dispatch Notes:</strong> {rr.dispatch_notes}
                              </div>
                            )}

                            {/* Dispatch CTA inside expanded section too */}
                            {isAdminApproved && isDispatch && onOpenProcessReturnModal && (
                              <button
                                onClick={() => { setExpandedId(null); onOpenProcessReturnModal(order); }}
                                style={{
                                  alignSelf: 'flex-start',
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  padding: '0.65rem 1.35rem',
                                  background: isDamaged
                                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                    : 'linear-gradient(135deg, #38bdf8, #0284c7)',
                                  color: 'white', fontWeight: 800, fontSize: '0.825rem',
                                  borderRadius: 10, border: 'none', cursor: 'pointer',
                                  boxShadow: isDamaged ? '0 4px 15px rgba(249,115,22,0.35)' : '0 4px 15px rgba(56,189,248,0.35)'
                                }}
                              >
                                {isDamaged
                                  ? <><PackageX size={16} /> Process: Collect Damaged Stock from Party & Update Inventory</>
                                  : <><Truck size={16} /> Process: Dispatch Fresh Replacement Stock to Party</>}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Stage 7: Exception Resolution Modal */}
      {selectedExceptionOrder && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="#fb7185" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Stage 7: Admin Exception Resolution
                </h3>
              </div>
              <button onClick={() => setSelectedExceptionOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <div>Order No: <strong style={{ color: '#38bdf8' }}>{selectedExceptionOrder.order_number}</strong> | Agency: <strong style={{ color: '#f8fafc' }}>{selectedExceptionOrder.agency_name}</strong></div>
              <div style={{ color: '#fb7185', marginTop: 4, fontWeight: 700 }}>
                Exception Type: {selectedExceptionOrder.pod_issue_type || 'POD_ISSUE_RAISED'} ({selectedExceptionOrder.pod_issue_details || 'Issue reported during delivery drop'})
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>
                SELECT RESOLUTION OPTION
              </label>

              {selectedExceptionOrder.grn_workflow_status === 'PENDING_SALES_ADMIN_COMPLETION' && role === 'SALES_ADMIN' ? (
                <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: 8, padding: '1rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 700 }}>
                  Billing created GRN <strong>{selectedExceptionOrder.grn_number}</strong> dated {selectedExceptionOrder.grn_date || '—'} for ₹{Number(selectedExceptionOrder.grn_value || 0).toLocaleString('en-IN')}. Remark: {selectedExceptionOrder.grn_remark || '—'}. Verify the GRN to mark this order completed.
                </div>
              ) : selectedExceptionOrder.grn_workflow_status === 'PENDING_SALES_ADMIN' && role === 'SALES_ADMIN' ? (
                <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', borderRadius: 8, padding: '1rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
                  Admin has forwarded this GRN request. Review the exception and forward it to Billing for GRN creation.
                </div>
              ) : <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setExceptionAction('CREATE_GRN')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: exceptionAction === 'CREATE_GRN' ? '2px solid #34d399' : '1px solid #334155',
                    background: exceptionAction === 'CREATE_GRN' ? 'rgba(52,211,153,0.15)' : '#0f172a',
                    color: exceptionAction === 'CREATE_GRN' ? '#34d399' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Option A: Forward GRN Request to Sales Admin
                </button>

                <button
                  type="button"
                  onClick={() => setExceptionAction('REATTEMPT_DELIVERY')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: exceptionAction === 'REATTEMPT_DELIVERY' ? '2px solid #f59e0b' : '1px solid #334155',
                    background: exceptionAction === 'REATTEMPT_DELIVERY' ? 'rgba(245,158,11,0.15)' : '#0f172a',
                    color: exceptionAction === 'REATTEMPT_DELIVERY' ? '#fbbf24' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Option B: Reattempt Delivery (Stage 5 Alert)
                </button>
              </div>

              {exceptionAction === 'CREATE_GRN' ? (
                <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: 8, padding: '0.85rem', color: '#34d399', fontSize: '0.775rem' }}>
                  The GRN request will be sent to Sales Admin for review. Billing will enter the GRN number and value after Sales Admin forwards it.
                </div>
              ) : (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: 8, padding: '0.85rem', color: '#fbbf24', fontSize: '0.775rem' }}>
                  🚨 <strong>High Priority Reattempt:</strong> Order will be re-routed back to <strong>Stage 5 (Dispatch Team)</strong> with a High Priority alert flag for re-dispatch.
                </div>
              )}</>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedExceptionOrder(null)}>Cancel</button>
              <button
                className={exceptionAction === 'CREATE_GRN' ? 'btn btn-success' : 'btn btn-warning'}
                onClick={() => {
                  if (selectedExceptionOrder.grn_workflow_status === 'PENDING_SALES_ADMIN_COMPLETION' && role === 'SALES_ADMIN') {
                    onCompleteOrderAfterGrn?.(selectedExceptionOrder.id);
                    setSelectedExceptionOrder(null);
                    return;
                  }
                  if (selectedExceptionOrder.grn_workflow_status === 'PENDING_SALES_ADMIN' && role === 'SALES_ADMIN') {
                    onForwardGrnToBilling?.(selectedExceptionOrder.id);
                    setSelectedExceptionOrder(null);
                    return;
                  }
                  if (onResolveException) {
                    onResolveException(selectedExceptionOrder.id, exceptionAction, grnNumberInput, grnValueInput);
                  }
                  setSelectedExceptionOrder(null);
                }}
                style={{ fontWeight: 800 }}
              >
                {selectedExceptionOrder.grn_workflow_status === 'PENDING_SALES_ADMIN_COMPLETION' && role === 'SALES_ADMIN'
                  ? 'Mark Order Completed'
                  : selectedExceptionOrder.grn_workflow_status === 'PENDING_SALES_ADMIN' && role === 'SALES_ADMIN'
                  ? 'Forward GRN Request to Billing'
                  : exceptionAction === 'CREATE_GRN' ? 'Forward GRN Request to Sales Admin' : 'Re-route to Stage 3 Stock Check'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
