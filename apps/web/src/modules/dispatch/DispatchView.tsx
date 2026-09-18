import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  PackageCheck, 
  Send, 
  Check, 
  Building2, 
  Tag, 
  AlertTriangle,
  MapPin,
  Layers,
  List,
  ChevronDown,
  ChevronRight,
  Filter,
  Boxes,
  FileCheck2
} from 'lucide-react';
import { Order, OrderStatus, Agency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { isCompanyAllowedForUser, checkIsSuperAdmin, fetchAgenciesFromSupabaseTable } from '../../lib/supabase';
import { resolveOfficialZone } from '../../data/officialAreasData';
import { formatDateTimeParts } from '../../utils/dateFormatter';

interface DispatchViewProps {
  orders: Order[];
  agencies?: Agency[];
  onOpenDispatchModal: (order: Order) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, notificationMsg?: string) => void;
  onOpenProcessReturnModal?: (order: Order) => void;
  onOpenPODModal?: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
}

export const DispatchView: React.FC<DispatchViewProps> = ({ 
  orders, 
  agencies,
  onOpenDispatchModal,
  onUpdateOrderStatus,
  onOpenProcessReturnModal,
  onOpenPODModal,
  onViewInvoice
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  const [dispatchFilter, setDispatchFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'AWAITING_BILL'>('ALL');
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<'ALL' | 'F.O.R' | 'Self Pickup'>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});
  const [agenciesList, setAgenciesList] = useState<Agency[]>(agencies || []);

  useEffect(() => {
    if (agencies && agencies.length > 0) {
      setAgenciesList(agencies);
    } else {
      fetchAgenciesFromSupabaseTable().then(({ agencies: fetched }) => {
        if (fetched && fetched.length > 0) {
          setAgenciesList(fetched);
        }
      });
    }
  }, [agencies]);

  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const userRole = (currentUser?.role_name || '') as string;
  const isDispatchUser = userRole === 'DISPATCH_MANAGER' || userRole === 'DISPATCH';
  const canViewAll = isSuperAdmin || isDispatchUser || !currentUser?.company_handle || currentUser?.company_handle === 'All';

  // 1. Orders completed dispatched / delivered
  const completedDispatchOrders = useMemo(() => orders.filter(o => 
    (o.status === 'DISPATCHED' || 
     o.status === 'PARTIALLY_DISPATCHED' || 
     o.status === 'OUT_FOR_DELIVERY' ||
     o.status === 'DELIVERED' ||
     o.status === 'COMPLETED') &&
    (canViewAll || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
  ), [orders, canViewAll, currentUser]);

  // 2. Upcoming For Dispatch: Billed / Cleared orders awaiting vehicle loading or self pickup
  const upcomingDispatchOrders = useMemo(() => orders.filter(o => 
    (Boolean(o.invoice_number) || 
     o.status === 'BILLED' || 
     o.status === 'INVOICED' || 
     o.status === 'READY_FOR_PICKUP' || 
     o.status === 'READY_FOR_SELF_PICKUP' ||
     o.status === 'DISPATCH_PENDING') &&
    !['DISPATCHED', 'PARTIALLY_DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status) &&
    (canViewAll || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
  ), [orders, canViewAll, currentUser]);

  // 3. Orders awaiting Billing in Stage 4 (exclude orders that already have an invoice number)
  const awaitingBillingOrders = useMemo(() => orders.filter(o =>
    !o.invoice_number &&
    o.status !== 'BILLED' &&
    o.status !== 'INVOICED' &&
    !['DISPATCHED', 'PARTIALLY_DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status) &&
    (o.status === 'APPROVED' || o.status === 'ACCOUNTS_APPROVED' || o.status === 'SALES_ADMIN_APPROVED' || o.status === 'WAIT_FOR_STOCK' || o.status === 'INVENTORY_AUDITED') &&
    (canViewAll || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
  ), [orders, canViewAll, currentUser]);

  // 4. All Dispatch Pipeline Orders (Upcoming + Completed + Awaiting Bill)
  const allDispatchOrders = useMemo(() => orders.filter(o =>
    (upcomingDispatchOrders.some(u => u.id === o.id) ||
     completedDispatchOrders.some(c => c.id === o.id) ||
     awaitingBillingOrders.some(a => a.id === o.id)) &&
    (canViewAll || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
  ), [orders, upcomingDispatchOrders, completedDispatchOrders, awaitingBillingOrders, canViewAll, currentUser]);

  // Orders on Hold
  const heldOrders = orders.filter(o =>
    o.status === 'HELD' &&
    (canViewAll || isCompanyAllowedForUser(o.company_name, currentUser?.company_handle))
  );

  // Helper to resolve an order's zone reliably using official 9 zones
  const getOrderZoneInfo = (order: Order) => {
    const matchedAgency = agenciesList.find(a => a.id === order.agency_id) || 
                          agenciesList.find(a => (a.agency_name || '').toLowerCase().trim() === (order.agency_name || '').toLowerCase().trim());

    // 1. Direct match if order or agency has an official zone name
    const rawZone = order.zone_name || matchedAgency?.zone_name;
    const officialZoneNames = ['City-A', 'City-B', 'City-C', 'City-D', 'City-E', 'Upper South', 'South', 'East', 'North'];
    if (rawZone && officialZoneNames.includes(rawZone)) {
      const isRural = ['Upper South', 'South', 'East', 'North'].includes(rawZone);
      return {
        zoneName: rawZone,
        zoneRegion: order.zone_region || matchedAgency?.zone_region || (isRural ? 'Rural' : 'City')
      };
    }

    // 2. Resolve using official 75 areas & 9 zones mapping
    const lookupText = `${order.area_name || ''} ${matchedAgency?.area_name || ''} ${matchedAgency?.city || ''} ${order.agency_name || ''}`;
    const resolved = resolveOfficialZone(lookupText, matchedAgency?.city);
    return {
      zoneName: resolved.zoneName,
      zoneRegion: resolved.region
    };
  };

  const currentPoolOrders = useMemo(() => {
    switch (dispatchFilter) {
      case 'UPCOMING':
        return upcomingDispatchOrders;
      case 'COMPLETED':
        return completedDispatchOrders;
      case 'AWAITING_BILL':
        return awaitingBillingOrders;
      case 'ALL':
      default:
        return allDispatchOrders;
    }
  }, [dispatchFilter, upcomingDispatchOrders, completedDispatchOrders, awaitingBillingOrders, allDispatchOrders]);

  // Return & damaged orders approved by Sale Admin awaiting vehicle & collection
  const approvedReturnOrders = useMemo(() => orders.filter(o => 
    o.return_request && (o.return_request.status === 'APPROVED_FOR_COLLECTION' || o.return_request.status === 'APPROVED')
  ), [orders]);

  // Counts for delivery mode filters
  const forCountTotal = currentPoolOrders.filter(o => o.delivery_type !== 'Self Pickup').length;
  const pickupCountTotal = currentPoolOrders.filter(o => o.delivery_type === 'Self Pickup').length;

  // List of available zones across current orders
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    currentPoolOrders.forEach(o => {
      set.add(getOrderZoneInfo(o).zoneName);
    });
    return Array.from(set).sort();
  }, [currentPoolOrders, agenciesList]);

  // Filter orders by delivery mode and selected zone
  const filteredOrders = useMemo(() => {
    return currentPoolOrders.filter(order => {
      if (deliveryModeFilter === 'F.O.R' && order.delivery_type === 'Self Pickup') return false;
      if (deliveryModeFilter === 'Self Pickup' && order.delivery_type !== 'Self Pickup') return false;
      if (selectedZoneFilter !== 'ALL') {
        const { zoneName } = getOrderZoneInfo(order);
        if (zoneName !== selectedZoneFilter) return false;
      }
      return true;
    });
  }, [currentPoolOrders, deliveryModeFilter, selectedZoneFilter, agenciesList]);

  // Group filtered orders by Zone
  const zoneGroups = useMemo(() => {
    const groups: Record<string, { zoneName: string; zoneRegion: string; orders: Order[] }> = {};

    for (const order of filteredOrders) {
      const { zoneName, zoneRegion } = getOrderZoneInfo(order);
      if (!groups[zoneName]) {
        groups[zoneName] = { zoneName, zoneRegion, orders: [] };
      }
      groups[zoneName].orders.push(order);
    }

    // Inside each zone, arrange orders: F.O.R (vehicle) first, then Self Pickup
    Object.values(groups).forEach(g => {
      g.orders.sort((a, b) => {
        if (a.delivery_type !== b.delivery_type) {
          return a.delivery_type === 'Self Pickup' ? 1 : -1;
        }
        return b.order_number.localeCompare(a.order_number);
      });
    });

    return groups;
  }, [filteredOrders, agenciesList]);

  const toggleCollapseZone = (zoneKey: string) => {
    setCollapsedZones(prev => ({
      ...prev,
      [zoneKey]: !prev[zoneKey]
    }));
  };

  const handleMarkReadyForPickup = (order: Order) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, 'READY_FOR_PICKUP');
    }
    addNotification({
      title: `📦 Ready for Self Pickup: ${order.order_number}`,
      message: `Goods packed at warehouse bay. Bill ${order.invoice_number || ''} attached. Ready for ${order.agency_name} self pickup.`,
      event_type: 'ORDER_READY_FOR_PICKUP',
      order_id: order.id
    });
  };

  const handleMarkOutForDelivery = (order: Order) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY');
    }
    addNotification({
      title: `🚚 Out for Delivery: ${order.order_number}`,
      message: `Products loaded into vehicle. Bill ${order.invoice_number || ''} attached. Order OUT FOR DELIVERY to ${order.agency_name}.`,
      event_type: 'ORDER_OUT_FOR_DELIVERY',
      order_id: order.id
    });
  };

  const handleMarkDelivered = (order: Order) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, 'COMPLETED');
    }
    addNotification({
      title: `✅ Order Delivered & Completed: ${order.order_number}`,
      message: `Shipment successfully delivered to ${order.agency_name}. Order status marked COMPLETED.`,
      event_type: 'ORDER_DELIVERED',
      order_id: order.id,
      brand_name: order.company_name,
      target_roles: ['SALES_PERSON', 'SALES_ADMIN', 'DISPATCH_MANAGER', 'ACCOUNTS', 'BILLING', 'SUPER_ADMIN'],
      category: 'POD'
    });
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dispatch & Delivery Queue</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Manage warehouse packing, logistics vehicle allocation, and dispatch delivery pipeline | Brand Scope: <strong style={{ color: '#34d399' }}>{canViewAll ? 'All Brands & Bills (Universal Warehouse)' : currentUser?.company_handle}</strong>
          </p>
        </div>
      </div>

      {/* Dispatch Processing Queue */}
      {/* Dispatch Processing Queue */}
      <div className="data-table-container">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              Stage 5: Warehouse Packing &amp; Logistics Allocation ({currentPoolOrders.length})
            </h2>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              {dispatchFilter === 'UPCOMING' && 'Orders with completed Tax Invoicing cleared for vehicle loading or customer pickup'}
              {dispatchFilter === 'COMPLETED' && 'Orders that have been dispatched, out for delivery, or completed & delivered'}
              {dispatchFilter === 'AWAITING_BILL' && 'Orders currently awaiting Stage 4 Tax Invoicing in Accounts & Billing'}
              {dispatchFilter === 'ALL' && 'All orders across dispatch and delivery pipeline'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setDispatchFilter('ALL');
                setDeliveryModeFilter('ALL');
                setSelectedZoneFilter('ALL');
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 20,
                border: dispatchFilter === 'ALL' ? '1.5px solid #38bdf8' : '1px solid #334155',
                background: dispatchFilter === 'ALL' ? 'rgba(56, 189, 248, 0.18)' : '#0f172a',
                color: dispatchFilter === 'ALL' ? '#38bdf8' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              All Orders ({allDispatchOrders.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setDispatchFilter('UPCOMING');
                setDeliveryModeFilter('ALL');
                setSelectedZoneFilter('ALL');
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 20,
                border: dispatchFilter === 'UPCOMING' ? '1.5px solid #34d399' : '1px solid #334155',
                background: dispatchFilter === 'UPCOMING' ? 'rgba(52, 211, 153, 0.18)' : '#0f172a',
                color: dispatchFilter === 'UPCOMING' ? '#34d399' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              🚚 Upcoming For Dispatch ({upcomingDispatchOrders.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setDispatchFilter('COMPLETED');
                setDeliveryModeFilter('ALL');
                setSelectedZoneFilter('ALL');
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 20,
                border: dispatchFilter === 'COMPLETED' ? '1.5px solid #a78bfa' : '1px solid #334155',
                background: dispatchFilter === 'COMPLETED' ? 'rgba(167, 139, 250, 0.18)' : '#0f172a',
                color: dispatchFilter === 'COMPLETED' ? '#a78bfa' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              ✅ Completed Dispatched ({completedDispatchOrders.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setDispatchFilter('AWAITING_BILL');
                setDeliveryModeFilter('ALL');
                setSelectedZoneFilter('ALL');
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 20,
                border: dispatchFilter === 'AWAITING_BILL' ? '1.5px solid #fbbf24' : '1px solid #334155',
                background: dispatchFilter === 'AWAITING_BILL' ? 'rgba(251, 191, 36, 0.18)' : '#0f172a',
                color: dispatchFilter === 'AWAITING_BILL' ? '#fbbf24' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              🔒 Awaiting Bill in Stage 4 ({awaitingBillingOrders.length})
            </button>

            {heldOrders.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '0.3rem 0.75rem', borderRadius: 6 }}>
                ⏸️ On Hold ({heldOrders.length})
              </span>
            )}
          </div>
        </div>

        {/* Sale Admin Approved Return & Damaged Collections Banner for Dispatched Person */}
        {approvedReturnOrders.length > 0 && (
          <div style={{
            margin: '0.85rem 1.25rem 0 1.25rem',
            padding: '0.85rem 1.15rem',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(16, 185, 129, 0.08))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Truck size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span>{approvedReturnOrders.length} Return / Damaged Collection(s) Approved by Sale Admin</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: '#10b981', color: 'white', fontWeight: 800 }}>
                    Dispatched Collection Required
                  </span>
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2 }}>
                  Sale Admin approved collection. Dispatched person: allocate vehicle, driver, and collect damaged stock.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {approvedReturnOrders.slice(0, 4).map(ro => (
                <button
                  key={ro.id}
                  type="button"
                  onClick={() => onOpenProcessReturnModal ? onOpenProcessReturnModal(ro) : onOpenDispatchModal(ro)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    borderRadius: 7,
                    color: 'white',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                  }}
                  title={`Enter vehicle info & collect damaged stock for ${ro.order_number}`}
                >
                  <Truck size={12} /> Collect: {ro.order_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Filter & Logistics Arrangement Controls Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#0f172a',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          {/* Left: Delivery Mode Filters (F.O.R vs Self Pickup) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={13} color="#38bdf8" /> Delivery Type:
            </span>
            <button
              type="button"
              onClick={() => setDeliveryModeFilter('ALL')}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                fontSize: '0.725rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: deliveryModeFilter === 'ALL' ? '1px solid #38bdf8' : '1px solid #334155',
                background: deliveryModeFilter === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                color: deliveryModeFilter === 'ALL' ? '#38bdf8' : '#94a3b8'
              }}
            >
              All Modes ({currentPoolOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setDeliveryModeFilter('F.O.R')}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                fontSize: '0.725rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: deliveryModeFilter === 'F.O.R' ? '1px solid #fbbf24' : '1px solid #334155',
                background: deliveryModeFilter === 'F.O.R' ? 'rgba(251, 191, 36, 0.2)' : '#1e293b',
                color: deliveryModeFilter === 'F.O.R' ? '#fbbf24' : '#94a3b8'
              }}
            >
              🚚 F.O.R / Vehicle ({forCountTotal})
            </button>
            <button
              type="button"
              onClick={() => setDeliveryModeFilter('Self Pickup')}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                fontSize: '0.725rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: deliveryModeFilter === 'Self Pickup' ? '1px solid #38bdf8' : '1px solid #334155',
                background: deliveryModeFilter === 'Self Pickup' ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                color: deliveryModeFilter === 'Self Pickup' ? '#38bdf8' : '#94a3b8'
              }}
            >
              🏢 Self Pickup / Counter ({pickupCountTotal})
            </button>
          </div>

          {/* Right: Zone Dropdown & Layout Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Zone Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>
                <MapPin size={13} color="#34d399" />
              </span>
              <select
                value={selectedZoneFilter}
                onChange={e => setSelectedZoneFilter(e.target.value)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 6,
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#f8fafc'
                }}
              >
                <option value="ALL">All Zones ({availableZones.length})</option>
                {availableZones.map(zn => (
                  <option key={zn} value={zn}>Zone: {zn}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle: Group by Zone vs Flat */}
            <div style={{ display: 'flex', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: 2 }}>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 4,
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: viewMode === 'grouped' ? '#38bdf8' : 'transparent',
                  color: viewMode === 'grouped' ? '#0f172a' : '#94a3b8'
                }}
                title="Group Orders by Delivery Zone"
              >
                <Layers size={12} /> Group by Zone
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 4,
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: viewMode === 'flat' ? '#38bdf8' : 'transparent',
                  color: viewMode === 'flat' ? '#0f172a' : '#94a3b8'
                }}
                title="Single Flat Table"
              >
                <List size={12} /> Flat View
              </button>
            </div>
          </div>
        </div>

        {/* Render Table Headers */}
        {(() => {
          const renderTableHeader = () => (
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date</th>
                <th>Agency / Party</th>
                <th>Mode (Delivery Type)</th>
                <th>System Approver</th>
                <th>Bill No.</th>
                <th>Billing Items &amp; Qty</th>
                <th>Delivery Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
          );

          const renderOrderRow = (order: Order) => {
            const isSelfPickup = order.delivery_type === 'Self Pickup';

            return (
              <tr key={order.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong>
                    {order.reattempt_delivery && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                        🔄 REATTEMPT
                      </span>
                    )}
                  </div>
                  {order.invoice_number && (
                    <div style={{ marginTop: 2 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '0.1rem 0.45rem', borderRadius: 6 }}>
                        🧾 Bill Ready: {order.invoice_number}
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  {(() => {
                    const dt = formatDateTimeParts(order.order_date);
                    return (
                      <div>
                        <span style={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', display: 'block', fontSize: '0.8rem' }}>
                          {dt.date}
                        </span>
                        {dt.time && (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2, whiteSpace: 'nowrap' }}>
                            <Clock size={11} color="#38bdf8" />
                            {dt.time}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  <strong style={{ color: '#f8fafc', display: 'block' }}>{order.agency_name}</strong>
                  {order.area_name && (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      📍 {order.area_name}
                    </span>
                  )}
                </td>
                <td>
                  <span 
                    style={{ 
                      fontSize: '0.725rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.55rem',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap',
                      background: isSelfPickup ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: isSelfPickup ? '#38bdf8' : '#fbbf24',
                      border: isSelfPickup ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    {isSelfPickup ? '🏢 SELF PICKUP' : '🚚 F.O.R (VEHICLE)'}
                  </span>
                </td>
                <td>
                  <span 
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: '#34d399', 
                      background: 'rgba(52, 211, 153, 0.12)', 
                      border: '1px solid rgba(52, 211, 153, 0.25)', 
                      padding: '0.2rem 0.55rem', 
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap'
                    }}
                    title={`System Admin Approval Granted by: ${order.approved_by_name || 'System Admin'}${order.approved_at ? ` at ${order.approved_at}` : ''}`}
                  >
                    <ShieldCheck size={13} color="#34d399" />
                    {order.approved_by_name || 'System Admin'}
                  </span>
                </td>
                <td>
                  {order.invoice_number ? (
                    <code style={{ color: '#34d399', fontWeight: 800, fontSize: '0.75rem' }}>{order.invoice_number}</code>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.725rem' }}>Pending Bill</span>
                  )}
                </td>
                <td>
                  {(() => {
                    const isFMCD = Boolean(
                      (order as any).company_segment?.toUpperCase() === 'FMCD' ||
                      (order as any).segment?.toUpperCase() === 'FMCD' ||
                      ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].includes((order.company_name || (order as any).company_handle || '').toUpperCase()) ||
                      ['WHIRLPOOL', 'DAIKIN', 'CRUISE', 'AKAI', 'AK'].some(k => (order.order_number || '').toUpperCase().startsWith(k)) ||
                      ((order.items || []).length > 0 && (order.items || []).every(it => !it.pcs_per_box || it.pcs_per_box <= 1))
                    );

                    const issuedItems = (order.items || []).filter(item => (item.issued_qty_pcs || 0) > 0);
                    const totalItemsCount = issuedItems.length > 0 ? issuedItems.length : (order.items?.length || 0);

                    // Compute Billed Breakdown
                    let billedBoxes = 0;
                    let billedLoose = 0;
                    let billedTotalPcs = 0;

                    (order.items || []).forEach(it => {
                      const issued = it.issued_qty_pcs != null && it.issued_qty_pcs > 0 ? it.issued_qty_pcs : (it.total_qty_pcs || 0);
                      const pack = it.pcs_per_box && it.pcs_per_box > 0 ? it.pcs_per_box : 1;
                      if (!isFMCD && pack > 1) {
                        billedBoxes += Math.floor(issued / pack);
                        billedLoose += (issued % pack);
                      } else {
                        billedLoose += issued;
                      }
                      billedTotalPcs += issued;
                    });

                    if (billedTotalPcs === 0 && order.billing_total_qty) {
                      billedTotalPcs = order.billing_total_qty;
                    }

                    if (!order.invoice_number && billedTotalPcs === 0 && billedBoxes === 0) {
                      return <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Not Billed</span>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 165 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>Total Items:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '0.12rem 0.45rem',
                            borderRadius: 6,
                            whiteSpace: 'nowrap'
                          }}>
                            📦 {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700 }}>Billed Qty:</span>
                          <span style={{
                            fontSize: '0.775rem',
                            fontWeight: 900,
                            color: '#34d399',
                            background: 'rgba(52, 211, 153, 0.12)',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            padding: '0.12rem 0.5rem',
                            borderRadius: 6,
                            whiteSpace: 'nowrap'
                          }}>
                            {isFMCD ? (
                              `⚡ ${billedTotalPcs.toLocaleString()} PCS`
                            ) : (
                              billedBoxes > 0 && billedLoose > 0
                                ? `📦 ${billedBoxes} BOX, ${billedLoose} PCS`
                                : billedBoxes > 0
                                  ? `📦 ${billedBoxes} BOX (${billedTotalPcs.toLocaleString()} PCS)`
                                  : `${billedTotalPcs.toLocaleString()} PCS`
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status === 'BILLED' && '🧾 BILL READY FOR DELIVERY'}
                    {order.status === 'READY_FOR_PICKUP' && '📦 READY FOR PICKUP'}
                    {order.status === 'OUT_FOR_DELIVERY' && '🚚 OUT FOR DELIVERY'}
                    {order.status === 'COMPLETED' && '✅ DELIVERED & COMPLETED'}
                    {order.status !== 'BILLED' && order.status !== 'READY_FOR_PICKUP' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'COMPLETED' && order.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {!order.invoice_number && order.status !== 'BILLED' && order.status !== 'INVOICED' && !['DISPATCHED', 'PARTIALLY_DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
                    <span style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} color="#fbbf24" /> Awaiting Stage 4 Bill
                    </span>
                  )}

                  {/* Step 2: Bill is Ready (Accounts Issued Invoice / Stage 4 Cleared) -> Load Vehicle & Deliver */}
                  {(order.status === 'BILLED' || order.status === 'INVOICED' || (Boolean(order.invoice_number) && order.status !== 'DISPATCHED' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && order.status !== 'READY_FOR_PICKUP')) && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {isSelfPickup ? (
                        <button 
                          className="btn btn-outline"
                          onClick={() => onOpenDispatchModal(order)}
                          style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <PackageCheck size={14} /> Mark Ready for Self Pickup
                        </button>
                      ) : (
                        <button 
                          className="btn btn-success"
                          onClick={() => onOpenDispatchModal(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Truck size={14} /> Load & Mark Out for Delivery
                        </button>
                      )}
                      {onViewInvoice && (
                        <button
                          className="btn btn-outline"
                          onClick={() => onViewInvoice(order)}
                          style={{ borderColor: '#f59e0b', color: '#fbbf24', padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="View / Print Delivery Challan"
                        >
                          <Truck size={12} /> Delivery Challan
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 4: Ready for Pickup -> Mark Delivered */}
                  {order.status === 'READY_FOR_PICKUP' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => handleMarkDelivered(order)}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <CheckCircle size={14} /> Mark Agency Collected
                    </button>
                  )}

                  {(order.status === 'OUT_FOR_DELIVERY' || order.status === 'DISPATCHED') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          className="btn btn-success"
                          onClick={() => handleMarkDelivered(order)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Mark order delivered and completed"
                        >
                          <CheckCircle size={13} /> Mark Delivered
                        </button>
                        {onOpenPODModal && (
                          <button
                            className="btn btn-primary"
                            onClick={() => onOpenPODModal(order)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Verify POD document"
                          >
                            <FileCheck2 size={13} /> Verify POD
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          onClick={() => onOpenDispatchModal(order)}
                          style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 800 }}
                          title="View or edit vehicle / driver details"
                        >
                          <Truck size={13} /> {order.driver_name ? 'Driver Info' : 'Add Driver'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Completed */}
                  {order.status === 'COMPLETED' && (
                    <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 800 }}>
                      ✅ Delivered
                    </span>
                  )}
                </td>
              </tr>
            );
          };

          if (filteredOrders.length === 0) {
            const hasPoolOrders = currentPoolOrders.length > 0;
            return (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
                <Truck size={36} color="#64748b" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                  No Orders Found
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: 480, margin: '0 auto 1rem' }}>
                  {hasPoolOrders
                    ? `There are ${currentPoolOrders.length} order(s) in this queue, but none match the active delivery mode ("${deliveryModeFilter}") or zone filter.`
                    : dispatchFilter === 'UPCOMING'
                    ? 'No orders are currently awaiting dispatch. When bill details are issued in Accounts & Billing, orders immediately move here.'
                    : dispatchFilter === 'COMPLETED'
                    ? 'No orders have been dispatched or completed yet.'
                    : dispatchFilter === 'AWAITING_BILL'
                    ? 'No orders are currently awaiting Stage 4 billing.'
                    : 'No orders found in the dispatch pipeline.'}
                </p>
                {hasPoolOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryModeFilter('ALL');
                      setSelectedZoneFilter('ALL');
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      padding: '0.45rem 1rem',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Show All Delivery Modes & Zones ({currentPoolOrders.length} Orders)
                  </button>
                )}
              </div>
            );
          }

          // VIEW 1: GROUPED BY ZONE (Default)
          if (viewMode === 'grouped') {
            const zoneEntries = Object.entries(zoneGroups);

            return (
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {zoneEntries.map(([zoneName, zone]) => {
                  const isCollapsed = Boolean(collapsedZones[zoneName]);
                  const zoneForCount = zone.orders.filter(o => o.delivery_type !== 'Self Pickup').length;
                  const zonePickupCount = zone.orders.filter(o => o.delivery_type === 'Self Pickup').length;
                  
                  const zoneTotalBoxes = zone.orders.reduce((sum, o) => {
                    if (o.total_box_qty) return sum + o.total_box_qty;
                    return sum + (o.items || []).reduce((iSum, it) => iSum + (it.box_qty || 0), 0);
                  }, 0);

                  const zoneTotalPcs = zone.orders.reduce((sum, o) => {
                    return sum + (o.billing_total_qty || o.total_qty_pcs || (o.items || []).reduce((iSum, it) => iSum + (it.issued_qty_pcs || it.total_qty_pcs || 0), 0));
                  }, 0);

                  return (
                    <div 
                      key={zoneName}
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 10,
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                      }}
                    >
                      {/* Zone Header Banner */}
                      <div 
                        onClick={() => toggleCollapseZone(zoneName)}
                        style={{
                          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          borderLeft: '4px solid #38bdf8',
                          borderBottom: isCollapsed ? 'none' : '1px solid #334155'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <MapPin size={17} color="#38bdf8" />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                                Zone: {zoneName}
                              </h3>
                              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(148, 163, 184, 0.12)', padding: '0.1rem 0.45rem', borderRadius: 4 }}>
                                {zone.zoneRegion}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {zone.orders.length} {zone.orders.length === 1 ? 'consignment' : 'consignments'} to arrange
                            </span>
                          </div>
                        </div>

                        {/* Zone Metrics Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {zoneForCount > 0 && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 6 }}>
                              🚚 {zoneForCount} F.O.R (Vehicle)
                            </span>
                          )}
                          {zonePickupCount > 0 && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 6 }}>
                              🏢 {zonePickupCount} Self Pickup
                            </span>
                          )}
                          <span style={{ fontSize: '0.725rem', fontWeight: 900, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 6 }}>
                            📦 {zoneTotalBoxes} Boxes ({zoneTotalPcs.toLocaleString()} PCS)
                          </span>
                          <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Zone Orders Table */}
                      {!isCollapsed && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="data-table" style={{ margin: 0 }}>
                            {renderTableHeader()}
                            <tbody>
                              {zone.orders.map(order => renderOrderRow(order))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          // VIEW 2: FLAT TABLE
          return (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                {renderTableHeader()}
                <tbody>
                  {filteredOrders.map(order => renderOrderRow(order))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
