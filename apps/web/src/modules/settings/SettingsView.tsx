import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Tag, 
  ShieldCheck, 
  Database, 
  Bell, 
  Copy, 
  Check, 
  FileCode2, 
  Layers, 
  Radio, 
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { APP_VERSION, APP_BUILD_DATETIME, APK_DOWNLOAD_URL } from '../../config/version';
import { Capacitor } from '@capacitor/core';

interface ReleaseInfo {
  version: string;
  releaseTitle: string;
  releaseDate: string;
  isLatest: boolean;
  statusBadge: string;
  badgeColor: string;
  badgeBg: string;
  releaseApkName: string;
  releaseApkPath: string;
  releaseApkSize: string;
  changes: string[];
}

const RELEASES_DATA: ReleaseInfo[] = [
  {
    version: 'v2.14.0 (v1.0 Package)',
    releaseTitle: 'PROKAP OMS 360 • v2.14.0 Production Build',
    releaseDate: '11-Sep-2026, 05:27 AM IST',
    isLatest: true,
    statusBadge: 'LATEST PRODUCTION RELEASE',
    badgeColor: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    releaseApkName: 'proline-oms-app-v1.0_release.apk',
    releaseApkPath: '/proline-oms-app-v1.0_release.apk',
    releaseApkSize: '9.0 MB',
    changes: [
      'POD Verification Reassigned to Billing: Billing Executives verify delivered orders with store stamp directly in POD Queue.',
      'Unverified Exception Routing: Delivery issues (Shortage, Damaged, Good Return) with remarks are routed directly to Sales Admin desk for GRN creation or delivery reattempt.',
      'Super Admin View-Only Mode: Super Admin has complete audit visibility into POD queries without redundant proceed action buttons.',
      'Direct APK Download Hub: Official Release APK package served directly from application repository.'
    ]
  },
  {
    version: 'v2.13.0 (v1.0 Package)',
    releaseTitle: 'PROKAP OMS 360 • v2.13.0 Stable Build',
    releaseDate: '10-Sep-2026, 08:00 PM IST',
    isLatest: false,
    statusBadge: 'PREVIOUS STABLE RELEASE',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    releaseApkName: 'proline-oms-app-v2.13.0_release.apk',
    releaseApkPath: '/proline-oms-app-v2.13.0_release.apk',
    releaseApkSize: '9.0 MB',
    changes: [
      'Direct APK Downloads: Added direct download touchpoints in Login, Header, and Sidebar.',
      'Territory Reconciliation Fix: Resolved false region mismatch errors across 957 cleanly mapped agencies.',
      'Dual-Segment Dashboard Role Scoping: Super Admin sees FMCG & FMCD tabs; standard users see single assigned segment.',
      'FMCG vs FMCD KPI Units: FMCG displays Boxes | PCS metrics while FMCD displays Direct PCS.'
    ]
  }
];

export const SettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { fcmToken, sendTestNotification, webNotificationPermission, requestWebNotificationPermission } = useNotifications();
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopy = (text: string, pathKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPath(pathKey);
      setTimeout(() => setCopiedPath(null), 2000);
    }
  };

  return (
    <div className="page-body" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)' }}>
              <SettingsIcon size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
              System Settings & App Releases
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Download the latest 2 release APK packages, inspect build logs, and test real-time mobile push notifications.
          </p>
        </div>

        {/* Global Direct Download Button */}
        <a
          href="/proline-oms-app-v1.0_release.apk"
          download="proline-oms-app-v1.0_release.apk"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            transition: 'all 0.2s ease'
          }}
          title="Download latest Production APK"
        >
          <Download size={16} /> Download Latest Release (.apk)
        </a>
      </div>

      {/* Environment & System Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Tag size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Installed Version</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>{APP_VERSION}</div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <Database size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Database Engine</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#34d399' }}>Supabase Live DB (Online)</div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Build Timestamp</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>{APP_BUILD_DATETIME}</div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Active Persona</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#c084fc' }}>{currentUser?.full_name || 'Admin'} ({currentUser?.role_name || 'USER'})</div>
          </div>
        </div>

      </div>

      {/* SECTION 1: LAST 2 RELEASE APK PACKAGES */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={18} color="#38bdf8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Recent Release APK Packages (Last 2 Releases)
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {RELEASES_DATA.map((rel, idx) => (
            <div 
              key={rel.version}
              style={{
                background: '#0f172a',
                border: rel.isLatest ? '2px solid rgba(52, 211, 153, 0.5)' : '1px solid #1e293b',
                borderRadius: 14,
                padding: '1.25rem',
                boxShadow: rel.isLatest ? '0 10px 30px -10px rgba(16, 185, 129, 0.2)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent Ribbon for Latest */}
              {rel.isLatest && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #10b981, #38bdf8)' }} />
              )}

              {/* Release Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                      {rel.releaseTitle}
                    </h3>
                    <span style={{ 
                      fontSize: '0.675rem', 
                      fontWeight: 800, 
                      color: rel.badgeColor, 
                      background: rel.badgeBg, 
                      padding: '0.2rem 0.55rem', 
                      borderRadius: 6, 
                      border: `1px solid ${rel.badgeColor}40`,
                      letterSpacing: '0.04em'
                    }}>
                      {rel.statusBadge}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <Clock size={13} /> Release Date: <strong style={{ color: '#cbd5e1' }}>{rel.releaseDate}</strong>
                  </div>
                </div>
              </div>

              {/* Package Download Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.15rem' }}>
                
                {/* 1. Production Release APK */}
                <div style={{ background: '#1e293b', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 10, padding: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                        RELEASE BUILD
                      </span>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>
                        Size: <strong style={{ color: '#f8fafc' }}>{rel.releaseApkSize}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {rel.releaseApkName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                      Optimized, minified release package for field distribution.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <a
                      href={rel.releaseApkPath}
                      download={rel.releaseApkName}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.5rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                      title={`Download ${rel.releaseApkName}`}
                    >
                      <Download size={13} /> Direct Download (.apk)
                    </a>
                    <button
                      onClick={() => handleCopy(window.location.origin + rel.releaseApkPath, rel.releaseApkName)}
                      style={{
                        padding: '0.5rem 0.65rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: copiedPath === rel.releaseApkName ? '#34d399' : '#94a3b8',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}
                      title="Copy Direct Download Link URL"
                    >
                      {copiedPath === rel.releaseApkName ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Release Notes / Highlights */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: '0.75rem 0.85rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Release Highlights & Improvements:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {rel.changes.map((ch, i) => (
                    <li key={i} style={{ fontSize: '0.785rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {ch}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: FIREBASE PUSH NOTIFICATION & FCM DIAGNOSTICS */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Firebase Push Notification Diagnostics
            </h2>
          </div>
          
          <button
            onClick={sendTestNotification}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#ffffff',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)'
            }}
          >
            <Bell size={14} /> Send Instant Test Alert
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.4 }}>
          Real-time order, approval, and dispatch notifications are synced across all devices using Supabase Realtime Broadcast. On mobile Android, Firebase Cloud Messaging (FCM) push notifications are supported.
        </div>

        {/* Web / Browser Desktop Notifications Card */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={14} color="#38bdf8" /> Web & Desktop Notifications
              </div>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: 2 }}>
                Status: <strong style={{ color: webNotificationPermission === 'granted' ? '#34d399' : webNotificationPermission === 'denied' ? '#f43f5e' : '#fbbf24' }}>
                  {webNotificationPermission === 'granted' ? '✅ Enabled (Sound & Popups Active)' : webNotificationPermission === 'denied' ? '❌ Blocked by Browser' : '⚠️ Permission Pending'}
                </strong>
              </div>
            </div>

            {webNotificationPermission !== 'granted' && (
              <button
                onClick={() => requestWebNotificationPermission()}
                style={{
                  padding: '0.35rem 0.85rem',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(56, 189, 248, 0.35)'
                }}
              >
                Enable Notifications Now
              </button>
            )}
          </div>
        </div>

        {/* FCM Registration Token Display */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
              Device FCM Registration Token:
            </span>
            {fcmToken && (
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(fcmToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.55rem',
                  background: copiedToken ? '#10b981' : 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  color: copiedToken ? '#ffffff' : '#38bdf8',
                  borderRadius: 6,
                  fontSize: '0.675rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                {copiedToken ? 'Copied to Clipboard' : 'Copy FCM Token'}
              </button>
            )}
          </div>

          <div style={{ background: '#0f172a', borderRadius: 6, padding: '0.55rem 0.75rem', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.75rem', color: fcmToken ? '#34d399' : '#64748b', wordBreak: 'break-all' }}>
            {fcmToken || 'Open PROKAP OMS 360 on your Android phone to generate and view the live device FCM token.'}
          </div>
        </div>
      </div>

    </div>
  );
};
