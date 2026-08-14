import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, Search, Sliders, ToggleLeft, ToggleRight, Layers, Plus, UserCheck, UserPlus, Edit, Phone, Mail, Building, Lock } from 'lucide-react';
import { useAuth, getDefaultPermissions } from '../context/AuthContext';
import { PermissionControl, RoleName, User } from '../types';
import { MOCK_COMPANIES } from '../lib/supabase';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_ROLES: { role: RoleName; label: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin (Chirag & Harshad Executive Authority)' },
  { role: 'ACCOUNTS', label: 'Accounts & Finance Manager' },
  { role: 'DISPATCH_MANAGER', label: 'Warehouse & Dispatch Manager' },
  { role: 'AREA_SALES_MANAGER', label: 'Area Sales Manager (ASM)' },
  { role: 'SALES_PERSON', label: 'Sales Person / Field Executive' },
  { role: 'SALES_ADMIN', label: 'Sales Admin' },
  { role: 'BILLING', label: 'Billing Clerk' }
];

const MASTER_BRANDS = [
  { handle: 'All', name: 'All Brands (Unrestricted)' },
  { handle: 'Pringod', name: 'Priyagold (Pringod)' },
  { handle: 'RCPL', name: 'RCPL' },
  { handle: 'Orion', name: 'Orion' },
  { handle: 'Gandour', name: 'Gandour' },
  { handle: 'HPPL', name: 'HPPL' },
  { handle: 'Whirlpool', name: 'Whirlpool' },
  { handle: 'Daikin', name: 'Daikin' },
  { handle: 'Cruise', name: 'Cruise' },
  { handle: 'Mogu', name: 'Mogu Mogu' },
  { handle: 'Heli', name: 'Heli' },
  { handle: 'Waiwai', name: 'Waiwai' },
  { handle: 'PRAN', name: 'PRAN' },
  { handle: 'AK', name: 'AKAI' }
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    permissionGroups, 
    createUser,
    updateUser,
    updateUserPassword, 
    updateUserPermissions, 
    assignUserPermissionGroup,
    addPermissionGroup,
    updatePermissionGroup 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'permissions'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // User Registration & Editing Form State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    role_name: RoleName;
    permission_group_id: string;
    password: string;
    active: boolean;
    company_handles: string[];
  }>({
    full_name: '',
    email: '',
    phone: '+91 ',
    role_name: 'SALES_PERSON',
    permission_group_id: 'pg_sales_person',
    password: '1234',
    active: true,
    company_handles: ['Pringod']
  });

  // Password reset inline state
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  const [inlineNewPassword, setInlineNewPassword] = useState('');

  // Permission Group Form State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPerms, setNewGroupPerms] = useState<PermissionControl>(getDefaultPermissions('SALES_PERSON'));

  if (!isOpen) return null;

  const handleOpenRegisterForm = () => {
    setEditingUserId(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '+91 ',
      role_name: 'SALES_PERSON',
      permission_group_id: permissionGroups[0]?.id || 'pg_sales_person',
      password: '1234',
      active: true,
      company_handles: ['Pringod']
    });
    setIsRegisterOpen(true);
  };

  const handleOpenEditForm = (user: User) => {
    setEditingUserId(user.id);
    const existingHandles = user.company_handle 
      ? user.company_handle.split(',').map(s => s.trim()) 
      : ['All'];
      
    setFormData({
      full_name: user.full_name,
      email: user.email || '',
      phone: user.phone || '+91 ',
      role_name: user.role_name,
      permission_group_id: user.permission_group_id || permissionGroups[0]?.id || '',
      password: user.password || '1234',
      active: user.active !== false,
      company_handles: existingHandles
    });
    setIsRegisterOpen(true);
  };

  const handleToggleBrandHandle = (handle: string) => {
    setFormData(prev => {
      let current = [...prev.company_handles];
      if (handle === 'All') {
        return { ...prev, company_handles: ['All'] };
      }
      current = current.filter(h => h !== 'All');
      if (current.includes(handle)) {
        current = current.filter(h => h !== handle);
      } else {
        current.push(handle);
      }
      if (current.length === 0) current = ['All'];
      return { ...prev, company_handles: current };
    });
  };

  const handleSubmitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    const groupObj = permissionGroups.find(g => g.id === formData.permission_group_id);
    const companyHandleStr = formData.company_handles.join(', ');

    if (editingUserId) {
      // Update existing user
      updateUser(editingUserId, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role_name: formData.role_name,
        permission_group_id: formData.permission_group_id,
        permission_group_name: groupObj?.group_name,
        company_handle: companyHandleStr,
        password: formData.password.trim(),
        active: formData.active
      });
      setSuccessMsg(`User profile for "${formData.full_name}" updated successfully!`);
    } else {
      // Register brand new user
      createUser({
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || `${formData.full_name.toLowerCase().replace(/\s+/g, '')}@proline.com`,
        phone: formData.phone.trim(),
        role_name: formData.role_name,
        permission_group_id: formData.permission_group_id,
        permission_group_name: groupObj?.group_name,
        company_handle: companyHandleStr,
        password: formData.password.trim() || '1234',
        active: formData.active,
        permissions: groupObj ? { ...groupObj.permissions } : getDefaultPermissions(formData.role_name)
      });
      setSuccessMsg(`New user "${formData.full_name}" registered & mapped successfully!`);
    }

    setIsRegisterOpen(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleAccountActive = (user: User) => {
    const nextStatus = user.active === false;
    updateUser(user.id, { active: nextStatus });
    setSuccessMsg(`User ${user.full_name} is now ${nextStatus ? '🟢 ACTIVE' : '🔴 INACTIVE'}!`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSaveInlinePassword = (userId: string) => {
    if (!inlineNewPassword.trim()) return;
    updateUserPassword(userId, inlineNewPassword.trim());
    setSuccessMsg(`Password updated successfully!`);
    setPasswordResetUserId(null);
    setInlineNewPassword('');
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
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').toLowerCase().includes(q);
    return nameMatch || roleMatch || groupMatch || companyMatch || emailMatch || phoneMatch;
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
      <div className="modal-card" style={{ maxWidth: 1300, width: '97vw', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck color="#38bdf8" size={26} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                User Management, Brand Mapping & Access Authority Console
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Register Team Users, Map Master Brands, Assign System Roles & Permission Groups, Change Passwords & Manage Active/Inactive Accounts
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Navigation Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#0f172a', padding: 4, borderRadius: 10, border: '1px solid #334155' }}>
            <button 
              onClick={() => { setActiveTab('users'); setIsRegisterOpen(false); }}
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
              <UserCheck size={16} /> 1. Team User Directory ({users.length})
            </button>

            <button 
              onClick={() => { setActiveTab('groups'); setIsRegisterOpen(false); }}
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
              <Layers size={16} /> 2. Permission Groups ({permissionGroups.length})
            </button>

            <button 
              onClick={() => { setActiveTab('permissions'); setIsRegisterOpen(false); }}
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
              <Sliders size={16} /> 3. Permission Matrix
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.45rem 0.85rem', gap: '0.5rem', width: '100%' }}>
              <Search size={16} color="#38bdf8" />
              <input 
                type="text"
                placeholder="Search by name, email, mobile, brand, or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={handleOpenRegisterForm}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserPlus size={16} /> Register New User
            </button>
          </div>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* User Registration & Edit Form Card */}
        {isRegisterOpen && (
          <form onSubmit={handleSubmitUserForm} style={{ background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> {editingUserId ? 'Edit User Profile & Brand Mappings' : 'Register New Team Member & Map Brands'}
              </h3>
              <button type="button" onClick={() => setIsRegisterOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: 4 }}>
                  FULL PERSON NAME *
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Rohan Sharma"
                  value={formData.full_name} 
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.55rem', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: 4 }}>
                  EMAIL ADDRESS *
                </label>
                <input 
                  type="email" 
                  required 
                  placeholder="rohan@priyagold.com"
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.55rem', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: 4 }}>
                  MOBILE PHONE NUMBER
                </label>
                <input 
                  type="text" 
                  placeholder="+91 98765 43210"
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.55rem', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: 4 }}>
                  LOGIN PASSWORD *
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="1234"
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.55rem', borderRadius: 6, color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* System Role */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  ASSIGN SYSTEM ROLE
                </label>
                <select
                  value={formData.role_name}
                  onChange={e => setFormData({ ...formData, role_name: e.target.value as RoleName })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #38bdf8', padding: '0.55rem', borderRadius: 6, color: '#38bdf8', fontWeight: 700, fontSize: '0.825rem' }}
                >
                  {ALL_ROLES.map(r => (
                    <option key={r.role} value={r.role}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Permission Group */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  ASSIGN PERMISSION GROUP
                </label>
                <select
                  value={formData.permission_group_id}
                  onChange={e => setFormData({ ...formData, permission_group_id: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #34d399', padding: '0.55rem', borderRadius: 6, color: '#34d399', fontWeight: 700, fontSize: '0.825rem' }}
                >
                  {permissionGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.group_name}</option>
                  ))}
                </select>
              </div>

              {/* Account Status Toggle */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  ACCOUNT ACCESS STATUS
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: 6,
                    border: formData.active ? '1px solid #10b981' : '1px solid #f43f5e',
                    background: formData.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: formData.active ? '#34d399' : '#f43f5e',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {formData.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {formData.active ? '🟢 ACTIVE ACCOUNT (Can Login)' : '🔴 INACTIVE ACCOUNT (Suspended)'}
                </button>
              </div>
            </div>

            {/* Multi-Brand Mapping Grid */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', display: 'block', marginBottom: '0.5rem' }}>
                MAP BRAND COMPANIES (CHECK ALL THAT USER CAN VIEW & MANAGE)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {MASTER_BRANDS.map(b => {
                  const isChecked = formData.company_handles.includes(b.handle);
                  return (
                    <button
                      type="button"
                      key={b.handle}
                      onClick={() => handleToggleBrandHandle(b.handle)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 20,
                        border: isChecked ? '1px solid #38bdf8' : '1px solid #334155',
                        background: isChecked ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                        color: isChecked ? '#38bdf8' : '#94a3b8',
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {isChecked && <Check size={14} />} {b.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsRegisterOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
                <Check size={16} /> {editingUserId ? 'Save User Updates' : 'Register & Create User'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 1: TEAM USER DIRECTORY & MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="data-table-container" style={{ maxHeight: 460, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>S.NO</th>
                  <th>User Person Name & Contact</th>
                  <th>System Role</th>
                  <th>Mapped Brand Companies</th>
                  <th>Permission Group</th>
                  <th>Account Status</th>
                  <th>Password</th>
                  <th style={{ textAlign: 'center' }}>Admin Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const isActive = u.active !== false;
                  return (
                    <tr key={u.id}>
                      <td><strong style={{ color: '#38bdf8' }}>{u.sno || idx + 1}</strong></td>
                      <td>
                        <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.85rem' }}>{u.full_name}</strong>
                        <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: 1 }}>
                          <Mail size={11} /> {u.email || 'N/A'} {u.phone ? ` | 📱 ${u.phone}` : ''}
                        </span>
                      </td>
                      <td>
                        <span className="role-pill" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                          {u.role_name.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, background: 'rgba(52, 211, 153, 0.1)', padding: '0.2rem 0.5rem', borderRadius: 6, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          {u.company_handle || 'All Brands'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={u.permission_group_id || ''}
                          onChange={e => assignUserPermissionGroup(u.id, e.target.value)}
                          style={{ padding: '0.35rem 0.5rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          <option value="" disabled>Select Group...</option>
                          {permissionGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.group_name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleAccountActive(u)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 4,
                            border: isActive ? '1px solid #10b981' : '1px solid #f43f5e',
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isActive ? '#34d399' : '#f43f5e',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                        </button>
                      </td>
                      <td>
                        <code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#fbbf24', fontWeight: 800 }}>{u.password || '1234'}</code>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleOpenEditForm(u)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                            title="Edit User Info & Mappings"
                          >
                            <Edit size={13} /> Edit
                          </button>

                          {passwordResetUserId === u.id ? (
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                              <input 
                                type="text" 
                                value={inlineNewPassword}
                                onChange={e => setInlineNewPassword(e.target.value)}
                                placeholder="New pass..."
                                style={{ padding: '0.25rem 0.4rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 4, color: 'white', fontSize: '0.75rem', width: 85 }}
                              />
                              <button 
                                className="btn btn-success" 
                                onClick={() => handleSaveInlinePassword(u.id)}
                                style={{ padding: '0.25rem 0.4rem', fontSize: '0.7rem' }}
                              >
                                Save
                              </button>
                              <button 
                                className="btn btn-outline" 
                                onClick={() => setPasswordResetUserId(null)}
                                style={{ padding: '0.25rem 0.3rem', fontSize: '0.7rem' }}
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => { setPasswordResetUserId(u.id); setInlineNewPassword(u.password || '1234'); }}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                              title="Reset Password"
                            >
                              <Key size={13} /> Pass
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
        )}

        {/* TAB 2: PERMISSION GROUP MASTER */}
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
                      placeholder="e.g. Can create orders, view products, but cannot delete" 
                      value={newGroupDesc} 
                      onChange={e => setNewGroupDesc(e.target.value)}
                      style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.5rem', borderRadius: 6, color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>TOGGLE DEFAULT PERMISSIONS FOR THIS GROUP</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                    {PERMISSION_CONFIG.map(item => {
                      const active = !!newGroupPerms[item.key];
                      return (
                        <div 
                          key={item.key}
                          onClick={() => setNewGroupPerms(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          style={{
                            background: active ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                            border: active ? '1px solid #38bdf8' : '1px solid #334155',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontSize: '0.775rem', color: active ? '#f8fafc' : '#94a3b8', fontWeight: active ? 700 : 500 }}>{item.label}</span>
                          {active ? <ToggleRight size={18} color="#38bdf8" /> : <ToggleLeft size={18} color="#64748b" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsCreatingGroup(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Permission Group</button>
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem', maxHeight: 420, overflowY: 'auto' }}>
              {permissionGroups.map(group => (
                <div key={group.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>{group.group_name}</h4>
                    {group.is_system && (
                      <span style={{ fontSize: '0.65rem', background: '#334155', color: '#94a3b8', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                        SYSTEM MASTER
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{group.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {PERMISSION_CONFIG.slice(0, 8).map(item => {
                      const enabled = !!group.permissions[item.key];
                      return (
                        <div 
                          key={item.key} 
                          onClick={() => handleToggleGroupPermission(group.id, item.key)}
                          style={{ 
                            fontSize: '0.725rem', 
                            color: enabled ? '#34d399' : '#64748b', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.3rem',
                            cursor: 'pointer',
                            background: enabled ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
                            padding: '0.25rem 0.4rem',
                            borderRadius: 4
                          }}
                        >
                          {enabled ? <Check size={12} /> : <X size={12} />} {item.label}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '0.725rem', color: '#fbbf24', borderTop: '1px solid #1e293b', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Assigned Users:</span>
                    <strong>{users.filter(u => u.permission_group_id === group.id).length} Users</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PERMISSION MATRIX */}
        {activeTab === 'permissions' && (
          <div className="data-table-container" style={{ maxHeight: 440, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.775rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 160 }}>User Name & Role</th>
                  {PERMISSION_CONFIG.map(p => (
                    <th key={p.key} style={{ textAlign: 'center', fontSize: '0.7rem' }}>{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const perms = u.permissions || getDefaultPermissions(u.role_name);
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ color: '#f8fafc', display: 'block' }}>{u.full_name}</strong>
                        <span style={{ fontSize: '0.675rem', color: '#38bdf8' }}>{u.role_name.replace(/_/g, ' ')}</span>
                      </td>
                      {PERMISSION_CONFIG.map(p => {
                        const isGranted = !!perms[p.key];
                        return (
                          <td key={p.key} style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleUserPermission(u.id, p.key)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 2
                              }}
                              title={`Click to ${isGranted ? 'Revoke' : 'Grant'} ${p.label} for ${u.full_name}`}
                            >
                              {isGranted ? (
                                <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.75rem', background: 'rgba(52, 211, 153, 0.15)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>YES</span>
                              ) : (
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', background: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: 4 }}>NO</span>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
            Total Registered Users: <strong>{users.length} Users</strong> | Active Accounts: <strong style={{ color: '#34d399' }}>{users.filter(u => u.active !== false).length} Active</strong> | Inactive: <strong style={{ color: '#f43f5e' }}>{users.filter(u => u.active === false).length} Inactive</strong>
          </div>
          <button className="btn btn-outline" onClick={onClose}>Close Console</button>
        </div>
      </div>
    </div>
  );
};
