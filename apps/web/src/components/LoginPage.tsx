import React, { useState, useEffect } from 'react';
import { Lock, UserCheck, ArrowRight, Eye, EyeOff, Smartphone, Download, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { APP_VERSION, APP_BUILD_DATETIME, APK_DOWNLOAD_URL } from '../config/version';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addNotification } = useNotifications();
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const handleEnableNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await PushNotifications.requestPermissions();
        if (res.receive === 'granted') {
          await PushNotifications.register();
          setNotificationGranted(true);
        }
      } catch (err) {
        console.warn('Native push error:', err);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setNotificationGranted(true);
        }
      } catch {}
    }
  };

  // Automatically trigger notification permission prompt when user opens login screen
  useEffect(() => {
    handleEnableNotifications();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await login(usernameInput, passwordInput);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please check user ID / email and password.');
      } else {
        handleEnableNotifications();
        addNotification({
          title: '🔔 Notifications Active',
          message: `Logged in as ${usernameInput}. Realtime order alerts are live.`,
          event_type: 'ORDER_SUBMITTED'
        });
      }
    } catch {
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        width: '100vw', 
        background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 60%, #020617 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient lighting */}
      <div 
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 350,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} 
      />

      <div 
        style={{ 
          maxWidth: 460, 
          width: '100%', 
          background: 'rgba(15, 23, 42, 0.88)', 
          border: '1px solid rgba(255, 255, 255, 0.12)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24, 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.15)', 
          padding: '2.25rem 2rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img 
            src="/prokap-badge.png" 
            alt="PROKAP" 
            style={{ 
              width: 76, 
              height: 76, 
              objectFit: 'contain',
              borderRadius: 20,
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.45), 0 0 20px rgba(16, 185, 129, 0.25)',
              marginBottom: '0.85rem'
            }} 
          />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            PROKAP
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginTop: 4, marginBottom: 0, letterSpacing: '0.02em' }}>
            Order Fast. Track Live.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
            Sign in to access your sales workspace
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div 
            style={{ 
              background: 'rgba(244, 63, 94, 0.15)', 
              border: '1px solid rgba(244, 63, 94, 0.35)', 
              color: '#fb7185', 
              padding: '0.65rem 0.85rem', 
              borderRadius: 10, 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              marginBottom: '1.25rem' 
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 6 }}>
              USER ID / NAME / EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <UserCheck size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                data-testid="login-username"
                type="text" 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                placeholder="e.g. Chirag or chirag@proline.com"
                style={{ 
                  width: '100%', 
                  background: '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: 10, 
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem', 
                  color: 'white', 
                  fontSize: '0.85rem', 
                  outline: 'none',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                PASSWORD
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                data-testid="login-password"
                type={showPassword ? 'text' : 'password'} 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="Enter password"
                style={{ 
                  width: '100%', 
                  background: '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: 10, 
                  padding: '0.65rem 2.4rem 0.65rem 2.4rem', 
                  color: 'white', 
                  fontSize: '0.85rem', 
                  outline: 'none',
                  fontWeight: 600,
                  letterSpacing: showPassword ? 'normal' : '0.1em',
                  boxSizing: 'border-box'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Notification Permission Card on Login */}
          <div 
            style={{ 
              background: 'rgba(56, 189, 248, 0.08)', 
              border: '1px solid rgba(56, 189, 248, 0.25)', 
              borderRadius: 10, 
              padding: '0.6rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginTop: '0.2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={15} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                  Live Order Notifications
                </div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                  Get phone alerts for new orders & dispatches
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnableNotifications}
              style={{
                background: notificationGranted ? 'rgba(52, 211, 153, 0.15)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: notificationGranted ? '1px solid #10b981' : 'none',
                color: notificationGranted ? '#34d399' : '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.35rem 0.65rem',
                borderRadius: 6,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {notificationGranted ? '✓ Enabled' : 'Enable 🔔'}
            </button>
          </div>

          <button 
            data-testid="login-submit"
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '0.9rem', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              marginTop: '0.35rem',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              border: 'none',
              color: 'white'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Android App Download Banner (Versioned Titles: Release & Debug) */}
        {!Capacitor.isNativePlatform() && (
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '0.75rem 0.85rem', 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08))', 
              border: '1px solid rgba(52, 211, 153, 0.3)', 
              borderRadius: 12, 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.55rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div 
                  style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 7, 
                    background: 'linear-gradient(135deg, #10b981, #059669)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Smartphone size={15} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                  Android APK Packages
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 800, fontFamily: 'monospace' }}>
                {APP_VERSION}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.42rem 0.5rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  borderRadius: 7,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  textAlign: 'center'
                }}
                title="proline-oms-app-v1.0_release.apk (Production Release)"
              >
                <Download size={12} /> v1.0 Release (.apk)
              </a>

              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.42rem 0.5rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  borderRadius: 7,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
                title="proline-oms-app-v1.0_debug.apk (Direct Debug Build)"
              >
                <Download size={12} /> v1.0 Debug (.apk)
              </a>
            </div>
          </div>
        )}



        {/* System Version & Creation Date/Time Badge */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
            PROKAP OMS 360 • {APP_VERSION}
          </div>
          <div style={{ fontSize: '0.675rem', color: '#64748b' }}>
            Build Created: {APP_BUILD_DATETIME}
          </div>
        </div>
      </div>
    </div>
  );
};

