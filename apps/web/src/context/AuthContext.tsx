import React, { createContext, useContext, useState, useEffect } from 'react';
import { RoleName, User, PermissionControl, PermissionGroup } from '../types';
import { supabase } from '../lib/supabase';

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
      pod_verification: true,
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
      pod_verification: true,
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
    id: 'pg_sales_admin',
    group_name: 'Sales Admin Authority Group',
    description: 'Add Order, View Order, Cancel Order, Transfer to Billing & Dispatch (No Delete)',
    is_system: true,
    permissions: getDefaultPermissions('SALES_ADMIN')
  },
  {
    id: 'pg_sales_person',
    group_name: 'Sales Person / Field Sales Group',
    description: 'Add Order, View Order, Cancel Order, Company Form (No Delete Access)',
    is_system: true,
    permissions: getDefaultPermissions('SALES_PERSON')
  },
  {
    id: 'pg_billing',
    group_name: 'Billing & Accounts Group',
    description: 'View Orders, Transfer to Billing & Dispatch, POD Verification (No Delete Access)',
    is_system: true,
    permissions: getDefaultPermissions('BILLING')
  },
  {
    id: 'pg_dispatch',
    group_name: 'Dispatch Operations Group',
    description: 'View Orders, Transfer Out For Delivery, Vehicle Assignment (No Delete Access)',
    is_system: true,
    permissions: getDefaultPermissions('DISPATCH_MANAGER')
  },
  {
    id: 'pg_asm',
    group_name: 'Area Sales Manager Group',
    description: 'Add Order, View Order, Cancel Order, Company Dashboard (No Delete Access)',
    is_system: true,
    permissions: getDefaultPermissions('AREA_SALES_MANAGER')
  }
];

const SEED_USERS: User[] = [
  { sno: 1, id: 'u01', full_name: 'Chirag', email: 'chirag@proline.com', role_name: 'SUPER_ADMIN', permission_group_id: 'pg_admin', permission_group_name: 'Full Super Admin Authority', company_handle: 'All', password: '1234', active: true },
  { sno: 2, id: 'u02', full_name: 'Harshad', email: 'harshad@proline.com', role_name: 'SUPER_ADMIN', permission_group_id: 'pg_admin', permission_group_name: 'Full Super Admin Authority', company_handle: 'All', password: '1234', active: true },
  { sno: 3, id: 'u03', full_name: 'Jay', email: 'jay@proline.com', role_name: 'SALES_ADMIN', permission_group_id: 'pg_sales_admin', permission_group_name: 'Sales Admin Authority Group', company_handle: 'Priyagold, RCPL, Orion, Gandour, HPPL', password: '1234', active: true },
  { sno: 4, id: 'u04', full_name: 'Dixit', email: 'dixit@proline.com', role_name: 'SALES_ADMIN', permission_group_id: 'pg_sales_admin', permission_group_name: 'Sales Admin Authority Group', company_handle: 'Heli, Waiwai, PRAN, Mogu mogu', password: '1234', active: true },
  { sno: 5, id: 'u05', full_name: 'Sumit', email: 'sumit@proline.com', role_name: 'SALES_ADMIN', permission_group_id: 'pg_sales_admin', permission_group_name: 'Sales Admin Authority Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '1234', active: true },
  { sno: 6, id: 'u06', full_name: 'Riddhi', email: 'riddhi@proline.com', role_name: 'BILLING', permission_group_id: 'pg_billing', permission_group_name: 'Billing & Accounts Group', company_handle: 'Priyagold, RCPL, Orion, Gandour, HPPL', password: '1234', active: true },
  { sno: 7, id: 'u07', full_name: 'Mansi', email: 'mansi.billing@proline.com', role_name: 'BILLING', permission_group_id: 'pg_billing', permission_group_name: 'Billing & Accounts Group', company_handle: 'Heli, Waiwai, PRAN, Mogu mogu', password: '1234', active: true },
  { sno: 8, id: 'u08', full_name: 'Sneha', email: 'sneha@proline.com', role_name: 'BILLING', permission_group_id: 'pg_billing', permission_group_name: 'Billing & Accounts Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '1234', active: true },
  { sno: 9, id: 'u09', full_name: 'Dhruv', email: 'dhruv@proline.com', role_name: 'DISPATCH_MANAGER', permission_group_id: 'pg_dispatch', permission_group_name: 'Dispatch Operations Group', company_handle: 'Heli, Waiwai, PRAN, Mogu mogu', password: '1234', active: true },
  { sno: 10, id: 'u10', full_name: 'Dharmik', email: 'dharmik@proline.com', role_name: 'DISPATCH_MANAGER', permission_group_id: 'pg_dispatch', permission_group_name: 'Dispatch Operations Group', company_handle: 'Priyagold, RCPL, Orion, Gandour, HPPL', password: '1234', active: true },
  { sno: 11, id: 'u11', full_name: 'Jitendra', email: 'jitendra@proline.com', role_name: 'DISPATCH_MANAGER', permission_group_id: 'pg_dispatch', permission_group_name: 'Dispatch Operations Group', company_handle: 'Whirlpool, Daikin, Cruise, Akai', password: '1234', active: true },
  { sno: 12, id: 'u12', full_name: 'Brijesh', email: 'brijesh@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Whirlpool', password: '1234', active: true },
  { sno: 13, id: 'u13', full_name: 'Kamal', email: 'kamal@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Cruise', password: '1234', active: true },
  { sno: 14, id: 'u14', full_name: 'Ashish', email: 'ashish@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Priyagold', password: '1234', active: true },
  { sno: 15, id: 'u15', full_name: 'Ankit', email: 'ankit@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Orion', password: '1234', active: true },
  { sno: 16, id: 'u16', full_name: 'Tushar', email: 'tushar@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Waiwai', password: '1234', active: true },
  { sno: 17, id: 'u17', full_name: 'Shakti', email: 'shakti@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'PRAN', password: '1234', active: true },
  { sno: 18, id: 'u18', full_name: 'Sanjay', email: 'sanjay@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'HPPL', password: '1234', active: true },
  { sno: 19, id: 'u19', full_name: 'Keyur (ASM)', email: 'keyur.asm@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Heli', password: '1234', active: true },
  { sno: 20, id: 'u20', full_name: 'Jagrut', email: 'jagrut@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Daikin', password: '1234', active: true },
  { sno: 21, id: 'u21', full_name: 'Dinesh (ASM)', email: 'dinesh.asm@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'Akai', password: '1234', active: true },
  { sno: 22, id: 'u22', full_name: 'Keyur (Field Sales)', email: 'keyur.field@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Heli', password: '1234', active: true },
  { sno: 23, id: 'u23', full_name: 'Shailendra', email: 'shailendra@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Orion', password: '1234', active: true },
  { sno: 24, id: 'u24', full_name: 'Jayendra', email: 'jayendra@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Waiwai', password: '1234', active: true },
  { sno: 25, id: 'u25', full_name: 'Nikhil', email: 'nikhil@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Priyagold', password: '1234', active: true },
  { sno: 26, id: 'u26', full_name: 'Jay (Field Sales)', email: 'jay.field@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Gandour', password: '1234', active: true },
  { sno: 27, id: 'u27', full_name: 'Sahil', email: 'sahil@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'HPPL', password: '1234', active: true },
  { sno: 28, id: 'u28', full_name: 'Milan', email: 'milan@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'PRAN', password: '1234', active: true },
  { sno: 29, id: 'u29', full_name: 'Rahul', email: 'rahul@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Mogu mogu', password: '1234', active: true },
  { sno: 30, id: 'u30', full_name: 'Sagar', email: 'sagar@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'RCPL', password: '1234', active: true },
  { sno: 31, id: 'u31', full_name: 'Taral', email: 'taral@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person / Field Sales Group', company_handle: 'Daikin, Whirlpool, Cruise, Akai', password: '1234', active: true }
];

const INITIAL_USERS: User[] = SEED_USERS.map(u => ({
  ...u,
  permissions: getDefaultPermissions(u.role_name)
}));

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  permissionGroups: PermissionGroup[];
  login: (emailOrName: string, passwordInput: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: RoleName) => void;
  switchUserById: (userId: string) => void;
  createUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);

  // Load live system_users from Supabase cloud database if table exists
  useEffect(() => {
    async function loadUsersFromSupabase() {
      try {
        const { data, error } = await supabase.from('system_users').select('*');
        if (data && data.length > 0 && !error) {
          const mappedUsers: User[] = data.map((u: any) => ({
            sno: u.sno || 1,
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            role_name: u.role_name as RoleName,
            permission_group_id: u.permission_group_id || 'pg_sales_person',
            permission_group_name: u.permission_group_name || 'Sales Person Group',
            company_handle: u.company_handle || 'All',
            password: u.password || '1234',
            active: u.active ?? true,
            permissions: getDefaultPermissions(u.role_name as RoleName)
          }));
          setUsers(mappedUsers);
          // Auto sync currentUser if active
          if (currentUser) {
            const updatedSelf = mappedUsers.find(mu => mu.id === currentUser.id);
            if (updatedSelf) setCurrentUser(updatedSelf);
          }
        }
      } catch (err) {
        console.warn('Supabase system_users table fetch notice:', err);
      }
    }
    loadUsersFromSupabase();
  }, []);

  const login = (emailOrName: string, passwordInput: string) => {
    const cleanInput = (emailOrName || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanInput) {
      return { success: false, error: 'Please enter a Person Name, User ID, or Email.' };
    }

    const targetUser = users.find(u => {
      const email = (u.email || '').toLowerCase().trim();
      const name = (u.full_name || '').toLowerCase().trim();
      const id = (u.id || '').toLowerCase().trim();

      return (
        email === cleanInput ||
        name === cleanInput ||
        name.includes(cleanInput) ||
        cleanInput.includes(name) ||
        id === cleanInput
      );
    });

    if (!targetUser) {
      return { success: false, error: `User ID / Person Name "${emailOrName}" not found in system.` };
    }

    if (targetUser.active === false) {
      return { success: false, error: `❌ Account Suspended: The user account for "${targetUser.full_name}" is currently INACTIVE. Contact System Admin.` };
    }

    if (targetUser.password && targetUser.password !== cleanPass) {
      return { success: false, error: 'Invalid password. Default password is 1234 unless updated by Admin.' };
    }

    // Ensure permissions attached
    const userWithPerms = {
      ...targetUser,
      permissions: targetUser.permissions || getDefaultPermissions(targetUser.role_name)
    };

    setCurrentUser(userWithPerms);
    return { success: true };
  };

  const logout = () => {
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
      id: 'u_' + (users.length + 1).toString().padStart(2, '0'),
      sno: users.length + 1,
      active: newUserData.active ?? true,
      permissions: newUserData.permissions || getDefaultPermissions(newUserData.role_name)
    };
    setUsers(prev => [...prev, newUser]);

    // Live sync insert to Supabase cloud database
    supabase.from('system_users').insert({
      id: newUser.id,
      sno: newUser.sno,
      full_name: newUser.full_name,
      email: newUser.email,
      role_name: newUser.role_name,
      permission_group_id: newUser.permission_group_id,
      permission_group_name: newUser.permission_group_name,
      company_handle: newUser.company_handle,
      password: newUser.password || '1234',
      active: newUser.active
    }).then(({ error }) => {
      if (error) console.warn('Supabase system_users insert error:', error);
    });
  };

  const updateUser = (userId: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const next = { ...u, ...updatedData };
        if (updatedData.role_name && !updatedData.permissions) {
          next.permissions = getDefaultPermissions(updatedData.role_name);
        }
        return next;
      }
      return u;
    }));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
    }

    // Live sync update to Supabase cloud database
    supabase.from('system_users').update({
      full_name: updatedData.full_name,
      email: updatedData.email,
      role_name: updatedData.role_name,
      company_handle: updatedData.company_handle,
      password: updatedData.password,
      active: updatedData.active
    }).eq('id', userId).then(({ error }) => {
      if (error) console.warn('Supabase system_users update error:', error);
    });
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
    }

    supabase.from('system_users').update({
      password: newPassword
    }).eq('id', userId).then(({ error }) => {
      if (error) console.warn('Supabase password update error:', error);
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

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          permission_group_id: group.id,
          permission_group_name: group.group_name,
          permissions: { ...group.permissions }
        };
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
