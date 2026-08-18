import { createClient } from '@supabase/supabase-js';
import { Company, Agency, Product, Order, HoldReason, AgencyFinancials, ZoneMaster, AreaMaster, getGroupCode } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

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

export const isCompanyAllowedForUser = (companyNameOrCode?: string, userCompanyHandle?: string, companyCode?: string): boolean => {
  if (!userCompanyHandle || userCompanyHandle === 'All') return true;
  const allowedBrands = userCompanyHandle.split(',').map(b => b.trim().toLowerCase());
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
  if (!user) return true; // Default fallback to allow in dev/testing session
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
  user: { role_name?: string; company_handle?: string } | null
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

  // Super Admin / Chirag Sir / All Scope -> Full Master Access
  if (user.role_name === 'SUPER_ADMIN' || user.company_handle === 'All') {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Super Admin / All Brands Master Scope'
    };
  }

  // Direct Parent Company / Brand Match
  const isDirectOwner = isCompanyAllowedForUser(order.company_name, user.company_handle);
  if (isDirectOwner) {
    return {
      canView: true,
      canExecuteActions: true,
      isDirectBrandOwner: true,
      isItemBrandOwner: true,
      accessReason: 'Direct Brand Manager'
    };
  }

  // Cross-Brand Product Item Match (Items in order belong to user's assigned brand scope)
  const hasMatchingItemBrand = (order.items || []).some(item => {
    const prod = MOCK_PRODUCTS.find(p => p.id === item.product_id || p.product_name === item.product_name);
    const itemCompany = MOCK_COMPANIES.find(c => c.id === prod?.company_id);
    const brandName = itemCompany?.company_name || prod?.product_name || '';
    return isCompanyAllowedForUser(brandName, user.company_handle);
  });

  if (hasMatchingItemBrand) {
    return {
      canView: true,
      canExecuteActions: false, // READ ONLY VIEW! No operations allowed!
      isDirectBrandOwner: false,
      isItemBrandOwner: true,
      accessReason: 'Read-Only View: Order contains items from your assigned brand, but parent order belongs to another brand manager.'
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

// Master Brand Companies
export const MOCK_COMPANIES: Company[] = [];

export const resolveSegmentForUser = (user?: { company_handle?: string; role_name?: string } | null): 'ALL' | 'FMCG' | 'FMCD' => {
  if (!user) return 'ALL';
  if (user.role_name === 'SUPER_ADMIN' || user.company_handle === 'All' || !user.company_handle) {
    return 'ALL';
  }

  const allowedBrands = user.company_handle.split(',').map(b => b.trim().toLowerCase());
  const mappedCompanies = MOCK_COMPANIES.filter(c => 
    allowedBrands.some(brand => c.company_name.toLowerCase().includes(brand) || brand.includes(c.company_name.toLowerCase()))
  );

  if (mappedCompanies.length === 0) return 'ALL';

  const segments = Array.from(new Set(mappedCompanies.map(c => c.segment).filter(Boolean)));
  if (segments.length === 1) {
    return segments[0] as 'FMCG' | 'FMCD';
  }
  return 'ALL';
};

export const MOCK_ZONES: ZoneMaster[] = [
  {
    id: 'zn_01',
    zone_code: 'ZN-SUR-01',
    zone_name: 'City-A',
    region: 'Surat City Zone',
    major_areas: ['Varachha', 'Katargam', 'Sarthana', 'Puna Gam', 'Kapodra', 'Laskana'],
    description: 'Surat East Diamond & Textile Industrial Hub'
  },
  {
    id: 'zn_02',
    zone_code: 'ZN-SUR-02',
    zone_name: 'City-B',
    region: 'Surat City Zone',
    major_areas: ['Ring Road', 'Salabatpura', 'Begumpura', 'Shahpore', 'Nanpura', 'Chawk Bazar'],
    description: 'Central Wholesale Textile & Commercial Market'
  },
  {
    id: 'zn_03',
    zone_code: 'ZN-SUR-03',
    zone_name: 'City-C',
    region: 'Surat City Zone',
    major_areas: ['Adajan', 'Rander', 'Palanpur Jakatnaka', 'Honey Park', 'Gorat'],
    description: 'Surat West Residential & Premium Retail Corridor'
  },
  {
    id: 'zn_04',
    zone_code: 'ZN-SUR-04',
    zone_name: 'City-D',
    region: 'Surat City Zone',
    major_areas: ['Ghod Dod Road', 'City Light', 'Vesu', 'Piplod', 'Bhatar', 'Althan'],
    description: 'Surat South Premium Retail & Supermarket Hub'
  },
  {
    id: 'zn_05',
    zone_code: 'ZN-SUR-05',
    zone_name: 'City-E',
    region: 'Surat City Zone',
    major_areas: ['Udhna', 'Pandesara', 'Dindoli', 'Bhestan', 'Godadara', 'Sachin'],
    description: 'Industrial Belt & Retail Distribution Zone'
  },
  {
    id: 'zn_06',
    zone_code: 'ZN-SGU-01',
    zone_name: 'Upper South',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Navsari', 'Gandevi', 'Bilimora', 'Chikhli', 'Jalalpore'],
    description: 'Navsari District Agricultural & Semi-Urban Distribution'
  },
  {
    id: 'zn_07',
    zone_code: 'ZN-SGU-02',
    zone_name: 'South',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Valsad', 'Vapi', 'Pardi', 'Umbergaon', 'Dharampur', 'Sanjan'],
    description: 'Valsad & Vapi GIDC Industrial & Frontier Territory'
  },
  {
    id: 'zn_08',
    zone_code: 'ZN-SGU-03',
    zone_name: 'East',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Vyara', 'Songadh', 'Mandvi', 'Bardoli', 'Valod', 'Mahuva'],
    description: 'Tapi & Rural Surat Highway Distribution Channel'
  },
  {
    id: 'zn_09',
    zone_code: 'ZN-SGU-04',
    zone_name: 'North',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Ankleshwar', 'Bharuch', 'Kosamba', 'Kim', 'Olpad', 'Zaghadia'],
    description: 'Bharuch & Ankleshwar Chemical Belt Distribution'
  }
];

const DEFAULT_ZONE: ZoneMaster = {
  id: 'zn_00',
  zone_code: 'ZN-GEN',
  zone_name: 'South',
  region: 'South Gujarat Rural Zone',
  major_areas: [],
  description: 'Default Zone'
};

/**
 * Deduplicate Zone Master list and locality areas within zones.
 */
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

    // Deduplicate major_areas within zone case-insensitively
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

/**
 * Deduplicate Products list.
 */
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
    
    // Deduplication Key: Priority to GSTIN or Agency Name + GSTIN
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

/**
 * Deduplicate Users list.
 */
export const deduplicateUsers = (users: any[]): any[] => {
  const seen = new Set<string>();
  return (users || []).filter(u => {
    const key = (u.id || u.email || u.full_name || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Fetch zones and major coverage areas directly from Supabase `areas` & `zones` tables with strict deduplication.
 */
export const fetchZonesFromSupabaseAreasTable = async (): Promise<ZoneMaster[]> => {
  try {
    // 1. Query live 'areas' table from Supabase
    const { data: areasData, error: areasError } = await supabase
      .from('areas')
      .select('*');

    // 2. Query live 'zones' table from Supabase
    const { data: zonesData } = await supabase
      .from('zones')
      .select('*');

    const zoneMap: Record<string, ZoneMaster> = {};

    // Process zones table entries first if available
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

    // Process areas table entries from live DB
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
    const rawList = fetchedList.length > 0 ? fetchedList : MOCK_ZONES;

    return deduplicateZones(rawList);
  } catch (err) {
    console.error('Error fetching zones from Supabase areas table:', err);
    return deduplicateZones(MOCK_ZONES);
  }
};

export const saveZoneToSupabase = async (zone: ZoneMaster) => {
  try {
    const payload = {
      id: zone.id,
      zone_code: zone.zone_code,
      zone_name: zone.zone_name,
      region: zone.region,
      major_areas: zone.major_areas,
      description: zone.description
    };
    await supabase.from('zones').upsert(payload);
  } catch (err) {
    console.error('Error saving zone to Supabase:', err);
  }
};

export const deleteZoneFromSupabase = async (zoneId: string) => {
  try {
    await supabase.from('zones').delete().eq('id', zoneId);
  } catch (err) {
    console.error('Error deleting zone from Supabase:', err);
  }
};

export const addAreaTagToSupabaseZone = async (zone: ZoneMaster, newAreaName: string) => {
  try {
    const updatedAreas = Array.from(new Set([...zone.major_areas, newAreaName]));
    await supabase.from('zones').update({ major_areas: updatedAreas }).eq('id', zone.id);
    await supabase.from('areas').upsert({
      area_name: newAreaName,
      zone_id: zone.id,
      zone_name: zone.zone_name,
      region: zone.region,
      zone_code: zone.zone_code
    });
  } catch (err) {
    console.error('Error adding area to Supabase:', err);
  }
};

export const removeAreaTagFromSupabaseZone = async (zone: ZoneMaster, areaNameToRemove: string) => {
  try {
    const updatedAreas = zone.major_areas.filter(a => a !== areaNameToRemove);
    await supabase.from('zones').update({ major_areas: updatedAreas }).eq('id', zone.id);
    await supabase.from('areas').delete().eq('zone_id', zone.id).eq('area_name', areaNameToRemove);
  } catch (err) {
    console.error('Error removing area from Supabase:', err);
  }
};

export const DEFAULT_AREAS: AreaMaster[] = [];

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
    if (error || !data || data.length === 0) {
      return deduplicateAreas(DEFAULT_AREAS);
    }
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
  } catch (err) {
    console.error('Error fetching areas from Supabase:', err);
    return deduplicateAreas(DEFAULT_AREAS);
  }
};

export const saveAreaToSupabase = async (area: AreaMaster): Promise<{ success: boolean; error: string | null }> => {
  try {
    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      area_code: area.area_code,
      area_name: area.area_name,
      city: area.city,
      zone_code: area.zone_code,
      region: area.region,
      description: area.description,
      created_at: area.created_at || nowIso,
      updated_at: nowIso
    };

    if (isValidUuid(area.id)) {
      payload.id = area.id;
    } else {
      payload.id = generateUuid();
    }

    const { error } = await supabase.from('areas').upsert(payload);
    if (error) {
      console.error('Supabase saveArea error:', error);
      delete payload.id;
      const retryRes = await supabase.from('areas').insert(payload);
      if (retryRes.error) {
        return { success: false, error: retryRes.error.message };
      }
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error saving area to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save area to Supabase' };
  }
};

export const deleteAreaFromSupabase = async (areaId: string) => {
  try {
    await supabase.from('areas').delete().eq('id', areaId);
  } catch (err) {
    console.error('Error deleting area from Supabase:', err);
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


export const DEFAULT_AGENCIES: Agency[] = [];

export const MOCK_AGENCIES: Agency[] = [];

export const fetchAgenciesFromSupabaseTable = async (): Promise<{ agencies: Agency[]; error: string | null }> => {
  try {
    // 1. Query 'agencies' table without assuming created_at column exists
    let { data, error } = await supabase.from('agencies').select('*');
    
    // 2. If 'agencies' table query returns an error, fallback to 'parties' table
    if (error) {
      console.warn("Querying 'agencies' returned error, attempting 'parties' table...", error);
      const partiesRes = await supabase.from('parties').select('*');
      if (!partiesRes.error && partiesRes.data) {
        data = partiesRes.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase Agencies Query Error:', error);
      return { agencies: [], error: `${error.message} (Code: ${error.code || 'UNKNOWN'})` };
    }

    if (!data || data.length === 0) {
      return { agencies: [], error: null };
    }

    const formatted: Agency[] = data.map((row, idx) => {
      // Case-insensitive flexible field resolution
      const name = row.agency_name || row.agency_Name || row.Agency_Name || row.AGENCY_NAME || 
                   row.party_name || row.Party_Name || row.PARTY_NAME || 
                   row.name || row.Name || row.NAME || 
                   row.agency || row.Agency || row.title || row.Title || 'N/A';

      const code = row.agency_code || row.party_code || row.code || row.Code || `AG-SUR-${(idx + 1).toString().padStart(3, '0')}`;
      
      const city = row.city || row.City || row.district || row.District || row.location || row.Location || 'N/A';
      const area = row.area_name || row.area || row.Area || row.locality || row.Locality || city;
      
      const gstin = row.gstin || row.GSTIN || row.gst_number || row.GST_NUMBER || row.gst || row.GST || row.gst_no || 'N/A';
      const group = row.account_group || row.group || row.Group || row.segment || row.Segment || 'N/A';
      const contact = row.contact_person || row.contact || row.Contact || row.owner_name || row.person || 'N/A';
      const phone = row.mobile || row.phone || row.Phone || row.contact_phone || row.mobile_no || row.Mobile || 'N/A';
      const email = row.email || row.Email || 'N/A';
      const limit = row.credit_limit !== undefined && row.credit_limit !== null ? Number(row.credit_limit || row.credit || row.limit || 0) : 0;

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
    console.error('Error fetching agencies from Supabase:', err);
    return { agencies: [], error: err?.message || 'Failed to connect to Supabase database' };
  }
};

export const saveAgencyToSupabase = async (agency: Agency): Promise<{ success: boolean; error: string | null }> => {
  try {
    const nowIso = new Date().toISOString();

    const payload: Record<string, any> = {
      agency_code: agency.agency_code,
      agency_name: agency.agency_name,
      city: agency.city || 'Surat',
      area_name: agency.area_name || agency.city || 'Surat',
      gstin: agency.gstin || agency.gst_number || null,
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
      created_at: (agency as any).created_at || nowIso,
      updated_at: nowIso
    };

    // Include UUID fields only if valid to prevent PostgreSQL uuid type errors
    if (isValidUuid(agency.id)) {
      payload.id = agency.id;
    } else {
      payload.id = generateUuid();
    }

    if (isValidUuid(agency.company_id)) {
      payload.company_id = agency.company_id;
    }

    if (isValidUuid(agency.area_id)) {
      payload.area_id = agency.area_id;
    }

    let currentPayload = { ...payload };

    for (let attempt = 0; attempt < 12; attempt++) {
      let { data, error } = await supabase.from('agencies').upsert([currentPayload]).select();

      if (!error && data && data.length > 0) {
        return { success: true, error: null };
      }

      if (error) {
        console.warn(`Supabase save attempt ${attempt + 1} error:`, error.message);
        if (error.message && error.message.includes('Could not find the') && error.message.includes('column')) {
          const match = error.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const missingCol = match[1];
            console.warn(`Self-healing: Stripping missing column '${missingCol}' from payload and retrying...`);
            delete currentPayload[missingCol];
            continue; // Retry next attempt with stripped payload!
          }
        }

        // Fallback: If upsert failed due to ID constraint, strip ID and retry insert
        if (currentPayload.id) {
          delete currentPayload.id;
          const retryRes = await supabase.from('agencies').insert([currentPayload]).select();
          if (!retryRes.error && retryRes.data && retryRes.data.length > 0) {
            return { success: true, error: null };
          }
          if (retryRes.error && retryRes.error.message.includes('Could not find the')) {
            const match2 = retryRes.error.message.match(/Could not find the '([^']+)' column/);
            if (match2 && match2[1]) {
              delete currentPayload[match2[1]];
              continue;
            }
          }
        }

        if (error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('violates row-level')) {
          return {
            success: false,
            error: 'Row-Level Security (RLS) Permission Denied! Supabase is blocking INSERTs on table "agencies". Please run the SQL command to grant INSERT access.'
          };
        }

        return { success: false, error: error.message };
      }

      // If data is empty without error, try plain insert
      const insertRes = await supabase.from('agencies').insert([currentPayload]).select();
      if (!insertRes.error && insertRes.data && insertRes.data.length > 0) {
        return { success: true, error: null };
      }
      if (insertRes.error) {
        if (insertRes.error.message && insertRes.error.message.includes('Could not find the')) {
          const match3 = insertRes.error.message.match(/Could not find the '([^']+)' column/);
          if (match3 && match3[1]) {
            delete currentPayload[match3[1]];
            continue;
          }
        }
        return { success: false, error: insertRes.error.message };
      }

      break;
    }

    return { 
      success: false, 
      error: 'Supabase RLS Policy is blocking inserts. Please run the SQL command to grant public INSERT access on the agencies table.' 
    };
  } catch (err: any) {
    console.error('Error saving agency to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save agency to Supabase' };
  }
};

export const deleteAgencyFromSupabase = async (agencyId: string) => {
  try {
    await supabase.from('agencies').delete().eq('id', agencyId);
  } catch (err) {
    console.error('Error deleting agency from Supabase:', err);
  }
};

export const deleteProductFromSupabase = async (productId: string) => {
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (err) {
    console.error('Error deleting product from Supabase:', err);
  }
};

export const saveProductToSupabase = async (product: any): Promise<{ success: boolean; error: string | null }> => {
  try {
    const payload = {
      product_code: product.product_code,
      product_name: product.product_name,
      company_id: isValidUuid(product.company_id) ? product.company_id : null,
      pcs_per_box: product.pcs_per_box || 1,
      mrp_price: product.mrp_price || 0,
      unit_price: product.unit_price || 0,
      category: product.category || 'General',
      account_group: product.account_group || 'FMCG',
      segment: product.segment || 'FMCG',
      stock_box_qty: product.stock_box_qty || 0,
      stock_loose_pcs: product.stock_loose_pcs || 0,
      total_stock_pcs: product.total_stock_pcs || 0,
      updated_at: new Date().toISOString()
    };
    if (isValidUuid(product.id)) {
      (payload as any).id = product.id;
    }
    const { error } = await supabase.from('products').upsert([payload]);
    if (error) {
      console.warn('Supabase save product error:', error.message);
      delete (payload as any).id;
      const retry = await supabase.from('products').insert([payload]);
      if (retry.error) return { success: false, error: retry.error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error saving product to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save product' };
  }
};

export const deleteCompanyFromSupabase = async (companyId: string) => {
  try {
    await supabase.from('companies').delete().eq('id', companyId);
  } catch (err) {
    console.error('Error deleting company from Supabase:', err);
  }
};

export const saveCompanyToSupabase = async (company: any): Promise<{ success: boolean; error: string | null }> => {
  try {
    const companyId = (company.id && isValidUuid(company.id)) ? company.id : generateUuid();
    
    const basePayload: Record<string, any> = {
      id: companyId,
      company_name: company.company_name || company.name || 'Brand Company',
      name: company.company_name || company.name || 'Brand Company',
      company_code: company.company_code || company.code || company.handle || 'BRAND',
      code: company.company_code || company.code || company.handle || 'BRAND',
      handle: company.handle || company.company_code || company.code || 'BRAND',
      segment: company.segment || 'FMCG',
      industry_segment: company.segment || 'FMCG',
      assigned_segment: company.segment || 'FMCG',
      brand_color: company.brand_color || '#38bdf8',
      updated_at: new Date().toISOString()
    };

    let lastError: string | null = null;
    let currentPayload = { ...basePayload };

    for (let attempt = 0; attempt < 12; attempt++) {
      const { data, error } = await supabase.from('companies').upsert([currentPayload]).select();
      
      if (!error) {
        return { success: true, error: null };
      }

      console.warn(`Supabase companies save attempt ${attempt + 1} notice:`, error.message);
      lastError = error.message;

      // Self-healing: RLS Policy error
      if (error.message && (error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('violates row-level'))) {
        return {
          success: false,
          error: 'Row-Level Security (RLS) Permission Denied on "companies" table. Disable RLS or create an Insert Policy in Supabase.'
        };
      }

      // Self-healing: missing column error
      if (error.message && error.message.includes("Could not find the '") && error.message.includes("' column")) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          const missingCol = match[1];
          delete currentPayload[missingCol];
          continue;
        }
      }

      // Self-healing: invalid UUID syntax error for non-UUID text ID
      if (error.message && error.message.toLowerCase().includes('invalid input syntax for type uuid')) {
        delete currentPayload.id;
        continue;
      }

      // Retry plain insert without ID
      if (currentPayload.id) {
        delete currentPayload.id;
        const retryRes = await supabase.from('companies').insert([currentPayload]).select();
        if (!retryRes.error) {
          return { success: true, error: null };
        }
        if (retryRes.error) {
          if (retryRes.error.message.includes("Could not find the '")) {
            const match2 = retryRes.error.message.match(/Could not find the '([^']+)' column/);
            if (match2 && match2[1]) {
              delete currentPayload[match2[1]];
              continue;
            }
          }
        }
      }

      break;
    }

    return { success: false, error: lastError || 'Failed to save company to Supabase database' };
  } catch (err: any) {
    console.error('Error saving company to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save company to Supabase database' };
  }
};

export const fetchCompaniesFromSupabase = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.from('companies').select('*');
    if (error || !data || data.length === 0) {
      return [];
    }
    return data.map((c: any, idx: number) => ({
      id: c.id || `c_${idx + 1}`,
      company_code: c.company_code || c.code || c.handle || `COMP_${idx + 1}`,
      company_name: c.company_name || c.name || 'Brand Company',
      handle: c.handle || c.code || c.company_code || 'COMP',
      segment: c.segment || 'FMCG',
      brand_color: c.brand_color || '#38bdf8'
    }));
  } catch (err) {
    console.warn('Error fetching companies from Supabase:', err);
    return [];
  }
};

export const fetchAgenciesFromSupabase = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.from('agencies').select('*');
    if (error || !data || data.length === 0) return [];
    return data.map((a: any, idx: number) => ({
      id: a.id || `a_${idx + 1}`,
      agency_code: a.agency_code || a.code || `AG_${idx + 1}`,
      agency_name: a.agency_name || a.name || 'Agency Party',
      contact_person: a.contact_person || a.owner || '',
      phone: a.phone || a.mobile || '',
      city: a.city || a.location || 'Mumbai',
      area_id: a.area_id || 'ar_01',
      area_name: a.area_name || a.area || 'Central Area',
      assigned_salesperson: a.assigned_salesperson || a.salesperson || 'Field Exec',
      credit_limit: a.credit_limit || 100000,
      current_balance: a.current_balance || 0,
      status: a.status || 'APPROVED'
    }));
  } catch (err) {
    console.warn('Error fetching agencies from Supabase:', err);
    return [];
  }
};

export const fetchProductsFromSupabase = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data || data.length === 0) return [];
    return data.map((p: any, idx: number) => ({
      id: p.id || `p_${idx + 1}`,
      product_code: p.product_code || p.code || `PRD_${idx + 1}`,
      product_name: p.product_name || p.name || 'Product SKU',
      company_id: p.company_id || 'c1',
      pcs_per_box: p.pcs_per_box || 24,
      mrp_price: p.mrp_price || p.mrp || 120,
      unit_price: p.unit_price || p.price || 100,
      category: p.category || 'General',
      account_group: p.account_group || 'FMCG',
      segment: p.segment || 'FMCG',
      stock_box_qty: p.stock_box_qty || 100,
      stock_loose_pcs: p.stock_loose_pcs || 0,
      total_stock_pcs: p.total_stock_pcs || 2400
    }));
  } catch (err) {
    console.warn('Error fetching products from Supabase:', err);
    return [];
  }
};

export const deleteUserFromSupabase = async (userId: string) => {
  try {
    const res1 = await supabase.from('users').delete().eq('id', userId);
    if (res1.error) console.warn('Supabase users delete notice:', res1.error.message);
    const res2 = await supabase.from('system_users').delete().eq('id', userId);
    if (res2.error) console.warn('Supabase system_users delete notice:', res2.error.message);
  } catch (err) {
    console.error('Error deleting user from Supabase:', err);
  }
};

export const saveUserToSupabase = async (user: any): Promise<{ success: boolean; error: string | null }> => {
  try {
    const userId = (user.id && isValidUuid(user.id)) ? user.id : generateUuid();
    
    const basePayload: Record<string, any> = {
      id: userId,
      full_name: user.full_name || user.name || 'User',
      email: user.email || `${userId}@proline.com`,
      role_name: user.role_name || user.role || 'SALES_PERSON',
      role: user.role_name || user.role || 'SALES_PERSON',
      phone: (user.phone || user.mobile) ? (user.phone || user.mobile) : null,
      mobile: (user.phone || user.mobile) ? (user.phone || user.mobile) : null,
      permission_group_id: user.permission_group_id || 'pg_sales_person',
      permission_group_name: user.permission_group_name || 'Sales Person Group',
      company_handle: user.company_handle || user.company_handles?.join(', ') || 'All',
      password: user.password || '1234',
      active: user.active !== false,
      updated_at: new Date().toISOString()
    };

    if (user.sno && typeof user.sno === 'number') {
      basePayload.sno = user.sno;
    }

    let lastError: string | null = null;
    let savedSuccessfully = false;

    // Helper to attempt save on a target table with self-healing column stripping
    const attemptSaveOnTable = async (tableName: string) => {
      let currentPayload = { ...basePayload };

      for (let attempt = 0; attempt < 12; attempt++) {
        const { data, error } = await supabase.from(tableName).upsert([currentPayload]).select();
        
        if (!error) {
          return { success: true, error: null };
        }

        console.warn(`Supabase ${tableName} save attempt ${attempt + 1} notice:`, error.message);
        lastError = error.message;

        // Specific error checks: RLS Policy & Duplicate Key
        if (error.message && (error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('violates row-level'))) {
          return {
            success: false,
            error: 'Row-Level Security (RLS) Permission Denied! Supabase is blocking INSERTs on table "users". Disable RLS or create an Insert Policy in Supabase.'
          };
        }

        if (error.message && (error.message.toLowerCase().includes('duplicate key') || error.message.toLowerCase().includes('already exists'))) {
          return {
            success: false,
            error: `User with email "${currentPayload.email}" already exists in Supabase.`
          };
        }

        // Self-healing: missing column error
        if (error.message && error.message.includes("Could not find the '") && error.message.includes("' column")) {
          const match = error.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const missingCol = match[1];
            delete currentPayload[missingCol];
            continue;
          }
        }

        // Self-healing: invalid UUID syntax error for non-UUID text ID
        if (error.message && error.message.toLowerCase().includes('invalid input syntax for type uuid')) {
          delete currentPayload.id; // Strip non-UUID ID so Supabase generates primary key or matches on email
          continue;
        }

        // Retry plain insert without ID
        if (currentPayload.id) {
          delete currentPayload.id;
          const retryRes = await supabase.from(tableName).insert([currentPayload]).select();
          if (!retryRes.error) {
            return { success: true, error: null };
          }
          if (retryRes.error) {
            if (retryRes.error.message.toLowerCase().includes('row-level security') || retryRes.error.message.toLowerCase().includes('violates row-level')) {
              return {
                success: false,
                error: 'Row-Level Security (RLS) Permission Denied! Supabase is blocking INSERTs on table "users". Disable RLS or create an Insert Policy in Supabase.'
              };
            }
            if (retryRes.error.message.includes("Could not find the '")) {
              const match2 = retryRes.error.message.match(/Could not find the '([^']+)' column/);
              if (match2 && match2[1]) {
                delete currentPayload[match2[1]];
                continue;
              }
            }
          }
        }

        break;
      }
      return { success: false, error: lastError };
    };

    // Try 'users' table first
    const usersResult = await attemptSaveOnTable('users');
    if (usersResult.success) savedSuccessfully = true;

    // Also try 'system_users' table
    const sysResult = await attemptSaveOnTable('system_users');
    if (sysResult.success) savedSuccessfully = true;

    if (savedSuccessfully) {
      return { success: true, error: null };
    }

    return { success: false, error: lastError || 'Failed to insert user into Supabase database' };
  } catch (err: any) {
    console.error('Error saving user to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save user to Supabase database' };
  }
};

export const MOCK_AGENCY_FINANCIALS: Record<string, AgencyFinancials> = {};

export const MOCK_PRODUCTS: Product[] = [];

export const updateProductStockAndDetails = (
  productId: string, 
  updated: {
    product_name?: string;
    product_code?: string;
    pcs_per_box?: number;
    unit_price?: number;
    mrp_price?: number;
    category?: string;
    account_group?: string;
    segment?: string;
    stock_box_qty?: number;
    stock_loose_pcs?: number;
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
  if (updated.account_group !== undefined) prod.account_group = updated.account_group;
  if (updated.segment !== undefined) prod.segment = updated.segment as any;
  if (updated.unit_price !== undefined) prod.unit_price = Number(updated.unit_price);
  
  if (updated.mrp_price !== undefined && Number(updated.mrp_price) !== (prod.mrp_price || 0)) {
    const oldMrp = prod.mrp_price || (prod.unit_price ? Math.round(prod.unit_price * 1.15) : 100);
    const newMrp = Number(updated.mrp_price);
    
    prod.previous_mrp = oldMrp;
    prod.mrp_price = newMrp;
    prod.mrp_updated_at = new Date().toISOString();
    prod.mrp_updated_by = updated.updated_by || 'Admin';
    
    if (!prod.mrp_history) {
      prod.mrp_history = [];
    }
    
    prod.mrp_history.unshift({
      previous_mrp: oldMrp,
      new_mrp: newMrp,
      updated_at: new Date().toISOString(),
      updated_by: updated.updated_by || 'Admin',
      reason: updated.reason || 'MRP Price Revision'
    });
  }

  if (updated.stock_box_qty !== undefined) prod.stock_box_qty = Number(updated.stock_box_qty);
  if (updated.stock_loose_pcs !== undefined) prod.stock_loose_pcs = Number(updated.stock_loose_pcs);

  prod.total_stock_pcs = (prod.stock_box_qty || 0) * (prod.pcs_per_box || 1) + (prod.stock_loose_pcs || 0);

  return prod;
};

export const registerNewProduct = (newProd: {
  company_id: string;
  product_code: string;
  product_name: string;
  pcs_per_box: number;
  mrp_price: number;
  category?: string;
  account_group?: string;
  segment?: string;
  unit_price?: number;
  stock_box_qty?: number;
  stock_loose_pcs?: number;
}): Product => {
  const boxQty = Number(newProd.stock_box_qty || 0);
  const loosePcs = Number(newProd.stock_loose_pcs || 0);
  const pcsPerBox = Number(newProd.pcs_per_box || 24);

  const productRecord: Product = {
    id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    company_id: newProd.company_id,
    product_code: newProd.product_code,
    product_name: newProd.product_name,
    pcs_per_box: pcsPerBox,
    mrp_price: Number(newProd.mrp_price),
    category: newProd.category || 'General',
    account_group: newProd.account_group || 'FMCG',
    segment: (newProd.segment as any) || 'FMCG',
    unit_price: newProd.unit_price ? Number(newProd.unit_price) : Number(newProd.mrp_price),
    stock_box_qty: boxQty,
    stock_loose_pcs: loosePcs,
    total_stock_pcs: boxQty * pcsPerBox + loosePcs,
    reserved_stock_pcs: 0
  };

  MOCK_PRODUCTS.unshift(productRecord);
  return productRecord;
};

export const generateNewBarcodeSKUCode = (groupNameOrCompany?: string, productName?: string): string => {
  const codePrefix = getGroupCode(groupNameOrCompany || productName || 'AKAI');
  const nextNum = (MOCK_PRODUCTS.length + 1).toString().padStart(3, '0');
  return `${codePrefix}_SKU_${nextNum}`;
};

export const generateNewAgencyCode = (cityName?: string): string => {
  const cityPrefix = (cityName || 'SUR').substring(0, 3).toUpperCase();
  const seqNum = Math.floor(100 + Math.random() * 900);
  return `AG-${cityPrefix}-${seqNum}`;
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
    id: `a_pty_${Date.now()}`,
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
    email: newAgencyData.email?.trim() || '',
    credit_limit: Number(newAgencyData.credit_limit || 250000),
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

export const MOCK_HOLD_REASONS: HoldReason[] = [];

export const INITIAL_ORDERS: Order[] = [];
