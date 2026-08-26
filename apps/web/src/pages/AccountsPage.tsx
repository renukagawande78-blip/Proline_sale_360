import React from 'react';
import { AccountsView } from '../modules/accounts/AccountsView';
import { Order } from '../types';

interface AccountsPageProps {
  orders: Order[];
  onGenerateInvoice?: (order: Order, invoiceNumber: string, invoiceAmount: number, creditDays: number, remark: string, issuedQtyByItem: Record<string, number>) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = (props) => {
  return <AccountsView {...props} />;
};
