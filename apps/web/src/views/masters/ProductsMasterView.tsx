import React, { useState } from 'react';
import { Package, Edit3, History, ArrowUpRight, Tag, Boxes, Layers, FileSpreadsheet, Trash2, QrCode, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { Product, Company } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UpdateProductStockModal } from '../../components/UpdateProductStockModal';
import { AddProductModal } from '../../components/AddProductModal';
import { BulkImportModal } from '../../components/BulkImportModal';
import { downloadSampleCSV, exportMasterCSV } from '../../lib/masterImportExport';
import { generateNewBarcodeSKUCode, checkIsSuperAdmin, deleteProductFromSupabase, fetchProductsFromSupabase, deduplicateProducts, MOCK_PRODUCTS } from '../../lib/supabase';

interface ProductsMasterViewProps {
  products: Product[];
  companies: Company[];
  searchQuery: string;
}

export const ProductsMasterView: React.FC<ProductsMasterViewProps> = ({ products, companies, searchQuery }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (products && products.length > 0) {
      setLocalProducts(prev => deduplicateProducts([...prev, ...products, ...MOCK_PRODUCTS]));
    }
  }, [products]);

  const handleSyncLiveProducts = async () => {
    setIsSyncing(true);
    const liveProds = await fetchProductsFromSupabase();
    if (liveProds && liveProds.length > 0) {
      setLocalProducts(deduplicateProducts([...liveProds, ...MOCK_PRODUCTS]));
      setSuccessNotice("🔄 Synced latest product SKUs directly from live Supabase `products` table!");
      setTimeout(() => setSuccessNotice(null), 3500);
    }
    setIsSyncing(false);
  };


  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete Product SKU "${productName}"? This action is restricted to Super Admin authority.`)) {
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      await deleteProductFromSupabase(productId);
    }
  };


  const handleRegenerateSingleBarcode = (prod: Product) => {
    const newBarcode = generateNewBarcodeSKUCode(prod?.company_id, prod?.product_name || '');
    setLocalProducts(prev => prev.map(p => p.id === prod.id ? { ...p, product_code: newBarcode } : p));
  };

  const handleRegenerateAllBarcodes = () => {
    if (window.confirm("⚠️ REGENERATE ALL BARCODES: Are you sure you want to regenerate new barcode SKU codes for all products?")) {
      setLocalProducts(prev => prev.map(p => ({
        ...p,
        product_code: generateNewBarcodeSKUCode(p?.company_id, p?.product_name || '')
      })));
    }
  };

  const filteredProducts = (localProducts.length > 0 ? localProducts : products).filter(p => {
    if (!p) return false;
    const name = p.product_name || '';
    const code = p.product_code || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  return (
    <>
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newP) => {
          setLocalProducts(prev => deduplicateProducts([newP, ...prev]));
          setSuccessNotice(`✅ New Product SKU "${newP.product_name}" (${newP.product_code}) saved & synced to live Supabase database!`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />

      <UpdateProductStockModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onSuccess={(updated) => {
          setLocalProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        }}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="products"
        onImportSuccess={(newRows) => {
          setLocalProducts(prev => [...(newRows as Product[]), ...prev]);
        }}
      />

      {successNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {successNotice}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleSyncLiveProducts}
          disabled={isSyncing}
          title="Fetch latest product SKUs directly from live Supabase products database table"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            fontWeight: 800,
            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: isSyncing ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} /> {isSyncing ? 'Syncing...' : '🔄 Sync Live DB'}
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          title="Add a new Product SKU master item with autogenerated ID"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.15rem',
            background: 'linear-gradient(135deg, #059669, #0d9488)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.825rem',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          <Plus size={16} /> + Add New Product SKU
        </button>
        <button
          onClick={handleRegenerateAllBarcodes}
          title="Regenerate standard barcode SKU codes for all products"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontWeight: 800,

            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} /> ⚡ Regenerate All Barcode SKUs
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>Product Name</th>
              <th>MRP (₹)</th>
              <th>Pack Size</th>
              <th>Product Category</th>
              <th>Group Name</th>
              <th>Segment</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, idx) => {
              const currentMrp = p.mrp_price || (p.unit_price ? Math.round(p.unit_price * 1.15) : 100);
              const mrpBox = currentMrp * (p.pcs_per_box || 1);

              return (
                <tr key={p?.id || idx}>
                  <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{p?.product_code || 'N/A'}</code></td>
                  <td><strong style={{ color: '#f8fafc' }}>{p?.product_name || 'Unnamed Product'}</strong></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
                        ₹{currentMrp.toLocaleString()} <span style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 600 }}>/ PCS</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#38bdf8' }}>
                        📦 Box MRP: ₹{mrpBox.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ color: '#38bdf8', fontWeight: 700 }}>{p.pcs_per_box || 24} pcs/box</span></td>
                  <td>
                    <span style={{ color: '#cbd5e1', fontWeight: 600, background: '#1e293b', padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.75rem' }}>
                      {p.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#fbbf24', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.725rem' }}>
                      {p.account_group || 'FMCG'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#34d399', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.725rem' }}>
                      {p.segment || 'FMCG'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRegenerateSingleBarcode(p)}
                        title="Regenerate barcode SKU code for this item"
                        style={{ borderColor: '#f59e0b', color: '#fbbf24', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <QrCode size={13} /> Barcode
                      </button>

                      <button
                        className="btn btn-outline"
                        onClick={() => setSelectedProduct(p)}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Edit3 size={13} /> Edit SKU & MRP
                      </button>
                      {isSuperAdmin && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteProduct(p.id, p.product_name)}
                          title="Super Admin Authority: Delete product SKU master record"
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
    </>
  );
};
