import React, { useState } from 'react';
import { ShieldAlert, Send, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface PermissionDeniedModalProps {
  isOpen: boolean;
  actionName: string;
  requiredPermissionKey: string;
  onClose: () => void;
}

export const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  isOpen,
  actionName,
  requiredPermissionKey,
  onClose
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [requestedSent, setRequestedSent] = useState(false);

  if (!isOpen) return null;

  const handleSendAdminRequest = () => {
    addNotification({
      title: `⚠️ PERMISSION ACCESS REQUEST: ${currentUser?.full_name || 'User'}`,
      message: `${currentUser?.full_name} (${currentUser?.role_name}) requested permission for "${actionName}" (Control: ${requiredPermissionKey}). Status: PENDING ADMIN APPROVAL.`,
      event_type: 'PERMISSION_REQUESTED'
    });
    setRequestedSent(true);
    setTimeout(() => {
      setRequestedSent(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: 520, background: '#1e1b4b', border: '1px solid #f43f5e', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#fb7185' }}>
          <ShieldAlert size={34} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.5rem' }}>
          ⛔ Permission Access Denied
        </h2>

        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          You do not have permission to perform <strong style={{ color: '#fb7185' }}>"{actionName}"</strong>.
          Your active Permission Group (<strong style={{ color: '#38bdf8' }}>{currentUser?.permission_group_name || currentUser?.role_name}</strong>) has this authority control set to <strong style={{ color: '#fb7185' }}>NO</strong>.
        </p>

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.775rem' }}>
          <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>SECURITY AUDIT & JSON RESPONSE PAYLOAD:</div>
          <div style={{ color: '#f8fafc' }}>Requested Control Key: <code style={{ color: '#38bdf8' }}>{requiredPermissionKey}</code></div>
          <div style={{ color: '#f8fafc' }}>User: <strong>{currentUser?.full_name} ({currentUser?.email})</strong></div>
          <div style={{ color: '#f8fafc' }}>Contact System Admin: <strong>Chirag (System Admin)</strong></div>
        </div>

        {requestedSent ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Check size={18} /> Request Sent Live to System Admin Notification Queue!
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={onClose} style={{ padding: '0.65rem 1.25rem' }}>
              Close
            </button>

            <button 
              className="btn btn-danger" 
              onClick={handleSendAdminRequest} 
              style={{ padding: '0.65rem 1.25rem', background: '#e11d48', fontWeight: 800 }}
            >
              <Send size={16} /> Request Access from Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
