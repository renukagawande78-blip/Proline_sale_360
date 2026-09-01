import React from 'react';
import { AccountsView } from '../modules/accounts/AccountsView';
import { Order } from '../types';

interface AccountsPageProps {
  orders: Order[];
  onGenerateInvoice?: (order: Order, invoiceNumber: string, billingTotalQty: number, invoiceAmount: number, creditDays: number, remark: string, billedQtyByItem: Record<string, number>) => void;
  onCompleteGrn?: (orderId: string, grnNumber: string, grnDate: string, grnValue: number, grnRemark: string) => void;
  onViewInvoice?: (order: Order) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = (props) => {
  return <AccountsView {...props} />;
};
