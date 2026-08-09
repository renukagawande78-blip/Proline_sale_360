import React, { useState } from 'react';
import { Mail, Phone, ShieldCheck, Eye, EyeOff, UserCheck, UserX, Building2, Lock } from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface UsersMasterViewProps {
  users: User[];
  searchQuery: string;
}

export const UsersMasterView: React.FC<UsersMasterViewProps> = ({ users, searchQuery }) => {
  const { currentUser, updateUser } = useAuth();
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [localUsers, setLocalUsers] = useState<User[]>(users);

  const isAdmin = currentUser?.role_name === 'SUPER_ADMIN' || currentUser?.role_name === 'SYSTEM_ADMIN';

  const activeUserList = localUsers.length > 0 ? localUsers : users;

  const filteredUsers = activeUserList.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.company_handle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleToggleUserStatus = (user: User) => {
    const newStatus = !(user.active ?? true);
    setLocalUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
    if (updateUser) {
      updateUser(user.id, { active: newStatus });
    }
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>S.NO</th>
            <th>User Name</th>
            <th>Role & Authority</th>
            <th>Email Address</th>
            <th>Contact / Mobile No.</th>
            <th>Brand Handle Scope</th>
            <th>Status</th>
            {isAdmin && <th style={{ textAlign: 'center' }}>Password Authority</th>}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u, idx) => {
            const isActive = u.active !== false;
            const isPasswordVisible = !!showPasswordMap[u.id];
            const mobileNo = u.phone || `+91 98250 ${(11000 + (u.sno || idx + 1)).toString()}`;

            return (
              <tr key={u.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                <td><strong style={{ color: '#38bdf8' }}>{u.sno || idx + 1}</strong></td>
                
                <td>
                  <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{u.full_name}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {u.id}</div>
                </td>

                <td>
                  <span className="role-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={12} /> {u.role_name.replace(/_/g, ' ')}
                  </span>
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Mail size={13} color="#38bdf8" />
                    <span>{u.email}</span>
                  </div>
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    <Phone size={13} color="#34d399" />
                    <span>{mobileNo}</span>
                  </div>
                </td>

                <td>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Building2 size={13} /> {u.company_handle || 'All'}
                  </span>
                </td>

                <td>
                  <button
                    onClick={() => handleToggleUserStatus(u)}
                    title="Click to toggle Active / Inactive user status"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: isActive ? '#34d399' : '#fb7185',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isActive ? <UserCheck size={13} /> : <UserX size={13} />}
                    <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </button>
                </td>

                {isAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', border: '1px solid #334155', padding: '0.2rem 0.55rem', borderRadius: 8 }}>
                      <Lock size={12} color="#fbbf24" />
                      <span style={{ fontSize: '0.775rem', fontFamily: 'monospace', fontWeight: 800, color: '#fbbf24', minWidth: 45 }}>
                        {isPasswordVisible ? (u.password || '1234') : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(u.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
                        title={isPasswordVisible ? 'Hide Password' : 'Show Password (Admin Authority)'}
                      >
                        {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
