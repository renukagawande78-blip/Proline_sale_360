import React from 'react';
import { HeaderView } from '../modules/header/HeaderView';
import { GlobalFilterState } from '../types';

interface HeaderProps {
  onToggleSidebarCollapse?: () => void;
  onOpenUserManagement?: () => void;
  onOpenGlobalFilter?: () => void;
  globalFilterState?: GlobalFilterState;
}

export const Header: React.FC<HeaderProps> = (props) => {
  return <HeaderView {...props} />;
};
