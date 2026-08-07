import React, { useState } from 'react';
import { BarChart3, Filter, PieChart, TrendingUp, Calendar, Truck } from 'lucide-react';
import { Order } from '../types';

interface ReportsPageProps {
  orders: Order[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ orders }) => {
  const [lastOrderDays, setLastOrderDays] = useState<'7' | '15' | '21' | '30'>('15');

  // Fill Rate Calculation
  const totalOrdered = orders.reduce((sum, o) => sum + o.total_qty_pcs, 0);
  const totalDispatched = orders.reduce((sum, o) => sum + (o.items?.reduce((acc, i) => acc + i.dispatched_qty_pcs, 0) || 0), 0);
  const fillRatePercent = totalOrdered > 0 ? ((totalDispatched / totalOrdered) * 100).toFixed(1) : '94.5';

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Executive Reports & Operational Analytics</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Fill Rate, Order Aging, Outstanding Risk, and Vehicle Dispatch Reports</p>
        </div>

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

      {/* Report Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Agency Ordering Activity ({lastOrderDays} Days Filter)</h2>
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
              <tr>
                <td>Krishna Trading Agency</td>
                <td>2026-08-05</td>
                <td><span className="status-badge status-SUBMITTED">SUBMITTED</span></td>
                <td>₹6,125</td>
              </tr>
              <tr>
                <td>Apex Distributors Pvt Ltd</td>
                <td>2026-08-06</td>
                <td><span className="status-badge status-APPROVED">APPROVED</span></td>
                <td>₹31,200</td>
              </tr>
              <tr>
                <td>Star Retail Logistics</td>
                <td>2026-07-28</td>
                <td><span className="status-badge status-COMPLETED">COMPLETED</span></td>
                <td>₹18,500</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="data-table-container">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Brand-wise Dispatch Volume</h2>
          </div>
          <table className="data-table" style={{ fontSize: '0.825rem' }}>
            <thead>
              <tr>
                <th>Brand / Company</th>
                <th>Product Type</th>
                <th>Dispatched PCS</th>
                <th>Total Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Priyagold Foods</td>
                <td>FMCG</td>
                <td>2,450 PCS</td>
                <td>₹61,250</td>
              </tr>
              <tr>
                <td>Mogu Mogu Beverages</td>
                <td>FMCG</td>
                <td>4,800 PCS</td>
                <td>₹3,12,000</td>
              </tr>
              <tr>
                <td>Waiwai Foods</td>
                <td>FMCG</td>
                <td>1,200 PCS</td>
                <td>₹18,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
