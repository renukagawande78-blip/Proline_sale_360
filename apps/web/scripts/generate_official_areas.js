import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(headerLine);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (vals.length === 1 && !vals[0]) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });
    rows.push(obj);
  }
  return { headers, rows };
};

const pincodeCSV = fs.readFileSync('/Users/renukagawande/.gemini/antigravity-ide/brain/74790226-435e-4a59-acb6-b8ccee3b72e9/.user_uploaded/media_1788479630092.csv', 'utf8');
const { rows: pinRows } = parseCSV(pincodeCSV);

const agencyCSV = fs.readFileSync('/Users/renukagawande/.gemini/antigravity-ide/brain/74790226-435e-4a59-acb6-b8ccee3b72e9/.user_uploaded/media_1788479630084.csv', 'utf8');
const { rows: agencyRows } = parseCSV(agencyCSV);

const ZONE_CODES = {
  'City-A': 'ZN-CTA',
  'City-B': 'ZN-CTB',
  'City-C': 'ZN-CTC',
  'City-D': 'ZN-CTD',
  'City-E': 'ZN-CTE',
  'Upper South': 'ZN-UPS',
  'South': 'ZN-SOU',
  'East': 'ZN-EAS',
  'North': 'ZN-NOR',
  'Other Z': 'ZN-OTH'
};

const ZONE_REGIONS = {
  'City-A': 'City',
  'City-B': 'City',
  'City-C': 'City',
  'City-D': 'City',
  'City-E': 'City',
  'Upper South': 'Rural',
  'South': 'Rural',
  'East': 'Rural',
  'North': 'Rural',
  'Other Z': 'Other'
};

const ZONE_DESCRIPTIONS = {
  'City-A': 'Surat City North-East Diamond & Varachha Corridor (Varachha, Katargam, Amroli, Mota Varachha)',
  'City-B': 'Surat City East Textile Market & Puna Belt (Textile Market, Bombay Market, Puna, Yogichowk, Saroli)',
  'City-C': 'Surat City Central & West Old City / Adajan Belt (Station Road, Nanpura, Adajan, Rander, Hazira)',
  'City-D': 'Surat City South Industrial & Udhana / Sachin Belt (Udhana, Dindoli, Pandesara, Sachin, Unn, Bamroli)',
  'City-E': 'Surat City South-West Modern Retail & Vesu / VIP Road (Vesu, VIP Road, Althan, Citylight, Parle Point)',
  'Upper South': 'South Gujarat Industrial Belt (Vapi, Valsad, Daman, Silvassa, Pardi, Umbergaon, Dharampur)',
  'South': 'South Highway Corridor (Navsari, Bilimora, Chikhli, Kadodara, Palsana, Waghai, Vansda)',
  'East': 'East Agricultural & Town Belt (Bardoli, Vyara, Songadh, Mandvi, Madhi, Karcheliya, Navapur)',
  'North': 'North Chemical & Industrial Belt (Bharuch, Ankleshwar, Kamrej, Kim, Kosamba, Sayan, Olpad)',
  'Other Z': 'Out-of-Surat & Pan-India Consignments (Ahmedabad, Vadodara, Rajkot, Mumbai, Outstation)'
};

// Build Pincode Master JSON
const pincodeMasterData = pinRows.map(r => ({
  pincode: r['Pincode'].trim(),
  zone_name: r['Zone'].trim(),
  zone_code: ZONE_CODES[r['Zone'].trim()] || 'ZN-OTH',
  region_type: r['Region_Type'].trim(),
  region: ZONE_REGIONS[r['Zone'].trim()] || 'Other',
  covered_areas: r['Covered_Areas'].trim(),
  review_highlight: r['Review Highlight']?.trim() || ''
}));

// Build unique raw areas by expanding covered areas and agency territories
const rawAreasMap = new Map();

pinRows.forEach(p => {
  const zone = p['Zone'].trim();
  const region = ZONE_REGIONS[zone] || 'City';
  const zone_code = ZONE_CODES[zone] || 'ZN-CTA';
  const areasList = p['Covered_Areas'].split(',').map(s => s.trim()).filter(Boolean);
  
  areasList.forEach(areaName => {
    const key = areaName.toLowerCase();
    if (!rawAreasMap.has(key)) {
      rawAreasMap.set(key, {
        area_name: areaName,
        zone_name: zone,
        region: region,
        city: region === 'City' ? 'Surat' : areaName,
        zone_code: zone_code,
        pincode: p['Pincode'].trim()
      });
    }
  });
});

agencyRows.forEach(a => {
  const areaName = a['Area / Territory']?.trim();
  const cityName = a['City']?.trim() || 'Surat';
  const zone = a['Zone']?.trim() || a['Zone.1']?.trim();
  if (areaName && zone && ZONE_CODES[zone]) {
    const key = areaName.toLowerCase();
    if (!rawAreasMap.has(key)) {
      rawAreasMap.set(key, {
        area_name: areaName,
        zone_name: zone,
        region: ZONE_REGIONS[zone] || 'City',
        city: cityName,
        zone_code: ZONE_CODES[zone],
        pincode: a['Pincode']?.trim() || ''
      });
    }
  }
});

const rawAreasList = Array.from(rawAreasMap.values());

const outputTS = `import { AreaMaster, ZoneMaster, ZoneName, AreaTypeMaster } from '../types';

export interface PincodeEntry {
  pincode: string;
  zone_name: ZoneName;
  zone_code: string;
  region_type: string;
  region: 'City' | 'Rural' | 'Other';
  covered_areas: string;
  review_highlight?: string;
}

export interface RawAreaEntry {
  area_name: string;
  zone_name: ZoneName;
  region: 'City' | 'Rural' | 'Other';
  city: string;
  zone_code: string;
  pincode?: string;
}

export interface ResolvedOfficialZone {
  zoneName: ZoneName;
  zoneCode: string;
  region: 'City' | 'Rural' | 'Other';
  matchedArea: string;
  isExactMatch: boolean;
}

/**
 * 94 Official South Gujarat Pincodes with full Zone & Locality Master
 */
export const OFFICIAL_PINCODE_MASTER: PincodeEntry[] = ${JSON.stringify(pincodeMasterData, null, 2)};

export const OFFICIAL_ZONE_DEFINITIONS: {
  zone_name: ZoneName;
  zone_code: string;
  region: 'City' | 'Rural' | 'Other';
  description: string;
}[] = [
  { zone_name: 'City-A', zone_code: 'ZN-CTA', region: 'City', description: '${ZONE_DESCRIPTIONS['City-A']}' },
  { zone_name: 'City-B', zone_code: 'ZN-CTB', region: 'City', description: '${ZONE_DESCRIPTIONS['City-B']}' },
  { zone_name: 'City-C', zone_code: 'ZN-CTC', region: 'City', description: '${ZONE_DESCRIPTIONS['City-C']}' },
  { zone_name: 'City-D', zone_code: 'ZN-CTD', region: 'City', description: '${ZONE_DESCRIPTIONS['City-D']}' },
  { zone_name: 'City-E', zone_code: 'ZN-CTE', region: 'City', description: '${ZONE_DESCRIPTIONS['City-E']}' },
  { zone_name: 'Upper South', zone_code: 'ZN-UPS', region: 'Rural', description: '${ZONE_DESCRIPTIONS['Upper South']}' },
  { zone_name: 'South', zone_code: 'ZN-SOU', region: 'Rural', description: '${ZONE_DESCRIPTIONS['South']}' },
  { zone_name: 'East', zone_code: 'ZN-EAS', region: 'Rural', description: '${ZONE_DESCRIPTIONS['East']}' },
  { zone_name: 'North', zone_code: 'ZN-NOR', region: 'Rural', description: '${ZONE_DESCRIPTIONS['North']}' },
  { zone_name: 'Other Z', zone_code: 'ZN-OTH', region: 'Other', description: '${ZONE_DESCRIPTIONS['Other Z']}' }
];

export const RAW_OFFICIAL_AREAS: RawAreaEntry[] = ${JSON.stringify(rawAreasList, null, 2)};

export const OFFICIAL_AREAS_MASTER: AreaMaster[] = RAW_OFFICIAL_AREAS.map((raw, idx) => ({
  id: \`ar_off_\${(idx + 1).toString().padStart(3, '0')}\`,
  area_code: \`AR-\${(raw.zone_code.replace('ZN-', '') || 'LOC')}-\${(idx + 1).toString().padStart(3, '0')}\`,
  area_name: raw.area_name,
  city: raw.city,
  zone_code: raw.zone_name,
  region: raw.region,
  description: \`\${raw.zone_name} Zone • \${raw.region} Sector\${raw.pincode ? ' (PIN: ' + raw.pincode + ')' : ''}\`,
  created_at: new Date('2026-09-01T00:00:00Z').toISOString()
}));

export const OFFICIAL_ZONE_MASTERS: ZoneMaster[] = OFFICIAL_ZONE_DEFINITIONS.map((def) => {
  const matchingAreas = RAW_OFFICIAL_AREAS
    .filter(a => a.zone_name === def.zone_name)
    .map(a => a.area_name);

  return {
    id: \`zn_\${def.zone_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}\`,
    zone_code: def.zone_code,
    zone_name: def.zone_name,
    region: def.region,
    major_areas: Array.from(new Set(matchingAreas)),
    description: def.description
  };
});

export const DEFAULT_AREA_TYPES: AreaTypeMaster[] = [
  {
    id: 'art_city',
    type_code: 'AT-CITY',
    type_name: 'City',
    description: 'Surat Municipal Corporation (SMC) Core Urban & Semi-Urban Belts',
    delivery_sla: 'Same Day / 24 Hours',
    default_vehicle_mode: 'E-Rickshaw / Mini Tempo (Tata Ace)',
    associated_zones: ['City-A', 'City-B', 'City-C', 'City-D', 'City-E'],
    localities_count: RAW_OFFICIAL_AREAS.filter(a => a.region === 'City').length,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'art_rural',
    type_code: 'AT-RURAL',
    type_name: 'Rural',
    description: 'South Gujarat Industrial Corridor & District Sub-Divisions (Vapi, Navsari, Bharuch, Bardoli)',
    delivery_sla: '24 to 48 Hours Scheduled Route',
    default_vehicle_mode: 'Medium Commercial Vehicle (Eicher / 407)',
    associated_zones: ['Upper South', 'South', 'East', 'North'],
    localities_count: RAW_OFFICIAL_AREAS.filter(a => a.region === 'Rural').length,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'art_other',
    type_code: 'AT-OTHER',
    type_name: 'Other',
    description: 'Pan-India, Special Economic Zones (SEZ), and Outstation Transport Hubs',
    delivery_sla: '3 to 5 Days Interstate Express / Freight',
    default_vehicle_mode: 'Third-Party Logistics (VRL, TCI, SafeExpress)',
    associated_zones: ['Other Z'],
    localities_count: RAW_OFFICIAL_AREAS.filter(a => a.region === 'Other').length,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  }
];

export const DEFAULT_AREAS_BY_CITY: Record<string, string[]> = {
  Surat: [
    'Katargam', 'Nana Varachha', 'Mota Varachha', 'Amroli', 'Ved Road', 'AK Road', 'Mini Bazar', 'LH Road', 'Hirabaug',
    'Textile Market', 'Bombay Market', 'Parvat Patiya', 'Puna', 'Yogichowk', 'Saroli', 'Vraj Chowk', 'Sahara Darwaja',
    'Station Road', 'Old City', 'Nanpura', 'Bhagal', 'Adajan', 'Rander', 'Pal', 'Hazira', 'Majura Gate',
    'Udhana', 'Dindoli', 'Pandesara', 'Sachin', 'Unn', 'Bamroli', 'Godadara',
    'Vesu', 'VIP Road', 'Althan', 'Sarsana', 'Citylight', 'Parle Point', 'Ghoddod Road'
  ],
  'Surat Rural': ['Kadodara', 'Palsana', 'Kamrej', 'Sayan', 'Kim', 'Olpad', 'Kosamba', 'Jolwa', 'Chalthan', 'Bardoli', 'Mandvi'],
  Navsari: ['Navsari Town', 'Lunsikui', 'Dudhia Talav', 'Navsari Station', 'Vijalpore', 'Jalalpore', 'Eru Char Rasta', 'Chikhli', 'Bilimora', 'Gandevi', 'Amalsad'],
  Valsad: ['Valsad Town', 'Tithal Road', 'Valsad Abrama', 'Dharampur', 'Pardi', 'Killa Pardi', 'Dungri'],
  Vapi: ['Vapi Town', 'Chala', 'Vapi Market', 'Vapi Industrial Estate (GIDC Phase 1-4)', 'Umbergaon', 'Bhilad', 'Sanjan', 'Sarigam'],
  Bharuch: ['Bharuch City', 'Station Road', 'Maktampur', 'Zadeshwar', 'Bholav', 'Ankleshwar City', 'Ankleshwar GIDC'],
  Ankleshwar: ['Ankleshwar City', 'Ankleshwar GIDC', 'Old Town'],
  Bardoli: ['Bardoli Town', 'Sardar Baug', 'Ten', 'Baben', 'Madhi', 'Karcheliya', 'Mahuva'],
  Vyara: ['Vyara Town', 'Tapi District HQ', 'Songadh', 'Fort Songadh', 'Ukai', 'Navapur']
};

export const normalizeAreaName = (input?: string): string => {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\\s+/g, ' ');
};

export const resolveOfficialZone = (areaName?: string, cityName?: string, pincode?: string): ResolvedOfficialZone => {
  // 1. Direct Pincode matching
  if (pincode) {
    const cleanPin = pincode.trim();
    const pinMatch = OFFICIAL_PINCODE_MASTER.find(p => p.pincode === cleanPin);
    if (pinMatch) {
      return {
        zoneName: pinMatch.zone_name,
        zoneCode: pinMatch.zone_code,
        region: pinMatch.region,
        matchedArea: areaName || pinMatch.covered_areas.split(',')[0].trim(),
        isExactMatch: true
      };
    }
  }

  const cleanArea = normalizeAreaName(areaName);
  const cleanCity = normalizeAreaName(cityName);

  // 2. Direct Area matching in RAW_OFFICIAL_AREAS
  if (cleanArea) {
    for (const raw of RAW_OFFICIAL_AREAS) {
      const rawNorm = normalizeAreaName(raw.area_name);
      if (cleanArea === rawNorm) {
        return {
          zoneName: raw.zone_name,
          zoneCode: raw.zone_code,
          region: raw.region,
          matchedArea: raw.area_name,
          isExactMatch: true
        };
      }
    }

    for (const raw of RAW_OFFICIAL_AREAS) {
      const rawNorm = normalizeAreaName(raw.area_name);
      if (cleanArea.length >= 3 && (rawNorm.includes(cleanArea) || cleanArea.includes(rawNorm))) {
        return {
          zoneName: raw.zone_name,
          zoneCode: raw.zone_code,
          region: raw.region,
          matchedArea: raw.area_name,
          isExactMatch: false
        };
      }
    }
  }

  // 3. City fallback matching
  if (cleanCity) {
    if (cleanCity.includes('vapi') || cleanCity.includes('valsad') || cleanCity.includes('daman') || cleanCity.includes('silvassa')) {
      return { zoneName: 'Upper South', zoneCode: 'ZN-UPS', region: 'Rural', matchedArea: cityName || 'Upper South', isExactMatch: true };
    }
    if (cleanCity.includes('navsari') || cleanCity.includes('bilimora') || cleanCity.includes('chikhli')) {
      return { zoneName: 'South', zoneCode: 'ZN-SOU', region: 'Rural', matchedArea: cityName || 'South', isExactMatch: true };
    }
    if (cleanCity.includes('bardoli') || cleanCity.includes('vyara') || cleanCity.includes('songadh') || cleanCity.includes('mandvi')) {
      return { zoneName: 'East', zoneCode: 'ZN-EAS', region: 'Rural', matchedArea: cityName || 'East', isExactMatch: true };
    }
    if (cleanCity.includes('bharuch') || cleanCity.includes('ankleshwar') || cleanCity.includes('kamrej') || cleanCity.includes('kim')) {
      return { zoneName: 'North', zoneCode: 'ZN-NOR', region: 'Rural', matchedArea: cityName || 'North', isExactMatch: true };
    }
    if (cleanCity.includes('surat')) {
      return { zoneName: 'City-A', zoneCode: 'ZN-CTA', region: 'City', matchedArea: 'Surat', isExactMatch: false };
    }
  }

  return { zoneName: 'Other Z', zoneCode: 'ZN-OTH', region: 'Other', matchedArea: areaName || cityName || 'Outstation', isExactMatch: false };
};

export const resolveZoneForAreaAndCity = (areaName?: string, cityName?: string, pincode?: string): {
  id: string;
  zone_code: string;
  zone_name: ZoneName;
  region: 'City' | 'Rural' | 'Other';
} => {
  const resolved = resolveOfficialZone(areaName, cityName, pincode);
  const def = OFFICIAL_ZONE_DEFINITIONS.find(d => d.zone_name === resolved.zoneName) || OFFICIAL_ZONE_DEFINITIONS[0];

  return {
    id: \`zn_\${def.zone_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}\`,
    zone_code: def.zone_code,
    zone_name: def.zone_name,
    region: def.region
  };
};
`;

const targetPath = '/Users/renukagawande/.gemini/antigravity/scratch/proline-oms-360/apps/web/src/data/officialAreasData.ts';
fs.writeFileSync(targetPath, outputTS, 'utf8');
console.log('Successfully generated officialAreasData.ts!');
