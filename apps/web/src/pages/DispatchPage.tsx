import React from 'react';
import { DispatchView } from '../modules/dispatch/DispatchView';
import { Order, Agency } from '../types';

interface DispatchPageProps {
  orders: Order[];
  agencies?: Agency[];
  onOpenDispatchModal: (order: Order) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: any) => void;
  onOpenProcessReturnModal?: (order: Order) => void;
  onOpenPODModal?: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
}

export const DispatchPage: React.FC<DispatchPageProps> = (props) => {
  return <DispatchView {...props} />;
};
