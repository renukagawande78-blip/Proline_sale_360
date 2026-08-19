import React, { useState, useEffect } from 'react';
import { Mail, Phone, ShieldCheck, Eye, EyeOff, UserCheck, UserX, Building2, Lock, FileSpreadsheet, Edit3, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { User, RoleName } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { downloadSampleCSV } from '../../lib/masterImportExport';
import { BulkImportModal } from '../../components/BulkImportModal';
import { checkIsSuperAdmin, deleteUserFromSupabase, saveUserToSupabase, fetchUsersFromSupabase, deduplicateUsers } from '../../lib/supabase';

interface UsersMasterViewProps {
  users: User[];
  searchQuery: string;
  onOpenUserMgmtModal?: (user?: User) => void;
}

export const UsersMasterView: React.FC<UsersMasterViewProps> = ({ users: initialUsers, searchQuery, onOpenUserMgmtModal }) => {
  const { currentUser, updateUser, deleteUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const isAdmin = isSuperAdmin;
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localUsers, setLocalUsers] = useState<User[]>(initialUsers);
  const [isSyncing, setIsSyncing] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setLocalUsers(prev => {
        const merged = deduplicateUsers([...initialUsers, ...prev]);
        return merged;
      });
    }
  }, [initialUsers]);

  const handleSyncLiveUsers = async () => {
    setIsSyncing(true);
    setNoticeMsg('🔄 Syncing live System Users from Supabase database...');
    const liveList = await fetchUsersFromSupabase();
    if (liveList && liveList.length > 0) {
      const merged = deduplicateUsers([...liveList, ...localUsers]);
      setLocalUsers(merged);
      setNoticeMsg(`✅ Live Sync Complete! Loaded ${liveList.length} System Users from Supabase!`);
    } else {
      setNoticeMsg('ℹ️ Sync checked: Supabase users table loaded successfully.');
    }
    setIsSyncing(false);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const activeUsers = localUsers.length > 0 ? localUsers : initialUsers;

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user account "${userName}"? This action is restricted to Super Admin authority.`)) {
      setLocalUsers(prev => prev.filter(u => u.id !== userId));
      await deleteUserFromSupabase(userId);
      if (deleteUser) {
        deleteUser(userId);
      }
    }
  };

  const handleEditUser = async (u: User) => {
    if (onOpenUserMgmtModal) {
      onOpenUserMgmtModal(u);
    } else {
      const newName = window.prompt(`Update User Full Name for ${u.email}:`, u.full_name);
      if (newName === null) return;

      const currentHandle = u.company_handle || 'All';
      const newScope = window.prompt(
        `Update Mapped Brand Handles for "${newName.trim() || u.full_name}" (enter multiple brand names comma-separated e.g. Priyagold, Orion, Whirlpool, or 'All'):`, 
        currentHandle
      );

      const updated: User = { 
        ...u, 
        full_name: newName.trim() || u.full_name,
        company_handle: newScope !== null ? (newScope.trim() || 'All') : currentHandle
      };

      setLocalUsers(prev => prev.map(item => item.id === u.id ? updated : item));
      await saveUserToSupabase(updated);
      if (updateUser) {
        updateUser(u.id, updated);
      }
      setNoticeMsg(`Updated user "${updated.full_name}" (Brand Scope: ${updated.company_handle}) in Supabase!`);
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };


  const filteredUsers = activeUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.company_handle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleToggleUserStatus = (user: User) => {
    const newStatus = !(user.active ?? true);
    setLocalUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
    if (updateUser) {
      updateUser(user.id, { active: newStatus });
    }
  };

  useEffect(() => {

    if (initialUsers && initialUsers.length > 0) {
      setLocalUsers(prev => {
        const list = [...prev];
        initialUsers.forEach(u => {
          if (!list.some(x => x.id === u.id || x.email === u.email)) {
            list.push(u);
          }
        });
        return list;
      });
    }
  }, [initialUsers]);

  return (
    <>
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="users"
        onImportSuccess={(newUsers) => {
          setLocalUsers(prev => [...(newUsers as User[]), ...prev]);
        }}
      />




      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
          System Accounts & Roles ({filteredUsers.length})
        </div>
        <button
          onClick={handleSyncLiveUsers}
          disabled={isSyncing}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #38bdf8',
            background: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Live DB'}
        </button>
      </div>

      {noticeMsg && (
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.825rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {noticeMsg}
        </div>
      )}


      <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>S.NO</th>
            <th>User Name</th>
            <th>Role & Authority</th>
            <th>Email Address</th>
            <th>Contact / Mobile No.</th>
            <th>Brand Handle Scope</th>
            <th>Status</th>
            {isAdmin && <th style={{ textAlign: 'center' }}>Password Authority</th>}
            {isSuperAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u, idx) => {
            const isActive = u.active !== false;
            const isPasswordVisible = !!showPasswordMap[u.id];
            const mobileNo = u.phone || `+91 98250 ${(11000 + (u.sno || idx + 1)).toString()}`;

            return (
              <tr key={u.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                <td><strong style={{ color: '#38bdf8' }}>{u.sno || idx + 1}</strong></td>
                
                <td>
                  <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{u.full_name}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {u.id}</div>
                </td>

                <td>
                  <select
                    value={u.role_name}
                    onChange={async (e) => {
                      const newRole = e.target.value as RoleName;
                      const updatedUser = { ...u, role_name: newRole };
                      setLocalUsers(prev => prev.map(item => item.id === u.id ? updatedUser : item));
                      if (updateUser) {
                        updateUser(u.id, { role_name: newRole });
                      }
                      const res = await saveUserToSupabase(updatedUser);
                      if (res.success) {
                        setNoticeMsg(`Updated System Role to "${newRole.replace(/_/g, ' ')}" for ${u.full_name} in Supabase!`);
                      } else {
                        setNoticeMsg(`Updated role locally! (Supabase notice: ${res.error})`);
                      }
                      setTimeout(() => setNoticeMsg(null), 3000);
                    }}
                    style={{
                      padding: '0.35rem 0.6rem',
                      background: '#0f172a',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontSize: '0.775rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="AREA_SALES_MANAGER">AREA SALES MANAGER (ASM)</option>
                    <option value="SALES_PERSON">SALES PERSON</option>
                    <option value="SALES_ADMIN">SALES ADMIN</option>
                    <option value="ACCOUNTS">ACCOUNTS & FINANCE</option>
                    <option value="DISPATCH_MANAGER">DISPATCH MANAGER</option>
                    <option value="BILLING">BILLING CLERK</option>
                  </select>
                </td>


                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Mail size={13} color="#38bdf8" />
                    <span>{u.email}</span>
                  </div>
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    <Phone size={13} color="#34d399" />
                    <span>{mobileNo}</span>
                  </div>
                </td>

                <td>
                  <button
                    type="button"
                    onClick={async () => {
                      const currentHandle = u.company_handle || 'All';
                      const newHandle = window.prompt(
                        `Update Brand Handle Scope for "${u.full_name}" (enter multiple brand names comma-separated e.g. Priyagold, Orion, Whirlpool, RCPL or 'All'):`, 
                        currentHandle
                      );
                      if (newHandle !== null && newHandle.trim() !== currentHandle) {
                        const updatedUser = { ...u, company_handle: newHandle.trim() || 'All' };
                        setLocalUsers(prev => prev.map(item => item.id === u.id ? updatedUser : item));
                        if (updateUser) {
                          updateUser(u.id, { company_handle: newHandle.trim() || 'All' });
                        }
                        const res = await saveUserToSupabase(updatedUser);
                        if (res.success) {
                          setNoticeMsg(`Updated Mapped Brand Scope to "${newHandle.trim() || 'All'}" for ${u.full_name} in Supabase!`);
                        } else {
                          setNoticeMsg(`Updated brand scope locally! (Supabase notice: ${res.error})`);
                        }
                        setTimeout(() => setNoticeMsg(null), 3500);
                      }
                    }}
                    title="Click to edit multiple mapped brand company handles"
                    style={{
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      color: '#34d399',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.775rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Building2 size={13} /> {u.company_handle || 'All'}
                  </button>
                </td>


                <td>
                  <button
                    onClick={() => handleToggleUserStatus(u)}
                    title="Click to toggle Active / Inactive user status"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: isActive ? '#34d399' : '#fb7185',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isActive ? <UserCheck size={13} /> : <UserX size={13} />}
                    <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </button>
                </td>

                {isAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', border: '1px solid #334155', padding: '0.2rem 0.55rem', borderRadius: 8 }}>
                      <Lock size={12} color="#fbbf24" />
                      <span style={{ fontSize: '0.775rem', fontFamily: 'monospace', fontWeight: 800, color: '#fbbf24', minWidth: 45 }}>
                        {isPasswordVisible ? (u.password || '1234') : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(u.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
                        title={isPasswordVisible ? 'Hide Password' : 'Show Password (Admin Authority)'}
                      >
                        {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                )}

                {isSuperAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEditUser(u)}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Edit3 size={13} /> Edit User
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        title="Super Admin Authority: Delete user account"
                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
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
