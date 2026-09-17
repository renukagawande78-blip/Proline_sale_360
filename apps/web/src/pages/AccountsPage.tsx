import React from 'react';
import { AccountsView } from '../modules/accounts/AccountsView';
import { Order, Agency } from '../types';

interface AccountsPageProps {
  orders: Order[];
  agencies?: Agency[];
  onGenerateInvoice?: (order: Order, invoiceNumber: string, billingTotalQty: number, invoiceAmount: number, creditDays: number, remark: string, billedQtyByItem: Record<string, number>) => void;
  onCompleteGrn?: (orderId: string, grnNumber: string, grnDate: string, grnValue: number, grnRemark: string) => void;
  onReattemptDelivery?: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = (props) => {
  return <AccountsView {...props} />;
};

