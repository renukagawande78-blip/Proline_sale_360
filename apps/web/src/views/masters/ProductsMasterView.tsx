import React, { useState } from 'react';
import { Package, Edit3, History, ArrowUpRight, Tag, Boxes, Layers } from 'lucide-react';
import { Product, Company } from '../../types';
import { UpdateProductStockModal } from '../../components/UpdateProductStockModal';

interface ProductsMasterViewProps {
  products: Product[];
  companies: Company[];
  searchQuery: string;
}

export const ProductsMasterView: React.FC<ProductsMasterViewProps> = ({ products, companies, searchQuery }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  const filteredProducts = (localProducts.length > 0 ? localProducts : products).filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <UpdateProductStockModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onSuccess={(updated) => {
          setLocalProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        }}
      />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>Product Description</th>
              <th>Company Brand</th>
              <th>Pack Size</th>
              <th>MRP Pricing Structure (PCS, BOX & Loose)</th>
              <th>Wholesale Rate (₹)</th>
              <th>MRP Revision Audit</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const parentComp = companies.find(c => c.id === p.company_id);
              const currentMrp = p.mrp_price || Math.round(p.unit_price * 1.15);
              const mrpBox = currentMrp * (p.pcs_per_box || 1);
              const hasMrpRevised = !!p.previous_mrp && p.previous_mrp !== currentMrp;

              return (
                <tr key={p.id}>
                  <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{p.product_code}</code></td>
                  <td><strong style={{ color: '#f8fafc' }}>{p.product_name}</strong></td>
                  <td><span style={{ color: '#fbbf24', fontWeight: 700 }}>{parentComp?.company_name || 'General'}</span></td>
                  <td><span style={{ color: '#38bdf8', fontWeight: 700 }}>{p.pcs_per_box} pcs/box</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
                        ₹{currentMrp.toLocaleString()} <span style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 600 }}>/ PCS</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#38bdf8' }}>
                        📦 Box MRP: ₹{mrpBox.toLocaleString()} <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>({p.pcs_per_box} Pcs)</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24' }}>
                        🏷️ Loose MRP: ₹{currentMrp.toLocaleString()} / Loose Pc
                      </div>
                    </div>
                  </td>
                  <td><span style={{ color: '#cbd5e1', fontWeight: 700 }}>₹{p.unit_price.toLocaleString()}</span></td>
                  <td>
                    {hasMrpRevised ? (
                      <span 
                        style={{ fontSize: '0.675rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '0.15rem 0.55rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        title={`MRP revised from ₹${p.previous_mrp} to ₹${currentMrp} by ${p.mrp_updated_by || 'Admin'}`}
                      >
                        <History size={12} /> ₹{p.previous_mrp} ➔ ₹{currentMrp}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Standard Price</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => setSelectedProduct(p)}
                      style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Edit3 size={13} /> Update Details & MRP
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
