import React, { useState } from 'react';
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
import { Product, PRODUCT_GROUP_NAMES, getGroupCode } from '../types';
import { registerNewProduct, generateNewBarcodeSKUCode, MOCK_COMPANIES, saveProductToSupabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProduct: Product) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  
  const [accountGroup, setAccountGroup] = useState<string>('AKAI');

  // Auto-generate Product ID / SKU Code on modal open (e.g. AK_SKU_001)
  const [autoSkuCode, setAutoSkuCode] = useState(() => 
    generateNewBarcodeSKUCode('AKAI')
  );

  const [productName, setProductName] = useState('');
  const [mrpPrice, setMrpPrice] = useState<number | ''>(150);
  const [pcsPerBox, setPcsPerBox] = useState<number | ''>(24);
  const [category, setCategory] = useState('Biscuits');
  const [segment, setSegment] = useState('FMCG');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegenerateCode = () => {
    setAutoSkuCode(generateNewBarcodeSKUCode(accountGroup));
  };

  const handleGroupChange = (newGroup: string) => {
    setAccountGroup(newGroup);
    setAutoSkuCode(generateNewBarcodeSKUCode(newGroup));
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    setErrorNotice(null);
    setIsSubmitting(true);

    const newProd = registerNewProduct({
      company_id: MOCK_COMPANIES[0]?.id || 'c01',
      product_code: autoSkuCode,
      product_name: productName.trim(),
      pcs_per_box: Number(pcsPerBox),
      mrp_price: Number(mrpPrice),
      category: category.trim() || 'General',
      account_group: accountGroup,
      segment: segment,
      unit_price: Number(mrpPrice)
    });

    saveProductToSupabase(newProd);

    setIsSubmitting(false);
    setSuccessNotice(`New Product "${productName}" registered with Auto ID ${autoSkuCode}!`);

    if (onSuccess) {
      onSuccess(newProd);
    }

    setTimeout(() => {
      onClose();
      // Reset form
      setProductName('');
      setMrpPrice(150);
      setPcsPerBox(24);
      setCategory('Biscuits');
      setAccountGroup('FMCG');
      setSegment('FMCG');
      setAutoSkuCode(generateNewBarcodeSKUCode('c01', `PRD-${Date.now().toString().slice(-4)}`));
      setSuccessNotice(null);
      setErrorNotice(null);
    }, 1200);
  };

  const mrpBox = Number(mrpPrice || 0) * Number(pcsPerBox || 0);

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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  Add Product Master SKU
                </h2>
                <span style={{ 
                  fontSize: '0.675rem', 
                  fontWeight: 800, 
                  color: '#34d399', 
                  background: 'rgba(52, 211, 153, 0.15)', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: 6, 
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  New Master Item
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Enter product details. Product SKU ID & Barcode is automatically generated.
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
          gap: '1.25rem'
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

          {/* Autogenerated Product ID / SKU Code Badge */}
          <div style={{
            padding: '0.85rem 1.15rem',
            background: 'linear-gradient(135deg, rgba(7, 14, 32, 0.9), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Autogenerated Product SKU ID & Barcode</span>
                  <Zap size={13} color="#f59e0b" />
                </div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: 2 }}>
                  Automatically generated system SKU code
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 900,
                background: '#070e20',
                color: '#38bdf8',
                border: '1px solid #334155',
                fontFamily: 'monospace'
              }}>
                {autoSkuCode}
              </code>
              <button
                type="button"
                onClick={handleRegenerateCode}
                title="Regenerate new barcode SKU code"
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: 8,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  cursor: 'pointer'
                }}
              >
                ⚡ Refresh
              </button>
            </div>
          </div>

          {/* 1. Product Name & SKU Code */}
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
                  placeholder="e.g. Priyagold Butter Delite 100g"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                  SKU Code / Barcode <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 6,
                    fontSize: '0.675rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Regenerate barcode SKU code"
                >
                  ⚡ Barcode
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#070e20',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: '0.6rem 0.8rem'
              }}>
                <input
                  type="text"
                  value={autoSkuCode}
                  onChange={(e) => setAutoSkuCode(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    width: '100%'
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. MRP & Pack Size Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                MRP per PCS (₹) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#070e20',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: 10,
                padding: '0.6rem 0.8rem',
                gap: '0.6rem'
              }}>
                <Tag size={16} color="#34d399" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="150"
                  value={mrpPrice}
                  onChange={(e) => setMrpPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#34d399',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    width: '100%'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Pack Size (PCS Per Box) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#070e20',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 10,
                padding: '0.6rem 0.8rem',
                gap: '0.6rem'
              }}>
                <Layers size={16} color="#38bdf8" />
                <input
                  type="number"
                  min="1"
                  placeholder="24"
                  value={pcsPerBox}
                  onChange={(e) => setPcsPerBox(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#38bdf8',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    width: '100%'
                  }}
                  required
                />
              </div>
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

          {/* 3. Product Category, Group Name & Segment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Product Category
              </label>
              <input
                type="text"
                placeholder="e.g. Biscuits, Beverages"
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                  Group Name
                </label>
                <span style={{ fontSize: '0.675rem', fontWeight: 900, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.1rem 0.4rem', borderRadius: 5 }}>
                  Code: {getGroupCode(accountGroup)}
                </span>
              </div>
              <select
                value={accountGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: '#070e20',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#fbbf24',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
              >
                {PRODUCT_GROUP_NAMES.map(b => (
                  <option key={b} value={b} style={{ background: '#0f172a', color: '#fff' }}>{b} ({getGroupCode(b)})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Segment
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: '#070e20',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#34d399',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
              >
                <option value="FMCG" style={{ background: '#0f172a', color: '#fff' }}>FMCG</option>
                <option value="FMCD" style={{ background: '#0f172a', color: '#fff' }}>FMCD</option>
              </select>
            </div>
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
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.2s ease'
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
