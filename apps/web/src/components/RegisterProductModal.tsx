import React, { useState } from 'react';
import { 
  PlusCircle, 
  X, 
  Building2, 
  CheckCircle2, 
  Boxes, 
  Tag, 
  Plus,
  Layers,
  Save,
  DollarSign
} from 'lucide-react';
import { Product } from '../types';
import { registerNewProduct, MOCK_COMPANIES, generateNewBarcodeSKUCode } from '../lib/supabase';

interface RegisterProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredProduct: Product) => void;
}

export const RegisterProductModal: React.FC<RegisterProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [companyId, setCompanyId] = useState<string>(MOCK_COMPANIES[0]?.id || 'c01');
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(30);
  const [mrpPrice, setMrpPrice] = useState<number>(35);
  const [pcsPerBox, setPcsPerBox] = useState<number>(24);
  const [stockBoxQty, setStockBoxQty] = useState<number>(100);
  const [stockLoosePcs, setStockLoosePcs] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productCode.trim()) return;

    setIsSubmitting(true);

    const newProd = registerNewProduct({
      company_id: companyId,
      product_code: productCode.trim(),
      product_name: productName.trim(),
      pcs_per_box: Number(pcsPerBox),
      unit_price: Number(unitPrice),
      mrp_price: Number(mrpPrice),
      stock_box_qty: Number(stockBoxQty),
      stock_loose_pcs: Number(stockLoosePcs)
    });

    setIsSubmitting(false);
    setSuccessNotice(`New Product SKU "${productName}" registered successfully into warehouse catalog!`);

    if (onSuccess) {
      onSuccess(newProd);
    }

    setTimeout(() => {
      onClose();
      // Reset
      setProductCode('');
      setProductName('');
    }, 1200);
  };

  const calculatedTotalPcs = (Number(stockBoxQty) * Number(pcsPerBox)) + Number(stockLoosePcs);

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
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <PlusCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Register New Product SKU</h2>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Dispatch Manager SKU Registration & Warehouse Inventory Ingestion
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

          {/* Select Brand / Company */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <Building2 size={14} color="#38bdf8" />
              <span>Brand / Manufacturing Company</span>
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
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
            >
              {MOCK_COMPANIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.company_code}) [{c.segment || 'FMCG'}]
                </option>
              ))}
            </select>
          </div>

          {/* SKU Name & SKU Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                Product SKU Name <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Priyagold Choco Delight 200g"
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
                placeholder="e.g. PRG-CHO-200"
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
                Wholesale Price per PCS (₹)
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

          {/* Explicit MRP Breakdown (PCS, BOX, Loose) Card */}
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
                <Tag size={14} /> MRP Pricing Structure Breakdown (PCS, BOX & Loose)
              </span>
              <span style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 600 }}>Auto-Calculated MRP</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', textAlign: 'center' }}>
              <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>1. MRP per PCS</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#34d399' }}>₹{Number(mrpPrice).toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>/ Standard Piece</span>
              </div>

              <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>2. MRP per Full BOX</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#38bdf8' }}>₹{(Number(mrpPrice) * Number(pcsPerBox)).toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>({pcsPerBox} PCS / Box)</span>
              </div>
            </div>
          </div>

          {/* Initial Warehouse Stock Entry */}
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
                <Boxes size={15} /> Initial Warehouse Physical Stock Ingestion
              </span>
              <span style={{ color: '#34d399' }}>Total Initial Stock: {calculatedTotalPcs.toLocaleString()} PCS</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
                Full Boxes Stock Qty
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
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.825rem',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Registering Product...' : 'Register & Add to Catalog'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
