import * as XLSX from 'xlsx';
import { Order, OrderItem } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Export ordered products list for an order as an Excel (.xlsx) file.
 * The filename is strictly: `${order.order_number}.xlsx` (or `${order.id}.xlsx`).
 * Contains strictly the ordered items/products list for seamless sheet & ERP importing.
 */
export const exportOrderProductSheet = async (order: Order): Promise<void> => {
  let items: OrderItem[] = order.items || [];

  // If order items are empty in memory, fetch live from order_items table in Supabase
  if (!items || items.length === 0) {
    try {
      const { data: itemsData, error } = await supabase
        .from('order_items')
        .select('*, products(id, product_name, product_code, mrp_price, unit_price, pcs_per_box)')
        .eq('order_id', order.id);

      if (!error && itemsData && itemsData.length > 0) {
        items = itemsData.map((it: any) => ({
          id: it.id,
          order_id: it.order_id,
          product_id: it.product_id,
          product_name: it.product_name || it.products?.product_name || 'Product Item',
          product_code: it.product_code || it.products?.product_code || 'SKU',
          pcs_per_box: Number(it.pcs_per_box || it.products?.pcs_per_box || 1),
          box_qty: Number(it.box_qty || 0),
          loose_pcs: Number(it.loose_pcs || 0),
          free_pcs: Number(it.free_pcs || 0),
          total_qty_pcs: Number(it.total_qty_pcs || 0),
          unit_price: Number(it.unit_price || it.products?.unit_price || 0),
          mrp_price: Number(it.mrp_price || it.products?.mrp_price || it.unit_price || 0),
          total_price: Number(it.total_price || 0),
          dispatched_qty_pcs: Number(it.dispatched_qty_pcs || 0),
          issued_qty_pcs: Number(it.issued_qty_pcs || 0),
          pending_qty_pcs: Number(it.pending_qty_pcs || 0),
          remark: it.remark || ''
        }));
      }
    } catch (err) {
      console.warn('Could not fetch items from Supabase for Excel export:', err);
    }
  }

  // Build clean rows strictly for ordered products (no agency/customer name as requested)
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
      'Remarks': item.remark || ''
    };
  });

  // Create Excel Workbook and Sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
    {
      'Sr No': 1,
      'Product Code': 'NO_ITEMS',
      'Product Name': 'No items recorded for this order',
      'MRP': 0,
      'Rate (₹)': 0,
      'Pcs Per Box': 1,
      'Box Qty': 0,
      'Loose Pcs': 0,
      'Free Pcs': 0,
      'Order Qty (PCS)': order.total_qty_pcs || 0,
      'Total Amount (₹)': order.total_amount || 0,
      'Remarks': order.remarks || ''
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
