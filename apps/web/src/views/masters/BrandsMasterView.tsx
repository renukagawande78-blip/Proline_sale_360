import React, { useState } from 'react';
import { Building2, Tag, Layers, Zap, ShoppingBag, FileSpreadsheet, Edit3, Trash2 } from 'lucide-react';
import { Company, SegmentType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { downloadSampleCSV } from '../../lib/masterImportExport';
import { BulkImportModal } from '../../components/BulkImportModal';
import { checkIsSuperAdmin, deleteCompanyFromSupabase, saveCompanyToSupabase } from '../../lib/supabase';

interface BrandsMasterViewProps {
  companies: Company[];
  searchQuery: string;
}

export const BrandsMasterView: React.FC<BrandsMasterViewProps> = ({ companies, searchQuery }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | SegmentType>('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localCompanies, setLocalCompanies] = useState<Company[]>(companies);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleDeleteBrand = async (companyId: string, companyName: string) => {
    if (window.confirm(`Are you sure you want to delete Brand Master "${companyName}"? This action is restricted to Super Admin authority.`)) {
      setLocalCompanies(prev => prev.filter(c => c.id !== companyId));
      await deleteCompanyFromSupabase(companyId);
      setFeedbackMsg(`Deleted brand "${companyName}" from Supabase!`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleEditBrand = async (c: Company) => {
    const newName = window.prompt(`Update Brand / Company Name for ${c.company_code}:`, c.company_name);
    if (newName === null) return;
    const isFmcgChoice = window.confirm(`Set Segment to FMCG? Click OK for FMCG, Cancel for FMCD. (Current: ${c.segment || 'FMCG'})`);
    const newSegment: SegmentType = isFmcgChoice ? 'FMCG' : 'FMCD';

    const updated: Company = { 
      ...c, 
      company_name: newName.trim() || c.company_name,
      segment: newSegment
    };

    setLocalCompanies(prev => prev.map(item => item.id === c.id ? updated : item));
    const res = await saveCompanyToSupabase(updated);
    if (res.success) {
      setFeedbackMsg(`Updated "${updated.company_name}" (${updated.segment}) in Supabase database!`);
    } else {
      setFeedbackMsg(`Updated locally! (Supabase notice: ${res.error})`);
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleAddNewBrand = async () => {
    const name = window.prompt('Enter New Brand Company Name (e.g. Acme FMCG):');
    if (!name || !name.trim()) return;
    const code = window.prompt('Enter Brand Code (e.g. ACME):', name.slice(0, 4).toUpperCase());
    if (!code || !code.trim()) return;
    const segment = window.confirm('Click OK for FMCG, Cancel for FMCD') ? 'FMCG' : 'FMCD';

    const newCompany: Company = {
      id: 'c_' + Date.now(),
      company_code: code.trim().toUpperCase(),
      company_name: name.trim(),
      handle: code.trim().toUpperCase(),
      segment: segment as SegmentType
    };

    setLocalCompanies(prev => [...prev, newCompany]);
    const res = await saveCompanyToSupabase(newCompany);
    if (res.success) {
      setFeedbackMsg(`New Brand "${newCompany.company_name}" saved to Supabase!`);
    } else {
      setFeedbackMsg(`New Brand created! (Supabase notice: ${res.error})`);
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const activeCompanies = localCompanies.length > 0 ? localCompanies : companies;

  const filteredCompanies = activeCompanies.filter(c => {
    if (selectedSegment !== 'ALL' && c.segment !== selectedSegment) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(q) ||
      c.company_code.toLowerCase().includes(q) ||
      (c.segment || '').toLowerCase().includes(q)
    );
  });

  const fmcgCount = companies.filter(c => c.segment === 'FMCG').length;
  const fmcdCount = companies.filter(c => c.segment === 'FMCD').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Segment Filter & Stats Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#141f36',
        padding: '0.65rem 0.85rem',
        borderRadius: '14px',
        border: '1px solid #1e293b'
      }}>
        {/* Segmented Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#0b1329', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedSegment('ALL')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedSegment === 'ALL' ? '#38bdf8' : 'transparent',
              color: selectedSegment === 'ALL' ? '#090d16' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Segments ({companies.length})
          </button>

          <button
            onClick={() => setSelectedSegment('FMCG')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedSegment === 'FMCG' ? '#10b981' : 'transparent',
              color: selectedSegment === 'FMCG' ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={13} /> FMCG ({fmcgCount})
          </button>

          <button
            onClick={() => setSelectedSegment('FMCD')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedSegment === 'FMCD' ? '#fbbf24' : 'transparent',
              color: selectedSegment === 'FMCD' ? '#090d16' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={13} /> FMCD ({fmcdCount})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleAddNewBrand}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.775rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Building2 size={14} /> + Register New Brand
          </button>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            Segment Scope: <strong style={{ color: '#38bdf8' }}>{selectedSegment === 'ALL' ? 'FMCG & FMCD Brands' : selectedSegment}</strong>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.825rem', fontWeight: 700 }}>
          {feedbackMsg}
        </div>
      )}

      {/* Brand Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand Code</th>
              <th>Company Name</th>
              <th>Industry Segment</th>
              <th>Segment Description</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map(c => {
              const isFmcg = c.segment === 'FMCG';
              return (
                <tr key={c.id}>
                  <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{c.company_code}</code></td>
                  <td><strong style={{ color: '#f8fafc' }}>{c.company_name}</strong></td>
                  <td>
                    <select
                      value={c.segment || 'FMCG'}
                      onChange={async (e) => {
                        const newSegment = e.target.value as SegmentType;
                        const updated = { ...c, segment: newSegment };
                        setLocalCompanies(prev => prev.map(item => item.id === c.id ? updated : item));
                        const res = await saveCompanyToSupabase(updated);
                        if (res.success) {
                          setFeedbackMsg(`Updated Segment to "${newSegment}" for ${c.company_name} in Supabase!`);
                        } else {
                          setFeedbackMsg(`Segment updated locally! (Supabase notice: ${res.error})`);
                        }
                        setTimeout(() => setFeedbackMsg(null), 3000);
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                        background: isFmcg ? '#064e3b' : '#78350f',
                        color: isFmcg ? '#34d399' : '#fbbf24',
                        border: isFmcg ? '1px solid #10b981' : '1px solid #f59e0b',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="FMCG">🛒 FMCG (Fast-Moving Goods)</option>
                      <option value="FMCD">⚡ FMCD (Durables & Electronics)</option>
                    </select>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {isFmcg ? 'Fast-Moving Consumer Goods (Food, Confectionery & Beverage)' : 'Fast-Moving Consumer Durables (Electronics, Appliances & Cooling)'}
                    </span>
                  </td>
                  <td><span className="status-badge status-APPROVED">ACTIVE</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEditBrand(c)}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Edit3 size={13} /> Edit Brand
                      </button>
                      {isSuperAdmin && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteBrand(c.id, c.company_name)}
                          title="Super Admin Authority: Delete brand master record"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="companies"
      />
    </div>
  );
};
