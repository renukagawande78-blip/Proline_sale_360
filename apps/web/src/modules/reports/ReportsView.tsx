import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Calendar, Truck, Download, 
  PackageCheck, Boxes, CheckCircle2, X, Search, ExternalLink, 
  Clock, AlertTriangle, User, MapPin, Building2, ShieldCheck, 
  FileText, Info, CheckSquare, Filter 
} from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin, isCompanyAllowedForUser } from '../../lib/supabase';

interface ReportsViewProps {
  orders: Order[];
  initialReport?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, initialReport }) => {
  const { currentUser } = useAuth();
  const [lastOrderDays, setLastOrderDays] = useState<'7' | '15' | '21' | '30' | '60'>('15');
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
  const scopedOrders = orders.filter(o => 
    checkIsSuperAdmin(currentUser) || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle)
  );

  // Accurate issued/dispatched qty helper (handles billing_total_qty, item issued_qty, or completed total_qty)
  const getOrderIssuedQty = (o: Order) => {
    if (o.billing_total_qty != null && o.billing_total_qty > 0) {
      return o.billing_total_qty;
    }
    const itemIssued = (o.items || []).reduce((sum, i) => sum + (i.issued_qty_pcs ?? i.dispatched_qty_pcs ?? 0), 0);
    if (itemIssued > 0) return itemIssued;
    if (o.status === 'COMPLETED') return o.total_qty_pcs;
    return 0;
  };

  // Ageing in days helper
  const getOrderAgeDays = (orderDate?: string) => {
    if (!orderDate) return 0;
    const diffTime = Math.abs(new Date().getTime() - new Date(orderDate).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Global KPI Calculations
  const totalOrdered = scopedOrders.reduce((sum, o) => sum + (o.total_qty_pcs || 0), 0);
  const totalBoxesOrdered = scopedOrders.reduce((sum, o) => sum + (o.total_box_qty || 0), 0);
  const totalIssued = scopedOrders.reduce((sum, o) => sum + getOrderIssuedQty(o), 0);
  const unfulfilledQty = Math.max(0, totalOrdered - totalIssued);
  const fillRatePercent = totalOrdered > 0 ? ((totalIssued / totalOrdered) * 100).toFixed(1) : '0.0';

  const reportCatalog = [
    'Completed Orders Report',
    'Fill Rate Report',
    'Order Daily Report',
    'Outstanding Report',
    'POD Remarks Report',
    'Monthly Dispatch Report',
    'Daywise / Weekwise Dispatch Report',
    `Last Order Days Report (${lastOrderDays} days)`,
    'Vehicle-wise Dispatch Report'
  ];

  // Specific data filter function by report type & search term
  const getFilteredReportData = (reportName: string, searchStr = '') => {
    let list = [...scopedOrders];

    if (reportName === 'Completed Orders Report') {
      list = list.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
    } else if (reportName === 'Fill Rate Report') {
      list = list.filter(o => 
        o.status === 'COMPLETED' || 
        o.status === 'BILLED' || 
        o.status === 'OUT_FOR_DELIVERY' || 
        o.status === 'DELIVERED' || 
        Boolean(o.invoice_number)
      );
    } else if (reportName === 'Order Daily Report') {
      list = list.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    } else if (reportName === 'Outstanding Report') {
      list = list.filter(o => o.status !== 'COMPLETED' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    } else if (reportName === 'POD Remarks Report') {
      list = list.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'POD_ISSUE_RAISED' || Boolean(o.remarks));
    } else if (reportName === 'Monthly Dispatch Report') {
      list = list.filter(o => o.status === 'BILLED' || o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED' || o.status === 'COMPLETED' || Boolean(o.invoice_number));
    } else if (reportName === 'Daywise / Weekwise Dispatch Report') {
      list = list.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED' || o.status === 'COMPLETED' || Boolean(o.vehicle_number));
    } else if (reportName.includes('Last Order Days')) {
      const days = parseInt(lastOrderDays, 10) || 15;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(o => new Date(o.order_date) >= cutoff);
    } else if (reportName === 'Vehicle-wise Dispatch Report') {
      list = list.filter(o => Boolean(o.vehicle_number || o.tempo_number || o.driver_name || o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY_FOR_PICKUP'));
    }

    if (searchStr.trim()) {
      const q = searchStr.toLowerCase().trim();
      list = list.filter(o => 
        o.order_number.toLowerCase().includes(q) ||
        (o.agency_name || '').toLowerCase().includes(q) ||
        (o.company_name || '').toLowerCase().includes(q) ||
        (o.salesperson_name || '').toLowerCase().includes(q) ||
        (o.invoice_number || '').toLowerCase().includes(q) ||
        (o.vehicle_number || '').toLowerCase().includes(q) ||
        (o.tempo_number || '').toLowerCase().includes(q) ||
        (o.driver_name || '').toLowerCase().includes(q) ||
        (o.area_name || '').toLowerCase().includes(q) ||
        (o.remarks || '').toLowerCase().includes(q)
      );
    }
    return list;
  };

  const currentModalList = getFilteredReportData(activeModalReport, modalSearch);
  const currentMainList = getFilteredReportData(selectedReport, '');

  // Tailored CSV Export Handler for ALL 9 reports
  const handleExportExcel = (reportName = activeModalReport) => {
    setIsExporting(true);

    setTimeout(() => {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let filename = '';
      const todayStr = new Date().toISOString().substring(0, 10);
      const dataset = getFilteredReportData(reportName, '');

      if (reportName === 'Completed Orders Report') {
        filename = `Proline_OMS_Completed_Orders_Report_${todayStr}`;
        headers = ['Order Number', 'Order Date', 'Company Brand', 'Agency Name', 'Salesperson', 'Invoice Number', 'Settled Amount (INR)', 'Delivery Type', 'Total Box Qty', 'Total Quantity (PCS)', 'POD Remarks', 'Status'];
        rows = dataset.map(o => [
          o.order_number, o.order_date, o.company_name || 'N/A', o.agency_name || 'N/A', o.salesperson_name || 'N/A', o.invoice_number || 'N/A', o.invoice_amount || o.total_amount || 0, o.delivery_type || 'F.O.R', o.total_box_qty, o.total_qty_pcs, o.remarks || 'POD Verified', o.status
        ]);
      } else if (reportName === 'Fill Rate Report') {
        filename = `Proline_OMS_Fill_Rate_Report_${todayStr}`;
        headers = ['Order Number', 'Invoice Number', 'Order Date', 'Company Brand', 'Agency Name', 'Salesperson', 'Ordered Demand (PCS)', 'Invoiced Quantity (PCS)', 'Unfulfilled Demand (PCS)', 'Fill Rate %', 'Status'];
        rows = dataset.map(o => {
          const ordered = o.total_qty_pcs || 0;
          const issued = getOrderIssuedQty(o);
          const unfulfilled = Math.max(0, ordered - issued);
          const rate = ordered > 0 ? ((issued / ordered) * 100).toFixed(1) + '%' : '0.0%';
          return [o.order_number, o.invoice_number || 'Pending', o.order_date, o.company_name || 'N/A', o.agency_name || 'N/A', o.salesperson_name || 'N/A', ordered, issued, unfulfilled, rate, o.status];
        });
      } else if (reportName === 'Order Daily Report') {
        filename = `Proline_OMS_Order_Daily_Report_${todayStr}`;
        headers = ['Order Date', 'Order Number', 'Company Brand', 'Agency Name', 'Territory / Area', 'Salesperson', 'Box Qty', 'Total PCS', 'Order Amount (INR)', 'Status'];
        rows = dataset.map(o => [
          o.order_date, o.order_number, o.company_name || 'N/A', o.agency_name || 'N/A', o.area_name || 'N/A', o.salesperson_name || 'N/A', o.total_box_qty, o.total_qty_pcs, o.total_amount || 0, o.status
        ]);
      } else if (reportName === 'Outstanding Report') {
        filename = `Proline_OMS_Outstanding_Orders_Report_${todayStr}`;
        headers = ['Order Number', 'Order Date', 'Days Pending', 'Company Brand', 'Agency Name', 'Salesperson', 'Pending Box Qty', 'Pending PCS', 'Current Bottleneck', 'Status'];
        rows = dataset.map(o => [
          o.order_number, o.order_date, getOrderAgeDays(o.order_date), o.company_name || 'N/A', o.agency_name || 'N/A', o.salesperson_name || 'N/A', o.total_box_qty, o.total_qty_pcs, o.status === 'WAIT_FOR_STOCK' ? 'Awaiting Stock' : o.status === 'APPROVED' ? 'Pending Billing' : 'Pending Approvals', o.status
        ]);
      } else if (reportName === 'POD Remarks Report') {
        filename = `Proline_OMS_POD_Remarks_Report_${todayStr}`;
        headers = ['Order Number', 'Invoice Number', 'Delivery Date', 'Company Brand', 'Agency Name', 'Transporter / Driver', 'Received Boxes', 'POD Remarks', 'Status'];
        rows = dataset.map(o => [
          o.order_number, o.invoice_number || 'N/A', o.order_date, o.company_name || 'N/A', o.agency_name || 'N/A', o.driver_name || o.rental_agency_name || 'N/A', o.total_box_qty, o.remarks || 'Standard Delivery', o.status
        ]);
      } else if (reportName === 'Monthly Dispatch Report') {
        filename = `Proline_OMS_Monthly_Dispatch_Report_${todayStr}`;
        headers = ['Invoice Date', 'Order Number', 'Invoice Number', 'Company Brand', 'Agency Name', 'Vehicle Number', 'Driver Name', 'Driver Mobile', 'Dispatched Boxes', 'Dispatched PCS', 'Invoice Amount (INR)', 'Status'];
        rows = dataset.map(o => [
          o.invoice_date || o.order_date, o.order_number, o.invoice_number || 'N/A', o.company_name || 'N/A', o.agency_name || 'N/A', o.vehicle_number || 'N/A', o.driver_name || 'N/A', o.driver_mobile || 'N/A', o.total_box_qty, getOrderIssuedQty(o), o.invoice_amount || o.total_amount || 0, o.status
        ]);
      } else if (reportName === 'Daywise / Weekwise Dispatch Report') {
        filename = `Proline_OMS_Daywise_Dispatch_Report_${todayStr}`;
        headers = ['Dispatch Date', 'Order Number', 'Gate Pass / Booking ID', 'Company Brand', 'Destination Agency', 'Assigned Vehicle', 'Driver Name', 'Boxes Loaded', 'PCS Dispatched', 'Delivery Type', 'Status'];
        rows = dataset.map(o => [
          o.order_date, o.order_number, o.booking_id || 'N/A', o.company_name || 'N/A', o.agency_name || 'N/A', o.vehicle_number || 'N/A', o.driver_name || 'N/A', o.total_box_qty, getOrderIssuedQty(o), o.delivery_type || 'F.O.R', o.status
        ]);
      } else if (reportName.includes('Last Order Days')) {
        filename = `Proline_OMS_Last_Order_Days_${lastOrderDays}d_Report_${todayStr}`;
        headers = ['Agency Name', 'Territory / Area', 'Company Brand', 'Salesperson', 'Last Order Number', 'Last Order Date', 'Days Ago', 'Order Boxes', 'Order PCS', 'Status'];
        rows = dataset.map(o => [
          o.agency_name || 'N/A', o.area_name || 'N/A', o.company_name || 'N/A', o.salesperson_name || 'N/A', o.order_number, o.order_date, getOrderAgeDays(o.order_date), o.total_box_qty, o.total_qty_pcs, o.status
        ]);
      } else {
        filename = `Proline_OMS_Vehicle_Dispatch_Report_${todayStr}`;
        headers = ['Vehicle / Tempo No', 'Ownership Type', 'Transporter / Rental Co', 'Driver Name', 'Driver Mobile', 'Order Number', 'Invoice Number', 'Destination Agency', 'Area / City', 'Boxes Loaded', 'Booking ID', 'Status'];
        rows = dataset.map(o => [
          o.vehicle_number || o.tempo_number || 'N/A', o.is_company_vehicle ? 'Company Owned' : 'Rental / Transporter', o.rental_agency_name || 'Direct', o.driver_name || 'N/A', o.driver_mobile || 'N/A', o.order_number, o.invoice_number || 'N/A', o.agency_name || 'N/A', o.area_name || 'N/A', o.total_box_qty, o.booking_id || 'N/A', o.status
        ]);
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
    }, 400);
  };

  // Helper to render report-specific table rows
  const renderTableContent = (reportName: string, list: Order[]) => {
    if (list.length === 0) {
      return (
        <tr>
          <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
            No records found matching this report criteria.
          </td>
        </tr>
      );
    }

    if (reportName === 'Completed Orders Report') {
      return list.map((o, idx) => (
        <tr key={idx}>
          <td>
            <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{o.delivery_type || 'F.O.R'}</div>
          </td>
          <td>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{o.agency_name} {o.area_name && `(${o.area_name})`}</div>
          </td>
          <td>{o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}</td>
          <td>
            <strong style={{ color: '#34d399' }}>{o.invoice_number || 'INV-SETTLED'}</strong>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem' }}>
              ₹{(o.invoice_amount || o.total_amount || 0).toLocaleString()}
            </div>
          </td>
          <td>
            <strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong>
            <div style={{ color: '#94a3b8', fontSize: '0.725rem' }}>{o.total_qty_pcs} Total PCS</div>
          </td>
          <td>
            <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{o.remarks || 'POD Verified & Delivered'}</span>
          </td>
          <td>
            <span className="status-badge status-COMPLETED">✅ COMPLETED</span>
          </td>
        </tr>
      ));
    }

    if (reportName === 'Fill Rate Report') {
      return list.map((o, idx) => {
        const ordered = o.total_qty_pcs || 0;
        const issued = getOrderIssuedQty(o);
        const unfulfilled = Math.max(0, ordered - issued);
        const rate = ordered > 0 ? (issued / ordered) * 100 : 0;
        const badgeBg = rate >= 100 ? 'rgba(52, 211, 153, 0.15)' : rate > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(244, 63, 94, 0.15)';
        const badgeColor = rate >= 100 ? '#34d399' : rate > 0 ? '#fbbf24' : '#fb7185';

        return (
          <tr key={idx}>
            <td>
              <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                {o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}
              </div>
            </td>
            <td>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{o.agency_name}</div>
            </td>
            <td><span style={{ color: '#cbd5e1' }}>{o.salesperson_name}</span></td>
            <td>
              {o.invoice_number ? <strong style={{ color: '#34d399' }}>{o.invoice_number}</strong> : <span style={{ color: '#64748b' }}>Pending</span>}
            </td>
            <td style={{ textAlign: 'right' }}>
              <strong style={{ color: '#f8fafc' }}>{ordered.toLocaleString()} PCS</strong>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{o.total_box_qty} Boxes</div>
            </td>
            <td style={{ textAlign: 'right' }}>
              <strong style={{ color: '#34d399' }}>{issued.toLocaleString()} PCS</strong>
            </td>
            <td style={{ textAlign: 'right' }}>
              {unfulfilled > 0 ? <strong style={{ color: '#fb7185' }}>{unfulfilled.toLocaleString()} PCS</strong> : <span style={{ color: '#64748b' }}>0 PCS</span>}
            </td>
            <td style={{ textAlign: 'center' }}>
              <span style={{ display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: 6, background: badgeBg, color: badgeColor, fontWeight: 800, fontSize: '0.8rem', border: `1px solid ${badgeColor}40` }}>
                {rate.toFixed(1)}%
              </span>
            </td>
            <td>
              <span className={`status-badge status-${o.status}`}>
                {o.status === 'COMPLETED' ? '✅ COMPLETED' : o.status}
              </span>
            </td>
          </tr>
        );
      });
    }

    if (reportName === 'Order Daily Report') {
      return list.map((o, idx) => (
        <tr key={idx}>
          <td>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>
              {o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{getOrderAgeDays(o.order_date)} days ago</div>
          </td>
          <td><strong style={{ color: '#38bdf8' }}>{o.order_number}</strong></td>
          <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</span></td>
          <td>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{o.agency_name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.area_name || 'Direct Territory'}</div>
          </td>
          <td><span style={{ color: '#cbd5e1' }}>{o.salesperson_name}</span></td>
          <td><strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong></td>
          <td><span style={{ color: '#34d399', fontWeight: 700 }}>{o.total_qty_pcs} PCS</span></td>
          <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>₹{(o.total_amount || 0).toLocaleString()}</span></td>
          <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
        </tr>
      ));
    }

    if (reportName === 'Outstanding Report') {
      return list.map((o, idx) => {
        const daysPending = getOrderAgeDays(o.order_date);
        const bottleneck = o.status === 'WAIT_FOR_STOCK' 
          ? '📦 Out of Stock / Waiting Stock' 
          : o.status === 'APPROVED' 
            ? '🧾 Pending Billing Invoice' 
            : o.status === 'SALES_ADMIN_APPROVED' 
              ? '👑 Pending Super Admin Approval' 
              : '⏳ Awaiting Sales Admin Approval';
        return (
          <tr key={idx}>
            <td>
              <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
              <div style={{ color: daysPending > 5 ? '#fb7185' : '#fbbf24', fontSize: '0.7rem', fontWeight: 700 }}>
                {daysPending} days pending
              </div>
            </td>
            <td>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{o.agency_name}</div>
            </td>
            <td><span style={{ color: '#cbd5e1' }}>{o.salesperson_name}</span></td>
            <td>
              <span style={{ 
                display: 'inline-block', 
                padding: '0.2rem 0.5rem', 
                borderRadius: 6, 
                background: o.status === 'WAIT_FOR_STOCK' ? 'rgba(251, 113, 133, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
                color: o.status === 'WAIT_FOR_STOCK' ? '#fb7185' : '#fbbf24', 
                fontSize: '0.75rem', 
                fontWeight: 700 
              }}>
                {bottleneck}
              </span>
            </td>
            <td>
              <strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.total_qty_pcs} PCS</div>
            </td>
            <td>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {o.status === 'WAIT_FOR_STOCK' ? 'Allocate stock from warehouse' : o.status === 'APPROVED' ? 'Generate tax invoice' : 'Review & approve order'}
              </span>
            </td>
            <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
          </tr>
        );
      });
    }

    if (reportName === 'POD Remarks Report') {
      return list.map((o, idx) => {
        const hasIssue = o.status === 'POD_ISSUE_RAISED' || (o.remarks && (o.remarks.toLowerCase().includes('issue') || o.remarks.toLowerCase().includes('damage')));
        return (
          <tr key={idx}>
            <td>
              <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
              <div style={{ color: '#34d399', fontSize: '0.7rem' }}>{o.invoice_number || 'No Invoice'}</div>
            </td>
            <td>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{o.agency_name}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{o.area_name || 'Direct'}</div>
            </td>
            <td>{o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}</td>
            <td>
              <span style={{ color: '#cbd5e1' }}>{o.driver_name || o.rental_agency_name || 'Assigned Driver'}</span>
              {o.vehicle_number && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.vehicle_number}</div>}
            </td>
            <td><strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong></td>
            <td>
              <span style={{ 
                display: 'inline-block', 
                padding: '0.15rem 0.5rem', 
                borderRadius: 6, 
                background: hasIssue ? 'rgba(244, 63, 94, 0.15)' : 'rgba(52, 211, 153, 0.15)', 
                color: hasIssue ? '#fb7185' : '#34d399', 
                fontSize: '0.75rem', 
                fontWeight: 700 
              }}>
                {hasIssue ? '⚠️ Issue Reported' : '✅ Verified Clean'}
              </span>
            </td>
            <td><span style={{ color: '#f8fafc', fontSize: '0.8rem' }}>{o.remarks || 'Order delivered & POD verified.'}</span></td>
            <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
          </tr>
        );
      });
    }

    if (reportName === 'Monthly Dispatch Report') {
      return list.map((o, idx) => (
        <tr key={idx}>
          <td>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>
              {o.invoice_date ? new Date(o.invoice_date).toLocaleDateString('en-IN') : (o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-')}
            </div>
          </td>
          <td>
            <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
            <div style={{ color: '#34d399', fontSize: '0.7rem' }}>{o.invoice_number || 'INV-PENDING'}</div>
          </td>
          <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</span></td>
          <td>
            <div style={{ color: '#e2e8f0' }}>{o.agency_name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.area_name || 'Direct'}</div>
          </td>
          <td><strong style={{ color: '#cbd5e1' }}>{o.vehicle_number || o.tempo_number || 'Direct Dispatch'}</strong></td>
          <td>
            <span style={{ color: '#cbd5e1' }}>{o.driver_name || 'Assigned Driver'}</span>
            {o.driver_mobile && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.driver_mobile}</div>}
          </td>
          <td><strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong></td>
          <td><strong style={{ color: '#34d399' }}>{getOrderIssuedQty(o)} PCS</strong></td>
          <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>₹{(o.invoice_amount || o.total_amount || 0).toLocaleString()}</span></td>
          <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
        </tr>
      ));
    }

    if (reportName === 'Daywise / Weekwise Dispatch Report') {
      return list.map((o, idx) => (
        <tr key={idx}>
          <td>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>
              {o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) : '-'}
            </div>
          </td>
          <td>
            <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
            {o.booking_id && <div style={{ color: '#fbbf24', fontSize: '0.7rem' }}>Gate Pass: {o.booking_id}</div>}
          </td>
          <td>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.agency_name}</div>
          </td>
          <td>
            <span style={{ color: '#cbd5e1' }}>{o.vehicle_number || 'Tempo Scheduled'}</span>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.driver_name || 'Driver TBD'}</div>
          </td>
          <td><strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong></td>
          <td><strong style={{ color: '#34d399' }}>{getOrderIssuedQty(o)} PCS</strong></td>
          <td><span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{o.delivery_type || 'F.O.R'}</span></td>
          <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
        </tr>
      ));
    }

    if (reportName.includes('Last Order Days')) {
      return list.map((o, idx) => {
        const daysAgo = getOrderAgeDays(o.order_date);
        return (
          <tr key={idx}>
            <td>
              <strong style={{ color: '#38bdf8' }}>{o.agency_name}</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.area_name || 'General Market'}</div>
            </td>
            <td><span style={{ color: '#f8fafc', fontWeight: 700 }}>{o.company_name}</span></td>
            <td><span style={{ color: '#cbd5e1' }}>{o.salesperson_name}</span></td>
            <td><strong style={{ color: '#cbd5e1' }}>{o.order_number}</strong></td>
            <td>{o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}</td>
            <td>
              <span style={{ 
                display: 'inline-block', 
                padding: '0.15rem 0.5rem', 
                borderRadius: 6, 
                background: daysAgo <= 7 ? 'rgba(52, 211, 153, 0.15)' : daysAgo <= 15 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
                color: daysAgo <= 7 ? '#34d399' : daysAgo <= 15 ? '#38bdf8' : '#fbbf24', 
                fontSize: '0.75rem', 
                fontWeight: 700 
              }}>
                {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
              </span>
            </td>
            <td>
              <strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.total_qty_pcs} PCS</div>
            </td>
            <td>
              <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>Active Account</span>
            </td>
          </tr>
        );
      });
    }

    // Vehicle-wise Dispatch Report
    return list.map((o, idx) => (
      <tr key={idx}>
        <td>
          <strong style={{ color: '#38bdf8' }}>{o.vehicle_number || o.tempo_number || 'Unassigned Vehicle'}</strong>
        </td>
        <td>
          <span style={{ 
            display: 'inline-block', 
            padding: '0.15rem 0.5rem', 
            borderRadius: 6, 
            background: o.is_company_vehicle ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
            color: o.is_company_vehicle ? '#38bdf8' : '#fbbf24', 
            fontSize: '0.725rem', 
            fontWeight: 700 
          }}>
            {o.is_company_vehicle ? '🏢 Company Owned' : '🚛 Rental / Transporter'}
          </span>
        </td>
        <td><span style={{ color: '#cbd5e1' }}>{o.rental_agency_name || (o.is_company_vehicle ? 'In-House Fleet' : 'Direct Hire')}</span></td>
        <td>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>{o.driver_name || 'Driver Not Specified'}</div>
          {o.driver_mobile && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.driver_mobile}</div>}
        </td>
        <td>
          <strong style={{ color: '#38bdf8' }}>{o.order_number}</strong>
          {o.invoice_number && <div style={{ color: '#34d399', fontSize: '0.7rem' }}>{o.invoice_number}</div>}
        </td>
        <td>
          <div style={{ color: '#e2e8f0' }}>{o.agency_name}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{o.area_name || 'Local'}</div>
        </td>
        <td>
          <strong style={{ color: '#38bdf8' }}>{o.total_box_qty} Boxes</strong>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{getOrderIssuedQty(o)} PCS</div>
        </td>
        <td><span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>{o.booking_id || 'GT-REGULAR'}</span></td>
        <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
      </tr>
    ));
  };

  // Helper to render report-specific table headers
  const renderTableHeaders = (reportName: string) => {
    if (reportName === 'Completed Orders Report') {
      return (
        <tr>
          <th>Order No & Type</th>
          <th>Brand & Agency</th>
          <th>Order Date</th>
          <th>Invoice No & Value</th>
          <th>Delivered Volume</th>
          <th>POD Remarks</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName === 'Fill Rate Report') {
      return (
        <tr>
          <th>Order No & Date</th>
          <th>Brand & Agency</th>
          <th>Salesperson</th>
          <th>Invoice No</th>
          <th style={{ textAlign: 'right' }}>Ordered Demand</th>
          <th style={{ textAlign: 'right' }}>Invoiced / Issued</th>
          <th style={{ textAlign: 'right' }}>Unfulfilled Qty</th>
          <th style={{ textAlign: 'center' }}>Fill Rate %</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName === 'Order Daily Report') {
      return (
        <tr>
          <th>Order Date</th>
          <th>Order Number</th>
          <th>Brand</th>
          <th>Agency & Area</th>
          <th>Salesperson</th>
          <th>Box Qty</th>
          <th>Total PCS</th>
          <th>Order Amount</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName === 'Outstanding Report') {
      return (
        <tr>
          <th>Order No & Ageing</th>
          <th>Brand & Agency</th>
          <th>Salesperson</th>
          <th>Current Bottleneck</th>
          <th>Pending Volume</th>
          <th>Action Required</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName === 'POD Remarks Report') {
      return (
        <tr>
          <th>Order No & Invoice</th>
          <th>Destination Agency</th>
          <th>Delivery Date</th>
          <th>Transporter / Driver</th>
          <th>Received Boxes</th>
          <th>POD Verification</th>
          <th>Delivery Remarks</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName === 'Monthly Dispatch Report') {
      return (
        <tr>
          <th>Invoice Date</th>
          <th>Order & Invoice No</th>
          <th>Brand</th>
          <th>Agency Destination</th>
          <th>Vehicle Number</th>
          <th>Driver & Mobile</th>
          <th>Boxes</th>
          <th>PCS</th>
          <th>Invoice Value</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName === 'Daywise / Weekwise Dispatch Report') {
      return (
        <tr>
          <th>Dispatch Date & Day</th>
          <th>Order & Gate Pass</th>
          <th>Brand & Agency</th>
          <th>Vehicle & Driver</th>
          <th>Boxes Loaded</th>
          <th>PCS Dispatched</th>
          <th>Delivery Route</th>
          <th>Status</th>
        </tr>
      );
    }
    if (reportName.includes('Last Order Days')) {
      return (
        <tr>
          <th>Agency & Territory</th>
          <th>Brand</th>
          <th>Salesperson</th>
          <th>Last Order No</th>
          <th>Last Order Date</th>
          <th>Recency</th>
          <th>Volume</th>
          <th>Status</th>
        </tr>
      );
    }
    return (
      <tr>
        <th>Vehicle / Tempo No</th>
        <th>Vehicle Type</th>
        <th>Transporter Co</th>
        <th>Driver & Contact</th>
        <th>Order & Invoice</th>
        <th>Agency & City</th>
        <th>Boxes Loaded</th>
        <th>Gate Pass / ID</th>
        <th>Status</th>
      </tr>
    );
  };

  // Helper to render report-specific top metric cards inside modal
  const renderModalStats = (reportName: string, list: Order[]) => {
    if (reportName === 'Completed Orders Report') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>COMPLETED ORDERS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{list.length} Orders</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>DELIVERED BOX VOLUME</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
              {list.reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>DELIVERED UNITS (PCS)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
              {list.reduce((s, o) => s + (o.total_qty_pcs || 0), 0).toLocaleString()} PCS
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>SETTLED INVOICE VALUE</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
              ₹{list.reduce((s, o) => s + (o.invoice_amount || o.total_amount || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      );
    }

    if (reportName === 'Fill Rate Report') {
      const modalTotalDemand = list.reduce((s, o) => s + (o.total_qty_pcs || 0), 0);
      const modalIssuedDemand = list.reduce((s, o) => s + getOrderIssuedQty(o), 0);
      const modalUnfulfilledDemand = Math.max(0, modalTotalDemand - modalIssuedDemand);
      const modalFillRate = modalTotalDemand > 0 ? ((modalIssuedDemand / modalTotalDemand) * 100).toFixed(1) : '0.0';

      return (
        <>
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 10, padding: '0.85rem 1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <PieChart size={20} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              <strong style={{ color: '#38bdf8' }}>Order Demand Fulfillment Metric: </strong>
              Fill Rate measures customer order demand fulfillment: <code style={{ color: '#34d399', background: '#0f172a', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 700 }}>(Invoiced Quantity ÷ Ordered Quantity) × 100%</code>.
              <span style={{ display: 'block', color: '#94a3b8', marginTop: 4 }}>
                💡 <em>Example: If an agency ordered <strong>20 PCS</strong> and Billing invoiced <strong>10 PCS</strong>, the Fill Rate is <strong style={{ color: '#fbbf24' }}>50.0%</strong> with <strong style={{ color: '#fb7185' }}>10 PCS</strong> Unfulfilled Demand.</em>
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>REPORT ORDERS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{list.length} Orders</div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>DEMAND ORDERED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{modalTotalDemand.toLocaleString()} PCS</div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>INVOICED / DISPATCHED</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>{modalIssuedDemand.toLocaleString()} PCS</div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#fb7185', fontWeight: 700 }}>UNFULFILLED / SHORT</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fb7185', marginTop: 2 }}>{modalUnfulfilledDemand.toLocaleString()} PCS</div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>SYSTEM FILL RATE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>{modalFillRate}%</div>
            </div>
          </div>
        </>
      );
    }

    if (reportName === 'Order Daily Report') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL ORDERS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{list.length} Orders</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>TOTAL BOX VOLUME</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
              {list.reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>TOTAL PIECES (PCS)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
              {list.reduce((s, o) => s + (o.total_qty_pcs || 0), 0).toLocaleString()} PCS
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700 }}>TOTAL ORDER AMOUNT</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
              ₹{list.reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      );
    }

    if (reportName === 'Outstanding Report') {
      const waitStock = list.filter(o => o.status === 'WAIT_FOR_STOCK').length;
      const waitBilling = list.filter(o => o.status === 'APPROVED' || o.status === 'SALES_ADMIN_APPROVED').length;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#fb7185', fontWeight: 700 }}>TOTAL OUTSTANDING</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fb7185', marginTop: 2 }}>{list.length} Orders</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>PENDING BOXES</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
              {list.reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700 }}>AWAITING STOCK</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>{waitStock} Orders</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#a855f7', fontWeight: 700 }}>AWAITING BILLING</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a855f7', marginTop: 2 }}>{waitBilling} Orders</div>
          </div>
        </div>
      );
    }

    if (reportName.includes('Last Order Days')) {
      return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>Select Activity Window:</span>
            {(['7', '15', '21', '30', '60'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setLastOrderDays(d)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: lastOrderDays === d ? '1px solid #38bdf8' : '1px solid #334155',
                  background: lastOrderDays === d ? 'rgba(56,189,248,0.2)' : '#1e293b',
                  color: lastOrderDays === d ? '#38bdf8' : '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.775rem'
                }}
              >
                {d} Days
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>ACTIVE AGENCIES</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{list.length} Agencies</div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>ORDERED BOXES</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                {list.reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
              </div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>ORDERED PCS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                {list.reduce((s, o) => s + (o.total_qty_pcs || 0), 0).toLocaleString()} PCS
              </div>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700 }}>RECENCY WINDOW</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>{lastOrderDays} Days Filter</div>
            </div>
          </div>
        </>
      );
    }

    if (reportName === 'Vehicle-wise Dispatch Report') {
      const companyTrips = list.filter(o => o.is_company_vehicle).length;
      const rentalTrips = list.filter(o => !o.is_company_vehicle && (o.vehicle_number || o.rental_agency_name)).length;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL VEHICLE TRIPS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{list.length} Shipments</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>COMPANY FLEET TRIPS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{companyTrips} Trips</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700 }}>RENTAL / TRANSPORTER</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>{rentalTrips} Trips</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>BOXES DISPATCHED</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
              {list.reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
            </div>
          </div>
        </div>
      );
    }

    // Default stats for POD Remarks, Monthly Dispatch, Daywise Dispatch
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>REPORT RECORD COUNT</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{list.length} Orders</div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>TOTAL BOX VOLUME</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
            {list.reduce((s, o) => s + (o.total_box_qty || 0), 0).toLocaleString()} Boxes
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>TOTAL PIECES (PCS)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
            {list.reduce((s, o) => s + (o.total_qty_pcs || 0), 0).toLocaleString()} PCS
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: 700 }}>DISPATCHED VALUE</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
            ₹{list.reduce((s, o) => s + (o.invoice_amount || o.total_amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Executive Quantity & Fulfillment Reports</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: 2 }}>
            Real-time supply chain telemetry · Scope: <strong style={{ color: '#38bdf8' }}>{currentUser?.company_handle === 'All' ? 'All Brands' : currentUser?.company_handle}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => handleExportExcel(selectedReport)} 
            disabled={isExporting} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : `Export ${selectedReport.replace(' Report', '')} XLS`}
          </button>
        </div>
      </div>

      {/* Global Supply Chain KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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

      {/* Report Summary Cards Selection Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Company All Reports Dashboard</h2>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>💡 Click any report below to inspect its dedicated data view</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.7rem' }}>
          {reportCatalog.map(report => {
            const isSel = selectedReport === report;
            return (
              <button 
                key={report} 
                type="button" 
                onClick={() => setSelectedReport(report)} 
                style={{ 
                  textAlign: 'left', 
                  padding: '0.85rem 1rem', 
                  borderRadius: 10, 
                  cursor: 'pointer', 
                  border: isSel ? '1px solid #38bdf8' : '1px solid #334155', 
                  background: isSel ? 'rgba(56,189,248,0.15)' : '#0f172a', 
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
                <span 
                  onClick={(e) => { e.stopPropagation(); handleOpenReport(report); }} 
                  title="Open full interactive modal viewer"
                  style={{ padding: '0.2rem', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}
                >
                  <ExternalLink size={13} color="#94a3b8" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Page Report View Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {selectedReport} ({currentMainList.length} Active Records)
                </h2>
                <span style={{ fontSize: '0.675rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  PURPOSE-BUILT VIEW
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Displaying specialized columns and telemetry for <strong style={{ color: '#f8fafc' }}>{selectedReport}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button 
                onClick={() => handleExportExcel(selectedReport)}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem' }}
              >
                <Download size={14} /> Export XLS
              </button>
              <button
                onClick={() => handleOpenReport(selectedReport)}
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', gap: '0.35rem' }}
              >
                <ExternalLink size={14} /> Open Full Interactive Modal
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.825rem', width: '100%' }}>
              <thead>
                {renderTableHeaders(selectedReport)}
              </thead>
              <tbody>
                {renderTableContent(selectedReport, currentMainList)}
              </tbody>
            </table>
          </div>
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
              maxWidth: 1150, 
              width: '100%', 
              maxHeight: '92vh', 
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
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0' }}>
                    Scope: <strong style={{ color: '#38bdf8' }}>{currentUser?.company_handle === 'All' ? 'All Companies' : currentUser?.company_handle}</strong> · {currentModalList.length} Records Active
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => handleExportExcel(activeModalReport)}
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
              {/* Specialized Top Metric Cards */}
              {renderModalStats(activeModalReport, currentModalList)}

              {/* Filter / Search Bar inside Modal */}
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={modalSearch} 
                  onChange={e => setModalSearch(e.target.value)} 
                  placeholder={`Search ${activeModalReport} by order no, agency, brand, salesperson, invoice, driver, vehicle...`}
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

              {/* Interactive Data Table with Purpose-Built Columns */}
              <div className="data-table-container">
                <table className="data-table" style={{ fontSize: '0.825rem', width: '100%' }}>
                  <thead>
                    {renderTableHeaders(activeModalReport)}
                  </thead>
                  <tbody>
                    {renderTableContent(activeModalReport, currentModalList)}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#f8fafc' }}>{currentModalList.length}</strong> active rows in {activeModalReport}
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
