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
  { sno: 1, id: 'u01', full_name: 'Chirag', email: 'chirag@proline.com', role_name: 'SYSTEM_ADMIN', company_handle: 'All', password: '1234', active: true },
  { sno: 2, id: 'u02', full_name: 'Harshad', email: 'harshad@proline.com', role_name: 'ACCOUNTS', company_handle: 'All', password: '1234', active: true },
  { sno: 3, id: 'u03', full_name: 'Jay', email: 'jay@proline.com', role_name: 'SALES_ADMIN', company_handle: 'Pringod, RCPL, Orion, Gandour, HPPL', password: '1234', active: true },
  { sno: 4, id: 'u04', full_name: 'Dixit', email: 'dixit@proline.com', role_name: 'SALES_ADMIN', company_handle: 'Whirlpool, Daikin, Cruise, Mogu', password: '1234', active: true },
  { sno: 5, id: 'u05', full_name: 'Sumit', email: 'sumit@proline.com', role_name: 'SALES_ADMIN', company_handle: 'Heli, Waiwai, PRAN, Mogu', password: '1234', active: true },
  { sno: 6, id: 'u06', full_name: 'Riddhi', email: 'riddhi@proline.com', role_name: 'BILLING', company_handle: 'Pringod, RCPL, Orion', password: '1234', active: true },
  { sno: 7, id: 'u07', full_name: 'Mansi', email: 'mansi.billing@proline.com', role_name: 'BILLING', company_handle: 'Whirlpool, Daikin, Cruise', password: '1234', active: true },
  { sno: 8, id: 'u08', full_name: 'Sneha', email: 'sneha@proline.com', role_name: 'BILLING', company_handle: 'Heli, Waiwai, PRAN, Mogu', password: '1234', active: true },
  { sno: 9, id: 'u09', full_name: 'Mansi (Dispatch)', email: 'mansi.dispatch@proline.com', role_name: 'DISPATCH_MANAGER', company_handle: 'Pringod, RCPL, Orion, Gandour, HPPL', password: '1234', active: true },
  { sno: 10, id: 'u10', full_name: 'Dharmik', email: 'dharmik@proline.com', role_name: 'DISPATCH_MANAGER', company_handle: 'Whirlpool, Daikin, Cruise', password: '1234', active: true },
  { sno: 11, id: 'u11', full_name: 'Jitendra', email: 'jitendra@proline.com', role_name: 'DISPATCH_MANAGER', company_handle: 'Heli, Waiwai, PRAN, Mogu', password: '1234', active: true },
  { sno: 12, id: 'u12', full_name: 'Kamlesh', email: 'kamlesh@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Pringod', password: '1234', active: true },
  { sno: 13, id: 'u13', full_name: 'Bramh', email: 'bramh@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'RCPL', password: '1234', active: true },
  { sno: 14, id: 'u14', full_name: 'Vipul', email: 'vipul@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Orion', password: '1234', active: true },
  { sno: 15, id: 'u15', full_name: 'Shaktisinh', email: 'shaktisinh@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Gandour', password: '1234', active: true },
  { sno: 16, id: 'u16', full_name: 'Tushar', email: 'tushar@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'HPPL', password: '1234', active: true },
  { sno: 17, id: 'u17', full_name: 'Shakti', email: 'shakti@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Whirlpool', password: '1234', active: true },
  { sno: 18, id: 'u18', full_name: 'Sanjay', email: 'sanjay@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Daikin', password: '1234', active: true },
  { sno: 19, id: 'u19', full_name: 'Keyur', email: 'keyur.cruise@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Cruise', password: '1234', active: true },
  { sno: 20, id: 'u20', full_name: 'Jagrut', email: 'jagrut@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Mogu', password: '1234', active: true },
  { sno: 21, id: 'u21', full_name: 'Dinesh', email: 'dinesh.heli@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Heli', password: '1234', active: true },
  { sno: 22, id: 'u22', full_name: 'Keyur (Waiwai)', email: 'keyur.waiwai@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'Waiwai', password: '1234', active: true },
  { sno: 23, id: 'u23', full_name: 'Dinesh (PRAN)', email: 'dinesh.pran@proline.com', role_name: 'AREA_SALES_MANAGER', company_handle: 'PRAN', password: '1234', active: true },
  { sno: 24, id: 'u24', full_name: 'Shailendra', email: 'shailendra@proline.com', role_name: 'SALES_PERSON', company_handle: 'Pringod', password: '1234', active: true },
  { sno: 25, id: 'u25', full_name: 'Jayendra', email: 'jayendra@proline.com', role_name: 'SALES_PERSON', company_handle: 'RCPL', password: '1234', active: true },
  { sno: 26, id: 'u26', full_name: 'Nikhil', email: 'nikhil@proline.com', role_name: 'SALES_PERSON', company_handle: 'Orion', password: '1234', active: true },
  { sno: 27, id: 'u27', full_name: 'Ravi', email: 'ravi@proline.com', role_name: 'SALES_PERSON', company_handle: 'Gandour', password: '1234', active: true },
  { sno: 28, id: 'u28', full_name: 'Milan', email: 'milan@proline.com', role_name: 'SALES_PERSON', company_handle: 'HPPL', password: '1234', active: true },
  { sno: 29, id: 'u29', full_name: 'Rahul', email: 'rahul@proline.com', role_name: 'SALES_PERSON', company_handle: 'Whirlpool', password: '1234', active: true },
  { sno: 30, id: 'u30', full_name: 'Sagar', email: 'sagar@proline.com', role_name: 'SALES_PERSON', company_handle: 'Mogu', password: '1234', active: true },
  { sno: 31, id: 'u31', full_name: 'Taral', email: 'taral@proline.com', role_name: 'SALES_PERSON', company_handle: 'Daikin, Cruise, AK', password: '1234', active: true }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Initialized to null to show Login view first

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

    if (targetUser.password && targetUser.password !== cleanPass) {
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
