import React from 'react';
import { AccountsView } from '../modules/accounts/AccountsView';
import { Order } from '../types';

interface AccountsPageProps {
  orders: Order[];
  onGenerateInvoice?: (orderId: string, invoiceNumber: string, invoiceAmount: number) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = (props) => {
  return <AccountsView {...props} />;
};
