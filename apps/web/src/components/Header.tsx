import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, Menu, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { RoleName } from '../types';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  onOpenUserManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, onOpenUserManagement }) => {
  const { currentUser, switchRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.role_name === 'SYSTEM_ADMIN' || currentUser.role_name === 'SUPER_ADMIN';

  const rolesList: { role: RoleName; label: string }[] = [
    { role: 'SYSTEM_ADMIN', label: 'System Admin' },
    { role: 'SUPER_ADMIN', label: 'Super Admin' },
    { role: 'SALES_PERSON', label: 'Sales Person' },
    { role: 'AREA_SALES_MANAGER', label: 'Area Sales Manager' },
    { role: 'DISPATCH_MANAGER', label: 'Dispatch Manager' },
    { role: 'ACCOUNTS', label: 'Accounts Manager' },
    { role: 'BILLING', label: 'Billing Executive' }
  ];

  return (
    <header className="top-header">
      <div className="header-left">
        <button 
          className="mobile-toggle" 
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-search">
          <Search size={16} color="#64748b" />
          <input type="text" placeholder="Search orders (e.g. PRL-1054), agencies..." />
        </div>
      </div>

      <div className="header-right">
        {/* Admin Password & User Management Trigger */}
        {isAdmin && onOpenUserManagement && (
          <button 
            className="btn btn-outline" 
            onClick={onOpenUserManagement}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.775rem', color: '#38bdf8', borderColor: '#38bdf8' }}
            title="Admin Authority Password & User Settings"
          >
            <KeyRound size={15} /> User Passwords
          </button>
        )}

        {/* Role Selector Simulator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid #334155' }}>
          <ShieldCheck size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Role:</span>
          <select 
            value={currentUser.role_name}
            onChange={(e) => switchRole(e.target.value as RoleName)}
            style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontWeight: 700, fontSize: '0.825rem', outline: 'none', cursor: 'pointer' }}
          >
            {rolesList.map(r => (
              <option key={r.role} value={r.role} style={{ background: '#1e293b', color: '#f8fafc' }}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
          >
            <Bell size={18} color="#f8fafc" />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#f43f5e', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{ position: 'absolute', right: 0, top: 45, width: 320, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', zIndex: 50, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Realtime Notifications</span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{unreadCount} Unread</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 300, overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    style={{ background: n.is_read ? '#0f172a' : 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: 8, borderLeft: n.is_read ? 'none' : '3px solid #38bdf8', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>{n.message}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{n.created_at}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout Button */}
        <div className="user-profile-badge">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentUser.full_name}</div>
          </div>
          <span className="role-pill">{currentUser.role_name.replace('_', ' ')}</span>
        </div>

        <button 
          onClick={logout} 
          style={{ background: '#0f172a', border: '1px solid #334155', color: '#f43f5e', padding: '0.5rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Log Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
