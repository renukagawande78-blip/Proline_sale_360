import React from 'react';
import { 
  Filter, 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  Building2, 
  Package, 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Truck, 
  Search, 
  DollarSign,
  Layers
} from 'lucide-react';
import { GlobalFilterState, Company, Agency, User, Product } from '../types';

interface ActiveFiltersBarProps {
  filterState: GlobalFilterState;
  onUpdateFilter: (newState: GlobalFilterState) => void;
  onResetFilter: () => void;
  onOpenFilterModal: () => void;
  totalOrdersCount: number;
  filteredOrdersCount: number;
  companies?: Company[];
  agencies?: Agency[];
  users?: User[];
  products?: Product[];
  searchQuery?: string;
  onClearSearch?: () => void;
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  onRemove: () => void;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filterState,
  onUpdateFilter,
  onResetFilter,
  onOpenFilterModal,
  totalOrdersCount,
  filteredOrdersCount,
  companies = [],
  agencies = [],
  users = [],
  products = [],
  searchQuery = '',
  onClearSearch
}) => {
  const updateWith = (patch: Partial<GlobalFilterState>) => {
    const updated: GlobalFilterState = { ...filterState, ...patch };
    const isStillActive = 
      updated.segment !== 'ALL' ||
      updated.companyId !== 'ALL' ||
      updated.status !== 'ALL' ||
      updated.salespersonId !== 'ALL' ||
      updated.agencyId !== 'ALL' ||
      (Boolean(updated.areaId) && updated.areaId !== 'ALL') ||
      (Boolean(updated.city) && updated.city !== 'ALL') ||
      (Boolean(updated.productId) && updated.productId !== 'ALL') ||
      updated.mrpRange !== 'ALL' ||
      updated.dateRangeType !== 'ALL_DATES' ||
      Boolean(updated.vehicleNumber?.trim());

    updated.isActive = isStillActive;
    onUpdateFilter(updated);
  };

  // Build active filter chips
  const chips: FilterChip[] = [];

  if (searchQuery.trim()) {
    chips.push({
      id: 'search',
      label: 'Search',
      value: `"${searchQuery.trim()}"`,
      icon: <Search size={12} />,
      onRemove: () => onClearSearch?.()
    });
  }

  if (filterState.segment !== 'ALL') {
    chips.push({
      id: 'segment',
      label: 'Segment',
      value: filterState.segment,
      icon: <Layers size={12} />,
      onRemove: () => updateWith({ segment: 'ALL' })
    });
  }

  if (filterState.companyId !== 'ALL') {
    const comp = companies.find(c => c.id === filterState.companyId);
    chips.push({
      id: 'company',
      label: 'Brand',
      value: comp?.company_name || filterState.companyId,
      icon: <Building2 size={12} />,
      onRemove: () => updateWith({ companyId: 'ALL' })
    });
  }

  if (filterState.status !== 'ALL') {
    chips.push({
      id: 'status',
      label: 'Status',
      value: filterState.status.replace(/_/g, ' '),
      icon: <CheckCircle2 size={12} />,
      onRemove: () => updateWith({ status: 'ALL' })
    });
  }

  if (filterState.salespersonId !== 'ALL') {
    const sp = users.find(u => u.id === filterState.salespersonId);
    chips.push({
      id: 'salesperson',
      label: 'Salesperson',
      value: sp?.full_name || filterState.salespersonId,
      icon: <UserIcon size={12} />,
      onRemove: () => updateWith({ salespersonId: 'ALL' })
    });
  }

  if (filterState.agencyId !== 'ALL') {
    const ag = agencies.find(a => a.id === filterState.agencyId);
    chips.push({
      id: 'agency',
      label: 'Agency',
      value: ag?.agency_name || filterState.agencyId,
      icon: <Building2 size={12} />,
      onRemove: () => updateWith({ agencyId: 'ALL' })
    });
  }

  if (filterState.areaId && filterState.areaId !== 'ALL') {
    chips.push({
      id: 'area',
      label: 'Area',
      value: filterState.areaId,
      icon: <MapPin size={12} />,
      onRemove: () => updateWith({ areaId: 'ALL' })
    });
  }

  if (filterState.city && filterState.city !== 'ALL') {
    chips.push({
      id: 'city',
      label: 'City',
      value: filterState.city,
      icon: <MapPin size={12} />,
      onRemove: () => updateWith({ city: 'ALL' })
    });
  }

  if (filterState.dateRangeType !== 'ALL_DATES') {
    let dateStr = filterState.dateRangeType as string;
    if (filterState.dateRangeType === 'TODAY') dateStr = 'Today';
    else if (filterState.dateRangeType === 'THIS_MONTH') dateStr = 'This Month';
    else if (filterState.dateRangeType === 'THIS_QUARTER') dateStr = 'This Quarter';
    else if (filterState.dateRangeType === 'THIS_YEAR') dateStr = 'This Year';
    else if (filterState.dateRangeType === 'CUSTOM') {
      dateStr = `${filterState.startDate || ''} to ${filterState.endDate || ''}`;
    }
    chips.push({
      id: 'dateRange',
      label: 'Date',
      value: dateStr,
      icon: <Calendar size={12} />,
      onRemove: () => updateWith({ dateRangeType: 'ALL_DATES', startDate: '', endDate: '' })
    });
  }

  if (filterState.productId && filterState.productId !== 'ALL') {
    const prod = products.find(p => p.id === filterState.productId);
    chips.push({
      id: 'product',
      label: 'Product',
      value: prod?.product_name || filterState.productId,
      icon: <Package size={12} />,
      onRemove: () => updateWith({ productId: 'ALL' })
    });
  }

  if (filterState.mrpRange && filterState.mrpRange !== 'ALL') {
    let mrpLabel = filterState.mrpRange as string;
    if (mrpLabel === 'UNDER_50') mrpLabel = '< ₹50';
    else if (mrpLabel === '50_500') mrpLabel = '₹50 - ₹500';
    else if (mrpLabel === '500_5000') mrpLabel = '₹500 - ₹5,000';
    else if (mrpLabel === 'ABOVE_5000') mrpLabel = '> ₹5,000';
    chips.push({
      id: 'mrp',
      label: 'MRP',
      value: mrpLabel,
      icon: <DollarSign size={12} />,
      onRemove: () => updateWith({ mrpRange: 'ALL' })
    });
  }

  if (filterState.vehicleNumber && filterState.vehicleNumber.trim()) {
    chips.push({
      id: 'vehicle',
      label: 'Vehicle',
      value: filterState.vehicleNumber.trim(),
      icon: <Truck size={12} />,
      onRemove: () => updateWith({ vehicleNumber: '' })
    });
  }

  const hasActiveFilters = chips.length > 0;
  const hiddenCount = Math.max(0, totalOrdersCount - filteredOrdersCount);
  const isDataMismatchRisk = hasActiveFilters && hiddenCount > 0;

  return (
    <div 
      style={{
        background: isDataMismatchRisk 
          ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))' 
          : '#111827',
        borderBottom: isDataMismatchRisk ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid #1e293b',
        padding: '0.45rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        fontSize: '0.775rem',
        boxShadow: isDataMismatchRisk ? '0 2px 10px rgba(245, 158, 11, 0.08)' : 'none',
        position: 'relative',
        zIndex: 90
      }}
    >
      {/* Left: Filter indicator & Chips */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', flex: 1, minWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.25rem' }}>
          {isDataMismatchRisk ? (
            <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
          ) : hasActiveFilters ? (
            <Filter size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
          )}
          
          <span style={{ 
            fontWeight: 800, 
            letterSpacing: '0.03em', 
            color: isDataMismatchRisk ? '#fbbf24' : (hasActiveFilters ? '#38bdf8' : '#94a3b8'),
            fontSize: '0.725rem',
            textTransform: 'uppercase'
          }}>
            {hasActiveFilters ? `Active Filters (${chips.length}):` : 'All Data Scope:'}
          </span>
        </div>

        {/* Chips List */}
        {hasActiveFilters ? (
          chips.map(chip => (
            <span
              key={chip.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.55rem',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.735rem',
                fontWeight: 600
              }}
            >
              <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>{chip.icon}</span>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>{chip.label}:</span>
              <strong style={{ color: '#ffffff' }}>{chip.value}</strong>
              <button
                onClick={chip.onRemove}
                title={`Remove ${chip.label} filter`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '0.15rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                <X size={13} />
              </button>
            </span>
          ))
        ) : (
          <span style={{ color: '#64748b', fontSize: '0.735rem' }}>
            No active filters applied • Displaying complete order pipeline
          </span>
        )}
      </div>

      {/* Right: Data match verification status & Quick reset buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Count Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.725rem' }}>Showing:</span>
          <span 
            style={{ 
              fontWeight: 800, 
              color: isDataMismatchRisk ? '#fbbf24' : '#34d399',
              background: isDataMismatchRisk ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)',
              border: isDataMismatchRisk ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}
          >
            {filteredOrdersCount} of {totalOrdersCount} Orders
          </span>

          {isDataMismatchRisk && (
            <span 
              style={{ 
                color: '#f87171', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title={`${hiddenCount} orders are filtered out by your current active filter conditions.`}
            >
              ({hiddenCount} hidden by filter)
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {hasActiveFilters && (
            <button
              onClick={() => {
                onResetFilter();
                onClearSearch?.();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.6rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '5px',
                color: '#f87171',
                fontSize: '0.725rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Clear all filters and search to show 100% of orders"
            >
              <RotateCcw size={12} /> Clear All
            </button>
          )}

          <button
            onClick={onOpenFilterModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '5px',
              color: '#38bdf8',
              fontSize: '0.725rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Open Master Filter Console"
          >
            <SlidersHorizontal size={12} /> {hasActiveFilters ? 'Modify' : 'Add Filter'}
          </button>
        </div>
      </div>
    </div>
  );
};
