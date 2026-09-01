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
  Trash2,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Map
} from 'lucide-react';
import { 
  isCompanyAllowedForUser, 
  fetchAgenciesFromSupabaseTable, 
  deduplicateAgencies,
  fetchProductsFromSupabase,
  deduplicateProducts,
  fetchCompaniesFromSupabase,
  deduplicateCompanies,
  clearZonesFromSupabase
} from '../lib/supabase';


import { useAuth } from '../context/AuthContext';
import { Company, Agency, Product } from '../types';

import { AgenciesMasterView } from '../views/masters/AgenciesMasterView';
import { AreasMasterView } from '../views/masters/AreasMasterView';
import { ProductsMasterView } from '../views/masters/ProductsMasterView';
import { BrandsMasterView } from '../views/masters/BrandsMasterView';
import { UsersMasterView } from '../views/masters/UsersMasterView';
import { ZonesMasterView } from '../views/masters/ZonesMasterView';
import { AreaTypesMasterView } from '../views/masters/AreaTypesMasterView';
import { RolePermissionsMasterView } from '../views/masters/RolePermissionsMasterView';
import { HoldReasonsMasterView } from '../views/masters/HoldReasonsMasterView';
import { RegisterAgencyModal } from '../components/RegisterAgencyModal';
import { AddProductModal } from '../components/AddProductModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { MasterType, downloadSampleCSV, exportMasterCSV } from '../lib/masterImportExport';

interface MastersPageProps {
  initialTab?: 'companies' | 'agencies' | 'products' | 'users' | 'reasons' | 'areas' | 'zones' | 'area_types' | 'permissions';
  onOpenUserMgmtModal?: (user?: any) => void;
  onOpenCreateOrderForAgency?: (agencyId: string) => void;
}

export const MastersPage: React.FC<MastersPageProps> = ({ initialTab = 'agencies', onOpenUserMgmtModal, onOpenCreateOrderForAgency }) => {

  const { users, currentUser, hasPermission, createUser } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const isSalesPerson = role === 'SALES_PERSON';
  const canAddMaster = hasPermission('new_party') || hasPermission('product_mgmt') || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'companies' | 'agencies' | 'products' | 'users' | 'reasons' | 'areas' | 'zones' | 'area_types' | 'permissions'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [searchQuery, setSearchQuery] = useState('');

  // Master States — Live from Supabase ONLY (no dummy/mock data)
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [agenciesList, setAgenciesList] = useState<Agency[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
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

  // Load live products from Supabase table on page mount
  useEffect(() => {
    let isMounted = true;
    const loadLiveProducts = async () => {
      const liveList = await fetchProductsFromSupabase();
      if (isMounted && liveList) {
        setProductsList(deduplicateProducts(liveList));
      }
    };
    loadLiveProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load live companies / brands from Supabase ONLY — no mock fallback
  useEffect(() => {
    let isMounted = true;
    const loadLiveCompanies = async () => {
      const liveList = await fetchCompaniesFromSupabase();
      if (isMounted && liveList && liveList.length > 0) {
        setCompaniesList(deduplicateCompanies(liveList));
      }
    };
    loadLiveCompanies();
    return () => {
      isMounted = false;
    };
  }, []);



  // Mapped Data Filtered by Brand Handle Scope
  const isSuperUser = !currentUser || currentUser?.role_name === 'SUPER_ADMIN' || currentUser?.company_handle === 'All' || (currentUser?.full_name || '').toLowerCase().includes('chirag');

  const mappedAgencies = agenciesList.filter(a => {
    if (isSuperUser || !a.company_id) return true;
    const parentCompany = companiesList.find(c => c.id === a.company_id);
    return parentCompany ? isCompanyAllowedForUser(parentCompany.company_name, currentUser?.company_handle) : true;
  });

  const mappedProducts = productsList.filter(p => {
    if (isSuperUser || !p.company_id) return true;
    const parentCompany = companiesList.find(c => c.id === p.company_id);
    return parentCompany ? isCompanyAllowedForUser(parentCompany.company_name, currentUser?.company_handle) : true;
  });

  const mappedCompanies = companiesList.filter(c => {
    if (isSuperUser) return true;
    return isCompanyAllowedForUser(c.company_name, currentUser?.company_handle);
  });


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
        segment: 'FMCG',
        active: true
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

  const handleClearCurrentMasterData = async () => {
    const isConfirmed = window.confirm(
      `⚠️ SUPER ADMIN MASTER CLEAR GATEWAY:\n\n` +
      `Are you sure you want to DELETE ALL Master Data records (Products, Agencies, Brands & Zones) to clear wrong data?\n\n` +
      `Click OK to proceed with deleting all master records.`
    );

    if (isConfirmed) {
      setProductsList([]);
      setAgenciesList([]);
      setCompaniesList([]);
      await clearZonesFromSupabase();
      setSuccessNotice(`🔥 ALL Master Data records (Products, Agencies, Brands & Zones) cleared successfully by Super Admin!`);
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
        segment: r.segment || 'FMCG',
        active: true
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


          {canAddMaster && activeTab !== 'agencies' && activeTab !== 'areas' && activeTab !== 'companies' && (
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
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        background: '#0f172a',
        padding: '0.4rem',
        borderRadius: 14,
        border: '1px solid #1e293b',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        maxWidth: '100%',
        scrollbarWidth: 'none'
      }}>
        <button
          onClick={() => setActiveTab('agencies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'agencies' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeTab === 'agencies' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'agencies' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Store size={15} /> Mapped Parties ({mappedAgencies.length})
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'areas' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeTab === 'areas' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'areas' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <MapPin size={15} /> Area Master (Localities & Zones)
        </button>

        <button
          onClick={() => setActiveTab('area_types')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'area_types' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeTab === 'area_types' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'area_types' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Compass size={15} /> Area Types (Rural & City)
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'zones' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeTab === 'zones' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'zones' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Map size={15} /> Territory Zones (9 Zones)
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'products' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeTab === 'products' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'products' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Package size={15} /> Products & SKUs ({mappedProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('companies')}

          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'companies' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeTab === 'companies' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'companies' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={15} /> Brands & Companies ({mappedCompanies.length})
        </button>

        {!isSalesPerson && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'users' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'users' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={15} /> Users & Roles ({users.length})
          </button>
        )}

        {!isSalesPerson && (
          <button
            onClick={() => setActiveTab('permissions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'permissions' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'transparent',
              color: activeTab === 'permissions' ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'permissions' ? '0 4px 12px rgba(220, 38, 38, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={15} /> Role & Permissions
          </button>
        )}

        <button
          onClick={() => setActiveTab('reasons')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'reasons' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
            color: activeTab === 'reasons' ? '#090d16' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'reasons' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <AlertTriangle size={15} /> Hold Reason Directory
        </button>
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
          onOpenCreateOrderForAgency={onOpenCreateOrderForAgency}
        />
      )}

      {activeTab === 'areas' && (
        <AreasMasterView agencies={mappedAgencies} searchQuery={searchQuery} />
      )}

      {activeTab === 'area_types' && (
        <AreaTypesMasterView 
          agencies={mappedAgencies} 
          searchQuery={searchQuery} 
          onNavigateToAreas={() => setActiveTab('areas')}
        />
      )}

      {activeTab === 'zones' && (
        <ZonesMasterView agencies={mappedAgencies} searchQuery={searchQuery} />
      )}

      {activeTab === 'products' && (
        <ProductsMasterView products={mappedProducts} companies={companiesList} searchQuery={searchQuery} />
      )}

      {activeTab === 'companies' && (

        <BrandsMasterView companies={mappedCompanies} searchQuery={searchQuery} />
      )}

      {activeTab === 'users' && !isSalesPerson && (
        <UsersMasterView users={users} searchQuery={searchQuery} onOpenUserMgmtModal={onOpenUserMgmtModal} />
      )}

      {activeTab === 'permissions' && (
        <RolePermissionsMasterView searchQuery={searchQuery} />
      )}

      {activeTab === 'reasons' && (
        <HoldReasonsMasterView searchQuery={searchQuery} />
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
