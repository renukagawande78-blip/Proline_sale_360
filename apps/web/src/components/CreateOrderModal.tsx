import React, { useState } from 'react';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AGENCIES, MOCK_PRODUCTS } from '../lib/supabase';
import { Order, OrderItem } from '../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (order: Order) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSubmitOrder }) => {
  const [companyId, setCompanyId] = useState(MOCK_COMPANIES[0].id);
  const [agencyId, setAgencyId] = useState(MOCK_AGENCIES[0].id);
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<Partial<OrderItem>[]>([
    {
      product_id: MOCK_PRODUCTS[0].id,
      pcs_per_box: MOCK_PRODUCTS[0].pcs_per_box,
      box_qty: 10,
      loose_pcs: 5,
      unit_price: MOCK_PRODUCTS[0].unit_price
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

  const addItemRow = () => {
    const firstProd = MOCK_PRODUCTS[0];
    setItems(prev => [
      ...prev,
      {
        product_id: firstProd.id,
        pcs_per_box: firstProd.pcs_per_box,
        box_qty: 5,
        loose_pcs: 0,
        unit_price: firstProd.unit_price
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
      pending_qty_pcs: totalPcs
    };
  });

  const totalBoxQty = processedItems.reduce((acc, curr) => acc + curr.box_qty, 0);
  const totalLoosePcs = processedItems.reduce((acc, curr) => acc + curr.loose_pcs, 0);
  const totalQtyPcs = processedItems.reduce((acc, curr) => acc + curr.total_qty_pcs, 0);
  const totalAmount = processedItems.reduce((acc, curr) => acc + curr.total_price, 0);

  const handleSubmit = (status: 'DRAFT' | 'SUBMITTED') => {
    const selectedCompany = MOCK_COMPANIES.find(c => c.id === companyId);
    const selectedAgency = MOCK_AGENCIES.find(a => a.id === agencyId);

    const newOrder: Order = {
      id: 'o_' + Date.now(),
      order_number: 'PRL-2026-' + Math.floor(100000 + Math.random() * 900000),
      order_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      company_id: companyId,
      company_name: selectedCompany?.company_name,
      agency_id: agencyId,
      agency_name: selectedAgency?.agency_name,
      area_id: selectedAgency?.area_id || '',
      area_name: 'Delhi NCR Territory',
      salesperson_id: 'u7777777-7777-7777-7777-777777777777',
      salesperson_name: 'Amit Kumar',
      asm_id: 'u6666666-6666-6666-6666-666666666666',
      status: status,
      total_box_qty: totalBoxQty,
      total_loose_pcs: totalLoosePcs,
      total_qty_pcs: totalQtyPcs,
      total_amount: totalAmount,
      remarks: remarks,
      items: processedItems
    };

    onSubmitOrder(newOrder);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 850 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>COMPANY / BRAND</label>
            <select 
              value={companyId} 
              onChange={e => setCompanyId(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
            >
              {MOCK_COMPANIES.map(c => (
                <option key={c.id} value={c.id}>{c.company_name} ({c.company_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>AGENCY / B2B PARTY</label>
            <select 
              value={agencyId} 
              onChange={e => setAgencyId(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600 }}
            >
              {MOCK_AGENCIES.map(a => (
                <option key={a.id} value={a.id}>{a.agency_name} - {a.agency_code}</option>
              ))}
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
                <th>Product</th>
                <th>PCS/Box</th>
                <th>Box Qty</th>
                <th>Loose PCS</th>
                <th>Total PCS</th>
                <th>Unit Price</th>
                <th>Total (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select 
                      value={item.product_id} 
                      onChange={e => handleProductChange(index, e.target.value)}
                      style={{ padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', fontSize: '0.8rem', width: '100%' }}
                    >
                      {MOCK_PRODUCTS.map(p => (
                        <option key={p.id} value={p.id}>{p.product_name}</option>
                      ))}
                    </select>
                  </td>
                  <td><span style={{ fontWeight: 700, color: '#38bdf8' }}>{item.pcs_per_box}</span></td>
                  <td>
                    <input 
                      type="number" 
                      value={item.box_qty} 
                      onChange={e => handleQuantityChange(index, 'box_qty', parseInt(e.target.value) || 0)}
                      style={{ width: 65, padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={item.loose_pcs} 
                      onChange={e => handleQuantityChange(index, 'loose_pcs', parseInt(e.target.value) || 0)}
                      style={{ width: 65, padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: 'white', textAlign: 'center' }}
                    />
                  </td>
                  <td><span style={{ fontWeight: 800, color: '#34d399' }}>{item.total_qty_pcs}</span></td>
                  <td>₹{item.unit_price}</td>
                  <td>₹{item.total_price.toLocaleString()}</td>
                  <td>
                    <button onClick={() => removeItemRow(index)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
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

        {/* Remarks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>ORDER REMARKS</label>
          <input 
            type="text" 
            value={remarks} 
            onChange={e => setRemarks(e.target.value)}
            placeholder="Special delivery instructions, urgency notes..."
            style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white' }}
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
