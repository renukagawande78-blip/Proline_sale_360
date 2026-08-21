import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit3, Trash2, Plus, Check, X, Layers, Users, Shield, Truck, Receipt, Briefcase, UserCheck } from 'lucide-react';
import { Company, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BulkImportModal } from '../../components/BulkImportModal';
import {
  supabase,
  checkIsSuperAdmin,
  deleteCompanyFromSupabase,
  saveCompanyToSupabase,
  fetchCompaniesFromSupabase,
  fetchUsersFromSupabase,
  deduplicateCompanies,
  saveUserToSupabase,
  generateUuid,
} from '../../lib/supabase';

interface SegmentOption {
  id: string;
  segment_code: string;
  segment_name: string;
  description?: string;
}

interface BrandsMasterViewProps {
  companies: Company[];
  searchQuery: string;
}

const BRAND_PALETTE = [
  '#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4',
  '#3b82f6','#14b8a6','#a855f7','#10b981','#f97316',
  '#84cc16','#f43f5e','#6366f1','#38bdf8','#fb923c',
];

const SEGMENT_THEME_COLORS: Record<string, { bg: string; color: string; border: string; pillColor: string }> = {
  FMCG: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)', pillColor: '#10b981' },
  FMCD: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)', pillColor: '#fbbf24' },
};

const DEFAULT_SEGMENT_THEME = {
  bg: 'rgba(139,92,246,0.12)',
  color: '#a78bfa',
  border: '1px solid rgba(139,92,246,0.35)',
  pillColor: '#8b5cf6',
};

export const BrandsMasterView: React.FC<BrandsMasterViewProps> = ({ searchQuery }) => {
  const { currentUser, updateUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localCompanies, setLocalCompanies] = useState<Company[]>([]);
  const [segmentsList, setSegmentsList] = useState<SegmentOption[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Add Company modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [addName, setAddName] = useState('');
  const [addHandle, setAddHandle] = useState('');
  const [addSegment, setAddSegment] = useState<string>('FMCG');
  const [addColor, setAddColor] = useState('#38bdf8');
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Team Assignment Modal state
  const [teamModalCompany, setTeamModalCompany] = useState<Company | null>(null);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  // Load Companies, Segments, and Users from Supabase on mount
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      fetchCompaniesFromSupabase(),
      supabase.from('segments').select('*').order('segment_code'),
      fetchUsersFromSupabase()
    ]).then(([liveCompanies, { data: liveSegments }, liveUsers]) => {
      if (mounted) {
        setLocalCompanies(liveCompanies?.length ? deduplicateCompanies(liveCompanies) : []);
        if (liveSegments && liveSegments.length > 0) {
          setSegmentsList(liveSegments);
          if (!liveSegments.some(s => s.segment_code === addSegment)) {
            setAddSegment(liveSegments[0].segment_code);
          }
        } else {
          setSegmentsList([
            { id: 'seg_fmcg_001', segment_code: 'FMCG', segment_name: 'Fast Moving Consumer Goods' },
            { id: 'seg_fmcd_001', segment_code: 'FMCD', segment_name: 'Fast Moving Consumer Durables' }
          ]);
        }
        if (liveUsers && liveUsers.length > 0) {
          setAllUsersList(liveUsers);
        }
        setIsLoading(false);
      }
    });

    return () => { mounted = false; };
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSyncLiveDb = async () => {
    setIsSyncing(true);
    setFeedbackMsg('🔄 Syncing live Brand Companies, Teams, and Segments from Supabase...');
    const [liveCompanies, { data: liveSegments }, liveUsers] = await Promise.all([
      fetchCompaniesFromSupabase(),
      supabase.from('segments').select('*').order('segment_code'),
      fetchUsersFromSupabase()
    ]);

    if (liveCompanies?.length) setLocalCompanies(deduplicateCompanies(liveCompanies));
    if (liveSegments?.length) setSegmentsList(liveSegments);
    if (liveUsers?.length) setAllUsersList(liveUsers);

    showFeedback(`✅ Sync Complete! Loaded ${liveCompanies?.length || 0} Companies & ${liveUsers?.length || 0} Users from Supabase.`);
    setIsSyncing(false);
  };

  const handleDeleteBrand = async (companyId: string, companyName: string) => {
    if (!window.confirm(`Delete Company "${companyName}"? This is a Super Admin action.`)) return;
    setLocalCompanies(prev => prev.filter(c => c.id !== companyId));
    await deleteCompanyFromSupabase(companyId);
    showFeedback(`Deleted "${companyName}" from Supabase.`);
  };

  const handleEditBrand = async (c: Company) => {
    const newName = window.prompt(`Update Company Name for [${c.company_code}]:`, c.company_name);
    if (newName === null) return;
    const updated: Company = { ...c, company_name: newName.trim() || c.company_name };
    setLocalCompanies(prev => prev.map(item => item.id === c.id ? updated : item));
    const res = await saveCompanyToSupabase(updated);
    showFeedback(res.success
      ? `✅ Updated "${updated.company_name}" in Supabase!`
      : `Updated locally. (Supabase: ${res.error})`);
  };

  const handleSegmentChange = async (c: Company, newSegment: string) => {
    const updated = { ...c, segment: newSegment as any };
    setLocalCompanies(prev => prev.map(item => item.id === c.id ? updated : item));
    const res = await saveCompanyToSupabase(updated);
    showFeedback(res.success
      ? `✅ Segment mapped to "${newSegment}" for "${c.company_name}" in Supabase!`
      : `Segment updated locally. (Supabase: ${res.error})`);
  };

  const handleAddCompany = async () => {
    if (!addCode.trim() || !addName.trim()) return;
    setIsSavingNew(true);
    const newCompany: Company = {
      id: generateUuid(),
      company_code: addCode.trim().toUpperCase(),
      company_name: addName.trim(),
      handle: addHandle.trim() || addName.trim(),
      segment: addSegment as any,
      brand_color: addColor,
      active: true,
    };
    setLocalCompanies(prev => [newCompany, ...prev]);
    const res = await saveCompanyToSupabase(newCompany);
    setIsAddOpen(false);
    setAddCode(''); setAddName(''); setAddHandle(''); setAddSegment(segmentsList[0]?.segment_code || 'FMCG'); setAddColor('#38bdf8');
    setIsSavingNew(false);
    showFeedback(res.success
      ? `✅ Company "${newCompany.company_name}" (${newCompany.segment}) saved to Supabase!`
      : `Company added locally. (Supabase: ${res.error})`);
  };

  // Check if a user belongs to a specific company
  const isUserAssignedToCompany = (user: User, company: Company): boolean => {
    if (user.role_name === 'SUPER_ADMIN') return true;
    const nameLower = (user.full_name || '').toLowerCase();
    if (nameLower.includes('chirag') || nameLower.includes('harshad')) return true;
    const handle = (user.company_handle || '').trim().toLowerCase();
    if (handle === 'all' || !handle) return true;
    const cName = company.company_name.toLowerCase();
    const cCode = company.company_code.toLowerCase();
    return handle.includes(cName) || handle.includes(cCode);
  };

  // Toggle assigning/unassigning a user to a company
  const handleToggleUserCompany = async (user: User, company: Company) => {
    if (user.role_name === 'SUPER_ADMIN' || (user.full_name || '').toLowerCase().includes('chirag') || (user.full_name || '').toLowerCase().includes('harshad')) {
      showFeedback(`👑 ${user.full_name} is Super Admin with universal access to ALL companies.`);
      return;
    }
    const currentHandle = user.company_handle || 'All';
    let newHandle = '';

    if (currentHandle === 'All') {
      // If currently all, restricting to this company specifically
      newHandle = company.company_name;
    } else {
      const handles = currentHandle.split(',').map(s => s.trim()).filter(Boolean);
      const exists = handles.some(h => h.toLowerCase() === company.company_name.toLowerCase());
      if (exists) {
        const remaining = handles.filter(h => h.toLowerCase() !== company.company_name.toLowerCase());
        newHandle = remaining.length > 0 ? remaining.join(', ') : 'All';
      } else {
        handles.push(company.company_name);
        newHandle = handles.join(', ');
      }
    }

    const updatedUser: User = { ...user, company_handle: newHandle };
    setAllUsersList(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    if (updateUser) updateUser(user.id, { company_handle: newHandle });
    await saveUserToSupabase(updatedUser);
    showFeedback(`Updated brand assignment for ${user.full_name}: "${newHandle}" in Supabase!`);
  };

  const filteredCompanies = localCompanies.filter(c => {
    if (selectedSegment !== 'ALL' && (c.segment || '').toUpperCase() !== selectedSegment.toUpperCase()) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(q) ||
      c.company_code.toLowerCase().includes(q) ||
      (c.segment || '').toLowerCase().includes(q) ||
      (c.handle || '').toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#38bdf8', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading companies, segments, and assigned team members from Supabase...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', background: '#141f36', padding: '0.65rem 0.85rem', borderRadius: '14px', border: '1px solid #1e293b' }}>

        {/* Dynamic Segment Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#0b1329', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedSegment('ALL')}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: selectedSegment === 'ALL' ? '#38bdf8' : 'transparent',
              color: selectedSegment === 'ALL' ? '#090d16' : '#94a3b8',
              fontWeight: 800, fontSize: '0.775rem', transition: 'all 0.15s ease',
            }}
          >
            All Brands ({localCompanies.length})
          </button>

          {segmentsList.map(seg => {
            const count = localCompanies.filter(c => (c.segment || '').toUpperCase() === seg.segment_code.toUpperCase()).length;
            const theme = SEGMENT_THEME_COLORS[seg.segment_code] || DEFAULT_SEGMENT_THEME;
            const isSelected = selectedSegment === seg.segment_code;

            return (
              <button
                key={seg.id}
                onClick={() => setSelectedSegment(seg.segment_code)}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: isSelected ? theme.pillColor : 'transparent',
                  color: isSelected ? '#090d16' : '#94a3b8',
                  fontWeight: 800, fontSize: '0.775rem', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '0.35rem'
                }}
              >
                <Layers size={12} />
                {seg.segment_code} ({count})
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleSyncLiveDb}
            disabled={isSyncing}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #38bdf8', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={13} /> {isSyncing ? 'Syncing...' : 'Sync Live DB'}
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setIsAddOpen(true)}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #10b981', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={13} /> Add Company
            </button>
          )}
        </div>
      </div>

      {/* Feedback Notice */}
      {feedbackMsg && (
        <div style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={15} /> {feedbackMsg}
        </div>
      )}

      {/* Team Assignment Modal */}
      {teamModalCompany && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="#38bdf8" /> Assign Company Team: {teamModalCompany.company_name} [{teamModalCompany.company_code}]
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  Map specific Sales Admins, ASMs, Sales Persons, Dispatch Managers, and Billing Officers to this company.
                </p>
              </div>
              <button onClick={() => setTeamModalCompany(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.35rem' }}>
              {/* Super Admin Universal Governance Section */}
              <div style={{ background: 'rgba(239,68,68,0.08)', padding: '0.75rem', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={14} color="#f87171" />
                  <span>👑 Super Admins (Universal Executive Authority - Both Persons Included)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {allUsersList.filter(u => u.role_name === 'SUPER_ADMIN' || (u.full_name || '').toLowerCase().includes('chirag') || (u.full_name || '').toLowerCase().includes('harshad')).map(u => (
                    <div
                      key={u.id}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.18)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <UserCheck size={12} color="#f87171" />
                      <span>{u.full_name}</span>
                      <span style={{ fontSize: '0.65rem', color: '#fca5a5', background: 'rgba(239,68,68,0.3)', padding: '1px 5px', borderRadius: 4 }}>
                        ALL COMPANIES (ACTIVE)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {(['SALES_ADMIN', 'AREA_SALES_MANAGER', 'SALES_PERSON', 'DISPATCH_MANAGER', 'BILLING'] as const).map(roleKey => {
                const roleUsers = allUsersList.filter(u => u.role_name === roleKey);
                const roleLabels: Record<string, { label: string; color: string }> = {
                  SALES_ADMIN: { label: '💼 Sales Admins', color: '#fbbf24' },
                  AREA_SALES_MANAGER: { label: '🗺️ Area Sales Managers (ASM)', color: '#c084fc' },
                  SALES_PERSON: { label: '🛍️ Field Sales Persons', color: '#38bdf8' },
                  DISPATCH_MANAGER: { label: '🚚 Dispatch Managers', color: '#f472b6' },
                  BILLING: { label: '🧾 Billing Officers', color: '#34d399' }
                };
                const info = roleLabels[roleKey];

                return (
                  <div key={roleKey} style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 10, border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: 800, color: info.color, marginBottom: '0.5rem' }}>
                      {info.label} ({roleUsers.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {roleUsers.length === 0 ? (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>No users in this role</span>
                      ) : (
                        roleUsers.map(user => {
                          const isAssigned = isUserAssignedToCompany(user, teamModalCompany);
                          const isScopeAll = (user.company_handle || '').toLowerCase() === 'all';

                          return (
                            <button
                              key={user.id}
                              onClick={() => handleToggleUserCompany(user, teamModalCompany)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 8,
                                border: isAssigned ? `1px solid ${info.color}` : '1px solid #334155',
                                background: isAssigned ? `${info.color}22` : '#1e293b',
                                color: isAssigned ? '#ffffff' : '#94a3b8',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <UserCheck size={12} color={isAssigned ? info.color : '#64748b'} />
                              <span>{user.full_name}</span>
                              {isScopeAll && (
                                <span style={{ fontSize: '0.65rem', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '1px 4px', borderRadius: 4 }}>
                                  ALL
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => setTeamModalCompany(null)} style={{ background: '#38bdf8', color: '#090d16', border: 'none', fontWeight: 800 }}>
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>➕ Add New Company / Brand</h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: '0 0 110px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>BRAND CODE *</label>
                  <input
                    type="text" maxLength={6} placeholder="e.g. PG"
                    value={addCode} onChange={e => setAddCode(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 800, fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>COMPANY NAME *</label>
                  <input
                    type="text" placeholder="e.g. Priyagold"
                    value={addName} onChange={e => setAddName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>HANDLE / DISPLAY NAME</label>
                <input
                  type="text" placeholder="Short name for users e.g. Priyagold"
                  value={addHandle} onChange={e => setAddHandle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>INDUSTRY SEGMENT (FROM SEGMENT MASTER) *</label>
                  <select
                    value={addSegment}
                    onChange={e => setAddSegment(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.875rem', fontWeight: 700 }}
                  >
                    {segmentsList.map(seg => (
                      <option key={seg.id} value={seg.segment_code}>
                        {seg.segment_code} — {seg.segment_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>BRAND COLOR</label>
                  <input type="color" value={addColor} onChange={e => setAddColor(e.target.value)}
                    style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid #334155', background: 'none', cursor: 'pointer', padding: 2 }}
                  />
                </div>
              </div>

              {/* Color Palette Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>QUICK COLOR PALETTE</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {BRAND_PALETTE.map(col => (
                    <button
                      key={col}
                      onClick={() => setAddColor(col)}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: col, border: addColor === col ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsAddOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleAddCompany}
                disabled={isSavingNew || !addCode.trim() || !addName.trim()}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              >
                {isSavingNew ? 'Saving...' : '✓ Save to Supabase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Companies & Assigned Teams Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Code</th>
              <th>Company / Brand</th>
              <th>Segment</th>
              <th>Assigned Company Team (Hierarchy)</th>
              <th style={{ textAlign: 'center' }}>Team Assignment</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((c, idx) => {
              const currentSegmentCode = (c.segment as string) || 'FMCG';
              const segStyle = SEGMENT_THEME_COLORS[currentSegmentCode.toUpperCase()] || DEFAULT_SEGMENT_THEME;
              const brandColor = (c as any).brand_color || '#38bdf8';

              // Get assigned users by role for this company
              const companyAdmins = allUsersList.filter(u => u.role_name === 'SALES_ADMIN' && isUserAssignedToCompany(u, c));
              const companyASMs = allUsersList.filter(u => u.role_name === 'AREA_SALES_MANAGER' && isUserAssignedToCompany(u, c));
              const companySales = allUsersList.filter(u => u.role_name === 'SALES_PERSON' && isUserAssignedToCompany(u, c));
              const companyDispatch = allUsersList.filter(u => u.role_name === 'DISPATCH_MANAGER' && isUserAssignedToCompany(u, c));
              const companyBilling = allUsersList.filter(u => u.role_name === 'BILLING' && isUserAssignedToCompany(u, c));

              return (
                <tr key={c.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{idx + 1}</strong></td>
                  
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: brandColor }} />
                      <code style={{ color: '#38bdf8', fontWeight: 900, fontSize: '0.85rem' }}>{c.company_code}</code>
                    </div>
                  </td>

                  <td>
                    <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{c.company_name}</strong>
                  </td>

                  <td>
                    <select
                      value={currentSegmentCode}
                      onChange={e => handleSegmentChange(c, e.target.value)}
                      style={{ padding: '0.25rem 0.55rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, background: segStyle.bg, color: segStyle.color, border: segStyle.border, cursor: 'pointer' }}
                    >
                      {segmentsList.map(seg => (
                        <option key={seg.id} value={seg.segment_code}>
                          {seg.segment_code}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Designated Team Summary Badges */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>👑 Super Admin:</span>
                        <span style={{ color: '#fca5a5', fontWeight: 700, background: 'rgba(239,68,68,0.12)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.25)' }}>
                          Chirag &amp; Harshad (All Companies)
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>Admin:</span>
                        <span style={{ color: '#cbd5e1' }}>{companyAdmins.length > 0 ? companyAdmins.map(u => u.full_name).join(', ') : 'All'}</span>
                        <span style={{ color: '#64748b' }}>|</span>
                        <span style={{ color: '#c084fc', fontWeight: 700 }}>ASM:</span>
                        <span style={{ color: '#cbd5e1' }}>{companyASMs.length > 0 ? companyASMs.map(u => u.full_name).join(', ') : 'All'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>Sales ({companySales.length}):</span>
                        <span style={{ color: '#cbd5e1' }}>{companySales.slice(0, 3).map(u => u.full_name).join(', ')}{companySales.length > 3 ? ` +${companySales.length - 3}` : ''}</span>
                        <span style={{ color: '#64748b' }}>|</span>
                        <span style={{ color: '#f472b6', fontWeight: 700 }}>Dispatch:</span>
                        <span style={{ color: '#cbd5e1' }}>{companyDispatch.length > 0 ? companyDispatch.map(u => u.full_name).join(', ') : 'All'}</span>
                        <span style={{ color: '#64748b' }}>|</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>Billing:</span>
                        <span style={{ color: '#cbd5e1' }}>{companyBilling.length > 0 ? companyBilling.map(u => u.full_name).join(', ') : 'All'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Team Assignment Button */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setTeamModalCompany(c)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(56,189,248,0.3)',
                        background: 'rgba(56,189,248,0.1)',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Users size={13} /> Manage Team
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEditBrand(c)}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      {isSuperAdmin && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteBrand(c.id, c.company_name)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="companies"
        onImportSuccess={(newRows) => {
          setLocalCompanies(prev => {
            const merged = [...(newRows as Company[])];
            prev.forEach(p => {
              if (!merged.some(n => n.company_code === p.company_code || n.id === p.id)) merged.push(p);
            });
            return merged;
          });
          showFeedback(`✅ Imported ${newRows.length} Brand Companies into Master & Synced to Supabase!`);
        }}
      />
    </div>
  );
};
