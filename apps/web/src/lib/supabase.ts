import { createClient } from '@supabase/supabase-js';
import { Company, Agency, Product, Order, HoldReason, AgencyFinancials, ZoneMaster } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  const agency = MOCK_AGENCIES.find(a => a.id === targetId) || MOCK_AGENCIES[0];
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
    account_type: agency.account_group || 'Sundry Debtors-Electronics',
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
export const MOCK_COMPANIES: Company[] = [
  { id: 'c01', company_code: 'PG', company_name: 'Pringod (Priyagold)', segment: 'FMCG' },
  { id: 'c02', company_code: 'RC', company_name: 'RCPL', segment: 'FMCG' },
  { id: 'c03', company_code: 'OR', company_name: 'Orion', segment: 'FMCG' },
  { id: 'c04', company_code: 'GD', company_name: 'Gandour', segment: 'FMCG' },
  { id: 'c05', company_code: 'HP', company_name: 'HPPL', segment: 'FMCG' },
  { id: 'c06', company_code: 'WP', company_name: 'Whirlpool', segment: 'FMCD' },
  { id: 'c07', company_code: 'DK', company_name: 'Daikin', segment: 'FMCD' },
  { id: 'c08', company_code: 'CR', company_name: 'Cruise', segment: 'FMCD' },
  { id: 'c09', company_code: 'MG', company_name: 'Mogu Mogu', segment: 'FMCG' },
  { id: 'c10', company_code: 'HL', company_name: 'Heli', segment: 'FMCG' },
  { id: 'c11', company_code: 'WI', company_name: 'Waiwai', segment: 'FMCG' },
  { id: 'c12', company_code: 'PR', company_name: 'PRAN', segment: 'FMCG' },
  { id: 'c13', company_code: 'AK', company_name: 'AKAI', segment: 'FMCD' }
];

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
  // Surat City Zone
  {
    id: 'zn_01',
    zone_code: 'ZN-SUR-A',
    zone_name: 'City-A',
    region: 'Surat City Zone',
    major_areas: ['Mini Bazar', 'Hira bag', 'Sarthana', 'Nana Varacha', 'AK road', 'Katargam', 'Amroli', 'Ved road', 'Mota Varacha', 'LH Road'],
    description: 'Surat City Zone A - Varachha, Katargam, Amroli Corridor'
  },
  {
    id: 'zn_02',
    zone_code: 'ZN-SUR-B',
    zone_name: 'City-B',
    region: 'Surat City Zone',
    major_areas: ['Parvat Patiya', 'Puna', 'Yogichowk', 'Vraj chowk', 'Saroli', 'Sahra Darwaja', 'Textile Market', 'Bombay Market'],
    description: 'Surat City Zone B - Textile & Commercial Hubs'
  },
  {
    id: 'zn_03',
    zone_code: 'ZN-SUR-C',
    zone_name: 'City-C',
    region: 'Surat City Zone',
    major_areas: ['Ring Road', 'Majura Gate', 'Nanpura', 'Bhagal', 'Oldcity', 'Adajan', 'Rander', 'Hazira', 'Pal', 'Jangirpura'],
    description: 'Surat City Zone C - Old City & West Zone Corridor'
  },
  {
    id: 'zn_04',
    zone_code: 'ZN-SUR-D',
    zone_name: 'City-D',
    region: 'Surat City Zone',
    major_areas: ['Udhana', 'Dindoli', 'Godadara', 'Sachin', 'Pandesara', 'Unn', 'Bamroli'],
    description: 'Surat City Zone D - Industrial & South Zone Belt'
  },
  {
    id: 'zn_05',
    zone_code: 'ZN-SUR-E',
    zone_name: 'City-E',
    region: 'Surat City Zone',
    major_areas: ['Newcity', 'Ghoddoad road', 'Citylight', 'Parle point', 'Vesu', 'Althan', 'Sarsana', 'Vip Road'],
    description: 'Surat City Zone E - Premium Residential & Commercial West-South Belt'
  },

  // South Gujarat Rural Zone
  {
    id: 'zn_06',
    zone_code: 'ZN-SGU-US',
    zone_name: 'Upper South',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Vapi', 'Umergoan', 'Daman', 'Silvassa', 'Valsad', 'Pardi', 'Sanjan', 'Bhilad', 'Dharampur'],
    description: 'South Gujarat Rural Zone - Deep South & Border Belt'
  },
  {
    id: 'zn_07',
    zone_code: 'ZN-SGU-S',
    zone_name: 'South',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Kadodara', 'Navsari', 'Bilimora', 'Chikhli', 'Vasda', 'Waghai', 'Palsana'],
    description: 'South Gujarat Rural Zone - Highway & Central South Belt'
  },
  {
    id: 'zn_08',
    zone_code: 'ZN-SGU-E',
    zone_name: 'East',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Jolwa', 'Bardoli', 'Mandavi', 'Karcheliya', 'Madhi', 'Vaya', 'Songadh', 'Navapur'],
    description: 'South Gujarat Rural Zone - Eastern Agricultural & Industrial Belt'
  },
  {
    id: 'zn_09',
    zone_code: 'ZN-SGU-N',
    zone_name: 'North',
    region: 'South Gujarat Rural Zone',
    major_areas: ['Bharuch', 'Ankleshwer', 'Kim', 'Kosmba', 'Pipodra', 'Kamrej', 'Olpad', 'Sayan'],
    description: 'South Gujarat Rural Zone - North Industrial & Agricultural Belt'
  }
];

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

  if (cityNorm.includes('surat')) {
    return MOCK_ZONES[3]; // City-D default
  }
  return MOCK_ZONES[6]; // South default
};

const NEW_PARTY_MASTERS: { name: string; city: string; area: string; group: string; gstin: string }[] = [
  { name: "A One Electronics", city: "Surat", area: "UNN", group: "Sundry Debtors-Electronics", gstin: "24BKMPS6398L1Z5" },
  { name: "A One Mall", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AUQPB8061Q1Z1" },
  { name: "Aadhyashakti Electronics", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24FVNPR2006A1ZX" },
  { name: "Aanchal Electronics", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Aaradhya Electric Work", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Afi Electronics", city: "Surat", area: "UNN", group: "Sundry Debtors-Electronics", gstin: "24ANQPP0443B1ZA" },
  { name: "Aircon  Appliances", city: "Surat", area: "Khatodora", group: "Sundry Debtors-Electronics", gstin: "24ACJPM1760A1Z3" },
  { name: "Akshar Electronics", city: "Surat", area: "YOGICHOWK", group: "Sundry Debtors-Electronics", gstin: "24BFNPT9155A1Z8" },
  { name: "Al-Hatemi Enterprise", city: "Surat", area: "OLDCITY-SURAT", group: "Sundry Debtors-Electronics", gstin: "24MSJPS6809Q1ZJ" },
  { name: "Alaska Cool Air", city: "Surat", area: "NEWCITY-SURAT", group: "Sundry Debtors-Electronics", gstin: "24CNZPP2222F1ZU" },
  { name: "Aliz Refrigeration", city: "Surat", area: "BEGUMPURA", group: "Sundry Debtors-Electronics", gstin: "24ATLPB6331R1ZD" },
  { name: "Amar Mobile Electronics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24AITPY4299E1ZG" },
  { name: "Amar Sales", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AFVPP7483E1ZU" },
  { name: "Ambica Mobile And Electronics", city: "Surat", area: "Ved Road", group: "Sundry Debtors-Electronics", gstin: "24ASKPP6834F2ZI" },
  { name: "Ambika Electronic & Furniture-Kadodra", city: "Kadodara", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24ACQPV5579F1ZW" },
  { name: "Ambika Sales & Service-PASODRA", city: "Surat", area: "Pasodara", group: "Sundry Debtors-Electronics", gstin: "24EUYPP1667N1ZJ" },
  { name: "Ampere Cool Energy Sales And Service", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24GIMPB1193P1ZU" },
  { name: "Ampex Cooling System", city: "Surat", area: "OLDCITY-SURAT", group: "Sundry Debtors-Electronics", gstin: "24BCGPM4343H1ZQ" },
  { name: "Angel Sales", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24ABFFA3982P1ZZ" },
  { name: "Anuvrat Air-condition", city: "Surat", area: "VESU", group: "Sundry Debtors-Electronics", gstin: "24ABUPJ7571Q1ZN" },
  { name: "Arham Electronics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24MRDPS0298G1ZD" },
  { name: "Arham Mobile", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24EACPS7205F1ZU" },
  { name: "Arham Sales", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AWEPK9774H1Z5" },
  { name: "Arihant Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AUZPL8129J1ZV" },
  { name: "Arihant Enterprise", city: "Sachin", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AEJPJ7343A1ZV" },
  { name: "Arihant Kitchenware", city: "valsad", area: "valsad", group: "Sundry Debtors-Electronics", gstin: "24AUVPS7566A1Z4" },
  { name: "Arihant Mobile And Electronics", city: "kamrej", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Arihant Traders-Sachin", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24ADDPJ2023Q1ZN" },
  { name: "Ashapura Mobile And Electronics", city: "Surat", area: "UDHNA", group: "Sundry Debtors-Electronics", gstin: "24BRDPR0862E1ZZ" },
  { name: "Ashapuri Mobile Mall", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24MHBPS1521G1ZG" },
  { name: "Ashish Sales And Service", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24CYVPS1275C1Z4" },
  { name: "Asopalav", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AILPK4941R1ZM" },
  { name: "Asopalav Enterprise", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24BAMPK1997D1ZK" },
  { name: "Asopalav Sales", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AEHPK6011Q1ZC" },
  { name: "Audio Vision", city: "Surat", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "24AARPR7942K1ZX" },
  { name: "Avadh Enterprise", city: "Vadodara", area: "UDVADA", group: "Sundry Debtors-Electronics", gstin: "24AMTPD0064G2Z9" },
  { name: "B M Electronics", city: "Surat", area: "UNN", group: "Sundry Debtors-Electronics", gstin: "24CZCPP5300H1ZO" },
  { name: "B.B.C Electronics", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AFLPP1553K2Z7" },
  { name: "Balaji Fabrics", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24ATOPB3253B1Z8" },
  { name: "Balaji Metal Stores", city: "Surat", area: "VESU", group: "Sundry Debtors-Electronics", gstin: "24CGRPR6928K1ZJ" },
  { name: "Balaji Mobile And Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BAOPP5251P1Z1" },
  { name: "Bapa Sitaram Electronics", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24ARVPP6070D2ZH" },
  { name: "Bhagwati Electronics", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24PLXPS7824D1Z6" },
  { name: "Bhargav Tv Palace", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AMUPM3849B1ZV" },
  { name: "Bhavani Refrigeration Sales And Service", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AJSPT5205B1ZA" },
  { name: "Bhavna Sales", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24BSIPS2055J1ZJ" },
  { name: "Bhavya Home Appliances And Mobiles", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24BVEPB1326A1ZL" },
  { name: "Bheruji Stationary", city: "Surat", area: "PARVAT PATIYA", group: "Sundry Debtors-Electronics", gstin: "24FDSPS2845M1ZO" },
  { name: "Bhoomee Electricals", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Brand Honest", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AXWPV0638A1ZB" },
  { name: "Calcutta Refrigeration", city: "Surat", area: "Oldcity", group: "Sundry Debtors-Electronics", gstin: "24BCHPS2123N1ZG" },
  { name: "Care365 Hvac Solutions", city: "Surat", area: "Althan", group: "Sundry Debtors-Electronics", gstin: "24DHHPS0131M1ZA" },
  { name: "Chacha Bhatija Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AZKPK6619G1Z9" },
  { name: "Chamunda Electronics", city: "Kadodara", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24AHWPM5777F1ZP" },
  { name: "Chaudhary Enterprise (Dindoli)", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AVSPC9765H2Z1" },
  { name: "Chetan Sales", city: "Sachin", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AKKPJ2184Q1ZN" },
  { name: "Chirag Electronics", city: "Surat", area: "BEGUMPURA", group: "Sundry Debtors-Electronics", gstin: "24AGRPR2900H2ZB" },
  { name: "Computech Electronics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24DZEPS6754M1ZN" },
  { name: "Cool Enterprise", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24ASIPA0171E1ZG" },
  { name: "Coolcare Sales & Services", city: "Surat", area: "SALABATPURA", group: "Sundry Debtors-Electronics", gstin: "24DDIPS1736P1ZY" },
  { name: "Cooling Arts Sales And Seervice", city: "Surat", area: "BEGUMPURA", group: "Sundry Debtors-Electronics", gstin: "24AAVPC0364N1ZG" },
  { name: "Cooling Solution", city: "Surat", area: "SAGRAMPURA", group: "Sundry Debtors-Electronics", gstin: "24BDJPS1650R1ZY" },
  { name: "Cruise Appliances Private Limited (Salary A/C)", city: "Kheda", area: "Kheda", group: "Sundry Debtors-Electronics", gstin: "24AAGCC2269J1ZM" },
  { name: "Darbar Corporation", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AXGPS8078R1ZD" },
  { name: "Deep Mobile And Electronics", city: "Surat", area: "PARVAT GAM", group: "Sundry Debtors-Electronics", gstin: "24AMKPJ7205Q1ZN" },
  { name: "Demza Television", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24ANWPK8196N2ZT" },
  { name: "Dev Sales", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24ACUPM7757J1ZS" },
  { name: "Dhairya Sales", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24ALQPJ8259B1ZY" },
  { name: "Dhara Electricals & Fan Parts", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24APYPK3903R1Z3" },
  { name: "Dharma Enterprise", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24AYOPR2308E1ZI" },
  { name: "Dharmani Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BDYPD9734J1ZX" },
  { name: "Dharmesh Electricals", city: "valsad", area: "valsad", group: "Sundry Debtors-Electronics", gstin: "24AVGPP5606E1ZR" },
  { name: "Dharppy Industries", city: "Navsari", area: "Navsari", group: "Sundry Debtors-Electronics", gstin: "24AAXFD0592K1ZY" },
  { name: "Diamond Electronics", city: "Surat", area: "SALABATPURA", group: "Sundry Debtors-Electronics", gstin: "24ACEPB9996N1ZY" },
  { name: "Dipak Electronics", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24ANQPP5290G1ZL" },
  { name: "Diyora Electronics", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24APMPD0316F1ZI" },
  { name: "Dutt Electronics", city: "Surat", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24AHCPP6377N1ZR" },
  { name: "Fan Home And Appliances", city: "Surat", area: "MOHAN NI CHAL", group: "Sundry Debtors-Electronics", gstin: "24ABEPP6851F1ZN" },
  { name: "Fashion Forever", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24CSCPB8090B1Z7" },
  { name: "G N Electronics & Electricals", city: "Surat", area: "PARVAT PATIYA", group: "Sundry Debtors-Electronics", gstin: "24FURPS2897M1ZE" },
  { name: "Ganesh Enterprise & Rajwadi Furniture", city: "Surat", area: "KIM", group: "Sundry Debtors-Electronics", gstin: "24AWRPY0805C1ZI" },
  { name: "Gaurav Sales", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AYVPK7768E1ZS" },
  { name: "Gayatri Electronics", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AIKPJ8445N1ZP" },
  { name: "Gaytri Enterprise", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24ATIPR9651F1ZC" },
  { name: "Geeta Trading", city: "Navapur", area: "NAVAPUR", group: "Sundry Debtors-Electronics", gstin: "27AUKPP9771D1Z3" },
  { name: "Gobright Future Llp", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24ABBFG8380M1Z1" },
  { name: "Gujarat Mobile", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24AKTPL8020C1ZA" },
  { name: "Gujarat Refrigeration", city: "Surat", area: "OLDCITY-SURAT", group: "Sundry Debtors-Electronics", gstin: "24ALLPS9239H1ZK" },
  { name: "Gurukrupa Electronics Sales And Service", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24CEXPD8679D1ZY" },
  { name: "Gurukrupa Sales", city: "Surat", area: "KAPODRA", group: "Sundry Debtors-Electronics", gstin: "24AKBPB5218Q1Z7" },
  { name: "H.k.cooling System", city: "Surat", area: "PUNA KUMBHARIYA", group: "Sundry Debtors-Electronics", gstin: "24AMHPT1388F1ZV" },
  { name: "Hari Krushna Sales", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24APOPP2831D2ZZ" },
  { name: "Hari Om Super", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Hari Om Trading", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AAOFH7909P1ZM" },
  { name: "Hariom Electronics And Electricals", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AXGPK2408M1ZH" },
  { name: "Harish Electronics", city: "Surat", area: "Lala Daewaja", group: "Sundry Debtors-Electronics", gstin: "24AKUPS9920M1Z6" },
  { name: "Harshad Traders", city: "Navsari", area: "Navsari", group: "Sundry Debtors-Electronics", gstin: "24ABIPM1761B1Z3" },
  { name: "Harshika Enterprises", city: "Pandesara", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Harshika Traders", city: "Pandesara", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Haseja Distribution", city: "Mumbai", area: "MUMBAI", group: "Sundry Debtors-Electronics", gstin: "27AMTPK1963H1ZL" },
  { name: "Hasmukh Traders", city: "Umbergaon", area: "Umbergoan", group: "Sundry Debtors-Electronics", gstin: "24AAJFH8035R1ZS" },
  { name: "Hayati Electronics Home", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24BBLPK0409E2Z3" },
  { name: "Heena Electronics Private Limited", city: "Surat", area: "PUNA KUMBHARIYA", group: "Sundry Debtors-Electronics", gstin: "24AAQCS4605N1ZW" },
  { name: "Heena Sales", city: "Surat", area: "Mini Bazar", group: "Sundry Debtors-Electronics", gstin: "24ACPPM1556L1Z8" },
  { name: "Hemali Traders", city: "Navsari", area: "Navsari", group: "Sundry Debtors-Electronics", gstin: "24EPTPK0915N1ZE" },
  { name: "Heree Enterprise", city: "Surat", area: "RANDER", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Hi Tech Electronics And Home Appliances", city: "Surat", area: "KIM", group: "Sundry Debtors-Electronics", gstin: "24BAJPP1867L1Z8" },
  { name: "Himalaya Ac", city: "Surat", area: "SARTHANA", group: "Sundry Debtors-Electronics", gstin: "24CRMPA9676H1ZE" },
  { name: "Himani Super Market", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AIDPR3924K1Z4" },
  { name: "Hira Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AQKPK0940P1ZK" },
  { name: "Hirva Enterprise", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AEYPI7786K1ZH" },
  { name: "Hotel J B", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AACFH2858P1Z0" },
  { name: "Hp Sons", city: "Surat", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24BFFPG9704L2ZA" },
  { name: "Hutaib Corporation", city: "Surat", area: "Ring Road", group: "Sundry Debtors-Electronics", gstin: "24ABTPK3007D1ZZ" },
  { name: "I Mogal Mobile Hub", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Iledeal Electronics", city: "Surat", area: "SARTHANA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Indore Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24ALUPC7167M1ZH" },
  { name: "Italian Marketing", city: "Surat", area: "UDHNA", group: "Sundry Debtors-Electronics", gstin: "24AIWPD5179P1ZE" },
  { name: "J B Digitronics Pvt Ltd (Navin Electronics)", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24AACCJ3016E1Z7" },
  { name: "J P Brothers", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AJHPJ5858R1ZF" },
  { name: "J P Electronics", city: "Surat", area: "GOPIPURA", group: "Sundry Debtors-Electronics", gstin: "24AXPPP4821J1Z4" },
  { name: "Jagdamba Electronics And Furniture", city: "Surat", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24AKTPG3478P1ZC" },
  { name: "Jai Ambe Sales-Kim", city: "Kim", area: "KIM", group: "Sundry Debtors-Electronics", gstin: "24ASPPJ5451K1ZE" },
  { name: "Jai Hanuman Mobile & Repairing", city: "Surat", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24DAAPP8963C1ZN" },
  { name: "Jain Home Applinces", city: "Bardoli", area: "Bardoli", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Jain Mobile & Sales", city: "Surat", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24CFOPG9481E1Z6" },
  { name: "Jako Engineers India Private Limited", city: "Surat", area: "VESU", group: "Sundry Debtors-Electronics", gstin: "24AAGCJ8329J1ZA" },
  { name: "Jalaram  Electronics", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24ATCPT1450A1Z9" },
  { name: "Jani Air Condition", city: "Surat", area: "VESU", group: "Sundry Debtors-Electronics", gstin: "24ASAPJ2103K1ZA" },
  { name: "Jay Ambe Cooling System", city: "Surat", area: "BOMBAY MARKET", group: "Sundry Debtors-Electronics", gstin: "24AASFJ5218K1Z0" },
  { name: "Jay Bhavani Electronic & Mobile", city: "kamrej", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24AVQPV0499P1ZF" },
  { name: "Jay Bhole Nath Mobile Shop", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24KISPS5755Q1ZT" },
  { name: "Jay Bholenath Eletrics", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24BPCPV8560E1ZP" },
  { name: "Jay Dwarkadhish Electronics", city: "Surat", area: "MATAWADI", group: "Sundry Debtors-Electronics", gstin: "24CTEPP8630A1ZX" },
  { name: "Jay Hinglaj Mobile And Electronics", city: "Pandesara", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24CJOPR0382R1ZD" },
  { name: "Jay Kuber Electronics", city: "Surat", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24ARKPA5567D1Z0" },
  { name: "Jay Nakoda Electronics & Fan House", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Jay Rajesh Electronics And Mobile", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24AKWPG8459R1ZY" },
  { name: "Jay Refrigeration", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AKGPP7792J1ZJ" },
  { name: "Jay Sachchidanand Mobile & Electronic Money T", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24DMCPS7323M1ZO" },
  { name: "Jeet Sales And Service", city: "Surat", area: "PAL GAM", group: "Sundry Debtors-Electronics", gstin: "24AYHPP0385Q1ZT" },
  { name: "Jeeya Electronics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24BWJPP4814K2Z7" },
  { name: "Jiya Sales", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AUQPA8752P1ZY" },
  { name: "Joshi Electronic", city: "Surat", area: "SANIA HEMAD", group: "Sundry Debtors-Electronics", gstin: "24ABGPJ0942B1ZB" },
  { name: "Jtb Enterprise", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AKXPB7433R1ZE" },
  { name: "Kaivalkrupa Electronics & Electricals", city: "Surat", area: "KARGIL CHOWK", group: "Sundry Debtors-Electronics", gstin: "24AGUPC9990K1ZL" },
  { name: "Kalash Pharma & Cosmetics", city: "Vapi", area: "Vapi", group: "Sundry Debtors-Electronics", gstin: "24AAPFK2905H1ZD" },
  { name: "Kalpatru Mall", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BELPS5203R1ZX" },
  { name: "Kamdhenu Electronics", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24AHTPV3583D2ZU" },
  { name: "Kamlay Sales", city: "Kadodara", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24ADWPL4344D1ZH" },
  { name: "Kapil Computer & Cctv Camara", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24CRTPK1986R1ZN" },
  { name: "Kaushal Electronics", city: "Surat", area: "Olpad", group: "Sundry Debtors-Electronics", gstin: "24ADEPS9239G1ZA" },
  { name: "Kavya Electronics", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24DPQPK6708M1Z9" },
  { name: "Kedar Sales", city: "Surat", area: "Surat", group: "Sundry Debtors-Electronics", gstin: "24CHHPG4444A1ZW" },
  { name: "Keshav Marketing", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24ABCPP0577A1Z4" },
  { name: "Keshav Sales", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24ACSPP7797H1ZO" },
  { name: "Khanak Enterprise", city: "Surat", area: "OLDCITY-SURAT", group: "Sundry Debtors-Electronics", gstin: "24COHPS6406R1Z8" },
  { name: "Khodal Krupa Electronics & Mobile", city: "Surat", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24JNOPS1014L1ZM" },
  { name: "Khodiyar Electricals Sales And Service (A.K.Road)", city: "Surat", area: "A K ROAD", group: "Sundry Debtors-Electronics", gstin: "24BRGPS5848L1Z4" },
  { name: "Khodiyar Electronics", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24FIHPR5525M1ZQ" },
  { name: "Khodiyar Electronics And Mobile", city: "Surat", area: "YOGICHOWK", group: "Sundry Debtors-Electronics", gstin: "24AJDPB2728C1ZZ" },
  { name: "Khodiyar House (Katargam)", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Khushi Sales", city: "kamrej", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24ARSPP4116H1ZM" },
  { name: "Kiran Aircon", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24ACJPG6627N1ZA" },
  { name: "Kiran Refrigeration", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24ALWPP7849M1ZX" },
  { name: "Krishna Agency(Bardoli)", city: "Bardoli", area: "Bardoli", group: "Sundry Debtors-Electronics", gstin: "24BADPS2228G1ZX" },
  { name: "Krishna Corporation", city: "Surat", area: "Nanpura", group: "Sundry Debtors-Electronics", gstin: "24BJPPR4978B1ZS" },
  { name: "Krishna Electronics", city: "Surat", area: "HIRABAUGH", group: "Sundry Debtors-Electronics", gstin: "24AJUPA0407E1ZR" },
  { name: "Krishna Electronics-BHESTAN", city: "Surat", area: "BHESTAN", group: "Sundry Debtors-Electronics", gstin: "24ABCFK7889C1Z5" },
  { name: "Krishna Marketing", city: "Surat", area: "ATHWALINES", group: "Sundry Debtors-Electronics", gstin: "24ABIPM1721H1ZZ" },
  { name: "Krishna Mobile & Electronics", city: "Surat", area: "RUSTAMPURA", group: "Sundry Debtors-Electronics", gstin: "24ADNPJ6929R3ZM" },
  { name: "Krishna Sales", city: "Surat", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24BNAPB0488F1ZI" },
  { name: "Krishna Traders", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24ADJPS0296E1ZI" },
  { name: "Kum Kum Vision", city: "Surat", area: "Station", group: "Sundry Debtors-Electronics", gstin: "24AFXPS2848L1ZJ" },
  { name: "Lata Electronics", city: "Surat", area: "BHATAR", group: "Sundry Debtors-Electronics", gstin: "24BLZPS1540J1ZK" },
  { name: "Laxmi Vision", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Laxmi Zumer & Fan House", city: "Surat", area: "PARVAT PATIYA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Light House", city: "kamrej", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24AALPJ2340K1ZT" },
  { name: "Lokmanya", city: "Surat", area: "PAL GAM", group: "Sundry Debtors-Electronics", gstin: "24CODPB8424C1ZI" },
  { name: "Luv Kush Sales", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AIHPT3010C1ZU" },
  { name: "M K Sales (Kamrej)", city: "Surat", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24CEKPA9979J1ZW" },
  { name: "M. S. Enterprise", city: "Surat", area: "Jahangirpura", group: "Sundry Debtors-Electronics", gstin: "24CGPPM2458H1Z4" },
  { name: "Maa Enterprise-AHM", city: "Ahmedabad", area: "Ahemdabad", group: "Sundry Debtors-Electronics", gstin: "24BHCPC0521J1Z1" },
  { name: "Maa Harsiddhi Enterprise", city: "Bardoli", area: "GANGADHARA", group: "Sundry Debtors-Electronics", gstin: "24AEMPD6842D1ZQ" },
  { name: "Maa Krupa Refrigeration", city: "Surat", area: "UDHNA", group: "Sundry Debtors-Electronics", gstin: "24AIGPJ5741D1ZL" },
  { name: "Maa Laxmi Mobile And Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24CHPPR7324Q1ZF" },
  { name: "Maa Laxmi Mobile-Godadra", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BRQPR3228H2ZH" },
  { name: "Madhav Sales", city: "Surat", area: "SARTHANA", group: "Sundry Debtors-Electronics", gstin: "24ABUFM1125D1ZI" },
  { name: "Madhuram Sales", city: "Surat", area: "Delar", group: "Sundry Debtors-Electronics", gstin: "24ENIPP9300K1ZP" },
  { name: "Madni Electronic", city: "Surat", area: "UNN", group: "Sundry Debtors-Electronics", gstin: "24AASPQ0483F1ZI" },
  { name: "Mahalaxmi Electronics", city: "Sachin", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Mahalaxmi Electronics-Bhestan", city: "Surat", area: "BHESTAN", group: "Sundry Debtors-Electronics", gstin: "24BXSPS4088Q1Z8" },
  { name: "Mahalaxmi Graphics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24AVVPB8802H1ZG" },
  { name: "Mahatma Sales", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24FNSPS8929C1ZB" },
  { name: "Mahaveer Electronics", city: "Surat", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24DWGPS9991K2ZH" },
  { name: "Mahesh Packaging", city: "Surat", area: "Surat", group: "Sundry Debtors-Electronics", gstin: "24AACHM2286C1ZK" },
  { name: "Mamta Mobile Electronics", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AKBPA4423C1Z4" },
  { name: "Manish Enterprise", city: "Surat", area: "A K ROAD", group: "Sundry Debtors-Electronics", gstin: "24NKJPS7562F1ZH" },
  { name: "Manish Light House", city: "Surat", area: "BHESTAN", group: "Sundry Debtors-Electronics", gstin: "24BHOPS4975A1Z2" },
  { name: "Manmandir Electricals And Electronics", city: "Surat", area: "UDHNA", group: "Sundry Debtors-Electronics", gstin: "24AGMPC1796P1ZV" },
  { name: "Mariya Electronics", city: "Surat", area: "Surat", group: "Sundry Debtors-Electronics", gstin: "24BESPJ8776H1ZS" },
  { name: "Maruti Electronics", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AGNPB9883D1Z8" },
  { name: "Maruti Electronics(A.K ROAD)", city: "Surat", area: "A K ROAD", group: "Sundry Debtors-Electronics", gstin: "24ANDPG7325G1ZB" },
  { name: "Maruti Krupa Refrigeration", city: "Surat", area: "YOGICHOWK", group: "Sundry Debtors-Electronics", gstin: "24AQEPB6503H1ZD" },
  { name: "Maruti Mobile Care", city: "Surat", area: "BHATAR", group: "Sundry Debtors-Electronics", gstin: "24BKAPP1639P1ZU" },
  { name: "Marutinandan Air Conditioner And Hvac Solution", city: "Surat", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24AQAPV0720E1ZC" },
  { name: "Matawadi Fan House", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24BUKPR9650Q1ZL" },
  { name: "Mayur Electronics", city: "Surat", area: "Lalgate", group: "Sundry Debtors-Electronics", gstin: "24BSZPS9876G1ZI" },
  { name: "Mayur Vision", city: "Surat", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24ALTPS2584B1ZU" },
  { name: "Mega Shopping Mall", city: "Surat", area: "CANAL ROAD", group: "Sundry Debtors-Electronics", gstin: "24APZPP7785H1ZU" },
  { name: "Millenium Enterprise", city: "Surat", area: "Mini Bazar", group: "Sundry Debtors-Electronics", gstin: "24ATMPG6471C1ZT" },
  { name: "Modern Electronics Service", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AKIPS3115L1Z1" },
  { name: "Mr. Cooling", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24AKLPJ3351L1Z1" },
  { name: "Nakoda Electronics & Mobile", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Navkar Mall (Godadra)", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AFVPJ0158G1ZE" },
  { name: "Navkar Sales-Godadra", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24ACYPB0476F1ZM" },
  { name: "Nena Airconditioner", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24ANIPN9220G1Z1" },
  { name: "New Chacha Bhatija Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BZMPK5525N1ZW" },
  { name: "New India Cooling System", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24BGIPJ7239R1ZP" },
  { name: "New Jay Ambe Sales And Service", city: "Surat", area: "PARVAT PATIYA", group: "Sundry Debtors-Electronics", gstin: "24AOYPJ9092F1ZB" },
  { name: "New Raj Furniture And Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AGAPT9423A1ZP" },
  { name: "New S V Sales", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AASFN8541R1ZA" },
  { name: "New Shivam Electronics(Jolwa)", city: "Jolwa", area: "JOLWA", group: "Sundry Debtors-Electronics", gstin: "24BKQPS1246H1ZX" },
  { name: "New Shreenathji Electronics (Sachin)", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "New Shubham Mobile And Electronics", city: "Surat", area: "NAVAGAM", group: "Sundry Debtors-Electronics", gstin: "24DGBPP0700E1Z3" },
  { name: "New Surat Electricals", city: "Surat", area: "BEGUMPURA", group: "Sundry Debtors-Electronics", gstin: "24ABMPC1794L1ZF" },
  { name: "Nilkanth Electronics & Mobile", city: "Surat", area: "velanja", group: "Sundry Debtors-Electronics", gstin: "24BMNPR2093E1ZW" },
  { name: "Nilkanth Mobile World", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24ANAPC3877C1ZH" },
  { name: "Ocean Enterprise", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24BBEPV4965K1Z2" },
  { name: "Om Cooling Systems", city: "Surat", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24AMAPM8738M1ZM" },
  { name: "Om Electronics & Electricals", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AZYPP4542P1ZD" },
  { name: "Ov Infotech", city: "Surat", area: "ICHCHHAPORE", group: "Sundry Debtors-Electronics", gstin: "24FHVPS4322A1ZA" },
  { name: "P M Home Appliances", city: "Surat", area: "BHAGAL", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Parth Electronics", city: "Surat", area: "KAPODRA", group: "Sundry Debtors-Electronics", gstin: "24AEVPT9995A1ZN" },
  { name: "Patel Air Conditioner", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24COQPB5584L1ZF" },
  { name: "Pavan Mobile Shop & Electronic", city: "Surat", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "24BKAPA4930Q1Z7" },
  { name: "Pavan Refrigeration", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AYLPK9311M1Z2" },
  { name: "Phoenix Traders", city: "Surat", area: "Parle-Point", group: "Sundry Debtors-Electronics", gstin: "24AAIFP1373K1Z4" },
  { name: "Pinkal Electronics", city: "Sayan", area: "Sayan", group: "Sundry Debtors-Electronics", gstin: "24BQWPS1854H1Z9" },
  { name: "Pooja Aircon", city: "Surat", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24ACGPL0235J1ZW" },
  { name: "Pooja Mobile & Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24FPJPR0190P1Z9" },
  { name: "Pooja Vision", city: "Surat", area: "Althan", group: "Sundry Debtors-Electronics", gstin: "24ADNPJ5611L1ZF" },
  { name: "Poonam Sales", city: "Surat", area: "BOMBAY MARKET", group: "Sundry Debtors-Electronics", gstin: "24AZDPD9765B1ZK" },
  { name: "Pramukh Electronics-Canal Road", city: "Surat", area: "CANAL ROAD", group: "Sundry Debtors-Electronics", gstin: "24AAVFP8153E1ZW" },
  { name: "Pramukh Electronics-KAPODRA", city: "Surat", area: "KAPODRA", group: "Sundry Debtors-Electronics", gstin: "24ABXPL9965H1ZR" },
  { name: "Prayosha Electronics And Electrics", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24ACKPH0122J1Z2" },
  { name: "Prayosha Electronics And Mobile", city: "Surat", area: "KARGIL CHOWK", group: "Sundry Debtors-Electronics", gstin: "24ADUPH4725L1Z5" },
  { name: "Prime Mineral Industries", city: "Surat", area: "MANGROL", group: "Sundry Debtors-Electronics", gstin: "24ABAFP4831F1ZK" },
  { name: "Pushpa Electronics", city: "Surat", area: "VESU", group: "Sundry Debtors-Electronics", gstin: "24AAUFP4296R1Z2" },
  { name: "R.K. Electronics", city: "Surat", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Radhe Sales And Service", city: "Surat", area: "PUNA KUMBHARIYA", group: "Sundry Debtors-Electronics", gstin: "24BBWPV7014D1ZD" },
  { name: "Rainbow Ceramic", city: "Surat", area: "BHAGAL", group: "Sundry Debtors-Electronics", gstin: "24AAMFR6293A1Z6" },
  { name: "Raj Farniture & Electronic & Mobile", city: "Surat", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Raj Furniture And Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AYWPT5081A1Z4" },
  { name: "Raj Furniture Electronics And Mobile-Kadodara", city: "Kadodara", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24ADTPT8601Q1ZL" },
  { name: "Raj Refrigeration", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24CECPK0606N1ZO" },
  { name: "Raj Refrigeration Systems", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24ADQPP0473P1ZW" },
  { name: "Rajdhani Metal Industries", city: "Surat", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24ADOPS3977R1ZC" },
  { name: "Rakesh Sales And Services", city: "Surat", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24AETPT6991A1ZZ" },
  { name: "Ramdev Cooling System", city: "Surat", area: "PUNA KUMBHARIYA", group: "Sundry Debtors-Electronics", gstin: "24HFQPS4299M1Z8" },
  { name: "Ramdev Electronics", city: "Surat", area: "YOGICHOWK", group: "Sundry Debtors-Electronics", gstin: "24BBXPP2871D1ZB" },
  { name: "Rameshwar Home Appliances", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Rangoli Home Line", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24BDSPG3024N1ZD" },
  { name: "Ravi Electronics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24BGGPS8840B1ZE" },
  { name: "Ridham Sales", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24ADTPD0460B1Z3" },
  { name: "Rohit Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AQKPK0918R1ZE" },
  { name: "Ronak  Electronics(VALSAD)", city: "valsad", area: "valsad", group: "Sundry Debtors-Electronics", gstin: "24ABPPG8947A1ZM" },
  { name: "Ronak Electronic And Mobile", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24CAQPK7464Q1ZQ" },
  { name: "Ronak Sales(GODADARA)", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BRPPC5083A1Z3" },
  { name: "Royal Electronics", city: "Surat", area: "CANAL ROAD", group: "Sundry Debtors-Electronics", gstin: "24AKWPJ2918E1Z2" },
  { name: "Rv Sales", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24BCNPG2370P1Z9" },
  { name: "S K Electronics", city: "Surat", area: "Lala Daewaja", group: "Sundry Debtors-Electronics", gstin: "24AFLPP1926L1Z5" },
  { name: "S P Electronics", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24EUZPS6640P1ZC" },
  { name: "S P Electronics-Godadra", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "S R Sales(VELANJA)", city: "Surat", area: "velanja", group: "Sundry Debtors-Electronics", gstin: "24ADRFS1444E1Z3" },
  { name: "S. K. Lavangwala Fab", city: "Surat", area: "Khatodora", group: "Sundry Debtors-Electronics", gstin: "24ACOFS8020Q1ZH" },
  { name: "Safeda Refrigeration", city: "Surat", area: "RANDER", group: "Sundry Debtors-Electronics", gstin: "24MDNPS5900B1ZF" },
  { name: "Saguna Enterprises", city: "Surat", area: "Olpad", group: "Sundry Debtors-Electronics", gstin: "24AHRPP3886B1Z1" },
  { name: "Sahaj Mobile & Electronics", city: "Sachin", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AKJPP0728P1ZQ" },
  { name: "Sahajanand Electronics", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24BSQPG3302L2ZQ" },
  { name: "Sahjanand Electronics-Pasodara", city: "Surat", area: "Pasodara", group: "Sundry Debtors-Electronics", gstin: "24CHUPD0407P1Z4" },
  { name: "Sahjanand Refrigeration", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AEIPB1372A1ZB" },
  { name: "Sai Leela Creation", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AMWPD3733B1ZB" },
  { name: "Samarth Marketing", city: "Surat", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24BBNPS6998G1ZS" },
  { name: "Samta Vision", city: "Surat", area: "BHESTAN", group: "Sundry Debtors-Electronics", gstin: "24BWXPS3630L1ZT" },
  { name: "San Ved Biochem", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24OURPS8651A1ZY" },
  { name: "Sangam Beauty Palace", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AIDPJ5605K1ZE" },
  { name: "Sanjari Air Con", city: "Surat", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24COZPP1666L1Z1" },
  { name: "Sanjay Electronics", city: "PASODRA", area: "Pasodara", group: "Sundry Debtors-Electronics", gstin: "24BFSPM5155C1ZE" },
  { name: "Sant Chhaya Fashion", city: "Surat", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24AFZPV9452R1ZW" },
  { name: "Santoshi Electronics", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24CQZPM7732C1ZG" },
  { name: "Sanwariya Sales", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24ACMFS1212J1Z9" },
  { name: "Sara Sales", city: "Surat", area: "UNN", group: "Sundry Debtors-Electronics", gstin: "24MWBPS9176C1Z2" },
  { name: "Sargam Shoppe", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24AAYPD4527B1ZW" },
  { name: "Sarvoday Cooling System", city: "Surat", area: "VESU", group: "Sundry Debtors-Electronics", gstin: "24AANPP3564F1ZK" },
  { name: "Sat Keval Music And Fan Point", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24APDPP9517R1Z5" },
  { name: "Sattyam Home Appliance", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Satyam Appliance", city: "Surat", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "24BLMPD9382A1Z7" },
  { name: "Savaliya Fan House & Tv Palace", city: "Surat", area: "SARTHANA", group: "Sundry Debtors-Electronics", gstin: "24EZYPS2865G1ZJ" },
  { name: "Seema Electric", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24DVIPP6456F1ZA" },
  { name: "Shakti Electronics", city: "Surat", area: "SARTHANA", group: "Sundry Debtors-Electronics", gstin: "24AHZPV9383M1ZW" },
  { name: "Sharmaji Electronics", city: "Surat", area: "UDHNA", group: "Sundry Debtors-Electronics", gstin: "24ANHPS5219D1Z4" },
  { name: "Shiv Mall-Limbayat", city: "Surat", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24AKAPD8314Q1Z3" },
  { name: "Shiv Mobile & Electronics", city: "Surat", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24AHAPT9034G1ZC" },
  { name: "Shiv Shakti Multi Store", city: "Surat", area: "BOMBAY MARKET", group: "Sundry Debtors-Electronics", gstin: "24ANQPK0337H1Z2" },
  { name: "Shivam Electricals-Ved Road", city: "Surat", area: "Ved Road", group: "Sundry Debtors-Electronics", gstin: "24ADVPG6774B1ZD" },
  { name: "Shivam Electronics (Ichchhapore)", city: "Surat", area: "ICHCHHAPORE", group: "Sundry Debtors-Electronics", gstin: "24ALLPS9256Q1Z0" },
  { name: "Shivam Electronics A K Road", city: "Surat", area: "A K ROAD", group: "Sundry Debtors-Electronics", gstin: "24AGOPA9713A1ZT" },
  { name: "Shivam Electronics(Kadodara)", city: "Kadodara", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24BELPP1829J1Z8" },
  { name: "Shivam Electronics-Yogi Chowk", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AMCPM2713J1ZB" },
  { name: "Shivam Elelctronics-Tantithaiya", city: "Palsana", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24BYAPM2809J1ZJ" },
  { name: "Shree Bapa Sitaram Electronics", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24ATAPP9976F1ZA" },
  { name: "Shree Bhairav Electrics", city: "Surat", area: "Sahara Darwaja", group: "Sundry Debtors-Electronics", gstin: "24ADAPR6385C1ZM" },
  { name: "Shree Chamunda Mobile & Electronics", city: "Surat", area: "NAVAGAM", group: "Sundry Debtors-Electronics", gstin: "24DEXPJ0470R1ZP" },
  { name: "Shree Gale Ambe Electronic And Electric", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24BCUPS8365R1Z7" },
  { name: "Shree Ganesh Electrical Works", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24CERPP0543Q1ZU" },
  { name: "Shree Gel Ambe Electronics", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24BWMPN7002C1ZU" },
  { name: "Shree Gurukrupa Super Store", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24CRTPP5756N1ZQ" },
  { name: "Shree Maruti Electronics", city: "Surat", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24BJZPV9268G1Z3" },
  { name: "Shree Nakoda Electronic", city: "Pandesara", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24AUGPC4243F2Z4" },
  { name: "Shree Poonam Sales", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24EDOPK9537F1Z5" },
  { name: "Shree Ram Enterprise", city: "Surat", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24CHZPN0671E1Z2" },
  { name: "Shree Ram Mobile & Electronics", city: "Surat", area: "Kadodara", group: "Sundry Debtors-Electronics", gstin: "24DOGPR7465D1ZP" },
  { name: "Shree Sai Electronics", city: "Chalthan", area: "CHALTHAN", group: "Sundry Debtors-Electronics", gstin: "24AAVPD8989Q2ZD" },
  { name: "Shree Sai Electronics And Furniture", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24BQZPG6823P1ZY" },
  { name: "Shree Sai Home Appliances", city: "Surat", area: "PARVAT GAM", group: "Sundry Debtors-Electronics", gstin: "24BQKPG9089C1ZO" },
  { name: "Shree Sai Mall", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24BZEPP7705B1ZM" },
  { name: "Shree Sai Tv(GODADARA)", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24AMZPP7359L1ZX" },
  { name: "Shree Shivdhara Electronics", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24AEBPT0791E1ZN" },
  { name: "Shree Shubham Sales", city: "Surat", area: "KARGIL CHOWK", group: "Sundry Debtors-Electronics", gstin: "24AKHPD6230E1ZQ" },
  { name: "Shree Shyam Corporation", city: "Surat", area: "RANDER", group: "Sundry Debtors-Electronics", gstin: "24AACHT0932N1Z1" },
  { name: "Shree Uma Electric", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24ANEPD1277F1ZG" },
  { name: "Shree Vallabh Electronics", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AEIFS3185C1Z4" },
  { name: "Shree Vardhaman Electronics", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Shree Vardhman Sales Agency", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AHHPS2676L1ZT" },
  { name: "Shreeji Air Condition", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AMLPR4681D1ZV" },
  { name: "Shreeji Aircondition-ADAJAN", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24AMQPP2148C1Z4" },
  { name: "Shreeji Electric", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Shreeji Enterprise", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AODPJ1950P1ZS" },
  { name: "Shreeji Infotech", city: "Surat", area: "New City", group: "Sundry Debtors-Electronics", gstin: "24AIAPR0734L1ZB" },
  { name: "Shreeji Sales & Services", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24BQQPP4663R1ZS" },
  { name: "Shreeji Sales(Gopipura)", city: "Surat", area: "GOPIPURA", group: "Sundry Debtors-Electronics", gstin: "24AASPZ3028P1ZT" },
  { name: "Shreenath Enterprise", city: "Surat", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24ADPFS8112H1ZW" },
  { name: "Shreenath Television", city: "Surat", area: "YOGICHOWK", group: "Sundry Debtors-Electronics", gstin: "24AUSPB7790G1ZA" },
  { name: "Shreenathjee Mobile And Electronics", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AEOPT4217L1Z2" },
  { name: "Shri Krishna Vision", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24DNKPK1540M1ZV" },
  { name: "Shri Shyam Enterprises", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24ANMPR3291H1ZO" },
  { name: "Shrinath Television", city: "Surat", area: "A K ROAD", group: "Sundry Debtors-Electronics", gstin: "24AUSPB7790G1ZA" },
  { name: "Siddharth Audio & Electronics", city: "Surat", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24BBGPD1971B1Z9" },
  { name: "Siddhi Mobile & Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24DUKPS6157K1ZY" },
  { name: "Sitaram Cosmetics", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24ASLPK3679A1ZS" },
  { name: "Smartphone Gallery", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24ADMFS7534E1ZX" },
  { name: "Soham Electricals & Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Soham Vision", city: "Surat", area: "Ved Road", group: "Sundry Debtors-Electronics", gstin: "24AAJPT4702D1ZY" },
  { name: "Sreenathji Mobile And Electronics", city: "Surat", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AEOPT4217L1Z2" },
  { name: "Ss Ac Services Private Limited", city: "Surat", area: "BHESTAN", group: "Sundry Debtors-Electronics", gstin: "24ABMCS6591C1Z4" },
  { name: "Star Vision S.V. Electronics", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AFPFS6650E1ZR" },
  { name: "Star Win Enterprise", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24DVJPS3228B1ZQ" },
  { name: "Sujal Electronics", city: "Kim", area: "KIM", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Sun Shine Electronics", city: "Surat", area: "CHALTHAN", group: "Sundry Debtors-Electronics", gstin: "24AHUPM3070H1Z5" },
  { name: "Sun Shine Innovation", city: "Surat", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24AEMFS5255H1ZR" },
  { name: "Sunder Sales", city: "Sachin", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24EUZPS6443E1ZY" },
  { name: "Sundha Mata Electronics & Mobile", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Suraj Corporation", city: "Surat", area: "Nanpura", group: "Sundry Debtors-Electronics", gstin: "24ADFPP6253J1ZD" },
  { name: "Surbhi Electronics", city: "Surat", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24BFEPC6997Q1ZP" },
  { name: "Surya Electronics & Electrical", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Suzo Electricals", city: "Surat", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24AFFFS0766P1ZH" },
  { name: "Suzo Technologies", city: "Surat", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24AEPFS8579D1ZF" },
  { name: "T V Palace", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AABFT4402G1ZO" },
  { name: "Take Home Electronics (Mini Bazar)", city: "Surat", area: "Mini Bazar", group: "Sundry Debtors-Electronics", gstin: "24AHGPS9619E1Z4" },
  { name: "Takehome Sales", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AGUPS7528M1ZF" },
  { name: "Tej Sales & Service", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24BVYPP1092D1ZA" },
  { name: "The Puna Seva Sankari Mandali Ltd", city: "Surat", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AAAAS3508E1ZZ" },
  { name: "Tirupati Novelty Eletronics", city: "kamrej", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24AEHPC0965M1ZH" },
  { name: "Tisha Sales", city: "Olpad", area: "Olpad", group: "Sundry Debtors-Electronics", gstin: "24GWEPP6373K1ZY" },
  { name: "U R Publicity", city: "Surat", area: "Khatodora", group: "Sundry Debtors-Electronics", gstin: "24APOPC2426F1ZA" },
  { name: "Unicool Engineers", city: "Surat", area: "CITYLIGHT", group: "Sundry Debtors-Electronics", gstin: "24AFSPP8397L1ZB" },
  { name: "Unique Electronics", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24ALQPV0732M1ZL" },
  { name: "Uttam Electronics", city: "Surat", area: "RANDER", group: "Sundry Debtors-Electronics", gstin: "24EFIPM5617A1ZQ" },
  { name: "Vandan Fashion", city: "Surat", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24COEPP3310Q1ZR" },
  { name: "Vardhaman Sales", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24FNOPS8301G1ZP" },
  { name: "Vardhaman Sales(Sumul Dairy)", city: "Surat", area: "Sumuldairy", group: "Sundry Debtors-Electronics", gstin: "24ABCPG0522E1ZK" },
  { name: "Vardhman Electronics", city: "Surat", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24BXEPS0389G1ZB" },
  { name: "Vardhman Metal", city: "Navsari", area: "Chikhali", group: "Sundry Debtors-Electronics", gstin: "24ACQPS9944M1ZJ" },
  { name: "Vardhman Mobile And Electronics", city: "Surat", area: "A K ROAD", group: "Sundry Debtors-Electronics", gstin: "24AEFPJ8949E1ZD" },
  { name: "Viha Sales", city: "Surat", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AASFV5964G1ZK" },
  { name: "Vijay Enterprise", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AJQPA3656H1Z8" },
  { name: "Vikas Electronics(CHALTHAN)", city: "Surat", area: "CHALTHAN", group: "Sundry Debtors-Electronics", gstin: "24AUEPD9668D1ZN" },
  { name: "Vinayak Raj Electronics", city: "Surat", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24CDNPP5863N1ZP" },
  { name: "Virani Electronics And Computer Parts", city: "Surat", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AJQPV3942H1ZQ" },
  { name: "Vishal Electronics", city: "Surat", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "24AVHPS9358M1ZP" },
  { name: "Vishal Fan & Light", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Vishwa Electronics", city: "Surat", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24BYRPK2555E1ZC" },
  { name: "Vitrang Sales & Service", city: "Surat", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Vk Sales", city: "Surat", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24AVQPG8822M1Z1" },
  { name: "Vs Electronics", city: "Surat", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24HSQPS7452K1ZS" },
  { name: "World Class Electronics", city: "kamrej", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24ABBPJ5367P1ZA" },
  { name: "Yug Electronics", city: "Surat", area: "AMROLI", group: "Sundry Debtors-Electronics", gstin: "24AGLPR2915E1ZH" },
  { name: "Zivaa Enterprise", city: "Surat", area: "PIPLOD", group: "Sundry Debtors-Electronics", gstin: "24BUVPG0871K1Z8" },
  { name: "Airwing Engineers", city: "SURAT", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AKHPH5947E1Z8" },
  { name: "Alina Mobile", city: "SURAT", area: "UNN", group: "Sundry Debtors-Electronics", gstin: "24CCHPB6166K1ZJ" },
  { name: "Aroma Mobile", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24TSBPS7583G1ZW" },
  { name: "Balaji Enterprise(Baroda)", city: "Vadodara", area: "VADODARA", group: "Sundry Debtors-Electronics", gstin: "24AEXPB4620G1ZN" },
  { name: "BapaSitaram Enterprise", city: "SURAT", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AWLPT6141N2ZW" },
  { name: "Bhatia Communications & Retail (india) Limited", city: "SURAT", area: "UDHNA", group: "Sundry Debtors-Electronics", gstin: "24AADCB3959R1Z3" },
  { name: "Bombay Enterprise", city: "Bhilad", area: "Umbergoan", group: "Sundry Debtors-Electronics", gstin: "24AQPPJ1461P1ZE" },
  { name: "Capital Enterprises", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24EBRPP1161B1ZT" },
  { name: "CHAUDHARY ELECTRONICS", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Chaudhary Enterprise (LIMBAYAT)", city: "SURAT", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24AVSPC9765H2Z1" },
  { name: "Conifur Furniture Studio Llp", city: "SURAT", area: "Palanpur Patiya", group: "Sundry Debtors-Electronics", gstin: "24AAUFC1266C1ZM" },
  { name: "Cool Zone Enterprise", city: "SURAT", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "24MPRPS2500D1ZS" },
  { name: "Creative Agency", city: "Jamnagar", area: "JAMNAGAR", group: "Sundry Debtors-Electronics", gstin: "24BMBPP6115M1ZY" },
  { name: "Creative Furniture", city: "SURAT", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24AMYPP6085G1ZC" },
  { name: "Gronext Future Private Limited", city: "SURAT", area: "Khatodora", group: "Sundry Debtors-Electronics", gstin: "24AACCR7643B1ZO" },
  { name: "Gujarat Mobile Limited", city: "SURAT", area: "Varachha Road", group: "Sundry Debtors-Electronics", gstin: "24AAMCG8185H1Z6" },
  { name: "Hari Om Super And Electronics", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Hariom Infotech", city: "SURAT", area: "BHATAR", group: "Sundry Debtors-Electronics", gstin: "24APUPP3553J1ZC" },
  { name: "Heem Refrigeration", city: "Navsari", area: "Navsari", group: "Sundry Debtors-Electronics", gstin: "24AJCPM6862F1Z8" },
  { name: "Hemali Traders(NAVSARI)", city: "Navsari", area: "Navsari", group: "Sundry Debtors-Electronics", gstin: "24EPTPK0915N1ZE" },
  { name: "Himniram Overseas", city: "SURAT", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "24FIEPK1110E1Z0" },
  { name: "Infinity Mobile And Electronics", city: "SURAT", area: "NAVAGAM", group: "Sundry Debtors-Electronics", gstin: "24IKWPK7086L1Z1" },
  { name: "Jay Sachchidanand Mobile & Electronic Money Transfer", city: "SURAT", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24DMCPS7323M1ZO" },
  { name: "Jeet Sales & Service", city: "SURAT", area: "Palgam", group: "Sundry Debtors-Electronics", gstin: "24AYHPP0385Q1ZT" },
  { name: "Jyot Enterprise", city: "SURAT", area: "SURAT", group: "Sundry Debtors-Electronics", gstin: "24CSKPK2347A1Z4" },
  { name: "K K  Communication", city: "SURAT", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24BKXPS0028J1ZR" },
  { name: "K K Ceramic And Sanitary", city: "SURAT", area: "PARVAT PATIYA", group: "Sundry Debtors-Electronics", gstin: "24AXXPG0765G1Z9" },
  { name: "KESHAV SUREKA", city: "SURAT", area: "New City", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Korvia Retail Pvt Ltd", city: "SURAT", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24AAMCK6288R1ZH" },
  { name: "KRISHNA ELECTRONICS-DINDOLI", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Laser Vision", city: "SURAT", area: "BEGUMPURA", group: "Sundry Debtors-Electronics", gstin: "24AAAFL9380N1ZV" },
  { name: "M K Refrigeretion", city: "Bharuch", area: "Bharuch", group: "Sundry Debtors-Electronics", gstin: "24ADHPP9540L1Z3" },
  { name: "M M Service Point", city: "BHAVNAGAR", area: "BHAVNAGAR", group: "Sundry Debtors-Electronics", gstin: "24AARFM6329H1ZZ" },
  { name: "M.R.And Sons", city: "SURAT", area: "Bardoli", group: "Sundry Debtors-Electronics", gstin: "24AADFM8778Q1ZD" },
  { name: "M/s Ramanti Furniture And Electronics", city: "SURAT", area: "HAJIRA", group: "Sundry Debtors-Electronics", gstin: "24AEJPN2168R1ZV" },
  { name: "Maa Bhavani Mobile And Electronics", city: "SURAT", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AIIPJ0812H1ZP" },
  { name: "Maa Electricals", city: "SURAT", area: "ADAJAN", group: "Sundry Debtors-Electronics", gstin: "24AVUPP9879R2ZU" },
  { name: "Maa Laxmi Electronics & Mobile", city: "SURAT", area: "GODADRA", group: "Sundry Debtors-Electronics", gstin: "24CIZPR5935C1ZQ" },
  { name: "Mahaveer Mobile & Electronics", city: "SURAT", area: "NANA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24CEEPP9301K1ZD" },
  { name: "Meer Creation", city: "SURAT", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24BCMPM2219L1ZG" },
  { name: "Metro Super Market", city: "SURAT", area: "MOTA VARACHA", group: "Sundry Debtors-Electronics", gstin: "24AXGPN5817P1ZX" },
  { name: "Mobile Sansar & Electronics", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24BEFPR2229E1ZR" },
  { name: "Mukesh Creation", city: "Ahmedabad", area: "Ahemdabad", group: "Sundry Debtors-Electronics", gstin: "24ATIPK7531K1ZH" },
  { name: "Nakoda Electronics And Mobile-SAYAN", city: "Sayan", area: "Sayan", group: "Sundry Debtors-Electronics", gstin: "24BOVPS9981N1ZH" },
  { name: "New Hira Electronics", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24KHVPK0462G1Z0" },
  { name: "New Light House", city: "SURAT", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24AAWPJ4282F1ZG" },
  { name: "Power Electro Service", city: "SURAT", area: "RANDER", group: "Sundry Debtors-Electronics", gstin: "24AYFPP1483R1ZS" },
  { name: "Pujya Sales Corporation(SUMEET)", city: "Ahmedabad", area: "Ahemdabad", group: "Sundry Debtors-Electronics", gstin: "24ANDPJ2253N1Z0" },
  { name: "R V Sales", city: "SURAT", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24BCNPG2370P1Z9" },
  { name: "Rajshree Electronics", city: "SURAT", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24AZXPS5048N1ZC" },
  { name: "Raju Electronics", city: "SURAT", area: "RANDER", group: "Sundry Debtors-Electronics", gstin: "24ABWPJ1707C1ZW" },
  { name: "SAGUNA ENTERPRICE", city: "Olpad", area: "Olpad", group: "Sundry Debtors-Electronics", gstin: "24AHRPP3886B1Z1" },
  { name: "Sahyog Electronics", city: "SURAT", area: "PUNAGAM", group: "Sundry Debtors-Electronics", gstin: "24BFBPJ0471F1ZZ" },
  { name: "Sajal Electronics", city: "SURAT", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24AASPL3412H1ZS" },
  { name: "Samta Furniture & Electronics", city: "SURAT", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24CQLPJ9049P1Z0" },
  { name: "Sanwariya Sales-Bamroli", city: "SURAT", area: "PANDESARA", group: "Sundry Debtors-Electronics", gstin: "24BMJPG2966H1ZZ" },
  { name: "Shankar Lal & Sons", city: "Central Delhi", area: "DELHI", group: "Sundry Debtors-Electronics", gstin: "07AATPH0490E1ZP" },
  { name: "Shivam Electronics(JOLVA)", city: "SURAT", area: "JOLWA", group: "Sundry Debtors-Electronics", gstin: "24BKSPS4879N1ZX" },
  { name: "Shivam Electronics-Kamrej", city: "SURAT", area: "kamrej", group: "Sundry Debtors-Electronics", gstin: "24BWFPA2432Q1ZL" },
  { name: "Shivam Mall", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24FXCPS8166P1ZJ" },
  { name: "Shree Chandraji Mobile & Electronics", city: "SURAT", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24BWVPR1787B1Z3" },
  { name: "Shree Laxmi Mobile", city: "SURAT", area: "NAVAGAM", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Shree Laxmi Mobile Repairing Centre", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24BXGPG4702F1ZY" },
  { name: "Shree Nakoda Mattress", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AUEPG6401D1ZB" },
  { name: "Shree Parshwanath Enterprise", city: "Vadodara", area: "VADODARA", group: "Sundry Debtors-Electronics", gstin: "24ABBFS0407P1Z7" },
  { name: "Shree Radhe Sequence", city: "SURAT", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AKVPD9198B1ZT" },
  { name: "Shree Sai Electric And Electronics Sales And Srevice", city: "SURAT", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24BGNPP3376G1Z3" },
  { name: "Shree Sai Electronics (Chalthan)", city: "Chalthan", area: "CHALTHAN", group: "Sundry Debtors-Electronics", gstin: "24AAVPD8989Q2ZD" },
  { name: "SHREENATH SALES AND SERVICE", city: "SURAT", area: "BAMROLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Shri Bahucharaji Enterprise", city: "SURAT", area: "KATARGAM", group: "Sundry Debtors-Electronics", gstin: "24AXAPN4214A1Z9" },
  { name: "Shri Krishna Mobile And Electronics", city: "SURAT", area: "UDHANA", group: "Sundry Debtors-Electronics", gstin: "24AEDPS0600R1ZF" },
  { name: "Shubham Refrigeration", city: "SURAT", area: "Jahangirpura", group: "Sundry Debtors-Electronics", gstin: "24ACCFS1533Q1ZX" },
  { name: "SUVARNA ELECTRONIC", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "" },
  { name: "Take Home Electronics", city: "SURAT", area: "L H ROAD", group: "Sundry Debtors-Electronics", gstin: "24AHGPS9619E1Z4" },
  { name: "Takehome Sales(MINI BAZAR)", city: "SURAT", area: "Varachha", group: "Sundry Debtors-Electronics", gstin: "24AGUPS7528M1ZF" },
  { name: "Tamanna Enterprise", city: "SURAT", area: "LIMBAYAT", group: "Sundry Debtors-Electronics", gstin: "24AMQPG6330D1ZB" },
  { name: "Vandan Sales", city: "SURAT", area: "BHATAR", group: "Sundry Debtors-Electronics", gstin: "24AIEPS5738D1Z9" },
  { name: "VIRAT SALES", city: "SURAT", area: "DINDOLI", group: "Sundry Debtors-Electronics", gstin: "24AAXFV9198F1Z7" },
  { name: "Yuvraj Sales", city: "SURAT", area: "SACHIN", group: "Sundry Debtors-Electronics", gstin: "24AVJPS2086G1ZD" }
];

export const MOCK_AGENCIES: Agency[] = NEW_PARTY_MASTERS.map((p, idx) => {
  const zone = resolveZoneForAreaAndCity(p.area, p.city);
  return {
    id: `a_pty_${(idx + 1).toString().padStart(3, '0')}`,
    agency_code: `AG-ELC-${(idx + 1).toString().padStart(3, '0')}`,
    agency_name: p.name,
    company_id: idx % 2 === 0 ? 'c06' : 'c07',
    area_name: p.area,
    city: p.city,
    gstin: p.gstin,
    gst_number: p.gstin,
    account_group: p.group,
    credit_limit: 250000 + ((idx * 1500) % 250000),
    zone_id: zone.id,
    zone_name: zone.zone_name,
    zone_region: zone.region
  };
});

export const MOCK_AGENCY_FINANCIALS: Record<string, AgencyFinancials> = {
  'a0111111-1111-1111-1111-111111111111': {
    agency_id: 'a0111111-1111-1111-1111-111111111111',
    outstanding_amount: 125000,
    overdue_amount: 35000,
    advance_amount: 20000,
    oldest_overdue_days: 18
  },
  'a0222222-2222-2222-2222-222222222222': {
    agency_id: 'a0222222-2222-2222-2222-222222222222',
    outstanding_amount: 480000,
    overdue_amount: 120000,
    advance_amount: 0,
    oldest_overdue_days: 45
  }
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    company_id: 'c01',
    product_code: 'PRY-BUT-01',
    product_name: 'Priyagold Butter Delite 100g',
    pcs_per_box: 24,
    unit_price: 25.00,
    mrp_price: 30.00,
    stock_box_qty: 150,
    stock_loose_pcs: 12,
    total_stock_pcs: 3612,
    reserved_stock_pcs: 120
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    company_id: 'c01',
    product_code: 'PRY-CNC-02',
    product_name: 'Priyagold CNC Crackers 150g',
    pcs_per_box: 24,
    unit_price: 30.00,
    mrp_price: 35.00,
    stock_box_qty: 200,
    stock_loose_pcs: 0,
    total_stock_pcs: 4800,
    reserved_stock_pcs: 180
  },
  {
    id: 'f3333333-3333-3333-3333-333333333333',
    company_id: 'c09',
    product_code: 'MOG-LYC-300',
    product_name: 'Mogu Mogu Lychee Juice 300ml',
    pcs_per_box: 24,
    unit_price: 65.00,
    mrp_price: 75.00,
    stock_box_qty: 85,
    stock_loose_pcs: 8,
    total_stock_pcs: 2048,
    reserved_stock_pcs: 48
  },
  {
    id: 'f4444444-4444-4444-4444-444444444444',
    company_id: 'c11',
    product_code: 'WAI-EXP-70',
    product_name: 'Waiwai Express Masala Noodles 70g',
    pcs_per_box: 30,
    unit_price: 15.00,
    mrp_price: 20.00,
    stock_box_qty: 320,
    stock_loose_pcs: 15,
    total_stock_pcs: 9615,
    reserved_stock_pcs: 90
  },
  {
    id: 'f6666666-6666-6666-6666-666666666666',
    company_id: 'c06',
    product_code: 'WPL-REF-265L',
    product_name: 'Whirlpool 265L Frost-Free Double Door Refrigerator',
    pcs_per_box: 1,
    unit_price: 24500.00,
    mrp_price: 28900.00,
    stock_box_qty: 30,
    stock_loose_pcs: 0,
    total_stock_pcs: 30,
    reserved_stock_pcs: 8
  }
];

export const updateProductStockAndDetails = (
  productId: string, 
  updated: {
    product_name?: string;
    product_code?: string;
    pcs_per_box?: number;
    unit_price?: number;
    mrp_price?: number;
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
  if (updated.unit_price !== undefined) prod.unit_price = Number(updated.unit_price);
  
  if (updated.mrp_price !== undefined && Number(updated.mrp_price) !== (prod.mrp_price || 0)) {
    const oldMrp = prod.mrp_price || Math.round(prod.unit_price * 1.15);
    const newMrp = Number(updated.mrp_price);
    
    prod.previous_mrp = oldMrp;
    prod.mrp_price = newMrp;
    prod.mrp_updated_at = new Date().toISOString();
    prod.mrp_updated_by = updated.updated_by || 'Dispatch Manager';
    
    if (!prod.mrp_history) {
      prod.mrp_history = [];
    }
    
    prod.mrp_history.unshift({
      previous_mrp: oldMrp,
      new_mrp: newMrp,
      updated_at: new Date().toISOString(),
      updated_by: updated.updated_by || 'Dispatch Manager',
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
  unit_price: number;
  mrp_price?: number;
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
    unit_price: Number(newProd.unit_price),
    mrp_price: Number(newProd.mrp_price || newProd.unit_price * 1.15),
    stock_box_qty: boxQty,
    stock_loose_pcs: loosePcs,
    total_stock_pcs: boxQty * pcsPerBox + loosePcs,
    reserved_stock_pcs: 0
  };

  MOCK_PRODUCTS.unshift(productRecord);
  return productRecord;
};

export const generateNewBarcodeSKUCode = (companyIdOrCode?: string, productName?: string): string => {
  const company = MOCK_COMPANIES.find(c => c.id === companyIdOrCode || c.company_code === companyIdOrCode);
  const brandCode = company?.company_code || (companyIdOrCode ? companyIdOrCode.substring(0, 3).toUpperCase() : 'SKU');
  
  const p3 = productName && productName.trim()
    ? productName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() 
    : 'GEN';
    
  const random8Digits = Math.floor(89010000 + Math.random() * 89999);
  return `BAR-${brandCode}-${p3}-${random8Digits}`;
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
  const agencyCode = newAgencyData.agency_code?.trim() || `AG-${(newAgencyData.city || 'SUR').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const agencyRecord: Agency = {
    id: `a_pty_${Date.now()}`,
    company_id: newAgencyData.company_id || 'c01',
    agency_code: agencyCode,
    agency_name: newAgencyData.agency_name.trim(),
    city: newAgencyData.city.trim(),
    area_name: (newAgencyData.area_name || newAgencyData.city).trim(),
    gstin: newAgencyData.gstin?.trim() || '',
    gst_number: newAgencyData.gstin?.trim() || '',
    account_group: newAgencyData.account_group || 'Sundry Debtors-Electronics',
    contact_person: newAgencyData.contact_person?.trim() || 'Owner',
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
    assigned_salesperson: newAgencyData.assigned_salesperson?.trim() || 'Chirag Patel',
    active: true
  };

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

  return agency;
};

export const MOCK_HOLD_REASONS: HoldReason[] = [
  { id: 'eb000000-0000-0000-0000-000000000000', reason_code: 'SUPER_ADMIN_EXECUTIVE_HOLD', reason_description: 'Super Admin Executive Hold (Chirag / Harshad Direct Directive)' },
  { id: 'eb111111-1111-1111-1111-111111111111', reason_code: 'OVERDUE_PAYMENT', reason_description: 'Overdue Payment Pending' },
  { id: 'eb222222-2222-2222-2222-222222222222', reason_code: 'CREDIT_LIMIT_EXCEEDED', reason_description: 'Credit Limit Exceeded' },
  { id: 'eb333333-3333-3333-3333-333333333333', reason_code: 'ADVANCE_REQUIRED', reason_description: 'Advance Payment Required' },
  { id: 'eb444444-4444-4444-4444-444444444444', reason_code: 'PRICE_APPROVAL_PENDING', reason_description: 'Price / Scheme Approval Pending' },
  { id: 'eb555555-5555-5555-5555-555555555555', reason_code: 'DOCUMENT_ISSUE', reason_description: 'Document / GST Compliance Issue' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    order_number: 'PRG-08082026-001',
    order_date: '2026-08-05 10:30',
    company_id: 'c01',
    company_name: 'Pringod (Priyagold)',
    agency_id: 'a0111111-1111-1111-1111-111111111111',
    agency_name: 'Krishna Trading Agency',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Delhi NCR Territory',
    salesperson_id: 'u24',
    salesperson_name: 'Shailendra',
    asm_id: 'u12',
    status: 'SUBMITTED',
    total_box_qty: 10,
    total_loose_pcs: 5,
    total_qty_pcs: 245,
    total_amount: 6125.00,
    remarks: 'Urgent delivery requested for festivity stock',
    delivery_type: 'F.O.R',
    items: [
      {
        id: 'PRG-08082026-001/PRY-1',
        order_id: 'b1111111-1111-1111-1111-111111111111',
        product_id: 'f1111111-1111-1111-1111-111111111111',
        product_name: 'Priyagold Butter Delite 100g',
        pcs_per_box: 24,
        box_qty: 10,
        loose_pcs: 5,
        total_qty_pcs: 245,
        unit_price: 25.00,
        total_price: 6125.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 245,
        remark: 'Urgent festivity packing'
      }
    ]
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    order_number: 'DKN-08082026-002',
    order_date: '2026-08-06 14:15',
    company_id: 'c07',
    company_name: 'Daikin',
    agency_id: 'a0222222-2222-2222-2222-222222222222',
    agency_name: 'Apex Distributors Pvt Ltd',
    area_id: 'a2222222-2222-2222-2222-222222222222',
    area_name: 'Mumbai Metro Region',
    salesperson_id: 'u31',
    salesperson_name: 'Taral',
    asm_id: 'u18',
    status: 'APPROVED',
    approved_by_name: 'Chirag Patel (System Admin)',
    approved_at: '2026-08-08 14:30',
    total_box_qty: 10,
    total_loose_pcs: 0,
    total_qty_pcs: 10,
    total_amount: 385000.00,
    remarks: 'Commercial air conditioner order',
    delivery_type: 'Self Pickup',
    items: [
      {
        id: 'DKN-08082026-002/DKN-1',
        order_id: 'b2222222-2222-2222-2222-222222222222',
        product_id: 'f5555555-5555-5555-5555-555555555555',
        product_name: 'Daikin 1.5 Ton 5-Star Inverter Split AC',
        pcs_per_box: 1,
        box_qty: 10,
        loose_pcs: 0,
        total_qty_pcs: 10,
        unit_price: 38500.00,
        total_price: 385000.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 10,
        remark: 'Includes installation kit'
      }
    ]
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    order_number: 'MOG-08082026-003',
    order_date: '2026-08-07 09:20',
    company_id: 'c09',
    company_name: 'Mogu Mogu',
    agency_id: 'a0333333-3333-3333-3333-333333333333',
    agency_name: 'Star Retail Logistics',
    area_id: 'a3333333-3333-3333-3333-333333333333',
    area_name: 'Bangalore Urban Area',
    salesperson_id: 'u30',
    salesperson_name: 'Sagar',
    asm_id: 'u20',
    status: 'SUBMITTED',
    total_box_qty: 30,
    total_loose_pcs: 0,
    total_qty_pcs: 720,
    total_amount: 46800.00,
    remarks: 'Beverage retail distribution',
    delivery_type: 'F.O.R',
    items: [
      {
        id: 'MOG-08082026-003/MOG-1',
        order_id: 'b3333333-3333-3333-3333-333333333333',
        product_id: 'f3333333-3333-3333-3333-333333333333',
        product_name: 'Mogu Mogu Lychee Juice 300ml',
        pcs_per_box: 24,
        box_qty: 30,
        loose_pcs: 0,
        total_qty_pcs: 720,
        unit_price: 65.00,
        total_price: 46800.00,
        dispatched_qty_pcs: 0,
        pending_qty_pcs: 720,
        remark: 'Keep refrigerated'
      }
    ]
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    order_number: 'WAI-08082026-004',
    order_date: '2026-08-07 11:45',
    company_id: 'c11',
    company_name: 'Waiwai',
    agency_id: 'a0444444-4444-4444-4444-444444444444',
    agency_name: 'Ranjeet Enterprise',
    area_id: 'a1111111-1111-1111-1111-111111111111',
    area_name: 'Ahmedabad West',
    salesperson_id: 'u22',
    salesperson_name: 'Keyur (Waiwai)',
    asm_id: 'u22',
    status: 'DISPATCHED',
    total_box_qty: 40,
    total_loose_pcs: 0,
    total_qty_pcs: 1200,
    total_amount: 18000.00,
    remarks: 'Dispatched via Transporter RJ-14-GA-9022',
    delivery_type: 'F.O.R',
    items: [
      {
        id: 'WAI-08082026-004/WAI-1',
        order_id: 'b4444444-4444-4444-4444-444444444444',
        product_id: 'f4444444-4444-4444-4444-444444444444',
        product_name: 'Waiwai Express Masala Noodles 70g',
        pcs_per_box: 30,
        box_qty: 40,
        loose_pcs: 0,
        total_qty_pcs: 1200,
        unit_price: 15.00,
        total_price: 18000.00,
        dispatched_qty_pcs: 1200,
        pending_qty_pcs: 0,
        remark: 'Fully dispatched'
      }
    ]
  }
];
