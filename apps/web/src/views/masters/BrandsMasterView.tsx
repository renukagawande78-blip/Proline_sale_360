import React, { useState } from 'react';
import { Building2, Tag, Layers, Zap, ShoppingBag } from 'lucide-react';
import { Company, SegmentType } from '../../types';

interface BrandsMasterViewProps {
  companies: Company[];
  searchQuery: string;
}

export const BrandsMasterView: React.FC<BrandsMasterViewProps> = ({ companies, searchQuery }) => {
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | SegmentType>('ALL');

  const filteredCompanies = companies.filter(c => {
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
        <div style={{ display: 'flex', gap: '0.35rem', background: '#0b1329', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
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

        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
          Segment Scope: <strong style={{ color: '#38bdf8' }}>{selectedSegment === 'ALL' ? 'FMCG & FMCD Brands' : selectedSegment}</strong>
        </div>
      </div>

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
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: isFmcg ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: isFmcg ? '#34d399' : '#fbbf24',
                      border: isFmcg ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                      {isFmcg ? <ShoppingBag size={12} /> : <Zap size={12} />}
                      {c.segment || 'FMCG'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {isFmcg ? 'Fast-Moving Consumer Goods (Food, Confectionery & Beverage)' : 'Fast-Moving Consumer Durables (Electronics, Appliances & Cooling)'}
                    </span>
                  </td>
                  <td><span className="status-badge status-APPROVED">ACTIVE</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
