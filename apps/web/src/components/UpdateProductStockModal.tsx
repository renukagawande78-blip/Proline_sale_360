import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  X, 
  CheckCircle2, 
  Tag, 
  Save, 
  Layers,
  Sparkles,
  Package
} from 'lucide-react';
import { Product, PRODUCT_GROUP_NAMES, getGroupCode } from '../types';
import { updateProductStockAndDetails, MOCK_COMPANIES, generateNewBarcodeSKUCode } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UpdateProductStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: (updatedProduct: Product) => void;
}

export const UpdateProductStockModal: React.FC<UpdateProductStockModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [mrpPrice, setMrpPrice] = useState<number>(0);
  const [pcsPerBox, setPcsPerBox] = useState<number>(24);
  const [category, setCategory] = useState<string>('General');
  const [segment, setSegment] = useState<string>('FMCG');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setProductName(product.product_name || '');
      setProductCode(product.product_code || '');
      setMrpPrice(product.mrp_price || (product.unit_price ? Math.round(product.unit_price * 1.15) : 100));
      setPcsPerBox(product.pcs_per_box || 24);
      setCategory(product.category || 'General');
      setSegment(product.segment || 'FMCG');
      setSuccessNotice(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const company = MOCK_COMPANIES.find(c => c.id === product.company_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productCode.trim()) return;

    setIsSubmitting(true);

    const updated = updateProductStockAndDetails(product.id, {
      product_name: productName.trim(),
      product_code: productCode.trim(),
      pcs_per_box: Number(pcsPerBox),
      mrp_price: Number(mrpPrice),
      category: category.trim(),
      segment: segment,
      updated_by: currentUser?.full_name || 'Admin'
    });

    setIsSubmitting(false);
    setSuccessNotice(`Product SKU "${productName}" updated successfully!`);

    if (onSuccess) {
      onSuccess(updated);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const mrpBox = Number(mrpPrice) * Number(pcsPerBox);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: 680, 
          width: '95vw', 
          background: '#0f172a', 
          border: '1px solid #38bdf8', 
          borderRadius: 20, 
          padding: 0, 
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
      >
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Update Product Master SKU</h2>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Configure Product Name, MRP, Pack Size, Category, Group & Segment
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem',
              borderRadius: 10,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {successNotice && (
            <div style={{
              padding: '0.85rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              borderRadius: 12,
              fontSize: '0.825rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{successNotice}</span>
            </div>
          )}

          {/* 1. Product Name & Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                Product Name <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Priyagold Butter Delite Biscuit"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1' }}>
                  SKU Code / Barcode <span style={{ color: '#fb7185' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setProductCode(generateNewBarcodeSKUCode(product?.company_id, productName))}
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
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                required
              />
            </div>
          </div>

          {/* 2. MRP & Pack Size Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.85rem',
            padding: '1rem',
            background: '#141f36',
            borderRadius: 14,
            border: '1px solid #1e293b'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
                MRP per PCS (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={mrpPrice}
                onChange={(e) => setMrpPrice(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: 8,
                  color: '#34d399',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: 4 }}>
                Pack Size (PCS Per Box)
              </label>
              <input
                type="number"
                min="1"
                value={pcsPerBox}
                onChange={(e) => setPcsPerBox(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 8,
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* MRP Box Summary Card */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 800 }}>
              <Tag size={16} />
              <span>MRP Box Rate Summary:</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8' }}>
              📦 Full Box MRP: ₹{mrpBox.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>({pcsPerBox} PCS @ ₹{mrpPrice}/PCS)</span>
            </div>
          </div>

          {/* 3. Product Category & Segment Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: 4 }}>
                Product Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Smart TV, Biscuits, Beverages"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: '#1e293b',
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: 4 }}>
                Segment
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#34d399',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
              >
                <option value="FMCG">FMCG (Consumer Goods)</option>
                <option value="FMCD">FMCD (Consumer Durables)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #1e293b' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.15rem',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: 10,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.6rem 1.4rem',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: 10,
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Product Master'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
