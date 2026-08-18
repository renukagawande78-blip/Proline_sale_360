import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Store, 
  Package, 
  Users, 
  Plus, 
  Search, 
  Check, 
  X, 
  Download,
  Upload,
  FileSpreadsheet,
  MapPin,
  Trash2
} from 'lucide-react';
import { 
  MOCK_COMPANIES, 
  MOCK_AGENCIES, 
  MOCK_PRODUCTS, 
  isCompanyAllowedForUser, 
  fetchAgenciesFromSupabaseTable, 
  deduplicateAgencies 
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Company, Agency, Product } from '../types';

import { AgenciesMasterView } from '../views/masters/AgenciesMasterView';
import { ProductsMasterView } from '../views/masters/ProductsMasterView';
import { BrandsMasterView } from '../views/masters/BrandsMasterView';
import { UsersMasterView } from '../views/masters/UsersMasterView';
import { AreasMasterView } from '../views/masters/AreasMasterView';
import { ZonesMasterView } from '../views/masters/ZonesMasterView';
import { RegisterAgencyModal } from '../components/RegisterAgencyModal';
import { AddProductModal } from '../components/AddProductModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { MasterType, downloadSampleCSV, exportMasterCSV } from '../lib/masterImportExport';

interface MastersPageProps {
  initialTab?: 'companies' | 'agencies' | 'products' | 'users' | 'reasons' | 'areas' | 'zones';
  onOpenUserMgmtModal?: (user?: any) => void;
}

export const MastersPage: React.FC<MastersPageProps> = ({ initialTab = 'agencies', onOpenUserMgmtModal }) => {
  const { users, currentUser, hasPermission, createUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const isSalesPerson = role === 'SALES_PERSON';
  const canAddMaster = hasPermission('new_party') || hasPermission('product_mgmt') || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'companies' | 'agencies' | 'products' | 'users' | 'reasons' | 'areas' | 'zones'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [searchQuery, setSearchQuery] = useState('');

  // Master States
  const [companiesList, setCompaniesList] = useState<Company[]>(MOCK_COMPANIES);
  const [agenciesList, setAgenciesList] = useState<Agency[]>(MOCK_AGENCIES);
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  const [isRegisterAgencyOpen, setIsRegisterAgencyOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Load live agencies from Supabase table on page mount
  useEffect(() => {
    let isMounted = true;
    const loadLiveAgencies = async () => {
      const { agencies: liveList } = await fetchAgenciesFromSupabaseTable();
      if (isMounted) {
        setAgenciesList(deduplicateAgencies(liveList));
      }
    };
    loadLiveAgencies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mapped Data Filtered by Brand Handle Scope
  const mappedAgencies = agenciesList.filter(a => {
    if (!a.company_id || currentUser?.role_name === 'SUPER_ADMIN' || (currentUser?.full_name || '').toLowerCase().includes('chirag')) return true;
    const parentCompany = companiesList.find(c => c.id === a.company_id);
    return isCompanyAllowedForUser(parentCompany?.company_name, currentUser?.company_handle);
  });

  const mappedProducts = productsList.filter(p => {
    const parentCompany = companiesList.find(c => c.id === p.company_id);
    return isCompanyAllowedForUser(parentCompany?.company_name, currentUser?.company_handle);
  });

  const mappedCompanies = companiesList.filter(c => 
    isCompanyAllowedForUser(c.company_name, currentUser?.company_handle)
  );

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(100);
  const [newItemPack, setNewItemPack] = useState(24);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    if (activeTab === 'companies') {
      const newC: Company = {
        id: 'c_' + Date.now(),
        company_code: newItemCode || 'NEW',
        company_name: newItemName.trim()
      };
      setCompaniesList(prev => [...prev, newC]);
      setSuccessNotice(`New Brand "${newItemName}" added successfully!`);
    } else if (activeTab === 'agencies') {
      const newA: Agency = {
        id: 'a_' + Date.now(),
        agency_code: newItemCode || 'AG-NEW',
        agency_name: newItemName.trim(),
        city: 'New Region',
        area_name: 'Territory 01',
        credit_limit: 250000
      };
      setAgenciesList(prev => [...prev, newA]);
      setSuccessNotice(`New Agency "${newItemName}" created!`);
    } else if (activeTab === 'products') {
      const newP: Product = {
        id: 'p_' + Date.now(),
        company_id: 'c01',
        product_code: newItemCode || 'SKU-NEW',
        product_name: newItemName.trim(),
        pcs_per_box: newItemPack || 24,
        unit_price: newItemPrice || 100,
        mrp_price: newItemPrice || 120,
        category: 'General',
        account_group: 'FMCG',
        segment: 'FMCG'
      };
      setProductsList(prev => [...prev, newP]);
      setSuccessNotice(`New Product SKU "${newItemName}" added!`);
    }

    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleExportCSV = () => {
    let currentData: any[] = [];
    if (activeTab === 'agencies') currentData = mappedAgencies;
    else if (activeTab === 'products') currentData = mappedProducts;
    else if (activeTab === 'companies') currentData = mappedCompanies;
    else if (activeTab === 'users') currentData = users;
    else if (activeTab === 'areas') currentData = mappedAgencies;

    exportMasterCSV(activeTab === 'reasons' ? 'agencies' : (activeTab as MasterType), currentData);
  };

  const handleClearCurrentMasterData = () => {
    const isConfirmed = window.confirm(
      `⚠️ SUPER ADMIN MASTER CLEAR GATEWAY:\n\n` +
      `Are you sure you want to DELETE ALL Master Data records (Products, Agencies, & Brands) to clear wrong data?\n\n` +
      `Click OK to proceed with deleting all master records.`
    );

    if (isConfirmed) {
      setProductsList([]);
      setAgenciesList([]);
      setCompaniesList([]);
      setSuccessNotice(`🔥 ALL Master Data records (Products, Agencies & Brands) cleared successfully by Super Admin!`);
      setTimeout(() => setSuccessNotice(null), 5000);
    }
  };

  const handleImportSuccess = (importedRecords: any[], masterType: MasterType) => {
    if (masterType === 'agencies') {
      const formatted: Agency[] = importedRecords.map((r, i) => ({
        id: 'ag_imp_' + Date.now() + '_' + i,
        agency_code: r.agency_code || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
        agency_name: r.agency_name || 'Imported Agency',
        city: r.city || 'Surat',
        area_name: r.area_name || 'Central Zone',
        contact_person: r.contact_person || 'Haresh Patel',
        mobile: r.mobile || '9898000000',
        email: r.email || 'party@proline.com',
        gstin: r.gstin || '24AAACI1234F1Z9',
        credit_limit: Number(r.credit_limit) || 250000,
        assigned_salesperson: r.assigned_salesperson || 'Chirag Patel'
      }));
      setAgenciesList(prev => [...formatted, ...prev]);
      setSuccessNotice(`Successfully imported ${formatted.length} Agencies / B2B Parties into Master!`);
    } else if (masterType === 'products') {
      const formatted: Product[] = importedRecords.map((r, i) => ({
        id: 'p_imp_' + Date.now() + '_' + i,
        company_id: 'c01',
        product_code: r.product_code || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        product_name: r.product_name || 'Imported SKU Product',
        pcs_per_box: Number(r.pcs_per_box) || 24,
        unit_price: Number(r.unit_price) || 120,
        mrp_price: Number(r.mrp_price) || 150,
        stock_box_qty: Number(r.stock_box_qty) || 200,
        stock_loose_pcs: 0,
        segment: r.segment || 'FMCG'
      }));
      setProductsList(prev => [...formatted, ...prev]);
      setSuccessNotice(`Successfully imported ${formatted.length} Products / SKUs into Master!`);
    } else if (masterType === 'companies') {
      const formatted: Company[] = importedRecords.map((r, i) => ({
        id: 'c_imp_' + Date.now() + '_' + i,
        company_code: r.company_code || `BRAND-${i+1}`,
        company_name: r.company_name || 'Imported Brand Company',
        segment: r.segment || 'FMCG'
      }));
      setCompaniesList(prev => [...formatted, ...prev]);
      setSuccessNotice(`Successfully imported ${formatted.length} Brand Companies into Master!`);
    } else if (masterType === 'users') {
      importedRecords.forEach((r) => {
        if (createUser) {
          createUser({
            full_name: r.full_name || 'Imported User',
            email: r.email || `user${Math.floor(Math.random()*1000)}@proline.com`,
            role_name: r.role_name || 'SALES_PERSON',
            company_handle: r.company_handle || 'All',
            password: r.password || '1234'
          });
        }
      });
      setSuccessNotice(`Successfully imported ${importedRecords.length} System Users & Roles!`);
    } else {
      setSuccessNotice(`Successfully imported ${importedRecords.length} records into Master!`);
    }

    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Master Data Management Center</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Mapped Agencies & Products Directory | Brand Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All 13 Brands' : currentUser?.company_handle}</strong>
          </p>
        </div>

        {/* Master Action Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Download Sample CSV Template */}
          <button 
            className="btn btn-outline"
            onClick={() => downloadSampleCSV(activeTab === 'reasons' ? 'agencies' : (activeTab as MasterType))}
            title="Download formatted sample sheet used for bulk data upload"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#38bdf8', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem' }}
          >
            <FileSpreadsheet size={15} /> Download Sample Upload Sheet
          </button>

          {/* Bulk Import CSV */}
          {canAddMaster && (
            <button 
              className="btn btn-outline"
              onClick={() => setIsBulkImportOpen(true)}
              title="Bulk data upload via CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#fbbf24', color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem' }}
            >
              <Upload size={15} /> Bulk Import CSV
            </button>
          )}

          {/* Export Current Master CSV */}
          <button 
            className="btn btn-outline"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#34d399', color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}
          >
            <Download size={15} /> Export Master CSV
          </button>

          {/* Clear Current Master Data Button (Super Admin Only) */}
          {role === 'SUPER_ADMIN' && (
            <button 
              className="btn btn-outline"
              onClick={handleClearCurrentMasterData}
              title="Super Admin 1-Click Gateway to delete wrong/unwanted master data records"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: '#f43f5e',
                color: '#f43f5e',
                fontWeight: 800,
                fontSize: '0.8rem',
                background: 'rgba(244, 63, 94, 0.15)',
                boxShadow: '0 0 12px rgba(244, 63, 94, 0.25)'
              }}
            >
              <Trash2 size={15} /> 🗑️ Clear All Master Data
            </button>
          )}

          {canAddMaster && activeTab !== 'agencies' && activeTab !== 'areas' && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (activeTab === 'products') setIsAddProductOpen(true);
                else if (activeTab === 'users' && onOpenUserMgmtModal) onOpenUserMgmtModal();
                else setIsAddModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontSize: '0.8rem' }}
            >
              <Plus size={15} /> Add {activeTab.slice(0, -1).toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {successNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      {/* Master Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '0.4rem', borderRadius: 10, border: '1px solid #334155', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('agencies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'agencies' ? '#38bdf8' : 'transparent',
            color: activeTab === 'agencies' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Store size={16} /> Mapped Agencies & Parties ({mappedAgencies.length})
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'products' ? '#38bdf8' : 'transparent',
            color: activeTab === 'products' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={16} /> Mapped Products & SKUs ({mappedProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'areas' ? '#38bdf8' : 'transparent',
            color: activeTab === 'areas' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <MapPin size={16} /> Area Master (Supabase `areas`)
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'zones' ? '#38bdf8' : 'transparent',
            color: activeTab === 'zones' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={16} /> Zone Master (Mapped Areas)
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'companies' ? '#38bdf8' : 'transparent',
            color: activeTab === 'companies' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={16} /> Brand / Segments ({mappedCompanies.length})
        </button>

        {!isSalesPerson && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'users' ? '#38bdf8' : 'transparent',
              color: activeTab === 'users' ? '#0f172a' : '#f8fafc',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={16} /> Master Users & Roles ({users.length})
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: 450 }}>
        <Search size={16} color="#64748b" />
        <input 
          type="text" 
          placeholder={`Search mapped ${activeTab}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem' }}
        />
      </div>

      {/* Sub-Views */}
      {activeTab === 'agencies' && (
        <AgenciesMasterView 
          agencies={mappedAgencies} 
          searchQuery={searchQuery} 
          onAgencyRegistered={(newAgency) => setAgenciesList(prev => [newAgency, ...prev])}
        />
      )}

      {activeTab === 'products' && (
        <ProductsMasterView products={mappedProducts} companies={companiesList} searchQuery={searchQuery} />
      )}

      {activeTab === 'areas' && (
        <AreasMasterView agencies={mappedAgencies} searchQuery={searchQuery} />
      )}

      {activeTab === 'zones' && (
        <ZonesMasterView agencies={mappedAgencies} searchQuery={searchQuery} />
      )}

      {activeTab === 'companies' && (
        <BrandsMasterView companies={mappedCompanies} searchQuery={searchQuery} />
      )}

      {activeTab === 'users' && !isSalesPerson && (
        <UsersMasterView users={users} searchQuery={searchQuery} onOpenUserMgmtModal={onOpenUserMgmtModal} />
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && canAddMaster && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>+ Add New {activeTab.slice(0, -1).toUpperCase()}</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>CODE / IDENTIFIER</label>
                <input 
                  type="text" 
                  placeholder="e.g. PRG-NEW-01" 
                  value={newItemCode}
                  onChange={e => setNewItemCode(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>NAME / DESCRIPTION</label>
                <input 
                  type="text" 
                  placeholder="Enter name..." 
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                />
              </div>

            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddItem}>Save Record</button>
            </div>
          </div>
        </div>
      )}

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={(newP) => {
          setProductsList(prev => [newP, ...prev]);
          setSuccessNotice(`New Product SKU "${newP.product_name}" registered!`);
          setTimeout(() => setSuccessNotice(null), 3000);
        }}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        masterType={activeTab === 'reasons' ? 'agencies' : (activeTab as MasterType)}
        onImportSuccess={handleImportSuccess}
      />

      <RegisterAgencyModal
        isOpen={isRegisterAgencyOpen}
        onClose={() => setIsRegisterAgencyOpen(false)}
        onSuccess={(newAgency) => {
          setAgenciesList(prev => [newAgency, ...prev]);
          setSuccessNotice(`New Sales Agency "${newAgency.agency_name}" registered & auto-mapped to ${newAgency.zone_name} (${newAgency.zone_region})!`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />
    </div>
  );
};
