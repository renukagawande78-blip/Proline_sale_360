import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Package, 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Check, 
  X, 
  Tag, 
  MapPin, 
  Percent, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AGENCIES, MOCK_PRODUCTS, MOCK_HOLD_REASONS } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Company, Agency, Product, User } from '../types';

export const MastersPage: React.FC = () => {
  const { users } = useAuth();

  const [activeTab, setActiveTab] = useState<'companies' | 'agencies' | 'products' | 'users' | 'reasons'>('companies');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable States
  const [companiesList, setCompaniesList] = useState<Company[]>([
    { id: 'c01', company_code: 'PRG', company_name: 'Pringod (Priyagold)' },
    { id: 'c02', company_code: 'RCPL', company_name: 'RCPL' },
    { id: 'c03', company_code: 'ORN', company_name: 'Orion Foods' },
    { id: 'c04', company_code: 'GND', company_name: 'Gandour Chocolates' },
    { id: 'c05', company_code: 'HPP', company_name: 'HPPL' },
    { id: 'c06', company_code: 'WPL', company_name: 'Whirlpool' },
    { id: 'c07', company_code: 'DKN', company_name: 'Daikin' },
    { id: 'c08', company_code: 'CRS', company_name: 'Cruise' },
    { id: 'c09', company_code: 'MOG', company_name: 'Mogu Mogu Beverages' },
    { id: 'c10', company_code: 'HEL', company_name: 'Heli' },
    { id: 'c11', company_code: 'WAI', company_name: 'Waiwai Instant Noodles' },
    { id: 'c12', company_code: 'PRN', company_name: 'PRAN Foods' },
    { id: 'c13', company_code: 'AK', company_name: 'AK Group' }
  ]);

  const [agenciesList, setAgenciesList] = useState<Agency[]>(MOCK_AGENCIES);
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);

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
        company_code: newItemCode.toUpperCase() || 'NEW',
        company_name: newItemName.trim()
      };
      setCompaniesList(prev => [...prev, newC]);
      setSuccessNotice(`Added Brand / Segment: ${newItemName}`);
    } else if (activeTab === 'agencies') {
      const newA: Agency = {
        id: 'a_' + Date.now(),
        agency_code: newItemCode.toUpperCase() || 'AG-NEW',
        agency_name: newItemName.trim(),
        area_name: 'Delhi NCR Territory',
        city: 'New Delhi',
        contact_person: 'Agency Representative',
        mobile: '+91 98765 00000',
        credit_limit: 250000
      };
      setAgenciesList(prev => [...prev, newA]);
      setSuccessNotice(`Added Agency Party: ${newItemName}`);
    } else if (activeTab === 'products') {
      const newP: Product = {
        id: 'p_' + Date.now(),
        product_code: newItemCode.toUpperCase() || 'SKU-NEW',
        product_name: newItemName.trim(),
        company_id: 'c01',
        pcs_per_box: newItemPack,
        unit_price: newItemPrice
      };
      setProductsList(prev => [...prev, newP]);
      setSuccessNotice(`Added Product SKU: ${newItemName}`);
    }

    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Master Data Management Center</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Maintain Brands, Agencies, Products, Users & Hold Reason Masters</p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} /> Add New {activeTab.slice(0, -1).toUpperCase()} Master
        </button>
      </div>

      {successNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      {/* Master Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '0.4rem', borderRadius: 10, border: '1px solid #334155', marginBottom: '1.5rem', overflowX: 'auto' }}>
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
          <Building2 size={16} /> Brand / Segments ({companiesList.length})
        </button>

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
          <Store size={16} /> Agencies & Parties ({agenciesList.length})
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
          <Package size={16} /> Products & SKUs ({productsList.length})
        </button>

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

        <button
          onClick={() => setActiveTab('reasons')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'reasons' ? '#38bdf8' : 'transparent',
            color: activeTab === 'reasons' ? '#0f172a' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <ShieldAlert size={16} /> Hold Reasons ({MOCK_HOLD_REASONS.length})
        </button>
      </div>

      {/* Live Search Input */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.85rem', gap: '0.5rem' }}>
        <Search size={16} color="#38bdf8" />
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.85rem' }}
        />
      </div>

      {/* Tab 1: Brand / Companies Master */}
      {activeTab === 'companies' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Brand Code</th>
                <th>Brand / Segment Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companiesList
                .filter(c => c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company_code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((c, idx) => (
                  <tr key={c.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{idx + 1}</strong></td>
                    <td><code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#38bdf8', fontWeight: 800 }}>{c.company_code}</code></td>
                    <td><strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{c.company_name}</strong></td>
                    <td><span className="status-badge status-APPROVED">ACTIVE</span></td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        <Edit3 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Agencies Master */}
      {activeTab === 'agencies' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Agency / Party Name</th>
                <th>Territory & City</th>
                <th>GSTIN</th>
                <th>Contact Person & Mobile</th>
                <th>Credit Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agenciesList
                .filter(a => a.agency_name.toLowerCase().includes(searchQuery.toLowerCase()) || (a.city || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map(a => (
                  <tr key={a.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{a.agency_code}</strong></td>
                    <td>
                      <strong style={{ color: '#f8fafc' }}>{a.agency_name}</strong>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{a.address}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.area_name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#38bdf8' }}>{a.city}</div>
                    </td>
                    <td><code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#34d399' }}>{a.gst_number || '07AAAAA0000A1Z5'}</code></td>
                    <td>
                      <div>{a.contact_person}</div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{a.mobile}</div>
                    </td>
                    <td><span style={{ fontWeight: 800, color: '#38bdf8' }}>₹{(a.credit_limit || 250000).toLocaleString()}</span></td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        <Edit3 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Products SKU Master */}
      {activeTab === 'products' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Product Description</th>
                <th>Pack Size</th>
                <th>MRP / Unit Price (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsList
                .filter(p => p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.product_code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => (
                  <tr key={p.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{p.product_code}</strong></td>
                    <td><strong style={{ color: '#f8fafc' }}>{p.product_name}</strong></td>
                    <td><span style={{ color: '#34d399', fontWeight: 700 }}>{p.pcs_per_box} pcs/box</span></td>
                    <td><strong style={{ color: '#f8fafc' }}>₹{p.unit_price}</strong></td>
                    <td><span className="status-badge status-APPROVED">AVAILABLE</span></td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        <Edit3 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Master Users & Role Handles */}
      {activeTab === 'users' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.NO</th>
                <th>User Name</th>
                <th>System Role</th>
                <th>Brand Handles</th>
                <th>Default Password</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.role_name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.company_handle || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map((u, idx) => (
                  <tr key={u.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{u.sno || idx + 1}</strong></td>
                    <td><strong style={{ color: '#f8fafc' }}>{u.full_name}</strong></td>
                    <td>
                      <span className="role-pill" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                        {u.role_name.replace('_', ' ')}
                      </span>
                    </td>
                    <td><span style={{ color: '#34d399', fontWeight: 600 }}>{u.company_handle || 'All'}</span></td>
                    <td><code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#fbbf24', fontWeight: 700 }}>{u.password || '1234'}</code></td>
                    <td><span className="status-badge status-APPROVED">ACTIVE</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Hold Reasons Master */}
      {activeTab === 'reasons' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reason Code</th>
                <th>Description</th>
                <th>Action Rule</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HOLD_REASONS.map(r => (
                <tr key={r.id}>
                  <td><code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#fb7185', fontWeight: 700 }}>{r.reason_code}</code></td>
                  <td><strong style={{ color: '#f8fafc' }}>{r.reason_description}</strong></td>
                  <td><span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Requires System Admin Approval Override</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Master Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Add New {activeTab.slice(0, -1).toUpperCase()} Master
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  MASTER ITEM CODE / SKU
                </label>
                <input 
                  type="text" 
                  value={newItemCode}
                  onChange={e => setNewItemCode(e.target.value)}
                  placeholder="e.g. PRG-01, SK-200"
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  MASTER ITEM NAME / DESCRIPTION
                </label>
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Enter full title..."
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                />
              </div>

              {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>PACK SIZE (PCS/BOX)</label>
                    <input 
                      type="number" 
                      value={newItemPack}
                      onChange={e => setNewItemPack(parseInt(e.target.value) || 24)}
                      style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>MRP / UNIT PRICE (₹)</label>
                    <input 
                      type="number" 
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddItem}>Save to Master Database</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
