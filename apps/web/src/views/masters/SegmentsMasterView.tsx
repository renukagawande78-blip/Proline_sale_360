import React, { useState } from 'react';
import { Layers, Plus, Trash2, CheckCircle2, Edit3, Building2, Tag } from 'lucide-react';
import { 
  fetchSegmentsFromSupabase, 
  fetchCompaniesFromSupabase,
  saveSegmentToSupabase, 
  deleteSegmentFromSupabase, 
  checkIsSuperAdmin, 
  generateUuid,
  Segment 
} from '../../lib/supabase';
import { Company } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SegmentsMasterViewProps {
  searchQuery: string;
}

const DEFAULT_SEGMENTS: Segment[] = [
  {
    id: 'seg_fmcg',
    segment_code: 'FMCG',
    segment_name: 'Fast Moving Consumer Goods',
    description: 'Biscuits, Beverages, Snacks, Daily Use Products',
    active: true
  },
  {
    id: 'seg_fmcd',
    segment_code: 'FMCD',
    segment_name: 'Fast Moving Consumer Durables',
    description: 'Home Appliances, Electronics, White Goods',
    active: true
  }
];

export const SegmentsMasterView: React.FC<SegmentsMasterViewProps> = ({ searchQuery }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [segments, setSegments] = useState<Segment[]>(DEFAULT_SEGMENTS);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchSegmentsFromSupabase(),
      fetchCompaniesFromSupabase()
    ]).then(([{ segments: liveSegs, error }, liveComps]) => {
      if (mounted) {
        if (liveSegs && liveSegs.length > 0 && !error) {
          setSegments(liveSegs);
        }
        if (liveComps && liveComps.length > 0) {
          setCompanies(liveComps);
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleSaveSegment = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    setIsSaving(true);
    const seg: Segment = {
      id: generateUuid(),
      segment_code: newCode.trim().toUpperCase(),
      segment_name: newName.trim(),
      description: newDesc.trim(),
      active: true
    };

    const res = await saveSegmentToSupabase(seg);
    setSegments(prev => [seg, ...prev]);
    setNewCode(''); setNewName(''); setNewDesc('');
    setIsAdding(false);
    setIsSaving(false);
    showNotice(res.error
      ? `Segment "${seg.segment_code}" saved locally! (Supabase Error: ${res.error})`
      : `✅ Segment "${seg.segment_code} – ${seg.segment_name}" saved to Supabase!`
    );
  };

  const handleToggleActive = async (seg: Segment) => {
    const updated = { ...seg, active: !seg.active };
    setSegments(prev => prev.map(s => s.id === seg.id ? updated : s));
    const res = await saveSegmentToSupabase(updated);
    if (!res.success && res.error) {
      showNotice(`⚠️ Supabase Error: ${res.error}`);
    } else {
      showNotice(`Segment "${seg.segment_code}" marked ${updated.active ? 'Active' : 'Inactive'}`);
    }
  };

  const handleDelete = async (seg: Segment) => {
    if (!window.confirm(`Delete segment "${seg.segment_code}"? This cannot be undone.`)) return;
    setSegments(prev => prev.filter(s => s.id !== seg.id));
    const res = await deleteSegmentFromSupabase(seg.id);
    if (!res.success && res.error) {
      showNotice(`⚠️ Failed to delete from Supabase: ${res.error}`);
    } else {
      showNotice(`Segment "${seg.segment_code}" deleted.`);
    }
  };

  const handleEdit = async (seg: Segment) => {
    const newName = window.prompt('Update Segment Name:', seg.segment_name);
    if (!newName) return;
    const updated = { ...seg, segment_name: newName.trim() };
    setSegments(prev => prev.map(s => s.id === seg.id ? updated : s));
    const res = await saveSegmentToSupabase(updated);
    if (!res.success && res.error) {
      showNotice(`⚠️ Failed to update in Supabase: ${res.error}`);
    } else {
      showNotice(`✅ Segment "${seg.segment_code}" updated in Supabase!`);
    }
  };

  const filtered = segments.filter(s =>
    s.segment_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.segment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
          Industry Segments ({filtered.length})
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid #10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={13} /> Add New Segment
          </button>
        )}
      </div>

      {/* Notice Banner */}
      {noticeMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#34d399', padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.825rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {noticeMsg}
        </div>
      )}

      {/* Add Segment Form */}
      {isAdding && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.85rem' }}>➕ New Industry Segment</div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ flex: '0 0 120px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>CODE *</label>
              <input
                type="text"
                placeholder="e.g. FMCG"
                value={newCode}
                maxLength={10}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem', fontWeight: 800 }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>SEGMENT NAME *</label>
              <input
                type="text"
                placeholder="e.g. Fast Moving Consumer Goods"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ flex: '2 1 280px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>DESCRIPTION</label>
              <input
                type="text"
                placeholder="e.g. Biscuits, Beverages, Snacks..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => { setIsAdding(false); setNewCode(''); setNewName(''); setNewDesc(''); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSaveSegment}
              disabled={isSaving || !newCode.trim() || !newName.trim()}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
            >
              {isSaving ? 'Saving...' : '✓ Save Segment'}
            </button>
          </div>
        </div>
      )}

      {/* Segments Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Segment Code</th>
              <th>Segment Name</th>
              <th>Assigned Companies / Brands</th>
              <th>Description</th>
              <th>Status</th>
              {isSuperAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((seg, idx) => {
              const segCompanies = companies.filter(c => (c.segment || '').toUpperCase() === seg.segment_code.toUpperCase());

              return (
                <tr key={seg.id} style={{ opacity: seg.active ? 1 : 0.55 }}>
                  <td><strong style={{ color: '#38bdf8' }}>{idx + 1}</strong></td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: seg.segment_code === 'FMCG'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                      border: `1px solid ${seg.segment_code === 'FMCG' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      color: seg.segment_code === 'FMCG' ? '#34d399' : '#fbbf24',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 8,
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      letterSpacing: '0.05em'
                    }}>
                      <Layers size={13} />
                      {seg.segment_code}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{seg.segment_name}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          color: seg.segment_code === 'FMCG' ? '#34d399' : '#fbbf24',
                          background: seg.segment_code === 'FMCG' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {segCompanies.length} {segCompanies.length === 1 ? 'Company' : 'Companies'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: 450 }}>
                        {segCompanies.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No companies currently mapped</span>
                        ) : (
                          segCompanies.map(c => {
                            const brandColor = (c as any).brand_color || (seg.segment_code === 'FMCG' ? '#10b981' : '#f59e0b');
                            return (
                              <span
                                key={c.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  background: '#1e293b',
                                  border: '1px solid #334155',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: 6,
                                  fontSize: '0.72rem',
                                  color: '#f8fafc',
                                  fontWeight: 700
                                }}
                              >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: brandColor }} />
                                <span>{c.company_name}</span>
                                <code style={{ color: '#94a3b8', fontSize: '0.68rem' }}>[{c.company_code}]</code>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{seg.description || '—'}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(seg)}
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
                        background: seg.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: seg.active ? '#34d399' : '#fb7185',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: seg.active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
                      }}
                    >
                      {seg.active ? '● ACTIVE' : '○ INACTIVE'}
                    </button>
                  </td>
                {isSuperAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEdit(seg)}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(seg)}
                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Trash2 size={13} /> Delete
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
    </>
  );
};
