import React, { useState } from 'react';
import { Lock, UserCheck, ArrowRight, Eye, EyeOff, KeyRound, Sparkles, Smartphone, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, users } = useAuth();
  const [userInput, setUserInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await login(userInput, passwordInput);
      if (!res.success) {
        setError(res.error || 'Authentication failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickUser = async (userEmail: string, userPass?: string) => {
    const pwd = userPass || '1234';
    setUserInput(userEmail);
    setPasswordInput(pwd);
    setError(null);
    setIsLoading(true);
    try {
      const res = await login(userEmail, pwd);
      if (!res.success) {
        setError(res.error || 'Login failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      {/* Dynamic Background Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 420,
        height: 320,
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphism Card */}
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '2.25rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            width: 56,
            height: 56,
            borderRadius: 16,
            color: 'white',
            fontWeight: 900,
            fontSize: '1.35rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px -4px rgba(56, 189, 248, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
          }}>
            360
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            PROLINE OMS 360
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>
            Sign in to access your sales workspace
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '0.65rem 0.85rem',
            borderRadius: 10,
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {users && users.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#38bdf8', marginBottom: 6, letterSpacing: '0.04em' }}>
                ⚡ QUICK SELECT USER ACCOUNT
              </label>
              <select
                value={userInput}
                onChange={e => {
                  const selVal = e.target.value;
                  setUserInput(selVal);
                  const matchedUser = users.find(u => u.email === selVal || u.full_name === selVal || u.id === selVal);
                  if (matchedUser && matchedUser.password) {
                    setPasswordInput(matchedUser.password);
                  } else {
                    setPasswordInput('1234');
                  }
                }}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #38bdf8',
                  borderRadius: 10,
                  padding: '0.65rem 0.85rem',
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Choose Account from Database --</option>
                {users.map(u => (
                  <option key={u.id} value={u.email || u.full_name}>
                    {u.full_name} ({u.role_name.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User ID / Person Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em' }}>
              PERSON NAME / USER ID / EMAIL
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '0.65rem 0.85rem',
              gap: '0.65rem'
            }}>
              <UserCheck size={18} color="#38bdf8" />
              <input 
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Enter person name or user ID..."
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                PASSWORD
              </label>
              <span style={{ fontSize: '0.675rem', color: '#34d399', fontWeight: 700, background: 'rgba(52, 211, 153, 0.12)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                Default: 1234
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '0.65rem 0.85rem',
              gap: '0.65rem'
            }}>
              <Lock size={18} color="#38bdf8" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.875rem',
                  letterSpacing: showPassword ? 'normal' : '0.12em'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              padding: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              borderRadius: 10,
              marginTop: '0.35rem',
              width: '100%',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
              border: 'none',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Android App Download Banner */}
        <div 
          style={{ 
            marginTop: '1.25rem', 
            padding: '0.85rem 1rem', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(56, 189, 248, 0.1))', 
            border: '1px solid rgba(52, 211, 153, 0.35)', 
            borderRadius: 14, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '0.75rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 10, 
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                flexShrink: 0, 
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' 
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f8fafc' }}>
                Android Mobile App
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Native APK for field staff & managers
              </div>
            </div>
          </div>
          <a
            href="/proline-oms-app.apk"
            download="proline-oms-app.apk"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              borderRadius: 8,
              fontSize: '0.775rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={14} /> Download APK
          </a>
        </div>

        {/* Person Quick Select Shortcuts */}
        {users && users.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={13} color="#38bdf8" /> 1-CLICK DEMO LOGIN:
              </span>
              <span style={{ fontSize: '0.675rem', color: '#64748b' }}>{users.length} accounts</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
              {users.map(u => {
                const isSelected = userInput === u.email || userInput === u.full_name;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickUser(u.email || u.full_name, u.password)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : '#0f172a',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid #1e293b',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: '#f8fafc',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.7rem'
                      }}>
                        {u.sno || u.full_name.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                        {u.full_name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.625rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: 4,
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      fontWeight: 700,
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}>
                      {u.role_name.replace(/_/g, ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

