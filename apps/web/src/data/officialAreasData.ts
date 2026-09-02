import { AreaMaster, ZoneMaster, ZoneName, AreaTypeMaster } from '../types';

export interface RawAreaEntry {
  area_name: string;
  zone_name: ZoneName;
  region: 'City' | 'Rural' | 'Other';
  city: string;
  zone_code: string;
}

export const OFFICIAL_ZONE_DEFINITIONS: {
  zone_name: ZoneName;
  zone_code: string;
  region: 'City' | 'Rural' | 'Other';
  description: string;
}[] = [
  { zone_name: 'City-A', zone_code: 'ZN-CTA', region: 'City', description: 'Surat City North-East Diamond & Varachha Corridor' },
  { zone_name: 'City-B', zone_code: 'ZN-CTB', region: 'City', description: 'Surat City East Textile Market & Puna Belt' },
  { zone_name: 'City-C', zone_code: 'ZN-CTC', region: 'City', description: 'Surat City Central & West Old City / Adajan Belt' },
  { zone_name: 'City-D', zone_code: 'ZN-CTD', region: 'City', description: 'Surat City South Industrial & Udhana / Sachin Belt' },
  { zone_name: 'City-E', zone_code: 'ZN-CTE', region: 'City', description: 'Surat City South-West Modern Retail & Vesu / VIP Road' },
  { zone_name: 'Upper South', zone_code: 'ZN-UPS', region: 'Rural', description: 'South Gujarat Industrial Belt: Vapi, Valsad, Daman, Silvassa' },
  { zone_name: 'South', zone_code: 'ZN-SOU', region: 'Rural', description: 'South Highway & Navsari, Bilimora, Chikhli Corridor' },
  { zone_name: 'East', zone_code: 'ZN-EAS', region: 'Rural', description: 'East Agricultural & Bardoli, Vyara, Mandavi Belt' },
  { zone_name: 'North', zone_code: 'ZN-NOR', region: 'Rural', description: 'North Chemical & Industrial: Bharuch, Ankleshwar, Kamrej' },
  { zone_name: 'Other Z', zone_code: 'ZN-OTH', region: 'Other', description: 'Out-of-state consignments, Pan-India transport, SEZ, or non-standard custom delivery territories' }
];

export const RAW_OFFICIAL_AREAS: RawAreaEntry[] = [
  // --- City-A (City) ---
  { area_name: 'Mini Bazar', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Hirabaug', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Sarthana', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Nana Varachha', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'AK Road', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Katargam', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Amroli', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Ved Road', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'Mota Varachha', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },
  { area_name: 'LH Road', zone_name: 'City-A', region: 'City', city: 'Surat', zone_code: 'ZN-CTA' },

  // --- City-B (City) ---
  { area_name: 'Parvat Patiya', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Puna', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Yogichowk', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Vraj Chowk', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Saroli', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Sahara Darwaja', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Textile Market', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },
  { area_name: 'Bombay Market', zone_name: 'City-B', region: 'City', city: 'Surat', zone_code: 'ZN-CTB' },

  // --- City-C (City) ---
  { area_name: 'Ring Road', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Majura Gate', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Nanpura', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Bhagal', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Old City', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Adajan', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Rander', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Hazira', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Pal', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },
  { area_name: 'Jangirpura', zone_name: 'City-C', region: 'City', city: 'Surat', zone_code: 'ZN-CTC' },

  // --- City-D (City) ---
  { area_name: 'Udhana', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },
  { area_name: 'Dindoli', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },
  { area_name: 'Godadara', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },
  { area_name: 'Sachin', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },
  { area_name: 'Pandesara', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },
  { area_name: 'Unn', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },
  { area_name: 'Bamroli', zone_name: 'City-D', region: 'City', city: 'Surat', zone_code: 'ZN-CTD' },

  // --- City-E (City) ---
  { area_name: 'New City', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'Ghoddod Road', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'Citylight', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'Parle Point', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'Vesu', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'Althan', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'Sarsana', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },
  { area_name: 'VIP Road', zone_name: 'City-E', region: 'City', city: 'Surat', zone_code: 'ZN-CTE' },

  // --- Upper South (Rural) ---
  { area_name: 'Vapi', zone_name: 'Upper South', region: 'Rural', city: 'Vapi', zone_code: 'ZN-UPS' },
  { area_name: 'Umbergaon', zone_name: 'Upper South', region: 'Rural', city: 'Umbergaon', zone_code: 'ZN-UPS' },
  { area_name: 'Daman', zone_name: 'Upper South', region: 'Rural', city: 'Daman', zone_code: 'ZN-UPS' },
  { area_name: 'Silvassa', zone_name: 'Upper South', region: 'Rural', city: 'Silvassa', zone_code: 'ZN-UPS' },
  { area_name: 'Valsad', zone_name: 'Upper South', region: 'Rural', city: 'Valsad', zone_code: 'ZN-UPS' },
  { area_name: 'Pardi', zone_name: 'Upper South', region: 'Rural', city: 'Pardi', zone_code: 'ZN-UPS' },
  { area_name: 'Sanjan', zone_name: 'Upper South', region: 'Rural', city: 'Sanjan', zone_code: 'ZN-UPS' },
  { area_name: 'Bhilad', zone_name: 'Upper South', region: 'Rural', city: 'Bhilad', zone_code: 'ZN-UPS' },
  { area_name: 'Dharampur', zone_name: 'Upper South', region: 'Rural', city: 'Dharampur', zone_code: 'ZN-UPS' },

  // --- South (Rural) ---
  { area_name: 'Kadodara', zone_name: 'South', region: 'Rural', city: 'Kadodara', zone_code: 'ZN-SOU' },
  { area_name: 'Navsari', zone_name: 'South', region: 'Rural', city: 'Navsari', zone_code: 'ZN-SOU' },
  { area_name: 'Bilimora', zone_name: 'South', region: 'Rural', city: 'Bilimora', zone_code: 'ZN-SOU' },
  { area_name: 'Chikhli', zone_name: 'South', region: 'Rural', city: 'Chikhli', zone_code: 'ZN-SOU' },
  { area_name: 'Vasda', zone_name: 'South', region: 'Rural', city: 'Vasda', zone_code: 'ZN-SOU' },
  { area_name: 'Waghai', zone_name: 'South', region: 'Rural', city: 'Waghai', zone_code: 'ZN-SOU' },
  { area_name: 'Palsana', zone_name: 'South', region: 'Rural', city: 'Palsana', zone_code: 'ZN-SOU' },

  // --- East (Rural) ---
  { area_name: 'Jolwa', zone_name: 'East', region: 'Rural', city: 'Jolwa', zone_code: 'ZN-EAS' },
  { area_name: 'Bardoli', zone_name: 'East', region: 'Rural', city: 'Bardoli', zone_code: 'ZN-EAS' },
  { area_name: 'Mandavi', zone_name: 'East', region: 'Rural', city: 'Mandavi', zone_code: 'ZN-EAS' },
  { area_name: 'Karcheliya', zone_name: 'East', region: 'Rural', city: 'Karcheliya', zone_code: 'ZN-EAS' },
  { area_name: 'Madhi', zone_name: 'East', region: 'Rural', city: 'Madhi', zone_code: 'ZN-EAS' },
  { area_name: 'Vyara', zone_name: 'East', region: 'Rural', city: 'Vyara', zone_code: 'ZN-EAS' },
  { area_name: 'Songadh', zone_name: 'East', region: 'Rural', city: 'Songadh', zone_code: 'ZN-EAS' },
  { area_name: 'Navapur', zone_name: 'East', region: 'Rural', city: 'Navapur', zone_code: 'ZN-EAS' },

  // --- North (Rural) ---
  { area_name: 'Bharuch', zone_name: 'North', region: 'Rural', city: 'Bharuch', zone_code: 'ZN-NOR' },
  { area_name: 'Ankleshwar', zone_name: 'North', region: 'Rural', city: 'Ankleshwar', zone_code: 'ZN-NOR' },
  { area_name: 'Kim', zone_name: 'North', region: 'Rural', city: 'Kim', zone_code: 'ZN-NOR' },
  { area_name: 'Kosamba', zone_name: 'North', region: 'Rural', city: 'Kosamba', zone_code: 'ZN-NOR' },
  { area_name: 'Pipodra', zone_name: 'North', region: 'Rural', city: 'Pipodra', zone_code: 'ZN-NOR' },
  { area_name: 'Kamrej', zone_name: 'North', region: 'Rural', city: 'Kamrej', zone_code: 'ZN-NOR' },
  { area_name: 'Oldpad', zone_name: 'North', region: 'Rural', city: 'Oldpad', zone_code: 'ZN-NOR' },
  { area_name: 'Sayan', zone_name: 'North', region: 'Rural', city: 'Sayan', zone_code: 'ZN-NOR' },

  // --- Other Z (Other) ---
  { area_name: 'Other / Pan-India', zone_name: 'Other Z', region: 'Other', city: 'Outstation', zone_code: 'ZN-OTH' }
];

export const OFFICIAL_AREAS_MASTER: AreaMaster[] = RAW_OFFICIAL_AREAS.map((raw, idx) => ({
  id: `ar_off_${(idx + 1).toString().padStart(3, '0')}`,
  area_code: `AR-${(raw.zone_code.replace('ZN-', '') || 'LOC')}-${(idx + 1).toString().padStart(3, '0')}`,
  area_name: raw.area_name,
  city: raw.city,
  zone_code: raw.zone_name, // Store zone name directly e.g. "City-A", "Upper South"
  region: raw.region,
  description: `${raw.zone_name} Zone • ${raw.region} Locality Sector`,
  created_at: new Date('2026-09-01T00:00:00Z').toISOString()
}));

export const OFFICIAL_ZONE_MASTERS: ZoneMaster[] = OFFICIAL_ZONE_DEFINITIONS.map((def, idx) => {
  const matchingAreas = RAW_OFFICIAL_AREAS
    .filter(a => a.zone_name === def.zone_name)
    .map(a => a.area_name);

  return {
    id: `zn_${def.zone_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    zone_code: def.zone_code,
    zone_name: def.zone_name,
    region: def.region,
    major_areas: matchingAreas,
    description: def.description
  };
});

/**
 * Comprehensive area alias dictionary to map freeform variations, uppercase,
 * common suffixes (Gam, GIDC, Road, Char Rasta) to official canonical areas.
 */
export const AREA_ALIASES: Record<string, string> = {
  // Katargam variations
  'katargam': 'Katargam',
  'katargam gidc': 'Katargam',
  'katargam darwaja': 'Katargam',
  'katargam road': 'Katargam',
  'katargam gam': 'Katargam',

  // Pal variations
  'pal': 'Pal',
  'pal gam': 'Pal',
  'pal village': 'Pal',
  'pal rto': 'Pal',
  'pal road': 'Pal',
  'pal gaam': 'Pal',

  // Varachha variations
  'varachha': 'Nana Varachha',
  'varacha': 'Nana Varachha',
  'varachha road': 'Nana Varachha',
  'nana varachha': 'Nana Varachha',
  'mota varachha': 'Mota Varachha',

  // Adajan variations
  'adajan': 'Adajan',
  'adajan gam': 'Adajan',
  'adajan patia': 'Adajan',
  'adajan road': 'Adajan',
  'pal-adajan': 'Adajan',

  // Udhna variations
  'udhna': 'Udhana',
  'udhana': 'Udhana',
  'udhna teen rasta': 'Udhana',
  'udhna darwaja': 'Udhana',
  'udhna station': 'Udhana',
  'udhna gidc': 'Udhana',

  // Rander variations
  'rander': 'Rander',
  'rander road': 'Rander',
  'rander town': 'Rander',
  'rander gam': 'Rander',

  // Vesu variations
  'vesu': 'Vesu',
  'vesu road': 'Vesu',
  'vesu canal road': 'Vesu',

  // Amroli variations
  'amroli': 'Amroli',
  'amroli char rasta': 'Amroli',
  'amroli bridge': 'Amroli',

  // Godadra
  'godadra': 'Godadara',
  'godadara': 'Godadara',

  // Olpad
  'olpad': 'Oldpad',
  'oldpad': 'Oldpad',
  'olpad town': 'Oldpad',

  // Kosamba
  'kosmba': 'Kosamba',
  'kosamba': 'Kosamba',
  'kosamba town': 'Kosamba',

  // Umbergaon
  'umergaon': 'Umbergaon',
  'umergoan': 'Umbergaon',
  'umbergaon': 'Umbergaon',
  'umar gam': 'Umbergaon',

  // Pandesara
  'pandesara': 'Pandesara',
  'pandesara gidc': 'Pandesara',

  // Sachin
  'sachin': 'Sachin',
  'sachin gidc': 'Sachin',

  // Parvat Patiya
  'parvat patiya': 'Parvat Patiya',
  'parvat patia': 'Parvat Patiya',
  'parvat': 'Parvat Patiya',

  // Althan
  'althan': 'Althan',
  'althan canal road': 'Althan',

  // Bhatar
  'bhatar': 'Bhatar',
  'bhatar road': 'Bhatar',
  'bhatar char rasta': 'Bhatar',

  // Piplod
  'piplod': 'Piplod',
  'piplod main road': 'Piplod',

  // Citylight
  'citylight': 'Citylight',
  'city light': 'Citylight',
  'citylight road': 'Citylight',

  // Parle Point
  'parle point': 'Parle Point',
  'parlepoint': 'Parle Point',

  // Sarthana
  'sarthana': 'Sarthana',
  'sarthana jakatnaka': 'Sarthana',

  // Mini Bazar
  'mini bazar': 'Mini Bazar',
  'minibazar': 'Mini Bazar',

  // Hirabaug
  'hirabaug': 'Hirabaug',
  'hirabag': 'Hirabaug',

  // Ring Road
  'ring road': 'Ring Road',
  'ringroad': 'Ring Road',

  // Majura Gate
  'majura gate': 'Majura Gate',
  'majura': 'Majura Gate',

  // Kamrej
  'kamrej': 'Kamrej',
  'kamrej char rasta': 'Kamrej',

  // Kadodara
  'kadodara': 'Kadodara',
  'kadodara char rasta': 'Kadodara',

  // Bardoli
  'bardoli': 'Bardoli',
  'bardoli town': 'Bardoli',

  // Navsari
  'navsari': 'Navsari',
  'navsari city': 'Navsari',

  // Vapi
  'vapi': 'Vapi',
  'vapi gidc': 'Vapi',
  'vapi town': 'Vapi'
};

/**
 * Normalizes any freeform area input string into a standard canonical title-cased name.
 * Handles uppercase ('KATARGAM' -> 'Katargam'),
 * suffixes ('PAL GAM' -> 'Pal', 'KATARGAM GIDC' -> 'Katargam'),
 * and aliases ('umergaon' -> 'Umbergaon').
 */
export const normalizeAreaName = (rawInput?: string): string => {
  if (!rawInput) return '';
  const clean = rawInput.trim();
  if (!clean || clean.toUpperCase() === 'N/A') return '';

  const lower = clean.toLowerCase();

  // 1. Direct Alias Check
  if (AREA_ALIASES[lower]) {
    return AREA_ALIASES[lower];
  }

  // 2. Suffix stripping (e.g. "PAL GAM" -> "pal", "KATARGAM ROAD" -> "katargam")
  const stripped = lower
    .replace(/\b(gam|gaam|village|road|rd|gidc|town|circle|char rasta|jakatnaka|cross road|gate|market)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped && AREA_ALIASES[stripped]) {
    return AREA_ALIASES[stripped];
  }

  // 3. Exact case-insensitive match against RAW_OFFICIAL_AREAS
  const exact = RAW_OFFICIAL_AREAS.find(item => item.area_name.toLowerCase() === lower || (stripped && item.area_name.toLowerCase() === stripped));
  if (exact) {
    return exact.area_name;
  }

  // 4. Word boundary match against RAW_OFFICIAL_AREAS
  for (const item of RAW_OFFICIAL_AREAS) {
    const target = item.area_name.toLowerCase();
    const regex = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower) || (stripped && regex.test(stripped))) {
      return item.area_name;
    }
  }

  // 5. Default clean Title Casing for custom/new localities
  return clean
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Standard areas organized by City with full canonical coverage
 */
export const DEFAULT_AREAS_BY_CITY: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {
    'Surat': [],
    'Surat Rural': ['Kamrej', 'Bardoli', 'Kadodara', 'Kim', 'Kosamba', 'Mandvi', 'Valod', 'Mahuva', 'Palsana', 'Pasodara', 'Kathor', 'Niyol', 'Kholvad'],
    'Navsari': ['Navsari City', 'Gandevi', 'Chikhli', 'Jalalpore', 'Vansda', 'Bilimora'],
    'Valsad': ['Valsad City', 'Pardi', 'Umbergaon', 'Dharampur', 'Kaprada'],
    'Vapi': ['Vapi GIDC', 'Vapi Town', 'Chanod', 'Dungra', 'Salvav'],
    'Bharuch': ['Bharuch City', 'Jambusar', 'Zagadia', 'Vagra', 'Amod'],
    'Ankleshwar': ['Ankleshwar GIDC', 'Ankleshwar Town', 'Panoli', 'Kosamba'],
    'Bardoli': ['Bardoli Town', 'Mota', 'Valod', 'Buhari', 'Bajipura'],
    'Vyara': ['Vyara Town', 'Songadh', 'Valod', 'Uchchhal']
  };

  RAW_OFFICIAL_AREAS.forEach(item => {
    const city = item.city || 'Surat';
    if (!map[city]) map[city] = [];
    if (!map[city].includes(item.area_name)) {
      map[city].push(item.area_name);
    }
  });

  return map;
})();

/**
 * High-speed resolver to find an area's zone and region from any input text (area name, address, agency name)
 */
export const resolveOfficialZone = (areaOrText?: string, cityOrText?: string): {
  zoneName: string;
  zoneCode: string;
  region: 'City' | 'Rural' | 'Other';
  matchedArea: string;
} => {
  const normalized = normalizeAreaName(areaOrText);
  const normArea = (normalized || areaOrText || '').toLowerCase().trim();
  const normCity = (cityOrText || '').toLowerCase().trim();
  const combined = `${normArea} ${normCity}`;

  if (!combined.trim()) {
    return {
      zoneName: 'City-A',
      zoneCode: 'ZN-CTA',
      region: 'City',
      matchedArea: 'Default'
    };
  }

  // 1. Exact match on normalized area name
  const exact = RAW_OFFICIAL_AREAS.find(item => item.area_name.toLowerCase() === normArea);
  if (exact) {
    return {
      zoneName: exact.zone_name,
      zoneCode: exact.zone_code,
      region: exact.region,
      matchedArea: exact.area_name
    };
  }

  // 2. Direct match with official area list with word boundary (so Pal does not match Palsana)
  for (const item of RAW_OFFICIAL_AREAS) {
    const target = item.area_name.toLowerCase().trim();
    const regex = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normArea) || regex.test(combined)) {
      return {
        zoneName: item.zone_name,
        zoneCode: item.zone_code,
        region: item.region,
        matchedArea: item.area_name
      };
    }
  }

  // 3. Fallback based on city or default to City-A
  return {
    zoneName: 'City-A',
    zoneCode: 'ZN-CTA',
    region: 'City',
    matchedArea: normalized || areaOrText || 'General'
  };
};

export const DEFAULT_AREA_TYPES: AreaTypeMaster[] = [
  {
    id: 'at_city',
    type_code: 'CITY',
    type_name: 'City',
    description: 'Surat Municipal Corporation urban areas, textile markets, and local industrial corridors (City-A through City-E)',
    delivery_sla: 'Within 4-8 Hours (Same Day Delivery)',
    default_vehicle_mode: 'Local Tempo / Van / Chhota Hathi',
    associated_zones: ['City-A', 'City-B', 'City-C', 'City-D', 'City-E'],
    localities_count: 47,
    agency_count: 14,
    active: true
  },
  {
    id: 'at_rural',
    type_code: 'RURAL',
    type_name: 'Rural',
    description: 'South Gujarat highway, outstation, taluka, and industrial belts (Upper South, South, East, North)',
    delivery_sla: 'Within 24-48 Hours (Next Day Delivery)',
    default_vehicle_mode: 'Heavy Vehicle / F.O.R Truck / Dedicated Transport Cargo',
    associated_zones: ['Upper South', 'South', 'East', 'North'],
    localities_count: 28,
    agency_count: 8,
    active: true
  },
  {
    id: 'at_other',
    type_code: 'OTHER',
    type_name: 'Other',
    description: 'Out-of-state consignments, Pan-India transport, SEZ, or non-standard custom delivery territories',
    delivery_sla: 'Within 3-5 Business Days (Freight Transit)',
    default_vehicle_mode: 'Third-Party Logistics / Express Cargo / Air or Rail Cargo',
    associated_zones: ['Other Z'],
    localities_count: 1,
    agency_count: 0,
    active: true
  }
];
