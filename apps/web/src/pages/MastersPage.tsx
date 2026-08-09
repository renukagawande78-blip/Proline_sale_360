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
  MapPin
} from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AGENCIES, MOCK_PRODUCTS, isCompanyAllowedForUser } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Company, Agency, Product } from '../types';

import { AgenciesMasterView } from '../views/masters/AgenciesMasterView';
import { ProductsMasterView } from '../views/masters/ProductsMasterView';
import { BrandsMasterView } from '../views/masters/BrandsMasterView';
import { UsersMasterView } from '../views/masters/UsersMasterView';
import { ZonesMasterView } from '../views/masters/ZonesMasterView';
import { RegisterAgencyModal } from '../components/RegisterAgencyModal';

interface MastersPageProps {
  initialTab?: 'companies' | 'agencies' | 'products' | 'users' | 'reasons' | 'zones';
}

export const MastersPage: React.FC<MastersPageProps> = ({ initialTab = 'agencies' }) => {
  const { users, currentUser, hasPermission } = useAuth();
  const role = currentUser?.role_name || 'SALES_PERSON';
  const isSalesPerson = role === 'SALES_PERSON';
  const canAddMaster = hasPermission('new_party') || hasPermission('product_mgmt') || role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'companies' | 'agencies' | 'products' | 'users' | 'reasons' | 'zones'>(initialTab);

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

  // Mapped Data Filtered by Brand Handle Scope
  const mappedAgencies = agenciesList.filter(a => {
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
        pcs_per_box: newItemPack,
        unit_price: newItemPrice
      };
      setProductsList(prev => [...prev, newP]);
      setSuccessNotice(`New Product SKU "${newItemName}" added!`);
    }

    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Master Data CSV Download Handler for Salesperson / Admin
  const handleDownloadMasterCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (activeTab === 'agencies') {
      filename = `Mapped_Agencies_Master_${currentUser?.full_name}_${new Date().toISOString().substring(0, 10)}`;
      headers = ['Agency Code', 'Agency Name', 'City', 'Area / Territory', 'Contact Person', 'Mobile', 'Email', 'Credit Limit (INR)'];
      rows = mappedAgencies.map(a => [
        a.agency_code,
        a.agency_name,
        a.city || 'N/A',
        a.area_name || 'N/A',
        a.contact_person || 'N/A',
        a.mobile || 'N/A',
        a.email || 'N/A',
        a.credit_limit
      ]);
    } else if (activeTab === 'products') {
      filename = `Mapped_Products_Master_${currentUser?.full_name}_${new Date().toISOString().substring(0, 10)}`;
      headers = ['Product Code', 'Product SKU Name', 'Company Brand', 'Pcs Per Box', 'MRP Unit Price (INR)'];
      rows = mappedProducts.map(p => {
        const comp = companiesList.find(c => c.id === p.company_id);
        return [
          p.product_code,
          p.product_name,
          comp?.company_name || 'FMCG',
          p.pcs_per_box,
          p.unit_price
        ];
      });
    } else {
      filename = `Mapped_Brands_Master_${currentUser?.full_name}_${new Date().toISOString().substring(0, 10)}`;
      headers = ['Company Code', 'Company Name', 'Segment'];
      rows = mappedCompanies.map(c => [c.company_code, c.company_name, c.segment || 'FMCG']);
    }

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-outline"
            onClick={handleDownloadMasterCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#34d399', color: '#34d399', fontWeight: 700 }}
          >
            <Download size={16} /> Download Mapped Master CSV
          </button>

          {canAddMaster && activeTab !== 'agencies' && activeTab !== 'zones' && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
            >
              <Plus size={16} /> Add New {activeTab.slice(0, -1).toUpperCase()} Master
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
          <MapPin size={16} /> Zone Master (9 Zones)
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
        <AgenciesMasterView agencies={mappedAgencies} searchQuery={searchQuery} />
      )}

      {activeTab === 'products' && (
        <ProductsMasterView products={mappedProducts} companies={companiesList} searchQuery={searchQuery} />
      )}

      {activeTab === 'zones' && (
        <ZonesMasterView agencies={mappedAgencies} searchQuery={searchQuery} />
      )}

      {activeTab === 'companies' && (
        <BrandsMasterView companies={mappedCompanies} searchQuery={searchQuery} />
      )}

      {activeTab === 'users' && !isSalesPerson && (
        <UsersMasterView users={users} searchQuery={searchQuery} />
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

              {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>PACK SIZE (PCS/BOX)</label>
                    <input 
                      type="number" 
                      value={newItemPack}
                      onChange={e => setNewItemPack(parseInt(e.target.value) || 24)}
                      style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>MRP PRICE (INR)</label>
                    <input 
                      type="number" 
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddItem}>Save Record</button>
            </div>
          </div>
        </div>
      )}

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
