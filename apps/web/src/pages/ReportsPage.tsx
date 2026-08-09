import React from 'react';
import { ReportsView } from '../modules/reports/ReportsView';
import { Order } from '../types';

interface ReportsPageProps {
  orders: Order[];
}

export const ReportsPage: React.FC<ReportsPageProps> = (props) => {
  return <ReportsView {...props} />;
};
