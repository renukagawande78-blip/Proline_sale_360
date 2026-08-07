import React, { createContext, useContext, useState } from 'react';
import { RoleName, User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (emailOrName: string, passwordInput: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: RoleName) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
}

const INITIAL_USERS: User[] = [
  {
    id: 'u2222222-2222-2222-2222-222222222222',
    email: 'sysadmin@proline.com',
    full_name: 'Vikram Malhotra (System Admin)',
    role_name: 'SYSTEM_ADMIN',
    password: '1234',
    active: true
  },
  {
    id: 'u1111111-1111-1111-1111-111111111111',
    email: 'superadmin@proline.com',
    full_name: 'System Super Admin',
    role_name: 'SUPER_ADMIN',
    password: '1234',
    active: true
  },
  {
    id: 'u7777777-7777-7777-7777-777777777777',
    email: 'amit.sales@proline.com',
    full_name: 'Amit Kumar (Sales Person)',
    role_name: 'SALES_PERSON',
    password: '1234',
    active: true
  },
  {
    id: 'u6666666-6666-6666-6666-666666666666',
    email: 'asm.north@proline.com',
    full_name: 'Sunil Kapoor (Area Sales Manager)',
    role_name: 'AREA_SALES_MANAGER',
    password: '1234',
    active: true
  },
  {
    id: 'u5555555-5555-5555-5555-555555555555',
    email: 'dispatch@proline.com',
    full_name: 'Sanjay Yadav (Dispatch Manager)',
    role_name: 'DISPATCH_MANAGER',
    password: '1234',
    active: true
  },
  {
    id: 'u3333333-3333-3333-3333-333333333333',
    email: 'accounts@proline.com',
    full_name: 'Anjali Gupta (Accounts Manager)',
    role_name: 'ACCOUNTS',
    password: '1234',
    active: true
  },
  {
    id: 'u4444444-4444-4444-4444-444444444444',
    email: 'billing@proline.com',
    full_name: 'Rohan Shah (Billing Executive)',
    role_name: 'BILLING',
    password: '1234',
    active: true
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Initialized to null to show Login view first

  const login = (emailOrName: string, passwordInput: string) => {
    const targetUser = users.find(u => 
      u.email.toLowerCase() === emailOrName.toLowerCase() ||
      u.full_name.toLowerCase().includes(emailOrName.toLowerCase()) ||
      u.id === emailOrName
    );

    if (!targetUser) {
      return { success: false, error: 'User ID / Person Name not found in system.' };
    }

    if (targetUser.password !== passwordInput) {
      return { success: false, error: 'Invalid password. Default password is 1234 unless updated by Admin.' };
    }

    setCurrentUser(targetUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role: RoleName) => {
    const roleUser = users.find(u => u.role_name === role);
    if (roleUser) {
      setCurrentUser(roleUser);
    }
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, switchRole, updateUserPassword }}>
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
