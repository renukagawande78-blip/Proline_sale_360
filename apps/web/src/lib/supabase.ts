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
  getGroupCode 
} from '../types';

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
  if (!userCompanyHandle) return true;
  
  let allowedBrands: string[] = [];
  if (Array.isArray(userCompanyHandle)) {
    allowedBrands = userCompanyHandle.map(b => String(b).trim().toLowerCase());
  } else if (typeof userCompanyHandle === 'string') {
    const raw = userCompanyHandle.trim();
    if (raw === 'All' || raw === '*' || raw.toLowerCase() === 'all') return true;
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          allowedBrands = parsed.map(b => String(b).trim().toLowerCase());
        }
      } catch {
        allowedBrands = raw.replace(/[\[\]"']/g, '').split(',').map(b => b.trim().toLowerCase());
      }
    } else {
      allowedBrands = raw.split(',').map(b => b.trim().toLowerCase());
    }
  }

  if (allowedBrands.length === 0 || allowedBrands.includes('all') || allowedBrands.includes('*')) {
    return true;
  }

  const targetName = (companyNameOrCode || '').toLowerCase().trim();
  const targetCode = (companyCode || '').toLowerCase().trim();
  
  return allowedBrands.some(allowed => {
    if (!allowed) return false;
    return (
      targetName.includes(allowed) || 
      allowed.includes(targetName) ||
      (targetCode && (targetCode === allowed || allowed.includes(targetCode))) ||
      (allowed.includes('priyagold') && targetName.includes('pringod')) ||
      (allowed.includes('pringod') && targetName.includes('priyagold'))
    );
  });
};

export const checkIsSuperAdmin = (user: any): boolean => {
  if (!user) return true;
  const role = (user?.role_name || '').toUpperCase();
  const name = (user?.full_name || '').toLowerCase();
  const email = (user?.email || '').toLowerCase();
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role.includes('ADMIN') ||
    name.includes('chirag') ||
    name.includes('harshad') ||
    email.includes('admin') ||
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
  user: { id?: string; full_name?: string; role_name?: string; company_handle?: string } | null,
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
  const isSuperAdmin = role === 'SUPER_ADMIN' || 
                       user.company_handle === 'All' || 
                       (user.full_name || '').toLowerCase().includes('chirag') || 
                       (user.full_name || '').toLowerCase().includes('harshad');

  // 1. Super Admin sees ALL Sales Orders
  if (isSuperAdmin) {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Super Admin / Master Corporate Scope'
    };
  }

  // 2. Sales Admin with All Brands scope sees ALL Sales Orders
  if (role === 'SALES_ADMIN' && (user.company_handle === 'All' || !user.company_handle)) {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Sales Admin Master Scope'
    };
  }

  // 3. Check if order was booked by this salesperson / user
  const isBookedByUser = (user.id && order.salesperson_id === user.id) ||
                         (user.full_name && order.salesperson_name && (
                           order.salesperson_name.toLowerCase().includes(user.full_name.toLowerCase()) ||
                           user.full_name.toLowerCase().includes(order.salesperson_name.toLowerCase())
                         ));

  if (isBookedByUser) {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Booked Sales Representative'
    };
  }

  // 4. Related Sales Admin / Brand Manager: check direct brand ownership
  const isDirectOwner = isCompanyAllowedForUser(order.company_name, user.company_handle);
  if (isDirectOwner) {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Related Sales Admin / Brand Manager'
    };
  }

  // 5. Check if any line items belong to user's assigned brand
  const cPool = (companiesPool && companiesPool.length > 0) ? companiesPool : MOCK_COMPANIES;
  const pPool = (productsPool && productsPool.length > 0) ? productsPool : MOCK_PRODUCTS;

  const hasMatchingItemBrand = (order.items || []).some(item => {
    const prod = pPool.find((p: any) => p.id === item.product_id || p.product_name === item.product_name);
    const itemCompany = cPool.find((c: any) => c.id === prod?.company_id);
    const brandName = itemCompany?.company_name || prod?.product_name || '';
    return isCompanyAllowedForUser(brandName, user.company_handle, itemCompany?.company_code);
  });

  if (hasMatchingItemBrand) {
    return {
      canView: true,
      canExecuteActions: role === 'SALES_ADMIN' || role === 'AREA_SALES_MANAGER',
      isDirectBrandOwner: false,
      isItemBrandOwner: true,
      accessReason: 'Order contains items from assigned brand'
    };
  }

  // 6. Billing / Dispatch / Accounts Roles
  if (role === 'BILLING' || role === 'ACCOUNTS' || role === 'DISPATCH_MANAGER') {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Operations / Logistics Department Scope'
    };
  }

  return {
    canView: false,
    canExecuteActions: false,
    isDirectBrandOwner: false,
    isItemBrandOwner: false,
    accessReason: 'No brand mapping'
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

export const MOCK_ZONES: ZoneMaster[] = [];

const DEFAULT_ZONE: ZoneMaster = {
  id: 'zn_00',
  zone_code: 'ZN-GEN',
  zone_name: 'South',
  region: 'South Gujarat Rural Zone',
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
    return deduplicateZones(fetchedList);
  } catch (err: any) {
    console.error('Error fetching zones from Supabase areas table:', err?.message || err);
    return [];
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

export const DEFAULT_AREAS: AreaMaster[] = [
  { id: 'ar_01', area_code: 'AR-SUR-001', area_name: 'Ring Road Textile Market', city: 'Surat', zone_code: 'ZN-SUR-A', region: 'Surat City Zone', description: 'Major B2B Textile & Wholesale Trade Hub' },
  { id: 'ar_02', area_code: 'AR-SUR-002', area_name: 'Adajan & Honey Park Road', city: 'Surat', zone_code: 'ZN-SUR-A', region: 'Surat City Zone', description: 'High-Density Residential & FMCG Retail Belt' },
  { id: 'ar_03', area_code: 'AR-SUR-003', area_name: 'Varachha Main Road', city: 'Surat', zone_code: 'ZN-SUR-A', region: 'Surat City Zone', description: 'Diamond Bourse & Commercial Wholesale Hub' },
  { id: 'ar_04', area_code: 'AR-SUR-004', area_name: 'Udhna Industry Area & GIDC', city: 'Surat', zone_code: 'ZN-SUR-B', region: 'Surat City Zone', description: 'Industrial & Manufacturing Distribution Center' },
  { id: 'ar_05', area_code: 'AR-SUR-005', area_name: 'Katargam GIDC', city: 'Surat', zone_code: 'ZN-SUR-B', region: 'Surat City Zone', description: 'Commercial Diamond & FMCG Retail Network' },
  { id: 'ar_06', area_code: 'AR-SUR-006', area_name: 'Athwa Lines & Ghoddod Road', city: 'Surat', zone_code: 'ZN-SUR-C', region: 'Surat City Zone', description: 'Premium FMCG & FMCD Retail Showroom Corridor' },
  { id: 'ar_07', area_code: 'AR-SUR-007', area_name: 'Piplod & VIP Road', city: 'Surat', zone_code: 'ZN-SUR-C', region: 'Surat City Zone', description: 'Modern Retail Malls & FMCD Electronics Hub' },
  { id: 'ar_08', area_code: 'AR-SUR-008', area_name: 'Vesu University Road', city: 'Surat', zone_code: 'ZN-SUR-C', region: 'Surat City Zone', description: 'New Residential & Modern Trade Retail Market' }
];

export const deduplicateAreas = (rawAreas: AreaMaster[]): AreaMaster[] => {
  const map: Record<string, AreaMaster> = {};
  rawAreas.forEach(a => {
    const key = (a.id || a.area_code || a.area_name || '').toLowerCase().trim();
    if (!map[key]) {
      map[key] = {
        ...a,
        area_name: (a.area_name || '').trim(),
        city: (a.city || 'Surat').trim(),
        area_code: (a.area_code || `AR-${(a.city || 'SUR').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`).toUpperCase()
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
      return [];
    }
    if (!data || data.length === 0) return [];
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
    return deduplicateAreas(formatted);
  } catch (err: any) {
    console.error('Error fetching areas from Supabase:', err?.message || err);
    return [];
  }
};

export const saveAreaToSupabase = async (area: AreaMaster): Promise<{ success: boolean; error: string | null }> => {
  try {
    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      area_code: area.area_code,
      area_name: area.area_name,
      area: area.area_name,
      city: area.city || 'Surat',
      location: area.city || 'Surat',
      zone_code: area.zone_code || 'ZN-SUR-A',
      region: area.region || 'Surat City Zone',
      description: area.description || '',
      created_at: area.created_at || nowIso,
      updated_at: nowIso
    };

    if (isValidUuid(area.id)) {
      payload.id = area.id;
    } else {
      payload.id = generateUuid();
    }

    const { error } = await supabase.from('areas').upsert([payload]);
    if (error) {
      console.warn('Supabase saveArea error:', error.message);
      delete payload.id;
      const retryRes = await supabase.from('areas').insert([payload]);
      if (retryRes.error) {
        return { success: false, error: retryRes.error.message };
      }
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
  const areaNorm = (areaName || '').toLowerCase().trim();
  const cityNorm = (cityName || '').toLowerCase().trim();
  const combined = `${areaNorm} ${cityNorm}`;

  for (const zone of MOCK_ZONES) {
    for (const area of zone.major_areas) {
      const target = area.toLowerCase().trim();
      if (!target) continue;

      if (
        combined.includes(target) ||
        (target === 'udhana' && combined.includes('udhna')) ||
        (target === 'godadara' && combined.includes('godadra')) ||
        (target === 'umergoan' && combined.includes('umbergaon')) ||
        (target === 'olpad' && combined.includes('oldpad')) ||
        (target === 'kosmba' && combined.includes('kosamba'))
      ) {
        return zone;
      }
    }
  }

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
      brand_color: c.brand_color || '#38bdf8'
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

    const companyRecord: Company = {
      id: companyId,
      company_code: companyCode,
      company_name: companyName,
      handle: companyCode,
      segment: companySeg as any
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
      updated_at: nowIso
    };

    if (isValidUuid(agency.company_id)) {
      payload.company_id = agency.company_id;
    }

    if (isValidUuid(agency.area_id)) {
      payload.area_id = agency.area_id;
    }

    const { data, error } = await supabase.from('agencies').upsert([payload]).select();
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
    return { success: false, error: err?.message || 'Failed to save agency to Supabase' };
  }
};

export const deleteAgencyFromSupabase = async (agencyId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('agencies').delete().eq('id', agencyId);
    if (error) {
      console.error('Supabase deleteAgency error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting agency from Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete agency' };
  }
};

export const registerNewAgency = (newAgencyData: {
  agency_name: string;
  agency_code?: string;
  company_id?: string;
  city: string;
  area_name?: string;
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

  const agencyRecord: Agency = {
    id: generateUuid(),
    company_id: newAgencyData.company_id || 'c01',
    agency_code: agencyCode,
    agency_name: newAgencyData.agency_name.trim(),
    city: newAgencyData.city.trim(),
    area_name: (newAgencyData.area_name || newAgencyData.city).trim(),
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
      const mrp = Number(p.mrp_price || p.mrp || p.unit_price || 100);
      const unit = Number(p.unit_price || p.price || p.mrp_price || 80);

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

export const MOCK_HOLD_REASONS: HoldReason[] = [];
export const INITIAL_ORDERS: Order[] = [];

export const fetchOrdersFromSupabase = async (): Promise<{ orders: Order[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchOrders error:', error.message);
      return { orders: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { orders: [], error: null };
    }

    // Fetch associated items for orders
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) {
      console.warn('Supabase fetch order_items notice:', itemsError.message);
    }

    const itemsMap: Record<string, OrderItem[]> = {};
    (itemsData || []).forEach((row: any) => {
      const ordId = row.order_id;
      if (!itemsMap[ordId]) itemsMap[ordId] = [];
      itemsMap[ordId].push({
        id: row.id,
        order_id: row.order_id,
        product_id: row.product_id,
        product_name: row.product_name || 'Product Item',
        product_code: row.product_code || 'SKU',
        pcs_per_box: Number(row.pcs_per_box || 1),
        box_qty: Number(row.box_qty || 0),
        loose_pcs: Number(row.loose_pcs || 0),
        free_pcs: Number(row.free_pcs || 0),
        total_qty_pcs: Number(row.total_qty_pcs || 0),
        unit_price: Number(row.unit_price || 0),
        mrp_price: Number(row.mrp_price || 0),
        total_price: Number(row.total_price || 0),
        dispatched_qty_pcs: Number(row.dispatched_qty_pcs || 0),
        pending_qty_pcs: Number(row.pending_qty_pcs || 0),
        remark: row.remark || ''
      });
    });

    const formattedOrders: Order[] = data.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      order_date: o.order_date || o.created_at,
      company_id: o.company_id || 'c01',
      company_name: o.company_name || 'Priyagold Foods',
      agency_id: o.agency_id || 'ag_001',
      agency_name: o.agency_name || 'Agency Party',
      agency_code: o.agency_code || 'AG-001',
      area_id: o.area_id || 'ar_01',
      area_name: o.area_name || 'Central Area',
      salesperson_id: o.salesperson_id || 'u12',
      salesperson_name: o.salesperson_name || 'Amit Kumar',
      asm_id: o.asm_id || undefined,
      status: o.status || 'DRAFT',
      total_box_qty: Number(o.total_box_qty || 0),
      total_loose_pcs: Number(o.total_loose_pcs || 0),
      total_qty_pcs: Number(o.total_qty_pcs || 0),
      total_amount: Number(o.total_amount || 0),
      remarks: o.remarks || '',
      delivery_type: o.delivery_type || 'F.O.R',
      items: itemsMap[o.id] || itemsMap[o.order_number] || []
    }));

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
      company_name: order.company_name || null,
      agency_name: order.agency_name || null,
      agency_code: order.agency_code || null,
      area_name: order.area_name || null,
      salesperson_name: order.salesperson_name || null,
      status: order.status || 'DRAFT',
      total_box_qty: Number(order.total_box_qty || 0),
      total_loose_pcs: Number(order.total_loose_pcs || 0),
      total_qty_pcs: Number(order.total_qty_pcs || 0),
      total_amount: Number(order.total_amount || 0),
      remarks: order.remarks || null,
      delivery_type: order.delivery_type || 'F.O.R',
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
      // Retry insert without UUIDs
      delete orderPayload.id;
      delete orderPayload.company_id;
      delete orderPayload.agency_id;
      delete orderPayload.area_id;
      delete orderPayload.salesperson_id;
      delete orderPayload.asm_id;
      const retryRes = await supabase.from('orders').insert([orderPayload]).select();
      if (retryRes.error) {
        console.error('Supabase saveOrder retry error:', retryRes.error.message);
        return { success: false, error: retryRes.error.message };
      }
    }

    // Save Order Items
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map(item => {
        const itemId = (item.id && isValidUuid(item.id)) ? item.id : generateUuid();
        const payloadItem: Record<string, any> = {
          id: itemId,
          order_id: orderId,
          product_name: item.product_name || null,
          product_code: item.product_code || null,
          pcs_per_box: Number(item.pcs_per_box || 1),
          box_qty: Number(item.box_qty || 0),
          loose_pcs: Number(item.loose_pcs || 0),
          free_pcs: Number(item.free_pcs || 0),
          total_qty_pcs: Number(item.total_qty_pcs || 0),
          unit_price: Number(item.unit_price || 0),
          mrp_price: Number(item.mrp_price || 0),
          total_price: Number(item.total_price || 0),
          dispatched_qty_pcs: Number(item.dispatched_qty_pcs || 0),
          pending_qty_pcs: Number(item.pending_qty_pcs || 0),
          remark: item.remark || null,
          updated_at: nowIso
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
