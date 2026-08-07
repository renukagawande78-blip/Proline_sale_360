import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CheckCircle2, 
  Truck, 
  Receipt, 
  BarChart3, 
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, isOpen, onCloseMobile }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ALL'] },
    { id: 'orders', label: 'Sales Orders', icon: ShoppingCart, roles: ['ALL'] },
    { id: 'approvals', label: 'System Admin Approvals', icon: CheckCircle2, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { id: 'dispatch', label: 'Dispatch Management', icon: Truck, roles: ['SUPER_ADMIN', 'DISPATCH_MANAGER', 'SYSTEM_ADMIN'] },
    { id: 'accounts', label: 'Accounts & Billing', icon: Receipt, roles: ['SUPER_ADMIN', 'ACCOUNTS', 'BILLING'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ALL'] },
    { id: 'masters', label: 'Master Data', icon: Building2, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] }
  ];

  const filteredNav = navItems.filter(item => 
    item.roles.includes('ALL') || item.roles.includes(role)
  );

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

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-badge">360</div>
          <div style={{ flex: 1 }}>
            <div className="logo-text">PROLINE OMS</div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ENTERPRISE B2B</span>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="nav-list">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectTab(item.id)}
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>
            SYSTEM ENVIRONMENT
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#38bdf8' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
            <span>Supabase Live DB</span>
          </div>
        </div>
      </aside>
    </>
  );
};
