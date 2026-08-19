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
  deduplicateCompanies,
  deduplicateAgencies,
  deduplicateProducts 
} from '../lib/supabase';

import { Order, OrderItem, Agency, Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface SearchableAgencySelectProps {
  selectedAgencyId: string;
  onSelectAgency: (agencyId: string) => void;
  agencies?: Agency[];
}

export const SearchableAgencySelect: React.FC<SearchableAgencySelectProps> = ({ selectedAgencyId, onSelectAgency, agencies }) => {
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
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>AGENCY / B2B PARTY</label>

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
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No matching agency found</div>
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
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {formatAgencyLabel(a)}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: 2 }}>
                        Code: {a.agency_code} | Contact: {a.contact_person} ({a.mobile})
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

interface SearchableProductSelectProps {
  selectedProductId: string;
  selectedCompanyId: string;
  selectedSegment: string;
  userCompanyHandle?: string;
  onSelectProduct: (productId: string) => void;
  products?: Product[];
  companies?: any[];
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({ 
  selectedProductId, 
  selectedCompanyId,
  selectedSegment,
  userCompanyHandle,
  onSelectProduct,
  products,
  companies
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProducts = (products && products.length > 0) ? products : MOCK_PRODUCTS;
  const activeCompanies = (companies && companies.length > 0) ? companies : MOCK_COMPANIES;

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId) || activeProducts[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = activeProducts.filter(p => {
    // 1. Company Brand Filter: if specific company selected, match company_id. If 'ALL', match userCompanyHandle scope!
    let matchesCompany = true;
    if (selectedCompanyId && selectedCompanyId !== 'ALL') {
      matchesCompany = p.company_id === selectedCompanyId;
    } else {
      const parentCompany = activeCompanies.find(c => c.id === p.company_id);
      matchesCompany = isCompanyAllowedForUser(parentCompany?.company_name, userCompanyHandle, parentCompany?.company_code);
    }

    // 2. Segment Filter: if FMCG or FMCD selected, match segment
    let matchesSegment = true;
    if (selectedSegment && selectedSegment !== 'ALL') {
      const parentCompany = activeCompanies.find(c => c.id === p.company_id);
      matchesSegment = (parentCompany?.segment === selectedSegment) || (p.segment === selectedSegment);
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
        onClick={() => setIsOpen(!isOpen)}
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
            padding: '0.5rem',
            width: 340
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.4rem 0.6rem', marginBottom: '0.5rem', gap: '0.4rem' }}>
            <Search size={14} color="#38bdf8" />
            <input 
              type="text" 
              placeholder="Search product name or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ maxHeight: 210, overflowY: 'auto' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No matching products for this brand & segment</div>
            ) : (
              filteredProducts.map(p => {
                const isSelected = p.id === selectedProductId;
                const parentCompany = MOCK_COMPANIES.find(c => c.id === p.company_id);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '0.55rem 0.75rem',
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
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {p?.product_name || 'Product Item'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: 2, fontWeight: 600 }}>
                        Brand: {parentCompany?.company_name || 'General'} | Pack: {p.pcs_per_box} pcs/box | MRP: ₹{p.unit_price}
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

  const salesTeamMembers = users.filter(u => 
    u.role_name === 'SALES_PERSON' || 
    u.role_name === 'AREA_SALES_MANAGER' || 
    u.role_name === 'SALES_ADMIN' ||
    u.role_name === 'SUPER_ADMIN'
  );

  const isAdminOrASM = currentUser?.role_name === 'SUPER_ADMIN' || 
                       currentUser?.role_name === 'SALES_ADMIN' || 
                       currentUser?.role_name === 'AREA_SALES_MANAGER';

  const activeUserSegment = resolveSegmentForUser(currentUser);
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | 'FMCG' | 'FMCD'>(activeUserSegment);
  const [salespersonId, setSalespersonId] = useState(currentUser?.id || salesTeamMembers[0]?.id || 'u12');
  
  // Active Salesperson & assigned brand handle scope
  const activeSalesperson = users.find(u => u.id === salespersonId) || currentUser;
  const activeSalespersonHandle = activeSalesperson?.company_handle || currentUser?.company_handle || 'All';

  // Live state fetched directly from Supabase
  const [liveCompanies, setLiveCompanies] = useState<any[]>(MOCK_COMPANIES);
  const [liveAgencies, setLiveAgencies] = useState<Agency[]>(MOCK_AGENCIES);
  const [liveProducts, setLiveProducts] = useState<Product[]>(MOCK_PRODUCTS);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadLiveDataFromSupabase() {
      try {
        const [compData, agRes, prodData] = await Promise.all([
          fetchCompaniesFromSupabase(),
          fetchAgenciesFromSupabaseTable(),
          fetchProductsFromSupabase()
        ]);
        if (isMounted) {
          if (compData && compData.length > 0) setLiveCompanies(deduplicateCompanies([...compData, ...MOCK_COMPANIES]));
          if (agRes && agRes.agencies && agRes.agencies.length > 0) setLiveAgencies(deduplicateAgencies([...agRes.agencies, ...MOCK_AGENCIES]));
          if (prodData && prodData.length > 0) setLiveProducts(deduplicateProducts([...prodData, ...MOCK_PRODUCTS]));
        }
      } catch (err) {
        console.warn('Supabase live fetch notice in CreateOrderModal:', err);
      }
    }
    loadLiveDataFromSupabase();
    return () => { isMounted = false; };
  }, [isOpen]);

  const activeCompaniesPool = (liveCompanies && liveCompanies.length > 0) ? liveCompanies : MOCK_COMPANIES;
  const activeAgenciesPool = (liveAgencies && liveAgencies.length > 0) ? liveAgencies : MOCK_AGENCIES;

  // Brands allowed for active salesperson & segment filter
  const allowedBrandsForActiveSalesperson = activeCompaniesPool.filter(c => {
    const matchesBrand = isCompanyAllowedForUser(c.company_name, activeSalespersonHandle, c.company_code);
    const matchesSegment = selectedSegment === 'ALL' || c.segment === selectedSegment;
    return matchesBrand && matchesSegment;
  });

  const [companyId, setCompanyId] = useState<string>('ALL'); // Default to 'ALL' Brands!
  const [agencyId, setAgencyId] = useState(activeAgenciesPool[0]?.id || '');

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

    const activeSp = users.find(u => u.id === salespersonId) || currentUser;
    if (!activeSp) return;

    const spHandle = activeSp.company_handle || 'All';
    const spSegment = resolveSegmentForUser(activeSp);

    // 1. Auto-sync segment if salesperson is dedicated to a segment
    if (spSegment !== 'ALL') {
      setSelectedSegment(spSegment);
    }

    // 2. Determine allowed companies for this salesperson
    const allowedCompanies = activeCompaniesPool.filter(c => 
      isCompanyAllowedForUser(c.company_name, spHandle, c.company_code)
    );

    // If single brand mapped to salesperson (e.g. Sagar -> Mogu Mogu), auto-select that single brand!
    if (allowedCompanies.length === 1) {
      setCompanyId(allowedCompanies[0].id);
    } else {
      setCompanyId('ALL');
    }

    // 3. Auto-sync agency selector if current agency is not allowed for this salesperson
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

    // 4. Ensure line items use products belonging to allowed brands for this salesperson
    const allowedCompanyIds = allowedCompanies.map(c => c.id);
    const activeProductsPool = (liveProducts && liveProducts.length > 0) ? liveProducts : MOCK_PRODUCTS;
    const validProducts = activeProductsPool.filter(p => 
      allowedCompanyIds.length === 0 || allowedCompanyIds.includes(p.company_id) || isCompanyAllowedForUser(p.product_name, spHandle)
    );

    if (validProducts.length > 0) {
      const defaultProd = validProducts[0];
      setItems(prev => prev.map(item => {
        const prod = activeProductsPool.find(p => p.id === item.product_id);
        const isProdValid = prod && (allowedCompanyIds.length === 0 || allowedCompanyIds.includes(prod.company_id) || isCompanyAllowedForUser(prod.product_name, spHandle));
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
  }, [salespersonId, isOpen, orderToEdit, users, currentUser]);


  useEffect(() => {
    if (!isOpen) return;
    if (orderToEdit) {
      setCompanyId(orderToEdit.company_id || 'ALL');
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
    const prod = MOCK_PRODUCTS.find(p => p.id === productId);
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
    const firstProd = MOCK_PRODUCTS[0];
    setItems(prev => [
      ...prev,
      {
        product_id: firstProd?.id || '',
        pcs_per_box: firstProd?.pcs_per_box || 24,
        box_qty: 5,
        loose_pcs: 0,
        free_pcs: 0,
        unit_price: firstProd?.unit_price || 0,
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
    const prod = MOCK_PRODUCTS.find(p => p.id === item.product_id || (p.product_name && p.product_name === rawItem.product_name)) || MOCK_PRODUCTS[0] || {
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
    const selectedCompany = companyId === 'ALL' 
      ? { id: 'ALL', company_name: selectedSegment === 'ALL' ? 'Multi-Brand' : `${selectedSegment} Multi-Brand`, company_code: 'PRG' }
      : MOCK_COMPANIES.find(c => c.id === companyId);
    
    const selectedAgency = MOCK_AGENCIES.find(a => a.id === agencyId);

    // Format Order Number: BrandCode-DDMMYYYY-Seq (e.g., PRG-08082026-001 or FMCG-08082026-001)
    const brandCode = selectedCompany?.company_code || 'PRG';
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const seqStr = String(Math.floor(1 + Math.random() * 999)).padStart(3, '0');

    const generatedOrderNumber = `${brandCode}-${dateStr}-${seqStr}`;
    const finalOrderNumber = orderToEdit ? orderToEdit.order_number : generatedOrderNumber;
    const finalOrderId = orderToEdit ? orderToEdit.id : generatedOrderNumber;

    // Format Product Item ID: OrderID/Product3Letters-Index (e.g., PRG-08082026-001/PRY-1)
    const itemsWithFormattedIds: OrderItem[] = processedItems.map((item, idx) => {
      const p3 = getProduct3LetterPrefix(item.product_name || 'PRD');
      const itemId = `${finalOrderNumber}/${p3}-${idx + 1}`;
      return {
        ...item,
        id: itemId,
        order_id: finalOrderNumber
      };
    });

    const finalSalespersonName = isAdminOrASM 
      ? (activeSalesperson?.full_name || 'Amit Kumar')
      : (currentUser?.full_name || 'Amit Kumar');

    const finalSalespersonId = isAdminOrASM 
      ? (activeSalesperson?.id || currentUser?.id || 'u12')
      : (currentUser?.id || 'u12');

    const newOrder: Order = {
      id: finalOrderId,
      order_number: finalOrderNumber,
      order_date: orderToEdit ? orderToEdit.order_date : new Date().toISOString().replace('T', ' ').substring(0, 16),
      company_id: companyId === 'ALL' ? 'c01' : companyId,
      company_name: selectedCompany?.company_name,
      agency_id: agencyId,
      agency_name: selectedAgency?.agency_name,
      area_id: selectedAgency?.area_id || '',
      area_name: selectedAgency?.area_name || 'Delhi NCR Territory',
      salesperson_id: finalSalespersonId,
      salesperson_name: finalSalespersonName,
      asm_id: 'e6666666-6666-6666-6666-666666666666',
      status: status,
      total_box_qty: totalBoxQty,
      total_loose_pcs: totalLoosePcs,
      total_qty_pcs: totalQtyPcs,
      total_amount: totalAmount,
      remarks: remarks,
      delivery_type: deliveryType,
      items: itemsWithFormattedIds
    };

    onSubmitOrder(newOrder);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 1150, width: '95vw' }}>
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

        {/* Form Fields Grid: Segment, Salesperson, Company/Brand (with All Option), Agency, Delivery */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr 1.5fr 1.5fr 1.1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          
          {/* 1. SEGMENT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>SEGMENT</label>
            <select 
              value={selectedSegment} 
              onChange={e => {
                setSelectedSegment(e.target.value as any);
                setCompanyId('ALL');
              }}
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#38bdf8', fontWeight: 700, fontSize: '0.825rem' }}
            >
              <option value="ALL">All Segments (FMCG & FMCD)</option>
              <option value="FMCG">FMCG (Fast-Moving Consumer Goods)</option>
              <option value="FMCD">FMCD (Fast-Moving Consumer Durables)</option>
            </select>
          </div>

          {/* 2. SALESPERSON / FIELD EXEC */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>SALESPERSON / EXEC</label>
            {isAdminOrASM ? (
              <select
                value={salespersonId}
                onChange={e => {
                  setSalespersonId(e.target.value);
                  setCompanyId('ALL');
                }}
                style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 6, color: '#34d399', fontWeight: 700, fontSize: '0.825rem' }}
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
              <div style={{ padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#34d399', fontWeight: 700, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={16} color="#34d399" />
                <span>{currentUser?.full_name} (Self)</span>
              </div>
            )}
          </div>

          {/* 3. COMPANY / BRAND HANDLE (With 'All Brands' Option) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>COMPANY / BRAND</label>
            <select 
              value={companyId} 
              onChange={e => setCompanyId(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
            >
              <option value="ALL">All Brands ({allowedBrandsForActiveSalesperson.length})</option>
              {allowedBrandsForActiveSalesperson.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          {/* 4. AGENCY / B2B PARTY */}
          <div>
            <SearchableAgencySelect 
              selectedAgencyId={agencyId}
              onSelectAgency={setAgencyId}
              agencies={activeAgenciesPool}
            />
          </div>


          {/* 5. DELIVERY TYPE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DELIVERY TYPE</label>
            <select 
              value={deliveryType} 
              onChange={e => setDeliveryType(e.target.value as 'F.O.R' | 'Self Pickup')}
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
            >
              <option value="F.O.R">F.O.R</option>
              <option value="Self Pickup">Self Pickup</option>
            </select>
          </div>

        </div>

        {/* Salesperson Assigned Brands Info Banner */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.5rem 0.85rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Assigned Brand Handles for <strong>{activeSalesperson?.full_name}</strong>: </span>
            <strong style={{ color: '#34d399' }}>{activeSalespersonHandle}</strong>
          </div>
          <div style={{ color: '#38bdf8', fontWeight: 600 }}>
            Active Selection: <strong>{companyId === 'ALL' ? 'All Assigned Brands' : MOCK_COMPANIES.find(c => c.id === companyId)?.company_name}</strong>
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
                      selectedCompanyId={companyId}
                      selectedSegment={selectedSegment}
                      userCompanyHandle={activeSalespersonHandle}
                      onSelectProduct={(productId) => handleProductChange(index, productId)}
                      products={liveProducts}
                      companies={liveCompanies}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid #334155' }}>
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
