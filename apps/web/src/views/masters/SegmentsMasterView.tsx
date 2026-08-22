import React, { useState, useEffect } from 'react';
import { Layers, Building2, Tag, CheckCircle2, ShieldCheck, Zap, Package, RefreshCw } from 'lucide-react';
import { fetchCompaniesFromSupabase } from '../../lib/supabase';
import { Company, IndustrySegment } from '../../types';

interface SegmentsMasterViewProps {
  searchQuery: string;
}

interface SegmentMeta {
  code: IndustrySegment;
  title: string;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
  iconBg: string;
  description: string;
  businessModel: string;
  defaultPackRule: string;
  pricingRule: string;
}

const SYSTEM_SEGMENTS: SegmentMeta[] = [
  {
    code: IndustrySegment.FMCG,
    title: 'Fast Moving Consumer Goods',
    badgeColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    description: 'High-velocity consumables, packaged food, beverages, biscuits, confectionery & confectionery items.',
    businessModel: 'Volume-driven distribution with master carton / box quantities (multi-piece packing).',
    defaultPackRule: 'Standard 24 / 48 / 96 pieces per outer carton box.',
    pricingRule: 'Dealer Rate calculated per Box with Trade Scheme discounts.'
  },
  {
    code: IndustrySegment.FMCD,
    title: 'Fast Moving Consumer Durables',
    badgeColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
    iconBg: 'rgba(56, 189, 248, 0.15)',
    description: 'Home appliances, LED Smart TVs, Air Conditioners, refrigerators & consumer electronics.',
    businessModel: 'Value-driven unit distribution with individual serial numbers, warranty barcodes & direct party billing.',
    defaultPackRule: 'Standard 1 unit per box (Unit-based dispatch tracking).',
    pricingRule: 'Dealer Rate with special project incentives and warranty coverage.'
  }
];

export const SegmentsMasterView: React.FC<SegmentsMasterViewProps> = ({ searchQuery }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const comps = await fetchCompaniesFromSupabase();
    if (comps) setCompanies(comps);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSegments = SYSTEM_SEGMENTS.filter(s =>
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* System Enum Status Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 14,
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                System Core Enum: <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.4rem', borderRadius: 6 }}>IndustrySegment</code>
              </span>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Active System Schema
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Standardized hardcoded system enums (<code style={{ color: '#cbd5e1' }}>'FMCG' | 'FMCD'</code>) eliminate redundant database queries while ensuring 100% type safety and performance across all orders, products, and brand companies.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.9rem',
            background: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid #475569',
            borderRadius: 8,
            color: '#cbd5e1',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Brands
        </button>
      </div>

      {/* Segments Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {filteredSegments.map(seg => {
          const assignedCompanies = companies.filter(c => (c.segment || 'FMCG').toUpperCase() === seg.code);

          return (
            <div
              key={seg.code}
              style={{
                background: seg.bgGradient,
                border: `1px solid ${seg.borderColor}`,
                borderRadius: 16,
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: seg.iconBg,
                    border: `1px solid ${seg.badgeColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: seg.badgeColor
                  }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                        {seg.code}
                      </h3>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 20,
                        background: `${seg.badgeColor}20`,
                        color: seg.badgeColor,
                        border: `1px solid ${seg.badgeColor}40`
                      }}>
                        {assignedCompanies.length} Active Brand{assignedCompanies.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginTop: '0.15rem' }}>
                      {seg.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {seg.description}
              </p>

              {/* Business Rules Summary */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(51, 65, 85, 0.4)',
                borderRadius: 10,
                padding: '0.75rem 0.9rem',
                fontSize: '0.76rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>📦 Packing Rule:</span>
                  <span style={{ fontWeight: 600 }}>{seg.defaultPackRule}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>💰 Pricing Logic:</span>
                  <span style={{ fontWeight: 600 }}>{seg.pricingRule}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>🏢 Operating Model:</span>
                  <span style={{ fontWeight: 600 }}>{seg.businessModel}</span>
                </div>
              </div>

              {/* Assigned Brands Grid */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={14} color={seg.badgeColor} />
                  Assigned Companies & Brands ({assignedCompanies.length})
                </div>

                {assignedCompanies.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    No companies assigned to {seg.code} yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {assignedCompanies.map(comp => (
                      <div
                        key={comp.id}
                        style={{
                          background: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          padding: '0.35rem 0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#f8fafc'
                        }}
                      >
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 4,
                          background: `${seg.badgeColor}25`,
                          color: seg.badgeColor,
                          fontWeight: 800
                        }}>
                          {comp.company_code || comp.company_name.slice(0, 2).toUpperCase()}
                        </span>
                        {comp.company_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
