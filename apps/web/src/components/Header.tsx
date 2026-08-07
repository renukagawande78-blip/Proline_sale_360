import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ShieldCheck, Menu, LogOut, KeyRound, MoreVertical, User, Check, X } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="top-header" style={{ position: 'relative', zIndex: 40 }}>
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

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        
        {/* Notifications Bell Trigger & Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMenu(false);
            }}
            style={{ 
              background: '#0f172a', 
              border: showNotifications ? '1px solid #38bdf8' : '1px solid #334155', 
              borderRadius: 10, 
              padding: '0.55rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: showNotifications ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
            }}
            title="Realtime Notifications"
          >
            <Bell size={18} color={showNotifications ? '#38bdf8' : '#f8fafc'} />
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: -5, 
                right: -5, 
                background: '#f43f5e', 
                color: 'white', 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                minWidth: 18, 
                height: 18, 
                borderRadius: 9, 
                padding: '0 4px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(244, 63, 94, 0.5)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popup */}
          {showNotifications && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: 'calc(100% + 10px)', 
              width: 360, 
              background: '#1e293b', 
              border: '1px solid rgba(255, 255, 255, 0.12)', 
              borderRadius: 16, 
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.1)', 
              zIndex: 1000, 
              padding: '1.25rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} color="#38bdf8" /> Realtime Notifications
                </span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', padding: '0.2rem 0.6rem', borderRadius: 12 }}>
                  {unreadCount} Unread
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      style={{ 
                        background: n.is_read ? '#0f172a' : 'rgba(56, 189, 248, 0.12)', 
                        padding: '0.85rem', 
                        borderRadius: 10, 
                        borderLeft: n.is_read ? 'none' : '3px solid #38bdf8', 
                        border: n.is_read ? '1px solid #334155' : '1px solid rgba(56, 189, 248, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f8fafc', marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: 6, lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 600 }}>{n.created_at}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#0f172a', padding: '0.4rem 0.75rem', borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#f8fafc' }}>{currentUser.full_name}</div>
          </div>
          <span className="role-pill" style={{ marginLeft: 4 }}>{currentUser.role_name.replace('_', ' ')}</span>
        </div>

        {/* 3-DOT MENU BUTTON & POPUP DROPDOWN */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            onClick={() => {
              setShowMenu(!showMenu);
              setShowNotifications(false);
            }}
            style={{ 
              background: showMenu ? 'rgba(56, 189, 248, 0.15)' : '#0f172a', 
              border: showMenu ? '1px solid #38bdf8' : '1px solid #334155', 
              color: showMenu ? '#38bdf8' : '#f8fafc', 
              padding: '0.55rem', 
              borderRadius: 10, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: showMenu ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
            }}
            title="Account & System Options"
          >
            <MoreVertical size={18} />
          </button>

          {/* 3-Dot Popup Dropdown */}
          {showMenu && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: 'calc(100% + 10px)', 
              width: 280, 
              background: '#1e293b', 
              border: '1px solid rgba(255, 255, 255, 0.12)', 
              borderRadius: 16, 
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.1)', 
              zIndex: 1000, 
              padding: '0.85rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}>
              
              {/* User Header inside popup */}
              <div style={{ padding: '0.5rem 0.5rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f8fafc' }}>{currentUser.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{currentUser.email}</div>
                <div style={{ marginTop: 6, display: 'inline-block', fontSize: '0.675rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '0.2rem 0.55rem', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  Active Role: {currentUser.role_name.replace('_', ' ')}
                </div>
              </div>

              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                
                {/* User Passwords / User Management Option */}
                {isAdmin && onOpenUserManagement && (
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      onOpenUserManagement();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#38bdf8',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <KeyRound size={16} /> User Passwords & Authority
                  </button>
                )}

                {/* Role Switcher Section */}
                <div style={{ padding: '0.4rem 0.75rem 0.2rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={13} color="#38bdf8" /> Switch System Role:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 160, overflowY: 'auto' }}>
                    {rolesList.map(r => {
                      const isCurrent = currentUser.role_name === r.role;
                      return (
                        <button
                          key={r.role}
                          onClick={() => {
                            switchRole(r.role);
                            setShowMenu(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.6rem',
                            borderRadius: 6,
                            border: 'none',
                            background: isCurrent ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                            color: isCurrent ? '#38bdf8' : '#cbd5e1',
                            fontSize: '0.775rem',
                            fontWeight: isCurrent ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={e => {
                            if (!isCurrent) e.currentTarget.style.background = '#0f172a';
                          }}
                          onMouseLeave={e => {
                            if (!isCurrent) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{r.label}</span>
                          {isCurrent && <Check size={14} color="#38bdf8" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Logout Option */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    borderRadius: 8,
                    color: '#fb7185',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LogOut size={16} /> Log Out of Console
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
