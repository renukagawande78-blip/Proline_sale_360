import React, { useState } from 'react';
import { ShieldCheck, Check, X, Lock, Users, Sparkles, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { RoleName, PermissionControl, PermissionGroup } from '../../types';
import { useAuth, getDefaultPermissions } from '../../context/AuthContext';
import { checkIsSuperAdmin } from '../../lib/supabase';

interface RolePermissionsMasterViewProps {
  searchQuery: string;
}

interface PermissionDefinition {
  key: keyof PermissionControl;
  label: string;
  category: 'Order Management' | 'Master & Catalog' | 'Billing & Accounts' | 'Dispatch & Delivery' | 'Administration';
  description: string;
}

const ALL_PERMISSION_DEFS: PermissionDefinition[] = [
  // Order Management
  { key: 'add_order', label: 'Add New Order', category: 'Order Management', description: 'Create and place B2B purchase/sales orders' },
  { key: 'view_order', label: 'View Orders', category: 'Order Management', description: 'Browse and inspect submitted orders list' },
  { key: 'order_entry', label: 'Order Entry Form', category: 'Order Management', description: 'Access standard order entry screen' },
  { key: 'cancel_order', label: 'Cancel Order', category: 'Order Management', description: 'Cancel pending or unapproved orders' },
  { key: 'delete_order', label: 'Delete Order (Permanent)', category: 'Order Management', description: 'Permanent deletion of order records' },
  
  // Master & Catalog
  { key: 'party_view', label: 'View Parties / Agencies', category: 'Master & Catalog', description: 'View agency directory and master records' },
  { key: 'new_party', label: 'Register New Agency', category: 'Master & Catalog', description: 'Add or import new agencies into master' },
  { key: 'product_mgmt', label: 'Product SKU Master', category: 'Master & Catalog', description: 'Add, edit, or adjust product catalog and MRP' },

  // Billing & Accounts
  { key: 'order_transfer_to_billing', label: 'Transfer to Billing', category: 'Billing & Accounts', description: 'Move approved orders to invoice billing' },
  { key: 'company_order_form', label: 'Company Order Form', category: 'Billing & Accounts', description: 'Generate brand-wise order sheets' },
  { key: 'company_order_status_dashboard', label: 'Brand Order Dashboard', category: 'Billing & Accounts', description: 'View brand-specific operational status' },
  { key: 'order_status_dashboard_all', label: 'Global 360 Dashboard', category: 'Billing & Accounts', description: 'Complete cross-brand order tracking dashboard' },

  // Dispatch & Delivery
  { key: 'order_transfer_to_dispatch', label: 'Transfer to Dispatch', category: 'Dispatch & Delivery', description: 'Release billed orders to warehouse dispatch' },
  { key: 'order_transfer_out_for_delivery', label: 'Out for Delivery', category: 'Dispatch & Delivery', description: 'Assign vehicles and dispatch deliveries' },
  { key: 'pod_verification', label: 'POD Verification', category: 'Dispatch & Delivery', description: 'Upload and verify proof of delivery documents' },

  // Administration
  { key: 'user_authority', label: 'User & Role Authority', category: 'Administration', description: 'Manage system users, passwords, and roles' },
];

const ALL_ROLES: { role: RoleName; label: string; color: string; desc: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', color: '#ef4444', desc: 'Full unrestricted system access and data governance' },
  { role: 'SALES_ADMIN', label: 'Sales Admin', color: '#f59e0b', desc: 'Order approvals, commercial flows, billing transfers' },
  { role: 'AREA_SALES_MANAGER', label: 'Area Sales Manager', color: '#a855f7', desc: 'Territory supervision, order reviews, and field tracking' },
  { role: 'SALES_PERSON', label: 'Sales Person', color: '#38bdf8', desc: 'Field order booking and party catalog browsing' },
  { role: 'BILLING', label: 'Billing & Accounts', color: '#10b981', desc: 'Invoice generation, account balance clearance, and dispatch handoff' },
  { role: 'DISPATCH_MANAGER', label: 'Dispatch Manager', color: '#ec4899', desc: 'Packing, vehicle loading, driver assignment, and PODs' },
  { role: 'ACCOUNTS', label: 'Finance & Accounts', color: '#6366f1', desc: 'Credit limits, financial audits, and ledger clearance' },
];

export const RolePermissionsMasterView: React.FC<RolePermissionsMasterViewProps> = ({ searchQuery }) => {
  const { currentUser, users } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  // Maintain local state of permissions per role
  const [rolePermissions, setRolePermissions] = useState<Record<RoleName, PermissionControl>>(() => {
    const initial: Record<RoleName, PermissionControl> = {} as any;
    ALL_ROLES.forEach(r => {
      initial[r.role] = getDefaultPermissions(r.role);
    });
    return initial;
  });

  const [selectedRole, setSelectedRole] = useState<RoleName>('SUPER_ADMIN');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleTogglePermission = (role: RoleName, permKey: keyof PermissionControl) => {
    if (!isSuperAdmin) {
      alert('Only Super Admins have authority to edit role permissions.');
      return;
    }
    if (role === 'SUPER_ADMIN') {
      alert('Super Admin authority permissions cannot be disabled.');
      return;
    }

    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permKey]: !prev[role][permKey]
      }
    }));
    showNotice(`Updated permission "${permKey}" for ${role.replace(/_/g, ' ')}!`);
  };

  const handleResetRoleDefaults = (role: RoleName) => {
    if (!isSuperAdmin) return;
    setRolePermissions(prev => ({
      ...prev,
      [role]: getDefaultPermissions(role)
    }));
    showNotice(`Reset ${role.replace(/_/g, ' ')} to system default permissions.`);
  };

  const categories = ['ALL', 'Order Management', 'Master & Catalog', 'Billing & Accounts', 'Dispatch & Delivery', 'Administration'];

  const filteredPermissions = ALL_PERMISSION_DEFS.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
  });

  const activeRoleObj = ALL_ROLES.find(r => r.role === selectedRole) || ALL_ROLES[0];
  const usersInActiveRole = users.filter(u => u.role_name === selectedRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header Banner */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #070e20 0%, #0f172a 50%, #1e1b4b 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Role & Permission Matrix
              </h2>
              <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.2rem 0.55rem', borderRadius: 6 }}>
                7 Roles • 16 Permissions
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
              Inspect and configure granular access controls across commercial, logistics, catalog, and admin operations.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleResetRoleDefaults(selectedRole)}
          style={{
            padding: '0.45rem 0.95rem',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#fbbf24',
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <RefreshCw size={13} /> Reset {activeRoleObj.label} Defaults
        </button>
      </div>

      {noticeMsg && (
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {noticeMsg}
        </div>
      )}

      {/* Role Selection Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.5rem',
        background: '#0b1329',
        borderRadius: 12,
        border: '1px solid #1e293b'
      }}>
        {ALL_ROLES.map(r => {
          const isSelected = selectedRole === r.role;
          const userCount = users.filter(u => u.role_name === r.role).length;

          return (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 8,
                border: isSelected ? `1px solid ${r.color}` : '1px solid transparent',
                background: isSelected ? `${r.color}22` : 'transparent',
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
              <span>{r.label}</span>
              <span style={{ fontSize: '0.7rem', color: isSelected ? r.color : '#64748b', fontWeight: 700 }}>
                ({userCount})
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Role Summary Card */}
      <div style={{
        padding: '0.85rem 1.15rem',
        background: '#141f36',
        borderRadius: 12,
        border: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <strong style={{ color: activeRoleObj.color, fontSize: '0.95rem' }}>{activeRoleObj.label}</strong>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>• {activeRoleObj.desc}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
            Assigned Users in DB ({usersInActiveRole.length}):{' '}
            <strong style={{ color: '#cbd5e1' }}>
              {usersInActiveRole.length > 0 ? usersInActiveRole.map(u => u.full_name).join(', ') : 'No users currently assigned'}
            </strong>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: 6,
                border: 'none',
                background: selectedCategory === cat ? '#38bdf8' : '#0b1329',
                color: selectedCategory === cat ? '#090d16' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Module Category</th>
              <th style={{ width: '28%' }}>Permission Name</th>
              <th style={{ width: '35%' }}>Access Scope Description</th>
              <th style={{ textAlign: 'center', width: '15%' }}>Access Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPermissions.map(p => {
              const hasAccess = !!rolePermissions[selectedRole]?.[p.key];
              const isSuperAdminLocked = selectedRole === 'SUPER_ADMIN';

              return (
                <tr key={p.key}>
                  <td>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 6
                    }}>
                      {p.category}
                    </span>
                  </td>

                  <td>
                    <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{p.label}</strong>
                    <div style={{ fontSize: '0.675rem', color: '#64748b', fontFamily: 'monospace' }}>
                      perm_key: {p.key}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                      {p.description}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleTogglePermission(selectedRole, p.key)}
                      disabled={isSuperAdminLocked}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: 8,
                        border: 'none',
                        background: hasAccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                        color: hasAccess ? '#34d399' : '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: isSuperAdminLocked ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                      title={isSuperAdminLocked ? 'Super Admin permissions are permanently enabled' : 'Click to toggle permission'}
                    >
                      {hasAccess ? <Check size={14} color="#34d399" /> : <X size={14} color="#f87171" />}
                      <span>{hasAccess ? 'ALLOWED' : 'DENIED'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
