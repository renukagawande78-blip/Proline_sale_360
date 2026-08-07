import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, updateUserPassword } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasswordChange = (userId: string) => {
    if (!newPassword.trim()) return;
    updateUserPassword(userId, newPassword.trim());
    setSuccessMsg(`Password successfully updated for user!`);
    setSelectedUserId(null);
    setNewPassword('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.full_name.toLowerCase().includes(q);
    const roleMatch = u.role_name.toLowerCase().includes(q);
    const companyMatch = (u.company_handle || '').toLowerCase().includes(q);
    return nameMatch || roleMatch || companyMatch;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 960 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="#38bdf8" size={22} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Admin Authority Password & Master User Directory</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>System Admin control panel for 31 Team Members, System Roles & Company Handles</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.5rem 0.85rem', gap: '0.5rem' }}>
          <Search size={16} color="#38bdf8" />
          <input 
            type="text"
            placeholder="Search team member by name, role (Admin, Billing, ASM, FSM), or brand handle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        <div className="data-table-container" style={{ maxHeight: 420, overflowY: 'auto' }}>
          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.NO</th>
                <th>User Name</th>
                <th>System Role</th>
                <th>Company Handle</th>
                <th>Password</th>
                <th>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr key={u.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{u.sno || idx + 1}</strong></td>
                  <td><strong style={{ color: '#f8fafc' }}>{u.full_name}</strong></td>
                  <td>
                    <span className="role-pill" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                      {u.role_name.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.775rem', color: '#34d399', fontWeight: 600 }}>
                      {u.company_handle || 'All'}
                    </span>
                  </td>
                  <td><code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#fbbf24', fontWeight: 700 }}>{u.password || '1234'}</code></td>
                  <td>
                    {selectedUserId === u.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="New password..."
                          style={{ padding: '0.3rem 0.5rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 4, color: 'white', fontSize: '0.8rem', width: 110 }}
                        />
                        <button 
                          className="btn btn-success" 
                          onClick={() => handlePasswordChange(u.id)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Save
                        </button>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => setSelectedUserId(null)}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => { setSelectedUserId(u.id); setNewPassword(u.password || '1234'); }}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <Key size={13} /> Edit Password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Total Active Team Members: <strong>{users.length} Users</strong></div>
          <button className="btn btn-outline" onClick={onClose}>Close Admin Panel</button>
        </div>
      </div>
    </div>
  );
};
