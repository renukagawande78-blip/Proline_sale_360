import { createClient } from '@supabase/supabase-js';
import { 
  Company, 
  Agency, 
  Product, 
  Order, 
  OrderItem, 
  HoldReason, 
  AgencyFinancials, 
  ZoneMaster, 
  AreaMaster, 
  AreaTypeMaster,
  getGroupCode 
} from '../types';
import { 
  OFFICIAL_AREAS_MASTER, 
  OFFICIAL_ZONE_MASTERS, 
  DEFAULT_AREA_TYPES,
  resolveOfficialZone,
  normalizeAreaName
} from '../data/officialAreasData';
import { DEFAULT_HOLD_REASONS } from '../data/officialHoldReasonsData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://psaguppgoigpxumzgvjx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const isValidUuid = (str: any): boolean => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const isCompanyAllowedForUser = (companyNameOrCode?: string, userCompanyHandle?: any, companyCode?: string): boolean => {
  if (!userCompanyHandle) return false;
  
  let allowedBrands: string[] = [];
  if (Array.isArray(userCompanyHandle)) {
    allowedBrands = userCompanyHandle.map(b => String(b).trim().toLowerCase()).filter(Boolean);
  } else if (typeof userCompanyHandle === 'string') {
    const raw = userCompanyHandle.trim();
    if (raw === 'All' || raw === '*' || raw.toLowerCase() === 'all') return true;
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          allowedBrands = parsed.map(b => String(b).trim().toLowerCase()).filter(Boolean);
        }
      } catch {
        allowedBrands = raw.replace(/[\[\]"']/g, '').split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
      }
    } else {
      allowedBrands = raw.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    }
  }

  if (allowedBrands.length === 0) return false;
  if (allowedBrands.includes('all') || allowedBrands.includes('*')) return true;

  const targetName = (companyNameOrCode || '').toLowerCase().trim();
  const targetCode = (companyCode || '').toLowerCase().trim();
  
  if (!targetName && !targetCode) return false;

  return allowedBrands.some(allowed => {
    if (!allowed) return false;
    
    // Direct exact matches
    if (targetName && targetName === allowed) return true;
    if (targetCode && targetCode === allowed) return true;
    
    // Normalized word comparison (e.g. "priyagold" matches "priya gold" or "pringod", "mogu mogu" matches "mogumogu")
    const normTarget = targetName.replace(/[\s\-_]/g, '');
    const normAllowed = allowed.replace(/[\s\-_]/g, '');
    if (normTarget && normAllowed && (normTarget === normAllowed || (normTarget.length >= 3 && normAllowed.length >= 3 && (normTarget.includes(normAllowed) || normAllowed.includes(normTarget))))) {
      return true;
    }

    return false;
  });
};

export const checkIsSuperAdmin = (user: any): boolean => {
  if (!user) return false;
  const role = (user?.role_name || '').toUpperCase();
  const name = (user?.full_name || '').toLowerCase();
  const email = (user?.email || '').toLowerCase();
  return (
    role === 'SUPER_ADMIN' ||
    name.includes('chirag') ||
    name.includes('harshad') ||
    (email.includes('admin') && role !== 'SALES_ADMIN') ||
    user?.company_handle === 'All'
  );
};

export interface OrderAccessPermission {
  canView: boolean;
  canExecuteActions: boolean;
  isDirectBrandOwner: boolean;
  isItemBrandOwner: boolean;
  accessReason: string;
}

export const getOrderAccessPermission = (
  order: Order, 
  user: { id?: string; full_name?: string; role_name?: string; company_handle?: string; area_id?: string } | null,
  companiesPool?: any[],
  productsPool?: any[]
): OrderAccessPermission => {
  if (!user) {
    return {
      canView: false,
      canExecuteActions: false,
      isDirectBrandOwner: false,
      isItemBrandOwner: false,
      accessReason: 'No logged in user session'
    };
  }

  const role = (user.role_name || '').toUpperCase();
  const userHandle = user.company_handle || '';
  const userName = (user.full_name || '').toLowerCase();

  // ── 1. SUPER ADMIN — sees ALL orders globally ──────────────────────
  const isSuperAdmin = role === 'SUPER_ADMIN' ||
                       userName.includes('chirag') ||
                       userName.includes('harshad') ||
                       userHandle === 'All';

  if (isSuperAdmin) {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Super Admin — Global Scope'
    };
  }

  // Resolve order's company and company code
  const cPool = (companiesPool && companiesPool.length > 0) ? companiesPool : MOCK_COMPANIES;
  const orderComp = cPool.find((c: any) => c.id === order.company_id || c.company_name === order.company_name || c.company_code === order.company_name);
  const resolvedCompName = orderComp?.company_name || (order.company_name && order.company_name !== 'Proline Foods' ? order.company_name : '');
  const resolvedCompCode = orderComp?.company_code || '';

  const isBrandAllowed = isCompanyAllowedForUser(resolvedCompName, userHandle, resolvedCompCode);

  // ── 2. SALES PERSON — sees ONLY their own orders ──────────────────
  if (role === 'SALES_PERSON' || role === 'SALESPERSON') {
    const orderSalesperson = (order.salesperson_name || '').toLowerCase();
    const isOwnOrder: boolean = Boolean(
      (user.id && order.salesperson_id === user.id) ||
      (userName && orderSalesperson && (
        orderSalesperson.includes(userName) ||
        userName.includes(orderSalesperson)
      ))
    );

    const canSee = isOwnOrder && isBrandAllowed;
    return {
      canView: canSee,
      canExecuteActions: canSee,
      isDirectBrandOwner: canSee,
      isItemBrandOwner: canSee,
      accessReason: canSee ? 'Own Order — Salesperson' : 'Not your order or brand'
    };
  }

  // ── 3. AREA SALES MANAGER — sees ONLY their area orders + mapped brand ──
  if (role === 'AREA_SALES_MANAGER') {
    const userAreaId = (user as any).area_id || '';
    const isAreaAllowed = !userAreaId ||
      (order.area_id && order.area_id === userAreaId) ||
      (order.asm_id && order.asm_id === user.id);

    const canSee = isBrandAllowed && (isAreaAllowed || !userAreaId);
    return {
      canView: canSee,
      canExecuteActions: canSee,
      isDirectBrandOwner: isBrandAllowed,
      isItemBrandOwner: isBrandAllowed,
      accessReason: canSee ? 'Area Manager — Area + Brand Scope' : 'Outside area or brand scope'
    };
  }

  // ── 4. SALES ADMIN — sees only their MAPPED BRAND(S) orders ──────
  if (role === 'SALES_ADMIN') {
    if (!userHandle || userHandle === '') {
      return {
        canView: false,
        canExecuteActions: false,
        isDirectBrandOwner: false,
        isItemBrandOwner: false,
        accessReason: 'Sales Admin — No brand assigned'
      };
    }

    if (userHandle === 'All' || userHandle === '*') {
      return {
        canView: true,
        canExecuteActions: true,
        isDirectBrandOwner: true,
        isItemBrandOwner: true,
        accessReason: 'Sales Admin — All Brands Scope'
      };
    }

    if (isBrandAllowed) {
      return {
        canView: true,
        canExecuteActions: true,
        isDirectBrandOwner: true,
        isItemBrandOwner: true,
        accessReason: 'Sales Admin — Mapped Brand Scope'
      };
    }

    // Line items check if items are present
    const pPool = (productsPool && productsPool.length > 0) ? productsPool : MOCK_PRODUCTS;
    const hasItemMatch = (order.items || []).length > 0 && (order.items || []).some(item => {
      const prod = pPool.find((p: any) => p.id === item.product_id || p.product_name === item.product_name);
      const itemComp = cPool.find((c: any) => c.id === prod?.company_id);
      const brandName = itemComp?.company_name || '';
      const brandCode = itemComp?.company_code || '';
      if (!brandName && !brandCode) return false;
      return isCompanyAllowedForUser(brandName, userHandle, brandCode);
    });

    if (hasItemMatch) {
      return {
        canView: true,
        canExecuteActions: true,
        isDirectBrandOwner: false,
        isItemBrandOwner: true,
        accessReason: 'Sales Admin — Brand matched via order items'
      };
    }

    return {
      canView: false,
      canExecuteActions: false,
      isDirectBrandOwner: false,
      isItemBrandOwner: false,
      accessReason: 'Order brand not in Sales Admin scope'
    };
  }

  // ── 5. BILLING / ACCOUNTS — sees mapped company orders + orders needing accounts approval
  if (role === 'ACCOUNTS') {
    const needsAccounts = order.need_accounts_approval === true;
    const canSee = isBrandAllowed || userHandle === 'All' || userHandle === '*' || needsAccounts;
    return {
      canView: canSee,
      canExecuteActions: canSee,
      isDirectBrandOwner: isBrandAllowed,
      isItemBrandOwner: isBrandAllowed,
      accessReason: needsAccounts ? 'Accounts Review Scope (Approval Needed)' : (canSee ? 'Accounts — Global/Brand Scope' : 'Order outside accounts scope')
    };
  }

  if (role === 'BILLING') {
    return {
      canView: isBrandAllowed,
      canExecuteActions: isBrandAllowed,
      isDirectBrandOwner: isBrandAllowed,
      isItemBrandOwner: isBrandAllowed,
      accessReason: isBrandAllowed ? 'Billing — Company Scope' : 'Order outside billing scope'
    };
  }

  // ── 6. DISPATCH MANAGER — warehouse dispatches all brands / bills that come for dispatch ─────────
  if (role === 'DISPATCH_MANAGER' || role === 'DISPATCH') {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Dispatch — Universal Warehouse & Logistics Scope'
    };
  }

  // ── 7. Fallback — no access ────────────────────────────────────────
  return {
    canView: false,
    canExecuteActions: false,
    isDirectBrandOwner: false,
    isItemBrandOwner: false,
    accessReason: 'No matching role permission'
  };
};

/**
 * Section 5: Order Proceed Logic
 * Evaluates whether an order can proceed to Stage 3: Stock Check / Ready for Billing.
 */
export const checkCanOrderProceed = (order: Order): { canProceed: boolean; reason: string } => {
  const accountsConditionPassed =
    order.need_accounts_approval === false ||
    order.need_accounts_approval === undefined ||
    order.accounts_approval_status === 'NOT_REQUIRED' ||
    !order.accounts_approval_status ||
    (order.need_accounts_approval === true && order.accounts_approval_status === 'APPROVED');

  if (order.need_accounts_approval === true) {
    if (order.accounts_approval_status === 'PENDING') {
      return { canProceed: false, reason: 'Waiting for Accounts approval' };
    }
    if (order.accounts_approval_status === 'HOLD') {
      return { canProceed: false, reason: 'Order placed on hold by Accounts' };
    }
    if (order.accounts_approval_status === 'REJECTED') {
      return { canProceed: false, reason: 'Order rejected by Accounts' };
    }
  }

  const saleAdminApproved = !!order.sales_admin_approved || (order.status !== 'SUBMITTED' && order.status !== 'DRAFT');
  const salesPersonApproved = true; // Order entry completed

  const canProceed = saleAdminApproved && salesPersonApproved && accountsConditionPassed;
  return {
    canProceed,
    reason: canProceed ? 'Ready for Stage 3 (Stock Check & Billing Queue)' : 'Waiting for required approvals'
  };
};

export const DYNAMIC_AGENCY_FINANCIALS: Record<string, AgencyFinancials> = {};

export const getAgencyFinancialsByAgencyId = (agencyId?: string): AgencyFinancials => {
  const targetId = agencyId || MOCK_AGENCIES[0]?.id || 'a_pty_001';
  if (DYNAMIC_AGENCY_FINANCIALS[targetId]) {
    return DYNAMIC_AGENCY_FINANCIALS[targetId];
  }

  const agency = MOCK_AGENCIES.find(a => a.id === targetId) || MOCK_AGENCIES[0] || {
    id: targetId,
    agency_name: 'No Agency Selected',
    credit_limit: 0,
    account_group: 'Sundry Debtors'
  };
  const creditLimit = agency.credit_limit || 250000;
  
  const seed = targetId ? (targetId.charCodeAt(targetId.length - 1) || 65) : 65;
  const currentOutstanding = Math.min(creditLimit * 0.75, Math.floor((seed * 1750) % creditLimit));
  const overdueAmount = (seed % 2 === 0) ? Math.floor(currentOutstanding * 0.35) : 0;
  const availableCredit = Math.max(0, creditLimit - currentOutstanding);
  const creditScore = Math.min(98, 72 + (seed % 26));

  return {
    agency_id: agency.id,
    agency_name: agency.agency_name,
    credit_limit: creditLimit,
    current_outstanding: currentOutstanding,
    outstanding_amount: currentOutstanding,
    overdue_amount: overdueAmount,
    advance_amount: 0,
    available_credit: availableCredit,
    credit_score: creditScore,
    payment_terms_days: 30,
    accounts_clearance_status: overdueAmount > 0 ? 'NEEDS_ACCOUNTS_CLEARANCE' : 'CREDIT_OK',
    account_type: agency.account_group || 'FMCG',
    remarks: overdueAmount > 0 ? 'Overdue payment pending clearance verification' : 'Regular credit account - clear balance',
    updated_at: new Date(Date.now() - 3600000 * (seed % 48)).toISOString(),
    updated_by_name: 'Accounts Executive'
  };
};

export const updateAgencyFinancials = (agencyId: string, updated: Partial<AgencyFinancials>): AgencyFinancials => {
  const existing = getAgencyFinancialsByAgencyId(agencyId);
  const creditLimit = updated.credit_limit !== undefined ? Number(updated.credit_limit) : (existing.credit_limit || 250000);
  const currentOutstanding = updated.current_outstanding !== undefined ? Number(updated.current_outstanding) : (updated.outstanding_amount !== undefined ? Number(updated.outstanding_amount) : (existing.current_outstanding || 0));
  const overdueAmount = updated.overdue_amount !== undefined ? Number(updated.overdue_amount) : (existing.overdue_amount || 0);
  const advanceAmount = updated.advance_amount !== undefined ? Number(updated.advance_amount) : (existing.advance_amount || 0);
  const availableCredit = Math.max(0, creditLimit - currentOutstanding + advanceAmount);

  const newRecord: AgencyFinancials = {
    ...existing,
    ...updated,
    agency_id: agencyId,
    credit_limit: creditLimit,
    current_outstanding: currentOutstanding,
    outstanding_amount: currentOutstanding,
    overdue_amount: overdueAmount,
    advance_amount: advanceAmount,
    available_credit: availableCredit,
    accounts_clearance_status: overdueAmount > 0 ? 'NEEDS_ACCOUNTS_CLEARANCE' : 'CREDIT_OK',
    updated_at: updated.updated_at || new Date().toISOString(),
    updated_by_name: updated.updated_by_name || 'Accounts Officer'
  };

  DYNAMIC_AGENCY_FINANCIALS[agencyId] = newRecord;
  return newRecord;
};

export const DEFAULT_COMPANIES: Company[] = [];
export const MOCK_COMPANIES: Company[] = [];

export const resolveSegmentForUser = (
  user?: { company_handle?: string; role_name?: string; assigned_segment?: string } | null,
  companiesPool?: Company[]
): 'ALL' | 'FMCG' | 'FMCD' => {
  if (!user) return 'ALL';
  if (user.assigned_segment && (user.assigned_segment === 'FMCG' || user.assigned_segment === 'FMCD')) {
    return user.assigned_segment;
  }
  if (user.role_name === 'SUPER_ADMIN' || user.company_handle === 'All' || !user.company_handle) {
    return 'ALL';
  }

  const pool = (companiesPool && companiesPool.length > 0) ? companiesPool : MOCK_COMPANIES;
  
  let allowedBrands: string[] = [];
  if (Array.isArray(user.company_handle)) {
    allowedBrands = user.company_handle.map(b => String(b).trim().toLowerCase());
  } else if (typeof user.company_handle === 'string') {
    allowedBrands = user.company_handle.split(',').map(b => b.trim().toLowerCase());
  }

  const mappedCompanies = pool.filter(c => 
    allowedBrands.some(brand => 
      c.company_name.toLowerCase().includes(brand) || 
      brand.includes(c.company_name.toLowerCase()) ||
      (c.company_code && c.company_code.toLowerCase() === brand)
    )
  );

  if (mappedCompanies.length > 0) {
    const segments = Array.from(new Set(mappedCompanies.map(c => (c.segment || 'FMCG').toUpperCase()).filter(Boolean)));
    if (segments.length === 1 && (segments[0] === 'FMCG' || segments[0] === 'FMCD')) {
      return segments[0] as 'FMCG' | 'FMCD';
    }
  }

  // Brand segment heuristics when pool is loading
  const lowerHandle = String(user.company_handle).toLowerCase();
  if (lowerHandle.includes('hell') || lowerHandle.includes('akai') || lowerHandle.includes('whirlpool') || lowerHandle.includes('daikin') || lowerHandle.includes('cruise')) {
    return 'FMCD';
  }
  if (lowerHandle.includes('priyagold') || lowerHandle.includes('mogu') || lowerHandle.includes('rcpl') || lowerHandle.includes('orion') || lowerHandle.includes('gandour') || lowerHandle.includes('hppl') || lowerHandle.includes('waiwai') || lowerHandle.includes('pran')) {
    return 'FMCG';
  }

  return 'ALL';
};

export const MOCK_ZONES: ZoneMaster[] = OFFICIAL_ZONE_MASTERS;

const DEFAULT_ZONE: ZoneMaster = OFFICIAL_ZONE_MASTERS[0] || {
  id: 'zn_cta',
  zone_code: 'ZN-CTA',
  zone_name: 'City-A',
  region: 'City',
  major_areas: [],
  description: 'Default Zone'
};

export const deduplicateZones = (zones: ZoneMaster[]): ZoneMaster[] => {
  const seenKeys = new Set<string>();
  const result: ZoneMaster[] = [];

  for (const z of (zones || [])) {
    if (!z) continue;
    const nameKey = (z.zone_name || '').toString().toLowerCase().trim();
    const codeKey = (z.zone_code || '').toString().toLowerCase().trim();
    const idKey = (z.id || '').toString().toLowerCase().trim();

    const primaryKey = nameKey || codeKey || idKey;
    if (!primaryKey || seenKeys.has(primaryKey)) continue;
    seenKeys.add(primaryKey);

    const areaSeen = new Set<string>();
    const cleanAreas: string[] = [];

    for (const area of z.major_areas || []) {
      const aNorm = (area || '').toString().trim();
      const aKey = aNorm.toLowerCase();
      if (!aKey || areaSeen.has(aKey)) continue;
      areaSeen.add(aKey);
      cleanAreas.push(aNorm);
    }

    result.push({
      ...z,
      major_areas: cleanAreas
    });
  }

  return result;
};

export const deduplicateProducts = (products: Product[]): Product[] => {
  const seen = new Set<string>();
  return (products || []).filter(p => {
    const key = (p.id || p.product_code || p.product_name || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const deduplicateAgencies = (agencies: Agency[]): Agency[] => {
  const map: Record<string, Agency> = {};
  (agencies || []).forEach(a => {
    const normName = (a.agency_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normGst = (a.gstin || a.gst_number || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let key = '';
    if (normGst && normGst !== 'na') {
      key = `gst_${normGst}`;
    } else if (normName && normGst) {
      key = `name_gst_${normName}_${normGst}`;
    } else if (normName) {
      const normCity = (a.city || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      key = `name_city_${normName}_${normCity}`;
    } else {
      key = (a.id || a.agency_code || '').toLowerCase().trim();
    }

    if (!map[key]) {
      const resolvedZone = resolveZoneForAreaAndCity(a.area_name, a.city);
      map[key] = {
        ...a,
        agency_name: (a.agency_name || 'N/A').trim(),
        city: (a.city || 'N/A').trim(),
        area_name: (a.area_name || a.city || 'N/A').trim(),
        agency_code: (a.agency_code || `AG-${((a.city && a.city !== 'N/A') ? a.city : 'SUR').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`).toUpperCase(),
        credit_limit: Number(a.credit_limit || 0),
        zone_name: a.zone_name || resolvedZone.zone_name || 'N/A',
        zone_region: a.zone_region || resolvedZone.region || 'N/A'
      };
    }
  });
  return Object.values(map);
};

export const deduplicateUsers = (users: any[]): any[] => {
  const seen = new Set<string>();
  return (users || []).filter(u => {
    const key = (u.id || u.email || u.full_name || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const fetchZonesFromSupabaseAreasTable = async (): Promise<ZoneMaster[]> => {
  try {
    const { data: areasData, error: areasError } = await supabase.from('areas').select('*');
    if (areasError) console.warn('Supabase fetch areas notice:', areasError.message);

    const { data: zonesData, error: zonesError } = await supabase.from('zones').select('*');
    if (zonesError) console.warn('Supabase fetch zones notice:', zonesError.message);

    const zoneMap: Record<string, ZoneMaster> = {};

    if (zonesData && zonesData.length > 0) {
      zonesData.forEach((z: any) => {
        const name = (z.zone_name || z.name || '').toString().trim();
        const code = (z.zone_code || z.code || '').toString().trim();
        if (!name) return;

        const key = name.toLowerCase();
        const areasList = Array.isArray(z.major_areas) 
          ? z.major_areas 
          : (typeof z.major_areas === 'string' ? JSON.parse(z.major_areas) : []);

        zoneMap[key] = {
          id: z.id || `zn_${key}`,
          zone_code: code || `ZN-${key.toUpperCase()}`,
          zone_name: name as any,
          region: z.region || (name.toLowerCase().includes('surat') || name.startsWith('City') ? 'Surat City Zone' : 'South Gujarat Rural Zone'),
          major_areas: areasList.map((a: string) => (a || '').toString().trim()).filter(Boolean),
          description: z.description || ''
        };
      });
    }

    if (areasData && areasData.length > 0 && !areasError) {
      areasData.forEach((row: any, idx: number) => {
        const rawZoneName = (row.zone_name || row.zone || row.region || '').toString().trim();
        const rawZoneCode = (row.zone_code || row.code || '').toString().trim();
        const rawAreaName = (row.area_name || row.name || row.locality || '').toString().trim();
        const rawRegion = (row.region || row.zone_region || '').toString().trim();

        if (!rawZoneName && !rawAreaName) return;

        const zName = rawZoneName || 'General Zone';
        const key = zName.toLowerCase();
        const zRegion = rawRegion || (zName.toLowerCase().includes('surat') || zName.startsWith('City') ? 'Surat City Zone' : 'South Gujarat Rural Zone');
        const zCode = rawZoneCode || `ZN-${(row.area_code || idx + 1).toString().padStart(3, '0')}`;

        if (!zoneMap[key]) {
          zoneMap[key] = {
            id: row.zone_id || row.id || `zn_area_${idx + 1}`,
            zone_code: zCode,
            zone_name: zName as any,
            region: zRegion as any,
            major_areas: [],
            description: row.description || `${zRegion} Coverage Area`
          };
        }

        if (rawAreaName) {
          const areaKey = rawAreaName.toLowerCase();
          const exists = zoneMap[key].major_areas.some(existing => existing.toLowerCase() === areaKey);
          if (!exists) {
            zoneMap[key].major_areas.push(rawAreaName);
          }
        }
      });
    }

    const fetchedList = Object.values(zoneMap);
    if (fetchedList.length === 0) {
      return deduplicateZones(OFFICIAL_ZONE_MASTERS);
    }
    return deduplicateZones(fetchedList);
  } catch (err: any) {
    console.error('Error fetching zones from Supabase areas table:', err?.message || err);
    return deduplicateZones(OFFICIAL_ZONE_MASTERS);
  }
};

export const saveZoneToSupabase = async (zone: ZoneMaster): Promise<{ success: boolean; error: string | null }> => {
  try {
    const payload = {
      id: zone.id,
      zone_code: zone.zone_code,
      zone_name: zone.zone_name,
      region: zone.region,
      major_areas: zone.major_areas,
      description: zone.description
    };
    const { error } = await supabase.from('zones').upsert(payload);
    if (error) {
      console.error('Error saving zone to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error saving zone to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save zone' };
  }
};

export const deleteZoneFromSupabase = async (zoneId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('zones').delete().eq('id', zoneId);
    if (error) {
      console.error('Error deleting zone from Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting zone from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete zone' };
  }
};

export const clearZonesFromSupabase = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('zones').delete().neq('id', '');
    if (error) {
      console.error('Error clearing all zones from Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error clearing all zones from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to clear zones' };
  }
};

export const addAreaTagToSupabaseZone = async (zone: ZoneMaster, newAreaName: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const updatedAreas = Array.from(new Set([...zone.major_areas, newAreaName]));
    const { error: zErr } = await supabase.from('zones').update({ major_areas: updatedAreas }).eq('id', zone.id);
    if (zErr) console.warn('Supabase zone update error:', zErr.message);

    const { error: aErr } = await supabase.from('areas').upsert({
      area_name: newAreaName,
      zone_id: zone.id,
      zone_name: zone.zone_name,
      region: zone.region,
      zone_code: zone.zone_code
    });
    if (aErr) {
      console.error('Error adding area to Supabase:', aErr.message);
      return { success: false, error: aErr.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error adding area to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to add area tag' };
  }
};

export const removeAreaTagFromSupabaseZone = async (zone: ZoneMaster, areaNameToRemove: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const updatedAreas = zone.major_areas.filter(a => a !== areaNameToRemove);
    const { error: zErr } = await supabase.from('zones').update({ major_areas: updatedAreas }).eq('id', zone.id);
    if (zErr) console.warn('Supabase zone update error:', zErr.message);

    const { error: aErr } = await supabase.from('areas').delete().eq('zone_id', zone.id).eq('area_name', areaNameToRemove);
    if (aErr) {
      console.error('Error removing area from Supabase:', aErr.message);
      return { success: false, error: aErr.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error removing area from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to remove area tag' };
  }
};

export const DEFAULT_AREAS: AreaMaster[] = OFFICIAL_AREAS_MASTER;

export const deduplicateAreas = (rawAreas: AreaMaster[]): AreaMaster[] => {
  const map: Record<string, AreaMaster> = {};
  rawAreas.forEach(a => {
    const rawName = (a.area_name || '').trim();
    if (!rawName || rawName === 'N/A') return;
    const canonicalName = normalizeAreaName(rawName) || rawName;
    const city = (a.city || 'Surat').trim();
    // Unique key combines city and canonical area name to merge casing & aliases
    const key = `${city.toLowerCase()}::${canonicalName.toLowerCase()}`;
    if (!map[key]) {
      const resolved = resolveOfficialZone(canonicalName, city);
      map[key] = {
        ...a,
        area_name: canonicalName,
        city: city,
        zone_code: a.zone_code || resolved.zoneName,
        region: a.region || resolved.region,
        area_code: (a.area_code || `AR-${city.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`).toUpperCase()
      };
    }
  });
  return Object.values(map);
};

export const fetchAreasFromSupabaseTable = async (): Promise<AreaMaster[]> => {
  try {
    const { data, error } = await supabase.from('areas').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch areas error:', error.message);
      return deduplicateAreas(DEFAULT_AREAS);
    }
    if (!data || data.length === 0) return deduplicateAreas(DEFAULT_AREAS);
    const formatted: AreaMaster[] = data.map((row, idx) => ({
      id: row.id || `ar_${idx + 1}`,
      area_code: row.area_code || row.area_id || `AR-SUR-${(idx + 1).toString().padStart(3, '0')}`,
      area_name: row.area_name || row.name || 'Unnamed Locality',
      city: row.city || 'Surat',
      zone_code: row.zone_code || row.zone_id || 'ZN-SUR-A',
      region: row.region || (row.city === 'Surat' ? 'Surat City Zone' : 'South Gujarat Rural Zone'),
      description: row.description || 'Live Supabase Area Master Row',
      created_at: row.created_at || new Date().toISOString()
    }));
    return deduplicateAreas([...formatted, ...DEFAULT_AREAS]);
  } catch (err: any) {
    console.error('Error fetching areas from Supabase:', err?.message || err);
    return deduplicateAreas(DEFAULT_AREAS);
  }
};

export const saveAreaToSupabase = async (area: AreaMaster): Promise<{ success: boolean; error: string | null }> => {
  try {
    const nowIso = new Date().toISOString();
    const fullPayload: Record<string, any> = {
      area_code: area.area_code,
      area_name: area.area_name,
      city: area.city || 'Surat',
      zone_code: area.zone_code || 'ZN-SUR-A',
      region: area.region || 'Surat City Zone',
      description: area.description || '',
      active: true,
      created_at: area.created_at || nowIso,
      updated_at: nowIso
    };

    if (isValidUuid(area.id)) {
      fullPayload.id = area.id;
    }

    // Attempt 1: Full modern schema upsert
    let { error } = await supabase.from('areas').upsert([fullPayload]);

    // If column doesn't exist in remote schema cache (PGRST204), fall back to base schema
    if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('Could not find')))) {
      console.warn('Supabase areas table has legacy columns. Falling back to core columns:', error.message);
      const basePayload: Record<string, any> = {
        area_code: area.area_code,
        area_name: area.area_name,
        region: area.region || 'Surat City Zone',
        active: true,
        created_at: area.created_at || nowIso
      };
      if (isValidUuid(area.id)) basePayload.id = area.id;
      
      const retryRes = await supabase.from('areas').upsert([basePayload]);
      if (!retryRes.error) {
        return { success: true, error: null };
      }
      error = retryRes.error;
    }

    if (error) {
      console.warn('Supabase saveArea note:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error saving area to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save area to Supabase' };
  }
};

export const deleteAreaFromSupabase = async (areaId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('areas').delete().eq('id', areaId);
    if (error) {
      console.error('Error deleting area from Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting area from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete area' };
  }
};

export const resolveZoneForAreaAndCity = (areaName?: string, cityName?: string): ZoneMaster => {
  const res = resolveOfficialZone(areaName, cityName);
  const matched = MOCK_ZONES.find(z => z.zone_name.toLowerCase() === res.zoneName.toLowerCase());
  if (matched) return matched;
  return MOCK_ZONES[0] || DEFAULT_ZONE;
};

// ============================================================================
// 1. COMPANIES CRUD
// ============================================================================

export const deduplicateCompanies = (companiesList: Company[]): Company[] => {
  const map = new Map<string, Company>();
  (companiesList || []).forEach(c => {
    const key = (c.company_code || c.handle || c.id || '').toUpperCase().trim();
    if (key && !map.has(key)) {
      map.set(key, c);
    }
  });
  return Array.from(map.values());
};

export const fetchCompaniesFromSupabase = async (): Promise<Company[]> => {
  try {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
      console.error('Supabase fetchCompanies error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];
    return data.map((c: any, idx: number) => ({
      id: c.id || `c_${idx + 1}`,
      company_code: c.company_code || c.code || c.handle || `COMP_${idx + 1}`,
      company_name: c.company_name || c.name || 'Brand Company',
      handle: c.handle || c.code || c.company_code || 'COMP',
      segment: c.segment || c.industry_segment || c.assigned_segment || 'FMCG',
      brand_color: c.brand_color || '#38bdf8',
      active: c.active !== false
    }));
  } catch (err: any) {
    console.error('Error fetching companies from Supabase:', err?.message || err);
    return [];
  }
};

export const saveCompanyToSupabase = async (company: any): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    const companyId = (company.id && isValidUuid(company.id)) ? company.id : generateUuid();
    const companyCode = company.company_code || company.code || company.handle || 'BRAND';
    const companyName = company.company_name || company.name || 'Brand Company';
    const companySeg = company.segment || 'FMCG';
    const isActive = company.active !== false;

    const companyRecord: Company = {
      id: companyId,
      company_code: companyCode,
      company_name: companyName,
      handle: companyCode,
      segment: companySeg as any,
      active: isActive
    };

    const existingIdx = MOCK_COMPANIES.findIndex(c => c.id === companyId || c.company_code === companyCode);
    if (existingIdx >= 0) {
      MOCK_COMPANIES[existingIdx] = { ...MOCK_COMPANIES[existingIdx], ...companyRecord };
    } else {
      MOCK_COMPANIES.unshift(companyRecord);
    }
    
    const payload: Record<string, any> = {
      id: companyId,
      company_name: companyName,
      company_code: companyCode,
      handle: companyCode,
      segment: companySeg,
      brand_color: company.brand_color || '#38bdf8',
      active: isActive,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('companies').upsert([payload]).select();
    if (error) {
      console.error('Supabase saveCompany error:', error.message);
      // Retry insert without custom ID
      delete payload.id;
      const retryRes = await supabase.from('companies').insert([payload]).select();
      if (retryRes.error) {
        console.error('Supabase saveCompany retry error:', retryRes.error.message);
        return { success: false, error: retryRes.error.message };
      }
      return { success: true, error: null, data: retryRes.data };
    }
    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Error saving company to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save company to Supabase' };
  }
};

export const deleteCompanyFromSupabase = async (companyId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) {
      console.error('Supabase deleteCompany error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting company from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete company from Supabase' };
  }
};

// ============================================================================
// 2. USERS CRUD
// ============================================================================

export const fetchUsersFromSupabase = async (): Promise<any[]> => {
  try {
    let { data, error } = await supabase.from('users').select('*');
    if (error || !data || data.length === 0) {
      const sysRes = await supabase.from('system_users').select('*');
      if (sysRes.data && sysRes.data.length > 0) {
        data = sysRes.data;
        error = null;
      }
    }
    if (error) {
      console.error('Supabase fetchUsers error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((u: any, idx: number) => ({
      sno: u.sno || idx + 1,
      id: String(u.id || `u_${idx + 1}`),
      full_name: u.full_name || u.name || u.user_name || 'System User',
      email: u.email || `${u.id}@proline.com`,
      role_name: u.role_name || u.role || 'SALES_PERSON',
      role: u.role_name || u.role || 'SALES_PERSON',
      phone: u.phone || u.mobile || '',
      permission_group_id: u.permission_group_id || 'pg_sales_person',
      permission_group_name: u.permission_group_name || 'Sales Person Group',
      company_handle: u.company_handle || u.company_handles || u.brand_handle || u.brand_scope || 'All',
      password: u.password || '1234',
      active: u.active !== false
    }));
  } catch (err: any) {
    console.error('Error fetching users from Supabase:', err?.message || err);
    return [];
  }
};

export const saveUserToSupabase = async (user: any): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    const userId = (user.id && isValidUuid(user.id)) ? user.id : generateUuid();
    
    const payload: Record<string, any> = {
      id: userId,
      full_name: user.full_name || user.name || 'User',
      email: user.email || `${userId}@proline.com`,
      role_name: user.role_name || user.role || 'SALES_PERSON',
      phone: (user.phone || user.mobile) ? (user.phone || user.mobile) : null,
      permission_group_id: user.permission_group_id || 'pg_sales_person',
      permission_group_name: user.permission_group_name || 'Sales Person Group',
      company_handle: user.company_handle || user.company_handles?.join(', ') || 'All',
      brand_handle: user.company_handle || user.company_handles?.join(', ') || 'All',
      brand_scope: user.company_handle || user.company_handles?.join(', ') || 'All',
      password: user.password || '1234',
      active: user.active !== false,
      updated_at: new Date().toISOString()
    };

    if (user.sno && typeof user.sno === 'number') {
      payload.sno = user.sno;
    }

    const { data, error } = await supabase.from('users').upsert([payload]).select();
    if (error) {
      console.warn('Supabase saveUser error on users table:', error.message);
      delete payload.id;
      const retryRes = await supabase.from('users').insert([payload]).select();
      if (retryRes.error) {
        console.error('Supabase saveUser retry error:', retryRes.error.message);
        return { success: false, error: retryRes.error.message };
      }
      return { success: true, error: null, data: retryRes.data };
    }
    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Error saving user to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save user to Supabase' };
  }
};

export const deleteUserFromSupabase = async (userId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error: err1 } = await supabase.from('users').delete().eq('id', userId);
    if (err1) console.warn('Supabase users delete notice:', err1.message);

    const { error: err2 } = await supabase.from('system_users').delete().eq('id', userId);
    if (err2 && !err1) console.warn('Supabase system_users delete notice:', err2.message);

    if (err1 && err2) {
      return { success: false, error: err1.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting user from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete user' };
  }
};

// ============================================================================
// 3. AGENCIES CRUD
// ============================================================================

export const DEFAULT_AGENCIES: Agency[] = [];
export const MOCK_AGENCIES: Agency[] = [];

export const generateNewAgencyCode = (cityName?: string): string => {
  const cityPrefix = (cityName || 'SUR').substring(0, 3).toUpperCase();
  const seqNum = Math.floor(100 + Math.random() * 900);
  return `AG-${cityPrefix}-${seqNum}`;
};

export const fetchAgenciesFromSupabaseTable = async (): Promise<{ agencies: Agency[]; error: string | null }> => {
  try {
    let { data, error } = await supabase.from('agencies').select('*');
    
    if (error) {
      console.warn("Querying 'agencies' returned error, attempting 'parties' table...", error.message);
      const partiesRes = await supabase.from('parties').select('*');
      if (!partiesRes.error && partiesRes.data) {
        data = partiesRes.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase Agencies Query Error:', error.message);
      return { agencies: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { agencies: [], error: null };
    }

    const formatted: Agency[] = data.map((row, idx) => {
      const name = row.agency_name || row.agency_Name || row.name || row.party_name || 'N/A';
      const code = row.agency_code || row.party_code || row.code || `AG-SUR-${(idx + 1).toString().padStart(3, '0')}`;
      const city = row.city || row.district || row.location || 'N/A';
      const area = row.area_name || row.area || row.locality || city;
      const pincode = row.pincode || row.pin_code || row.postal_code || row.zip_code || row.pin || '';
      const gstin = row.gstin || row.gst_number || row.gst || 'N/A';
      const group = row.account_group || row.group || row.segment || 'N/A';
      const contact = row.contact_person || row.contact || row.owner_name || 'N/A';
      const phone = row.mobile || row.phone || row.contact_phone || 'N/A';
      const email = row.email || 'N/A';
      const limit = row.credit_limit !== undefined && row.credit_limit !== null ? Number(row.credit_limit || 0) : 0;
      const resolvedZone = resolveZoneForAreaAndCity(area === 'N/A' ? '' : area, city === 'N/A' ? '' : city);

      return {
        id: String(row.id || `ag_${idx + 1}`),
        agency_code: code,
        agency_name: name,
        company_id: row.company_id || undefined,
        area_id: row.area_id || undefined,
        area_name: area,
        city: city,
        pincode: pincode,
        pin_code: pincode,
        gstin: gstin,
        gst_number: gstin,
        account_group: group,
        contact_person: contact,
        mobile: phone,
        email: email,
        credit_limit: limit,
        bank_name: row.bank_name || 'N/A',
        account_number: row.account_number || 'N/A',
        ifsc_code: row.ifsc_code || 'N/A',
        branch_name: row.branch_name || 'N/A',
        assigned_salesperson: row.assigned_salesperson || row.salesperson || 'N/A',
        zone_name: row.zone_name || row.zone || resolvedZone.zone_name || 'N/A',
        zone_region: row.zone_region || row.region || resolvedZone.region || 'N/A',
        active: row.active !== undefined ? Boolean(row.active) : true
      };
    });

    return { agencies: deduplicateAgencies(formatted), error: null };
  } catch (err: any) {
    console.error('Error fetching agencies from Supabase:', err?.message || err);
    return { agencies: [], error: err?.message || 'Failed to connect to Supabase database' };
  }
};

export const saveAgencyToSupabase = async (agency: Agency): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    const nowIso = new Date().toISOString();
    const agencyCity = agency.city || 'Surat';
    const agencyArea = agency.area_name || agencyCity;
    const agencyPincode = agency.pincode || agency.pin_code || null;

    let targetId = isValidUuid(agency.id) ? agency.id : null;

    // If ID is not a valid existing UUID, check if agency exists by code or name to update instead of creating conflict
    if (!targetId && (agency.agency_code || agency.agency_name)) {
      try {
        const { data: existing } = await supabase
          .from('agencies')
          .select('id')
          .or(`agency_code.eq."${agency.agency_code}",agency_name.eq."${agency.agency_name}"`)
          .limit(1);

        if (existing && existing.length > 0) {
          targetId = existing[0].id;
        } else {
          targetId = generateUuid();
        }
      } catch {
        targetId = generateUuid();
      }
    } else if (!targetId) {
      targetId = generateUuid();
    }

    const payload: Record<string, any> = {
      id: targetId,
      agency_code: agency.agency_code,
      agency_name: agency.agency_name,
      city: agencyCity,
      area_name: agencyArea,
      pincode: agencyPincode,
      gstin: agency.gstin || agency.gst_number || null,
      gst_number: agency.gstin || agency.gst_number || null,
      account_group: agency.account_group || 'FMCG',
      contact_person: (agency.contact_person && agency.contact_person !== 'N/A') ? agency.contact_person : null,
      phone: (agency.mobile && agency.mobile !== 'N/A') ? agency.mobile : null,
      mobile: (agency.mobile && agency.mobile !== 'N/A') ? agency.mobile : null,
      email: (agency.email && agency.email !== 'N/A') ? agency.email : null,
      credit_limit: agency.credit_limit || 0,
      bank_name: agency.bank_name || null,
      account_number: agency.account_number || null,
      ifsc_code: agency.ifsc_code || null,
      branch_name: agency.branch_name || null,
      zone_name: agency.zone_name || null,
      zone_region: agency.zone_region || null,
      assigned_salesperson: agency.assigned_salesperson || null,
      active: agency.active !== false,
      updated_at: nowIso
    };

    if (isValidUuid(agency.company_id)) {
      payload.company_id = agency.company_id;
    }

    if (isValidUuid(agency.area_id)) {
      payload.area_id = agency.area_id;
    }

    let { data, error } = await supabase.from('agencies').upsert([payload]).select();

    // If column pincode is missing in remote database, fallback to core payload without failing
    if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('pincode')))) {
      console.warn('agencies table missing pincode column in Supabase, retrying without it:', error.message);
      const fallbackPayload = { ...payload };
      delete fallbackPayload.pincode;
      const retryRes = await supabase.from('agencies').upsert([fallbackPayload]).select();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      // If error is duplicate name or unique constraint violation, update existing record matching agency_name
      if (error.message.includes('unique constraint') || error.code === '23505') {
        const updateRes = await supabase
          .from('agencies')
          .update(payload)
          .eq('agency_name', agency.agency_name)
          .select();
        if (!updateRes.error) {
          return { success: true, error: null, data: updateRes.data };
        }
      }
      console.error('Supabase saveAgency error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Error saving agency to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save agency' };
  }
};

export const deleteAgencyFromSupabase = async (agencyId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('agencies').delete().eq('id', agencyId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete agency' };
  }
};

export const registerNewAgency = (newAgencyData: {
  agency_name: string;
  agency_code?: string;
  company_id?: string;
  city: string;
  area_name?: string;
  pincode?: string;
  pin_code?: string;
  gstin?: string;
  account_group?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  credit_limit?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  assigned_salesperson?: string;
}): Agency => {
  const autoZone = resolveZoneForAreaAndCity(newAgencyData.area_name, newAgencyData.city);
  const agencyCode = newAgencyData.agency_code?.trim() || generateNewAgencyCode(newAgencyData.city);
  const pin = (newAgencyData.pincode || newAgencyData.pin_code || '').trim();

  const agencyRecord: Agency = {
    id: generateUuid(),
    company_id: newAgencyData.company_id || 'c01',
    agency_code: agencyCode,
    agency_name: newAgencyData.agency_name.trim(),
    city: newAgencyData.city.trim(),
    area_name: (newAgencyData.area_name || newAgencyData.city).trim(),
    pincode: pin,
    pin_code: pin,
    gstin: newAgencyData.gstin?.trim() || '',
    gst_number: newAgencyData.gstin?.trim() || '',
    account_group: newAgencyData.account_group || 'FMCG',
    contact_person: newAgencyData.contact_person?.trim() || '',
    mobile: newAgencyData.mobile?.trim() || '',
    credit_limit: newAgencyData.credit_limit !== undefined ? Number(newAgencyData.credit_limit) : 0,
    zone_id: autoZone.id,
    zone_name: autoZone.zone_name,
    zone_region: autoZone.region,
    bank_name: newAgencyData.bank_name?.trim() || 'HDFC Bank',
    account_number: newAgencyData.account_number?.trim() || '',
    ifsc_code: newAgencyData.ifsc_code?.trim() || '',
    branch_name: newAgencyData.branch_name?.trim() || '',
    assigned_salesperson: newAgencyData.assigned_salesperson?.trim() || 'Chirag Desai',
    active: true
  };

  saveAgencyToSupabase(agencyRecord);
  MOCK_AGENCIES.unshift(agencyRecord);
  return agencyRecord;
};

export const updateAgencyDetails = (
  agencyId: string,
  updatedFields: Partial<Agency>
): Agency => {
  const agency = MOCK_AGENCIES.find(a => a.id === agencyId);
  if (!agency) throw new Error('Agency party not found');

  if (updatedFields.agency_name !== undefined) agency.agency_name = updatedFields.agency_name.trim();
  if (updatedFields.agency_code !== undefined) agency.agency_code = updatedFields.agency_code.trim();
  if (updatedFields.company_id !== undefined) agency.company_id = updatedFields.company_id;
  if (updatedFields.account_group !== undefined) agency.account_group = updatedFields.account_group;
  if (updatedFields.gstin !== undefined) {
    agency.gstin = updatedFields.gstin.trim();
    agency.gst_number = updatedFields.gstin.trim();
  }
  if (updatedFields.contact_person !== undefined) agency.contact_person = updatedFields.contact_person.trim();
  if (updatedFields.mobile !== undefined) agency.mobile = updatedFields.mobile.trim();
  if (updatedFields.email !== undefined) agency.email = updatedFields.email.trim();
  if (updatedFields.city !== undefined) agency.city = updatedFields.city.trim();
  if (updatedFields.area_name !== undefined) agency.area_name = updatedFields.area_name.trim();

  if (updatedFields.city !== undefined || updatedFields.area_name !== undefined) {
    const autoZone = resolveZoneForAreaAndCity(agency.area_name, agency.city);
    agency.zone_id = autoZone.id;
    agency.zone_name = autoZone.zone_name;
    agency.zone_region = autoZone.region;
  }

  if (updatedFields.bank_name !== undefined) agency.bank_name = updatedFields.bank_name.trim();
  if (updatedFields.account_number !== undefined) agency.account_number = updatedFields.account_number.trim();
  if (updatedFields.ifsc_code !== undefined) agency.ifsc_code = updatedFields.ifsc_code.trim();
  if (updatedFields.branch_name !== undefined) agency.branch_name = updatedFields.branch_name.trim();
  if (updatedFields.assigned_salesperson !== undefined) agency.assigned_salesperson = updatedFields.assigned_salesperson.trim();
  if (updatedFields.credit_limit !== undefined) agency.credit_limit = Number(updatedFields.credit_limit);

  saveAgencyToSupabase(agency);
  return agency;
};

// ============================================================================
// 4. PRODUCTS CRUD
// ============================================================================

export const DEFAULT_PRODUCTS: Product[] = [];
export const MOCK_PRODUCTS: Product[] = [];

export const generateNewBarcodeSKUCode = (groupNameOrCompany?: string, productName?: string, customIndex?: number): string => {
  const codePrefix = getGroupCode(groupNameOrCompany || productName || 'AKAI');
  const num = customIndex !== undefined ? customIndex : (MOCK_PRODUCTS.length + 1);
  const nextNum = num.toString().padStart(3, '0');
  return `P-${codePrefix}-${nextNum}`;
};

export const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Supabase fetchProducts error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];
    return data.map((p: any, idx: number) => {
      const pcsPerBox = Number(p.pcs_per_box || 1);
      const rawMrp = p.mrp_price !== undefined && p.mrp_price !== null ? p.mrp_price : (p.mrp !== undefined && p.mrp !== null ? p.mrp : null);
      const rawUnit = p.unit_price !== undefined && p.unit_price !== null ? p.unit_price : (p.price !== undefined && p.price !== null ? p.price : null);

      const mrp = rawMrp !== null ? Number(rawMrp) : (rawUnit !== null ? Number(rawUnit) : 100);
      const unit = rawUnit !== null ? Number(rawUnit) : (rawMrp !== null ? Number(rawMrp) : 80);

      const compName = p.Product_Company_Name || p.company_name || '';

      return {
        id: p.id || `p_${idx + 1}`,
        product_code: p.product_code || p.code || `PRD_${idx + 1}`,
        product_name: p.product_name || p.name || 'Product SKU',
        company_id: p.company_id || 'c1',
        company_name: compName,
        Product_Company_Name: compName,
        pcs_per_box: pcsPerBox,
        mrp_price: mrp,
        unit_price: unit,
        category: p['Product Category'] || p.category || 'General',
        segment: p.Product_Company_Segment || p.segment || 'FMCG',
        active: p.active !== false
      };
    });
  } catch (err: any) {
    console.error('Error fetching products from Supabase:', err?.message || err);
    return [];
  }
};

export const saveProductToSupabase = async (product: any): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    const prodCode = product.product_code || product.code || `SKU-${Date.now()}`;
    const prodName = product.product_name || product.name || 'New Product SKU';
    
    const existingIdx = MOCK_PRODUCTS.findIndex(p => p.id === product.id || p.product_code === prodCode);
    if (existingIdx >= 0) {
      MOCK_PRODUCTS[existingIdx] = { ...MOCK_PRODUCTS[existingIdx], ...product, product_code: prodCode, product_name: prodName };
    } else {
      MOCK_PRODUCTS.unshift({
        id: product.id || `prod_${Date.now()}`,
        company_id: product.company_id || 'c01',
        product_code: prodCode,
        product_name: prodName,
        pcs_per_box: Number(product.pcs_per_box) || 24,
        mrp_price: Number(product.mrp_price) || 150,
        unit_price: Number(product.unit_price || product.mrp_price) || 120,
        category: product.category || 'General',
        segment: product.segment || 'FMCG',
        active: product.active !== false
      });
    }

    const pcsPerBox = Number(product.pcs_per_box) || 1;
    const stockBoxQty = Number(product.stock_box_qty) || 0;
    const mrpPrice = Number(product.mrp_price) || 0;
    const unitPrice = Number(product.unit_price || product.mrp_price) || 0;

    let targetId = isValidUuid(product.id) ? product.id : null;

    // Check if product exists by product_code to prevent duplicate key constraint violations
    if (!targetId && prodCode) {
      try {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('product_code', prodCode)
          .limit(1);
        if (existing && existing.length > 0) {
          targetId = existing[0].id;
        } else {
          targetId = generateUuid();
        }
      } catch {
        targetId = generateUuid();
      }
    } else if (!targetId) {
      targetId = generateUuid();
    }

    // Auto-resolve company details and segment ID
    let resolvedCompanyId: string | null = isValidUuid(product.company_id) ? product.company_id : null;
    let compName: string | null = product.Product_Company_Name || null;
    let compCode: string | null = product.Product_Company_Code || null;
    let compSegment: string = (product.Product_Company_Segment || product.segment || 'FMCG').toUpperCase().trim();

    try {
      let compQuery = supabase.from('companies').select('id, company_code, company_name, segment');
      if (resolvedCompanyId) {
        compQuery = compQuery.eq('id', resolvedCompanyId);
      } else if (product.company_name || product.brand || product.company_id) {
        const brandTerm = product.company_name || product.brand || product.company_id;
        compQuery = compQuery.or(`company_name.ilike."%${brandTerm}%",company_code.ilike."${brandTerm}"`);
      }
      const { data: compData } = await compQuery.limit(1);
      if (compData && compData.length > 0) {
        const found = compData[0];
        resolvedCompanyId = found.id;
        compName = found.company_name;
        compCode = found.company_code;
        if (found.segment) compSegment = found.segment.toUpperCase().trim();
      }
    } catch (e) {
      console.warn('Could not auto-lookup company details for product:', e);
    }

    // Auto-resolve item_type_id (Segment ID) if UUID
    let itemTypeId: string | null = (product.item_type_id && isValidUuid(product.item_type_id)) ? product.item_type_id : null;

    const rawCategory = (product.category || product['Product Category'] || 'General').trim();
    let finalCategory = rawCategory;

    // Auto-map with item_categories table or auto-create new category
    try {
      if (rawCategory) {
        const { data: existingCat } = await supabase
          .from('item_categories')
          .select('id, category_name')
          .ilike('category_name', rawCategory)
          .limit(1);

        if (existingCat && existingCat.length > 0) {
          finalCategory = existingCat[0].category_name;
        } else {
          // Auto-create new category in item_categories master
          const newCatCode = rawCategory.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'CAT';
          await supabase.from('item_categories').insert([{
            id: generateUuid(),
            category_code: newCatCode,
            category_name: rawCategory,
            segment: compSegment,
            active: true
          }]);
        }
      }
    } catch (e) {
      console.warn('item_categories auto-map notice:', e);
    }

    const payload: Record<string, any> = {
      id: targetId,
      product_code: prodCode,
      product_name: prodName,
      company_id: resolvedCompanyId,
      Product_Company_Name: compName,
      Product_Company_Code: compCode,
      Product_Company_Segment: compSegment,
      'Product Category': finalCategory,
      pcs_per_box: pcsPerBox,
      mrp_price: mrpPrice,
      unit_price: unitPrice,
      active: product.active !== false,
      updated_at: new Date().toISOString()
    };

    if (itemTypeId) {
      payload.item_type_id = itemTypeId;
    }

    const { data, error } = await supabase.from('products').upsert([payload]).select();
    if (error) {
      // If unique constraint on product_code, update by product_code
      if (error.message.includes('unique constraint') || error.code === '23505') {
        const updateRes = await supabase
          .from('products')
          .update(payload)
          .eq('product_code', prodCode)
          .select();
        if (!updateRes.error) {
          return { success: true, error: null, data: updateRes.data };
        }
      }
      console.error('Supabase save product error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Error saving product to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save product to Supabase' };
  }
};

export const deleteProductFromSupabase = async (productId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.error('Supabase deleteProduct error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting product from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete product' };
  }
};

export const fetchItemCategoriesFromSupabase = async (): Promise<{ id: string; category_code?: string; category_name: string; segment?: string }[]> => {
  try {
    const { data, error } = await supabase.from('item_categories').select('*').order('category_name');
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
};

export const updateProductStockAndDetails = (
  productId: string, 
  updated: {
    product_name?: string;
    product_code?: string;
    pcs_per_box?: number;
    unit_price?: number;
    mrp_price?: number;
    category?: string;
    segment?: string;
    updated_by?: string;
    reason?: string;
  }
): Product => {
  const prod = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!prod) throw new Error('Product not found');

  if (updated.product_name !== undefined) prod.product_name = updated.product_name;
  if (updated.product_code !== undefined) prod.product_code = updated.product_code;
  if (updated.pcs_per_box !== undefined) prod.pcs_per_box = Number(updated.pcs_per_box);
  if (updated.category !== undefined) prod.category = updated.category;
  if (updated.segment !== undefined) prod.segment = updated.segment as any;
  if (updated.unit_price !== undefined) prod.unit_price = Number(updated.unit_price);
  if (updated.mrp_price !== undefined) prod.mrp_price = Number(updated.mrp_price);

  saveProductToSupabase(prod);
  return prod;
};

export const registerNewProduct = (newProd: {
  company_id: string;
  product_code: string;
  product_name: string;
  pcs_per_box: number;
  mrp_price: number;
  category?: string;
  segment?: string;
  unit_price?: number;
}): Product => {
  const pcsPerBox = Number(newProd.pcs_per_box || 24);

  const productRecord: Product = {
    id: generateUuid(),
    company_id: newProd.company_id,
    product_code: newProd.product_code,
    product_name: newProd.product_name,
    pcs_per_box: pcsPerBox,
    mrp_price: Number(newProd.mrp_price),
    category: newProd.category || 'General',
    segment: (newProd.segment as any) || 'FMCG',
    unit_price: newProd.unit_price ? Number(newProd.unit_price) : Number(newProd.mrp_price),
    active: true
  };

  saveProductToSupabase(productRecord);
  MOCK_PRODUCTS.unshift(productRecord);
  return productRecord;
};

// ============================================================================
// 5. SEGMENTS CRUD
// ============================================================================

export interface Segment {
  id: string;
  segment_code: string;
  segment_name: string;
  description?: string;
  active?: boolean;
}

export const fetchSegmentsFromSupabase = async (): Promise<{ segments: Segment[]; error: string | null }> => {
  const staticSegments: Segment[] = [
    {
      id: 'seg_fmcg_001',
      segment_code: 'FMCG',
      segment_name: 'Fast Moving Consumer Goods',
      description: 'Biscuits, Beverages, Snacks, Daily Consumables',
      active: true
    },
    {
      id: 'seg_fmcd_001',
      segment_code: 'FMCD',
      segment_name: 'Fast Moving Consumer Durables',
      description: 'Home Appliances, Electronics, White Goods',
      active: true
    }
  ];
  return { segments: staticSegments, error: null };
};

export const saveSegmentToSupabase = async (segment: Partial<Segment>): Promise<{ success: boolean; error: string | null; data?: any }> => {
  return { success: true, error: null };
};

export const deleteSegmentFromSupabase = async (segmentId: string): Promise<{ success: boolean; error: string | null }> => {
  return { success: true, error: null };
};

// ============================================================================
// 6. ORDERS & ORDER ITEMS CRUD
// ============================================================================

export const MOCK_HOLD_REASONS: HoldReason[] = DEFAULT_HOLD_REASONS;

export const fetchHoldReasonsFromSupabase = async (): Promise<HoldReason[]> => {
  try {
    const { data, error } = await supabase.from('hold_reasons').select('*').order('reason_code');
    if (error || !data || data.length === 0) {
      return DEFAULT_HOLD_REASONS;
    }
    return data.map((r: any, idx: number) => ({
      id: r.id || `hr_${idx + 1}`,
      reason_code: r.reason_code || `HR-${idx + 1}`,
      reason_description: r.reason_description || r.description || 'Standard Operational Hold',
      category: r.category || 'OPERATIONAL',
      action_rule: r.action_rule || 'Requires Super Admin / Commercial Review',
      sla_hours: r.sla_hours || 24,
      active: r.active !== false,
      created_at: r.created_at || new Date().toISOString()
    }));
  } catch (err) {
    return DEFAULT_HOLD_REASONS;
  }
};

export const saveHoldReasonToSupabase = async (reason: HoldReason): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('hold_reasons').upsert([{
      reason_code: reason.reason_code,
      reason_description: reason.reason_description,
      category: reason.category || 'OPERATIONAL',
      action_rule: reason.action_rule || '',
      sla_hours: reason.sla_hours || 24,
      active: reason.active !== false
    }]);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save hold reason' };
  }
};

export const INITIAL_ORDERS: Order[] = [];

export const fetchOrdersFromSupabase = async (): Promise<{ orders: Order[]; error: string | null }> => {
  try {
    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchOrders error:', error.message);
      return { orders: [], error: error.message };
    }

    if (!rawOrders || rawOrders.length === 0) {
      return { orders: [], error: null };
    }

    // Fetch related master records in parallel for enrichment
    const [
      { data: companiesData },
      { data: agenciesData },
      { data: usersData },
      { data: productsData },
      { data: itemsData }
    ] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('agencies').select('*'),
      supabase.from('users').select('*'),
      supabase.from('products').select('*'),
      supabase.from('order_items').select('*')
    ]);

    const compMap = new Map<string, any>((companiesData || []).map((c: any) => [c.id, c]));
    const agencyMap = new Map<string, any>((agenciesData || []).map((a: any) => [a.id, a]));
    const userMap = new Map<string, any>((usersData || []).map((u: any) => [u.id, u]));
    const prodMap = new Map<string, any>((productsData || []).map((p: any) => [p.id, p]));

    const itemsMap: Record<string, OrderItem[]> = {};
    (itemsData || []).forEach((row: any) => {
      const ordId = row.order_id;
      if (!itemsMap[ordId]) itemsMap[ordId] = [];
      const prod = prodMap.get(row.product_id);
      itemsMap[ordId].push({
        id: row.id,
        order_id: row.order_id,
        product_id: row.product_id,
        product_name: prod?.product_name || 'Product Item',
        product_code: prod?.product_code || 'SKU',
        pcs_per_box: Number(row.pcs_per_box || prod?.pcs_per_box || 1),
        box_qty: Number(row.box_qty || 0),
        loose_pcs: Number(row.loose_pcs || 0),
        free_pcs: 0,
        total_qty_pcs: Number(row.total_qty_pcs || 0),
        unit_price: Number(row.unit_price || prod?.unit_price || 0),
        mrp_price: Number(prod?.mrp_price || prod?.unit_price || row.unit_price || 0),
        total_price: Number(row.total_price || 0),
        dispatched_qty_pcs: Number(row.dispatched_qty_pcs || 0),
        issued_qty_pcs: Number(row.issued_qty_pcs || 0),
        pending_qty_pcs: Number(row.pending_qty_pcs || 0),
        remark: ''
      });
    });

    const formattedOrders: Order[] = rawOrders.map((o: any) => {
      const comp = compMap.get(o.company_id);
      const ag = agencyMap.get(o.agency_id);
      const usr = userMap.get(o.salesperson_id);
      const latestDispatchDetails = [...(o.order_history || [])]
        .reverse()
        .find((entry: any) => entry.action === 'DISPATCH_TRANSPORT_ASSIGNED')?.details || {};
      const hasReattemptHistory = 
        (o.order_history || []).some((entry: any) => entry.action === 'REATTEMPT_DELIVERY') ||
        (o.remarks || '').includes('<!--REATTEMPT:true-->') ||
        (o.remarks || '').toLowerCase().includes('reattempt');
      const latestGrnEntry = [...(o.order_history || [])].reverse().find((entry: any) =>
        ['GRN_REQUESTED_BY_ADMIN', 'GRN_FORWARDED_TO_BILLING', 'GRN_CREATED', 'ORDER_COMPLETED_AFTER_GRN'].includes(entry.action)
      );
      const latestPodQuery = [...(o.order_history || [])].reverse().find((entry: any) => entry.action === 'POD_QUERY_RAISED');

      return {
        id: o.id,
        order_number: o.order_number,
        order_date: o.order_date || o.created_at,
        company_id: o.company_id || 'c01',
        company_name: comp?.company_name || 'Proline Foods',
        agency_id: o.agency_id || 'ag_001',
        agency_name: ag?.agency_name || 'Agency Party',
        agency_code: ag?.agency_code || 'AG-001',
        area_id: o.area_id || ag?.area_id || 'ar_01',
        area_name: ag?.area_name || ag?.city || 'Surat Area',
        zone_name: ag?.zone_name || (o as any).zone_name || undefined,
        zone_region: ag?.zone_region || (o as any).zone_region || undefined,
        salesperson_id: o.salesperson_id || 'u12',
        salesperson_name: usr?.full_name || 'Sales Representative',
        asm_id: o.asm_id || undefined,
        status: o.status || 'DRAFT',
        total_box_qty: Number(o.total_box_qty || 0),
        total_loose_pcs: Number(o.total_loose_pcs || 0),
        total_qty_pcs: Number(o.total_qty_pcs || 0),
        total_amount: Number(o.total_amount || 0),
        invoice_number: o.invoice_number || undefined,
        invoice_date: o.invoice_date || undefined,
        invoice_amount: o.invoice_amount == null ? undefined : Number(o.invoice_amount),
        billing_total_qty: (() => {
          if (o.billing_total_qty != null && Number(o.billing_total_qty) > 0) {
            return Number(o.billing_total_qty);
          }
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed.billing_total_qty != null && Number(parsed.billing_total_qty) > 0) {
                return Number(parsed.billing_total_qty);
              }
            } catch {}
          }
          const itemsIssuedSum = (itemsMap[o.id] || []).reduce((sum, item) => sum + Number(item.issued_qty_pcs || 0), 0);
          if (itemsIssuedSum > 0) return itemsIssuedSum;
          const itemsTotalSum = (itemsMap[o.id] || []).reduce((sum, item) => sum + Number(item.total_qty_pcs || 0), 0);
          if (itemsTotalSum > 0) return itemsTotalSum;
          return Number(o.total_qty_pcs || 0);
        })(),
        credit_days: o.credit_days == null ? undefined : Number(o.credit_days),
        vehicle_number: o.vehicle_number || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).vehicle_number; } catch {} }
          return undefined;
        })() || latestDispatchDetails.vehicle_number || undefined,
        is_company_vehicle: o.is_company_vehicle == null ? (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).is_company_vehicle; } catch {} }
          return latestDispatchDetails.is_company_vehicle;
        })() : Boolean(o.is_company_vehicle),
        driver_name: o.driver_name || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).driver_name; } catch {} }
          return undefined;
        })() || latestDispatchDetails.driver_name || undefined,
        driver_mobile: o.driver_mobile || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).driver_mobile; } catch {} }
          return undefined;
        })() || latestDispatchDetails.driver_mobile || undefined,
        tempo_number: o.tempo_number || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).tempo_number; } catch {} }
          return undefined;
        })() || latestDispatchDetails.tempo_number || undefined,
        booking_id: o.booking_id || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).booking_id; } catch {} }
          return undefined;
        })() || latestDispatchDetails.booking_id || undefined,
        rental_agency_name: o.rental_agency_name || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).rental_agency_name; } catch {} }
          return undefined;
        })() || latestDispatchDetails.rental_agency_name || undefined,
        freight_amount: o.freight_amount == null ? (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).freight_amount; } catch {} }
          return latestDispatchDetails.freight_amount;
        })() : Number(o.freight_amount),
        dispatch_remark: o.dispatch_remark || (() => {
          const match = (o.remarks || '').match(/<!--DISPATCH:(.*?)-->/);
          if (match && match[1]) { try { return JSON.parse(match[1]).dispatch_remark; } catch {} }
          return undefined;
        })() || latestDispatchDetails.dispatch_remark || undefined,
        reattempt_delivery: Boolean(hasReattemptHistory && o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'POD_ISSUE_RAISED'),
        grn_workflow_status: latestGrnEntry?.action === 'GRN_REQUESTED_BY_ADMIN'
          ? 'PENDING_SALES_ADMIN'
          : latestGrnEntry?.action === 'GRN_FORWARDED_TO_BILLING'
            ? 'PENDING_BILLING'
            : latestGrnEntry?.action === 'GRN_CREATED'
              ? 'PENDING_SALES_ADMIN_COMPLETION'
              : latestGrnEntry?.action === 'ORDER_COMPLETED_AFTER_GRN' ? 'COMPLETED' : undefined,
        grn_number: o.grn_number || latestGrnEntry?.details?.grn_number || undefined,
        grn_date: o.grn_date || latestGrnEntry?.details?.grn_date || undefined,
        grn_value: o.grn_value == null ? latestGrnEntry?.details?.grn_value : Number(o.grn_value),
        grn_remark: o.grn_remark || latestGrnEntry?.details?.grn_remark || undefined,
        pod_status: o.pod_status || (o.status === 'POD_ISSUE_RAISED' ? 'ISSUE_RAISED' : undefined),
        pod_issue_type: o.pod_issue_type || latestPodQuery?.details?.issue_type,
        pod_issue_details: o.pod_issue_details || latestPodQuery?.details?.message,
        pod_query_raised_by: o.pod_query_raised_by || latestPodQuery?.details?.raised_by,
        pod_query_raised_at: o.pod_query_raised_at || latestPodQuery?.details?.raised_at,
        remarks: (o.remarks || '').replace(/<!--DISPATCH:.*?-->/, '').trim(),
        delivery_type: 'F.O.R',
        items: itemsMap[o.id] || itemsMap[o.order_number] || [],
        sales_admin_approved: o.sales_admin_approved ?? (o.status === 'SALES_ADMIN_APPROVED' || o.status === 'APPROVED'),
        sales_admin_approved_by: o.sales_admin_approved_by,
        sales_admin_approved_at: o.sales_admin_approved_at,
        sales_admin_remarks: o.sales_admin_remarks,
        superadmin_approved: o.superadmin_approved ?? (o.status === 'APPROVED'),
        superadmin_approved_by: o.superadmin_approved_by,
        superadmin_approved_at: o.superadmin_approved_at,
        superadmin_remarks: o.superadmin_remarks,
        need_accounts_approval: o.need_accounts_approval ?? false,
        accounts_approval_status: o.accounts_approval_status || (o.need_accounts_approval ? 'PENDING' : 'NOT_REQUIRED'),
        accounts_approval_message: o.accounts_approval_message,
        accounts_approval_requested_by: o.accounts_approval_requested_by,
        accounts_approval_requested_at: o.accounts_approval_requested_at,
        accounts_approval_responded_by: o.accounts_approval_responded_by,
        accounts_approval_responded_at: o.accounts_approval_responded_at,
        accounts_approval_response_remark: o.accounts_approval_response_remark,
        order_history: o.order_history || []
      };
    });

    return { orders: formattedOrders, error: null };
  } catch (err: any) {
    console.error('Error fetching orders from Supabase:', err?.message || err);
    return { orders: [], error: err?.message || 'Failed to fetch orders from Supabase' };
  }
};

export const saveOrderToSupabase = async (order: Order): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    const orderId = (order.id && isValidUuid(order.id)) ? order.id : generateUuid();
    const nowIso = new Date().toISOString();

    const orderPayload: Record<string, any> = {
      id: orderId,
      order_number: order.order_number,
      order_date: order.order_date || nowIso,
      status: order.status || 'DRAFT',
      total_box_qty: Number(order.total_box_qty || 0),
      total_loose_pcs: Number(order.total_loose_pcs || 0),
      total_qty_pcs: Number(order.total_qty_pcs || 0),
      total_amount: Number(order.total_amount || 0),
      remarks: order.remarks || null,
      need_accounts_approval: order.need_accounts_approval ?? false,
      accounts_approval_status: order.accounts_approval_status || (order.need_accounts_approval ? 'PENDING' : 'NOT_REQUIRED'),
      accounts_approval_message: order.accounts_approval_message || null,
      accounts_approval_requested_by: order.accounts_approval_requested_by || null,
      accounts_approval_requested_at: order.accounts_approval_requested_at || null,
      accounts_approval_responded_by: order.accounts_approval_responded_by || null,
      accounts_approval_responded_at: order.accounts_approval_responded_at || null,
      accounts_approval_response_remark: order.accounts_approval_response_remark || null,
      updated_at: nowIso
    };

    if (isValidUuid(order.company_id)) orderPayload.company_id = order.company_id;
    if (isValidUuid(order.agency_id)) orderPayload.agency_id = order.agency_id;
    if (isValidUuid(order.area_id)) orderPayload.area_id = order.area_id;
    if (isValidUuid(order.salesperson_id)) orderPayload.salesperson_id = order.salesperson_id;
    if (isValidUuid(order.asm_id)) orderPayload.asm_id = order.asm_id;

    const { data: savedOrder, error: orderError } = await supabase.from('orders').upsert([orderPayload]).select();
    if (orderError) {
      console.error('Supabase saveOrder error:', orderError.message);
      return { success: false, error: orderError.message };
    }

    // Save Order Items
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map(item => {
        const itemId = (item.id && isValidUuid(item.id)) ? item.id : generateUuid();
        const payloadItem: Record<string, any> = {
          id: itemId,
          order_id: orderId,
          pcs_per_box: Number(item.pcs_per_box || 1),
          box_qty: Number(item.box_qty || 0),
          loose_pcs: Number(item.loose_pcs || 0),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          dispatched_qty_pcs: Number(item.dispatched_qty_pcs || 0),
          issued_qty_pcs: Number(item.issued_qty_pcs || 0),
          pending_qty_pcs: Number(item.pending_qty_pcs || 0)
        };
        if (isValidUuid(item.product_id)) payloadItem.product_id = item.product_id;
        return payloadItem;
      });

      const { error: itemsErr } = await supabase.from('order_items').upsert(itemsPayload);
      if (itemsErr) {
        console.warn('Supabase saveOrder items notice:', itemsErr.message);
      }
    }

    return { success: true, error: null, data: savedOrder };
  } catch (err: any) {
    console.error('Error saving order to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save order to Supabase' };
  }
};

export const updateOrderStatusInSupabase = async (orderId: string, status: string, remarks?: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const payload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    };
    if (remarks !== undefined) payload.remarks = remarks;

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) {
      console.error('Supabase updateOrderStatus error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error updating order status in Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to update order status' };
  }
};

export const updateOrderAccountsApprovalInSupabase = async (
  orderId: string,
  accountsData: Partial<Order>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (accountsData.status !== undefined) payload.status = accountsData.status;
    if (accountsData.sales_admin_approved !== undefined) payload.sales_admin_approved = accountsData.sales_admin_approved;
    if (accountsData.sales_admin_approved_by !== undefined) payload.sales_admin_approved_by = accountsData.sales_admin_approved_by;
    if (accountsData.sales_admin_approved_at !== undefined) payload.sales_admin_approved_at = accountsData.sales_admin_approved_at;
    if (accountsData.sales_admin_remarks !== undefined) payload.sales_admin_remarks = accountsData.sales_admin_remarks;
    if (accountsData.superadmin_approved !== undefined) payload.superadmin_approved = accountsData.superadmin_approved;
    if (accountsData.superadmin_approved_by !== undefined) payload.superadmin_approved_by = accountsData.superadmin_approved_by;
    if (accountsData.superadmin_approved_at !== undefined) payload.superadmin_approved_at = accountsData.superadmin_approved_at;
    if (accountsData.superadmin_remarks !== undefined) payload.superadmin_remarks = accountsData.superadmin_remarks;
    if (accountsData.need_accounts_approval !== undefined) payload.need_accounts_approval = accountsData.need_accounts_approval;
    if (accountsData.accounts_approval_status !== undefined) payload.accounts_approval_status = accountsData.accounts_approval_status;
    if (accountsData.accounts_approval_message !== undefined) payload.accounts_approval_message = accountsData.accounts_approval_message;
    if (accountsData.accounts_approval_requested_by !== undefined) payload.accounts_approval_requested_by = accountsData.accounts_approval_requested_by;
    if (accountsData.accounts_approval_requested_at !== undefined) payload.accounts_approval_requested_at = accountsData.accounts_approval_requested_at;
    if (accountsData.accounts_approval_responded_by !== undefined) payload.accounts_approval_responded_by = accountsData.accounts_approval_responded_by;
    if (accountsData.accounts_approval_responded_at !== undefined) payload.accounts_approval_responded_at = accountsData.accounts_approval_responded_at;
    if (accountsData.accounts_approval_response_remark !== undefined) payload.accounts_approval_response_remark = accountsData.accounts_approval_response_remark;
    if (accountsData.inventory_status !== undefined) payload.inventory_status = accountsData.inventory_status;
    if (accountsData.priority !== undefined) payload.priority = accountsData.priority;
    if (accountsData.invoice_number !== undefined) payload.invoice_number = accountsData.invoice_number;
    if (accountsData.invoice_date !== undefined) payload.invoice_date = accountsData.invoice_date;
    if (accountsData.invoice_amount !== undefined) payload.invoice_amount = accountsData.invoice_amount;
    if (accountsData.credit_days !== undefined) payload.credit_days = accountsData.credit_days;
    if (accountsData.billing_total_qty !== undefined) payload.billing_total_qty = accountsData.billing_total_qty;

    // Collect dispatch metadata if provided so it survives on the order
    const dispatchMeta: Record<string, any> = {};
    if (accountsData.vehicle_number) dispatchMeta.vehicle_number = accountsData.vehicle_number;
    if (accountsData.is_company_vehicle !== undefined) dispatchMeta.is_company_vehicle = accountsData.is_company_vehicle;
    if (accountsData.driver_name) dispatchMeta.driver_name = accountsData.driver_name;
    if (accountsData.driver_mobile) dispatchMeta.driver_mobile = accountsData.driver_mobile;
    if (accountsData.tempo_number) dispatchMeta.tempo_number = accountsData.tempo_number;
    if (accountsData.booking_id) dispatchMeta.booking_id = accountsData.booking_id;
    if (accountsData.rental_agency_name) dispatchMeta.rental_agency_name = accountsData.rental_agency_name;
    if (accountsData.freight_amount !== undefined) dispatchMeta.freight_amount = accountsData.freight_amount;
    if (accountsData.dispatch_remark) dispatchMeta.dispatch_remark = accountsData.dispatch_remark;
    if (accountsData.billing_total_qty !== undefined) dispatchMeta.billing_total_qty = accountsData.billing_total_qty;

    if (Object.keys(dispatchMeta).length > 0 || accountsData.remarks !== undefined) {
      const cleanRemarks = ((accountsData.remarks !== undefined ? accountsData.remarks : '') || '').replace(/<!--DISPATCH:.*?-->/, '').trim();
      payload.remarks = Object.keys(dispatchMeta).length > 0
        ? `<!--DISPATCH:${JSON.stringify(dispatchMeta)}-->${cleanRemarks}`
        : cleanRemarks;
    }

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) {
      console.error('Supabase updateOrderAccountsApproval error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error updating accounts approval in Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to update accounts approval' };
  }
};

export const deleteOrderFromSupabase = async (orderId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Delete order items first
    await supabase.from('order_items').delete().eq('order_id', orderId);

    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      console.error('Supabase deleteOrder error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting order from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete order' };
  }
};

/**
 * Clear All Operational Data (Orders & Order Items) from Supabase.
 * Master Data (Agencies, Products, Companies, Users, Zones, Area Types, Hold Reasons) is STRICTLY PRESERVED.
 */
export const clearAllOperationalDataFromSupabase = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    // 1. Delete all order items first to avoid foreign key / relation locks
    const { error: itemsErr } = await supabase
      .from('order_items')
      .delete()
      .not('id', 'is', null);

    if (itemsErr) {
      console.warn('Warning clearing order_items:', itemsErr.message);
      await supabase.from('order_items').delete().neq('id', '');
    }

    // 2. Delete all orders
    const { error: ordersErr } = await supabase
      .from('orders')
      .delete()
      .not('id', 'is', null);

    if (ordersErr) {
      console.warn('Warning clearing orders:', ordersErr.message);
      const { error: fallbackErr } = await supabase.from('orders').delete().neq('id', '');
      if (fallbackErr) {
        console.error('Supabase clearAllOperationalData error:', fallbackErr.message);
        return { success: false, error: fallbackErr.message };
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error clearing operational data in Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to clear operational data' };
  }
};

export const fetchOrderItemsFromSupabase = async (orderId: string): Promise<{ items: OrderItem[]; error: string | null }> => {
  try {
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (error) {
      console.error('Supabase fetchOrderItems error:', error.message);
      return { items: [], error: error.message };
    }
    return { items: data || [], error: null };
  } catch (err: any) {
    console.error('Error fetching order items from Supabase:', err?.message || err);
    return { items: [], error: err?.message || 'Failed to fetch order items' };
  }
};

export const saveOrderItemToSupabase = async (item: OrderItem): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    const itemId = (item.id && isValidUuid(item.id)) ? item.id : generateUuid();
    const payload: Record<string, any> = {
      id: itemId,
      order_id: item.order_id,
      product_name: item.product_name || null,
      product_code: item.product_code || null,
      pcs_per_box: Number(item.pcs_per_box || 1),
      box_qty: Number(item.box_qty || 0),
      loose_pcs: Number(item.loose_pcs || 0),
      free_pcs: Number(item.free_pcs || 0),
      unit_price: Number(item.unit_price || 0),
      mrp_price: Number(item.mrp_price || 0),
      total_price: Number(item.total_price || 0),
      dispatched_qty_pcs: Number(item.dispatched_qty_pcs || 0),
      issued_qty_pcs: Number(item.issued_qty_pcs || 0),
      pending_qty_pcs: Number(item.pending_qty_pcs || 0),
      remark: item.remark || null,
      updated_at: new Date().toISOString()
    };
    if (isValidUuid(item.product_id)) payload.product_id = item.product_id;

    const { data, error } = await supabase.from('order_items').upsert([payload]).select();
    if (error) {
      console.error('Supabase saveOrderItem error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Error saving order item to Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save order item' };
  }
};

export const deleteOrderItemFromSupabase = async (itemId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('order_items').delete().eq('id', itemId);
    if (error) {
      console.error('Supabase deleteOrderItem error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting order item from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete order item' };
  }
};

export const fetchAreaTypesFromSupabase = async (): Promise<AreaTypeMaster[]> => {
  try {
    const { data, error } = await supabase.from('area_types').select('*').order('type_code');
    if (error || !data || data.length === 0) {
      return DEFAULT_AREA_TYPES;
    }
    return data.map((d: any) => ({
      id: d.id,
      type_code: d.type_code,
      type_name: d.type_name,
      description: d.description || '',
      delivery_sla: d.delivery_sla || 'Standard Delivery',
      default_vehicle_mode: d.default_vehicle_mode || 'F.O.R (Vehicle)',
      associated_zones: d.type_code === 'CITY' 
        ? ['City-A', 'City-B', 'City-C', 'City-D', 'City-E'] 
        : ['Upper South', 'South', 'East', 'North'],
      localities_count: d.type_code === 'CITY' ? 47 : 28,
      agency_count: d.type_code === 'CITY' ? 14 : 8,
      active: d.active !== false
    }));
  } catch {
    return DEFAULT_AREA_TYPES;
  }
};

export const saveAreaTypeToSupabase = async (areaType: AreaTypeMaster): Promise<{ success: boolean; error: string | null }> => {
  try {
    const payload = {
      type_code: areaType.type_code,
      type_name: areaType.type_name,
      description: areaType.description,
      delivery_sla: areaType.delivery_sla,
      default_vehicle_mode: areaType.default_vehicle_mode,
      active: areaType.active,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('area_types').upsert([payload], { onConflict: 'type_code' });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save area type' };
  }
};
