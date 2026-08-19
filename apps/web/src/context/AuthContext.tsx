import React, { createContext, useContext, useState, useEffect } from 'react';
import { RoleName, User, PermissionControl, PermissionGroup } from '../types';
import { supabase, deduplicateUsers, saveUserToSupabase } from '../lib/supabase';

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
  { sno: 3, id: 'u03', full_name: 'Sagar', email: 'sagar@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person Group', company_handle: 'Mogu Mogu', password: '1234', active: true },
  { sno: 4, id: 'u04', full_name: 'Ankit', email: 'ankit@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person Group', company_handle: 'Priyagold, Orion', password: '1234', active: true },
  { sno: 5, id: 'u05', full_name: 'Rakesh Patel', email: 'rakesh@proline.com', role_name: 'AREA_SALES_MANAGER', permission_group_id: 'pg_asm', permission_group_name: 'Area Sales Manager Group', company_handle: 'RCPL, Priyagold', password: '1234', active: true },
  { sno: 6, id: 'u06', full_name: 'Amit Sharma', email: 'amit@proline.com', role_name: 'SALES_PERSON', permission_group_id: 'pg_sales_person', permission_group_name: 'Sales Person Group', company_handle: 'Whirlpool, Daikin', password: '1234', active: true }
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
  logout: () => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);

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
          const mappedUsers: User[] = data.map((u: any, idx: number) => ({
            sno: u.sno || idx + 1,
            id: u.id || `u_${idx + 1}`,
            full_name: u.full_name || u.name || u.user_name || 'System User',
            email: u.email || `${u.id}@proline.com`,
            role_name: (u.role_name || u.role || 'SALES_PERSON') as RoleName,
            permission_group_id: u.permission_group_id || 'pg_sales_person',
            permission_group_name: u.permission_group_name || 'Sales Person Group',
            company_handle: u.company_handle || u.brand_scope || 'All',
            password: u.password || '1234',
            active: u.active ?? true,
            permissions: getDefaultPermissions((u.role_name || u.role || 'SALES_PERSON') as RoleName)
          }));
          setUsers(deduplicateUsers(mappedUsers));
          if (currentUser) {
            const updatedSelf = mappedUsers.find(mu => mu.id === currentUser.id);
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

    let targetUser = users.find(u => {
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

    // Fallback: Direct query to Supabase database if not in memory
    if (!targetUser) {
      try {
        let { data } = await supabase.from('users').select('*');
        if (!data || data.length === 0) {
          const sysRes = await supabase.from('system_users').select('*');
          data = sysRes.data;
        }

        if (data && data.length > 0) {
          const dbUsers: User[] = data.map((u: any, idx: number) => ({
            sno: u.sno || idx + 1,
            id: u.id || `u_${idx + 1}`,
            full_name: u.full_name || u.name || u.user_name || 'System User',
            email: u.email || `${u.id}@proline.com`,
            phone: u.phone || u.mobile || '',
            role_name: (u.role_name || u.role || 'SALES_PERSON') as RoleName,
            permission_group_id: u.permission_group_id || 'pg_sales_person',
            permission_group_name: u.permission_group_name || 'Sales Person Group',
            company_handle: u.company_handle || u.brand_scope || 'All',
            password: u.password || '1234',
            active: u.active ?? true,
            permissions: getDefaultPermissions((u.role_name || u.role || 'SALES_PERSON') as RoleName)
          }));

          setUsers(prev => deduplicateUsers([...prev, ...dbUsers]));

          targetUser = dbUsers.find(u => {
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
        }
      } catch (err) {
        console.warn('Live Supabase user lookup notice:', err);
      }
    }

    if (!targetUser) {
      return { success: false, error: `User account "${emailOrName}" not found in database.` };
    }

    if (targetUser.active === false) {
      return { success: false, error: `❌ Account Suspended: The user account for "${targetUser.full_name}" is currently INACTIVE.` };
    }

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
