import React, { useState, useEffect } from 'react';
import { 
  Package, 
  X, 
  CheckCircle2, 
  Tag, 
  Plus, 
  Layers,
  Sparkles,
  Zap,
  Building2
} from 'lucide-react';
import { Product, Company } from '../types';
import { 
  registerNewProduct, 
  generateNewBarcodeSKUCode, 
  fetchCompaniesFromSupabase,
  saveProductToSupabase,
  supabase,
  generateUuid
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProduct: Product) => void;
}

interface SegmentOption {
  id: string;
  segment_code: string;
  segment_name: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();

  const [segments, setSegments] = useState<SegmentOption[]>([
    { id: 'seg_fmcg', segment_code: 'FMCG', segment_name: 'Fast Moving Consumer Goods' },
    { id: 'seg_fmcd', segment_code: 'FMCD', segment_name: 'Fast Moving Consumer Durables' }
  ]);
  const [selectedSegment, setSelectedSegment] = useState<string>('FMCG');

  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const [autoSkuCode, setAutoSkuCode] = useState('');
  const [productName, setProductName] = useState('');
  const [mrpPrice, setMrpPrice] = useState<number | ''>(150);
  const [unitPrice, setUnitPrice] = useState<number | ''>(120);
  const [pcsPerBox, setPcsPerBox] = useState<number | ''>(24);
  const [category, setCategory] = useState('Biscuits');
  const [stockBoxQty, setStockBoxQty] = useState<number | ''>(100);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Load Segments and Companies on open
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    Promise.all([
      supabase.from('segments').select('*').order('segment_code'),
      fetchCompaniesFromSupabase()
    ]).then(([{ data: segData }, compData]) => {
      if (mounted) {
        if (segData && segData.length > 0) {
          setSegments(segData);
        }
        if (compData && compData.length > 0) {
          setAllCompanies(compData);
          // Initial company filtered by default segment
          const fmcgComps = compData.filter(c => (c.segment || 'FMCG').toUpperCase() === 'FMCG');
          const initialComp = fmcgComps[0] || compData[0];
          if (initialComp) {
            setSelectedCompanyId(initialComp.id);
            setAutoSkuCode(generateNewBarcodeSKUCode(initialComp.company_code || initialComp.company_name));
          }
        }
      }
    });

    return () => { mounted = false; };
  }, [isOpen]);

  // Companies filtered by the selected Segment: Segment > Companies
  const filteredCompanies = allCompanies.filter(c => 
    (c.segment || 'FMCG').toUpperCase() === selectedSegment.toUpperCase()
  );

  // When segment changes, auto-select first matching company
  const handleSegmentChange = (newSeg: string) => {
    setSelectedSegment(newSeg);
    const matching = allCompanies.filter(c => (c.segment || 'FMCG').toUpperCase() === newSeg.toUpperCase());
    const firstComp = matching[0] || allCompanies[0];
    if (firstComp) {
      setSelectedCompanyId(firstComp.id);
      setAutoSkuCode(generateNewBarcodeSKUCode(firstComp.company_code || firstComp.company_name));
    }
  };

  const handleCompanyChange = (compId: string) => {
    setSelectedCompanyId(compId);
    const comp = allCompanies.find(c => c.id === compId);
    if (comp) {
      setAutoSkuCode(generateNewBarcodeSKUCode(comp.company_code || comp.company_name));
    }
  };

  const handleRegenerateCode = () => {
    const comp = allCompanies.find(c => c.id === selectedCompanyId);
    setAutoSkuCode(generateNewBarcodeSKUCode(comp?.company_code || comp?.company_name || 'SKU'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorNotice('Product Name is required!');
      return;
    }
    if (!mrpPrice || Number(mrpPrice) <= 0) {
      setErrorNotice('Please enter a valid MRP price!');
      return;
    }
    if (!pcsPerBox || Number(pcsPerBox) <= 0) {
      setErrorNotice('Please enter a valid Pack Size (PCS per Box)!');
      return;
    }

    const selectedComp = allCompanies.find(c => c.id === selectedCompanyId);

    setErrorNotice(null);
    setIsSubmitting(true);

    const newProd: Product = {
      id: generateUuid(),
      company_id: selectedCompanyId,
      product_code: autoSkuCode,
      product_name: productName.trim(),
      pcs_per_box: Number(pcsPerBox),
      mrp_price: Number(mrpPrice),
      unit_price: Number(unitPrice || mrpPrice),
      category: category.trim() || 'General',
      account_group: selectedComp?.company_name || 'FMCG',
      segment: selectedSegment as any,
      stock_box_qty: Number(stockBoxQty) || 0,
      stock_loose_pcs: 0,
      total_stock_pcs: (Number(stockBoxQty) || 0) * Number(pcsPerBox)
    };

    registerNewProduct(newProd);
    const res = await saveProductToSupabase(newProd);

    setIsSubmitting(false);
    if (!res.success && res.error) {
      setErrorNotice(`Product added locally. Supabase error: ${res.error}`);
    } else {
      setSuccessNotice(`✅ Product "${productName}" added under ${selectedComp?.company_name} (${selectedSegment})!`);
    }

    if (onSuccess) {
      onSuccess(newProd);
    }

    setTimeout(() => {
      onClose();
      setProductName('');
      setMrpPrice(150);
      setUnitPrice(120);
      setPcsPerBox(24);
      setCategory('Biscuits');
      setStockBoxQty(100);
      setSuccessNotice(null);
      setErrorNotice(null);
    }, 1200);
  };

  if (!isOpen) return null;

  const mrpBox = Number(mrpPrice || 0) * Number(pcsPerBox || 0);
  const selectedComp = allCompanies.find(c => c.id === selectedCompanyId);

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 14, 32, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: 680, 
          width: '95vw', 
          maxHeight: '90vh',
          background: '#0f172a', 
          border: '1px solid #38bdf8', 
          borderRadius: 20, 
          padding: 0, 
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #070e20 0%, #0f172a 50%, #1e1b4b 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              boxShadow: 'inset 0 0 12px rgba(56, 189, 248, 0.2)'
            }}>
              <Package size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Add Product SKU
                </h2>
                <span style={{ 
                  fontSize: '0.675rem', 
                  fontWeight: 800, 
                  color: '#34d399', 
                  background: 'rgba(52, 211, 153, 0.15)', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: 6, 
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  textTransform: 'uppercase'
                }}>
                  Hierarchy: Segment ➔ Company ➔ SKU
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Select Segment, map to Company, and register new product SKU.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: 10,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ 
          padding: '1.5rem', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem'
        }}>
          
          {errorNotice && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              borderRadius: 12,
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <X size={16} color="#f43f5e" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div style={{
              padding: '0.85rem 1.15rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              borderRadius: 12,
              fontSize: '0.825rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={20} color="#34d399" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* 1. HIERARCHY ROW: Segment ➔ Company */}
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} /> Step 1: Select Segment ➔ Step 2: Select Company
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.85rem' }}>
              {/* 1A. Segment Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  INDUSTRY SEGMENT <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={selectedSegment}
                  onChange={(e) => handleSegmentChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: '#070e20',
                    border: '1px solid #38bdf8',
                    borderRadius: 10,
                    color: selectedSegment === 'FMCG' ? '#34d399' : '#fbbf24',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                >
                  {segments.map(s => (
                    <option key={s.id} value={s.segment_code} style={{ background: '#0f172a', color: '#fff' }}>
                      {s.segment_code} — {s.segment_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1B. Company Selector (Filtered by Segment) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  COMPANY / BRAND (IN {selectedSegment}) <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: '#070e20',
                    border: '1px solid #38bdf8',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                >
                  {filteredCompanies.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#0f172a', color: '#fff' }}>
                      [{c.company_code}] {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Autogenerated SKU Barcode Display */}
          <div style={{
            padding: '0.75rem 1rem',
            background: '#070e20',
            border: '1px solid #334155',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                Auto SKU ID: <strong style={{ color: '#38bdf8' }}>{autoSkuCode}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleRegenerateCode}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Regenerate
            </button>
          </div>

          {/* 2. Product Name & SKU Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Product Name <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#070e20',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: '0.6rem 0.8rem',
                gap: '0.6rem'
              }}>
                <Package size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="e.g. Butter Delite 100g"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    width: '100%'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Biscuits, Drinks"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: '#070e20',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 3. Pricing & Pack Size Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                MRP per PCS (₹) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="150"
                value={mrpPrice}
                onChange={(e) => setMrpPrice(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: '#070e20',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: 10,
                  color: '#34d399',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Unit Price (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="120"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: '#070e20',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#38bdf8',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Pack Size (PCS/Box) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="24"
                value={pcsPerBox}
                onChange={(e) => setPcsPerBox(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: '#070e20',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
                required
              />
            </div>
          </div>

          {/* Box MRP Summary Visual */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
              Calculated Full Box MRP:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#34d399' }}>
              📦 ₹{mrpBox.toLocaleString()} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({pcsPerBox || 0} Pcs @ ₹{mrpPrice || 0}/Pcs)</span>
            </span>
          </div>

          {/* Action Footer Buttons */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.25rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#94a3b8',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 10,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.6rem',
                fontSize: '0.825rem',
                fontWeight: 800,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #059669, #0d9488)',
                border: 'none',
                borderRadius: 10,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Adding Product...' : 'Add Product SKU'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
