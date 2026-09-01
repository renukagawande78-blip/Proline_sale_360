import React, { useState, useEffect } from 'react';
import { X, Filter, RefreshCw, Check, Calendar, MapPin, Building2, User, Package, DollarSign, Search } from 'lucide-react';
import { GlobalFilterState, DateRangeType, Company, Agency, Product } from '../types';
import { 
  fetchCompaniesFromSupabase, 
  fetchAgenciesFromSupabaseTable, 
  fetchProductsFromSupabase,
  deduplicateCompanies,
  deduplicateAgencies,
  deduplicateProducts
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface GlobalFilterModalProps {
  isOpen: boolean;
  filterState: GlobalFilterState;
  onClose: () => void;
  onApplyFilter: (state: GlobalFilterState) => void;
  onResetFilter: () => void;
  companies?: Company[];
  agencies?: Agency[];
  products?: Product[];
}

export const GlobalFilterModal: React.FC<GlobalFilterModalProps> = ({
  isOpen,
  filterState,
  onClose,
  onApplyFilter,
  onResetFilter,
  companies,
  agencies,
  products
}) => {
  const { users } = useAuth();
  const salesTeamMembers = users.filter(u => u.role_name === 'SALES_PERSON' || u.role_name === 'AREA_SALES_MANAGER');
  const dispatchManagers = users.filter(u => u.role_name === 'DISPATCH_MANAGER');

  // Live master data state
  const [liveCompanies, setLiveCompanies] = useState<Company[]>(companies || []);
  const [liveAgencies, setLiveAgencies] = useState<Agency[]>(agencies || []);
  const [liveProducts, setLiveProducts] = useState<Product[]>(products || []);
  const [agencySearchText, setAgencySearchText] = useState('');
  const [productSearchText, setProductSearchText] = useState('');

  // Fetch live master data on open if needed
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadMasterData = async () => {
      try {
        const promises: Promise<any>[] = [];

        if (liveCompanies.length === 0) promises.push(fetchCompaniesFromSupabase());
        else promises.push(Promise.resolve(liveCompanies));

        if (liveAgencies.length === 0) promises.push(fetchAgenciesFromSupabaseTable());
        else promises.push(Promise.resolve({ agencies: liveAgencies }));

        if (liveProducts.length === 0) promises.push(fetchProductsFromSupabase());
        else promises.push(Promise.resolve(liveProducts));

        const [comps, agRes, prods] = await Promise.all(promises);

        if (isMounted) {
          if (comps && Array.isArray(comps) && comps.length > 0) {
            setLiveCompanies(deduplicateCompanies(comps));
          }
          if (agRes && agRes.agencies && Array.isArray(agRes.agencies) && agRes.agencies.length > 0) {
            setLiveAgencies(deduplicateAgencies(agRes.agencies));
          }
          if (prods && Array.isArray(prods) && prods.length > 0) {
            setLiveProducts(deduplicateProducts(prods));
          }
        }
      } catch (err) {
        console.warn('GlobalFilterModal live fetch error:', err);
      }
    };

    loadMasterData();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Distinct Areas & Cities from live Agencies
  const uniqueAreas = Array.from(new Set(liveAgencies.map(a => a.area_name).filter(Boolean))).sort() as string[];
  const uniqueCities = Array.from(new Set(liveAgencies.map(a => a.city).filter(Boolean))).sort() as string[];

  // Local Filter Form State
  const [segment, setSegment] = useState<'ALL' | 'FMCG' | 'FMCD'>(filterState.segment);
  const [companyId, setCompanyId] = useState(filterState.companyId);
  const [status, setStatus] = useState(filterState.status);
  const [salespersonId, setSalespersonId] = useState(filterState.salespersonId);
  const [agencyId, setAgencyId] = useState(filterState.agencyId);
  const [areaId, setAreaId] = useState(filterState.areaId);
  const [city, setCity] = useState(filterState.city);
  const [zoneId, setZoneId] = useState(filterState.zoneId || 'ALL');
  const [dispatchManagerId, setDispatchManagerId] = useState(filterState.dispatchManagerId || 'ALL');
  const [vehicleNumber, setVehicleNumber] = useState(filterState.vehicleNumber || '');
  const [productId, setProductId] = useState(filterState.productId);
  const [mrpRange, setMrpRange] = useState<'ALL' | 'UNDER_50' | '50_500' | '500_5000' | 'ABOVE_5000'>(filterState.mrpRange);
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>(filterState.dateRangeType);
  const [startDate, setStartDate] = useState(filterState.startDate || '');
  const [endDate, setEndDate] = useState(filterState.endDate || '');

  if (!isOpen) return null;

  // Filtered agencies based on area, city, and search input
  const filteredAgencies = liveAgencies.filter(a => {
    const matchesArea = areaId === 'ALL' || (a.area_name || '').toLowerCase() === areaId.toLowerCase();
    const matchesCity = city === 'ALL' || (a.city || '').toLowerCase() === city.toLowerCase();
    const q = agencySearchText.toLowerCase().trim();
    const matchesSearch = !q || (
      (a.agency_name || '').toLowerCase().includes(q) ||
      (a.agency_code || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q)
    );
    return matchesArea && matchesCity && matchesSearch;
  });

  // Filtered companies based on segment
  const filteredCompanies = liveCompanies.filter(c => {
    return segment === 'ALL' || (c.segment || '').toUpperCase() === segment.toUpperCase();
  });

  // Filtered products based on company, segment, and search input
  const filteredProducts = liveProducts.filter(p => {
    const matchesCompany = companyId === 'ALL' || p.company_id === companyId;
    const parentComp = liveCompanies.find(c => c.id === p.company_id);
    const prodSegment = p.segment || parentComp?.segment || 'FMCG';
    const matchesSegment = segment === 'ALL' || prodSegment.toUpperCase() === segment.toUpperCase();
    const q = productSearchText.toLowerCase().trim();
    const matchesSearch = !q || (
      (p.product_name || '').toLowerCase().includes(q) ||
      (p.product_code || '').toLowerCase().includes(q)
    );
    return matchesCompany && matchesSegment && matchesSearch;
  });

  const handleApply = () => {
    const isActive = segment !== 'ALL' || 
                     companyId !== 'ALL' || 
                     status !== 'ALL' || 
                     salespersonId !== 'ALL' || 
                     agencyId !== 'ALL' ||
                     areaId !== 'ALL' ||
                     city !== 'ALL' ||
                     productId !== 'ALL' ||
                     mrpRange !== 'ALL' ||
                     dateRangeType !== 'ALL_DATES';

    onApplyFilter({
      segment,
      companyId,
      status,
      salespersonId,
      agencyId,
      areaId,
      city,
      zoneId,
      dispatchManagerId,
      vehicleNumber,
      productId,
      mrpRange,
      dateRangeType,
      startDate,
      endDate,
      isActive
    });
    onClose();
  };

  const handleReset = () => {
    setSegment('ALL');
    setCompanyId('ALL');
    setStatus('ALL');
    setSalespersonId('ALL');
    setAgencyId('ALL');
    setAreaId('ALL');
    setCity('ALL');
    setZoneId('ALL'); setDispatchManagerId('ALL'); setVehicleNumber('');
    setProductId('ALL');
    setMrpRange('ALL');
    setDateRangeType('ALL_DATES');
    setStartDate('');
    setEndDate('');
    setAgencySearchText('');
    setProductSearchText('');
    onResetFilter();
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: 920, width: '95vw', border: '1px solid #38bdf8', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Filter size={24} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Master Global Filter Console</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Multi-dimensional live filters ({liveAgencies.length} Parties • {liveCompanies.length} Brands • {liveProducts.length} Products)
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* SECTION 1: TERRITORY & AGENCY FILTERS */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} /> 1. TERRITORY, CITY & AGENCY FILTERS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: '0.85rem' }}>
            {/* Area / Territory */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                AREA / TERRITORY ({uniqueAreas.length})
              </label>
              <select
                value={areaId}
                onChange={e => setAreaId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Territories</option>
                {uniqueAreas.map((area, idx) => (
                  <option key={idx} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                CITY ({uniqueCities.length})
              </label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Cities</option>
                {uniqueCities.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Agency */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>AGENCY / B2B PARTY</label>
                <span style={{ fontSize: '0.675rem', color: '#38bdf8', fontWeight: 700 }}>
                  {filteredAgencies.length} parties
                </span>
              </div>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <input
                  type="text"
                  placeholder="Filter agency name or city..."
                  value={agencySearchText}
                  onChange={e => setAgencySearchText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.55rem',
                    background: '#0a0f1d',
                    border: '1px solid #334155',
                    borderRadius: 5,
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
              <select
                value={agencyId}
                onChange={e => setAgencyId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Agencies & Parties ({filteredAgencies.length})</option>
                {filteredAgencies.slice(0, 200).map(a => (
                  <option key={a.id} value={a.id}>{a.agency_name} ({a.city || a.area_name || 'General'})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginTop: '0.85rem' }}>
            <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>ZONE</label><select value={zoneId} onChange={e => setZoneId(e.target.value)} style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }}><option value="ALL">All Zones</option>{uniqueAreas.map(zone => <option key={zone} value={zone}>{zone} Zone</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DISPATCH MANAGER</label><select value={dispatchManagerId} onChange={e => setDispatchManagerId(e.target.value)} style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }}><option value="ALL">All Dispatch Managers</option>{dispatchManagers.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>VEHICLE NUMBER</label><input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="Search vehicle no." style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white' }} /></div>
          </div>
        </div>

        {/* SECTION 2: SALESPERSON & BRAND FILTERS */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={16} /> 2. SALESPERSON, SEGMENT & BRAND FILTERS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: '0.85rem' }}>
            {/* Salesperson */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>SALESPERSON / EXEC</label>
              <select
                value={salespersonId}
                onChange={e => setSalespersonId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#34d399', fontWeight: 700, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Sales Execs ({salesTeamMembers.length})</option>
                {salesTeamMembers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role_name.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>

            {/* Segment */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>SEGMENT</label>
              <select
                value={segment}
                onChange={e => setSegment(e.target.value as any)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#38bdf8', fontWeight: 700, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Segments</option>
                <option value="FMCG">FMCG (Fast-Moving Consumer Goods)</option>
                <option value="FMCD">FMCD (Fast-Moving Consumer Durables)</option>
              </select>
            </div>

            {/* Brand / Company */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                BRAND / COMPANY ({filteredCompanies.length})
              </label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Brands ({filteredCompanies.length})</option>
                {filteredCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.segment || 'FMCG'})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRODUCT SKU, MRP & ORDER STATUS */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Package size={16} /> 3. PRODUCT SKU, MRP PRICING & ORDER STATUS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: '0.85rem' }}>
            {/* Product SKU */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>PRODUCT SKU</label>
                <span style={{ fontSize: '0.675rem', color: '#fbbf24', fontWeight: 700 }}>
                  {filteredProducts.length} SKUs
                </span>
              </div>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <input
                  type="text"
                  placeholder="Filter product name or code..."
                  value={productSearchText}
                  onChange={e => setProductSearchText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.55rem',
                    background: '#0a0f1d',
                    border: '1px solid #334155',
                    borderRadius: 5,
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Products & SKUs ({filteredProducts.length})</option>
                {filteredProducts.slice(0, 200).map(p => (
                  <option key={p.id} value={p.id}>{p.product_name} (₹{p.unit_price || p.mrp_price || 0})</option>
                ))}
              </select>
            </div>

            {/* MRP Range */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>MRP PRICE RANGE</label>
              <select
                value={mrpRange}
                onChange={e => setMrpRange(e.target.value as any)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All MRP Prices</option>
                <option value="UNDER_50">Under ₹50</option>
                <option value="50_500">₹50 - ₹500</option>
                <option value="500_5000">₹500 - ₹5,000</option>
                <option value="ABOVE_5000">Above ₹5,000</option>
              </select>
            </div>

            {/* Order Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>ORDER STATUS</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 600, fontSize: '0.825rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="HELD">HELD</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: DATE PERIOD TYPE FILTERS */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} /> 4. DATE PERIOD TYPE (TODAY, MONTH, QUARTER, YEAR & CUSTOM)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: dateRangeType === 'CUSTOM' ? '1fr 1fr 1fr' : '1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>DATE PERIOD SELECTION</label>
              <select
                value={dateRangeType}
                onChange={e => setDateRangeType(e.target.value as DateRangeType)}
                style={{ width: '100%', padding: '0.55rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#c084fc', fontWeight: 700, fontSize: '0.825rem' }}
              >
                <option value="ALL_DATES">📅 All Dates (Lifetime)</option>
                <option value="TODAY">📌 Today / This Date</option>
                <option value="THIS_MONTH">📆 This Month</option>
                <option value="THIS_QUARTER">📊 This Quarter</option>
                <option value="THIS_YEAR">📈 This Year</option>
                <option value="CUSTOM">⚙️ Custom Date Range...</option>
              </select>
            </div>

            {dateRangeType === 'CUSTOM' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>START DATE</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.825rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>END DATE</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.825rem' }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#f43f5e', color: '#fb7185', fontWeight: 700 }}
          >
            <RefreshCw size={14} /> Reset All Global Filters
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleApply} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              <Check size={16} /> Apply App-Wide Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
