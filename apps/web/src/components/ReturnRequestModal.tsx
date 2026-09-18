import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RefreshCw,
  PackageX,
  Plus,
  Trash2,
  Check,
  Search,
  Building2,
  Store,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Order, ReturnType, ReturnRequest, ReturnRequestItem, Product, Company } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MOCK_PRODUCTS, MOCK_COMPANIES } from '../lib/supabase';

interface ReturnRequestModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReturnRequest: (orderId: string, returnRequestData: ReturnRequest) => void;
  availableOrders?: Order[];
  products?: Product[];
  companies?: Company[];
}

interface EditableReturnItem {
  id: string;
  order_item_id?: string;
  product_id?: string;
  product_name: string;
  product_code?: string;
  pcs_per_box: number;
  box_qty: number;
  loose_pcs: number;
  total_pcs: number;
  unit_price: number;
  max_delivered_pcs?: number;
  is_custom_item?: boolean;
  remark?: string;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  order: initialOrder,
  isOpen,
  onClose,
  onSubmitReturnRequest,
  availableOrders = [],
  products = [],
  companies = []
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // Active order state (either passed prop or selected from dropdown)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(initialOrder);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);

  const [returnType, setReturnType] = useState<ReturnType>('DAMAGED_RETURN');
  const [reason, setReason] = useState('');
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [returnItems, setReturnItems] = useState<EditableReturnItem[]>([]);

  // Pools
  const activeProducts = (products && products.length > 0) ? products : MOCK_PRODUCTS;
  const activeCompanies = (companies && companies.length > 0) ? companies : MOCK_COMPANIES;

  // Sync when initialOrder or isOpen changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedOrder(null);
      setReturnItems([]);
      setReason('');
      setGeneralRemarks('');
      setOrderSearchQuery('');
      setIsOrderDropdownOpen(false);
      return;
    }

    if (initialOrder) {
      setSelectedOrder(initialOrder);
    } else {
      setSelectedOrder(null);
    }
  }, [isOpen, initialOrder]);

  // Determine segment from selected order brand
  const resolvedBrand = useMemo(() => {
    if (!selectedOrder) return null;
    return activeCompanies.find((c: Company) => 
      c.id === selectedOrder.company_id || 
      c.company_name?.toLowerCase() === selectedOrder.company_name?.toLowerCase()
    ) || null;
  }, [selectedOrder, activeCompanies]);

  const isFMCD = useMemo(() => {
    if (resolvedBrand?.segment === 'FMCD') return true;
    if (resolvedBrand?.segment === 'FMCG') return false;
    const orderStr = `${selectedOrder?.company_name || ''} ${selectedOrder?.remarks || ''}`.toLowerCase();
    return orderStr.includes('fmcd') || orderStr.includes('appliance') || orderStr.includes('electronics');
  }, [resolvedBrand, selectedOrder]);

  // Initialize return items when selectedOrder changes
  useEffect(() => {
    if (!selectedOrder) {
      setReturnItems([]);
      return;
    }

    const items: EditableReturnItem[] = (selectedOrder.items || []).map((item, idx) => {
      const pcsPerBox = item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 24;
      const deliveredPcs = item.dispatched_qty_pcs || item.total_qty_pcs || 0;
      return {
        id: `ord-item-${item.id || idx}`,
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Product Item',
        product_code: item.product_code || '',
        pcs_per_box: pcsPerBox,
        box_qty: 0,
        loose_pcs: 0,
        total_pcs: 0,
        unit_price: item.unit_price || 0,
        max_delivered_pcs: deliveredPcs,
        is_custom_item: false,
        remark: ''
      };
    });

    setReturnItems(items);
  }, [selectedOrder]);

  // Filtered available orders for lookup
  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.toLowerCase().trim();
    if (!q) return availableOrders.slice(0, 20);
    return availableOrders.filter(o => 
      o.order_number.toLowerCase().includes(q) ||
      (o.company_name || '').toLowerCase().includes(q) ||
      (o.agency_name || '').toLowerCase().includes(q) ||
      (o.invoice_number || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [availableOrders, orderSearchQuery]);

  // Available extra products belonging to the selected brand that can be added
  const brandProductsPool = useMemo(() => {
    if (!selectedOrder) return [];
    const brandId = selectedOrder.company_id;
    const brandName = (selectedOrder.company_name || '').toLowerCase();

    return activeProducts.filter((p: Product) => {
      if (brandId && p.company_id === brandId) return true;
      if (p.company_name && p.company_name.toLowerCase() === brandName) return true;
      return true; // Fallback to all if brand mapping is loose
    });
  }, [selectedOrder, activeProducts]);

  if (!isOpen) return null;

  // Handlers for item modifications
  const handleBoxQtyChange = (id: string, boxes: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const b = Math.max(0, boxes || 0);
      const total = (b * item.pcs_per_box) + item.loose_pcs;
      return { ...item, box_qty: b, total_pcs: total };
    }));
  };

  const handleLoosePcsChange = (id: string, pcs: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const l = Math.max(0, pcs || 0);
      const total = isFMCD ? l : (item.box_qty * item.pcs_per_box) + l;
      return { ...item, loose_pcs: l, total_pcs: total };
    }));
  };

  const handleItemRemarkChange = (id: string, rem: string) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, remark: rem };
    }));
  };

  const handleAddCustomProductRow = () => {
    const defaultProd = brandProductsPool[0] || activeProducts[0];
    const newItem: EditableReturnItem = {
      id: `custom-prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: defaultProd?.id || '',
      product_name: defaultProd?.product_name || 'Additional Product',
      product_code: defaultProd?.product_code || '',
      pcs_per_box: defaultProd?.pcs_per_box || (isFMCD ? 1 : 24),
      box_qty: 0,
      loose_pcs: 0,
      total_pcs: 0,
      unit_price: defaultProd?.unit_price || 0,
      is_custom_item: true,
      remark: ''
    };

    setReturnItems(prev => [...prev, newItem]);
  };

  const handleCustomProductSelect = (id: string, prodId: string) => {
    const prod = activeProducts.find((p: Product) => p.id === prodId);
    if (!prod) return;

    setReturnItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const pcsPerBox = prod.pcs_per_box || (isFMCD ? 1 : 24);
      const total = isFMCD ? item.loose_pcs : (item.box_qty * pcsPerBox) + item.loose_pcs;
      return {
        ...item,
        product_id: prod.id,
        product_name: prod.product_name,
        product_code: prod.product_code,
        pcs_per_box: pcsPerBox,
        unit_price: prod.unit_price || 0,
        total_pcs: total
      };
    }));
  };

  const handleRemoveItem = (id: string) => {
    setReturnItems(prev => prev.filter(item => item.id !== id));
  };

  const totalReturnBoxes = returnItems.reduce((sum, i) => sum + (i.box_qty || 0), 0);
  const totalReturnPcs = returnItems.reduce((sum, i) => sum + (i.total_pcs || 0), 0);

  const handleSubmit = () => {
    if (!selectedOrder) {
      alert('Please select an order against which to raise this return/damage request.');
      return;
    }

    const itemsToSubmit: ReturnRequestItem[] = returnItems
      .filter(i => (i.total_pcs || 0) > 0)
      .map(item => ({
        id: `ret-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        unit_price: item.unit_price,
        pcs_per_box: item.pcs_per_box,
        box_qty: item.box_qty,
        loose_pcs: item.loose_pcs,
        requested_qty_pcs: item.total_pcs,
        is_custom_item: item.is_custom_item,
        replaced_qty_pcs: returnType === 'REPLACEMENT' ? item.total_pcs : 0,
        damaged_returned_qty_pcs: returnType === 'DAMAGED_RETURN' ? item.total_pcs : 0,
        remark: item.remark
      }));

    if (itemsToSubmit.length === 0) {
      alert('Please specify at least 1 returned or damaged item quantity (Boxes or PCS).');
      return;
    }

    const newRequest: ReturnRequest = {
      id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      order_id: selectedOrder.id,
      order_number: selectedOrder.order_number,
      brand_id: selectedOrder.company_id,
      brand_name: selectedOrder.company_name || resolvedBrand?.company_name || 'Brand',
      agency_id: selectedOrder.agency_id,
      agency_name: selectedOrder.agency_name,
      segment: isFMCD ? 'FMCD' : 'FMCG',
      return_type: returnType,
      reason: reason.trim() || 'Damaged / defective stock reported for collection',
      status: 'PENDING_ADMIN_APPROVAL',
      requested_by_name: currentUser?.full_name || 'Salesperson',
      requested_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: itemsToSubmit,
      collection_remarks: generalRemarks.trim()
    };

    onSubmitReturnRequest(selectedOrder.id, newRequest);

    addNotification({
      title: `🔁 Return/Damage Request Raised: ${selectedOrder.order_number}`,
      message: `${currentUser?.full_name || 'Salesperson'} raised a ${returnType === 'REPLACEMENT' ? 'Stock Replacement' : 'Damaged Goods Return'} for ${selectedOrder.agency_name}. Pending Super Admin Approval.`,
      event_type: 'RETURN_REQUESTED',
      order_id: selectedOrder.id
    });

    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: 980, width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(244,63,94,0.15)', padding: '0.4rem', borderRadius: 8, color: '#f43f5e' }}>
                <PackageX size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Raise Return / Damage Request
                </h2>
                <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                  Create and submit damaged goods return or replacement request for Super Admin approval &amp; dispatch collection
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.35rem' }}>
          
          {/* Section 1: Order Selector (If not pre-locked) */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: 6, textTransform: 'uppercase' }}>
              1. Select Order Against Which Return Is Being Raised
            </label>

            {selectedOrder ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #475569', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 900, color: '#38bdf8', fontSize: '1.05rem' }}>{selectedOrder.order_number}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: '#0f172a', color: '#94a3b8', fontWeight: 700 }}>
                      {selectedOrder.status}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: isFMCD ? 'rgba(56,189,248,0.15)' : 'rgba(52,211,153,0.15)', color: isFMCD ? '#38bdf8' : '#34d399', fontWeight: 800 }}>
                      {isFMCD ? 'FMCD Segment (PCS)' : 'FMCG Segment (BOX & PCS)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: 4, fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building2 size={13} color="#a78bfa" /> Brand: <strong style={{ color: '#ffffff' }}>{selectedOrder.company_name || 'N/A'}</strong>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Store size={13} color="#fbbf24" /> Agency / Party: <strong style={{ color: '#ffffff' }}>{selectedOrder.agency_name || 'N/A'}</strong>
                    </span>
                  </div>
                </div>

                {!initialOrder && (
                  <button 
                    type="button" 
                    onClick={() => { setSelectedOrder(null); setReturnItems([]); }}
                    style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Change Order
                  </button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  <Search size={16} color="#64748b" />
                  <input 
                    type="text"
                    value={orderSearchQuery}
                    onChange={e => { setOrderSearchQuery(e.target.value); setIsOrderDropdownOpen(true); }}
                    onFocus={() => setIsOrderDropdownOpen(true)}
                    placeholder="Search by Order #, Brand Name, or Agency..."
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', width: '100%' }}
                  />
                </div>

                {isOrderDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                    {filteredOrders.length === 0 ? (
                      <div style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                        No orders matching search
                      </div>
                    ) : (
                      filteredOrders.map(ord => (
                        <div 
                          key={ord.id}
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsOrderDropdownOpen(false);
                          }}
                          style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid #334155', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem' }}>{ord.order_number}</div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              Brand: <strong>{ord.company_name}</strong> | Agency: <strong>{ord.agency_name}</strong>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#0f172a', padding: '0.2rem 0.45rem', borderRadius: 4 }}>
                            {ord.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Return Request Type (Damaged Return vs Replacement) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div 
              onClick={() => setReturnType('DAMAGED_RETURN')}
              style={{ 
                background: returnType === 'DAMAGED_RETURN' ? 'rgba(244, 63, 94, 0.15)' : '#0f172a', 
                border: returnType === 'DAMAGED_RETURN' ? '2px solid #f43f5e' : '1px solid #334155', 
                borderRadius: 8, 
                padding: '0.85rem 1rem', 
                cursor: 'pointer' 
              }}
            >
              <div style={{ fontWeight: 800, color: '#f43f5e', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageX size={17} /> DAMAGED GOODS RETURN
              </div>
              <p style={{ fontSize: '0.725rem', color: '#cbd5e1', marginTop: 4, marginBottom: 0 }}>
                Collect damaged/broken stock for warehouse return, company settlement, and GRN/Credit Note issuance.
              </p>
            </div>

            <div 
              onClick={() => setReturnType('REPLACEMENT')}
              style={{ 
                background: returnType === 'REPLACEMENT' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a', 
                border: returnType === 'REPLACEMENT' ? '2px solid #38bdf8' : '1px solid #334155', 
                borderRadius: 8, 
                padding: '0.85rem 1rem', 
                cursor: 'pointer' 
              }}
            >
              <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={17} /> FRESH STOCK REPLACEMENT
              </div>
              <p style={{ fontSize: '0.725rem', color: '#cbd5e1', marginTop: 4, marginBottom: 0 }}>
                Collect damaged stock and dispatch equivalent fresh stock replacement (generates new RN order).
              </p>
            </div>
          </div>

          {/* Section 3: Reason & Damage Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', marginBottom: 4 }}>
              REASON FOR RETURN / DAMAGE EVIDENCE NOTES *
            </label>
            <input 
              type="text" 
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Remark / Damage details..."
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#ffffff', fontSize: '0.825rem' }}
            />
          </div>

          {/* Section 4: Products Table (With FMCD PCS vs FMCG Box+PCS & Custom Items) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                  PRODUCTS FOR RETURN / DAMAGE COLLECTION
                </span>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8', marginLeft: 8 }}>
                  {isFMCD ? 'Mode: FMCD (PCS only)' : 'Mode: FMCG (Enter Boxes & Loose PCS)'}
                </span>
              </div>

              {selectedOrder && (
                <button
                  type="button"
                  onClick={handleAddCustomProductRow}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(56,189,248,0.15)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    color: '#38bdf8',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Add a product belonging to this Brand that wasn't on the original order"
                >
                  <Plus size={14} /> Add Product Not In List
                </button>
              )}
            </div>

            {!selectedOrder ? (
              <div style={{ background: '#0f172a', border: '1px dashed #334155', borderRadius: 8, padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.825rem' }}>
                <AlertCircle size={24} style={{ marginBottom: 6 }} />
                <div>Please select an order above to populate the product return table</div>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      {!isFMCD && <th style={{ textAlign: 'center', width: 90 }}>Pcs/Box</th>}
                      {!isFMCD && <th style={{ textAlign: 'center', width: 110 }}>Box Qty</th>}
                      <th style={{ textAlign: 'center', width: 110 }}>
                        {isFMCD ? 'Return Pcs' : 'Loose Pcs'}
                      </th>
                      <th style={{ textAlign: 'center', width: 100 }}>Total (PCS)</th>
                      <th style={{ width: 150 }}>Remark</th>
                      <th style={{ textAlign: 'center', width: 45 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map(item => (
                      <tr key={item.id} style={{ background: item.is_custom_item ? 'rgba(56,189,248,0.05)' : undefined }}>
                        <td>
                          {item.is_custom_item ? (
                            <div>
                              <select
                                value={item.product_id}
                                onChange={e => handleCustomProductSelect(item.id, e.target.value)}
                                style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 4, color: '#38bdf8', fontSize: '0.775rem', fontWeight: 700 }}
                              >
                                {brandProductsPool.map((p: Product) => (
                                  <option key={p.id} value={p.id}>
                                    {p.product_name} {p.product_code ? `(${p.product_code})` : ''}
                                  </option>
                                ))}
                              </select>
                              <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginTop: 2, display: 'inline-block' }}>
                                ★ Custom Brand Item (Not In Original Order)
                              </span>
                            </div>
                          ) : (
                            <div>
                              <strong style={{ color: '#f8fafc' }}>{item.product_name}</strong>
                              {item.max_delivered_pcs !== undefined && (
                                <div style={{ fontSize: '0.675rem', color: '#64748b' }}>
                                  Delivered: {item.max_delivered_pcs} PCS
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* FMCG: Pcs Per Box */}
                        {!isFMCD && (
                          <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                            {item.pcs_per_box}
                          </td>
                        )}

                        {/* FMCG: Box Qty Input */}
                        {!isFMCD && (
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={item.box_qty || ''}
                              onChange={e => handleBoxQtyChange(item.id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#38bdf8', fontWeight: 800, textAlign: 'center', fontSize: '0.8rem' }}
                            />
                          </td>
                        )}

                        {/* Loose PCS (or FMCD PCS) Input */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={item.loose_pcs || ''}
                            onChange={e => handleLoosePcsChange(item.id, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#fbbf24', fontWeight: 800, textAlign: 'center', fontSize: '0.8rem' }}
                          />
                        </td>

                        {/* Computed Total PCS */}
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: item.total_pcs > 0 ? '#34d399' : '#64748b', fontSize: '0.85rem' }}>
                            {item.total_pcs || 0} PCS
                          </strong>
                        </td>

                        {/* Line Item Remark */}
                        <td>
                          <input
                            type="text"
                            value={item.remark || ''}
                            onChange={e => handleItemRemarkChange(item.id, e.target.value)}
                            placeholder="Remark..."
                            style={{ width: '100%', padding: '0.35rem 0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f8fafc', fontSize: '0.75rem' }}
                          />
                        </td>

                        {/* Delete Custom Row Button */}
                        <td style={{ textAlign: 'center' }}>
                          {item.is_custom_item && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 2 }}
                              title="Remove custom item"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Order-Level Remarks & Volume Summary */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
              ORDER LEVEL REMARKS / RETURN COLLECTION INSTRUCTIONS
            </label>
            <input 
              type="text"
              value={generalRemarks}
              onChange={e => setGeneralRemarks(e.target.value)}
              placeholder="Remark..."
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: '0.825rem' }}
            />
          </div>

        </div>

        {/* Footer with Volume Summary & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>Total Return Volume:</span>
            <span style={{ background: '#0f172a', padding: '0.3rem 0.75rem', borderRadius: 6, border: '1px solid #334155', color: '#38bdf8', fontWeight: 900, fontSize: '0.85rem' }}>
              {!isFMCD && totalReturnBoxes > 0 ? `${totalReturnBoxes} BOX, ` : ''}{totalReturnPcs} PCS
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn btn-warning" 
              onClick={handleSubmit} 
              disabled={!selectedOrder || totalReturnPcs <= 0}
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: (!selectedOrder || totalReturnPcs <= 0) ? 0.5 : 1 }}
            >
              <Check size={16} /> Submit for Super Admin Approval
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
