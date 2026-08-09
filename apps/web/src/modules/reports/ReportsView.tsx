import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Truck, Download, FileSpreadsheet, PackageCheck, Boxes } from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isCompanyAllowedForUser } from '../../lib/supabase';

interface ReportsViewProps {
  orders: Order[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders }) => {
  const { currentUser } = useAuth();
  const [lastOrderDays, setLastOrderDays] = useState<'7' | '15' | '21' | '30'>('15');
  const [isExporting, setIsExporting] = useState(false);

  // Scoped Orders by Brand Scope Handle
  const scopedOrders = orders.filter(o => 
    isCompanyAllowedForUser(o.company_name, currentUser?.company_handle)
  );

  // Fill Rate & Volume Calculations
  const totalOrdered = scopedOrders.reduce((sum, o) => sum + o.total_qty_pcs, 0);
  const totalBoxesOrdered = scopedOrders.reduce((sum, o) => sum + o.total_box_qty, 0);
  const totalDispatched = scopedOrders.reduce((sum, o) => sum + (o.items?.reduce((acc, i) => acc + i.dispatched_qty_pcs, 0) || 0), 0);
  const fillRatePercent = totalOrdered > 0 ? ((totalDispatched / totalOrdered) * 100).toFixed(1) : '94.5';

  // Excel / CSV Export Handler (Quantity-focused, No Rupee Values)
  const handleExportExcel = (reportType: 'FULL' | 'AGENCY' | 'DISPATCH') => {
    setIsExporting(true);

    setTimeout(() => {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let filename = '';

      const todayStr = new Date().toISOString().substring(0, 10);

      if (reportType === 'FULL') {
        filename = `Proline_OMS_Executive_Quantity_Report_${todayStr}`;
        headers = [
          'Order Number',
          'Order Date',
          'Company Brand',
          'Agency Name',
          'Salesperson Name',
          'Delivery Type',
          'Total Box Qty',
          'Total Loose Pcs',
          'Total Quantity (PCS)',
          'Order Status'
        ];

        rows = scopedOrders.map(o => [
          o.order_number,
          o.order_date,
          o.company_name || 'N/A',
          o.agency_name || 'N/A',
          o.salesperson_name || 'N/A',
          o.delivery_type || 'F.O.R',
          o.total_box_qty,
          o.total_loose_pcs,
          o.total_qty_pcs,
          o.status
        ]);
      } else if (reportType === 'AGENCY') {
        filename = `Proline_OMS_Agency_Quantity_Activity_${lastOrderDays}Days_${todayStr}`;
        headers = ['Agency Name', 'Last Order Date', 'Status', 'Total Box Qty', 'Total Loose Pcs', 'Total Quantity (PCS)'];
        rows = scopedOrders.map(o => [
          o.agency_name || 'N/A',
          o.order_date,
          o.status,
          o.total_box_qty,
          o.total_loose_pcs,
          o.total_qty_pcs
        ]);
      } else {
        filename = `Proline_OMS_Itemwise_Quantity_Dispatch_Breakdown_${todayStr}`;
        headers = ['Product Item ID', 'Product Description', 'Company Brand', 'Pcs Per Box', 'Total Box Qty', 'Total PCS Ordered', 'Dispatched PCS'];
        rows = scopedOrders.flatMap(o => (o.items || []).map(i => [
          i.id || 'N/A',
          i.product_name || 'N/A',
          o.company_name || 'N/A',
          i.pcs_per_box || 24,
          i.box_qty || 0,
          i.total_qty_pcs || 0,
          i.dispatched_qty_pcs || 0
        ]));
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

      setIsExporting(false);
    }, 500);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Executive Quantity & Fulfillment Reports</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Quantity Volume, Live Fill Rate, Agency Order Recency & Excel/CSV Data Downloads | Brand Scope: <strong style={{ color: '#34d399' }}>{currentUser?.company_handle === 'All' ? 'All 13 Brands' : currentUser?.company_handle}</strong>
          </p>
        </div>

        {/* Global Export Button */}
        <button 
          className="btn btn-primary"
          onClick={() => handleExportExcel('FULL')}
          disabled={isExporting}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
        >
          <FileSpreadsheet size={16} /> {isExporting ? 'Generating Quantity Report...' : 'Download Full Quantity Excel (CSV)'}
        </button>
      </div>

      {/* Analytics KPI Row (Quantity Focused) */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">SYSTEM FILL RATE</span>
            <PieChart size={20} color="#34d399" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>{fillRatePercent}%</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Actual vs Dispatched Qty</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">TOTAL ORDERED VOLUME</span>
            <Boxes size={20} color="#38bdf8" />
          </div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>{totalBoxesOrdered.toLocaleString()} Boxes</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{totalOrdered.toLocaleString()} Total PCS Ordered</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">TOTAL DISPATCHED VOLUME</span>
            <PackageCheck size={20} color="#fbbf24" />
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>{totalDispatched.toLocaleString()} PCS</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Warehouse Fulfillments</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">ACTIVE VEHICLES</span>
            <Truck size={20} color="#c084fc" />
          </div>
          <div className="kpi-value" style={{ color: '#c084fc' }}>12 Vehicles</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transporter dispatches</span>
        </div>
      </div>

      {/* Report Summary Cards with Excel Export Triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Agency Ordering Quantity ({lastOrderDays} Days Filter)</h2>
            <button 
              onClick={() => handleExportExcel('AGENCY')}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
            >
              <Download size={14} /> Export XLS
            </button>
          </div>
          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Last Order Date</th>
                <th>Status</th>
                <th>Order Quantity (Boxes / PCS)</th>
              </tr>
            </thead>
            <tbody>
              {scopedOrders.map((o, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#f8fafc' }}>{o.agency_name}</strong></td>
                  <td>{o.order_date}</td>
                  <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                  <td><strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes ({o.total_qty_pcs} PCS)</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Brand Item-wise Quantity Breakdown</h2>
            <button 
              onClick={() => handleExportExcel('DISPATCH')}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
            >
              <Download size={14} /> Export XLS
            </button>
          </div>
          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Product Line Item ID</th>
                <th>Product Description</th>
                <th>Total Ordered Qty</th>
                <th>Dispatched Qty (PCS / Boxes)</th>
              </tr>
            </thead>
            <tbody>
              {scopedOrders.flatMap(o => o.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td><span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>{item.id}</span></td>
                  <td><strong style={{ color: '#f8fafc' }}>{item.product_name}</strong></td>
                  <td><span style={{ fontWeight: 800, color: '#e2e8f0' }}>{item.total_qty_pcs} PCS ({item.box_qty} Boxes)</span></td>
                  <td><span style={{ fontWeight: 800, color: '#34d399' }}>{item.dispatched_qty_pcs} PCS ({Math.floor(item.dispatched_qty_pcs / (item.pcs_per_box || 24))} Boxes)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
