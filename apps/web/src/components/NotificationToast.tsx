import React from 'react';
import { useNotifications, getRoleBadge, getCategoryBadge } from '../context/NotificationContext';
import { X, Bell, CheckCircle2, PackageCheck, AlertTriangle } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useNotifications();

  if (!activeToast) return null;

  const catBadge = getCategoryBadge(activeToast.category);

  const getIcon = () => {
    const ev = (activeToast.event_type || '').toUpperCase();
    switch (activeToast.category) {
      case 'ORDER':
        return <Bell size={20} color="#38bdf8" />;
      case 'POD':
      case 'APPROVAL':
        return <AlertTriangle size={20} color={ev.includes('CLEAN') || ev.includes('VERIFIED') ? '#34d399' : '#f43f5e'} />;
      case 'DISPATCH':
        return <PackageCheck size={20} color="#fbbf24" />;
      case 'INVENTORY':
        return <AlertTriangle size={20} color="#fbbf24" />;
      default:
        return <CheckCircle2 size={20} color="#38bdf8" />;
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'min(460px, calc(100vw - 24px))',
        background: '#0f172a',
        border: '1.5px solid #38bdf8',
        borderRadius: 14,
        padding: '0.85rem 1rem',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75), 0 0 25px rgba(56, 189, 248, 0.35)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        animation: 'slideDownNotification 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <style>{`
        @keyframes slideDownNotification {
          from {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>

      <div 
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2
        }}
      >
        {getIcon()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeToast.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.625rem', color: catBadge.color, background: catBadge.bg, padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
              {catBadge.label}
            </span>
          </div>
        </div>

        {/* Target role tags */}
        {activeToast.target_roles && activeToast.target_roles.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: 4 }}>
            {activeToast.target_roles.map(r => {
              const rb = getRoleBadge(r);
              return (
                <span key={r} style={{ fontSize: '0.6rem', color: rb.color, background: rb.bg, padding: '0.05rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                  {rb.label}
                </span>
              );
            })}
          </div>
        )}

        <p style={{ fontSize: '0.775rem', color: '#cbd5e1', margin: 0, lineHeight: 1.35, wordBreak: 'break-word' }}>
          {activeToast.message}
        </p>
      </div>

      <button
        onClick={dismissToast}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2
        }}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};
