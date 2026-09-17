import React from 'react';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { Order } from '../types';

interface DashboardPageProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onNavigateToReports?: (reportName?: string) => void;
  onNavigateToTasks?: () => void;
  onReleaseHold?: (orderId: string, remarks?: string) => void;
  taskCount?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  return <DashboardView {...props} />;
};
