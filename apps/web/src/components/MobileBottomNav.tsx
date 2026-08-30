import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CheckCircle2, 
  Truck, 
  ScanSearch, 
  Menu 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenMenu
}) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';

  const isDispatchManager = role === 'DISPATCH_MANAGER';
  const middleTab = isDispatchManager ? 'dispatch' : 'approvals';
  const middleLabel = isDispatchManager ? 'Dispatch' : 'Approvals';
  const MiddleIcon = isDispatchManager ? Truck : CheckCircle2;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button 
        type="button"
        className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <LayoutDashboard size={20} className="mobile-nav-icon" />
        <span>Dashboard</span>
      </button>

      <button 
        type="button"
        className={`mobile-nav-item ${currentTab === 'orders' ? 'active' : ''}`}
        onClick={() => onTabChange('orders')}
      >
        <ShoppingCart size={20} className="mobile-nav-icon" />
        <span>Orders</span>
      </button>

      <button 
        type="button"
        className={`mobile-nav-item ${currentTab === middleTab ? 'active' : ''}`}
        onClick={() => onTabChange(middleTab)}
      >
        <MiddleIcon size={20} className="mobile-nav-icon" />
        <span>{middleLabel}</span>
      </button>

      <button 
        type="button"
        className={`mobile-nav-item ${currentTab === 'tracker' ? 'active' : ''}`}
        onClick={() => onTabChange('tracker')}
      >
        <ScanSearch size={20} className="mobile-nav-icon" />
        <span>Tracker</span>
      </button>

      <button 
        type="button"
        className="mobile-nav-item"
        onClick={onOpenMenu}
      >
        <Menu size={20} className="mobile-nav-icon" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
