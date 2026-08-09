import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Search, ChevronDown, Check, MessageSquare, UserCheck, Layers } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AGENCIES, MOCK_PRODUCTS, isCompanyAllowedForUser, resolveSegmentForUser } from '../lib/supabase';
import { Order, OrderItem, Agency, Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface SearchableAgencySelectProps {
  selectedAgencyId: string;
  onSelectAgency: (agencyId: string) => void;
}

export const SearchableAgencySelect: React.FC<SearchableAgencySelectProps> = ({ selectedAgencyId, onSelectAgency }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAgency = MOCK_AGENCIES.find(a => a.id === selectedAgencyId) || MOCK_AGENCIES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAgencies = MOCK_AGENCIES.filter(a => {
    const q = searchQuery.toLowerCase();
    const nameMatch = a.agency_name.toLowerCase().includes(q);
    const areaMatch = (a.area_name || '').toLowerCase().includes(q);
    const cityMatch = (a.city || '').toLowerCase().includes(q);
    const codeMatch = a.agency_code.toLowerCase().includes(q);
    return nameMatch || areaMatch || cityMatch || codeMatch;
  });

  const formatAgencyLabel = (agency: Agency) => {
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
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({ 
  selectedProductId, 
  selectedCompanyId,
  selectedSegment,
  userCompanyHandle,
  onSelectProduct 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = MOCK_PRODUCTS.find(p => p.id === selectedProductId) || MOCK_PRODUCTS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    // 1. Company Brand Filter: if specific company selected, match company_id. If 'ALL', match userCompanyHandle scope!
    let matchesCompany = true;
    if (selectedCompanyId && selectedCompanyId !== 'ALL') {
      matchesCompany = p.company_id === selectedCompanyId;
    } else {
      const parentCompany = MOCK_COMPANIES.find(c => c.id === p.company_id);
      matchesCompany = isCompanyAllowedForUser(parentCompany?.company_name, userCompanyHandle);
    }

    // 2. Segment Filter: if FMCG or FMEG selected, match segment
    let matchesSegment = true;
    if (selectedSegment && selectedSegment !== 'ALL') {
      const parentCompany = MOCK_COMPANIES.find(c => c.id === p.company_id);
      matchesSegment = (parentCompany?.segment === selectedSegment) || (p.segment === selectedSegment);
    }

    // 3. Search Query Match
    const q = searchQuery.toLowerCase();
    const nameMatch = p.product_name.toLowerCase().includes(q);
    const codeMatch = p.product_code.toLowerCase().includes(q);

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
          {selectedProduct.product_name}
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
                        {p.product_name}
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
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSubmitOrder }) => {
  const { currentUser, users } = useAuth();

  const salesTeamMembers = users.filter(u => 
    u.role_name === 'SALES_PERSON' || 
    u.role_name === 'AREA_SALES_MANAGER' || 
    u.role_name === 'SALES_ADMIN' ||
    u.role_name === 'SYSTEM_ADMIN' ||
    u.role_name === 'SUPER_ADMIN'
  );

  const isAdminOrASM = currentUser?.role_name === 'SYSTEM_ADMIN' || 
                       currentUser?.role_name === 'SUPER_ADMIN' || 
                       currentUser?.role_name === 'SALES_ADMIN' || 
                       currentUser?.role_name === 'AREA_SALES_MANAGER';

  const activeUserSegment = resolveSegmentForUser(currentUser);
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | 'FMCG' | 'FMCD'>(activeUserSegment);
  const [salespersonId, setSalespersonId] = useState(currentUser?.id || salesTeamMembers[0]?.id || 'u12');
  
  // Active Salesperson & assigned brand handle scope
  const activeSalesperson = users.find(u => u.id === salespersonId) || currentUser;
  const activeSalespersonHandle = activeSalesperson?.company_handle || currentUser?.company_handle || 'All';

  // Brands allowed for active salesperson & segment filter
  const allowedBrandsForActiveSalesperson = MOCK_COMPANIES.filter(c => {
    const matchesBrand = isCompanyAllowedForUser(c.company_name, activeSalespersonHandle);
    const matchesSegment = selectedSegment === 'ALL' || c.segment === selectedSegment;
    return matchesBrand && matchesSegment;
  });

  const [companyId, setCompanyId] = useState<string>('ALL'); // Default to 'ALL' Brands!
  const [agencyId, setAgencyId] = useState(MOCK_AGENCIES[0].id);
  const [deliveryType, setDeliveryType] = useState<'F.O.R' | 'Self Pickup'>('F.O.R');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<Partial<OrderItem>[]>([
    {
      product_id: MOCK_PRODUCTS[0].id,
      pcs_per_box: MOCK_PRODUCTS[0].pcs_per_box,
      box_qty: 10,
      loose_pcs: 5,
      unit_price: MOCK_PRODUCTS[0].unit_price,
      remark: ''
    }
  ]);

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
        unit_price: prod.unit_price
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, field: 'box_qty' | 'loose_pcs', val: number) => {
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
        product_id: firstProd.id,
        pcs_per_box: firstProd.pcs_per_box,
        box_qty: 5,
        loose_pcs: 0,
        unit_price: firstProd.unit_price,
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
    const prod = MOCK_PRODUCTS.find(p => p.id === item.product_id) || MOCK_PRODUCTS[0];
    const boxQty = item.box_qty || 0;
    const loosePcs = item.loose_pcs || 0;
    const pcsPerBox = prod.pcs_per_box || 24;
    const totalQtyPcs = (boxQty * pcsPerBox) + loosePcs;
    const unitPrice = item.unit_price || prod.unit_price;
    const totalPrice = totalQtyPcs * unitPrice;

    return {
      id: `item-${idx + 1}`,
      product_id: prod.id,
      product_name: prod.product_name,
      product_code: prod.product_code,
      pcs_per_box: pcsPerBox,
      box_qty: boxQty,
      loose_pcs: loosePcs,
      total_qty_pcs: totalQtyPcs,
      dispatched_qty_pcs: 0,
      pending_qty_pcs: totalQtyPcs,
      unit_price: unitPrice,
      total_price: totalPrice,
      remark: item.remark || ''
    };
  });

  const totalBoxQty = processedItems.reduce((acc, curr) => acc + curr.box_qty, 0);
  const totalLoosePcs = processedItems.reduce((acc, curr) => acc + curr.loose_pcs, 0);
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

    // Format Product Item ID: OrderID/Product3Letters-Index (e.g., PRG-08082026-001/PRY-1)
    const itemsWithFormattedIds: OrderItem[] = processedItems.map((item, idx) => {
      const p3 = getProduct3LetterPrefix(item.product_name || 'PRD');
      const itemId = `${generatedOrderNumber}/${p3}-${idx + 1}`;
      return {
        ...item,
        id: itemId,
        order_id: generatedOrderNumber
      };
    });

    const finalSalespersonName = isAdminOrASM 
      ? (activeSalesperson?.full_name || 'Amit Kumar')
      : (currentUser?.full_name || 'Amit Kumar');

    const finalSalespersonId = isAdminOrASM 
      ? (activeSalesperson?.id || currentUser?.id || 'u12')
      : (currentUser?.id || 'u12');

    const newOrder: Order = {
      id: generatedOrderNumber,
      order_number: generatedOrderNumber,
      order_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Create Agency Order</h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              {isAdminOrASM 
                ? `System Admin / ASM Order Entry on Behalf of Field Sales Executive`
                : `Field Sales Executive Self Order Entry (${currentUser?.full_name})`
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
                {salesTeamMembers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role_name.replace(/_/g, ' ')})
                  </option>
                ))}
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
                <th style={{ width: 320 }}>Product / SKU Selection</th>
                <th style={{ textAlign: 'center' }}>MRP</th>
                <th style={{ textAlign: 'center' }}>BOX</th>
                <th style={{ textAlign: 'center' }}>PCS</th>
                <th style={{ textAlign: 'center' }}>Total Qty</th>
                <th style={{ textAlign: 'right' }}>Total Cost</th>
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
                    />
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>₹{item.unit_price}</td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      value={item.box_qty}
                      onChange={e => handleQuantityChange(index, 'box_qty', parseInt(e.target.value) || 0)}
                      style={{ width: 60, padding: '0.35rem', textAlign: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', margin: '0 auto', display: 'block' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      value={item.loose_pcs}
                      onChange={e => handleQuantityChange(index, 'loose_pcs', parseInt(e.target.value) || 0)}
                      style={{ width: 60, padding: '0.35rem', textAlign: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', margin: '0 auto', display: 'block' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>{item.total_qty_pcs}</span>
                    <span style={{ display: 'block', fontSize: '0.675rem', color: '#94a3b8' }}>({item.box_qty}B + {item.loose_pcs}L)</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                    ₹{item.total_price.toLocaleString()}
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

        {/* Order Total & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid #334155' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Total Volume: <strong style={{ color: 'white' }}>{totalBoxQty} Boxes / {totalLoosePcs} Loose ({totalQtyPcs} PCS)</strong>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
              Order Value: ₹{totalAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#38bdf8', marginTop: 2 }}>
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
