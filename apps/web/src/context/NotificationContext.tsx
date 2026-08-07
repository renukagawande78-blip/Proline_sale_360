import React, { createContext, useContext, useState } from 'react';
import { NotificationItem } from '../types';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) => void;
  markAsRead: (id: string) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Order Submitted: PRL-2026-001054',
    message: 'Krishna Trading Agency - Created by Amit Kumar. Waiting for Account Check.',
    event_type: 'ORDER_SUBMITTED',
    order_id: 'o1111111-1111-1111-1111-111111111111',
    is_read: false,
    created_at: '10 mins ago'
  },
  {
    id: 'n2',
    title: 'Order Approved: PRL-2026-001055',
    message: 'Apex Distributors Pvt Ltd - Approved by Vikram Malhotra. Sent to Dispatch Queue.',
    event_type: 'ORDER_APPROVED',
    order_id: 'o2222222-2222-2222-2222-222222222222',
    is_read: false,
    created_at: '1 hour ago'
  }
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: 'n_' + Date.now(),
      is_read: false,
      created_at: 'Just now'
    };
    setNotifications(prev => [newItem, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
