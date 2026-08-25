import React from 'react';
import { OrdersView } from '../modules/orders/OrdersView';
import { Order } from '../types';

interface OrdersPageProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onOpenEditOrder?: (order: Order) => void;
  onSelectOrderForApproval: (order: Order) => void;
  onApprove?: (orderId: string, remarks: string, details?: any) => void;
  onHold?: (orderId: string, reasonId: string, remarks: string) => void;
  onReject?: (orderId: string, remarks: string) => void;
  onViewInvoice?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onOpenReturnRequestModal?: (order: Order) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = (props) => {
  return <OrdersView {...props} />;
};
