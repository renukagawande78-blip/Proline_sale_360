import React, { useState } from 'react';
import { Lock, UserCheck, ArrowRight, Shield, Eye, EyeOff, Sparkles, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, users } = useAuth();
  const [userInput, setUserInput] = useState('sysadmin@proline.com');
  const [passwordInput, setPasswordInput] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = login(userInput, passwordInput);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleSelectQuickUser = (userEmail: string, userPass?: string) => {
    setUserInput(userEmail);
    setPasswordInput(userPass || '1234');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 20%, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '15%',
        width: 320,
        height: 320,
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: 380,
        height: 380,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphism Card */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 24,
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.08)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            width: 64,
            height: 64,
            borderRadius: 18,
            color: 'white',
            fontWeight: 900,
            fontSize: '1.6rem',
            marginBottom: '1rem',
            boxShadow: '0 12px 24px -4px rgba(56, 189, 248, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
          }}>
            360
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            PROLINE OMS 360
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="#38bdf8" /> B2B Enterprise Order Management Console
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '0.85rem 1rem',
            borderRadius: 12,
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* User ID / Person Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em' }}>
              PERSON NAME / USER ID / EMAIL
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              gap: '0.75rem',
              transition: 'all 0.2s ease'
            }}>
              <UserCheck size={20} color="#38bdf8" />
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
                  fontSize: '0.925rem',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                PASSWORD
              </label>
              <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700, background: 'rgba(52, 211, 153, 0.15)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                Default: 1234
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              gap: '0.75rem'
            }}>
              <Lock size={20} color="#38bdf8" />
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
                  fontSize: '0.925rem',
                  letterSpacing: showPassword ? 'normal' : '0.15em'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: 12,
              marginTop: '0.5rem',
              width: '100%',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              boxShadow: '0 8px 20px -4px rgba(56, 189, 248, 0.4)'
            }}
          >
            Log In to Console <ArrowRight size={20} />
          </button>
        </form>

        {/* Person Quick Select Shortcuts */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <KeyRound size={14} color="#38bdf8" /> SELECT DEMO PERSON ACCOUNT:
            </span>
            <span style={{ fontSize: '0.675rem', color: '#64748b' }}>Password: 1234</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: 180, overflowY: 'auto' }}>
            {users.map(u => {
              const isSelected = userInput === u.email || userInput === u.full_name;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectQuickUser(u.email, u.password)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 10,
                    cursor: 'pointer',
                    color: '#f8fafc',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f8fafc' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{u.email}</div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.675rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    fontWeight: 700,
                    border: '1px solid rgba(56, 189, 248, 0.2)'
                  }}>
                    {u.role_name.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
