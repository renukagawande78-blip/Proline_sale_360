import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Search, ChevronDown, Check, MessageSquare } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AGENCIES, MOCK_PRODUCTS, isCompanyAllowedForUser } from '../lib/supabase';
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
          width: '100%',
          padding: '0.6rem 0.85rem',
          background: '#0f172a',
          border: isOpen ? '1px solid #38bdf8' : '1px solid #334155',
          borderRadius: 6,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {formatAgencyLabel(selectedAgency)}
        </span>
        <ChevronDown size={16} color="#38bdf8" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </div>

      {/* Dropdown Box with Search Bar */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.7), 0 0 15px rgba(56, 189, 248, 0.1)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          {/* Inner Search Bar */}
          <div style={{ padding: '0.6rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} color="#38bdf8" />
            <input 
              type="text"
              placeholder="Search Party Name, Area, or City..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '0.825rem',
                width: '100%',
                fontWeight: 600
              }}
            />
          </div>

          {/* List of Agencies */}
          <div style={{ maxHeight: 210, overflowY: 'auto', padding: '0.35rem' }}>
            {filteredAgencies.length === 0 ? (
              <div style={{ padding: '0.85rem', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                No agency / party matches search
              </div>
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
  onSelectProduct: (productId: string) => void;
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({ selectedProductId, onSelectProduct }) => {
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
    const q = searchQuery.toLowerCase();
    return p.product_name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q);
  });

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 280 }} ref={dropdownRef}>
      {/* Selected Product Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          background: '#0f172a',
          border: isOpen ? '1px solid #38bdf8' : '1px solid #334155',
          borderRadius: 6,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.825rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <span style={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedProduct.product_name}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '0.1rem 0.4rem', borderRadius: 4, flexShrink: 0 }}>
            {selectedProduct.pcs_per_box} pcs/box
          </span>
        </div>
        <ChevronDown size={16} color="#38bdf8" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </div>

      {/* Dropdown Menu with Search Bar */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          width: 360,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.15)',
          zIndex: 200,
          overflow: 'hidden'
        }}>
          {/* Inner Search Box */}
          <div style={{ padding: '0.55rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} color="#38bdf8" />
            <input 
              type="text"
              placeholder="Search product by name or SKU code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '0.825rem',
                width: '100%',
                fontWeight: 600
              }}
            />
          </div>

          {/* Product Items List */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '0.35rem' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '0.85rem', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                No products match search
              </div>
            ) : (
              filteredProducts.map(p => {
                const isSelected = p.id === selectedProductId;
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
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                        Code: {p.product_code} | Pack: {p.pcs_per_box} pcs/box | MRP: ₹{p.unit_price}
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
  const { currentUser } = useAuth();

  const allowedCompanies = MOCK_COMPANIES.filter(c => 
    isCompanyAllowedForUser(c.company_name, currentUser?.company_handle)
  );

  const [companyId, setCompanyId] = useState(allowedCompanies[0]?.id || MOCK_COMPANIES[0].id);
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

  // Compute Order Totals
  const processedItems: OrderItem[] = items.map((item, idx) => {
    const prod = MOCK_PRODUCTS.find(p => p.id === item.product_id);
    const boxQty = item.box_qty || 0;
    const loosePcs = item.loose_pcs || 0;
    const pcsPerBox = item.pcs_per_box || 24;
    const totalPcs = (boxQty * pcsPerBox) + loosePcs;
    const unitPrice = item.unit_price || 0;
    const totalPrice = totalPcs * unitPrice;

    return {
      id: 'item_' + idx,
      order_id: '',
      product_id: item.product_id || '',
      product_name: prod?.product_name || 'Selected Product',
      pcs_per_box: pcsPerBox,
      box_qty: boxQty,
      loose_pcs: loosePcs,
      total_qty_pcs: totalPcs,
      unit_price: unitPrice,
      total_price: totalPrice,
      dispatched_qty_pcs: 0,
      pending_qty_pcs: totalPcs,
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
    const selectedCompany = MOCK_COMPANIES.find(c => c.id === companyId);
    const selectedAgency = MOCK_AGENCIES.find(a => a.id === agencyId);

    // Format Order Number: BrandCode-DDMMYYYY-Seq (e.g., PRO-08082026-001 or FMCG-08082026-001)
    const brandCode = selectedCompany?.company_code || 'PRO';
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const seqStr = String(Math.floor(1 + Math.random() * 999)).padStart(3, '0');

    const generatedOrderNumber = `${brandCode}-${dateStr}-${seqStr}`;

    // Format Product Item ID: OrderID/Product3Letters-Index (e.g., PRO-08082026-001/PRY-1)
    const itemsWithFormattedIds: OrderItem[] = processedItems.map((item, idx) => {
      const p3 = getProduct3LetterPrefix(item.product_name || 'PRD');
      const itemId = `${generatedOrderNumber}/${p3}-${idx + 1}`;
      return {
        ...item,
        id: itemId,
        order_id: generatedOrderNumber
      };
    });

    const newOrder: Order = {
      id: generatedOrderNumber,
      order_number: generatedOrderNumber,
      order_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      company_id: companyId,
      company_name: selectedCompany?.company_name,
      agency_id: agencyId,
      agency_name: selectedAgency?.agency_name,
      area_id: selectedAgency?.area_id || '',
      area_name: selectedAgency?.area_name || 'Delhi NCR Territory',
      salesperson_id: 'e7777777-7777-7777-7777-777777777777',
      salesperson_name: 'Amit Kumar',
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
      <div className="modal-card" style={{ maxWidth: 1020 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Create Agency Order</h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>Salesperson B2B Order Entry with Box / PCS auto-calculation</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>SEGMENT</label>
            <select 
              value={companyId} 
              onChange={e => setCompanyId(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
            >
              {allowedCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <SearchableAgencySelect 
              selectedAgencyId={agencyId}
              onSelectAgency={setAgencyId}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DELIVERY TYPE</label>
            <select 
              value={deliveryType} 
              onChange={e => setDeliveryType(e.target.value as 'F.O.R' | 'Self Pickup')}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
            >
              <option value="F.O.R">F.O.R</option>
              <option value="Self Pickup">Self Pickup</option>
            </select>
          </div>
        </div>

        {/* Order Items Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Order Line Items</h3>
            <button onClick={addItemRow} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Add Product
            </button>
          </div>

          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th style={{ width: 300 }}>Product</th>
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
                  <td style={{ padding: '0.5rem 0.5rem' }}>
                    <SearchableProductSelect 
                      selectedProductId={item.product_id}
                      onSelectProduct={id => handleProductChange(index, id)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>₹{item.unit_price}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      value={item.box_qty} 
                      onChange={e => handleQuantityChange(index, 'box_qty', parseInt(e.target.value) || 0)}
                      style={{ width: 65, padding: '0.45rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', textAlign: 'center', fontWeight: 700 }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      value={item.loose_pcs} 
                      onChange={e => handleQuantityChange(index, 'loose_pcs', parseInt(e.target.value) || 0)}
                      style={{ width: 65, padding: '0.45rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', textAlign: 'center', fontWeight: 700 }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>{item.total_qty_pcs}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>₹{item.total_price.toLocaleString()}</span>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={item.remark || ''} 
                      onChange={e => handleRemarkChange(index, e.target.value)}
                      placeholder="Line remark..."
                      style={{ width: '100%', padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.775rem' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => removeItemRow(index)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }} title="Delete row">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Box */}
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: 8, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700 }}>
            <Calculator size={18} />
            <span>Order Summary:</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
            <div>Boxes: <span style={{ fontWeight: 800 }}>{totalBoxQty}</span></div>
            <div>Loose PCS: <span style={{ fontWeight: 800 }}>{totalLoosePcs}</span></div>
            <div>Total PCS: <span style={{ fontWeight: 800, color: '#34d399' }}>{totalQtyPcs}</span></div>
            <div>Total Value: <span style={{ fontWeight: 800, color: '#38bdf8' }}>₹{totalAmount.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Overall Order Remarks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            <MessageSquare size={15} color="#38bdf8" /> ORDER REMARKS / SPECIAL INSTRUCTIONS
          </label>
          <input 
            type="text" 
            value={remarks} 
            onChange={e => setRemarks(e.target.value)}
            placeholder="Special delivery instructions, urgency notes, batch preferences..."
            style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.85rem' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => handleSubmit('DRAFT')}>Save as Draft</button>
          <button className="btn btn-primary" onClick={() => handleSubmit('SUBMITTED')}>Submit Order to Admin</button>
        </div>
      </div>
    </div>
  );
};
