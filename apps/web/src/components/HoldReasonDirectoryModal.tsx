import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  Layers, 
  ArrowRight,
  ExternalLink,
  DollarSign,
  FileText,
  Boxes,
  MapPin,
  Building2,
  Check,
  Store
} from 'lucide-react';
import { Order, HoldReason, HoldReasonCategory } from '../types';
import { DEFAULT_HOLD_REASONS } from '../data/officialHoldReasonsData';
import { saveHoldReasonToSupabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface HoldReasonDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  onReleaseHold?: (orderId: string, remarks?: string) => void;
}

export const HoldReasonDirectoryModal: React.FC<HoldReasonDirectoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrder,
  onReleaseHold
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN';
  const isSalesAdmin = currentUser?.role_name === 'SALES_ADMIN';
  const canManageHold = isSuperAdmin || isSalesAdmin;

  const [activeTab, setActiveTab] = useState<'HELD_ORDERS' | 'DIRECTORY' | 'ADD_REASON'>('HELD_ORDERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | HoldReasonCategory>('ALL');

  const [holdReasons, setHoldReasons] = useState<HoldReason[]>(DEFAULT_HOLD_REASONS);

  // New Reason Form State
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<HoldReasonCategory>('FINANCIAL');
  const [newActionRule, setNewActionRule] = useState('');
  const [newSlaHours, setNewSlaHours] = useState(24);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Orders currently in HELD status
  const heldOrders = useMemo(() => {
    return orders.filter(o => o.status === 'HELD');
  }, [orders]);

  // Filtered held orders
  const filteredHeldOrders = useMemo(() => {
    return heldOrders.filter(o => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        o.order_number.toLowerCase().includes(q) ||
        (o.agency_name || '').toLowerCase().includes(q) ||
        (o.company_name || '').toLowerCase().includes(q) ||
        (o.hold_reason || '').toLowerCase().includes(q) ||
        (o.hold_remarks || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (categoryFilter !== 'ALL') {
        const reasonLower = (o.hold_reason || '').toLowerCase();
        if (categoryFilter === 'FINANCIAL' && !(reasonLower.includes('credit') || reasonLower.includes('overdue') || reasonLower.includes('cheque') || reasonLower.includes('payment'))) return false;
        if (categoryFilter === 'INVENTORY' && !(reasonLower.includes('stock') || reasonLower.includes('shortage') || reasonLower.includes('inventory'))) return false;
        if (categoryFilter === 'DISPUTE' && !(reasonLower.includes('price') || reasonLower.includes('dispute') || reasonLower.includes('claim') || reasonLower.includes('territory'))) return false;
        if (categoryFilter === 'OPERATIONAL' && !(reasonLower.includes('moq') || reasonLower.includes('freight') || reasonLower.includes('mgmt') || reasonLower.includes('admin'))) return false;
        if (categoryFilter === 'COMPLIANCE' && !(reasonLower.includes('gst') || reasonLower.includes('kyc') || reasonLower.includes('address'))) return false;
      }

      return true;
    });
  }, [heldOrders, searchQuery, categoryFilter]);

  // Directory filter
  const filteredDirectory = useMemo(() => {
    return holdReasons.filter(r => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        r.reason_code.toLowerCase().includes(q) ||
        r.reason_description.toLowerCase().includes(q) ||
        (r.action_rule || '').toLowerCase().includes(q)
      );
    });
  }, [holdReasons, searchQuery, categoryFilter]);

  const handleCreateHoldReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDesc.trim()) return;

    setIsSaving(true);
    const newReason: HoldReason = {
      id: `hr_${Date.now()}`,
      reason_code: newCode.trim().toUpperCase(),
      reason_description: newDesc.trim(),
      category: newCategory,
      action_rule: newActionRule.trim() || 'Super Admin exception review required',
      sla_hours: Number(newSlaHours) || 24,
      active: true,
      created_at: new Date().toISOString()
    };

    await saveHoldReasonToSupabase(newReason);
    setHoldReasons(prev => [newReason, ...prev]);
    setIsSaving(false);
    setSaveSuccess(`Hold Reason "${newReason.reason_code}" successfully registered!`);
    setNewCode('');
    setNewDesc('');
    setNewActionRule('');
    setTimeout(() => {
      setSaveSuccess(null);
      setActiveTab('DIRECTORY');
    }, 1500);
  };

  if (!isOpen) return null;

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'FINANCIAL': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' };
      case 'INVENTORY': return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fcd34d' };
      case 'DISPUTE': return { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#d8b4fe' };
      case 'COMPLIANCE': return { bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', text: '#7dd3fc' };
      default: return { bg: 'rgba(100, 116, 139, 0.2)', border: '#64748b', text: '#cbd5e1' };
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 14, 32, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal-card" style={{ maxWidth: 940, width: '95vw', maxHeight: '90vh', background: '#0f172a', border: '1px solid #f59e0b', borderRadius: 20, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: '#070e20', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.65rem', borderRadius: 12, color: '#fbbf24' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Hold Reason Directory & Governance
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: 20, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 800 }}>
                  {heldOrders.length} Held Orders
                </span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                Audit hold reasons, resolution SLAs, action policies, and live order exceptions directly from the dashboard
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: 10, padding: '0.45rem', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div style={{ padding: '0.75rem 1.5rem', background: '#0b1329', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('HELD_ORDERS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'HELD_ORDERS' ? '#f59e0b' : '#141f36',
                color: activeTab === 'HELD_ORDERS' ? '#090d16' : '#cbd5e1',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={15} /> 1. Held Orders ({heldOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('DIRECTORY')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'DIRECTORY' ? '#38bdf8' : '#141f36',
                color: activeTab === 'DIRECTORY' ? '#090d16' : '#cbd5e1',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Layers size={15} /> 2. Hold Reason Directory ({holdReasons.length})
            </button>

            {canManageHold && (
              <button
                onClick={() => setActiveTab('ADD_REASON')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'ADD_REASON' ? '#10b981' : '#141f36',
                  color: activeTab === 'ADD_REASON' ? '#090d16' : '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> 3. + Add Hold Reason
              </button>
            )}
          </div>

          {/* Search & Category Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search orders / reasons..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 1.85rem',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#070e20',
                  color: '#fff',
                  fontSize: '0.775rem',
                  width: 190
                }}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#070e20',
                color: '#38bdf8',
                fontSize: '0.775rem',
                fontWeight: 700
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="FINANCIAL">Financial</option>
              <option value="INVENTORY">Inventory</option>
              <option value="DISPUTE">Dispute / Pricing</option>
              <option value="OPERATIONAL">Operational / MOQ</option>
              <option value="COMPLIANCE">Compliance / GST</option>
            </select>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

          {/* =================================================================== */}
          {/* TAB 1: LIVE HELD ORDERS REVIEW */}
          {/* =================================================================== */}
          {activeTab === 'HELD_ORDERS' && (
            <div>
              {heldOrders.length === 0 ? (
                <div style={{ padding: '3.5rem 1rem', textAlign: 'center', background: '#0b1329', borderRadius: 16, border: '1px solid #1e293b' }}>
                  <CheckCircle2 size={48} color="#34d399" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>No Sales Orders Currently on Hold</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                    All orders are proceeding cleanly through commercial approval, billing, and dispatch clearance pipelines.
                  </p>
                </div>
              ) : filteredHeldOrders.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', background: '#0b1329', borderRadius: 12, color: '#94a3b8' }}>
                  No held orders match your search or category filter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredHeldOrders.map(order => (
                    <div 
                      key={order.id} 
                      style={{
                        background: '#0b1329',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: 14,
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{order.order_number}</strong>
                          <span style={{ fontSize: '0.725rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: '#1e293b', color: '#94a3b8', fontWeight: 700 }}>
                            {order.company_name || 'General Company'}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                            📅 {order.order_date ? new Date(order.order_date).toLocaleDateString('en-GB') : 'N/A'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fbbf24' }}>
                            ₹{(order.total_amount || 0).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            ({order.total_box_qty || 0} Boxes / {order.total_qty_pcs || 0} PCS)
                          </span>
                        </div>
                      </div>

                      {/* Agency & Territory */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Store size={14} color="#34d399" />
                          <strong style={{ color: '#f8fafc' }}>{order.agency_name || 'Unknown Agency'}</strong>
                        </div>
                        {order.area_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                            <MapPin size={14} color="#38bdf8" />
                            {order.area_name} ({order.zone_name || 'Surat Zone'})
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                          🚚 Mode: <strong style={{ color: '#f8fafc' }}>{order.delivery_type || 'F.O.R'}</strong>
                        </div>
                      </div>

                      {/* Hold Reason Banner */}
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 10,
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ShieldAlert size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>
                              Hold Reason: {order.hold_reason || 'Super Admin Commercial Directive'}
                            </span>
                            {order.hold_remarks && (
                              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                                <em>Remarks: "{order.hold_remarks}"</em>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          {onSelectOrder && (
                            <button
                              onClick={() => {
                                onClose();
                                onSelectOrder(order);
                              }}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: 8,
                                border: '1px solid #38bdf8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: '#38bdf8',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <ExternalLink size={13} /> View Order
                            </button>
                          )}

                          {canManageHold && onReleaseHold && (
                            <button
                              onClick={() => onReleaseHold(order.id, 'Released from Hold Directory')}
                              style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: 8,
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Check size={13} /> Release Hold
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: STANDARD HOLD REASON DIRECTORY */}
          {/* =================================================================== */}
          {activeTab === 'DIRECTORY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1' }}>
                  Standard Commercial & Operational Hold Codes ({filteredDirectory.length})
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Governed by Credit Policy & Super Admin SLA
                </span>
              </div>

              <div className="table-responsive" style={{ background: '#0b1329', borderRadius: 14, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#070e20', borderBottom: '1px solid #1e293b', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.725rem' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Reason Code</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Description & Scope</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Action Rule / Clearance Required</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>SLA</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Active Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDirectory.map(reason => {
                      const catStyle = getCategoryColor(reason.category);
                      const matchingHeldCount = heldOrders.filter(o => 
                        (o.hold_reason || '').toLowerCase().includes(reason.reason_code.toLowerCase()) ||
                        (o.hold_reason || '').toLowerCase().includes(reason.reason_description.slice(0, 15).toLowerCase())
                      ).length;

                      return (
                        <tr key={reason.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <code style={{ background: '#070e20', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: 6, fontWeight: 800 }}>
                              {reason.reason_code}
                            </code>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 6,
                              background: catStyle.bg,
                              color: catStyle.text,
                              border: `1px solid ${catStyle.border}`,
                              fontWeight: 800
                            }}>
                              {reason.category || 'OPERATIONAL'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 600 }}>
                            {reason.reason_description}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontSize: '0.775rem' }}>
                            {reason.action_rule || 'Super Admin review required'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Clock size={13} color="#fbbf24" /> {reason.sla_hours || 24}h
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: 20,
                              fontWeight: 900,
                              fontSize: '0.75rem',
                              background: matchingHeldCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.15)',
                              color: matchingHeldCount > 0 ? '#fbbf24' : '#94a3b8'
                            }}>
                              {matchingHeldCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: ADD NEW HOLD REASON */}
          {/* =================================================================== */}
          {activeTab === 'ADD_REASON' && (
            <div style={{ maxWidth: 620, margin: '0 auto', background: '#0b1329', padding: '1.5rem', borderRadius: 16, border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} color="#10b981" /> Register New Commercial Hold Code
              </h3>

              {saveSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={16} /> {saveSuccess}
                </div>
              )}

              <form onSubmit={handleCreateHoldReason} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      REASON CODE <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CR-LIMIT-OVERRIDE"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      CATEGORY <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <option value="FINANCIAL">Financial (Credit / Cheque / Ledger)</option>
                      <option value="INVENTORY">Inventory (Stock shortage / Allocation)</option>
                      <option value="DISPUTE">Dispute (Pricing / Scheme / Claim)</option>
                      <option value="OPERATIONAL">Operational (MOQ / Freight viability)</option>
                      <option value="COMPLIANCE">Compliance (GST / KYC / e-Way bill)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    DESCRIPTION & SCOPE <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Credit limit exceeded by more than ₹10,000 threshold"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    ACTION RULE / CLEARANCE DIRECTIVE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Accounts department receipt reconciliation required before release"
                    value={newActionRule}
                    onChange={e => setNewActionRule(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    RESOLUTION SLA (HOURS)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={newSlaHours}
                    onChange={e => setNewSlaHours(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DIRECTORY')}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ padding: '0.65rem 1.5rem', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isSaving ? 'Saving...' : 'Register Reason Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '0.85rem 1.5rem', background: '#070e20', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 }}>
          <div>
            Proline OMS 360 • Order Hold & Commercial Risk Control System
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f8fafc',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
