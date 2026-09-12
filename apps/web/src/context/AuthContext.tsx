import React, { createContext, useContext, useState, useEffect } from 'react';
import { RoleName, User, PermissionControl, PermissionGroup } from '../types';
import { supabase, deduplicateUsers, saveUserToSupabase, updateUserFcmToken } from '../lib/supabase';

export const getDefaultPermissions = (role: RoleName): PermissionControl => {
  if (role === 'SUPER_ADMIN' || role === 'ACCOUNTS') {
    return {
      add_order: true,
      view_order: true,
      cancel_order: true,
      delete_order: true,
      order_entry: true,
      party_view: true,
      new_party: true,
      product_mgmt: true,
      order_transfer_to_billing: true,
      order_status_dashboard_all: true,
      company_order_status_dashboard: true,
      company_order_form: true,
      order_transfer_to_dispatch: true,
      order_transfer_out_for_delivery: true,
      pod_verification: true,
      user_authority: true
    };
  }

  if (role === 'SALES_ADMIN') {
    return {
      add_order: true,
      view_order: true,
      cancel_order: true,
      delete_order: false,
      order_entry: true,
      party_view: true,
      new_party: true,
      product_mgmt: true,
      order_transfer_to_billing: true,
      order_status_dashboard_all: true,
      company_order_status_dashboard: true,
      company_order_form: true,
      order_transfer_to_dispatch: true,
      order_transfer_out_for_delivery: false,
      pod_verification: false,
      user_authority: false
    };
  }

  if (role === 'BILLING') {
    return {
      add_order: false,
      view_order: true,
      cancel_order: false,
      delete_order: false,
      order_entry: false,
      party_view: true,
      new_party: false,
      product_mgmt: false,
      order_transfer_to_billing: true,
      order_status_dashboard_all: true,
      company_order_status_dashboard: true,
      company_order_form: false,
      order_transfer_to_dispatch: true,
      order_transfer_out_for_delivery: false,
      pod_verification: true,
      user_authority: false
    };
  }

  if (role === 'DISPATCH_MANAGER') {
    return {
      add_order: false,
      view_order: true,
      cancel_order: false,
      delete_order: false,
      order_entry: false,
      party_view: true,
      new_party: false,
      product_mgmt: false,
      order_transfer_to_billing: false,
      order_status_dashboard_all: true,
      company_order_status_dashboard: true,
      company_order_form: false,
      order_transfer_to_dispatch: true,
      order_transfer_out_for_delivery: true,
      pod_verification: false,
      user_authority: false
    };
  }

  if (role === 'AREA_SALES_MANAGER') {
    return {
      add_order: true,
      view_order: true,
      cancel_order: true,
      delete_order: false,
      order_entry: true,
      party_view: true,
      new_party: false,
      product_mgmt: false,
      order_transfer_to_billing: false,
      order_status_dashboard_all: false,
      company_order_status_dashboard: true,
      company_order_form: true,
      order_transfer_to_dispatch: false,
      order_transfer_out_for_delivery: false,
      pod_verification: false,
      user_authority: false
    };
  }

  // DEFAULT SALES_PERSON
  return {
    add_order: true,
    view_order: true,
    cancel_order: true,
    delete_order: false,
    order_entry: true,
    party_view: true,
    new_party: false,
    product_mgmt: false,
    order_transfer_to_billing: false,
    order_status_dashboard_all: false,
    company_order_status_dashboard: true,
    company_order_form: true,
    order_transfer_to_dispatch: false,
    order_transfer_out_for_delivery: false,
    pod_verification: false,
    user_authority: false
  };
};

export const INITIAL_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'pg_admin',
    group_name: 'Full Super Admin Authority',
    description: 'Complete system access: Add, View, Cancel, Delete Orders, User & Master Authority',
    is_system: true,
    permissions: getDefaultPermissions('SUPER_ADMIN')
  },
  {
    id: 'pg_accounts',
    group_name: 'Accounts Authority Group',
    description: 'All Reports & Periodic Matrices, B2B Billing, Outstanding & Collections, Order View & Controls',
    is_system: true,
    permissions: getDefaultPermissions('ACCOUNTS')
  },
  {
    id: 'pg_sales_admin',
    group_name: 'Sales Admin Authority Group',
    description: 'Order Entry, New Party, New Product, Order Transfer to Billing, Status Dashboard & Reports',
    is_system: true,
    permissions: getDefaultPermissions('SALES_ADMIN')
  },
  {
    id: 'pg_billing',
    group_name: 'Billing Operations Group',
    description: 'Order Status Dashboard, Order Transfer to Dispatch, POD Verification & Reports',
    is_system: true,
    permissions: getDefaultPermissions('BILLING')
  },
  {
    id: 'pg_dispatch',
    group_name: 'Dispatch Operations Group',
    description: 'Zonewise Order Display, Order Transfer Out for Delivery, Vehicle-wise Dispatch, POD Queue',
    is_system: true,
    permissions: getDefaultPermissions('DISPATCH_MANAGER')
  },
  {
    id: 'pg_asm',
    group_name: 'Area Sales Manager (ASM) Group',
    description: 'Aligned Company Order Status Dashboard & Reports Dashboard',
    is_system: true,
    permissions: getDefaultPermissions('AREA_SALES_MANAGER')
  },
  {
    id: 'pg_sales_person',
    group_name: 'Field Sales Manager / Sales Person Group',
    description: 'Aligned Company Order Form, Order Status Dashboard & Reports',
    is_system: true,
    permissions: getDefaultPermissions('SALES_PERSON')
  }
];

export const SEED_USERS: User[] = [
  // 1. Super Admin (Chirag)
  { sno: 1, id: 'u01', full_name: 'Chirag', email: 'chirag@proline.com', role_name: 'SUPER_ADMIN', permission_group_id: 'pg_admin', permission_group_name: 'Full Super Admin Authority', company_handle: 'All', password: '0706', active: true },
  
  // 2. Accounts (Harshad)
  { sno: 2, id: 'u02', full_name: 'Harshad', email: 'harshad@proline.com', role_name: 'ACCOUNTS', permission_group_id: 'pg_accounts', permission_group_name: 'Accounts Authority Group', company_handle: 'All', password: '2209', active: true },
  
  // 3–5. Sales Admin
  { sno: 3, id: 'u_jay', full_name: 'Jay', email: 'jay@proline.com', role_name: 'SALES_ADMIN', permission_group_id: 'pg_sales_admin', permission_group_name: 'Sales Admin Authority Group', company_handle: 'Priyagold, RCPL, Orion, Gandour, HPPL', password: '5442', active: true },
  { sno: 4, id: 'u_dixit', full_name: 'Dixit', email: 'dixit@proline.com', role_name: 'SALES_ADMIN', permission_group_id: 'pg_sales_admin', permission_group_name: 'Sales Admin Authority Group', company_handle: 'Hell, Waiwai, PRAN, Mogu mogu', password: '1234', active: true },
  { sno: 5, id: 'u_sumit', full_name: 'Sumit', email: 'sumit@proline.com', role_name: 'SALES_ADMIN', permission_group_id: 'pg_sales_admin', permission_group_name: 'Sales Admin Authority Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '3344', active: true },
  
  // 6–8. Billing
  { sno: 6, id: 'u_riddhi', full_name: 'Riddhi', email: 'riddhi@proline.com', role_name: 'BILLING', permission_group_id: 'pg_billing', permission_group_name: 'Billing Operations Group', company_handle: 'Priyagold, RCPL, Orion, Gandour, HPPL', password: '3553', active: true },
  { sno: 7, id: 'u_mansi', full_name: 'Mansi', email: 'mansi@proline.com', role_name: 'BILLING', permission_group_id: 'pg_billing', permission_group_name: 'Billing Operations Group', company_handle: 'Hell, Waiwai, PRAN, Mogu mogu', password: '4100', active: true },
  { sno: 8, id: 'u_sneha', full_name: 'Sneha', email: 'sneha@proline.com', role_name: 'BILLING', permission_group_id: 'pg_billing', permission_group_name: 'Billing Operations Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '5705', active: true },
  
  // 9–11. Dispatch Manager
  { sno: 9, id: 'u_dhruv', full_name: 'Dhruv', email: 'dhruv@proline.com', role_name: 'DISPATCH_MANAGER', permission_group_id: 'pg_dispatch', permission_group_name: 'Dispatch Operations Group', company_handle: 'All', password: '1234', active: true },
  { sno: 10, id: 'u_dharmik', full_name: 'Dharmik', email: 'dharmik@proline.com', role_name: 'DISPATCH_MANAGER', permission_group_id: 'pg_dispatch', permission_group_name: 'Dispatch Operations Group', company_handle: 'All', password: '1234', active: true },
  { sno: 11, id: 'u_jitendra', full_name: 'Jitendra', email: 'jitendra@proline.com', role_name: 'DISPATCH_MANAGER', permission_group_id: 'pg_dispatch', permission_group_name: 'Dispatch Operations Group', company_handle: 'All', password: '1960', active: true },
  
  // 12–21. Area Sales Managers (10 ASMs)
  { sno: 12, id: 'u_asm_brijesh', full_name: 'Brijesh', email: 'brijesh@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Whirlpool', password: '1234', active: true },
  { sno: 13, id: 'u_asm_kamal', full_name: 'Kamal', email: 'kamal@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Cruise', password: '1234', active: true },
  { sno: 14, id: 'u_asm_shashi', full_name: 'Shashi', email: 'shashi@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Priyagold', password: '1234', active: true },
  { sno: 15, id: 'u_asm_ankit', full_name: 'Ankit', email: 'ankit@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Orion', password: '1234', active: true },
  { sno: 16, id: 'u_asm_tushar', full_name: 'Tushar', email: 'tushar@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Waiwai', password: '1234', active: true },
  { sno: 17, id: 'u_asm_shakti', full_name: 'Shakti', email: 'shakti@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'PRAN', password: '1234', active: true },
  { sno: 18, id: 'u_asm_sanjay', full_name: 'Sanjay', email: 'sanjay@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'HPPL', password: '1234', active: true },
  { sno: 19, id: 'u_asm_keyur', full_name: 'Keyur (KK)', email: 'keyur_kk@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Hell', password: '1234', active: true },
  { sno: 20, id: 'u_asm_jagrut', full_name: 'Jagrut', email: 'jagrut@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Daikin', password: '1234', active: true },
  { sno: 21, id: 'u_asm_dinesh', full_name: 'Dinesh', email: 'dinesh@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager (ASM) Group', company_handle: 'Akai', password: '1234', active: true },
  
  // 22–34. Field Sales Managers / Sales Persons (13 FSMs)
  { sno: 22, id: 'u_fsm_keyur', full_name: 'Keyur', email: 'keyur@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Hell', password: '4380', active: true },
  { sno: 23, id: 'u_fsm_shailendra', full_name: 'Shailendra', email: 'shailendra@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Orion', password: '1234', active: true },
  { sno: 24, id: 'u_fsm_jayendra', full_name: 'Jayendra', email: 'jayendra@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Waiwai', password: '1234', active: true },
  { sno: 25, id: 'u_fsm_nikhil', full_name: 'Nikhil', email: 'nikhil@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Priyagold', password: '1234', active: true },
  { sno: 26, id: 'u_fsm_jay', full_name: 'Jay', email: 'jay_sales@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Gandour', password: '1234', active: true },
  { sno: 27, id: 'u_fsm_sahil', full_name: 'Sahil', email: 'sahil@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'HPPL', password: '1234', active: true },
  { sno: 28, id: 'u_fsm_milan', full_name: 'Milan', email: 'milan@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'PRAN', password: '1234', active: true },
  { sno: 29, id: 'u_fsm_rahul', full_name: 'Rahul', email: 'rahul@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Mogu mogu', password: '1234', active: true },
  { sno: 30, id: 'u_fsm_sagar', full_name: 'Sagar', email: 'sagar@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'RCPL', password: '1234', active: true },
  { sno: 31, id: 'u_fsm_taral', full_name: 'Taral', email: 'taral@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Daikin', password: '1234', active: true },
  { sno: 32, id: 'u_fsm_pinkle', full_name: 'Pinkle', email: 'pinkle@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '1670', active: true },
  { sno: 33, id: 'u_fsm_lalit', full_name: 'Lalit', email: 'lalit@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '1234', active: true },
  { sno: 34, id: 'u_fsm_kano', full_name: 'Kano', email: 'kano@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Field Sales Manager / Sales Person Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '1030', active: true }
];



const INITIAL_USERS: User[] = SEED_USERS.map(u => ({
  ...u,
  permissions: getDefaultPermissions(u.role_name)
}));

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  permissionGroups: PermissionGroup[];
  login: (emailOrName: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: RoleName) => void;
  switchUserById: (userId: string) => void;
  createUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
  updateUserPermissions: (userId: string, newPermissions: PermissionControl) => void;
  assignUserPermissionGroup: (userId: string, groupId: string) => void;
  addPermissionGroup: (group: Omit<PermissionGroup, 'id'>) => void;
  updatePermissionGroup: (groupId: string, updated: Partial<PermissionGroup>) => void;
  hasPermission: (key: keyof PermissionControl) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(INITIAL_PERMISSION_GROUPS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load live users from Supabase cloud database (supports 'users' & 'system_users' tables)
  useEffect(() => {
    async function loadUsersFromSupabase() {
      try {
        let { data, error } = await supabase.from('users').select('*');
        if (error || !data || data.length === 0) {
          const sysRes = await supabase.from('system_users').select('*');
          data = sysRes.data;
          error = sysRes.error;
        }

        if (data && data.length > 0 && !error) {
          const mappedUsers: User[] = data
            .filter((u: any) => u.active !== false)
            .map((u: any, idx: number) => ({
              sno: u.sno || idx + 1,
              id: String(u.id || `u_${idx + 1}`),
              full_name: u.full_name || u.name || u.user_name || 'System User',
              email: u.email || `${u.id}@proline.com`,
              phone: u.phone || u.mobile || '',
              role_name: (u.role_name || u.role || 'SALES_PERSON') as RoleName,
              permission_group_id: u.permission_group_id || 'pg_sales_person',
              permission_group_name: u.permission_group_name || 'Sales Person Group',
              company_handle: (() => {
                const handle = u.company_handle || u.brand_scope || '';
                const role = (u.role_name || u.role || '').toUpperCase();
                // Super Admins with no handle → All; others keep their handle (empty = restrict)
                if (!handle && (role === 'SUPER_ADMIN' || (u.full_name || '').toLowerCase().includes('chirag') || (u.full_name || '').toLowerCase().includes('harshad'))) return 'All';
                return handle;
              })(),
              password: u.password ? String(u.password).trim() : '1234',
              active: u.active ?? true,
              permissions: getDefaultPermissions((u.role_name || u.role || 'SALES_PERSON') as RoleName)
            }))
            .sort((a, b) => (a.sno || 0) - (b.sno || 0));

          if (mappedUsers.length > 0) {
            setUsers(deduplicateUsers(mappedUsers));
          }
          if (currentUser) {
            const updatedSelf = mappedUsers.find(mu => mu.id === currentUser.id || mu.email === currentUser.email);
            if (updatedSelf) setCurrentUser(updatedSelf);
          }
        }
      } catch (err) {
        console.warn('Supabase users table fetch notice:', err);
      }
    }
    loadUsersFromSupabase();
  }, []);

  const login = async (emailOrName: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    const cleanInput = (emailOrName || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanInput) {
      return { success: false, error: 'Please enter a Person Name, User ID, or Email.' };
    }

    // Require password input
    if (!cleanPass) {
      return { success: false, error: 'Please enter your password or 1234.' };
    }

    const matchUser = (userList: User[], input: string): User | undefined => {
      const clean = (input || '').trim().toLowerCase();
      if (!clean) return undefined;

      // 1. Priority 1: Exact match on email, full_name, email prefix (before @), or user id
      const exact = userList.find(u => {
        const email = (u.email || '').toLowerCase().trim();
        const name = (u.full_name || '').toLowerCase().trim();
        const id = (u.id || '').toLowerCase().trim();
        const emailPrefix = email.split('@')[0];

        return (
          email === clean ||
          name === clean ||
          emailPrefix === clean ||
          id === clean
        );
      });
      if (exact) return exact;

      // 2. Priority 2: Normalized exact match (ignoring dots, spaces, dashes)
      const cleanNorm = clean.replace(/[^a-z0-9]/g, '');
      if (cleanNorm) {
        const normExact = userList.find(u => {
          const nameNorm = (u.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const emailPrefixNorm = (u.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameNorm === cleanNorm || emailPrefixNorm === cleanNorm;
        });
        if (normExact) return normExact;
      }

      // 3. Priority 3: Exact word / token match
      const tokenMatch = userList.find(u => {
        const nameTokens = (u.full_name || '').toLowerCase().split(/[\s._-]+/);
        return nameTokens.includes(clean);
      });
      if (tokenMatch) return tokenMatch;

      // 4. Priority 4: Prefix match on full_name or email
      const prefixMatch = userList.find(u => {
        const email = (u.email || '').toLowerCase().trim();
        const name = (u.full_name || '').toLowerCase().trim();
        const emailPrefix = email.split('@')[0];
        return name.startsWith(clean) || emailPrefix.startsWith(clean) || email.startsWith(clean);
      });
      if (prefixMatch) return prefixMatch;

      // 5. Priority 5: Substring match (ONLY if user name or email contains input; never input contains name)
      if (clean.length >= 3) {
        const containsMatch = userList.find(u => {
          const email = (u.email || '').toLowerCase().trim();
          const name = (u.full_name || '').toLowerCase().trim();
          return name.includes(clean) || email.includes(clean);
        });
        if (containsMatch) return containsMatch;
      }

      return undefined;
    };

    let targetUser = matchUser(users, cleanInput);

    // Live Query to Supabase 'users' table for latest credentials & password
    let liveDbUser: any = null;
    try {
      // 1. Direct match by exact email, full_name, or uuid in Supabase users table
      const { data: exactMatches } = await supabase
        .from('users')
        .select('*')
        .or(`email.ilike.${cleanInput},full_name.ilike.${cleanInput}`);

      if (exactMatches && exactMatches.length > 0) {
        // If multiple users match (e.g. same name), prioritize the one matching entered password
        const passMatch = exactMatches.find(u => String(u.password || '').trim() === cleanPass);
        liveDbUser = passMatch || exactMatches[0];
      } else if (targetUser?.id && targetUser.id.length > 10) {
        const res = await supabase.from('users').select('*').eq('id', targetUser.id).maybeSingle();
        liveDbUser = res.data;
      } else {
        // 2. Partial search in Supabase users table
        const { data: partialMatches } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.%${cleanInput}%,full_name.ilike.%${cleanInput}%`);
        if (partialMatches && partialMatches.length > 0) {
          const passMatch = partialMatches.find(u => String(u.password || '').trim() === cleanPass);
          liveDbUser = passMatch || partialMatches[0];
        }
      }
    } catch (err) {
      console.warn('Live Supabase user lookup notice:', err);
    }

    if (liveDbUser) {
      targetUser = {
        sno: liveDbUser.sno || targetUser?.sno || 1,
        id: liveDbUser.id,
        full_name: liveDbUser.full_name || liveDbUser.name || targetUser?.full_name || 'User',
        email: liveDbUser.email || targetUser?.email || `${liveDbUser.id}@proline.com`,
        phone: liveDbUser.phone || liveDbUser.mobile || targetUser?.phone || '',
        role_name: (liveDbUser.role_name || liveDbUser.role || targetUser?.role_name || 'SALES_PERSON') as RoleName,
        permission_group_id: liveDbUser.permission_group_id || 'pg_sales_person',
        permission_group_name: liveDbUser.permission_group_name || 'Sales Person Group',
        company_handle: liveDbUser.company_handle || liveDbUser.brand_scope || targetUser?.company_handle || 'All',
        password: String(liveDbUser.password || '').trim() || '1234',
        active: liveDbUser.active ?? true,
        permissions: getDefaultPermissions((liveDbUser.role_name || targetUser?.role_name || 'SALES_PERSON') as RoleName)
      };
    }

    if (!targetUser) {
      return { success: false, error: `User account "${emailOrName}" not found in database.` };
    }

    if (targetUser.active === false) {
      return { success: false, error: `❌ Account Suspended: The user account for "${targetUser.full_name}" is currently INACTIVE.` };
    }

    // Strict database password validation
    const expectedPassword = targetUser.password ? String(targetUser.password).trim() : '1234';
    const isPasswordValid = cleanPass === expectedPassword;

    if (!isPasswordValid) {
      return { 
        success: false, 
        error: 'Incorrect password. Please enter your valid account password.' 
      };
    }

    const userWithPerms = {
      ...targetUser,
      permissions: targetUser.permissions || getDefaultPermissions(targetUser.role_name)
    };

    setCurrentUser(userWithPerms);

    // Automatically sync FCM push notification token for the logged-in user in database
    try {
      const existingToken = typeof window !== 'undefined' ? localStorage.getItem('proline_oms_fcm_token') : null;
      if (existingToken && userWithPerms.id) {
        updateUserFcmToken(userWithPerms.id, existingToken);
      }
    } catch (_) {}

    return { success: true };
  };

  const logout = async () => {
    // Preserve device-level FCM token across user logouts so subsequent logins retain push capability
    const savedFcmToken = typeof window !== 'undefined' ? localStorage.getItem('proline_oms_fcm_token') : null;
    const savedFcmUser = typeof window !== 'undefined' ? localStorage.getItem('proline_oms_fcm_user') : null;

    // 1. Clear all localStorage — removes Supabase auth tokens + any app cache
    try { localStorage.clear(); } catch (_) {}

    // Restore device push notification token
    if (savedFcmToken) {
      try { localStorage.setItem('proline_oms_fcm_token', savedFcmToken); } catch (_) {}
    }
    if (savedFcmUser) {
      try { localStorage.setItem('proline_oms_fcm_user', savedFcmUser); } catch (_) {}
    }

    // 2. Clear sessionStorage
    try { sessionStorage.clear(); } catch (_) {}

    // 3. Sign out from Supabase (invalidates server-side session)
    try { await supabase.auth.signOut(); } catch (_) {}

    // 4. Reset user state → App.tsx guard renders <LoginPage /> immediately
    setCurrentUser(null);
  };

  const switchRole = (role: RoleName) => {
    const roleUser = users.find(u => u.role_name === role);
    if (roleUser) {
      const userWithPerms = {
        ...roleUser,
        permissions: roleUser.permissions || getDefaultPermissions(roleUser.role_name)
      };
      setCurrentUser(userWithPerms);
    }
  };

  const createUser = (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserData,
      id: 'u_' + Date.now(),
      sno: users.length + 1,
      active: newUserData.active ?? true,
      permissions: newUserData.permissions || getDefaultPermissions(newUserData.role_name)
    };
    setUsers(prev => [...prev, newUser]);

    // Live sync insert to Supabase cloud database with self-healing column detection & UUID formatting
    saveUserToSupabase(newUser).then(res => {
      if (!res.success) {
        console.warn('Supabase user creation notice:', res.error);
      }
    });
  };

  const updateUser = (userId: string, updatedData: Partial<User>) => {
    let updatedUserObj: User | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const next = { ...u, ...updatedData };
        if (updatedData.role_name && !updatedData.permissions) {
          next.permissions = getDefaultPermissions(updatedData.role_name);
        }
        updatedUserObj = next;
        return next;
      }
      return u;
    }));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
    }

    if (updatedUserObj) {
      saveUserToSupabase(updatedUserObj).then(res => {
        if (!res.success) {
          console.warn('Supabase user update notice:', res.error);
        }
      });
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null);
    }

    // Live sync delete to Supabase cloud database
    supabase.from('users').delete().eq('id', userId).then(({ error }) => {
      if (error) console.warn('Supabase users delete error:', error.message);
    });
    supabase.from('system_users').delete().eq('id', userId).then(({ error }) => {
      if (error) console.warn('Supabase system_users delete error:', error.message);
    });
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
    }

    supabase.from('users').update({ password: newPassword }).eq('id', userId).then(({ error }) => {
      if (error) console.warn('Supabase users password update error:', error.message);
    });
    supabase.from('system_users').update({ password: newPassword }).eq('id', userId).then(({ error }) => {
      if (error) console.warn('Supabase system_users password update error:', error.message);
    });
  };

  const updateUserPermissions = (userId: string, newPermissions: PermissionControl) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: newPermissions } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, permissions: newPermissions } : null);
    }
  };

  const assignUserPermissionGroup = (userId: string, groupId: string) => {
    const group = permissionGroups.find(g => g.id === groupId);
    if (!group) return;

    let updatedUserObj: User | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          permission_group_id: group.id,
          permission_group_name: group.group_name,
          permissions: { ...group.permissions }
        };
        updatedUserObj = updated;
        return updated;
      }
      return u;
    }));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        permission_group_id: group.id,
        permission_group_name: group.group_name,
        permissions: { ...group.permissions }
      } : null);
    }

    if (updatedUserObj) {
      saveUserToSupabase(updatedUserObj).then(res => {
        if (!res.success) {
          console.warn('Supabase group assignment sync notice:', res.error);
        }
      });
    }
  };

  const addPermissionGroup = (newGroupData: Omit<PermissionGroup, 'id'>) => {
    const newGroup: PermissionGroup = {
      ...newGroupData,
      id: 'pg_' + Date.now()
    };
    setPermissionGroups(prev => [...prev, newGroup]);
  };

  const updatePermissionGroup = (groupId: string, updated: Partial<PermissionGroup>) => {
    setPermissionGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const nextGroup = { ...g, ...updated };
        // Sync users assigned to this group
        setUsers(uPrev => uPrev.map(u => {
          if (u.permission_group_id === groupId) {
            return {
              ...u,
              permission_group_name: nextGroup.group_name,
              permissions: { ...nextGroup.permissions }
            };
          }
          return u;
        }));
        return nextGroup;
      }
      return g;
    }));
  };

  const hasPermission = (key: keyof PermissionControl): boolean => {
    if (!currentUser) return false;
    // Super Admin always has all permissions
    const role = currentUser.role_name;
    if (role === 'SUPER_ADMIN' || (currentUser.full_name || '').toLowerCase().includes('chirag') || (currentUser.full_name || '').toLowerCase().includes('harshad')) {
      return true;
    }
    // BILLING and ACCOUNTS always have pod_verification
    if (key === 'pod_verification' && (role === 'BILLING' || role === 'ACCOUNTS')) {
      return true;
    }
    const targetKey = key === 'order_entry' ? 'add_order' : key;
    const perms = currentUser.permissions || getDefaultPermissions(currentUser.role_name);
    return !!perms[targetKey];
  };

  const switchUserById = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const userWithPerms = {
        ...targetUser,
        permissions: targetUser.permissions || getDefaultPermissions(targetUser.role_name)
      };
      setCurrentUser(userWithPerms);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      users, 
      permissionGroups,
      login, 
      logout, 
      switchRole, 
      switchUserById,
      createUser,
      updateUser,
      deleteUser,
      updateUserPassword, 
      updateUserPermissions, 
      assignUserPermissionGroup,
      addPermissionGroup,
      updatePermissionGroup,
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
