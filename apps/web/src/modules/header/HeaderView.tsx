import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ShieldCheck, Menu, LogOut, KeyRound, MoreVertical, Check, Filter, User, ShoppingBag, Zap, X, Clock, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, getRoleBadge, getCategoryBadge } from '../../context/NotificationContext';
import { RoleName, GlobalFilterState, NotificationCategory } from '../../types';
import { resolveSegmentForUser } from '../../lib/supabase';
import { APP_VERSION, APP_BUILD_DATETIME } from '../../config/version';

interface HeaderViewProps {
  onToggleSidebarCollapse?: () => void;
  onOpenUserManagement?: () => void;
  onOpenGlobalFilter?: () => void;
  globalFilterState?: GlobalFilterState;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const HeaderView: React.FC<HeaderViewProps> = ({ 
  onToggleSidebarCollapse, 
  onOpenUserManagement, 
  onOpenGlobalFilter,
  globalFilterState,
  searchQuery = '',
  onSearchChange
}) => {
  const { currentUser, users, switchUserById, switchRole, logout } = useAuth();
  const { 
    notifications, 
    filteredNotifications, 
    unreadCount, 
    markAsRead, 
    sendTestNotification, 
    clearAll,
    roleFilter,
    setRoleFilter,
    categoryFilter,
    setCategoryFilter
  } = useNotifications();
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

  const activeUser = currentUser;
  const userSegment = resolveSegmentForUser(activeUser);
  const isFmcg = userSegment === 'FMCG';
  const isFmcd = userSegment === 'FMCD';

  const isSuperAdmin = activeUser.role_name === 'SUPER_ADMIN' || (activeUser.full_name || '').toLowerCase().includes('chirag') || (activeUser.full_name || '').toLowerCase().includes('harshad');
  const isAdmin = isSuperAdmin;
  const isChiragAdmin = isSuperAdmin;

  const rolesList: { role: RoleName; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin' },
    { role: 'SALES_ADMIN', label: 'Sales Admin' },
    { role: 'SALES_PERSON', label: 'Field Sales Exec' },
    { role: 'DISPATCH_MANAGER', label: 'Dispatch Manager' },
    { role: 'ACCOUNTS', label: 'Accounts & Billing' }
  ];

  return (
    <header 
      className="top-header app-header"
      style={{
        position: 'sticky',
        top: 0,
        minHeight: 64,
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.15rem',
        gap: '0.75rem',
        width: '100%',
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        flexShrink: 0,
        flexWrap: 'nowrap'
      }}
    >
      {/* Left Section: Sidebar Toggle & Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
        <button 
          onClick={onToggleSidebarCollapse}
          style={{ 
            padding: '0.45rem', 
            color: '#f8fafc', 
            border: '1px solid #334155',
            background: '#1e293b',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Toggle Left Sidebar Menu Width (Expand / Collapse)"
        >
          <Menu size={18} color="#38bdf8" />
        </button>

        {/* Search Input Box */}
        <div style={{ position: 'relative', width: 270 }} className="desktop-search">
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => onSearchChange?.(e.target.value)}
            placeholder="Search orders, agencies, SKUs..." 
            style={{ 
              width: '100%', 
              background: '#1e293b', 
              border: searchQuery.trim() ? '1px solid #38bdf8' : '1px solid #334155', 
              borderRadius: 8, 
              padding: '0.45rem 2rem 0.45rem 2.2rem', 
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none',
              boxShadow: searchQuery.trim() ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right Section: Action Controls & User Mapped Segment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        
        {/* Logged-In User Segment Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.65rem',
          borderRadius: 8,
          fontSize: '0.725rem',
          fontWeight: 800,
          background: isFmcg ? 'rgba(16, 185, 129, 0.15)' : (isFmcd ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
          color: isFmcg ? '#34d399' : (isFmcd ? '#fbbf24' : '#38bdf8'),
          border: isFmcg ? '1px solid rgba(16, 185, 129, 0.35)' : (isFmcd ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)')
        }} title={`Salesperson Segment Scope: ${userSegment}`}>
          {isFmcg ? <ShoppingBag size={13} /> : <Zap size={13} />}
          <span>{userSegment === 'ALL' ? 'ALL' : userSegment}</span>
        </div>

        {/* 1. Global Filter Button */}
        {onOpenGlobalFilter && (
          <button
            onClick={onOpenGlobalFilter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: globalFilterState?.isActive ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              border: globalFilterState?.isActive ? '1px solid #38bdf8' : '1px solid #334155',
              color: globalFilterState?.isActive ? '#38bdf8' : '#f8fafc',
              padding: '0.45rem 0.85rem',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              boxShadow: globalFilterState?.isActive ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="App-Wide Master Global Data Filter Console"
          >
            <Filter size={15} color="#38bdf8" />
            <span className="filter-btn-text">
              {globalFilterState?.isActive ? 'Filter (Active)' : 'Filter'}
            </span>
          </button>
        )}

        {/* 2. Realtime Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMenu(false);
            }}
            style={{ 
              background: '#1e293b', 
              border: showNotifications ? '1px solid #38bdf8' : '1px solid #334155', 
              borderRadius: 8, 
              padding: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: showNotifications ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
            }}
            title="Realtime System Notifications"
          >
            <Bell size={18} color={showNotifications ? '#38bdf8' : '#f8fafc'} />
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: -4, 
                right: -4, 
                background: '#f43f5e', 
                color: 'white', 
                fontSize: '0.625rem', 
                fontWeight: 800, 
                minWidth: 16, 
                height: 16, 
                borderRadius: 8, 
                padding: '0 3px',
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
              width: 'min(380px, calc(100vw - 1.5rem))', 
              background: '#1e293b', 
              border: '1px solid rgba(255, 255, 255, 0.12)', 
              borderRadius: 14, 
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.15)', 
              zIndex: 1000, 
              padding: '1rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}>
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.65rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bell size={15} color="#38bdf8" /> Notifications
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={sendTestNotification}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                    title="Send a test alert for your current role"
                  >
                    🔔 Test Alert
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      style={{
                        background: 'transparent',
                        border: '1px solid #475569',
                        color: '#94a3b8',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                      title="Clear all notifications"
                    >
                      Clear
                    </button>
                  )}
                  <span style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', padding: '0.15rem 0.45rem', borderRadius: 10 }}>
                    {unreadCount} Unread
                  </span>
                </div>
              </div>

              {/* Role Scope Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', background: '#0f172a', padding: '0.2rem', borderRadius: 8, border: '1px solid #334155' }}>
                <button
                  onClick={() => setRoleFilter('MY_ROLE')}
                  style={{
                    flex: 1,
                    background: roleFilter === 'MY_ROLE' ? '#38bdf8' : 'transparent',
                    color: roleFilter === 'MY_ROLE' ? '#0f172a' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.675rem',
                    padding: '0.3rem 0.4rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                  title={`Show notifications routed to ${currentUser.role_name}`}
                >
                  👤 For My Role ({currentUser.role_name?.replace(/_/g, ' ')})
                </button>
                <button
                  onClick={() => setRoleFilter('ALL')}
                  style={{
                    flex: 1,
                    background: roleFilter === 'ALL' ? '#38bdf8' : 'transparent',
                    color: roleFilter === 'ALL' ? '#0f172a' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.675rem',
                    padding: '0.3rem 0.4rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                  title="Show all system notifications"
                >
                  🌐 All Roles ({notifications.length})
                </button>
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.45rem', marginBottom: '0.65rem' }}>
                {(['ALL', 'ORDER', 'INVENTORY', 'APPROVAL', 'DISPATCH', 'BILLING', 'POD'] as const).map(cat => {
                  const isSelected = categoryFilter === cat;
                  const label = cat === 'ALL' ? 'All Categories'
                    : cat === 'ORDER' ? '📦 Orders'
                    : cat === 'INVENTORY' ? '⏳ Stock'
                    : cat === 'APPROVAL' ? '🔒 Review'
                    : cat === 'DISPATCH' ? '🚚 Dispatch'
                    : cat === 'BILLING' ? '🧾 GRN / Bill'
                    : '📑 POD';

                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                        color: isSelected ? '#38bdf8' : '#94a3b8',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 12,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Notifications List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: 320, overflowY: 'auto' }}>
                {filteredNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>📭</div>
                    <div>No notifications for this category/role</div>
                    <button
                      onClick={() => { setRoleFilter('ALL'); setCategoryFilter('ALL'); }}
                      style={{
                        marginTop: '0.65rem',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontSize: '0.65rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                ) : (
                  filteredNotifications.map(n => {
                    const catBadge = getCategoryBadge(n.category);
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        style={{ 
                          background: n.is_read ? '#0f172a' : 'rgba(56, 189, 248, 0.10)', 
                          padding: '0.65rem 0.75rem', 
                          borderRadius: 10, 
                          borderLeft: n.is_read ? '3px solid #334155' : '3px solid #38bdf8', 
                          border: n.is_read ? '1px solid #334155' : '1px solid rgba(56, 189, 248, 0.35)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Meta Tags Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.575rem', color: catBadge.color, background: catBadge.bg, padding: '0.05rem 0.35rem', borderRadius: 4, fontWeight: 800 }}>
                              {catBadge.label}
                            </span>
                            {n.brand_name && (
                              <span style={{ fontSize: '0.575rem', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', padding: '0.05rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                                {n.brand_name}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 600 }}>
                            {n.created_at}
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '0.785rem', fontWeight: 800, color: '#f8fafc', marginBottom: 2, lineHeight: 1.3 }}>
                          {n.title}
                        </div>

                        {/* Message */}
                        <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                          {n.message}
                        </div>

                        {/* Target Role Pills */}
                        {n.target_roles && n.target_roles.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', marginTop: 2 }}>
                            <span style={{ fontSize: '0.575rem', color: '#64748b', fontWeight: 700 }}>For:</span>
                            {n.target_roles.map(r => {
                              const rb = getRoleBadge(r);
                              const isMyRole = currentUser?.role_name === r;
                              return (
                                <span 
                                  key={r} 
                                  style={{ 
                                    fontSize: '0.575rem', 
                                    color: rb.color, 
                                    background: rb.bg, 
                                    border: isMyRole ? `1px solid ${rb.color}` : 'none',
                                    padding: '0.05rem 0.3rem', 
                                    borderRadius: 4, 
                                    fontWeight: isMyRole ? 800 : 700 
                                  }}
                                >
                                  {rb.label} {isMyRole ? '★' : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. 3-DOT OPTIONS & ACCOUNT MENU */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            onClick={() => {
              setShowMenu(!showMenu);
              setShowNotifications(false);
            }}
            style={{ 
              background: showMenu ? 'rgba(56, 189, 248, 0.15)' : '#1e293b', 
              border: showMenu ? '1px solid #38bdf8' : '1px solid #334155', 
              color: showMenu ? '#38bdf8' : '#f8fafc', 
              padding: '0.5rem', 
              borderRadius: 8, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: showMenu ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
            }}
            title="Account Profile & System Options"
          >
            <MoreVertical size={18} />
          </button>

          {/* 3-Dot Popup Dropdown */}
          {showMenu && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: 'calc(100% + 10px)', 
              width: 'min(300px, calc(100vw - 1.5rem))', 
              background: '#1e293b', 
              border: '1px solid rgba(255, 255, 255, 0.12)', 
              borderRadius: 14, 
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.1)', 
              zIndex: 1000, 
              padding: '0.85rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}>
              
              {/* User Header Info Card */}
              <div style={{ padding: '0.65rem', background: '#0f172a', borderRadius: 10, border: '1px solid #334155', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>
                    {activeUser.full_name ? activeUser.full_name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f8fafc' }}>{activeUser.full_name}</div>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{activeUser.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="role-pill" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                    {(activeUser.role_name || '').replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                    🏢 Scope: {activeUser.company_handle === 'All' ? 'All 13 Brands' : activeUser.company_handle}
                  </span>
                  <span style={{ 
                    fontSize: '0.675rem', 
                    fontWeight: 800, 
                    color: isFmcg ? '#34d399' : (isFmcd ? '#fbbf24' : '#38bdf8'), 
                    background: isFmcg ? 'rgba(52, 211, 153, 0.12)' : (isFmcd ? 'rgba(251, 191, 36, 0.12)' : 'rgba(56, 189, 248, 0.12)'), 
                    border: isFmcg ? '1px solid rgba(52, 211, 153, 0.3)' : (isFmcd ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'), 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: 6 
                  }}>
                    🏷️ Segment: {userSegment === 'ALL' ? 'ALL (FMCG & FMCD)' : userSegment}
                  </span>
                </div>
              </div>

              {/* Logged-In Persona Switcher Hidden */}

              {/* Options Menu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                
                {/* Passwords & Authority Option */}
                {isAdmin && onOpenUserManagement && (
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      onOpenUserManagement();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <KeyRound size={15} /> User Passwords & Authority
                  </button>
                )}
              </div>

              {/* Logout Option */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: '#f43f5e',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} /> Exit Account / Sign Out
                </button>
              </div>

              {/* Version & Build Creation Timestamp Info */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Tag size={12} color="#38bdf8" /> App Version:
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace' }}>
                    {APP_VERSION}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.66rem', color: '#64748b' }}>
                  <Clock size={11} color="#64748b" />
                  <span>Created: {APP_BUILD_DATETIME}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
