import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Truck, Download, FileSpreadsheet, PackageCheck, Boxes, CheckCircle2, X, Search, ExternalLink } from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin, isCompanyAllowedForUser } from '../../lib/supabase';

interface ReportsViewProps {
  orders: Order[];
  initialReport?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, initialReport }) => {
  const { currentUser } = useAuth();
  const [lastOrderDays, setLastOrderDays] = useState<'7' | '15' | '21' | '30'>('15');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(initialReport || 'Completed Orders Report');
  const [isReportModalOpen, setIsReportModalOpen] = useState(Boolean(initialReport));
  const [activeModalReport, setActiveModalReport] = useState<string>(initialReport || 'Completed Orders Report');
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    if (initialReport) {
      setSelectedReport(initialReport);
      setActiveModalReport(initialReport);
      setIsReportModalOpen(true);
    }
  }, [initialReport]);

  const handleOpenReport = (reportName: string) => {
    setSelectedReport(reportName);
    setActiveModalReport(reportName);
    setModalSearch('');
    setIsReportModalOpen(true);
  };

  // Scoped Orders by Brand Scope Handle
  const scopedOrders = orders.filter(o => checkIsSuperAdmin(currentUser) || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle));
  const completedOrders = scopedOrders.filter(o => o.status === 'COMPLETED');
  const completedQty = completedOrders.reduce((sum, o) => sum + o.total_qty_pcs, 0);
  const completedBoxes = completedOrders.reduce((sum, o) => sum + o.total_box_qty, 0);

  const reportCatalog = [
    'Completed Orders Report', 'Fill Rate Report', 'Order Daily Report', 'Outstanding Report', 'POD Remarks Report',
    'Monthly Dispatch Report', 'Daywise / Weekwise Dispatch Report',
    `Last Order Days Report (${lastOrderDays} days)`, 'Vehicle-wise Dispatch Report'
  ];

  // Fill Rate & Volume Calculations
  const totalOrdered = scopedOrders.reduce((sum, o) => sum + o.total_qty_pcs, 0);
  const totalBoxesOrdered = scopedOrders.reduce((sum, o) => sum + o.total_box_qty, 0);
  // Fill rate is the quantity Billing actually issued against the quantity
  // ordered. Example: 6 refrigerators ordered / 4 issued = 66.7% fill rate.
  const totalIssued = scopedOrders.reduce((sum, o) => sum + (o.items?.reduce((acc, i) => acc + (i.issued_qty_pcs ?? i.dispatched_qty_pcs ?? 0), 0) || 0), 0);
  const unfulfilledQty = Math.max(0, totalOrdered - totalIssued);
  const fillRatePercent = totalOrdered > 0 ? ((totalIssued / totalOrdered) * 100).toFixed(1) : '0.0';

  // Filter data according to activeModalReport & modalSearch
  const getModalReportData = () => {
    let list = [...scopedOrders];
    if (activeModalReport === 'Completed Orders Report') {
      list = list.filter(o => o.status === 'COMPLETED');
    } else if (activeModalReport === 'Outstanding Report') {
      list = list.filter(o => o.status === 'SUBMITTED' || o.status === 'SALES_ADMIN_APPROVED' || o.status === 'APPROVED' || o.status === 'WAIT_FOR_STOCK');
    } else if (activeModalReport === 'POD Remarks Report') {
      list = list.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'POD_ISSUE_RAISED' || Boolean(o.remarks));
    } else if (activeModalReport === 'Monthly Dispatch Report' || activeModalReport === 'Daywise / Weekwise Dispatch Report') {
      list = list.filter(o => o.status === 'BILLED' || o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'COMPLETED');
    } else if (activeModalReport.includes('Last Order Days')) {
      const days = parseInt(lastOrderDays, 10) || 15;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(o => new Date(o.order_date) >= cutoff);
    } else if (activeModalReport === 'Vehicle-wise Dispatch Report') {
      list = list.filter(o => Boolean(o.vehicle_number || o.tempo_number || o.driver_name));
    }

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      list = list.filter(o => 
        o.order_number.toLowerCase().includes(q) ||
        (o.agency_name || '').toLowerCase().includes(q) ||
        (o.company_name || '').toLowerCase().includes(q) ||
        (o.salesperson_name || '').toLowerCase().includes(q) ||
        (o.invoice_number || '').toLowerCase().includes(q) ||
        (o.remarks || '').toLowerCase().includes(q)
      );
    }
    return list;
  };

  // Excel / CSV Export Handler (Quantity-focused, No Rupee Values)
  const handleExportExcel = (reportType: 'FULL' | 'AGENCY' | 'DISPATCH' | 'COMPLETED') => {
    setIsExporting(true);

    setTimeout(() => {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let filename = '';

      const todayStr = new Date().toISOString().substring(0, 10);

      if (reportType === 'COMPLETED' || selectedReport === 'Completed Orders Report') {
        filename = `Proline_OMS_Completed_Orders_Report_${todayStr}`;
        headers = [
          'Order Number',
          'Order Date',
          'Company Brand',
          'Agency Name',
          'Salesperson Name',
          'Invoice Number',
          'Delivery Type',
          'Total Box Qty',
          'Total Quantity (PCS)',
          'POD & Delivery Remarks',
          'Order Status'
        ];

        rows = completedOrders.map(o => [
          o.order_number,
          o.order_date,
          o.company_name || 'N/A',
          o.agency_name || 'N/A',
          o.salesperson_name || 'N/A',
          o.invoice_number || 'N/A',
          o.delivery_type || 'F.O.R',
          o.total_box_qty,
          o.total_qty_pcs,
          o.remarks || 'POD Verified & Delivered',
          o.status
        ]);
      } else if (reportType === 'FULL') {
        filename = `Proline_OMS_Executive_Quantity_Report_${todayStr}`;
        headers = [
          'Order Number',
          'Order Date',
          'Company Brand',
          'Agency Name',
          'Salesperson Name',
          'Delivery Type',
          'Total Box Qty',
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
          o.total_qty_pcs,
          o.status
        ]);
      } else if (reportType === 'AGENCY') {
        filename = `Proline_OMS_Agency_Quantity_Activity_${lastOrderDays}Days_${todayStr}`;
        headers = ['Agency Name', 'Last Order Date', 'Status', 'Total Box Qty', 'Total Quantity (PCS)'];
        rows = scopedOrders.map(o => [
          o.agency_name || 'N/A',
          o.order_date,
          o.status,
          o.total_box_qty,
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
        <select value={lastOrderDays} onChange={event => setLastOrderDays(event.target.value as '7' | '15' | '21' | '30')} style={{ padding: '0.55rem', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: 7, fontWeight: 700 }}>
          <option value="7">Last Order: 7 days</option><option value="15">Last Order: 15 days</option><option value="21">Last Order: 21 days</option><option value="30">Last Order: 30 days</option>
        </select>
      </div>

      {/* Analytics KPI Row (Quantity Focused) */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div 
          className="kpi-card" 
          onClick={() => handleOpenReport('Completed Orders Report')}
          style={{ border: '1px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.6))', cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to open Completed Orders Report"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title" style={{ color: '#34d399' }}>ORDERS COMPLETED</span>
            <CheckCircle2 size={20} color="#34d399" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>{completedOrders.length} Orders</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{completedQty.toLocaleString()} PCS ({completedBoxes.toLocaleString()} Boxes)</span>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>Open Report ↗</span>
          </div>
        </div>

        <div 
          className="kpi-card"
          onClick={() => handleOpenReport('Fill Rate Report')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to open Fill Rate Report"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">SYSTEM FILL RATE</span>
            <PieChart size={20} color="#34d399" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>{fillRatePercent}%</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Issued Qty ÷ Ordered Qty</span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>Open ↗</span>
          </div>
        </div>

        <div 
          className="kpi-card"
          onClick={() => handleOpenReport('Order Daily Report')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to open Order Daily Report"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">TOTAL ORDERED VOLUME</span>
            <Boxes size={20} color="#38bdf8" />
          </div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>{totalBoxesOrdered.toLocaleString()} Boxes</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{totalOrdered.toLocaleString()} Total PCS Ordered</span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>Open ↗</span>
          </div>
        </div>

        <div 
          className="kpi-card"
          onClick={() => handleOpenReport('Monthly Dispatch Report')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to open Monthly Dispatch Report"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">TOTAL ISSUED VOLUME</span>
            <PackageCheck size={20} color="#fbbf24" />
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>{totalIssued.toLocaleString()} PCS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Qty issued by Billing</span>
            <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>Open ↗</span>
          </div>
        </div>

        <div 
          className="kpi-card"
          onClick={() => handleOpenReport('Outstanding Report')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to open Outstanding Report"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">UNFULFILLED / LOST QTY</span>
            <Truck size={20} color="#fb7185" />
          </div>
          <div className="kpi-value" style={{ color: '#fb7185' }}>{unfulfilledQty.toLocaleString()} PCS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ordered but not issued</span>
            <span style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 700 }}>Open ↗</span>
          </div>
        </div>
      </div>

      {/* Report Summary Cards with Excel Export Triggers */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Company All Reports Dashboard</h2>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>💡 Click any report below to open full data viewer</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.7rem' }}>
          {reportCatalog.map(report => (
            <button 
              key={report} 
              type="button" 
              onClick={() => handleOpenReport(report)} 
              style={{ 
                textAlign: 'left', 
                padding: '0.85rem 1rem', 
                borderRadius: 10, 
                cursor: 'pointer', 
                border: selectedReport === report ? '1px solid #38bdf8' : '1px solid #334155', 
                background: selectedReport === report ? 'rgba(56,189,248,0.15)' : '#0f172a', 
                color: '#f8fafc', 
                fontWeight: 800, 
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <BarChart3 size={16} color={report === 'Completed Orders Report' ? '#34d399' : '#38bdf8'} />
                {report}
              </span>
              <ExternalLink size={13} color="#94a3b8" />
            </button>
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            Current Active Scope: <strong style={{ color: selectedReport === 'Completed Orders Report' ? '#34d399' : '#38bdf8' }}>{selectedReport}</strong> ({checkIsSuperAdmin(currentUser) ? 'All Companies' : (currentUser?.company_handle || 'Your Company')})
          </span>
          <button
            onClick={() => handleOpenReport(selectedReport)}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <ExternalLink size={13} /> Open Full {selectedReport}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {selectedReport === 'Completed Orders Report' 
                  ? `Completed & Settled Orders (${completedOrders.length})` 
                  : `Agency Ordering Quantity (${lastOrderDays} Days Filter)`}
              </h2>
              {selectedReport === 'Completed Orders Report' && (
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>✅ Showing verified completed orders with invoice and POD fulfillment</span>
              )}
            </div>
            <button 
              onClick={() => handleExportExcel(selectedReport === 'Completed Orders Report' ? 'COMPLETED' : 'AGENCY')}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
            >
              <Download size={14} /> Export {selectedReport === 'Completed Orders Report' ? 'Completed XLS' : 'XLS'}
            </button>
          </div>
          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Order / Agency</th>
                <th>Company Brand</th>
                <th>Order Date</th>
                <th>Invoice / Remarks</th>
                <th>Status</th>
                <th>Order Volume</th>
              </tr>
            </thead>
            <tbody>
              {(selectedReport === 'Completed Orders Report' ? completedOrders : scopedOrders).map((o, idx) => (
                <tr key={idx}>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{o.agency_name}</div>
                  </td>
                  <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</span></td>
                  <td>{o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    {o.invoice_number ? (
                      <div>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{o.invoice_number}</span>
                        {o.remarks && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.remarks}</div>}
                      </div>
                    ) : (
                      <span style={{ color: '#64748b' }}>{o.remarks || 'Standard'}</span>
                    )}
                  </td>
                  <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                  <td><strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes ({o.total_qty_pcs} PCS)</strong></td>
                </tr>
              ))}
              {(selectedReport === 'Completed Orders Report' ? completedOrders : scopedOrders).length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No orders found matching this report criteria.
                  </td>
                </tr>
              )}
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
                <th>Issued / Unfulfilled Qty (PCS)</th>
              </tr>
            </thead>
            <tbody>
              {scopedOrders.flatMap(o => o.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td><span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>{item.id}</span></td>
                  <td><strong style={{ color: '#f8fafc' }}>{item.product_name}</strong></td>
                  <td><span style={{ fontWeight: 800, color: '#e2e8f0' }}>{item.total_qty_pcs} PCS ({item.box_qty} Boxes)</span></td>
                  <td><span style={{ fontWeight: 800, color: '#34d399' }}>{item.issued_qty_pcs ?? item.dispatched_qty_pcs} issued</span><br /><span style={{ color: '#fb7185', fontSize: '0.72rem' }}>{Math.max(0, item.total_qty_pcs - (item.issued_qty_pcs ?? item.dispatched_qty_pcs ?? 0))} unfulfilled</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FULL INTERACTIVE REPORT VIEWER MODAL ── */}
      {isReportModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsReportModalOpen(false)}
        >
          <div 
            style={{ 
              maxWidth: 1100, 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex',
              flexDirection: 'column',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 10, 
                  background: activeModalReport === 'Completed Orders Report' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)', 
                  border: activeModalReport === 'Completed Orders Report' ? '1px solid #10b981' : '1px solid #38bdf8', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: activeModalReport === 'Completed Orders Report' ? '#34d399' : '#38bdf8'
                }}>
                  {activeModalReport === 'Completed Orders Report' ? <CheckCircle2 size={22} /> : <BarChart3 size={22} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      {activeModalReport}
                    </h2>
                    <span style={{ fontSize: '0.675rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: 800, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                      LIVE REPORT
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0' }}>
                    Scope: <strong style={{ color: '#38bdf8' }}>{currentUser?.company_handle === 'All' ? 'All Companies' : currentUser?.company_handle}</strong> · {getModalReportData().length} Records Active
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => handleExportExcel(activeModalReport === 'Completed Orders Report' ? 'COMPLETED' : 'FULL')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.9rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  <Download size={15} /> Download CSV / XLS
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: '#94a3b8' }}
                  title="Close Report"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Summary Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>REPORT RECORD COUNT</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{getModalReportData().length} Orders</div>
                </div>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL BOX VOLUME</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                    {getModalReportData().reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
                  </div>
                </div>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL PIECES (PCS)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                    {getModalReportData().reduce((s, o) => s + (o.total_qty_pcs || 0), 0).toLocaleString()} PCS
                  </div>
                </div>
                {activeModalReport === 'Completed Orders Report' && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 10, padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>SETTLED INVOICE VALUE</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                      ₹{getModalReportData().reduce((s, o) => s + (o.invoice_amount || o.total_amount || 0), 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter / Search Bar inside Modal */}
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={modalSearch} 
                  onChange={e => setModalSearch(e.target.value)} 
                  placeholder={`Search ${activeModalReport} by order no, agency, company, invoice...`}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    padding: '0.65rem 1rem 0.65rem 2.4rem',
                    color: 'white',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Interactive Data Table */}
              <div className="data-table-container">
                <table className="data-table" style={{ fontSize: '0.825rem', width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Order No</th>
                      <th>Order Date</th>
                      <th>Company / Brand</th>
                      <th>Agency / Party</th>
                      <th>Salesperson</th>
                      <th>Invoice / POD</th>
                      <th>Total Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getModalReportData().map((o, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
                          {o.delivery_type && <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{o.delivery_type}</div>}
                        </td>
                        <td>{o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</span></td>
                        <td>
                          <strong style={{ color: '#e2e8f0' }}>{o.agency_name}</strong>
                          {o.area_name && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.area_name}</div>}
                        </td>
                        <td><span style={{ color: '#cbd5e1' }}>{o.salesperson_name}</span></td>
                        <td>
                          {o.invoice_number ? (
                            <div>
                              <span style={{ color: '#34d399', fontWeight: 700 }}>{o.invoice_number}</span>
                              {o.remarks && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.remarks}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>{o.remarks || 'Standard Order'}</span>
                          )}
                        </td>
                        <td>
                          <strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong>
                          <div style={{ color: '#94a3b8', fontSize: '0.725rem' }}>{o.total_qty_pcs} Total PCS</div>
                        </td>
                        <td>
                          <span className={`status-badge status-${o.status}`}>
                            {o.status === 'COMPLETED' ? '✅ COMPLETED' : o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getModalReportData().length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                          No records found matching "{modalSearch}" in {activeModalReport}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Showing {getModalReportData().length} active rows
              </span>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="btn btn-outline"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
