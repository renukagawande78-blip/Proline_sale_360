import { AreaMaster, ZoneMaster, ZoneName, AreaTypeMaster } from '../types';

export interface PincodeEntry {
  pincode: string;
  zone_name: ZoneName;
  zone_code: string;
  region_type: string;
  region: 'Surat City' | 'Surat Rural' | 'City' | 'Rural' | 'Other';
  covered_areas: string;
  review_highlight?: string;
}

export interface RawAreaEntry {
  area_name: string;
  zone_name: ZoneName;
  region: 'Surat City' | 'Surat Rural' | 'City' | 'Rural' | 'Other';
  city: string;
  zone_code: string;
  pincode?: string;
}

export interface ResolvedOfficialZone {
  zoneName: ZoneName;
  zoneCode: string;
  region: 'Surat City' | 'Surat Rural' | 'City' | 'Rural' | 'Other';
  matchedArea: string;
  isExactMatch: boolean;
}

/**
 * 94 Official South Gujarat Pincodes with full Zone & Locality Master
 */
export const OFFICIAL_PINCODE_MASTER: PincodeEntry[] = [
  {
    "pincode": "395004",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Mini Bazar, A.K. Road, Katargam, Ved Road, Fulpada",
    "review_highlight": ""
  },
  {
    "pincode": "395006",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Nana Varachha, Hirabaug, Kapodra, Varachha",
    "review_highlight": ""
  },
  {
    "pincode": "395008",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Ashwanikumar, L.H. Road, AK Road",
    "review_highlight": ""
  },
  {
    "pincode": "395013",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Mota Varachha, Abrama, Sudama Chowk",
    "review_highlight": ""
  },
  {
    "pincode": "394107",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Amroli, Chhaprabhatha, Kosad",
    "review_highlight": ""
  },
  {
    "pincode": "395002",
    "zone_name": "City-B",
    "zone_code": "ZN-CTB",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Begampura, Delhi Gate, Ring Road Market Touch",
    "review_highlight": ""
  },
  {
    "pincode": "395010",
    "zone_name": "City-B",
    "zone_code": "ZN-CTB",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Textile Market, Ring Road Market, Bombay Market, Sahara Darwaja",
    "review_highlight": ""
  },
  {
    "pincode": "395011",
    "zone_name": "City-B",
    "zone_code": "ZN-CTB",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Saroli, Vraj Chowk, Puna Kumbharia, Bharat Cancer Hospital Rd",
    "review_highlight": ""
  },
  {
    "pincode": "395012",
    "zone_name": "City-B",
    "zone_code": "ZN-CTB",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Parvat Patiya, Puna Gam, Dumbhal",
    "review_highlight": ""
  },
  {
    "pincode": "395014",
    "zone_name": "City-B",
    "zone_code": "ZN-CTB",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Yogi Chowk, Simada, Punagam Extended",
    "review_highlight": ""
  },
  {
    "pincode": "395001",
    "zone_name": "City-C",
    "zone_code": "ZN-CTC",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Chowk Bazar, Nanpura, Gopipura, Bhagal",
    "review_highlight": ""
  },
  {
    "pincode": "395003",
    "zone_name": "City-C",
    "zone_code": "ZN-CTC",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Station Road, Old City, Mahidharpura, Haripura",
    "review_highlight": ""
  },
  {
    "pincode": "395005",
    "zone_name": "City-C",
    "zone_code": "ZN-CTC",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Rander, Jahangirpura, Morabhagal, Jahangirabad",
    "review_highlight": ""
  },
  {
    "pincode": "395009",
    "zone_name": "City-C",
    "zone_code": "ZN-CTC",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Adajan, Pal, Anand Mahal Road, Honey Park Road, Gaurav Path",
    "review_highlight": ""
  },
  {
    "pincode": "394510",
    "zone_name": "City-C",
    "zone_code": "ZN-CTC",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Hazira, Mora, Damka, Bhatpore GIDC, Kawas",
    "review_highlight": ""
  },
  {
    "pincode": "394210",
    "zone_name": "City-D",
    "zone_code": "ZN-CTD",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Udhna, Udhna Teen Rasta, Udhna Udhyognagar",
    "review_highlight": ""
  },
  {
    "pincode": "394211",
    "zone_name": "City-D",
    "zone_code": "ZN-CTD",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Dindoli, Karadva, Godadara Road",
    "review_highlight": ""
  },
  {
    "pincode": "394221",
    "zone_name": "City-D",
    "zone_code": "ZN-CTD",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Pandesara, Pandesara GIDC, Bamroli",
    "review_highlight": ""
  },
  {
    "pincode": "394230",
    "zone_name": "City-D",
    "zone_code": "ZN-CTD",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Sachin, Sachin GIDC, Unn",
    "review_highlight": ""
  },
  {
    "pincode": "395007",
    "zone_name": "City-E",
    "zone_code": "ZN-CTE",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Vesu, VIP Road, Someshwar Enclave, Althan Canal Rd",
    "review_highlight": ""
  },
  {
    "pincode": "395017",
    "zone_name": "City-E",
    "zone_code": "ZN-CTE",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Althan, Sarsana, Surat International Exhibition Centre (SIECC), Bhatar",
    "review_highlight": ""
  },
  {
    "pincode": "395023",
    "zone_name": "City-E",
    "zone_code": "ZN-CTE",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "New City Light, Citylight, Ghod Dod Road, Parle Point",
    "review_highlight": ""
  },
  {
    "pincode": "396001",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Valsad Head Post Office, Tithal Road, Valsad Town",
    "review_highlight": ""
  },
  {
    "pincode": "396002",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Valsad Abrama, R.M.S.",
    "review_highlight": ""
  },
  {
    "pincode": "396050",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Dharampur Town & Rural",
    "review_highlight": ""
  },
  {
    "pincode": "396105",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bhilad, Sarigam Crossing",
    "review_highlight": ""
  },
  {
    "pincode": "396125",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Pardi, Killa Pardi",
    "review_highlight": ""
  },
  {
    "pincode": "396130",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Sanjan, Sanjan Port Belt",
    "review_highlight": ""
  },
  {
    "pincode": "396155",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Sarigam GIDC, Sarigam Coastal",
    "review_highlight": ""
  },
  {
    "pincode": "396170",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Umbergaon Town, Umbergaon Sanjan Road",
    "review_highlight": ""
  },
  {
    "pincode": "396171",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Umbergaon GIDC Industrial Estate",
    "review_highlight": ""
  },
  {
    "pincode": "396191",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Vapi Town, Chala, Vapi Market",
    "review_highlight": ""
  },
  {
    "pincode": "396195",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Vapi Industrial Estate (GIDC Phase 1-4)",
    "review_highlight": ""
  },
  {
    "pincode": "396210",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Daman (Nani Daman)",
    "review_highlight": ""
  },
  {
    "pincode": "396215",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Daman (Moti Daman)",
    "review_highlight": ""
  },
  {
    "pincode": "396220",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Daman Industrial Area, Kadaiya, Somnath",
    "review_highlight": ""
  },
  {
    "pincode": "396230",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Silvassa Town, Dadra and Nagar Haveli",
    "review_highlight": ""
  },
  {
    "pincode": "396235",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Silvassa Industrial (Amli, Naroli, Masat, Piparia)",
    "review_highlight": ""
  },
  {
    "pincode": "394315",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Palsana, Palsana Cross Road",
    "review_highlight": ""
  },
  {
    "pincode": "394325",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kadodara, Tatithaiya, NH-48 Junction",
    "review_highlight": ""
  },
  {
    "pincode": "394730",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Waghai (Dang Entrance / Hill Route)",
    "review_highlight": ""
  },
  {
    "pincode": "396321",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bilimora, Desra, Gandevi Link",
    "review_highlight": ""
  },
  {
    "pincode": "396445",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navsari Town, Lunsikui, Dudhia Talav",
    "review_highlight": "NAVSARI ADDED – CONFIRM"
  },
  {
    "pincode": "396450",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navsari Station, Vijalpore, Jalalpore, Eru Char Rasta",
    "review_highlight": "NAVSARI ADDED – CONFIRM"
  },
  {
    "pincode": "396521",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Chikhli, Navsari Town, Navsari",
    "review_highlight": "NAVSARI ADDED – CONFIRM"
  },
  {
    "pincode": "396580",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Vansda, Unai Route",
    "review_highlight": ""
  },
  {
    "pincode": "394160",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Mandvi (Surat Rural), Tadkeshwar",
    "review_highlight": ""
  },
  {
    "pincode": "394305",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Jolwa, Chalthan, Chalthan Sugar Factory",
    "review_highlight": ""
  },
  {
    "pincode": "394340",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Madhi, Madhi Sugar Mill Area",
    "review_highlight": ""
  },
  {
    "pincode": "394601",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bardoli, Sardar Baug, Ten, Baben",
    "review_highlight": ""
  },
  {
    "pincode": "394630",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Karcheliya, Mahuva Link",
    "review_highlight": ""
  },
  {
    "pincode": "394650",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Vyara, Tapi District Headquarters",
    "review_highlight": ""
  },
  {
    "pincode": "394670",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Songadh, Fort Songadh, Ukai Dam",
    "review_highlight": ""
  },
  {
    "pincode": "425418",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navapur (Tapi-Maharashtra Border Junction)",
    "review_highlight": ""
  },
  {
    "pincode": "392001",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bharuch City, Station Road, Maktampur",
    "review_highlight": ""
  },
  {
    "pincode": "392012",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bharuch Zadeshwar, Bholav, NH-48",
    "review_highlight": ""
  },
  {
    "pincode": "393001",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Ankleshwar City, Old Town",
    "review_highlight": ""
  },
  {
    "pincode": "393002",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Ankleshwar GIDC Industrial Area",
    "review_highlight": ""
  },
  {
    "pincode": "394110",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kim, Kim Char Rasta, Kudsad",
    "review_highlight": ""
  },
  {
    "pincode": "394115",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Pipodara GIDC, Mangrol Industrial Belt",
    "review_highlight": ""
  },
  {
    "pincode": "394130",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Sayan, Sayan Sugar, Delad",
    "review_highlight": ""
  },
  {
    "pincode": "394180",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kosamba, Kosamba R.S., Tarsadi",
    "review_highlight": ""
  },
  {
    "pincode": "394185",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kamrej, Kamrej Char Rasta, NH-48 Bypass",
    "review_highlight": ""
  },
  {
    "pincode": "394540",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Olpad, Sayan-Olpad State Highway",
    "review_highlight": ""
  },
  {
    "pincode": "388540",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kamrej",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "393900",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Katargam",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394010",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Varachha, Mota Varachha, Nana Varachha",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394017",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Amroli",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394101",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Mota Varachha, Nana Varachha, Varachha",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394105",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Amroli, Mota Varachha",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394111",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kim",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394120",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kosamba",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394155",
    "zone_name": "North",
    "zone_code": "ZN-NOR",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kamrej",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394224",
    "zone_name": "City-C",
    "zone_code": "ZN-CTC",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Old City",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394235",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Palsana",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394240",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Karcheliya",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394310",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Gangadhara, Kadodara, Palsana",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394317",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Palsana",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394327",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Kadodara",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394345",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bardoli",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394520",
    "zone_name": "City-A",
    "zone_code": "ZN-CTA",
    "region_type": "Surat City",
    "region": "Surat City",
    "covered_areas": "Amroli",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "394602",
    "zone_name": "East",
    "zone_code": "ZN-EAS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bardoli",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396024",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Pardi",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396150",
    "zone_name": "Upper South",
    "zone_code": "ZN-UPS",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Sanjan",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396310",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Amalsad",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396325",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bilimora",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396360",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Amalsad, Chikhli, Gandevi",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396370",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bilimora",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396380",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Bilimora",
    "review_highlight": "NEW PINCODE – CONFIRM"
  },
  {
    "pincode": "396421",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navsari Town, Navsari",
    "review_highlight": "NEW PINCODE + NAVSARI – CONFIRM"
  },
  {
    "pincode": "396424",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navsari Town, Navsari",
    "review_highlight": "NEW PINCODE + NAVSARI – CONFIRM"
  },
  {
    "pincode": "396427",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navsari Town, Navsari",
    "review_highlight": "NEW PINCODE + NAVSARI – CONFIRM"
  },
  {
    "pincode": "396436",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Navsari Town, Navsari",
    "review_highlight": "NEW PINCODE + NAVSARI – CONFIRM"
  },
  {
    "pincode": "396540",
    "zone_name": "South",
    "zone_code": "ZN-SOU",
    "region_type": "South Gujarat Rural",
    "region": "Surat Rural",
    "covered_areas": "Chikhli, Navsari Town, Navsari",
    "review_highlight": "NEW PINCODE + NAVSARI – CONFIRM"
  }
];

export const OFFICIAL_ZONE_DEFINITIONS: {
  zone_name: ZoneName;
  zone_code: string;
  region: 'Surat City' | 'Surat Rural' | 'City' | 'Rural' | 'Other';
  description: string;
}[] = [
  { zone_name: 'City-A', zone_code: 'ZN-CTA', region: 'Surat City', description: 'Surat City North-East Diamond & Varachha Corridor (Varachha, Katargam, Amroli, Mota Varachha)' },
  { zone_name: 'City-B', zone_code: 'ZN-CTB', region: 'Surat City', description: 'Surat City East Textile Market & Puna Belt (Textile Market, Bombay Market, Puna, Yogichowk, Saroli)' },
  { zone_name: 'City-C', zone_code: 'ZN-CTC', region: 'Surat City', description: 'Surat City Central & West Old City / Adajan Belt (Station Road, Nanpura, Adajan, Rander, Hazira)' },
  { zone_name: 'City-D', zone_code: 'ZN-CTD', region: 'Surat City', description: 'Surat City South Industrial & Udhana / Sachin Belt (Udhana, Dindoli, Pandesara, Sachin, Unn, Bamroli)' },
  { zone_name: 'City-E', zone_code: 'ZN-CTE', region: 'Surat City', description: 'Surat City South-West Modern Retail & Vesu / VIP Road (Vesu, VIP Road, Althan, Citylight, Parle Point)' },
  { zone_name: 'Upper South', zone_code: 'ZN-UPS', region: 'Surat Rural', description: 'South Gujarat Industrial Belt (Vapi, Valsad, Daman, Silvassa, Pardi, Umbergaon, Dharampur)' },
  { zone_name: 'South', zone_code: 'ZN-SOU', region: 'Surat Rural', description: 'South Highway Corridor (Navsari, Bilimora, Chikhli, Kadodara, Palsana, Waghai, Vansda)' },
  { zone_name: 'East', zone_code: 'ZN-EAS', region: 'Surat Rural', description: 'East Agricultural & Town Belt (Bardoli, Vyara, Songadh, Mandvi, Madhi, Karcheliya, Navapur)' },
  { zone_name: 'North', zone_code: 'ZN-NOR', region: 'Surat Rural', description: 'North Chemical & Industrial Belt (Bharuch, Ankleshwar, Kamrej, Kim, Kosamba, Sayan, Olpad)' },
  { zone_name: 'Other Z', zone_code: 'ZN-OTH', region: 'Other', description: 'Out-of-Surat & Pan-India Consignments (Ahmedabad, Vadodara, Rajkot, Mumbai, Outstation)' }
];

export const RAW_OFFICIAL_AREAS: RawAreaEntry[] = [
  {
    "area_name": "Mini Bazar",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395004"
  },
  {
    "area_name": "A.K. Road",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395004"
  },
  {
    "area_name": "Katargam",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395004"
  },
  {
    "area_name": "Ved Road",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395004"
  },
  {
    "area_name": "Fulpada",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395004"
  },
  {
    "area_name": "Nana Varachha",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "Hirabaug",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "Kapodra",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "Varachha",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "Ashwanikumar",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395008"
  },
  {
    "area_name": "L.H. Road",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395008"
  },
  {
    "area_name": "AK Road",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395008"
  },
  {
    "area_name": "Mota Varachha",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395013"
  },
  {
    "area_name": "Abrama",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395013"
  },
  {
    "area_name": "Sudama Chowk",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395013"
  },
  {
    "area_name": "Amroli",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "394107"
  },
  {
    "area_name": "Chhaprabhatha",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "394107"
  },
  {
    "area_name": "Kosad",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "394107"
  },
  {
    "area_name": "Begampura",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "Delhi Gate",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "Ring Road Market Touch",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "Textile Market",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Ring Road Market",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Bombay Market",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Sahara Darwaja",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Saroli",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395011"
  },
  {
    "area_name": "Vraj Chowk",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395011"
  },
  {
    "area_name": "Puna Kumbharia",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395011"
  },
  {
    "area_name": "Bharat Cancer Hospital Rd",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395011"
  },
  {
    "area_name": "Parvat Patiya",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395012"
  },
  {
    "area_name": "Puna Gam",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395012"
  },
  {
    "area_name": "Dumbhal",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395012"
  },
  {
    "area_name": "Yogi Chowk",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395014"
  },
  {
    "area_name": "Simada",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395014"
  },
  {
    "area_name": "Punagam Extended",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395014"
  },
  {
    "area_name": "Chowk Bazar",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "Nanpura",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "Gopipura",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "Bhagal",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "Station Road",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Old City",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Mahidharpura",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Haripura",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Rander",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395005"
  },
  {
    "area_name": "Jahangirpura",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395005"
  },
  {
    "area_name": "Morabhagal",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395005"
  },
  {
    "area_name": "Jahangirabad",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395005"
  },
  {
    "area_name": "Adajan",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "Pal",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "Anand Mahal Road",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "Honey Park Road",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "Gaurav Path",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "Hazira",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Mora",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Damka",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Bhatpore GIDC",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Kawas",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Udhna",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "Udhna Teen Rasta",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "Udhna Udhyognagar",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "Dindoli",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394211"
  },
  {
    "area_name": "Karadva",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394211"
  },
  {
    "area_name": "Godadara Road",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394211"
  },
  {
    "area_name": "Pandesara",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394221"
  },
  {
    "area_name": "Pandesara GIDC",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394221"
  },
  {
    "area_name": "Bamroli",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394221"
  },
  {
    "area_name": "Sachin",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394230"
  },
  {
    "area_name": "Sachin GIDC",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394230"
  },
  {
    "area_name": "Unn",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTD",
    "pincode": "394230"
  },
  {
    "area_name": "Vesu",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "VIP Road",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "Someshwar Enclave",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "Althan Canal Rd",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "Althan",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395017"
  },
  {
    "area_name": "Sarsana",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395017"
  },
  {
    "area_name": "Surat International Exhibition Centre (SIECC)",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395017"
  },
  {
    "area_name": "Bhatar",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395017"
  },
  {
    "area_name": "New City Light",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395023"
  },
  {
    "area_name": "Citylight",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395023"
  },
  {
    "area_name": "Ghod Dod Road",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395023"
  },
  {
    "area_name": "Parle Point",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTE",
    "pincode": "395023"
  },
  {
    "area_name": "Valsad Head Post Office",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Valsad Head Post Office",
    "zone_code": "ZN-UPS",
    "pincode": "396001"
  },
  {
    "area_name": "Tithal Road",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Tithal Road",
    "zone_code": "ZN-UPS",
    "pincode": "396001"
  },
  {
    "area_name": "Valsad Town",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Valsad Town",
    "zone_code": "ZN-UPS",
    "pincode": "396001"
  },
  {
    "area_name": "Valsad Abrama",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Valsad Abrama",
    "zone_code": "ZN-UPS",
    "pincode": "396002"
  },
  {
    "area_name": "R.M.S.",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "R.M.S.",
    "zone_code": "ZN-UPS",
    "pincode": "396002"
  },
  {
    "area_name": "Dharampur Town & Rural",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Dharampur Town & Rural",
    "zone_code": "ZN-UPS",
    "pincode": "396050"
  },
  {
    "area_name": "Bhilad",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Bhilad",
    "zone_code": "ZN-UPS",
    "pincode": "396105"
  },
  {
    "area_name": "Sarigam Crossing",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Sarigam Crossing",
    "zone_code": "ZN-UPS",
    "pincode": "396105"
  },
  {
    "area_name": "Pardi",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Pardi",
    "zone_code": "ZN-UPS",
    "pincode": "396125"
  },
  {
    "area_name": "Killa Pardi",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Killa Pardi",
    "zone_code": "ZN-UPS",
    "pincode": "396125"
  },
  {
    "area_name": "Sanjan",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Sanjan",
    "zone_code": "ZN-UPS",
    "pincode": "396130"
  },
  {
    "area_name": "Sanjan Port Belt",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Sanjan Port Belt",
    "zone_code": "ZN-UPS",
    "pincode": "396130"
  },
  {
    "area_name": "Sarigam GIDC",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Sarigam GIDC",
    "zone_code": "ZN-UPS",
    "pincode": "396155"
  },
  {
    "area_name": "Sarigam Coastal",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Sarigam Coastal",
    "zone_code": "ZN-UPS",
    "pincode": "396155"
  },
  {
    "area_name": "Umbergaon Town",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Umbergaon Town",
    "zone_code": "ZN-UPS",
    "pincode": "396170"
  },
  {
    "area_name": "Umbergaon Sanjan Road",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Umbergaon Sanjan Road",
    "zone_code": "ZN-UPS",
    "pincode": "396170"
  },
  {
    "area_name": "Umbergaon GIDC Industrial Estate",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Umbergaon GIDC Industrial Estate",
    "zone_code": "ZN-UPS",
    "pincode": "396171"
  },
  {
    "area_name": "Vapi Town",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Vapi Town",
    "zone_code": "ZN-UPS",
    "pincode": "396191"
  },
  {
    "area_name": "Chala",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Chala",
    "zone_code": "ZN-UPS",
    "pincode": "396191"
  },
  {
    "area_name": "Vapi Market",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Vapi Market",
    "zone_code": "ZN-UPS",
    "pincode": "396191"
  },
  {
    "area_name": "Vapi Industrial Estate (GIDC Phase 1-4)",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Vapi Industrial Estate (GIDC Phase 1-4)",
    "zone_code": "ZN-UPS",
    "pincode": "396195"
  },
  {
    "area_name": "Daman (Nani Daman)",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Daman (Nani Daman)",
    "zone_code": "ZN-UPS",
    "pincode": "396210"
  },
  {
    "area_name": "Daman (Moti Daman)",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Daman (Moti Daman)",
    "zone_code": "ZN-UPS",
    "pincode": "396215"
  },
  {
    "area_name": "Daman Industrial Area",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Daman Industrial Area",
    "zone_code": "ZN-UPS",
    "pincode": "396220"
  },
  {
    "area_name": "Kadaiya",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Kadaiya",
    "zone_code": "ZN-UPS",
    "pincode": "396220"
  },
  {
    "area_name": "Somnath",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Somnath",
    "zone_code": "ZN-UPS",
    "pincode": "396220"
  },
  {
    "area_name": "Silvassa Town",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Silvassa Town",
    "zone_code": "ZN-UPS",
    "pincode": "396230"
  },
  {
    "area_name": "Dadra and Nagar Haveli",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Dadra and Nagar Haveli",
    "zone_code": "ZN-UPS",
    "pincode": "396230"
  },
  {
    "area_name": "Silvassa Industrial (Amli",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Silvassa Industrial (Amli",
    "zone_code": "ZN-UPS",
    "pincode": "396235"
  },
  {
    "area_name": "Naroli",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Naroli",
    "zone_code": "ZN-UPS",
    "pincode": "396235"
  },
  {
    "area_name": "Masat",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Masat",
    "zone_code": "ZN-UPS",
    "pincode": "396235"
  },
  {
    "area_name": "Piparia)",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Piparia)",
    "zone_code": "ZN-UPS",
    "pincode": "396235"
  },
  {
    "area_name": "Palsana",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Palsana",
    "zone_code": "ZN-SOU",
    "pincode": "394315"
  },
  {
    "area_name": "Palsana Cross Road",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Palsana Cross Road",
    "zone_code": "ZN-SOU",
    "pincode": "394315"
  },
  {
    "area_name": "Kadodara",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Kadodara",
    "zone_code": "ZN-SOU",
    "pincode": "394325"
  },
  {
    "area_name": "Tatithaiya",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Tatithaiya",
    "zone_code": "ZN-SOU",
    "pincode": "394325"
  },
  {
    "area_name": "NH-48 Junction",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "NH-48 Junction",
    "zone_code": "ZN-SOU",
    "pincode": "394325"
  },
  {
    "area_name": "Waghai (Dang Entrance / Hill Route)",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Waghai (Dang Entrance / Hill Route)",
    "zone_code": "ZN-SOU",
    "pincode": "394730"
  },
  {
    "area_name": "Bilimora",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Bilimora",
    "zone_code": "ZN-SOU",
    "pincode": "396321"
  },
  {
    "area_name": "Desra",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Desra",
    "zone_code": "ZN-SOU",
    "pincode": "396321"
  },
  {
    "area_name": "Gandevi Link",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Gandevi Link",
    "zone_code": "ZN-SOU",
    "pincode": "396321"
  },
  {
    "area_name": "Navsari Town",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Navsari Town",
    "zone_code": "ZN-SOU",
    "pincode": "396445"
  },
  {
    "area_name": "Lunsikui",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Lunsikui",
    "zone_code": "ZN-SOU",
    "pincode": "396445"
  },
  {
    "area_name": "Dudhia Talav",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Dudhia Talav",
    "zone_code": "ZN-SOU",
    "pincode": "396445"
  },
  {
    "area_name": "Navsari Station",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Navsari Station",
    "zone_code": "ZN-SOU",
    "pincode": "396450"
  },
  {
    "area_name": "Vijalpore",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Vijalpore",
    "zone_code": "ZN-SOU",
    "pincode": "396450"
  },
  {
    "area_name": "Jalalpore",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Jalalpore",
    "zone_code": "ZN-SOU",
    "pincode": "396450"
  },
  {
    "area_name": "Eru Char Rasta",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Eru Char Rasta",
    "zone_code": "ZN-SOU",
    "pincode": "396450"
  },
  {
    "area_name": "Chikhli",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Chikhli",
    "zone_code": "ZN-SOU",
    "pincode": "396521"
  },
  {
    "area_name": "Navsari",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Navsari",
    "zone_code": "ZN-SOU",
    "pincode": "396521"
  },
  {
    "area_name": "Vansda",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Vansda",
    "zone_code": "ZN-SOU",
    "pincode": "396580"
  },
  {
    "area_name": "Unai Route",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Unai Route",
    "zone_code": "ZN-SOU",
    "pincode": "396580"
  },
  {
    "area_name": "Mandvi (Surat Rural)",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Mandvi (Surat Rural)",
    "zone_code": "ZN-EAS",
    "pincode": "394160"
  },
  {
    "area_name": "Tadkeshwar",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Tadkeshwar",
    "zone_code": "ZN-EAS",
    "pincode": "394160"
  },
  {
    "area_name": "Jolwa",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Jolwa",
    "zone_code": "ZN-EAS",
    "pincode": "394305"
  },
  {
    "area_name": "Chalthan",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Chalthan",
    "zone_code": "ZN-EAS",
    "pincode": "394305"
  },
  {
    "area_name": "Chalthan Sugar Factory",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Chalthan Sugar Factory",
    "zone_code": "ZN-EAS",
    "pincode": "394305"
  },
  {
    "area_name": "Madhi",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Madhi",
    "zone_code": "ZN-EAS",
    "pincode": "394340"
  },
  {
    "area_name": "Madhi Sugar Mill Area",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Madhi Sugar Mill Area",
    "zone_code": "ZN-EAS",
    "pincode": "394340"
  },
  {
    "area_name": "Bardoli",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Bardoli",
    "zone_code": "ZN-EAS",
    "pincode": "394601"
  },
  {
    "area_name": "Sardar Baug",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Sardar Baug",
    "zone_code": "ZN-EAS",
    "pincode": "394601"
  },
  {
    "area_name": "Ten",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Ten",
    "zone_code": "ZN-EAS",
    "pincode": "394601"
  },
  {
    "area_name": "Baben",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Baben",
    "zone_code": "ZN-EAS",
    "pincode": "394601"
  },
  {
    "area_name": "Karcheliya",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Karcheliya",
    "zone_code": "ZN-EAS",
    "pincode": "394630"
  },
  {
    "area_name": "Mahuva Link",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Mahuva Link",
    "zone_code": "ZN-EAS",
    "pincode": "394630"
  },
  {
    "area_name": "Vyara",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Vyara",
    "zone_code": "ZN-EAS",
    "pincode": "394650"
  },
  {
    "area_name": "Tapi District Headquarters",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Tapi District Headquarters",
    "zone_code": "ZN-EAS",
    "pincode": "394650"
  },
  {
    "area_name": "Songadh",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Songadh",
    "zone_code": "ZN-EAS",
    "pincode": "394670"
  },
  {
    "area_name": "Fort Songadh",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Fort Songadh",
    "zone_code": "ZN-EAS",
    "pincode": "394670"
  },
  {
    "area_name": "Ukai Dam",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Ukai Dam",
    "zone_code": "ZN-EAS",
    "pincode": "394670"
  },
  {
    "area_name": "Navapur (Tapi-Maharashtra Border Junction)",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Navapur (Tapi-Maharashtra Border Junction)",
    "zone_code": "ZN-EAS",
    "pincode": "425418"
  },
  {
    "area_name": "Bharuch City",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Bharuch City",
    "zone_code": "ZN-NOR",
    "pincode": "392001"
  },
  {
    "area_name": "Maktampur",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Maktampur",
    "zone_code": "ZN-NOR",
    "pincode": "392001"
  },
  {
    "area_name": "Bharuch Zadeshwar",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Bharuch Zadeshwar",
    "zone_code": "ZN-NOR",
    "pincode": "392012"
  },
  {
    "area_name": "Bholav",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Bholav",
    "zone_code": "ZN-NOR",
    "pincode": "392012"
  },
  {
    "area_name": "NH-48",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "NH-48",
    "zone_code": "ZN-NOR",
    "pincode": "392012"
  },
  {
    "area_name": "Ankleshwar City",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Ankleshwar City",
    "zone_code": "ZN-NOR",
    "pincode": "393001"
  },
  {
    "area_name": "Old Town",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Old Town",
    "zone_code": "ZN-NOR",
    "pincode": "393001"
  },
  {
    "area_name": "Ankleshwar GIDC Industrial Area",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Ankleshwar GIDC Industrial Area",
    "zone_code": "ZN-NOR",
    "pincode": "393002"
  },
  {
    "area_name": "Kim",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kim",
    "zone_code": "ZN-NOR",
    "pincode": "394110"
  },
  {
    "area_name": "Kim Char Rasta",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kim Char Rasta",
    "zone_code": "ZN-NOR",
    "pincode": "394110"
  },
  {
    "area_name": "Kudsad",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kudsad",
    "zone_code": "ZN-NOR",
    "pincode": "394110"
  },
  {
    "area_name": "Pipodara GIDC",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Pipodara GIDC",
    "zone_code": "ZN-NOR",
    "pincode": "394115"
  },
  {
    "area_name": "Mangrol Industrial Belt",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Mangrol Industrial Belt",
    "zone_code": "ZN-NOR",
    "pincode": "394115"
  },
  {
    "area_name": "Sayan",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Sayan",
    "zone_code": "ZN-NOR",
    "pincode": "394130"
  },
  {
    "area_name": "Sayan Sugar",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Sayan Sugar",
    "zone_code": "ZN-NOR",
    "pincode": "394130"
  },
  {
    "area_name": "Delad",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Delad",
    "zone_code": "ZN-NOR",
    "pincode": "394130"
  },
  {
    "area_name": "Kosamba",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kosamba",
    "zone_code": "ZN-NOR",
    "pincode": "394180"
  },
  {
    "area_name": "Kosamba R.S.",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kosamba R.S.",
    "zone_code": "ZN-NOR",
    "pincode": "394180"
  },
  {
    "area_name": "Tarsadi",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Tarsadi",
    "zone_code": "ZN-NOR",
    "pincode": "394180"
  },
  {
    "area_name": "Kamrej",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kamrej",
    "zone_code": "ZN-NOR",
    "pincode": "394185"
  },
  {
    "area_name": "Kamrej Char Rasta",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Kamrej Char Rasta",
    "zone_code": "ZN-NOR",
    "pincode": "394185"
  },
  {
    "area_name": "NH-48 Bypass",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "NH-48 Bypass",
    "zone_code": "ZN-NOR",
    "pincode": "394185"
  },
  {
    "area_name": "Olpad",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Olpad",
    "zone_code": "ZN-NOR",
    "pincode": "394540"
  },
  {
    "area_name": "Sayan-Olpad State Highway",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Sayan-Olpad State Highway",
    "zone_code": "ZN-NOR",
    "pincode": "394540"
  },
  {
    "area_name": "Gangadhara",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Gangadhara",
    "zone_code": "ZN-SOU",
    "pincode": "394310"
  },
  {
    "area_name": "Amalsad",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Amalsad",
    "zone_code": "ZN-SOU",
    "pincode": "396310"
  },
  {
    "area_name": "Gandevi",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Gandevi",
    "zone_code": "ZN-SOU",
    "pincode": "396360"
  },
  {
    "area_name": "Lalgate",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "GODADRA",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "SHILVER CHOWK",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Khatodora",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "L H ROAD",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "Oldcity",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "New City",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "BEGUMPURA",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "YOGICHOWK",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "valsad",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "valsad",
    "zone_code": "ZN-UPS",
    "pincode": "396001"
  },
  {
    "area_name": "MOTA VARACHA",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "394101"
  },
  {
    "area_name": "PUNAGAM",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "BHIMRAD",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "Palanpur Patiya",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "SALABATPURA",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "PARVAT GAM",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Varachha Road",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "MOHAN NI CHAL",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "NAVAPUR",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "NAVAPUR",
    "zone_code": "ZN-EAS",
    "pincode": "425418"
  },
  {
    "area_name": "LALDARWAJA",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Umbergoan",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Umbergaon",
    "zone_code": "ZN-UPS",
    "pincode": "396171"
  },
  {
    "area_name": "PUNA KUMBHARIYA",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Mini Bazar(Surat)",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "NANA VARACHA",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395013"
  },
  {
    "area_name": "SARTHANA",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395013"
  },
  {
    "area_name": "NAVAGAM",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "LIMBAYAT",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "Palgam",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Sumuldairy",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "KARGIL CHOWK",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Palanpur Jakatnaka",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395005"
  },
  {
    "area_name": "Bharuch",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Bharuch",
    "zone_code": "ZN-NOR",
    "pincode": "393002"
  },
  {
    "area_name": "Velenja",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "SURAT",
    "zone_code": "ZN-NOR",
    "pincode": "394130"
  },
  {
    "area_name": "SURAT",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "A K ROAD",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "BHESTAN",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTE",
    "pincode": "395023"
  },
  {
    "area_name": "RUSTAMPURA",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "Station",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394230"
  },
  {
    "area_name": "HAJIRA",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Deladava",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "-",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394230"
  },
  {
    "area_name": "CANAL ROAD",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395010"
  },
  {
    "area_name": "Parle-Point",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "KOSMADA",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395013"
  },
  {
    "area_name": "UDHANA",
    "zone_name": "City-D",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTD",
    "pincode": "394210"
  },
  {
    "area_name": "Lala Daewaja",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Pasodara",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "SURAT",
    "zone_code": "ZN-NOR",
    "pincode": "394185"
  },
  {
    "area_name": "Umra",
    "zone_name": "City-E",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTE",
    "pincode": "395007"
  },
  {
    "area_name": "ICHCHHAPORE",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Chikhali",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Navsari",
    "zone_code": "ZN-SOU",
    "pincode": "396521"
  },
  {
    "area_name": "UDHNA DARWAJA",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "OLDCITY-SURAT",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "SAGRAMPURA",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "Silvassa",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Dadra And Nagar Haveli",
    "zone_code": "ZN-UPS",
    "pincode": "396230"
  },
  {
    "area_name": "Ring Road",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "HIRABAUGH",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "ATHWALINES",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395001"
  },
  {
    "area_name": "PIPLOD",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "Surat",
    "zone_code": "ZN-CTC",
    "pincode": "395009"
  },
  {
    "area_name": "Vapi",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Vapi",
    "zone_code": "ZN-UPS",
    "pincode": "396195"
  },
  {
    "area_name": "Buhari",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Buhari",
    "zone_code": "ZN-EAS",
    "pincode": "394630"
  },
  {
    "area_name": "WAGHAI",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "WAGHAI",
    "zone_code": "ZN-SOU",
    "pincode": "394730"
  },
  {
    "area_name": "JAMALPORE",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "Navsari",
    "zone_code": "ZN-SOU",
    "pincode": "396445"
  },
  {
    "area_name": "Ankleshwer",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "Ankleshwer",
    "zone_code": "ZN-NOR",
    "pincode": "393002"
  },
  {
    "area_name": "MOTA PONDA",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "valsad",
    "zone_code": "ZN-UPS",
    "pincode": "396191"
  },
  {
    "area_name": "DAMAN",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Daman",
    "zone_code": "ZN-UPS",
    "pincode": "396210"
  },
  {
    "area_name": "ZAMPA BAZAR",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "DABHOLI",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395004"
  },
  {
    "area_name": "TIGHRA",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "TIGHRA",
    "zone_code": "ZN-SOU",
    "pincode": "396445"
  },
  {
    "area_name": "TEXTILE MKT.",
    "zone_name": "City-B",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTB",
    "pincode": "395002"
  },
  {
    "area_name": "Mandvi",
    "zone_name": "East",
    "region": "Surat Rural",
    "city": "Mandvi",
    "zone_code": "ZN-EAS",
    "pincode": "394160"
  },
  {
    "area_name": "Dharampur",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Dharampur",
    "zone_code": "ZN-UPS",
    "pincode": "396050"
  },
  {
    "area_name": "NEWCITY",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "394510"
  },
  {
    "area_name": "Rampura",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395003"
  },
  {
    "area_name": "Kosmba",
    "zone_name": "North",
    "region": "Surat Rural",
    "city": "SURAT",
    "zone_code": "ZN-NOR",
    "pincode": "394120"
  },
  {
    "area_name": "Bheshan",
    "zone_name": "City-C",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTC",
    "pincode": "395005"
  },
  {
    "area_name": "Sarigam",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Sarigam",
    "zone_code": "ZN-UPS",
    "pincode": "396105"
  },
  {
    "area_name": "VARACHA",
    "zone_name": "City-A",
    "region": "Surat City",
    "city": "SURAT",
    "zone_code": "ZN-CTA",
    "pincode": "395006"
  },
  {
    "area_name": "NIYOL",
    "zone_name": "South",
    "region": "Surat Rural",
    "city": "NIYOL",
    "zone_code": "ZN-SOU",
    "pincode": "394325"
  },
  {
    "area_name": "Amli (Silvassa)",
    "zone_name": "Upper South",
    "region": "Surat Rural",
    "city": "Silvassa",
    "zone_code": "ZN-UPS",
    "pincode": "396230"
  }
];

export const OFFICIAL_AREAS_MASTER: AreaMaster[] = RAW_OFFICIAL_AREAS.map((raw, idx) => ({
  id: `ar_off_${(idx + 1).toString().padStart(3, '0')}`,
  area_code: `AR-${(raw.zone_code.replace('ZN-', '') || 'LOC')}-${(idx + 1).toString().padStart(3, '0')}`,
  area_name: raw.area_name,
  city: raw.city,
  zone_code: raw.zone_name,
  region: raw.region,
  description: `${raw.zone_name} Zone • ${raw.region} Sector${raw.pincode ? ' (PIN: ' + raw.pincode + ')' : ''}`,
  created_at: new Date('2026-09-01T00:00:00Z').toISOString()
}));

export const OFFICIAL_ZONE_MASTERS: ZoneMaster[] = OFFICIAL_ZONE_DEFINITIONS.map((def) => {
  const matchingAreas = RAW_OFFICIAL_AREAS
    .filter(a => a.zone_name === def.zone_name)
    .map(a => a.area_name);

  return {
    id: `zn_${def.zone_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
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
    type_name: 'Surat City',
    description: 'Surat Municipal Corporation (SMC) Core Urban & Semi-Urban Belts',
    delivery_sla: 'Same Day / 24 Hours',
    default_vehicle_mode: 'E-Rickshaw / Mini Tempo (Tata Ace)',
    associated_zones: ['City-A', 'City-B', 'City-C', 'City-D', 'City-E'],
    localities_count: RAW_OFFICIAL_AREAS.filter(a => a.region === 'Surat City' || a.region === 'City').length,
    active: true,
    created_at: new Date('2026-09-01T00:00:00Z').toISOString()
  },
  {
    id: 'art_rural',
    type_code: 'AT-RURAL',
    type_name: 'Surat Rural',
    description: 'South Gujarat Industrial Corridor & District Sub-Divisions (Vapi, Navsari, Bharuch, Bardoli)',
    delivery_sla: '24 to 48 Hours Scheduled Route',
    default_vehicle_mode: 'Medium Commercial Vehicle (Eicher / 407)',
    associated_zones: ['Upper South', 'South', 'East', 'North'],
    localities_count: RAW_OFFICIAL_AREAS.filter(a => a.region === 'Surat Rural' || a.region === 'Rural').length,
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
    .replace(/\s+/g, ' ');
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
      return { zoneName: 'Upper South', zoneCode: 'ZN-UPS', region: 'Surat Rural', matchedArea: cityName || 'Upper South', isExactMatch: true };
    }
    if (cleanCity.includes('navsari') || cleanCity.includes('bilimora') || cleanCity.includes('chikhli')) {
      return { zoneName: 'South', zoneCode: 'ZN-SOU', region: 'Surat Rural', matchedArea: cityName || 'South', isExactMatch: true };
    }
    if (cleanCity.includes('bardoli') || cleanCity.includes('vyara') || cleanCity.includes('songadh') || cleanCity.includes('mandvi')) {
      return { zoneName: 'East', zoneCode: 'ZN-EAS', region: 'Surat Rural', matchedArea: cityName || 'East', isExactMatch: true };
    }
    if (cleanCity.includes('bharuch') || cleanCity.includes('ankleshwar') || cleanCity.includes('kamrej') || cleanCity.includes('kim')) {
      return { zoneName: 'North', zoneCode: 'ZN-NOR', region: 'Surat Rural', matchedArea: cityName || 'North', isExactMatch: true };
    }
    if (cleanCity.includes('surat')) {
      return { zoneName: 'City-A', zoneCode: 'ZN-CTA', region: 'Surat City', matchedArea: 'Surat', isExactMatch: false };
    }
  }

  return { zoneName: 'Other Z', zoneCode: 'ZN-OTH', region: 'Other', matchedArea: areaName || cityName || 'Outstation', isExactMatch: false };
};

export const resolveZoneForAreaAndCity = (areaName?: string, cityName?: string, pincode?: string): {
  id: string;
  zone_code: string;
  zone_name: ZoneName;
  region: 'Surat City' | 'Surat Rural' | 'City' | 'Rural' | 'Other';
} => {
  const resolved = resolveOfficialZone(areaName, cityName, pincode);
  const def = OFFICIAL_ZONE_DEFINITIONS.find(d => d.zone_name === resolved.zoneName) || OFFICIAL_ZONE_DEFINITIONS[0];

  return {
    id: `zn_${def.zone_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    zone_code: def.zone_code,
    zone_name: def.zone_name,
    region: def.region
  };
};
