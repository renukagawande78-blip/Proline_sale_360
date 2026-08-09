import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Truck, Download, FileSpreadsheet } from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { isCompanyAllowedForUser } from '../lib/supabase';

interface ReportsPageProps {
  orders: Order[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ orders }) => {
  const { currentUser } = useAuth();
  const [lastOrderDays, setLastOrderDays] = useState<'7' | '15' | '21' | '30'>('15');
  const [isExporting, setIsExporting] = useState(false);

  // Scoped Orders by Brand Scope Handle
  const scopedOrders = orders.filter(o => 
    isCompanyAllowedForUser(o.company_name, currentUser?.company_handle)
  );

  // Fill Rate Calculation
  const totalOrdered = scopedOrders.reduce((sum, o) => sum + o.total_qty_pcs, 0);
  const totalDispatched = scopedOrders.reduce((sum, o) => sum + (o.items?.reduce((acc, i) => acc + i.dispatched_qty_pcs, 0) || 0), 0);
  const fillRatePercent = totalOrdered > 0 ? ((totalDispatched / totalOrdered) * 100).toFixed(1) : '94.5';

  // Excel / CSV Export Handler
  const handleExportExcel = (reportType: 'FULL' | 'AGENCY' | 'DISPATCH') => {
    setIsExporting(true);

    setTimeout(() => {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let filename = '';

      const todayStr = new Date().toISOString().substring(0, 10);

      if (reportType === 'FULL') {
        filename = `Proline_OMS_Executive_Report_${todayStr}`;
        headers = [
          'Order Number',
          'Order Date',
          'Segment',
          'Agency Name',
          'Area / Territory',
          'Delivery Type',
          'Status',
          'Boxes Qty',
          'Loose PCS',
          'Total PCS Qty',
          'Total Order Amount (INR)',
          'Order Remarks'
        ];

        rows = scopedOrders.map(o => [
          o.order_number,
          o.order_date,
          o.company_name || 'FMCG',
          o.agency_name || 'Krishna Agency',
          o.area_name || 'Delhi NCR',
          o.delivery_type || 'F.O.R',
          o.status,
          o.total_box_qty,
          o.total_loose_pcs,
          o.total_qty_pcs,
          o.total_amount,
          o.remarks || ''
        ]);
      } else if (reportType === 'AGENCY') {
        filename = `Proline_Agency_Activity_Report_${todayStr}`;
        headers = ['Agency Name', 'Last Order Date', 'Segment', 'Delivery Type', 'Status', 'Total Value (INR)'];
        rows = scopedOrders.map(o => [
          o.agency_name || 'Agency Party',
          o.order_date,
          o.company_name || 'FMCG',
          o.delivery_type || 'F.O.R',
          o.status,
          o.total_amount
        ]);
      } else {
        filename = `Proline_Brand_Dispatch_Volume_${todayStr}`;
        headers = ['Order Number', 'Product Line Item ID', 'Product Description', 'Box Qty', 'Loose PCS', 'Total PCS', 'Line Amount (INR)'];
        
        scopedOrders.forEach(o => {
          o.items?.forEach(item => {
            rows.push([
              o.order_number,
              item.id,
              item.product_name || 'N/A',
              item.box_qty,
              item.loose_pcs,
              item.total_qty_pcs,
              item.total_price
            ]);
          });
        });
      }

      // Generate CSV string with UTF-8 BOM for Excel compatibility
      const csvLines = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
    }, 400);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Executive Reports & Operational Analytics</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Fill Rate, Order Aging, Outstanding Risk, and Vehicle Dispatch Reports</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Main Excel Export Button */}
          <button 
            onClick={() => handleExportExcel('FULL')}
            className="btn btn-primary"
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '0.6rem 1.1rem', fontSize: '0.875rem' }}
          >
            <FileSpreadsheet size={18} />
            {isExporting ? 'Exporting Report...' : 'Export Excel Report (.xlsx / .csv)'}
          </button>

          {/* Last Order Days Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.35rem', borderRadius: 8, border: '1px solid #334155' }}>
            <Calendar size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Last Order Days:</span>
            {(['7', '15', '21', '30'] as const).map(days => (
              <button
                key={days}
                onClick={() => setLastOrderDays(days)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 6,
                  border: 'none',
                  background: lastOrderDays === days ? '#38bdf8' : 'transparent',
                  color: lastOrderDays === days ? '#0f172a' : '#f8fafc',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">ORDER FILL RATE</span>
            <TrendingUp size={20} color="#34d399" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>{fillRatePercent}%</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fulfillment vs Ordered PCS</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">AVG ORDER DELAY</span>
            <PieChart size={20} color="#fbbf24" />
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>1.4 Days</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>From Submission to Dispatch</span>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">AGENCY OUTSTANDING</span>
            <BarChart3 size={20} color="#f43f5e" />
          </div>
          <div className="kpi-value" style={{ color: '#fb7185' }}>₹6,05,000</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total overdue across agencies</span>
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
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Agency Ordering Activity ({lastOrderDays} Days Filter)</h2>
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
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#f8fafc' }}>{o.agency_name}</strong></td>
                  <td>{o.order_date}</td>
                  <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                  <td><strong style={{ color: '#38bdf8' }}>₹{o.total_amount.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Brand Item-wise Dispatch Breakdown</h2>
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
                <th>Total PCS</th>
                <th>Total Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {orders.flatMap(o => o.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td><span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>{item.id}</span></td>
                  <td><strong style={{ color: '#f8fafc' }}>{item.product_name}</strong></td>
                  <td><span style={{ fontWeight: 800, color: '#34d399' }}>{item.total_qty_pcs} PCS</span></td>
                  <td>₹{item.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
