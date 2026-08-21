import React, { useState, useEffect } from 'react';
import { Package, Edit3, Trash2, QrCode, RefreshCw, Plus, CheckCircle2, Layers, Building2, Filter } from 'lucide-react';
import { Product, Company } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UpdateProductStockModal } from '../../components/UpdateProductStockModal';
import { AddProductModal } from '../../components/AddProductModal';
import { BulkImportModal } from '../../components/BulkImportModal';
import { 
  generateNewBarcodeSKUCode, 
  checkIsSuperAdmin, 
  deleteProductFromSupabase, 
  fetchProductsFromSupabase, 
  fetchCompaniesFromSupabase,
  deduplicateProducts,
  supabase
} from '../../lib/supabase';

interface ProductsMasterViewProps {
  products: Product[];
  companies: Company[];
  searchQuery: string;
}

interface SegmentOption {
  id: string;
  segment_code: string;
  segment_name: string;
}

export const ProductsMasterView: React.FC<ProductsMasterViewProps> = ({ products, companies: initialCompanies, searchQuery }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [localCompanies, setLocalCompanies] = useState<Company[]>(initialCompanies || []);
  const [segmentsList, setSegmentsList] = useState<SegmentOption[]>([]);
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load Products, Companies, and Segments on mount from Supabase
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      fetchProductsFromSupabase(),
      fetchCompaniesFromSupabase(),
      supabase.from('segments').select('*').order('segment_code')
    ]).then(([liveProds, liveComps, { data: liveSegments }]) => {
      if (mounted) {
        if (liveProds) setLocalProducts(deduplicateProducts(liveProds));
        if (liveComps?.length) setLocalCompanies(liveComps);
        if (liveSegments?.length) setSegmentsList(liveSegments);
        setIsLoading(false);
      }
    });

    return () => { mounted = false; };
  }, []);

  const handleSyncLiveProducts = async () => {
    setIsSyncing(true);
    const [liveProds, liveComps] = await Promise.all([
      fetchProductsFromSupabase(),
      fetchCompaniesFromSupabase()
    ]);
    if (liveProds) setLocalProducts(deduplicateProducts(liveProds));
    if (liveComps?.length) setLocalCompanies(liveComps);
    setSuccessNotice("🔄 Synced latest product SKUs directly from live Supabase `products` table!");
    setTimeout(() => setSuccessNotice(null), 3500);
    setIsSyncing(false);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete Product SKU "${productName}"? This action is restricted to Super Admin authority.`)) {
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      await deleteProductFromSupabase(productId);
    }
  };

  const handleRegenerateSingleBarcode = (prod: Product) => {
    const comp = localCompanies.find(c => c.id === prod?.company_id);
    const newBarcode = generateNewBarcodeSKUCode(comp?.company_code || comp?.company_name || prod?.company_id || 'SKU');
    setLocalProducts(prev => prev.map(p => p.id === prod.id ? { ...p, product_code: newBarcode } : p));
  };

  // Companies filtered by active segment filter
  const companiesInActiveSegment = selectedSegmentFilter === 'ALL'
    ? localCompanies
    : localCompanies.filter(c => (c.segment || 'FMCG').toUpperCase() === selectedSegmentFilter.toUpperCase());

  // Filter products: Segment > Companies > Search
  const filteredProducts = localProducts.filter(p => {
    if (!p) return false;

    // 1. Segment Match
    if (selectedSegmentFilter !== 'ALL') {
      const parentComp = localCompanies.find(c => c.id === p.company_id);
      const prodSegment = (p.segment || parentComp?.segment || 'FMCG').toUpperCase();
      if (prodSegment !== selectedSegmentFilter.toUpperCase()) return false;
    }

    // 2. Company Match
    if (selectedCompanyFilter !== 'ALL') {
      const parentComp = localCompanies.find(c => c.id === p.company_id);
      if (p.company_id !== selectedCompanyFilter && parentComp?.id !== selectedCompanyFilter) return false;
    }

    // 3. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (p.product_name || '').toLowerCase().includes(q);
      const codeMatch = (p.product_code || '').toLowerCase().includes(q);
      const catMatch = (p.category || '').toLowerCase().includes(q);
      const grpMatch = (p.account_group || '').toLowerCase().includes(q);
      if (!nameMatch && !codeMatch && !catMatch && !grpMatch) return false;
    }

    return true;
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
          setLocalProducts(prev => deduplicateProducts([...(newRows as Product[]), ...prev]));
        }}
      />

      {successNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {successNotice}
        </div>
      )}

      {/* CASCADING FILTER BAR: Segment ➔ Company ➔ Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#141f36',
        padding: '0.75rem 1rem',
        borderRadius: '14px',
        border: '1px solid #1e293b',
        marginBottom: '1.25rem'
      }}>
        {/* Left: Cascading Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* 1. Segment Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Segment:
            </span>
            <select
              value={selectedSegmentFilter}
              onChange={(e) => {
                setSelectedSegmentFilter(e.target.value);
                setSelectedCompanyFilter('ALL'); // Reset company filter on segment switch
              }}
              style={{
                padding: '0.4rem 0.75rem',
                background: '#0b1329',
                border: '1px solid #38bdf8',
                borderRadius: 8,
                color: selectedSegmentFilter === 'FMCG' ? '#34d399' : (selectedSegmentFilter === 'FMCD' ? '#fbbf24' : '#38bdf8'),
                fontSize: '0.775rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Segments</option>
              {segmentsList.map(s => (
                <option key={s.id} value={s.segment_code}>{s.segment_code} — {s.segment_name}</option>
              ))}
            </select>
          </div>

          {/* 2. Company / Brand Filter (Cascading) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Company:
            </span>
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                background: '#0b1329',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Companies ({companiesInActiveSegment.length})</option>
              {companiesInActiveSegment.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.company_code}] {c.company_name} ({c.segment || 'FMCG'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginLeft: '0.5rem' }}>
            Showing <strong style={{ color: '#38bdf8' }}>{filteredProducts.length}</strong> Products
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleSyncLiveProducts}
            disabled={isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              fontWeight: 800,
              fontSize: '0.75rem',
              borderRadius: '8px',
              cursor: isSyncing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-anim' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Live DB'}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.95rem',
              background: 'linear-gradient(135deg, #059669, #0d9488)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.775rem',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={14} /> Add Product SKU
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Segment</th>
              <th>Company / Brand</th>
              <th>SKU Code</th>
              <th>Product SKU Name</th>
              <th>Category</th>
              <th>Pack Size</th>
              <th>MRP (₹)</th>
              <th>Stock (Boxes)</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#94a3b8' }}>
                    No Product SKUs found in this filter
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                    Click "+ Add Product SKU" above or use Bulk Import to add products to your catalog.
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, idx) => {
                const parentComp = localCompanies.find(c => c.id === p.company_id || c.company_name === p.account_group);
                const currentSegment = (p.segment || parentComp?.segment || 'FMCG').toUpperCase();
                const currentMrp = p.mrp_price || (p.unit_price ? Math.round(p.unit_price * 1.15) : 100);
                const mrpBox = currentMrp * (p.pcs_per_box || 1);

                return (
                  <tr key={p?.id || idx}>
                    <td><strong style={{ color: '#38bdf8' }}>{idx + 1}</strong></td>
                    <td>
                      <span style={{
                        color: currentSegment === 'FMCG' ? '#34d399' : '#fbbf24',
                        fontWeight: 800,
                        background: currentSegment === 'FMCG' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        border: `1px solid ${currentSegment === 'FMCG' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.72rem'
                      }}>
                        {currentSegment}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={13} color="#94a3b8" />
                        <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>
                          {parentComp?.company_name || p.account_group || 'General Brand'}
                        </strong>
                      </div>
                    </td>
                    <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{p?.product_code || 'N/A'}</code></td>
                    <td><strong style={{ color: '#f8fafc' }}>{p?.product_name || 'Unnamed Product'}</strong></td>
                    <td>
                      <span style={{ color: '#cbd5e1', fontWeight: 600, background: '#1e293b', padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.75rem' }}>
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td><span style={{ color: '#38bdf8', fontWeight: 700 }}>{p.pcs_per_box || 24} pcs/box</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
                          ₹{currentMrp.toLocaleString()} <span style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 600 }}>/ PCS</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                          Box: ₹{mrpBox.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: (p.stock_box_qty || 0) > 0 ? '#34d399' : '#fb7185', fontWeight: 800 }}>
                        {p.stock_box_qty || 0} Boxes
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelectedProduct(p)}
                          style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        {isSuperAdmin && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteProduct(p.id, p.product_name)}
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
