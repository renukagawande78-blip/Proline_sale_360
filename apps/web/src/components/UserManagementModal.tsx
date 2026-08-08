import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, Search, Lock, Sliders, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth, getDefaultPermissions } from '../context/AuthContext';
import { PermissionControl } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, updateUserPassword, updateUserPermissions } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('permissions');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasswordChange = (userId: string) => {
    if (!newPassword.trim()) return;
    updateUserPassword(userId, newPassword.trim());
    setSuccessMsg(`Password successfully updated!`);
    setSelectedUserId(null);
    setNewPassword('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleTogglePermission = (userId: string, key: keyof PermissionControl) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const currentPerms = user.permissions || getDefaultPermissions(user.role_name);
    const updated: PermissionControl = {
      ...currentPerms,
      [key]: !currentPerms[key]
    };
    updateUserPermissions(userId, updated);
    setSuccessMsg(`Permission "${key}" updated for ${user.full_name}!`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.full_name.toLowerCase().includes(q);
    const roleMatch = u.role_name.toLowerCase().includes(q);
    const companyMatch = (u.company_handle || '').toLowerCase().includes(q);
    return nameMatch || roleMatch || companyMatch;
  });

  const PERMISSION_CONFIG: { key: keyof PermissionControl; label: string; desc: string }[] = [
    { key: 'order_entry', label: 'Order Entry', desc: 'Add Sales Order & Entry Form' },
    { key: 'party_view', label: 'Party', desc: 'View Agency & Party Directory' },
    { key: 'new_party', label: 'New Party', desc: 'Add New Agency / Party Master' },
    { key: 'product_mgmt', label: 'Product', desc: 'Add / Edit Product Master' },
    { key: 'order_transfer_to_billing', label: 'Order Transfer to Billing', desc: 'Billing Check & Approval' },
    { key: 'order_status_dashboard_all', label: 'Order Status Dashboard (all)', desc: 'View All Companies Dashboard' },
    { key: 'company_order_status_dashboard', label: 'Align Company Status Dashboard', desc: 'View Assigned Brand Dashboard' },
    { key: 'company_order_form', label: 'Company Order Form / Align', desc: 'Brand Aligned Order Entry' },
    { key: 'order_transfer_to_dispatch', label: 'Order Transfer to Dispatch', desc: 'Pass Order to Dispatch Queue' },
    { key: 'order_transfer_out_for_delivery', label: 'Order Transfer to Out for Delivery', desc: 'Dispatch & Driver Assignment' },
    { key: 'pod_verification', label: 'Pod Verification', desc: 'Verify Proof of Delivery' },
    { key: 'user_authority', label: 'User Passwords & Authority', desc: 'Admin User Management' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 1150, width: '95vw' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck color="#38bdf8" size={26} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Role Authority & Permission Control Center
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Manage 31 Team Members, Passwords, Role Badges & Granular Permission Controls
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#0f172a', padding: 4, borderRadius: 10, border: '1px solid #334155' }}>
            <button 
              onClick={() => setActiveTab('permissions')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'permissions' ? '#38bdf8' : 'transparent',
                color: activeTab === 'permissions' ? '#0f172a' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Sliders size={16} /> Granular Permission Matrix (Yes / No)
            </button>

            <button 
              onClick={() => setActiveTab('users')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'users' ? '#38bdf8' : 'transparent',
                color: activeTab === 'users' ? '#0f172a' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Key size={16} /> User Directory & Passwords
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.45rem 0.85rem', gap: '0.5rem', flex: 1, maxWidth: 380 }}>
            <Search size={16} color="#38bdf8" />
            <input 
              type="text"
              placeholder="Filter member by name, role, or brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* TAB 1: GRANULAR PERMISSION MATRIX */}
        {activeTab === 'permissions' && (
          <div className="data-table-container" style={{ maxHeight: 460, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 160, position: 'sticky', left: 0, zIndex: 10, background: '#0f172a' }}>User & Role</th>
                  {PERMISSION_CONFIG.map(p => (
                    <th key={p.key} title={p.desc} style={{ textTransform: 'none', whiteSpace: 'normal', minWidth: 110, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.775rem' }}>{p.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const perms = u.permissions || getDefaultPermissions(u.role_name);
                  const isSystemAdmin = u.role_name === 'SYSTEM_ADMIN' || u.role_name === 'SUPER_ADMIN';

                  return (
                    <tr key={u.id}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, background: '#1e293b', borderRight: '1px solid #334155' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.85rem' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: 700 }}>{u.role_name.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '0.65rem', color: '#34d399' }}>Brand: {u.company_handle || 'All'}</div>
                      </td>

                      {PERMISSION_CONFIG.map(p => {
                        const isAllowed = isSystemAdmin ? true : perms[p.key];

                        return (
                          <td key={p.key} style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              disabled={isSystemAdmin}
                              onClick={() => handleTogglePermission(u.id, p.key)}
                              style={{
                                background: isAllowed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.15)',
                                color: isAllowed ? '#34d399' : '#fb7185',
                                border: isAllowed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 6,
                                fontWeight: 800,
                                fontSize: '0.725rem',
                                cursor: isSystemAdmin ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease'
                              }}
                              title={isAllowed ? `Permission YES: Click to toggle NO` : `Permission NO: Click to toggle YES`}
                            >
                              {isAllowed ? (
                                <>
                                  <ToggleRight size={14} color="#34d399" /> YES
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={14} color="#fb7185" /> NO
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & PASSWORDS */}
        {activeTab === 'users' && (
          <div className="data-table-container" style={{ maxHeight: 440, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.825rem' }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>S.NO</th>
                  <th>User Name</th>
                  <th>System Role</th>
                  <th>Company Handle</th>
                  <th>Password</th>
                  <th>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{u.sno || idx + 1}</strong></td>
                    <td><strong style={{ color: '#f8fafc' }}>{u.full_name}</strong></td>
                    <td>
                      <span className="role-pill" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                        {u.role_name.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.775rem', color: '#34d399', fontWeight: 600 }}>
                        {u.company_handle || 'All'}
                      </span>
                    </td>
                    <td><code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#fbbf24', fontWeight: 700 }}>{u.password || '1234'}</code></td>
                    <td>
                      {selectedUserId === u.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password..."
                            style={{ padding: '0.3rem 0.5rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 4, color: 'white', fontSize: '0.8rem', width: 110 }}
                          />
                          <button 
                            className="btn btn-success" 
                            onClick={() => handlePasswordChange(u.id)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => setSelectedUserId(null)}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => { setSelectedUserId(u.id); setNewPassword(u.password || '1234'); }}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <Key size={13} /> Edit Password
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Total Active Team Members: <strong>{users.length} Users</strong></div>
          <button className="btn btn-outline" onClick={onClose}>Close Permission Control Center</button>
        </div>
      </div>
    </div>
  );
};
