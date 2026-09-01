import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  Clock, 
  Check, 
  ShieldAlert,
  Layers,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { HoldReason, HoldReasonCategory } from '../../types';
import { DEFAULT_HOLD_REASONS } from '../../data/officialHoldReasonsData';
import { saveHoldReasonToSupabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface HoldReasonsMasterViewProps {
  searchQuery?: string;
}

export const HoldReasonsMasterView: React.FC<HoldReasonsMasterViewProps> = ({
  searchQuery: externalSearchQuery = ''
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN';
  const isSalesAdmin = currentUser?.role_name === 'SALES_ADMIN';
  const canManage = isSuperAdmin || isSalesAdmin;

  const [holdReasons, setHoldReasons] = useState<HoldReason[]>(DEFAULT_HOLD_REASONS);
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | HoldReasonCategory>('ALL');

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<HoldReasonCategory>('FINANCIAL');
  const [newActionRule, setNewActionRule] = useState('');
  const [newSlaHours, setNewSlaHours] = useState(24);
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const effectiveSearch = (externalSearchQuery || internalSearch).toLowerCase().trim();

  const filteredReasons = useMemo(() => {
    return holdReasons.filter(r => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (!effectiveSearch) return true;
      return (
        r.reason_code.toLowerCase().includes(effectiveSearch) ||
        r.reason_description.toLowerCase().includes(effectiveSearch) ||
        (r.action_rule || '').toLowerCase().includes(effectiveSearch)
      );
    });
  }, [holdReasons, selectedCategory, effectiveSearch]);

  const handleAddReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDesc.trim()) return;

    setIsSaving(true);
    const newReason: HoldReason = {
      id: `hr_${Date.now()}`,
      reason_code: newCode.trim().toUpperCase(),
      reason_description: newDesc.trim(),
      category: newCategory,
      action_rule: newActionRule.trim() || 'Super Admin commercial review required',
      sla_hours: Number(newSlaHours) || 24,
      active: true,
      created_at: new Date().toISOString()
    };

    await saveHoldReasonToSupabase(newReason);
    setHoldReasons(prev => [newReason, ...prev]);
    setIsSaving(false);
    setIsAddModalOpen(false);
    setSuccessNotice(`Hold Reason "${newReason.reason_code}" added successfully!`);
    setNewCode('');
    setNewDesc('');
    setNewActionRule('');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'FINANCIAL': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' };
      case 'INVENTORY': return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fcd34d' };
      case 'DISPUTE': return { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#d8b4fe' };
      case 'COMPLIANCE': return { bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', text: '#7dd3fc' };
      default: return { bg: 'rgba(100, 116, 139, 0.2)', border: '#64748b', text: '#cbd5e1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner & Actions */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.7))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: 12, color: '#fbbf24' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Hold Reason Directory & Governance
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: 20, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                {holdReasons.length} Standard Codes
              </span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
              Super Admin commercial risk parameters, credit limits, inventory holds, and approval override SLAs
            </p>
          </div>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: '#090d16',
              fontWeight: 800,
              fontSize: '0.825rem'
            }}
          >
            <Plus size={16} /> Add Hold Reason
          </button>
        )}
      </div>

      {successNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      {/* Filter Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.775rem', color: '#94a3b8', fontWeight: 700, marginRight: 4 }}>Filter Category:</span>
        {(['ALL', 'FINANCIAL', 'INVENTORY', 'DISPUTE', 'OPERATIONAL', 'COMPLIANCE'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 8,
              border: selectedCategory === cat ? '1px solid #f59e0b' : '1px solid #334155',
              background: selectedCategory === cat ? 'rgba(245, 158, 11, 0.2)' : '#0f172a',
              color: selectedCategory === cat ? '#fbbf24' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat === 'ALL' ? 'All Reasons' : cat}
          </button>
        ))}
      </div>

      {/* Directory Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Reason Code</th>
              <th style={{ width: '13%' }}>Category</th>
              <th style={{ width: '38%' }}>Description & Root Cause</th>
              <th style={{ width: '24%' }}>Required Clearance Action</th>
              <th style={{ width: '10%', textAlign: 'center' }}>SLA</th>
            </tr>
          </thead>
          <tbody>
            {filteredReasons.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  No hold reasons match your query.
                </td>
              </tr>
            ) : (
              filteredReasons.map(r => {
                const badge = getCategoryBadge(r.category);
                return (
                  <tr key={r.id}>
                    <td>
                      <code style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        padding: '0.25rem 0.55rem',
                        borderRadius: 6,
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.8rem'
                      }}>
                        {r.reason_code}
                      </code>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6,
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        fontWeight: 800
                      }}>
                        {r.category || 'OPERATIONAL'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{r.reason_description}</strong>
                    </td>
                    <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                      {r.action_rule || 'Super Admin review required'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.775rem', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
                        <Clock size={13} /> {r.sla_hours || 24}h
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Reason Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 14, 32, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-card" style={{ maxWidth: 540, width: '100%', background: '#0f172a', border: '1px solid #f59e0b', borderRadius: 16, padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} color="#f59e0b" /> Add New Commercial Hold Reason
            </h3>

            <form onSubmit={handleAddReason} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    CODE (UPPERCASE) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CR-LIMIT-MAX"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    CATEGORY <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <option value="FINANCIAL">Financial (Credit / Cheque)</option>
                    <option value="INVENTORY">Inventory (Stock shortage)</option>
                    <option value="DISPUTE">Dispute (Pricing / Scheme)</option>
                    <option value="OPERATIONAL">Operational (MOQ / Freight)</option>
                    <option value="COMPLIANCE">Compliance (GST / Address)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  DESCRIPTION & SCOPE <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outstanding invoices past 45 days overdue"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  ACTION RULE / CLEARANCE DIRECTIVE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Accounts department clearance sign-off required"
                  value={newActionRule}
                  onChange={e => setNewActionRule(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  SLA (HOURS)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={newSlaHours}
                  onChange={e => setNewSlaHours(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid #334155', background: '#070e20', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#090d16', fontWeight: 800 }}
                >
                  {isSaving ? 'Saving...' : 'Save Hold Reason'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
