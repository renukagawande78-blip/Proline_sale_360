import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, Search, Sliders, ToggleLeft, ToggleRight, Layers, Plus, UserCheck } from 'lucide-react';
import { useAuth, getDefaultPermissions } from '../context/AuthContext';
import { PermissionControl, PermissionGroup } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    permissionGroups, 
    updateUserPassword, 
    updateUserPermissions, 
    assignUserPermissionGroup,
    addPermissionGroup,
    updatePermissionGroup 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'groups' | 'permissions' | 'users'>('groups');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Permission Group Form
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPerms, setNewGroupPerms] = useState<PermissionControl>(getDefaultPermissions('SALES_PERSON'));

  if (!isOpen) return null;

  const handlePasswordChange = (userId: string) => {
    if (!newPassword.trim()) return;
    updateUserPassword(userId, newPassword.trim());
    setSuccessMsg(`Password updated successfully!`);
    setSelectedUserId(null);
    setNewPassword('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleUserPermission = (userId: string, key: keyof PermissionControl) => {
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

  const handleToggleGroupPermission = (groupId: string, key: keyof PermissionControl) => {
    const targetGroup = permissionGroups.find(g => g.id === groupId);
    if (!targetGroup) return;
    const current = targetGroup.permissions;
    const updatedPerms: PermissionControl = {
      ...current,
      [key]: !current[key]
    };
    updatePermissionGroup(groupId, { permissions: updatedPerms });
    setSuccessMsg(`Group "${targetGroup.group_name}" updated!`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleCreateNewGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addPermissionGroup({
      group_name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Custom Organization Permission Group',
      permissions: newGroupPerms,
      is_system: false
    });
    setSuccessMsg(`New Permission Group "${newGroupName}" created!`);
    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreatingGroup(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.full_name.toLowerCase().includes(q);
    const roleMatch = u.role_name.toLowerCase().includes(q);
    const groupMatch = (u.permission_group_name || '').toLowerCase().includes(q);
    const companyMatch = (u.company_handle || '').toLowerCase().includes(q);
    return nameMatch || roleMatch || groupMatch || companyMatch;
  });

  const PERMISSION_CONFIG: { key: keyof PermissionControl; label: string; desc: string; category: string }[] = [
    { key: 'add_order', label: 'Add Order', desc: 'Create & Add Sales Order', category: 'Order Actions' },
    { key: 'view_order', label: 'View Order', desc: 'View Sales Orders & Details', category: 'Order Actions' },
    { key: 'cancel_order', label: 'Cancel Order', desc: 'Cancel Sales Orders', category: 'Order Actions' },
    { key: 'delete_order', label: 'Delete Order', desc: 'Delete Order (Admin & System Admin Only)', category: 'Order Actions' },
    { key: 'party_view', label: 'Party', desc: 'View Agency & Party Directory', category: 'Master' },
    { key: 'new_party', label: 'New Party', desc: 'Add New Agency / Party Master', category: 'Master' },
    { key: 'product_mgmt', label: 'Product', desc: 'Add / Edit Product Master', category: 'Master' },
    { key: 'order_transfer_to_billing', label: 'Order Transfer to Billing', desc: 'Billing Check & Approval', category: 'Workflow' },
    { key: 'order_status_dashboard_all', label: 'Order Status Dashboard (all)', desc: 'View All Companies Dashboard', category: 'Dashboard' },
    { key: 'company_order_status_dashboard', label: 'Align Company Status Dashboard', desc: 'View Assigned Brand Dashboard', category: 'Dashboard' },
    { key: 'company_order_form', label: 'Company Order Form / Align', desc: 'Brand Aligned Order Entry', category: 'Dashboard' },
    { key: 'order_transfer_to_dispatch', label: 'Order Transfer to Dispatch', desc: 'Pass Order to Dispatch Queue', category: 'Workflow' },
    { key: 'order_transfer_out_for_delivery', label: 'Order Transfer to Out for Delivery', desc: 'Dispatch & Driver Assignment', category: 'Workflow' },
    { key: 'pod_verification', label: 'Pod Verification', desc: 'Verify Proof of Delivery', category: 'Workflow' },
    { key: 'user_authority', label: 'User Passwords & Authority', desc: 'Admin User & Group Management', category: 'Admin' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 1250, width: '96vw' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck color="#38bdf8" size={26} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Permission Master & Group Authority Control Console
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Define Permission Groups (Add, View, Cancel, Delete Order) & Assign 31 Team Members
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Tab Navigation Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#0f172a', padding: 4, borderRadius: 10, border: '1px solid #334155' }}>
            <button 
              onClick={() => setActiveTab('groups')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'groups' ? '#38bdf8' : 'transparent',
                color: activeTab === 'groups' ? '#0f172a' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Layers size={16} /> 1. Permission Group Master ({permissionGroups.length})
            </button>

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
              <Sliders size={16} /> 2. User Permission Matrix (Yes / No)
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
              <UserCheck size={16} /> 3. Assign Group & Passwords ({users.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.45rem 0.85rem', gap: '0.5rem', flex: 1, maxWidth: 360 }}>
            <Search size={16} color="#38bdf8" />
            <input 
              type="text"
              placeholder="Search member, group, or role..."
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

        {/* TAB 1: PERMISSION GROUP MASTER */}
        {activeTab === 'groups' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                System Permission Groups define fine-grained rules. Assign users to groups or edit controls:
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                <Plus size={15} /> Add New Permission Group
              </button>
            </div>

            {/* Create New Group Form */}
            {isCreatingGroup && (
              <form onSubmit={handleCreateNewGroupSubmit} style={{ background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem' }}>+ Create New Permission Group</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>GROUP NAME</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Senior Sales Representative Group" 
                      value={newGroupName} 
                      onChange={e => setNewGroupName(e.target.value)}
                      style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.5rem', borderRadius: 6, color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                    <input 
                      type="text" 
                      placeholder="Describe what members of this group can do..." 
                      value={newGroupDesc} 
                      onChange={e => setNewGroupDesc(e.target.value)}
                      style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.5rem', borderRadius: 6, color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: 8 }}>SELECT GROUP CONTROLS (YES / NO):</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
                    {PERMISSION_CONFIG.map(p => {
                      const val = newGroupPerms[p.key];
                      return (
                        <button
                          type="button"
                          key={p.key}
                          onClick={() => setNewGroupPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: val ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                            border: val ? '1px solid #10b981' : '1px solid #334155',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 6,
                            color: 'white',
                            fontSize: '0.775rem',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{p.label}</span>
                          <span style={{ fontWeight: 800, color: val ? '#34d399' : '#fb7185' }}>{val ? 'YES' : 'NO'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsCreatingGroup(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Permission Group</button>
                </div>
              </form>
            )}

            {/* Permission Groups Table */}
            <div className="data-table-container" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Add Order</th>
                    <th style={{ textAlign: 'center' }}>View Order</th>
                    <th style={{ textAlign: 'center' }}>Cancel Order</th>
                    <th style={{ textAlign: 'center' }}>Delete Order (Admin Only)</th>
                    <th style={{ textAlign: 'center' }}>Assigned Members</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionGroups.map(g => {
                    const assignedUsers = users.filter(u => u.permission_group_id === g.id || u.permission_group_name === g.group_name);
                    const perms = g.permissions;

                    return (
                      <tr key={g.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#38bdf8' }}>{g.group_name}</div>
                          {g.is_system && <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>System Standard</span>}
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.775rem' }}>{g.description}</td>
                        
                        {/* Add Order */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleGroupPermission(g.id, 'add_order')}
                            style={{ background: perms.add_order ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.15)', border: perms.add_order ? '1px solid #10b981' : '1px solid rgba(244, 63, 94, 0.4)', color: perms.add_order ? '#34d399' : '#fb7185', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            {perms.add_order ? 'YES' : 'NO'}
                          </button>
                        </td>

                        {/* View Order */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleGroupPermission(g.id, 'view_order')}
                            style={{ background: perms.view_order ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.15)', border: perms.view_order ? '1px solid #10b981' : '1px solid rgba(244, 63, 94, 0.4)', color: perms.view_order ? '#34d399' : '#fb7185', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            {perms.view_order ? 'YES' : 'NO'}
                          </button>
                        </td>

                        {/* Cancel Order */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleGroupPermission(g.id, 'cancel_order')}
                            style={{ background: perms.cancel_order ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.15)', border: perms.cancel_order ? '1px solid #10b981' : '1px solid rgba(244, 63, 94, 0.4)', color: perms.cancel_order ? '#34d399' : '#fb7185', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            {perms.cancel_order ? 'YES' : 'NO'}
                          </button>
                        </td>

                        {/* Delete Order */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleGroupPermission(g.id, 'delete_order')}
                            style={{ background: perms.delete_order ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.15)', border: perms.delete_order ? '1px solid #10b981' : '1px solid rgba(244, 63, 94, 0.4)', color: perms.delete_order ? '#34d399' : '#fb7185', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            {perms.delete_order ? 'YES (Admin)' : 'NO'}
                          </button>
                        </td>

                        {/* Members count */}
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: '#0f172a', border: '1px solid #334155', padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                            {assignedUsers.length} Users
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

        {/* TAB 2: GRANULAR USER PERMISSION MATRIX */}
        {activeTab === 'permissions' && (
          <div className="data-table-container" style={{ maxHeight: 460, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 170, position: 'sticky', left: 0, zIndex: 10, background: '#0f172a' }}>User & Group</th>
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
                        <div style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: 700 }}>{u.permission_group_name || u.role_name.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '0.65rem', color: '#34d399' }}>Brand: {u.company_handle || 'All'}</div>
                      </td>

                      {PERMISSION_CONFIG.map(p => {
                        const isAllowed = isSystemAdmin ? true : (perms[p.key] ?? false);

                        return (
                          <td key={p.key} style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              disabled={isSystemAdmin}
                              onClick={() => handleToggleUserPermission(u.id, p.key)}
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

        {/* TAB 3: USER DIRECTORY & GROUP ASSIGNMENT */}
        {activeTab === 'users' && (
          <div className="data-table-container" style={{ maxHeight: 440, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.825rem' }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>S.NO</th>
                  <th>User Name</th>
                  <th>System Role</th>
                  <th>Assigned Permission Group</th>
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
                      <select
                        value={u.permission_group_id || ''}
                        onChange={e => assignUserPermissionGroup(u.id, e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#34d399', fontSize: '0.775rem', fontWeight: 700 }}
                      >
                        <option value="" disabled>Select Group...</option>
                        {permissionGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.group_name}</option>
                        ))}
                      </select>
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
          <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Total Active Team Members: <strong>{users.length} Users</strong> | Groups: <strong>{permissionGroups.length} Masters</strong></div>
          <button className="btn btn-outline" onClick={onClose}>Close Permission Control Center</button>
        </div>
      </div>
    </div>
  );
};
