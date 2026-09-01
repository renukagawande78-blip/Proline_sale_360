import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem, RoleName, NotificationCategory } from '../types';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from './AuthContext';

// Helper to resolve target roles and category based on user rules
export const resolveNotificationMeta = (
  eventType: string = '',
  title: string = '',
  message: string = '',
  brandName?: string
): { target_roles: RoleName[]; category: NotificationCategory } => {
  const upper = ((eventType || '') + ' ' + (title || '') + ' ' + (message || '')).toUpperCase();

  // 1. POD Query Raised -> Super Admin & Sales Admin
  if (upper.includes('POD_QUERY') || upper.includes('POD ISSUE') || upper.includes('DELIVERY EXCEPTION')) {
    return { target_roles: ['SUPER_ADMIN', 'SALES_ADMIN'], category: 'POD' };
  }

  // 2. POD Verified / Delivered -> Salesperson, Sales Admin, Accounts, Super Admin
  if (upper.includes('POD_VERIFIED') || upper.includes('DELIVERED') || upper.includes('POD VERIF') || upper.includes('ORDER_COMPLETED')) {
    return { target_roles: ['SALES_PERSON', 'SALES_ADMIN', 'ACCOUNTS', 'SUPER_ADMIN'], category: 'POD' };
  }

  // 3. Wait for Stock -> Sales Person, Area Sales Manager, Sales Admin
  if (upper.includes('WAIT_FOR_STOCK') || upper.includes('WAIT FOR STOCK') || upper.includes('STOCK UNAVAILABLE') || upper.includes('STOCK SHORTAGE')) {
    return { target_roles: ['SALES_PERSON', 'AREA_SALES_MANAGER', 'SALES_ADMIN', 'SUPER_ADMIN'], category: 'INVENTORY' };
  }

  // 4. Reattempt Delivery -> Dispatch Manager, Sales Admin, Super Admin
  if (upper.includes('REATTEMPT_DELIVERY') || upper.includes('REATTEMPT DELIVERY') || upper.includes('REATTEMPT')) {
    return { target_roles: ['DISPATCH_MANAGER', 'SALES_ADMIN', 'SUPER_ADMIN'], category: 'DISPATCH' };
  }

  // 5. GRN Checked / Forwarded / Created -> Accounts, Billing, Sales Admin
  if (upper.includes('GRN_') || upper.includes('GRN REQUEST') || upper.includes('GRN FORWARD') || upper.includes('GRN CREATED')) {
    return { target_roles: ['ACCOUNTS', 'BILLING', 'SALES_ADMIN', 'SUPER_ADMIN'], category: 'BILLING' };
  }

  // 6. Dispatched / Out for Delivery -> Sales Person, Sales Admin, Dispatch Manager
  if (upper.includes('DISPATCH') || upper.includes('OUT_FOR_DELIVERY') || upper.includes('OUT FOR DELIVERY') || upper.includes('READY_FOR_PICKUP')) {
    return { target_roles: ['SALES_PERSON', 'SALES_ADMIN', 'DISPATCH_MANAGER', 'SUPER_ADMIN'], category: 'DISPATCH' };
  }

  // 7. Review Notification / Super Admin Approval -> Super Admin
  if (upper.includes('ACCOUNTS_APPROVAL') || upper.includes('SUPER ADMIN APPROVAL') || upper.includes('REVIEW REQUIRED') || upper.includes('HARSHAD SIR')) {
    return { target_roles: ['SUPER_ADMIN'], category: 'APPROVAL' };
  }

  // 8. Order Created / Submitted -> Sales Admin, Super Admin
  if (upper.includes('ORDER_SUBMITTED') || upper.includes('ORDER_CREATED') || upper.includes('NEW ORDER')) {
    return { target_roles: ['SALES_ADMIN', 'SUPER_ADMIN'], category: 'ORDER' };
  }

  // Default fallback
  return { target_roles: ['SUPER_ADMIN', 'SALES_ADMIN'], category: 'SYSTEM' };
};

export const getRoleBadge = (role?: RoleName | string): { label: string; color: string; bg: string } => {
  if (!role) {
    return { label: 'General', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
  switch (role) {
    case 'SUPER_ADMIN':
      return { label: '🛡️ Super Admin', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    case 'SALES_ADMIN':
      return { label: '📋 Sales Admin', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    case 'SALES_PERSON':
      return { label: '👤 Salesperson', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' };
    case 'AREA_SALES_MANAGER':
      return { label: '👔 ASM', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
    case 'DISPATCH_MANAGER':
      return { label: '🚚 Dispatch', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    case 'ACCOUNTS':
      return { label: '🧾 Accounts', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' };
    case 'BILLING':
      return { label: '💳 Billing', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' };
    default:
      return { label: String(role), color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
};

export const getCategoryBadge = (category?: NotificationCategory): { label: string; color: string; bg: string } => {
  switch (category) {
    case 'ORDER':
      return { label: '📦 Order', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
    case 'APPROVAL':
      return { label: '🔒 Approval', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' };
    case 'INVENTORY':
      return { label: '⏳ Stock', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
    case 'DISPATCH':
      return { label: '🚚 Dispatch', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
    case 'BILLING':
      return { label: '🧾 Billing & GRN', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
    case 'POD':
      return { label: '📑 POD', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
    default:
      return { label: '🔔 Notice', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
  }
};

export const isNotificationForUser = (notification: NotificationItem, userRole?: RoleName): boolean => {
  if (!userRole) return true;
  if (userRole === 'SUPER_ADMIN') return true;
  if (!notification.target_roles || notification.target_roles.length === 0) return true;
  return notification.target_roles.includes(userRole);
};

export interface NotificationContextType {
  notifications: NotificationItem[];
  filteredNotifications: NotificationItem[];
  unreadCount: number;
  activeToast: NotificationItem | null;
  dismissToast: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  sendTestNotification: () => void;
  fcmToken?: string;
  roleFilter: 'MY_ROLE' | 'ALL' | RoleName;
  setRoleFilter: (role: 'MY_ROLE' | 'ALL' | RoleName) => void;
  categoryFilter: 'ALL' | NotificationCategory;
  setCategoryFilter: (cat: 'ALL' | NotificationCategory) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n_init_1',
    title: '📦 New Order Created: OR-30082026-961',
    message: 'B2B order booked for Orion Snacks (40 Boxes, 2,400 PCS). Sales Admin alerted for stock review.',
    event_type: 'ORDER_SUBMITTED',
    order_id: '735fc14a-86ae-47cf-8e14-f9fe20690b39',
    is_read: false,
    created_at: '5 mins ago',
    target_roles: ['SALES_ADMIN', 'SUPER_ADMIN'],
    category: 'ORDER',
    brand_name: 'Orion'
  },
  {
    id: 'n_init_2',
    title: '🔒 Super Admin Review Required: PR-24082026-921',
    message: 'Agency credit limit exceeded by ₹25,000. Super Admin approval requested by Sales Admin.',
    event_type: 'ACCOUNTS_APPROVAL_REQUESTED',
    order_id: '4a894d5d-dbd6-486d-9d54-40e3719f44d7',
    is_read: false,
    created_at: '15 mins ago',
    target_roles: ['SUPER_ADMIN'],
    category: 'APPROVAL',
    brand_name: 'Priyagold'
  },
  {
    id: 'n_init_3',
    title: '⏳ Wait for Stock Alert: PG-30082026-237',
    message: 'Physical stock insufficient at warehouse. Notification sent to Salesperson: Rahul Verma.',
    event_type: 'WAIT_FOR_STOCK',
    order_id: 'ae7a857f-2956-4391-b776-6b91a3f6d7a8',
    is_read: false,
    created_at: '25 mins ago',
    target_roles: ['SALES_PERSON', 'AREA_SALES_MANAGER', 'SALES_ADMIN', 'SUPER_ADMIN'],
    category: 'INVENTORY',
    brand_name: 'Priyagold'
  },
  {
    id: 'n_init_4',
    title: '🚨 POD Query Raised: PG-30082026-892',
    message: 'Damaged cartons reported during delivery. Super Admin decision required for GRN or Reattempt.',
    event_type: 'POD_QUERY_RAISED',
    order_id: 'ffc87322-b398-4c9d-b759-60d6a7ca079d',
    is_read: false,
    created_at: '35 mins ago',
    target_roles: ['SUPER_ADMIN', 'SALES_ADMIN'],
    category: 'POD',
    brand_name: 'Priyagold'
  },
  {
    id: 'n_init_5',
    title: '🔄 Reattempt Delivery Scheduled: PG-30082026-892',
    message: 'Sales Admin resolved exception with Reattempt Delivery. HIGH PRIORITY assigned to Dispatch Team.',
    event_type: 'REATTEMPT_DELIVERY',
    order_id: 'ffc87322-b398-4c9d-b759-60d6a7ca079d',
    is_read: false,
    created_at: '45 mins ago',
    target_roles: ['DISPATCH_MANAGER', 'SALES_ADMIN', 'SUPER_ADMIN'],
    category: 'DISPATCH',
    brand_name: 'Priyagold'
  },
  {
    id: 'n_init_6',
    title: '📋 GRN Created: GRN-2026-104',
    message: 'Accounts team entered GRN for ₹4,200 return adjustment. Sales Admin can close the exception.',
    event_type: 'GRN_CREATED',
    order_id: 'd4444444-4444-4444-a444-444444444444',
    is_read: false,
    created_at: '1 hour ago',
    target_roles: ['ACCOUNTS', 'BILLING', 'SALES_ADMIN', 'SUPER_ADMIN'],
    category: 'BILLING',
    brand_name: 'Maggi'
  },
  {
    id: 'n_init_7',
    title: '🚚 Out for Delivery: HL-22082026-101',
    message: 'Vehicle GJ-05-AB-1234 departed warehouse bay. Tax Invoice INV-2026-101 attached.',
    event_type: 'ORDER_OUT_FOR_DELIVERY',
    order_id: 'd1111111-1111-4111-a111-111111111111',
    is_read: false,
    created_at: '2 hours ago',
    target_roles: ['SALES_PERSON', 'SALES_ADMIN', 'DISPATCH_MANAGER', 'SUPER_ADMIN'],
    category: 'DISPATCH',
    brand_name: 'Haldiram'
  },
  {
    id: 'n_init_8',
    title: '✅ POD Verified & Order Completed: OR-30082026-645',
    message: 'Clean POD received with store stamp & signature. Salesperson commission targets credited.',
    event_type: 'POD_VERIFIED',
    order_id: '4228a111-bc10-4220-be4f-1c756cfafa65',
    is_read: false,
    created_at: '3 hours ago',
    target_roles: ['SALES_PERSON', 'SALES_ADMIN', 'ACCOUNTS', 'SUPER_ADMIN'],
    category: 'POD',
    brand_name: 'Orion'
  }
];

// Audio chime using Web Audio API
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const cached = localStorage.getItem('proline_oms_notifications_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const [roleFilter, setRoleFilter] = useState<'MY_ROLE' | 'ALL' | RoleName>('MY_ROLE');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | NotificationCategory>('ALL');
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [fcmToken, setFcmToken] = useState<string | undefined>(undefined);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('proline_oms_notifications_v2', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Native Push Notification channel and permissions
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.createChannel({
        id: 'proline_orders',
        name: 'Proline OMS Orders',
        description: 'Real-time sales, order approval, and dispatch notifications',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#38bdf8'
      }).catch(err => {
        console.warn('Channel creation error:', err);
      });

      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      }).catch(err => {
        console.warn('Push notification permissions error:', err);
      });

      const regListener = PushNotifications.addListener('registration', token => {
        console.log('Firebase Push Notification Registration Token:', token.value);
        setFcmToken(token.value);
      });

      const errListener = PushNotifications.addListener('registrationError', err => {
        console.error('Firebase Push Registration Error:', err);
      });

      const pushListener = PushNotifications.addListener('pushNotificationReceived', notification => {
        const title = notification.title || 'Proline OMS Alert';
        const body = notification.body || '';
        const meta = resolveNotificationMeta('PUSH_EVENT', title, body);

        const newItem: NotificationItem = {
          id: 'push_' + Date.now(),
          title,
          message: body,
          event_type: 'PUSH_EVENT',
          is_read: false,
          created_at: 'Just now',
          target_roles: meta.target_roles,
          category: meta.category
        };
        setNotifications(prev => [newItem, ...prev]);

        // Check if relevant to logged in user
        if (!currentUser || isNotificationForUser(newItem, currentUser.role_name)) {
          setActiveToast(newItem);
          playChimeSound();
        }
      });

      return () => {
        regListener.then(handle => handle.remove()).catch(() => {});
        errListener.then(handle => handle.remove()).catch(() => {});
        pushListener.then(handle => handle.remove()).catch(() => {});
      };
    } else {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    }
  }, [currentUser?.role_name]);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) => {
    // If target_roles or category are missing, automatically resolve them
    const meta = resolveNotificationMeta(item.event_type, item.title, item.message, item.brand_name);

    const newItem: NotificationItem = {
      ...item,
      id: 'n_' + Date.now(),
      is_read: false,
      created_at: 'Just now',
      target_roles: item.target_roles && item.target_roles.length > 0 ? item.target_roles : meta.target_roles,
      category: item.category || meta.category
    };

    setNotifications(prev => [newItem, ...prev]);

    // Check if notification is meant for current user's role (Super Admin always gets it)
    const isRelevant = !currentUser || isNotificationForUser(newItem, currentUser.role_name);

    if (isRelevant) {
      setActiveToast(newItem);
      playChimeSound();

      setTimeout(() => {
        setActiveToast(current => (current?.id === newItem.id ? null : current));
      }, 6500);

      // Browser Web Notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(item.title, {
            body: item.message,
            icon: '/prokap-badge.png'
          });
        } catch {}
      }
    }
  };

  const sendTestNotification = () => {
    const roles: RoleName[] = ['SALES_ADMIN', 'SUPER_ADMIN', 'SALES_PERSON', 'DISPATCH_MANAGER', 'ACCOUNTS'];
    const currentRole = currentUser?.role_name || 'SALES_ADMIN';
    const testOrderNum = `PRL-${Math.floor(1000 + Math.random() * 9000)}`;

    if (currentRole === 'SALES_ADMIN') {
      addNotification({
        title: `📦 Order Created: ${testOrderNum}`,
        message: `New FMCG booking received for Priyagold Agency. Assigned to Sales Admin review.`,
        event_type: 'ORDER_SUBMITTED',
        target_roles: ['SALES_ADMIN', 'SUPER_ADMIN'],
        category: 'ORDER'
      });
    } else if (currentRole === 'SUPER_ADMIN') {
      addNotification({
        title: `🚨 POD Query Raised: ${testOrderNum}`,
        message: `Delivery exception reported by driver. Super Admin action required.`,
        event_type: 'POD_QUERY_RAISED',
        target_roles: ['SUPER_ADMIN'],
        category: 'POD'
      });
    } else if (currentRole === 'SALES_PERSON') {
      addNotification({
        title: `⏳ Wait for Stock: ${testOrderNum}`,
        message: `Warehouse stock unavailable. Your booking is on hold pending inventory replenishment.`,
        event_type: 'WAIT_FOR_STOCK',
        target_roles: ['SALES_PERSON', 'SALES_ADMIN'],
        category: 'INVENTORY'
      });
    } else if (currentRole === 'DISPATCH_MANAGER') {
      addNotification({
        title: `🔄 Reattempt Delivery: ${testOrderNum}`,
        message: `Sales Admin authorized delivery reattempt with HIGH PRIORITY dispatch.`,
        event_type: 'REATTEMPT_DELIVERY',
        target_roles: ['DISPATCH_MANAGER', 'SALES_ADMIN'],
        category: 'DISPATCH'
      });
    } else {
      addNotification({
        title: `📋 GRN Checked & Approved: ${testOrderNum}`,
        message: `Accounts team verified credit note adjustment for return items.`,
        event_type: 'GRN_CREATED',
        target_roles: ['ACCOUNTS', 'BILLING', 'SALES_ADMIN'],
        category: 'BILLING'
      });
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
    setActiveToast(null);
  };

  // Filter notifications according to roleFilter & categoryFilter
  const filteredNotifications = notifications.filter(n => {
    // 1. Role Filter
    if (roleFilter === 'MY_ROLE') {
      if (currentUser && !isNotificationForUser(n, currentUser.role_name)) return false;
    } else if (roleFilter !== 'ALL') {
      if (!n.target_roles || !n.target_roles.includes(roleFilter)) return false;
    }

    // 2. Category Filter
    if (categoryFilter !== 'ALL') {
      if (n.category !== categoryFilter) return false;
    }

    return true;
  });

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      filteredNotifications,
      unreadCount, 
      activeToast, 
      dismissToast, 
      addNotification, 
      markAsRead, 
      clearAll, 
      sendTestNotification, 
      fcmToken,
      roleFilter,
      setRoleFilter,
      categoryFilter,
      setCategoryFilter
    }}>
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
