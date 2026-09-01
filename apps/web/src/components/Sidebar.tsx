import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CheckCircle2, 
  Truck, 
  Receipt, 
  BarChart3, 
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  PackageX,
  ScanSearch,
  FileCheck2,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PermissionControl } from '../types';
import { resolveSegmentForUser } from '../lib/supabase';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onTabChange, 
  isOpen, 
  onCloseMobile,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse
}) => {
  const { currentUser, hasPermission, logout } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const userSegment = resolveSegmentForUser(currentUser);
  
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const rawCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const isCollapsed = isOpen ? false : rawCollapsed;
  
  const handleToggleCollapse = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const navItems: { id: string; label: string; icon: any; permissionKey?: keyof PermissionControl; fallbackRoles: string[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, fallbackRoles: ['ALL'] },
    { id: 'orders', label: 'Sales Orders', icon: ShoppingCart, fallbackRoles: ['ALL'] },
    { id: 'approvals', label: 'Order Approvals', icon: CheckCircle2, permissionKey: 'order_transfer_to_billing', fallbackRoles: ['SUPER_ADMIN', 'SALES_ADMIN'] },
    { id: 'dispatch', label: 'Dispatch Management', icon: Truck, permissionKey: 'order_transfer_to_dispatch', fallbackRoles: ['SUPER_ADMIN', 'DISPATCH_MANAGER', 'BILLING', 'SALES_ADMIN'] },
    { id: 'accounts', label: 'Accounts & Billing', icon: Receipt, permissionKey: 'order_transfer_to_billing', fallbackRoles: ['SUPER_ADMIN', 'ACCOUNTS', 'BILLING'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, fallbackRoles: ['ALL'] },
    { id: 'returns', label: 'Returns & Damage', icon: PackageX, fallbackRoles: ['ALL'] },
    { id: 'pod', label: 'POD Queue', icon: FileCheck2, fallbackRoles: ['SUPER_ADMIN', 'SALES_ADMIN'] },
    { id: 'tracker', label: 'Order Tracker', icon: ScanSearch, fallbackRoles: ['ALL'] },
    { id: 'masters', label: 'Master Data', icon: Building2, permissionKey: 'party_view', fallbackRoles: ['ALL'] }
  ];

  const filteredNav = navItems.filter(item => {
    const isChiragOrHarshad = (currentUser?.full_name || '').toLowerCase().includes('chirag') || (currentUser?.full_name || '').toLowerCase().includes('harshad');
    const isSuperAdminUser = role === 'SUPER_ADMIN' || isChiragOrHarshad;

    if (isSuperAdminUser) return true;

    // 1. Field Sales Exec / Area Sales Manager: ONLY sees Sales Orders, Track My Order, and Reports & Analytics
    if (role === 'SALES_PERSON' || role === 'AREA_SALES_MANAGER') {
      return item.id === 'orders' || item.id === 'tracker' || item.id === 'reports';
    }

    // 2. Sales Admin operational dashboard and review tools
    if (role === 'SALES_ADMIN') {
      if (item.id === 'accounts' || item.id === 'dispatch') {
        return false;
      }
      return true;
    }

    // 3. Dispatch Manager operational dashboard and logistics tools
    if (role === 'DISPATCH_MANAGER') {
      if (item.id === 'orders' || item.id === 'approvals' || item.id === 'accounts' || item.id === 'pod' || item.id === 'zones' || item.id === 'masters') {
        return false;
      }
      return true;
    }

    // 4. Billing & Accounts dashboard and invoicing tools
    if (role === 'BILLING' || role === 'ACCOUNTS') {
      if (item.id === 'orders' || item.id === 'dispatch' || item.id === 'pod' || item.id === 'zones' || item.id === 'masters') {
        return false;
      }
      return true;
    }

    if (item.fallbackRoles.includes('ALL')) return true;
    if (item.permissionKey && hasPermission(item.permissionKey)) return true;
    return item.fallbackRoles.includes(role);
  });

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onCloseMobile}
      />

      <aside 
        className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: isCollapsed ? 72 : 260,
          padding: isCollapsed ? '1.25rem 0.5rem' : '1.5rem 1rem',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden'
        }}
      >
        {/* Sidebar Header & Collapse Toggle */}
        <div 
          className="sidebar-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? 0 : '0.75rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #334155',
            marginBottom: '1.25rem'
          }}
        >
          <img 
            src="/prokap-badge.png" 
            alt="PROKAP Logo" 
            style={{ 
              width: 38, 
              height: 38, 
              borderRadius: '10px', 
              objectFit: 'contain',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }} 
          />

          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div className="logo-text" style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>PROKAP</div>
              <span style={{ fontSize: '0.625rem', color: '#10b981', fontWeight: 700, letterSpacing: '0.04em', display: 'block', whiteSpace: 'nowrap' }}>ORDER FAST. TRACK LIVE.</span>
            </div>
          )}

          {onCloseMobile && (
            <button 
              onClick={onCloseMobile} 
              style={{ 
                background: '#1e293b', 
                border: '1px solid #334155', 
                color: '#94a3b8', 
                cursor: 'pointer', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.35rem',
                borderRadius: 6
              }}
              className="mobile-only-close-btn"
              title="Close Navigation Drawer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <ul className="nav-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {filteredNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{ 
                    width: '100%', 
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent', 
                    border: 'none', 
                    borderRadius: 8,
                    padding: isCollapsed ? '0.75rem 0' : '0.75rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    color: isActive ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    borderLeft: isActive && !isCollapsed ? '3px solid #38bdf8' : 'none'
                  }}
                >
                  <Icon size={19} color={isActive ? '#38bdf8' : '#94a3b8'} style={{ minWidth: 19 }} />
                  {!isCollapsed && (
                    <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer System Status & Logged-In User Details */}
        <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid #334155' }}>
          {!isCollapsed ? (
            <>
              {/* Logged-In Person Name & Role */}
              <div style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                LOGGED-IN USER
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.5rem 0.65rem',
                marginBottom: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.825rem',
                    flexShrink: 0
                  }}>
                    {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.full_name || 'System User'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>
                      {(currentUser?.role_name || 'SALES_PERSON').replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Segment Scope */}
              <div style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                LOGGED-IN SEGMENT SCOPE
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                padding: '0.35rem 0.55rem', 
                borderRadius: '8px', 
                background: userSegment === 'FMCG' ? 'rgba(16, 185, 129, 0.15)' : (userSegment === 'FMCD' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
                color: userSegment === 'FMCG' ? '#34d399' : (userSegment === 'FMCD' ? '#fbbf24' : '#38bdf8'),
                border: userSegment === 'FMCG' ? '1px solid rgba(16, 185, 129, 0.3)' : (userSegment === 'FMCD' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'),
                marginBottom: '0.65rem'
              }}>
                <ShoppingBag size={13} />
                <span>Segment: {userSegment === 'ALL' ? 'FMCG & FMCD' : userSegment}</span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => logout()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '7px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#fb7185',
                  fontSize: '0.775rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginBottom: '0.65rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)')}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>

              <div style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                SYSTEM ENVIRONMENT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.775rem', color: '#38bdf8', fontWeight: 700 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                <span>Supabase Live DB</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem' }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.725rem'
              }} title={`Logged in: ${currentUser?.full_name || 'User'} (${userSegment})`}>
                {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: userSegment === 'FMCG' ? '#10b981' : (userSegment === 'FMCD' ? '#fbbf24' : '#38bdf8'), boxShadow: '0 0 8px currentColor' }} title={`Segment: ${userSegment}`}></div>
              <button
                onClick={() => logout()}
                title="Sign Out"
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  borderRadius: 6,
                  padding: '0.35rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
