import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Search, ChevronDown, Check, MessageSquare, UserCheck, Layers } from 'lucide-react';
import { 
  MOCK_COMPANIES, 
  MOCK_AGENCIES, 
  MOCK_PRODUCTS, 
  isCompanyAllowedForUser, 
  resolveSegmentForUser, 
  fetchCompaniesFromSupabase, 
  fetchAgenciesFromSupabaseTable, 
  fetchProductsFromSupabase,
  fetchUsersFromSupabase,
  deduplicateCompanies,
  deduplicateAgencies,
  deduplicateProducts,
  generateUuid,
  isValidUuid
} from '../lib/supabase';

import { Order, OrderItem, Agency, Product, User } from '../types';
import { useAuth } from '../context/AuthContext';

interface SearchableAgencySelectProps {
  selectedAgencyId: string;
  onSelectAgency: (agencyId: string) => void;
  agencies?: Agency[];
  selectedSegments?: string[];
}

export const SearchableAgencySelect: React.FC<SearchableAgencySelectProps> = ({ selectedAgencyId, onSelectAgency, agencies, selectedSegments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAgencies = (agencies && agencies.length > 0) ? agencies : MOCK_AGENCIES;
  const selectedAgency = activeAgencies.find(a => a.id === selectedAgencyId) || activeAgencies[0] || null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAgencies = activeAgencies.filter(a => {
    const q = searchQuery.toLowerCase();
    const nameMatch = a.agency_name.toLowerCase().includes(q);
    const areaMatch = (a.area_name || '').toLowerCase().includes(q);
    const cityMatch = (a.city || '').toLowerCase().includes(q);
    const codeMatch = a.agency_code.toLowerCase().includes(q);
    return nameMatch || areaMatch || cityMatch || codeMatch;
  });

  const formatAgencyLabel = (agency: Agency | null) => {
    if (!agency) return 'Select Agency...';
    const areaStr = agency.area_name ? ` - ${agency.area_name}` : '';
    const cityStr = agency.city ? ` - ${agency.city}` : '';
    return `${agency.agency_name}${areaStr}${cityStr}`;
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
        AGENCY / B2B PARTY (SINGLE SELECT)
      </label>

      {/* Selected Box Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.55rem 0.75rem',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 6,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatAgencyLabel(selectedAgency)}
        </span>
        <ChevronDown size={16} color="#94a3b8" />
      </div>

      {/* Search Dropdown Popup */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 999,
            marginTop: 4,
            background: '#1e293b',
            border: '1px solid #38bdf8',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            padding: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.6rem', marginBottom: '0.5rem', gap: '0.4rem' }}>
            <Search size={14} color="#38bdf8" />
            <input 
              type="text" 
              placeholder="Search agency name, city, or area..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredAgencies.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No matching agency found for selected segment</div>
            ) : (
              filteredAgencies.map(a => {
                const isSelected = a.id === selectedAgencyId;
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectAgency(a.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.2rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#0f172a';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{formatAgencyLabel(a)}</span>
                        {a.account_group && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.4rem',
                            borderRadius: 4,
                            background: a.account_group.includes('FMCD') && a.account_group.includes('FMCG') ? 'rgba(168, 85, 247, 0.2)' : a.account_group.includes('FMCD') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                            color: a.account_group.includes('FMCD') && a.account_group.includes('FMCG') ? '#c084fc' : a.account_group.includes('FMCD') ? '#38bdf8' : '#34d399',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {a.account_group}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>Code: <strong style={{ color: '#cbd5e1' }}>{a.agency_code}</strong></span>
                        {a.contact_person && <span>| Contact: <strong style={{ color: '#cbd5e1' }}>{a.contact_person}</strong></span>}
                        {a.assigned_salesperson && <span>| Rep: <strong style={{ color: '#34d399' }}>{a.assigned_salesperson}</strong></span>}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="#38bdf8" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SearchableMultiBrandSelectProps {
  selectedCompanyIds: string[];
  onChangeCompanyIds: (ids: string[]) => void;
  availableCompanies: any[];
  userCompanyHandle?: string;
}

export const SearchableMultiBrandSelect: React.FC<SearchableMultiBrandSelectProps> = ({
  selectedCompanyIds,
  onChangeCompanyIds,
  availableCompanies,
  userCompanyHandle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCompanies = availableCompanies.filter(c => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (c.company_name || '').toLowerCase().includes(q);
    const codeMatch = (c.company_code || '').toLowerCase().includes(q);
    const segMatch = (c.segment || '').toLowerCase().includes(q);
    return nameMatch || codeMatch || segMatch;
  });

  const isAllSelected = selectedCompanyIds.length === 0 || selectedCompanyIds.length === availableCompanies.length;

  const handleToggle = (id: string) => {
    if (selectedCompanyIds.length === 0) {
      const allIds = availableCompanies.map(c => c.id);
      onChangeCompanyIds(allIds.filter(x => x !== id));
    } else if (selectedCompanyIds.includes(id)) {
      const remaining = selectedCompanyIds.filter(x => x !== id);
      onChangeCompanyIds(remaining.length === 0 ? [] : remaining);
    } else {
      const updated = [...selectedCompanyIds, id];
      onChangeCompanyIds(updated.length === availableCompanies.length ? [] : updated);
    }
  };

  const handleSelectAll = () => {
    onChangeCompanyIds([]);
  };

  const selectedCount = isAllSelected ? availableCompanies.length : selectedCompanyIds.length;

  const displayText = isAllSelected 
    ? `All Assigned Brands (${availableCompanies.length})` 
    : selectedCompanyIds.length === 1 
      ? availableCompanies.find(c => c.id === selectedCompanyIds[0])?.company_name || '1 Brand Selected'
      : `${selectedCompanyIds.length} Brands Selected`;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
        BRANDS / COMPANIES (MULTI-SELECT)
      </label>

      {/* Selected Box Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.55rem 0.75rem',
          background: '#0f172a',
          border: '1px solid #38bdf8',
          borderRadius: 6,
          color: 'white',
          fontWeight: 700,
          fontSize: '0.825rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isAllSelected ? '#34d399' : '#38bdf8' }}>
          {displayText}
        </span>
        <ChevronDown size={16} color="#94a3b8" />
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: 4,
            background: '#1e293b',
            border: '1px solid #38bdf8',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            padding: '0.5rem',
            minWidth: 260
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>Filter Brands ({selectedCount}/{availableCompanies.length})</span>
            <button 
              type="button" 
              onClick={handleSelectAll} 
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
            >
              {isAllSelected ? 'Select All' : 'Select All'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.35rem 0.55rem', marginBottom: '0.4rem', gap: '0.4rem' }}>
            <Search size={13} color="#38bdf8" />
            <input 
              type="text" 
              placeholder="Search brand..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.75rem' }}
            />
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredCompanies.map(c => {
              const isChecked = isAllSelected || selectedCompanyIds.includes(c.id);
              const isFmcd = (c.segment || '').toUpperCase() === 'FMCD';
              return (
                <div 
                  key={c.id}
                  onClick={() => handleToggle(c.id)}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: 6,
                    background: isChecked ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: isChecked ? '1px solid #38bdf8' : '1px solid #64748b',
                      background: isChecked ? '#38bdf8' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0f172a'
                    }}>
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isChecked ? '#f8fafc' : '#94a3b8' }}>
                      {c.company_name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: 4,
                    background: isFmcd ? 'rgba(56, 189, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                    color: isFmcd ? '#38bdf8' : '#34d399'
                  }}>
                    {c.segment || 'FMCG'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface SearchableProductSelectProps {
  selectedProductId: string;
  selectedCompanyIds?: string[];
  selectedSegments?: string[];
  userCompanyHandle?: string;
  onSelectProduct: (productId: string) => void;
  products?: Product[];
  companies?: any[];
  alreadySelectedProductIds?: string[];
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({ 
  selectedProductId, 
  selectedCompanyIds = [], 
  selectedSegments = ['FMCG', 'FMCD'],
  userCompanyHandle,
  onSelectProduct,
  products,
  companies,
  alreadySelectedProductIds = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 360 });

  const activeProducts = (products && products.length > 0) ? products : MOCK_PRODUCTS;
  const activeCompanies = (companies && companies.length > 0) ? companies : MOCK_COMPANIES;

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId) || activeProducts[0];

  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 290 && rect.top > 290;
      setDropdownPos({
        top: openUpwards ? Math.max(10, rect.top - 290) : rect.bottom + 4,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - 380)),
        width: Math.max(360, rect.width)
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const filteredProducts = activeProducts.filter(p => {
    // 1. Multi-Brand Filter: if specific companies selected, match any in selectedCompanyIds. If empty or 'ALL', match userCompanyHandle scope!
    let matchesCompany = true;
    if (selectedCompanyIds.length > 0 && !selectedCompanyIds.includes('ALL')) {
      matchesCompany = selectedCompanyIds.includes(p.company_id);
    } else {
      const parentCompany = activeCompanies.find(c => c.id === p.company_id);
      matchesCompany = isCompanyAllowedForUser(parentCompany?.company_name, userCompanyHandle, parentCompany?.company_code);
    }

    // 2. Multi-Segment Filter: match any in selectedSegments
    let matchesSegment = true;
    if (selectedSegments.length > 0) {
      const parentCompany = activeCompanies.find(c => c.id === p.company_id);
      const prodSegment = (p.segment || parentCompany?.segment || 'FMCG').toUpperCase();
      matchesSegment = selectedSegments.some(s => prodSegment.includes(s.toUpperCase()));
    }

    // 3. Search Query Match
    const q = searchQuery.toLowerCase();
    const nameMatch = (p?.product_name || '').toLowerCase().includes(q);
    const codeMatch = (p?.product_code || '').toLowerCase().includes(q);

    return matchesCompany && matchesSegment && (nameMatch || codeMatch);
  });

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Selected Box Trigger */}
      <div 
        onClick={() => {
          setIsOpen(!isOpen);
          updatePosition();
        }}
        style={{
          padding: '0.55rem 0.75rem',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 6,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.825rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedProduct?.product_name || 'Select Product'}
        </span>
        <ChevronDown size={14} color="#94a3b8" />
      </div>

      {/* Search Dropdown Popup */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 999999,
            background: '#1e293b',
            border: '1px solid #38bdf8',
            borderRadius: 10,
            boxShadow: '0 20px 45px rgba(0,0,0,0.85)',
            padding: '0.6rem',
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.45rem 0.65rem', marginBottom: '0.5rem', gap: '0.4rem', flexShrink: 0 }}>
            <Search size={14} color="#38bdf8" />
            <input 
              type="text" 
              placeholder="Search product name or code..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ maxHeight: 240, overflowY: 'auto', flex: 1 }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No matching products for this brand & segment</div>
            ) : (
              filteredProducts.map(p => {
                const isSelected = p.id === selectedProductId;
                const isAlreadyChosen = !isSelected && alreadySelectedProductIds.includes(p.id);
                const parentCompany = activeCompanies.find(c => c.id === p.company_id);
                const prodSegment = p.segment || parentCompany?.segment || 'FMCG';

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isAlreadyChosen) return;
                      onSelectProduct(p.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      cursor: isAlreadyChosen ? 'not-allowed' : 'pointer',
                      opacity: isAlreadyChosen ? 0.45 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.2rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected && !isAlreadyChosen) e.currentTarget.style.background = '#0f172a';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected && !isAlreadyChosen) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? '#38bdf8' : isAlreadyChosen ? '#94a3b8' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>[{prodSegment}] {p?.product_name || 'Product Item'}</span>
                        {isAlreadyChosen && (
                          <span style={{ fontSize: '0.625rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 800 }}>
                            Already in Order
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isAlreadyChosen ? '#64748b' : '#34d399', marginTop: 2, fontWeight: 600 }}>
                        Company: {parentCompany?.company_name || 'General'} | Code: {p.product_code} | Pack: {p.pcs_per_box} pcs/box | ₹{p.unit_price || p.mrp_price || 0}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="#38bdf8" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (order: Order) => void;
  orderToEdit?: Order | null;
  initialAgencyId?: string;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSubmitOrder, orderToEdit, initialAgencyId }) => {

  const { currentUser, users } = useAuth();

  const [liveCompanies, setLiveCompanies] = useState<any[]>(MOCK_COMPANIES);
  const [liveAgencies, setLiveAgencies] = useState<Agency[]>(MOCK_AGENCIES);
  const [liveProducts, setLiveProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [liveUsers, setLiveUsers] = useState<User[]>([]);

  const mergedUsers = liveUsers.length > 0 ? liveUsers : users;

  const salesTeamMembers = mergedUsers.filter(u => 
    u.role_name === 'SALES_PERSON' || 
    (u.role_name as string) === 'SALES_EXECUTIVE' ||
    u.role_name === 'AREA_SALES_MANAGER' || 
    u.role_name === 'SALES_ADMIN' ||
    u.role_name === 'SUPER_ADMIN'
  );

  const isAdminOrASM = currentUser?.role_name === 'SUPER_ADMIN' || 
                       currentUser?.role_name === 'SALES_ADMIN' || 
                       currentUser?.role_name === 'AREA_SALES_MANAGER';

  const activeUserSegment = resolveSegmentForUser(currentUser);
  const initialSegments = activeUserSegment === 'ALL' ? ['FMCG', 'FMCD'] : [activeUserSegment];
  const [selectedSegments, setSelectedSegments] = useState<string[]>(initialSegments);
  const [salespersonId, setSalespersonId] = useState(currentUser?.id || salesTeamMembers[0]?.id || 'u12');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  
  // Active Salesperson & assigned brand handle scope strictly derived from user's mapped company
  const activeSalesperson = isAdminOrASM 
    ? (mergedUsers.find(u => u.id === salespersonId) || (currentUser?.id === salespersonId ? currentUser : salesTeamMembers[0]))
    : currentUser;

  const activeSalespersonHandle = activeSalesperson?.company_handle || 
    (activeSalesperson as any)?.brand_handle || 
    (activeSalesperson as any)?.brand_scope || 
    currentUser?.company_handle || 
    'All';

  // Toggle Segment function (Multi-Select)
  const toggleSegment = (seg: 'FMCG' | 'FMCD') => {
    setSelectedSegments(prev => {
      if (prev.includes(seg)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(s => s !== seg);
      } else {
        return [...prev, seg];
      }
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadLiveDataFromSupabase() {
      try {
        const [compData, agRes, prodData, usrData] = await Promise.all([
          fetchCompaniesFromSupabase(),
          fetchAgenciesFromSupabaseTable(),
          fetchProductsFromSupabase(),
          fetchUsersFromSupabase()
        ]);
        if (isMounted) {
          if (compData && compData.length > 0) setLiveCompanies(deduplicateCompanies([...compData, ...MOCK_COMPANIES]));
          if (agRes && agRes.agencies && agRes.agencies.length > 0) setLiveAgencies(deduplicateAgencies([...agRes.agencies, ...MOCK_AGENCIES]));
          if (prodData && prodData.length > 0) setLiveProducts(deduplicateProducts([...prodData, ...MOCK_PRODUCTS]));
          if (usrData && usrData.length > 0) setLiveUsers(usrData);
        }
      } catch (err) {
        console.warn('Supabase live fetch notice in CreateOrderModal:', err);
      }
    }
    loadLiveDataFromSupabase();
    return () => { isMounted = false; };
  }, [isOpen]);

  const activeCompaniesPool = (liveCompanies && liveCompanies.length > 0) ? liveCompanies : [];
  const activeAgenciesPool = (liveAgencies && liveAgencies.length > 0) ? liveAgencies : [];
  const activeProductsPool = (liveProducts && liveProducts.length > 0) ? liveProducts : [];

  // Segment-wise Agencies Pool (Multi-Segment Filter)
  const allowedAgenciesForSegment = activeAgenciesPool.filter(a => {
    const group = (a.account_group || 'FMCG').toUpperCase();
    return selectedSegments.some(seg => group.includes(seg));
  });

  // Brands allowed for active salesperson & segment filter
  const allowedBrandsForActiveSalesperson = activeCompaniesPool.filter(c => {
    const matchesBrand = isCompanyAllowedForUser(c.company_name, activeSalespersonHandle, c.company_code);
    const seg = (c.segment || 'FMCG').toUpperCase();
    const matchesSegment = selectedSegments.length === 0 || selectedSegments.some(s => seg.includes(s));
    return matchesBrand && matchesSegment;
  });

  const [agencyId, setAgencyId] = useState(allowedAgenciesForSegment[0]?.id || activeAgenciesPool[0]?.id || '');

  // 1. Auto-fill logged-in user segment, assigned brands, and self-salesperson on modal open
  useEffect(() => {
    if (!isOpen || orderToEdit) return;
    const effectiveUser = (currentUser?.id && mergedUsers.find(u => u.id === currentUser.id)) || currentUser;
    if (effectiveUser?.id) {
      setSalespersonId(effectiveUser.id);
    }
    const userSegment = resolveSegmentForUser(effectiveUser, activeCompaniesPool);
    if (userSegment !== 'ALL') {
      setSelectedSegments([userSegment]);
    } else {
      setSelectedSegments(['FMCG', 'FMCD']);
    }

    const spHandle = effectiveUser?.company_handle || 'All';
    const allowed = activeCompaniesPool.filter(c => isCompanyAllowedForUser(c.company_name, spHandle, c.company_code));
    if (allowed.length === 1) {
      setSelectedCompanyIds([allowed[0].id]);
      const bSeg = (allowed[0].segment || 'FMCG').toUpperCase();
      if (bSeg === 'FMCG' || bSeg === 'FMCD') {
        setSelectedSegments([bSeg]);
      }
    }
  }, [isOpen, orderToEdit, currentUser, mergedUsers, activeCompaniesPool]);

  // 2. Keep agency selection valid when selectedSegments changes
  useEffect(() => {
    if (!isOpen || orderToEdit) return;
    const isCurrentAgencyValid = allowedAgenciesForSegment.some(a => a.id === agencyId);
    if (!isCurrentAgencyValid && allowedAgenciesForSegment.length > 0) {
      setAgencyId(allowedAgenciesForSegment[0].id);
    }
  }, [selectedSegments, allowedAgenciesForSegment, isOpen, orderToEdit]);

  // 3. Auto-sync company/brand selection to user's assigned brands
  useEffect(() => {
    if (!isOpen || orderToEdit) return;
    if (allowedBrandsForActiveSalesperson.length === 1) {
      setSelectedCompanyIds([allowedBrandsForActiveSalesperson[0].id]);
    } else {
      setSelectedCompanyIds(prev => {
        const valid = prev.filter(id => allowedBrandsForActiveSalesperson.some(c => c.id === id));
        return valid;
      });
    }
  }, [allowedBrandsForActiveSalesperson, isOpen, orderToEdit]);

  // 4. Auto-select assigned salesperson when an agency is picked
  useEffect(() => {
    if (!agencyId || orderToEdit) return;
    const selectedAgency = activeAgenciesPool.find(a => a.id === agencyId);
    if (selectedAgency?.assigned_salesperson) {
      const assignedNames = selectedAgency.assigned_salesperson
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      const matchedUser = salesTeamMembers.find(u => 
        assignedNames.some(name => 
          (u.full_name || '').toLowerCase().includes(name) || 
          name.includes((u.full_name || '').toLowerCase())
        )
      );

      if (matchedUser) {
        setSalespersonId(matchedUser.id);
      }
    }
  }, [agencyId, activeAgenciesPool, salesTeamMembers, orderToEdit]);

  const [deliveryType, setDeliveryType] = useState<'F.O.R' | 'Self Pickup'>('F.O.R');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<Array<{
    product_id: string;
    pcs_per_box: number;
    box_qty: number;
    loose_pcs: number;
    free_pcs: number;
    unit_price: number;
    remark?: string;
  }>>([
    {
      product_id: liveProducts[0]?.id || MOCK_PRODUCTS[0]?.id || '',
      pcs_per_box: liveProducts[0]?.pcs_per_box || MOCK_PRODUCTS[0]?.pcs_per_box || 24,
      box_qty: 10,
      loose_pcs: 0,
      free_pcs: 0,
      unit_price: liveProducts[0]?.unit_price || MOCK_PRODUCTS[0]?.unit_price || 0,
      remark: ''
    }
  ]);

  // Auto-sync company brand dropdown and product item list whenever selected Salesperson changes
  useEffect(() => {
    if (!isOpen || orderToEdit) return;

    const activeSp = mergedUsers.find(u => u.id === salespersonId) || currentUser;
    if (!activeSp) return;

    const spHandle = activeSp.company_handle || 'All';
    const spSegment = resolveSegmentForUser(activeSp, activeCompaniesPool);

    // 1. Determine allowed companies for this salesperson
    const allowedCompanies = activeCompaniesPool.filter(c => 
      isCompanyAllowedForUser(c.company_name, spHandle, c.company_code)
    );

    // If single brand mapped to salesperson (e.g. Keyur -> Hell [FMCD]), auto-select that single brand & its segment!
    if (allowedCompanies.length === 1) {
      setSelectedCompanyIds([allowedCompanies[0].id]);
      const brandSeg = (allowedCompanies[0].segment || 'FMCG').toUpperCase();
      if (brandSeg === 'FMCG' || brandSeg === 'FMCD') {
        setSelectedSegments([brandSeg]);
      }
    } else if (spSegment !== 'ALL') {
      setSelectedSegments([spSegment]);
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds([]);
    }

    // 2. Auto-sync agency selector if current agency is not allowed for this salesperson
    const allowedAgencies = activeAgenciesPool.filter(a => {
      const spName = (activeSp.full_name || '').toLowerCase();
      const assignedSp = (a.assigned_salesperson || '').toLowerCase();
      const matchesSp = assignedSp && (assignedSp.includes(spName) || spName.includes(assignedSp));
      const matchesBrand = isCompanyAllowedForUser(a.account_group || a.agency_name, spHandle);
      return matchesSp || matchesBrand || spHandle === 'All';
    });

    if (allowedAgencies.length > 0 && !allowedAgencies.some(a => a.id === agencyId)) {
      setAgencyId(allowedAgencies[0].id);
    }

    // 3. Ensure line items use products belonging to allowed brands & selected segments
    const allowedCompanyIds = allowedCompanies.map(c => c.id);
    const activeProductsPool = (liveProducts && liveProducts.length > 0) ? liveProducts : MOCK_PRODUCTS;
    const validProducts = activeProductsPool.filter(p => {
      const parentComp = activeCompaniesPool.find(c => c.id === p.company_id);
      const matchesComp = allowedCompanyIds.length === 0 || allowedCompanyIds.includes(p.company_id) || isCompanyAllowedForUser(p.product_name, spHandle);
      const prodSeg = (p.segment || parentComp?.segment || 'FMCG').toUpperCase();
      const matchesSeg = selectedSegments.length === 0 || selectedSegments.some(s => prodSeg.includes(s));
      return matchesComp && matchesSeg;
    });

    if (validProducts.length > 0) {
      const defaultProd = validProducts[0];
      setItems(prev => prev.map(item => {
        const prod = activeProductsPool.find(p => p.id === item.product_id);
        const parentComp = activeCompaniesPool.find(c => c.id === prod?.company_id);
        const prodSeg = (prod?.segment || parentComp?.segment || 'FMCG').toUpperCase();
        const isProdValid = prod && 
          (allowedCompanyIds.length === 0 || allowedCompanyIds.includes(prod.company_id) || isCompanyAllowedForUser(prod.product_name, spHandle)) &&
          (selectedSegments.length === 0 || selectedSegments.some(s => prodSeg.includes(s)));

        if (!isProdValid) {
          return {
            ...item,
            product_id: defaultProd.id,
            pcs_per_box: defaultProd.pcs_per_box,
            unit_price: defaultProd.unit_price || defaultProd.mrp_price || 100
          };
        }
        return item;
      }));
    }
  }, [salespersonId, selectedSegments, isOpen, orderToEdit, mergedUsers, currentUser, activeCompaniesPool, liveProducts]);


  useEffect(() => {
    if (!isOpen) return;
    if (orderToEdit) {
      setSelectedCompanyIds(orderToEdit.company_id && orderToEdit.company_id !== 'ALL' && orderToEdit.company_id !== 'c01' ? [orderToEdit.company_id] : []);
      setAgencyId(orderToEdit.agency_id || MOCK_AGENCIES[0]?.id || '');
      setDeliveryType(orderToEdit.delivery_type || 'F.O.R');
      setRemarks(orderToEdit.remarks || '');
      if (orderToEdit.salesperson_id) {
        setSalespersonId(orderToEdit.salesperson_id);
      }
      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setItems(orderToEdit.items.map(item => ({
          product_id: item.product_id,
          pcs_per_box: item.pcs_per_box || 24,
          box_qty: item.box_qty || 0,
          loose_pcs: item.loose_pcs || 0,
          free_pcs: item.free_pcs || 0,
          unit_price: item.unit_price || 100,
          remark: item.remark || ''
        })));
      }
    } else if (initialAgencyId) {
      setAgencyId(initialAgencyId);
    }
  }, [orderToEdit, initialAgencyId, isOpen]);


  if (!isOpen) return null;

  const handleProductChange = (index: number, productId: string) => {
    // Avoid multiple duplicate product selection
    const isAlreadySelected = items.some((item, i) => i !== index && item.product_id === productId);
    if (isAlreadySelected) {
      alert('This product SKU is already added to this order. Please adjust box quantity on that row instead.');
      return;
    }

    const prod = activeProductsPool.find(p => p.id === productId) || MOCK_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        pcs_per_box: prod.pcs_per_box,
        unit_price: prod.unit_price || prod.mrp_price || 100
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, field: 'box_qty' | 'free_pcs', val: number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: Math.max(0, val)
      };
      return updated;
    });
  };

  const handleRemarkChange = (index: number, val: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        remark: val
      };
      return updated;
    });
  };

  const addItemRow = () => {
    const existingProductIds = items.map(i => i.product_id);
    const availableProds = activeProductsPool.filter(p => {
      const parentComp = activeCompaniesPool.find(c => c.id === p.company_id);
      const matchesBrand = (selectedCompanyIds.length === 0 || selectedCompanyIds.includes(p.company_id)) &&
        isCompanyAllowedForUser(parentComp?.company_name, activeSalespersonHandle, parentComp?.company_code);
      const prodSeg = (p.segment || parentComp?.segment || 'FMCG').toUpperCase();
      const matchesSeg = selectedSegments.length === 0 || selectedSegments.some(s => prodSeg.includes(s));
      return matchesBrand && matchesSeg;
    });

    const nextUnselectedProd = availableProds.find(p => !existingProductIds.includes(p.id)) || availableProds[0] || liveProducts[0] || MOCK_PRODUCTS[0];

    if (!nextUnselectedProd) return;

    setItems(prev => [
      ...prev,
      {
        product_id: nextUnselectedProd.id,
        pcs_per_box: nextUnselectedProd.pcs_per_box || 24,
        box_qty: 5,
        loose_pcs: 0,
        free_pcs: 0,
        unit_price: nextUnselectedProd.unit_price || nextUnselectedProd.mrp_price || 0,
        remark: ''
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Auto Calculations
  const processedItems = items.map((item, idx) => {
    const rawItem = item as any;
    const prod = activeProductsPool.find(p => p.id === item.product_id || (p.product_name && p.product_name === rawItem.product_name)) || activeProductsPool[0] || {
      id: item.product_id || `prd_${idx + 1}`,
      product_name: rawItem.product_name || 'Selected Product SKU',
      product_code: rawItem.product_code || 'SKU-001',
      pcs_per_box: 24,
      unit_price: item.unit_price || 100,
      mrp_price: rawItem.mrp_price || 120
    };
    const boxQty = item.box_qty || 0;
    const loosePcs = 0;
    const freePcs = item.free_pcs || 0;
    const pcsPerBox = prod?.pcs_per_box || 24;
    const totalQtyPcs = (boxQty * pcsPerBox) + freePcs;
    const unitPrice = item.unit_price || prod?.unit_price || prod?.mrp_price || 0;
    const mrpPrice = prod?.mrp_price || Math.round(unitPrice * 1.15);
    const totalPrice = (boxQty * pcsPerBox) * unitPrice;

    return {
      id: `item-${idx + 1}`,
      product_id: prod?.id || item.product_id || `prd_${idx + 1}`,
      product_name: prod?.product_name || rawItem.product_name || 'Selected Product SKU',
      product_code: prod?.product_code || rawItem.product_code || 'SKU-001',
      pcs_per_box: pcsPerBox,
      box_qty: boxQty,
      loose_pcs: 0,
      free_pcs: freePcs,
      total_qty_pcs: totalQtyPcs,
      dispatched_qty_pcs: 0,
      pending_qty_pcs: totalQtyPcs,
      unit_price: unitPrice,
      mrp_price: mrpPrice,
      total_price: totalPrice,
      remark: item.remark || ''
    };
  });

  const totalBoxQty = processedItems.reduce((acc, curr) => acc + curr.box_qty, 0);
  const totalLoosePcs = 0;
  const totalFreePcs = processedItems.reduce((acc, curr) => acc + (curr.free_pcs || 0), 0);
  const totalQtyPcs = processedItems.reduce((acc, curr) => acc + curr.total_qty_pcs, 0);
  const totalAmount = processedItems.reduce((acc, curr) => acc + curr.total_price, 0);

  const getProduct3LetterPrefix = (productName: string) => {
    const clean = productName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return clean.substring(0, 3) || 'PRD';
  };

  const handleSubmit = (status: 'DRAFT' | 'SUBMITTED') => {
    const resolvedCompany = selectedCompanyIds.length === 1 
      ? (activeCompaniesPool.find(c => c.id === selectedCompanyIds[0]) || MOCK_COMPANIES.find(c => c.id === selectedCompanyIds[0]))
      : (allowedBrandsForActiveSalesperson.length === 1
          ? allowedBrandsForActiveSalesperson[0]
          : { id: allowedBrandsForActiveSalesperson[0]?.id || 'ee1d810b-aa74-4dd8-bf1a-de5f31212ebd', company_name: `${selectedSegments.join(' & ')} Multi-Brand`, company_code: allowedBrandsForActiveSalesperson[0]?.company_code || 'PRG' });
    
    const selectedAgency = activeAgenciesPool.find(a => a.id === agencyId) || MOCK_AGENCIES.find(a => a.id === agencyId);

    // Format Order Number: BrandCode-DDMMYYYY-Seq (e.g., WI-30082026-001)
    const brandCode = resolvedCompany?.company_code || 'PRG';
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const seqStr = String(Math.floor(1 + Math.random() * 999)).padStart(3, '0');

    const generatedOrderNumber = `${brandCode}-${dateStr}-${seqStr}`;
    const finalOrderNumber = orderToEdit ? orderToEdit.order_number : generatedOrderNumber;
    const finalOrderId = (orderToEdit && isValidUuid(orderToEdit.id)) ? orderToEdit.id : generateUuid();

    // Format Product Item ID
    const itemsWithFormattedIds: OrderItem[] = processedItems.map((item, idx) => {
      const itemUuid = (item.id && isValidUuid(item.id)) ? item.id : generateUuid();
      return {
        ...item,
        id: itemUuid,
        order_id: finalOrderId
      };
    });

    const finalSalespersonName = isAdminOrASM 
      ? (activeSalesperson?.full_name || 'Amit Kumar')
      : (currentUser?.full_name || 'Amit Kumar');

    const finalSalespersonId = isAdminOrASM 
      ? (activeSalesperson?.id || currentUser?.id || 'u12')
      : (currentUser?.id || 'u12');

    const isFinancialChanged = !!orderToEdit && (
      orderToEdit.agency_id !== agencyId ||
      orderToEdit.total_amount !== totalAmount ||
      orderToEdit.total_qty_pcs !== totalQtyPcs
    );

    const accountsApprovalStatus = (orderToEdit?.need_accounts_approval && orderToEdit.accounts_approval_status === 'APPROVED' && isFinancialChanged)
      ? 'PENDING'
      : (orderToEdit?.accounts_approval_status || (orderToEdit?.need_accounts_approval ? 'PENDING' : 'NOT_REQUIRED'));

    const editHistoryEntry: any = orderToEdit ? {
      id: generateUuid(),
      order_id: finalOrderId,
      action: 'ORDER_EDITED',
      performed_by: currentUser?.full_name || 'Sales Admin',
      performed_at: new Date().toISOString(),
      remarks: (isFinancialChanged && orderToEdit.accounts_approval_status === 'APPROVED')
        ? 'Order modified (financial / items changed) — Accounts approval reset to PENDING'
        : 'Order details modified'
    } : {
      id: generateUuid(),
      order_id: finalOrderId,
      action: 'ORDER_CREATED',
      performed_by: currentUser?.full_name || 'Salesperson',
      performed_at: new Date().toISOString(),
      remarks: 'Order created'
    };

    const newOrder: Order = {
      ...(orderToEdit || {}),
      id: finalOrderId,
      order_number: finalOrderNumber,
      order_date: orderToEdit ? orderToEdit.order_date : new Date().toISOString().replace('T', ' ').substring(0, 16),
      company_id: resolvedCompany?.id || selectedCompanyIds[0] || orderToEdit?.company_id || 'ee1d810b-aa74-4dd8-bf1a-de5f31212ebd',
      company_name: resolvedCompany?.company_name || orderToEdit?.company_name,
      agency_id: agencyId,
      agency_name: selectedAgency?.agency_name || orderToEdit?.agency_name,
      area_id: selectedAgency?.area_id || orderToEdit?.area_id || '',
      area_name: selectedAgency?.area_name || orderToEdit?.area_name || 'Delhi NCR Territory',
      salesperson_id: finalSalespersonId,
      salesperson_name: finalSalespersonName,
      asm_id: orderToEdit?.asm_id || 'e6666666-6666-6666-6666-666666666666',
      status: status,
      total_box_qty: totalBoxQty,
      total_loose_pcs: totalLoosePcs,
      total_qty_pcs: totalQtyPcs,
      total_amount: totalAmount,
      remarks: remarks,
      delivery_type: deliveryType,
      items: itemsWithFormattedIds,
      need_accounts_approval: orderToEdit?.need_accounts_approval ?? false,
      accounts_approval_status: accountsApprovalStatus,
      order_history: [...(orderToEdit?.order_history || []), editHistoryEntry]
    };

    onSubmitOrder(newOrder);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 1150, width: '95vw', paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
              {orderToEdit ? `Edit Agency Order (${orderToEdit.order_number})` : 'Create Agency Order'}
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              {orderToEdit 
                ? `Modify SKU Quantities, Schemes, or Delivery Instructions before Approval`
                : (isAdminOrASM 
                    ? `System Admin / ASM Order Entry on Behalf of Field Sales Executive`
                    : `Field Sales Executive Self Order Entry (${currentUser?.full_name})`
                  )
              }
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Fields Grid: Segment (Multi-Select), Salesperson, Company/Brand (Multi-Select), Agency (Single Select), Delivery */}
        <div className="create-order-grid">
          
          {/* 1. SEGMENTS (MULTI-SELECT TOGGLE PILLS) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
              SEGMENTS (MULTI-SELECT)
            </label>
            <div style={{ display: 'flex', gap: '0.35rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.25rem', height: 38, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => toggleSegment('FMCG')}
                style={{
                  flex: 1,
                  height: '100%',
                  borderRadius: 6,
                  border: selectedSegments.includes('FMCG') ? '1px solid #34d399' : '1px solid transparent',
                  background: selectedSegments.includes('FMCG') ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                  color: selectedSegments.includes('FMCG') ? '#34d399' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.775rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {selectedSegments.includes('FMCG') && <Check size={12} strokeWidth={3} />} FMCG
              </button>
              <button
                type="button"
                onClick={() => toggleSegment('FMCD')}
                style={{
                  flex: 1,
                  height: '100%',
                  borderRadius: 6,
                  border: selectedSegments.includes('FMCD') ? '1px solid #38bdf8' : '1px solid transparent',
                  background: selectedSegments.includes('FMCD') ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: selectedSegments.includes('FMCD') ? '#38bdf8' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.775rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {selectedSegments.includes('FMCD') && <Check size={12} strokeWidth={3} />} FMCD
              </button>
            </div>
          </div>

          {/* 2. SALESPERSON / FIELD EXEC */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>SALESPERSON / EXEC</label>
            {isAdminOrASM ? (
              <select
                value={salespersonId}
                onChange={e => {
                  setSalespersonId(e.target.value);
                  setSelectedCompanyIds([]);
                }}
                style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#34d399', fontWeight: 700, fontSize: '0.825rem', height: 38 }}
              >
                {salesTeamMembers.map(u => {
                  const scopeStr = u.company_handle ? ` [Mapped: ${u.company_handle}]` : ' [All Brands]';
                  return (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role_name.replace(/_/g, ' ')}){scopeStr}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div style={{ padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#34d399', fontWeight: 700, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem', height: 38 }}>
                <UserCheck size={16} color="#34d399" />
                <span>{currentUser?.full_name} (Self)</span>
              </div>
            )}
          </div>

          {/* 3. BRANDS / COMPANIES (MULTI-SELECT) */}
          <div>
            <SearchableMultiBrandSelect 
              selectedCompanyIds={selectedCompanyIds}
              onChangeCompanyIds={setSelectedCompanyIds}
              availableCompanies={allowedBrandsForActiveSalesperson}
              userCompanyHandle={activeSalespersonHandle}
            />
          </div>

          {/* 4. AGENCY / B2B PARTY (SINGLE SELECT) */}
          <div>
            <SearchableAgencySelect 
              selectedAgencyId={agencyId}
              onSelectAgency={setAgencyId}
              agencies={allowedAgenciesForSegment}
              selectedSegments={selectedSegments}
            />
          </div>

          {/* 5. DELIVERY TYPE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DELIVERY TYPE</label>
            <select 
              value={deliveryType} 
              onChange={e => setDeliveryType(e.target.value as 'F.O.R' | 'Self Pickup')}
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem', height: 38 }}
            >
              <option value="F.O.R">F.O.R</option>
              <option value="Self Pickup">Self Pickup</option>
            </select>
          </div>

        </div>

        {/* Salesperson Assigned Brands & Segments Banner */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.5rem 0.85rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Mapped Scope for <strong>{activeSalesperson?.full_name}</strong>: </span>
            <strong style={{ color: '#34d399' }}>{activeSalespersonHandle}</strong>
            <span style={{ color: '#64748b', marginLeft: 8 }}>| Active Segments: </span>
            <strong style={{ color: '#38bdf8' }}>{selectedSegments.join(' & ')}</strong>
          </div>
          <div style={{ color: '#38bdf8', fontWeight: 600 }}>
            Brand Filter: <strong style={{ color: '#34d399' }}>{selectedCompanyIds.length === 0 ? `All (${allowedBrandsForActiveSalesperson.length})` : `${selectedCompanyIds.length} Selected`}</strong>
            <span style={{ color: '#64748b', marginLeft: 8 }}>| Agencies Available: </span>
            <strong style={{ color: '#f8fafc' }}>{allowedAgenciesForSegment.length}</strong>
          </div>
        </div>

        {/* Order Items Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Order Line Items</h3>
            <button onClick={addItemRow} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Add Product Line
            </button>
          </div>

          <div className="data-table-container" style={{ overflow: 'visible', minHeight: 120 }}>
            <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th style={{ width: 300 }}>Product / SKU Selection</th>
                <th style={{ textAlign: 'center' }}>MRP Price</th>
                <th style={{ textAlign: 'center' }}>BOX Qty</th>
                <th style={{ textAlign: 'center' }}>Free PCS</th>
                <th style={{ textAlign: 'center' }}>Total Qty (Pcs)</th>
                <th style={{ width: 140 }}>Remark</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <SearchableProductSelect 
                      selectedProductId={item.product_id}
                      selectedCompanyIds={selectedCompanyIds}
                      selectedSegments={selectedSegments}
                      userCompanyHandle={activeSalespersonHandle}
                      onSelectProduct={(productId) => handleProductChange(index, productId)}
                      products={liveProducts}
                      companies={liveCompanies}
                      alreadySelectedProductIds={items.map(i => i.product_id)}
                    />

                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#34d399' }}>
                    ₹{item.mrp_price}
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>/ Pc</span>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      value={item.box_qty}
                      onChange={e => handleQuantityChange(index, 'box_qty', parseInt(e.target.value) || 0)}
                      style={{ width: 65, padding: '0.35rem', textAlign: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', margin: '0 auto', display: 'block' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      value={item.free_pcs || 0}
                      onChange={e => handleQuantityChange(index, 'free_pcs', parseInt(e.target.value) || 0)}
                      style={{ width: 65, padding: '0.35rem', textAlign: 'center', background: '#0f172a', border: '1px solid #fbbf24', borderRadius: 4, color: '#fbbf24', fontWeight: 800, margin: '0 auto', display: 'block' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.925rem' }}>{item.total_qty_pcs} Pcs</span>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>({item.box_qty} Box + {item.free_pcs || 0} Free)</span>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      placeholder="Line remark..."
                      value={item.remark}
                      onChange={e => handleRemarkChange(index, e.target.value)}
                      style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', fontSize: '0.775rem' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => removeItemRow(index)}
                      disabled={items.length <= 1}
                      style={{ background: 'none', border: 'none', color: items.length <= 1 ? '#475569' : '#f43f5e', cursor: items.length <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Order Remarks */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>ORDER LEVEL REMARKS / NOTES</label>
          <input 
            type="text"
            placeholder="Special delivery instructions or order notes..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
          />
        </div>

        {/* Order Total Volume Summary & Action Buttons (Showing MRP, Hiding Total Cost) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid #334155', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>
              Total Order Volume: <strong style={{ color: '#38bdf8' }}>{totalBoxQty} Boxes / {totalFreePcs} Free ({totalQtyPcs} Total PCS)</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 3 }}>
              🏷️ Order MRP Standard Applied | 🔒 Order Costing Managed by Accounts Gate
            </div>
            <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: 2 }}>
              Booked Salesperson: <strong>{isAdminOrASM ? (activeSalesperson?.full_name || 'Amit Kumar') : (currentUser?.full_name || 'Amit Kumar')}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => handleSubmit('DRAFT')}>
              Save as Draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSubmit('SUBMITTED')}>
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
