import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  X, 
  DollarSign, 
  CheckCircle2, 
  Tag, 
  Save, 
  History,
  FileText,
  Building2,
  Package
} from 'lucide-react';
import { Product } from '../types';
import { updateProductStockAndDetails, MOCK_COMPANIES } from '../lib/supabase';
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
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [mrpPrice, setMrpPrice] = useState<number>(0);
  const [pcsPerBox, setPcsPerBox] = useState<number>(24);
  const [stockBoxQty, setStockBoxQty] = useState<number>(0);
  const [stockLoosePcs, setStockLoosePcs] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setProductName(product.product_name || '');
      setProductCode(product.product_code || '');
      setUnitPrice(product.unit_price || 0);
      setMrpPrice(product.mrp_price || Math.round(product.unit_price * 1.15) || 0);
      setPcsPerBox(product.pcs_per_box || 24);
      setStockBoxQty(product.stock_box_qty || 100);
      setStockLoosePcs(product.stock_loose_pcs || 0);
      setReason('');
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
      unit_price: Number(unitPrice),
      mrp_price: Number(mrpPrice),
      stock_box_qty: Number(stockBoxQty),
      stock_loose_pcs: Number(stockLoosePcs),
      reason: reason.trim() || 'Inventory stock & MRP update',
      updated_by: currentUser?.full_name || 'Dispatch Manager'
    });

    setIsSubmitting(false);
    setSuccessNotice(`Warehouse stock & MRP for "${productName}" updated successfully!`);

    if (onSuccess) {
      onSuccess(updated);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const calculatedTotalPcs = (Number(stockBoxQty) * Number(pcsPerBox)) + Number(stockLoosePcs);
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
              <Boxes size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Update Product Details & MRP</h2>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Dispatch Manager Stock Management | Brand: <strong style={{ color: '#fbbf24' }}>{company?.company_name || 'General'}</strong>
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

          {/* Product Name & Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                Product SKU Description <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                SKU Item Code <span style={{ color: '#fb7185' }}>*</span>
              </label>
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

          {/* Pricing & Pack Size Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.85rem',
            padding: '1rem',
            background: '#141f36',
            borderRadius: 14,
            border: '1px solid #1e293b'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
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
                  padding: '0.5rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: 8,
                  color: '#34d399',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
                Wholesale Rate per PCS (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#38bdf8', marginBottom: 4 }}>
                PCS Per Box (Pack Size)
              </label>
              <input
                type="number"
                min="1"
                value={pcsPerBox}
                onChange={(e) => setPcsPerBox(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 8,
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* MRP Breakdown Card */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.9), rgba(16, 185, 129, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#34d399' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={14} /> Updated MRP Structure (PCS, BOX & Loose)
              </span>
              <span style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 600 }}>Live MRP Summary</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', textAlign: 'center' }}>
              <div style={{ background: '#0f172a', padding: '0.5rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>1. MRP per PCS</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#34d399' }}>₹{Number(mrpPrice).toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>/ Piece</span>
              </div>

              <div style={{ background: '#0f172a', padding: '0.5rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>2. MRP per Full BOX</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#38bdf8' }}>₹{mrpBox.toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>({pcsPerBox} PCS / Box)</span>
              </div>

              <div style={{ background: '#0f172a', padding: '0.5rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>3. MRP per Loose PCS</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fbbf24' }}>₹{Number(mrpPrice).toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>/ Loose Piece</span>
              </div>
            </div>
          </div>

          {/* Physical Inventory Stock Level */}
          <div style={{
            padding: '1rem',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', fontWeight: 800, color: '#38bdf8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Boxes size={15} /> Physical Warehouse Stock Level
              </span>
              <span style={{ color: '#34d399' }}>Total Physical Stock: {calculatedTotalPcs.toLocaleString()} PCS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
                  Full Boxes Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockBoxQty}
                  onChange={(e) => setStockBoxQty(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
                  Loose PCS Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockLoosePcs}
                  onChange={(e) => setStockLoosePcs(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Revision Reason / Audit Note */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
              <FileText size={14} color="#6366f1" />
              <span>MRP Revision / Audit Log Reason (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Raw material price surge adjustment / Company price revision memo #421"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Previous MRP Revision Audit Trail (if exists) */}
          {product.mrp_history && product.mrp_history.length > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#141f36',
              borderRadius: 12,
              border: '1px solid #1e293b',
              fontSize: '0.75rem'
            }}>
              <div style={{ fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 4 }}>
                <History size={13} /> MRP Audit History Trail ({product.mrp_history.length} Revisions)
              </div>
              <div style={{ color: '#94a3b8' }}>
                Latest: ₹{product.mrp_history[0].previous_mrp} ➔ ₹{product.mrp_history[0].new_mrp} by <strong>{product.mrp_history[0].updated_by}</strong> on {product.mrp_history[0].updated_at.substring(0, 10)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #1e293b' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.15rem',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.8rem',
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.35rem',
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.825rem',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Saving Product Details...' : 'Save Product Details & MRP'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
