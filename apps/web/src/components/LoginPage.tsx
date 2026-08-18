import React, { useState } from 'react';
import { Lock, UserCheck, ShieldCheck, ArrowRight, Sparkles, Building2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, users } = useAuth();
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(usernameInput, passwordInput);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid credentials. Please check user ID / email and password.');
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        width: '100vw', 
        background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a 60%, #020617)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      }}
    >
      <div 
        style={{ 
          maxWidth: 960, 
          width: '100%', 
          display: 'grid', 
          gridTemplateColumns: '1.1fr 1fr', 
          background: '#0f172a', 
          border: '1px solid rgba(255, 255, 255, 0.12)', 
          borderRadius: 20, 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)', 
          overflow: 'hidden' 
        }}
        className="login-card-grid"
      >
        {/* Left Side: Brand Visual & Features */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)), url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80")', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            padding: '2.5rem 2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #38bdf8, #6366f1)', 
                  color: 'white', 
                  fontWeight: 900, 
                  fontSize: '1.1rem', 
                  padding: '0.6rem 0.85rem', 
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
                }}
              >
                360
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  PROLINE OMS
                </h1>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.08em' }}>
                  ENTERPRISE B2B SALES 360
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3, marginBottom: '1rem' }}>
              Multi-Brand B2B Sales & Order Management System
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
              Real-time multi-tenant order creation, hold-reason tracking, credit limits, dispatch logistics, and sales performance analytics for 13 global FMCG & FMCD brands.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontSize: '0.825rem', fontWeight: 600 }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: 6, borderRadius: 6, color: '#38bdf8' }}>
                  <ShieldCheck size={16} />
                </div>
                Role-Based Authority & Granular Brand Data Scope
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontSize: '0.825rem', fontWeight: 600 }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: 6, borderRadius: 6, color: '#34d399' }}>
                  <Building2 size={16} />
                </div>
                13 FMCG & FMCD Brands (Pringod, Daikin, Mogu Mogu, Waiwai...)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontSize: '0.825rem', fontWeight: 600 }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: 6, borderRadius: 6, color: '#c084fc' }}>
                  <Sparkles size={16} />
                </div>
                Realtime Dispatch Workflow & Live Accounts Clearance
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '2rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700 }}>
              ENVIRONMENT: SUPABASE LIVE DB | PRODUCTION v1.0.0
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & 1-Click Quick Demo Switcher */}
        <div style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
              Sign In to Your Workspace
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              Enter your user credentials or select a test team member below
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            {users && users.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em', marginBottom: 6 }}>
                  ⚡ SELECT DATABASE ACCOUNT TO SIGN IN
                </label>
                <select
                  value={usernameInput}
                  onChange={e => {
                    const selVal = e.target.value;
                    setUsernameInput(selVal);
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
                    borderRadius: 8,
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
                      {u.full_name} ({u.role_name}) - {u.email || u.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 6 }}>
                USER ID / PERSON NAME / EMAIL
              </label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)} 
                  placeholder="e.g. Chirag Patel or chirag@proline.com"
                  style={{ 
                    width: '100%', 
                    background: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: 8, 
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem', 
                    color: 'white', 
                    fontSize: '0.85rem', 
                    outline: 'none',
                    fontWeight: 600
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 6 }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  placeholder="Enter account password"
                  style={{ 
                    width: '100%', 
                    background: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: 8, 
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem', 
                    color: 'white', 
                    fontSize: '0.85rem', 
                    outline: 'none',
                    fontWeight: 600
                  }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
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
                marginTop: '0.5rem',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
              }}
            >
              Sign In to Session <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
