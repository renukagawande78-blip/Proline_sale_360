import React, { useState, useEffect } from 'react';
import { Mail, Phone, ShieldCheck, Eye, EyeOff, Building2, Lock, Edit3, Trash2, CheckCircle2, RefreshCw, Plus, UserPlus, Users, Check, X, Layers, Sparkles } from 'lucide-react';
import { User, RoleName, Company } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BulkImportModal } from '../../components/BulkImportModal';
import { 
  checkIsSuperAdmin, 
  deleteUserFromSupabase, 
  saveUserToSupabase, 
  fetchUsersFromSupabase, 
  fetchCompaniesFromSupabase,
  deduplicateUsers,
  deduplicateCompanies,
  supabase,
  generateUuid
} from '../../lib/supabase';

interface UsersMasterViewProps {
  users: User[];
  searchQuery: string;
  onOpenUserMgmtModal?: (user?: User) => void;
}

const ROLE_BADGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  SUPER_ADMIN: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)' },
  SALES_ADMIN: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)' },
  AREA_SALES_MANAGER: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)' },
  SALES_PERSON: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)' },
  BILLING: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' },
  DISPATCH_MANAGER: { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.35)' },
  ACCOUNTS: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)' },
};

export const UsersMasterView: React.FC<UsersMasterViewProps> = ({ searchQuery, onOpenUserMgmtModal }) => {
  const { currentUser, updateUser, deleteUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Add User quick modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<RoleName>('SALES_PERSON');
  const [newCompanyHandle, setNewCompanyHandle] = useState('All');
  const [newPassword, setNewPassword] = useState('1234');
  const [newPhone, setNewPhone] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // User-wise Company Assignment Modal State
  const [assignUserModal, setAssignUserModal] = useState<User | null>(null);
  const [selectedCompanyNames, setSelectedCompanyNames] = useState<string[]>([]);
  const [isAllCompaniesSelected, setIsAllCompaniesSelected] = useState<boolean>(true);

  // Load all users and companies directly from Supabase on mount
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    Promise.all([
      fetchUsersFromSupabase(),
      fetchCompaniesFromSupabase()
    ]).then(([liveUsers, liveCompanies]) => {
      if (mounted) {
        if (liveUsers && liveUsers.length > 0) {
          setLocalUsers(deduplicateUsers(liveUsers));
        }
        if (liveCompanies && liveCompanies.length > 0) {
          setCompaniesList(deduplicateCompanies(liveCompanies));
        }
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleSyncLiveUsers = async () => {
    setIsSyncing(true);
    setNoticeMsg('🔄 Syncing live System Users & Companies from Supabase...');
    const [liveUsers, liveCompanies] = await Promise.all([
      fetchUsersFromSupabase(),
      fetchCompaniesFromSupabase()
    ]);
    if (liveUsers && liveUsers.length > 0) setLocalUsers(deduplicateUsers(liveUsers));
    if (liveCompanies && liveCompanies.length > 0) setCompaniesList(deduplicateCompanies(liveCompanies));
    setNoticeMsg(`✅ Live Sync Complete! Loaded ${liveUsers?.length || 0} Users & ${liveCompanies?.length || 0} Companies.`);
    setIsSyncing(false);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"? This action is restricted to Super Admin authority.`)) return;
    setLocalUsers(prev => prev.filter(u => u.id !== userId));
    await deleteUserFromSupabase(userId);
    if (deleteUser) deleteUser(userId);
    setNoticeMsg(`Deleted "${userName}" from Supabase.`);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const handleRoleChange = async (u: User, newRole: RoleName) => {
    const updatedUser = { ...u, role_name: newRole };
    setLocalUsers(prev => prev.map(item => item.id === u.id ? updatedUser : item));
    if (updateUser) updateUser(u.id, { role_name: newRole });
    const res = await saveUserToSupabase(updatedUser);
    setNoticeMsg(res.success
      ? `✅ Updated Role to "${newRole}" for ${u.full_name} in Supabase!`
      : `Role updated locally.`);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = !(user.active !== false);
    const updated = { ...user, active: newStatus };
    setLocalUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    await saveUserToSupabase(updated);
    if (updateUser) updateUser(user.id, { active: newStatus });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Open User-Wise Company Assignment Modal
  const handleOpenAssignModal = (user: User) => {
    setAssignUserModal(user);
    const handle = (user.company_handle || 'All').trim();
    if (handle.toLowerCase() === 'all' || !handle) {
      setIsAllCompaniesSelected(true);
      setSelectedCompanyNames(companiesList.map(c => c.company_name));
    } else {
      setIsAllCompaniesSelected(false);
      const parsed = handle.split(',').map(s => s.trim().toLowerCase());
      const matched = companiesList
        .filter(c => parsed.includes(c.company_name.toLowerCase()) || parsed.includes(c.company_code.toLowerCase()))
        .map(c => c.company_name);
      setSelectedCompanyNames(matched.length > 0 ? matched : [handle]);
    }
  };

  const handleToggleCompanySelection = (companyName: string) => {
    setIsAllCompaniesSelected(false);
    setSelectedCompanyNames(prev => {
      if (prev.includes(companyName)) {
        const next = prev.filter(name => name !== companyName);
        return next;
      } else {
        return [...prev, companyName];
      }
    });
  };

  const handleToggleAllCompanies = () => {
    if (isAllCompaniesSelected) {
      setIsAllCompaniesSelected(false);
      setSelectedCompanyNames([]);
    } else {
      setIsAllCompaniesSelected(true);
      setSelectedCompanyNames(companiesList.map(c => c.company_name));
    }
  };

  const handleSaveCompanyAssignment = async () => {
    if (!assignUserModal) return;
    let newHandle = 'All';

    if (!isAllCompaniesSelected) {
      if (selectedCompanyNames.length === 0) {
        newHandle = 'All';
      } else if (selectedCompanyNames.length === companiesList.length) {
        newHandle = 'All';
      } else {
        newHandle = selectedCompanyNames.join(', ');
      }
    }

    const updatedUser: User = {
      ...assignUserModal,
      company_handle: newHandle
    };

    setLocalUsers(prev => prev.map(u => u.id === assignUserModal.id ? updatedUser : u));
    if (updateUser) updateUser(assignUserModal.id, { company_handle: newHandle });
    await saveUserToSupabase(updatedUser);

    setNoticeMsg(`✅ Assigned Companies for "${assignUserModal.full_name}": [${newHandle}] saved to Supabase!`);
    setAssignUserModal(null);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;
    setIsSavingUser(true);

    const newUser: User = {
      id: generateUuid(),
      full_name: newFullName.trim(),
      email: newEmail.trim(),
      role_name: newRole,
      company_handle: newCompanyHandle.trim() || 'All',
      password: newPassword.trim() || '1234',
      phone: newPhone.trim() || undefined,
      active: true
    };

    setLocalUsers(prev => [newUser, ...prev]);
    await saveUserToSupabase(newUser);

    setIsSavingUser(false);
    setIsAddOpen(false);
    setNewFullName('');
    setNewEmail('');
    setNewRole('SALES_PERSON');
    setNewCompanyHandle('All');
    setNewPhone('');
    setNoticeMsg(`✅ New user "${newUser.full_name}" registered and saved to Supabase!`);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  // Filter users by role tab + search query
  const filteredUsers = localUsers.filter(u => {
    if (selectedRoleFilter !== 'ALL' && u.role_name !== selectedRoleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.role_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.company_handle || '').toLowerCase().includes(q)
    );
  });

  const allRoles: RoleName[] = [
    'SUPER_ADMIN',
    'SALES_ADMIN',
    'AREA_SALES_MANAGER',
    'SALES_PERSON',
    'BILLING',
    'DISPATCH_MANAGER',
    'ACCOUNTS'
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#38bdf8', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading users and companies from Supabase...
      </div>
    );
  }

  const fmcgCompanies = companiesList.filter(c => (c.segment || '').toUpperCase() === 'FMCG');
  const fmcdCompanies = companiesList.filter(c => (c.segment || '').toUpperCase() === 'FMCD');

  return (
    <>
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="users"
        onImportSuccess={(newUsers) => {
          setLocalUsers(prev => deduplicateUsers([...(newUsers as User[]), ...prev]));
        }}
      />

      {/* User-Wise Company Assignment Modal */}
      {assignUserModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} color="#fbbf24" /> Assign Companies to {assignUserModal.full_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 3 }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{assignUserModal.email}</span>
                  <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                    {assignUserModal.role_name}
                  </span>
                </div>
              </div>
              <button onClick={() => setAssignUserModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Quick Action: All Brands vs Specific Selection */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '0.6rem 0.85rem', borderRadius: 10, border: '1px solid #1e293b', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 700 }}>
                Brand Scope: {isAllCompaniesSelected ? <span style={{ color: '#fbbf24' }}>ALL Brands (Full 14 Brands Access)</span> : <span style={{ color: '#38bdf8' }}>{selectedCompanyNames.length} Brands Selected</span>}
              </div>
              <button
                type="button"
                onClick={handleToggleAllCompanies}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 8,
                  border: isAllCompaniesSelected ? '1px solid #fbbf24' : '1px solid #334155',
                  background: isAllCompaniesSelected ? 'rgba(245,158,11,0.15)' : '#1e293b',
                  color: isAllCompaniesSelected ? '#fbbf24' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isAllCompaniesSelected ? '✓ ALL 14 Brands Enabled' : 'Enable ALL Brands'}
              </button>
            </div>

            {/* Segment-wise Company Checkboxes */}
            <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.35rem' }}>
              
              {/* FMCG Group */}
              <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 10, border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#34d399', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={13} /> FMCG Companies ({fmcgCompanies.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {fmcgCompanies.map(c => {
                    const isSelected = isAllCompaniesSelected || selectedCompanyNames.some(name => name.toLowerCase() === c.company_name.toLowerCase());
                    const brandColor = (c as any).brand_color || '#38bdf8';

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCompanySelection(c.company_name)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: 8,
                          border: isSelected ? '1px solid #10b981' : '1px solid #334155',
                          background: isSelected ? 'rgba(16,185,129,0.12)' : '#1e293b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: brandColor }} />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#94a3b8' }}>
                              {c.company_name}
                            </div>
                            <div style={{ fontSize: '0.675rem', color: '#64748b' }}>[{c.company_code}]</div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} color="#34d399" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FMCD Group */}
              <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 10, border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={13} /> FMCD Companies ({fmcdCompanies.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {fmcdCompanies.map(c => {
                    const isSelected = isAllCompaniesSelected || selectedCompanyNames.some(name => name.toLowerCase() === c.company_name.toLowerCase());
                    const brandColor = (c as any).brand_color || '#fbbf24';

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCompanySelection(c.company_name)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: 8,
                          border: isSelected ? '1px solid #fbbf24' : '1px solid #334155',
                          background: isSelected ? 'rgba(245,158,11,0.12)' : '#1e293b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: brandColor }} />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#94a3b8' }}>
                              {c.company_name}
                            </div>
                            <div style={{ fontSize: '0.675rem', color: '#64748b' }}>[{c.company_code}]</div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} color="#fbbf24" />}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setAssignUserModal(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCompanyAssignment}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 800 }}
              >
                ✓ Save Brand Assignment to Supabase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} color="#38bdf8" /> Add System User & Assign Role
              </h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>FULL NAME *</label>
                  <input
                    type="text" required placeholder="e.g. Ramesh Patel"
                    value={newFullName} onChange={e => setNewFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>EMAIL ADDRESS *</label>
                  <input
                    type="email" required placeholder="ramesh@proline.com"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>ROLE & AUTHORITY *</label>
                  <select
                    value={newRole} onChange={e => setNewRole(e.target.value as RoleName)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 8, color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}
                  >
                    {allRoles.map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>CONTACT PHONE</label>
                  <input
                    type="text" placeholder="+91 98250 12345"
                    value={newPhone} onChange={e => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>BRAND HANDLE SCOPE</label>
                  <input
                    type="text" placeholder="All"
                    value={newCompanyHandle} onChange={e => setNewCompanyHandle(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>LOGIN PASSWORD</label>
                  <input
                    type="text" placeholder="1234"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" disabled={isSavingUser} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                  {isSavingUser ? 'Saving...' : '✓ Create & Save to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noticeMsg && (
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.825rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {noticeMsg}
        </div>
      )}

      {/* Role Filter & Actions Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#141f36',
        padding: '0.65rem 0.85rem',
        borderRadius: '14px',
        border: '1px solid #1e293b',
        marginBottom: '1rem'
      }}>
        {/* Role Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#0b1329', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedRoleFilter('ALL')}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: selectedRoleFilter === 'ALL' ? '#38bdf8' : 'transparent',
              color: selectedRoleFilter === 'ALL' ? '#090d16' : '#94a3b8',
              fontWeight: 800, fontSize: '0.75rem', transition: 'all 0.15s ease'
            }}
          >
            All Accounts ({localUsers.length})
          </button>

          {allRoles.map(role => {
            const count = localUsers.filter(u => u.role_name === role).length;
            if (count === 0 && selectedRoleFilter !== role) return null;
            const badge = ROLE_BADGE_COLORS[role] || { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' };
            const isSelected = selectedRoleFilter === role;

            return (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: isSelected ? badge.color : 'transparent',
                  color: isSelected ? '#090d16' : '#94a3b8',
                  fontWeight: 800, fontSize: '0.75rem', transition: 'all 0.15s ease'
                }}
              >
                {role.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleSyncLiveUsers}
            disabled={isSyncing}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Live DB'}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setIsAddOpen(true)}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={13} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>User Name</th>
              <th>Role & Authority</th>
              <th>Email Address</th>
              <th>Contact Mobile</th>
              <th>Assigned Companies (Scope)</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Password</th>
              {isSuperAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, idx) => {
              const isActive = u.active !== false;
              const isPasswordVisible = !!showPasswordMap[u.id];
              const mobileNo = u.phone || `+91 98250 ${(11000 + (u.sno || idx + 1)).toString()}`;
              const badge = ROLE_BADGE_COLORS[u.role_name] || { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid #38bdf8' };
              const currentScope = u.company_handle || 'All';
              const isScopeAll = currentScope.toLowerCase() === 'all';

              return (
                <tr key={u.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                  <td><strong style={{ color: '#38bdf8' }}>{idx + 1}</strong></td>
                  
                  <td>
                    <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{u.full_name}</strong>
                  </td>

                  <td>
                    <select
                      value={u.role_name}
                      onChange={(e) => handleRoleChange(u, e.target.value as RoleName)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        cursor: 'pointer'
                      }}
                    >
                      {allRoles.map(role => (
                        <option key={role} value={role} style={{ background: '#0f172a', color: '#fff' }}>
                          {role.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      <Mail size={13} color="#64748b" />
                      <span>{u.email}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                      <Phone size={13} color="#64748b" />
                      <span>{mobileNo}</span>
                    </div>
                  </td>

                  {/* Interactive User-Wise Company Assignment Button */}
                  <td>
                    <button
                      onClick={() => handleOpenAssignModal(u)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: isScopeAll ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(56,189,248,0.4)',
                        background: isScopeAll ? 'rgba(245,158,11,0.12)' : 'rgba(56,189,248,0.12)',
                        color: isScopeAll ? '#fbbf24' : '#38bdf8',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                        maxWidth: 220,
                        textAlign: 'left'
                      }}
                      title="Click to assign or change mapped companies for this user"
                    >
                      <Building2 size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isScopeAll ? 'ALL 14 Brands' : currentScope}
                      </span>
                    </button>
                  </td>

                  <td>
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        border: 'none',
                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isActive ? '#34d399' : '#f87171',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isActive ? '● ACTIVE' : '○ INACTIVE'}
                    </button>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', padding: '0.25rem 0.6rem', borderRadius: 6, border: '1px solid #334155' }}>
                      <code style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                        {isPasswordVisible ? (u.password || '1234') : '••••'}
                      </code>
                      <button
                        onClick={() => togglePasswordVisibility(u.id)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>

                  {isSuperAdmin && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        title="Delete User"
                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
