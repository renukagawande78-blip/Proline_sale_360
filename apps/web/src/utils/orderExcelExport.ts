import * as XLSX from 'xlsx';
import { Order, OrderItem } from '../types';
import { supabase } from '../lib/supabase';

const isValidUuid = (val?: string): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

/**
 * Export ordered products list for an order as an Excel (.xlsx) file.
 * The filename is strictly: `${order.order_number}.xlsx` (or `${order.id}.xlsx`).
 * Contains strictly the ordered items/products list for seamless sheet & ERP importing.
 */
export const exportOrderProductSheet = async (order: Order): Promise<void> => {
  let items: OrderItem[] = Array.isArray(order.items) && order.items.length > 0 ? [...order.items] : [];

  // 1. If order items are empty in memory, check embedded items in remarks
  if (items.length === 0 && order.remarks && typeof order.remarks === 'string') {
    const itMatch = order.remarks.match(/<!--ITEMS_DATA:(.*?)-->/);
    if (itMatch && itMatch[1]) {
      try {
        const parsed = JSON.parse(itMatch[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed;
        }
      } catch (e) {}
    }
  }

  // 2. If order items are still empty, fetch live from order_items table in Supabase
  if (items.length === 0) {
    try {
      let targetOrderId: string | null = (order.id && isValidUuid(order.id)) ? order.id : null;
      let orderRemarks = order.remarks || '';

      // If targetOrderId is not a valid UUID, lookup by order_number
      if (!targetOrderId && order.order_number) {
        const { data: ordRecord } = await supabase
          .from('orders')
          .select('id, remarks')
          .eq('order_number', order.order_number)
          .maybeSingle();

        if (ordRecord?.id) {
          targetOrderId = ordRecord.id;
          orderRemarks = ordRecord.remarks || orderRemarks;
        }
      }

      // Check if the DB order record had embedded items data
      if (items.length === 0 && orderRemarks) {
        const itMatch = orderRemarks.match(/<!--ITEMS_DATA:(.*?)-->/);
        if (itMatch && itMatch[1]) {
          try {
            const parsed = JSON.parse(itMatch[1]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              items = parsed;
            }
          } catch (e) {}
        }
      }

      // Fetch from Supabase order_items with joined products
      if (items.length === 0 && targetOrderId) {
        const { data: itemsData, error } = await supabase
          .from('order_items')
          .select('*, products(id, product_name, product_code, mrp_price, unit_price, pcs_per_box)')
          .eq('order_id', targetOrderId);

        if (!error && itemsData && itemsData.length > 0) {
          items = itemsData.map((it: any) => ({
            id: it.id,
            order_id: it.order_id,
            product_id: it.product_id,
            product_name: it.products?.product_name || it.product_name || 'Whirlpool Product',
            product_code: it.products?.product_code || it.product_code || 'P-WP',
            pcs_per_box: Number(it.pcs_per_box || it.products?.pcs_per_box || 1),
            box_qty: Number(it.box_qty || 0),
            loose_pcs: Number(it.loose_pcs || 0),
            free_pcs: Number(it.free_pcs || 0),
            total_qty_pcs: Number(it.total_qty_pcs || (Number(it.box_qty || 0) * Number(it.pcs_per_box || 1) + Number(it.loose_pcs || 0)) || 0),
            unit_price: Number(it.unit_price || it.products?.unit_price || 0),
            mrp_price: Number(it.products?.mrp_price || it.mrp_price || it.unit_price || 0),
            total_price: Number(it.total_price || (Number(it.total_qty_pcs || 0) * Number(it.unit_price || 0)) || 0),
            dispatched_qty_pcs: Number(it.dispatched_qty_pcs || 0),
            issued_qty_pcs: Number(it.issued_qty_pcs || 0),
            pending_qty_pcs: Number(it.pending_qty_pcs || 0),
            remark: it.remark || ''
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch items from Supabase for Excel export:', err);
    }
  }

  // 3. Fallback: If still no items but order has total quantity / amount, construct the order product summary
  if (items.length === 0 && (Number(order.total_qty_pcs || 0) > 0 || Number(order.total_amount || 0) > 0)) {
    const totalQty = Number(order.total_qty_pcs || order.total_loose_pcs || 1);
    const totalAmount = Number(order.total_amount || 0);
    const unitRate = totalQty > 0 ? Number((totalAmount / totalQty).toFixed(2)) : totalAmount;
    const compCode = (order as any).company_code || (order.order_number ? order.order_number.split('-')[0] : 'WP');
    const brandName = order.company_name || compCode || 'Whirlpool';

    items = [{
      id: order.id || 'item-1',
      order_id: order.id || '',
      product_id: '',
      product_name: `${brandName} Standard Assortment`,
      product_code: compCode ? `${compCode}-ORD` : 'WP-PROD',
      pcs_per_box: 1,
      box_qty: Number(order.total_box_qty || 0),
      loose_pcs: Number(order.total_loose_pcs || totalQty),
      free_pcs: 0,
      total_qty_pcs: totalQty,
      unit_price: unitRate,
      mrp_price: unitRate,
      total_price: totalAmount,
      dispatched_qty_pcs: 0,
      issued_qty_pcs: 0,
      pending_qty_pcs: totalQty,
      remark: (order.remarks || '').replace(/<!--.*?-->/g, '').trim()
    }];
  }

  // Build clean rows strictly for ordered products
  const rows = (items || []).map((item, index) => {
    const unitPrice = Number(item.unit_price || 0);
    const mrpPrice = Number(item.mrp_price || item.unit_price || 0);
    const boxQty = Number(item.box_qty || 0);
    const loosePcs = Number(item.loose_pcs || 0);
    const freePcs = Number(item.free_pcs || 0);
    const pcsPerBox = Number(item.pcs_per_box || 1);
    const totalQty = Number(item.total_qty_pcs || (boxQty * pcsPerBox + loosePcs) || 0);
    const totalPrice = Number(item.total_price || (totalQty * unitPrice) || 0);

    return {
      'Sr No': index + 1,
      'Product Code': item.product_code || `SKU-${index + 1}`,
      'Product Name': item.product_name || 'Product Item',
      'MRP': mrpPrice,
      'Rate (₹)': unitPrice,
      'Pcs Per Box': pcsPerBox,
      'Box Qty': boxQty,
      'Loose Pcs': loosePcs,
      'Free Pcs': freePcs,
      'Order Qty (PCS)': totalQty,
      'Total Amount (₹)': totalPrice,
      'Remarks': (item.remark || '').replace(/<!--.*?-->/g, '').trim()
    };
  });

  // Create Excel Workbook and Sheet
  const fallbackCode = (order as any).company_code || (order.order_number ? order.order_number.split('-')[0] : 'WP');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
    {
      'Sr No': 1,
      'Product Code': fallbackCode ? `${fallbackCode}-ORD` : 'P-WP-364',
      'Product Name': `${order.company_name || 'Whirlpool'} Product`,
      'MRP': Number(order.total_amount || 0),
      'Rate (₹)': Number(order.total_amount || 0),
      'Pcs Per Box': 1,
      'Box Qty': Number(order.total_box_qty || 0),
      'Loose Pcs': Number(order.total_loose_pcs || order.total_qty_pcs || 1),
      'Free Pcs': 0,
      'Order Qty (PCS)': Number(order.total_qty_pcs || 1),
      'Total Amount (₹)': Number(order.total_amount || 0),
      'Remarks': (order.remarks || '').replace(/<!--.*?-->/g, '').trim()
    }
  ]);

  // Set optimized column widths for readable viewing in Excel & Google Sheets
  ws['!cols'] = [
    { wch: 8 },   // Sr No
    { wch: 18 },  // Product Code
    { wch: 36 },  // Product Name
    { wch: 12 },  // MRP
    { wch: 14 },  // Rate (₹)
    { wch: 12 },  // Pcs Per Box
    { wch: 10 },  // Box Qty
    { wch: 10 },  // Loose Pcs
    { wch: 10 },  // Free Pcs
    { wch: 16 },  // Order Qty (PCS)
    { wch: 16 },  // Total Amount (₹)
    { wch: 28 }   // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Product List");

  // Output filename is strictly the order number / order ID
  const cleanOrderNumber = (order.order_number || order.id || 'ORDER').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanOrderNumber}.xlsx`;

  XLSX.writeFile(wb, fileName);
};
