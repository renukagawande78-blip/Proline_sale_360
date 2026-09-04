import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Building2, 
  Map, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Download, 
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Layers,
  Sparkles,
  Store,
  Compass,
  ArrowRight,
  ShieldAlert,
  Zap,
  Hash
} from 'lucide-react';
import { AreaMaster, Agency } from '../../types';
import { 
  fetchAreasFromSupabaseTable, 
  saveAreaToSupabase, 
  deleteAreaFromSupabase, 
  deduplicateAreas, 
  saveAgencyToSupabase,
  supabase
} from '../../lib/supabase';
import { 
  OFFICIAL_ZONE_DEFINITIONS, 
  RAW_OFFICIAL_AREAS, 
  OFFICIAL_AREAS_MASTER, 
  OFFICIAL_PINCODE_MASTER,
  resolveOfficialZone,
  normalizeAreaName
} from '../../data/officialAreasData';
import { useAuth } from '../../context/AuthContext';
import { BulkImportModal } from '../../components/BulkImportModal';

interface AreasMasterViewProps {
  agencies?: Agency[];
  searchQuery?: string;
}

export const AreasMasterView: React.FC<AreasMasterViewProps> = ({ 
  agencies = [], 
  searchQuery: externalSearchQuery = '' 
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN';

  const [areasList, setAreasList] = useState<AreaMaster[]>(OFFICIAL_AREAS_MASTER);
  const [localAgencies, setLocalAgencies] = useState<Agency[]>(agencies);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);

  // Main Tab Navigation: Pincodes, Localities, Zone-wise, City-wise, Region-wise, Mapping Errors
  const [activeMainTab, setActiveMainTab] = useState<'PINCODES' | 'LOCALITIES' | 'ZONE_WISE' | 'CITY_WISE' | 'REGION_WISE' | 'MAPPING_ERRORS'>('PINCODES');
  const [activeRegionFilter, setActiveRegionFilter] = useState<'ALL' | 'City' | 'Rural'>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'ALL' | string>('ALL');
  const [pincodeZoneFilter, setPincodeZoneFilter] = useState<'ALL' | string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Selected Area Drawer for inspecting mapped parties
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Add Area Modal state
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Edit Area Modal state
  const [editingArea, setEditingArea] = useState<AreaMaster | null>(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [editCity, setEditCity] = useState('Surat');
  const [editZoneCode, setEditZoneCode] = useState('City-A');
  const [editRegion, setEditRegion] = useState<'City' | 'Rural' | 'Other'>('City');
  const [editDesc, setEditDesc] = useState('');

  // Add New Area Form state
  const [newAreaName, setNewAreaName] = useState('');
  const [newCity, setNewCity] = useState('Surat');
  const [newZoneCode, setNewZoneCode] = useState('City-A');
  const [newRegion, setNewRegion] = useState<'City' | 'Rural' | 'Other'>('City');
  const [newDesc, setNewDesc] = useState('');

  // Mapping Resolution Modal state for unmapped/mismatched agencies
  const [resolvingAgencyItem, setResolvingAgencyItem] = useState<{
    agency: Agency;
    reason: string;
    matchedArea: AreaMaster | null;
  } | null>(null);
  const [resolveMode, setResolveMode] = useState<'CREATE_IN_MASTER' | 'MAP_EXISTING_AREA'>('CREATE_IN_MASTER');
  const [selectedExistingAreaId, setSelectedExistingAreaId] = useState('');
  const [resolveAreaName, setResolveAreaName] = useState('');
  const [resolveCity, setResolveCity] = useState('Surat');
  const [resolveZoneCode, setResolveZoneCode] = useState('City-A');
  const [resolveRegion, setResolveRegion] = useState<'City' | 'Rural' | 'Other'>('City');

  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  const [isNormalizing, setIsNormalizing] = useState(false);

  useEffect(() => {
    if (agencies && agencies.length > 0) {
      setLocalAgencies(agencies);
      // Auto-discover localities from registered agency master using official zones
      const dynamicAgencyAreas: AreaMaster[] = [];
      agencies.forEach((ag, idx) => {
        const raw = (ag.area_name || '').trim();
        if (raw && raw !== 'N/A') {
          const aName = normalizeAreaName(raw) || raw;
          const resolved = resolveOfficialZone(aName, ag.city);
          dynamicAgencyAreas.push({
            id: `ar_ag_${idx}_${aName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            area_code: `AR-${(ag.city || 'SUR').substring(0, 3).toUpperCase()}-${(idx + 10).toString().padStart(3, '0')}`,
            area_name: aName,
            city: ag.city || (resolved.region === 'City' ? 'Surat' : aName),
            zone_code: ag.zone_name || resolved.zoneName,
            region: resolved.region,
            description: `Locality mapped from Agency Master (${ag.agency_name})`,
            created_at: new Date().toISOString()
          });
        }
      });
      if (dynamicAgencyAreas.length > 0) {
        setAreasList(prev => deduplicateAreas([...prev, ...dynamicAgencyAreas]));
      }
    }
  }, [agencies]);

  const handleStandardizeAgencyLocalities = async () => {
    setIsNormalizing(true);
    let updatedCount = 0;
    const updatedAgencies = [...localAgencies];

    for (let i = 0; i < updatedAgencies.length; i++) {
      const ag = updatedAgencies[i];
      const raw = (ag.area_name || '').trim();
      const canonical = normalizeAreaName(raw);
      if (canonical && canonical !== raw) {
        const resolved = resolveOfficialZone(canonical, ag.city);
        const newAg: Agency = {
          ...ag,
          area_name: canonical,
          zone_name: resolved.zoneName,
          zone_region: resolved.region
        };
        updatedAgencies[i] = newAg;
        await saveAgencyToSupabase(newAg);
        updatedCount++;
      }
    }

    setLocalAgencies(updatedAgencies);
    setIsNormalizing(false);
    if (updatedCount > 0) {
      setSuccessNotice(`⚡ Successfully normalized & standardized ${updatedCount} agency localities (e.g. KATARGAM → Katargam, PAL GAM → Pal)!`);
    } else {
      setSuccessNotice(`✅ All ${updatedAgencies.length} registered agencies already match official canonical area names!`);
    }
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleRefreshLiveAreas = async () => {
    setIsSyncing(true);
    const liveAreas = await fetchAreasFromSupabaseTable();
    if (liveAreas && liveAreas.length > 0) {
      setAreasList(deduplicateAreas(liveAreas));
      setSuccessNotice("🔄 Synced latest area master data from live Supabase `areas` table!");
      setTimeout(() => setSuccessNotice(null), 3000);
    }
    setIsSyncing(false);
  };

  // Load live areas from Supabase table on component mount and subscribe to live changes
  useEffect(() => {
    let isMounted = true;
    const loadLiveAreas = async () => {
      const liveAreas = await fetchAreasFromSupabaseTable();
      if (isMounted && liveAreas.length > 0) {
        setAreasList(deduplicateAreas(liveAreas));
      }
    };
    loadLiveAreas();

    // Supabase Realtime Channel
    const channel = supabase
      .channel('public:areas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'areas' }, async () => {
        const refreshed = await fetchAreasFromSupabaseTable();
        if (isMounted && refreshed.length > 0) {
          setAreasList(deduplicateAreas(refreshed));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered areas calculation for Localities View
  const filteredAreas = areasList.filter(a => {
    if (activeRegionFilter !== 'ALL') {
      const isTargetCity = activeRegionFilter === 'City';
      const isAreaCity = a.region === 'City' || (a.region || '').toLowerCase().includes('city');
      if (isTargetCity && !isAreaCity) return false;
      if (!isTargetCity && isAreaCity) return false;
    }
    if (selectedZoneFilter !== 'ALL' && a.zone_code !== selectedZoneFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.area_name.toLowerCase().includes(q) ||
      a.area_code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.zone_code || '').toLowerCase().includes(q) ||
      (a.region || '').toLowerCase().includes(q)
    );
  });

  // Filtered Pincodes for Pincode Master View
  const filteredPincodes = useMemo(() => {
    return OFFICIAL_PINCODE_MASTER.filter(p => {
      if (pincodeZoneFilter !== 'ALL' && p.zone_name !== pincodeZoneFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.pincode.includes(q) ||
        p.zone_name.toLowerCase().includes(q) ||
        p.region_type.toLowerCase().includes(q) ||
        p.covered_areas.toLowerCase().includes(q) ||
        (p.review_highlight || '').toLowerCase().includes(q)
      );
    });
  }, [pincodeZoneFilter, searchQuery]);

  // Helper to get agencies mapped to a pincode
  const getAgenciesForPincode = (pin: string) => {
    const clean = pin.trim();
    return localAgencies.filter(ag => {
      const agPin = (ag.pincode || ag.pin_code || '').trim();
      if (agPin === clean) return true;
      const agAddr = (ag.address || '').trim();
      if (agAddr.includes(clean)) return true;
      return false;
    });
  };

  // Flexible agency matcher for an area
  const getAgenciesForArea = (areaName: string, areaCity?: string) => {
    const aKey = areaName.toLowerCase().trim();
    const cKey = (areaCity || '').toLowerCase().trim();
    return localAgencies.filter(agency => {
      const agencyArea = (agency.area_name || '').toLowerCase().trim();
      const agencyCity = (agency.city || '').toLowerCase().trim();
      const agencyAddr = (agency.address || '').toLowerCase().trim();

      if (agencyArea && agencyArea !== 'n/a') {
        if (agencyArea === aKey || aKey.includes(agencyArea) || agencyArea.includes(aKey)) return true;
        const words = aKey.split(/\s+/).filter(w => w.length > 3);
        if (words.some(w => agencyArea.includes(w))) return true;
      }
      if (agencyAddr && (agencyAddr.includes(aKey) || aKey.split(/\s+/).some(w => w.length > 4 && agencyAddr.includes(w)))) return true;
      if (!agencyArea && cKey && agencyCity === cKey) return true;
      return false;
    });
  };

  // 1. City-wise Counts & Grouping
  const cityWiseStats = useMemo(() => {
    const map: Record<string, { city: string; count: number; agencies: Agency[]; areas: string[] }> = {};
    localAgencies.forEach(ag => {
      const resolved = resolveOfficialZone(ag.area_name || ag.city);
      const city = ag.city || (resolved.region === 'City' ? 'Surat' : resolved.matchedArea);
      if (!map[city]) {
        map[city] = { city, count: 0, agencies: [], areas: [] };
      }
      map[city].count += 1;
      map[city].agencies.push(ag);
      if (ag.area_name && !map[city].areas.includes(ag.area_name)) {
        map[city].areas.push(ag.area_name);
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [localAgencies]);

  // 2. Zone-wise Counts & Grouping across all 9 official zones
  const zoneWiseStats = useMemo(() => {
    const map: Record<string, { zone: string; region: string; count: number; agencies: Agency[]; areas: string[] }> = {};
    
    // Pre-populate with all 9 official zones
    OFFICIAL_ZONE_DEFINITIONS.forEach(def => {
      const matchingAreas = areasList
        .filter(a => (a.zone_code || '').toLowerCase() === def.zone_name.toLowerCase())
        .map(a => a.area_name);

      map[def.zone_name] = {
        zone: def.zone_name,
        region: def.region,
        count: 0,
        agencies: [],
        areas: matchingAreas
      };
    });

    localAgencies.forEach(ag => {
      const resolved = resolveOfficialZone(ag.area_name || ag.city || ag.address);
      const zoneKey = (ag.zone_name && map[ag.zone_name]) ? ag.zone_name : resolved.zoneName;
      if (!map[zoneKey]) {
        map[zoneKey] = {
          zone: zoneKey,
          region: resolved.region,
          count: 0,
          agencies: [],
          areas: []
        };
      }
      map[zoneKey].count += 1;
      map[zoneKey].agencies.push(ag);
      if (ag.area_name && !map[zoneKey].areas.includes(ag.area_name)) {
        map[zoneKey].areas.push(ag.area_name);
      }
    });

    return Object.values(map);
  }, [localAgencies, areasList]);

  // 3. Region-wise Counts & Grouping (City vs Rural)
  const regionWiseStats = useMemo(() => {
    const map: Record<string, { region: string; count: number; agencies: Agency[]; zones: string[]; cities: string[] }> = {
      'City': {
        region: 'City',
        count: 0,
        agencies: [],
        zones: ['City-A', 'City-B', 'City-C', 'City-D', 'City-E'],
        cities: ['Surat']
      },
      'Rural': {
        region: 'Rural',
        count: 0,
        agencies: [],
        zones: ['Upper South', 'South', 'East', 'North'],
        cities: ['Vapi', 'Navsari', 'Valsad', 'Bharuch', 'Bardoli', 'Daman', 'Silvassa', 'Bilimora', 'Ankleshwar']
      }
    };

    localAgencies.forEach(ag => {
      const resolved = resolveOfficialZone(ag.area_name || ag.city || ag.address);
      const reg = resolved.region;
      if (map[reg]) {
        map[reg].count += 1;
        map[reg].agencies.push(ag);
        if (ag.city && !map[reg].cities.includes(ag.city)) {
          map[reg].cities.push(ag.city);
        }
      }
    });

    return Object.values(map);
  }, [localAgencies]);

  // 4. Mapping Audit: Detect Mismatches and Unmapped Agencies
  const mappingAuditList = useMemo(() => {
    return localAgencies.map(ag => {
      const agArea = (ag.area_name || '').trim().toLowerCase();
      const agCity = (ag.city || '').trim().toLowerCase();
      const agZone = (ag.zone_name || '').trim().toLowerCase();
      const agRegion = (ag.zone_region || '').trim().toLowerCase();

      // Check if area exists in Area Master
      const matchedArea = areasList.find(a => {
        const aName = a.area_name.trim().toLowerCase();
        return agArea && (agArea === aName || aName.includes(agArea) || agArea.includes(aName));
      });

      if (!agArea || agArea === 'n/a' || !matchedArea) {
        return {
          agency: ag,
          status: 'UNMAPPED_AREA',
          severity: 'HIGH' as const,
          reason: `Locality '${ag.area_name || 'N/A'}' not registered in Area Master`,
          matchedArea: null
        };
      }

      // Check city mismatch
      if (agCity && matchedArea.city.trim().toLowerCase() !== agCity) {
        return {
          agency: ag,
          status: 'CITY_MISMATCH',
          severity: 'MEDIUM' as const,
          reason: `City mismatch: Agency has '${ag.city}', Area Master has '${matchedArea.city}'`,
          matchedArea
        };
      }

      // Check zone mismatch
      if (agZone && (matchedArea.zone_code || '').trim().toLowerCase() !== agZone) {
        return {
          agency: ag,
          status: 'ZONE_MISMATCH',
          severity: 'MEDIUM' as const,
          reason: `Zone mismatch: Agency has '${ag.zone_name}', Area Master has '${matchedArea.zone_code}'`,
          matchedArea
        };
      }

      // Check region mismatch
      if (agRegion && (matchedArea.region || '').trim().toLowerCase() !== agRegion) {
        return {
          agency: ag,
          status: 'REGION_MISMATCH',
          severity: 'LOW' as const,
          reason: `Region mismatch: Agency has '${ag.zone_region}', Area Master has '${matchedArea.region}'`,
          matchedArea
        };
      }

      return {
        agency: ag,
        status: 'MAPPED_OK',
        severity: 'OK' as const,
        reason: `Cleanly mapped to ${matchedArea.area_name} (${matchedArea.zone_code})`,
        matchedArea
      };
    });
  }, [localAgencies, areasList]);

  const mappingErrors = useMemo(() => {
    return mappingAuditList.filter(item => item.status !== 'MAPPED_OK');
  }, [mappingAuditList]);

  // Create new Area in Area Master
  const handleCreateAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    const cityPrefix = (newCity || 'SUR').substring(0, 3).toUpperCase();
    const seqNum = (areasList.length + 1).toString().padStart(3, '0');
    const generatedAreaCode = `AR-${cityPrefix}-${seqNum}`;

    const newArea: AreaMaster = {
      id: `ar_${Date.now()}`,
      area_code: generatedAreaCode,
      area_name: newAreaName.trim(),
      city: newCity.trim(),
      zone_code: newZoneCode.trim(),
      region: newRegion,
      description: newDesc.trim() || `${newRegion} Locality Area`,
      created_at: new Date().toISOString()
    };

    await saveAreaToSupabase(newArea);
    setAreasList(prev => deduplicateAreas([newArea, ...prev]));
    setSuccessNotice(`Locality Area "${newArea.area_name}" (${newArea.area_code}) created successfully & synced to live database!`);
    setIsAddAreaModalOpen(false);

    setNewAreaName('');
    setNewCity('Surat');
    setNewDesc('');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Edit existing Area in Area Master
  const handleOpenEditArea = (area: AreaMaster) => {
    setEditingArea(area);
    setEditAreaName(area.area_name);
    setEditCity(area.city || 'Surat');
    setEditZoneCode(area.zone_code || 'City-A');
    const isRural = area.region === 'Rural' || (area.region || '').toLowerCase().includes('rural') || ['Upper South', 'South', 'East', 'North'].includes(area.zone_code || '');
    setEditRegion(isRural ? 'Rural' : 'City');
    setEditDesc(area.description || '');
  };

  const handleSaveEditArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea || !editAreaName.trim()) return;

    const updatedArea: AreaMaster = {
      ...editingArea,
      area_name: editAreaName.trim(),
      city: editCity.trim(),
      zone_code: editZoneCode.trim(),
      region: editRegion,
      description: editDesc.trim()
    };

    await saveAreaToSupabase(updatedArea);
    setAreasList(prev => prev.map(a => a.id === updatedArea.id ? updatedArea : a));
    setSuccessNotice(`Locality Area "${updatedArea.area_name}" updated successfully!`);
    setEditingArea(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Open Mapping Resolution Modal
  const handleOpenResolveMapping = (item: {
    agency: Agency;
    reason: string;
    matchedArea: AreaMaster | null;
  }) => {
    setResolvingAgencyItem(item);
    setResolveMode('CREATE_IN_MASTER');
    setResolveAreaName(item.agency.area_name || '');
    const resolved = resolveOfficialZone(item.agency.area_name || item.agency.city);
    setResolveCity(item.agency.city || (resolved.region === 'City' ? 'Surat' : resolved.matchedArea));
    setResolveZoneCode(item.agency.zone_name || resolved.zoneName);
    setResolveRegion(resolved.region);
    if (areasList.length > 0) {
      setSelectedExistingAreaId(areasList[0].id);
    }
  };

  // Resolve Mapping Error (Add to Area Master OR Map to Existing Area)
  const handleConfirmResolveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAgencyItem) return;

    const ag = resolvingAgencyItem.agency;

    if (resolveMode === 'CREATE_IN_MASTER') {
      if (!resolveAreaName.trim()) return;

      const cityPrefix = (resolveCity || 'SUR').substring(0, 3).toUpperCase();
      const seqNum = (areasList.length + 1).toString().padStart(3, '0');
      const generatedCode = `AR-${cityPrefix}-${seqNum}`;

      const newArea: AreaMaster = {
        id: `ar_${Date.now()}`,
        area_code: generatedCode,
        area_name: resolveAreaName.trim(),
        city: resolveCity.trim(),
        zone_code: resolveZoneCode.trim(),
        region: resolveRegion,
        description: `Locality created to map agency: ${ag.agency_name}`,
        created_at: new Date().toISOString()
      };

      await saveAreaToSupabase(newArea);
      setAreasList(prev => deduplicateAreas([newArea, ...prev]));

      // Update Agency to point to this new area
      const updatedAgency: Agency = {
        ...ag,
        area_name: newArea.area_name,
        city: newArea.city,
        zone_name: newArea.zone_code,
        zone_region: newArea.region
      };
      await saveAgencyToSupabase(updatedAgency);
      setLocalAgencies(prev => prev.map(a => a.id === ag.id ? updatedAgency : a));

      setSuccessNotice(`✅ Area "${newArea.area_name}" registered in Area Master & mapped to agency "${ag.agency_name}"!`);
    } else {
      // Map to existing Area Master record
      const targetArea = areasList.find(a => a.id === selectedExistingAreaId);
      if (!targetArea) return;

      const updatedAgency: Agency = {
        ...ag,
        area_name: targetArea.area_name,
        city: targetArea.city,
        zone_name: targetArea.zone_code,
        zone_region: targetArea.region
      };
      await saveAgencyToSupabase(updatedAgency);
      setLocalAgencies(prev => prev.map(a => a.id === ag.id ? updatedAgency : a));

      setSuccessNotice(`✅ Agency "${ag.agency_name}" mapped to Area Master "${targetArea.area_name}" (${targetArea.zone_code})!`);
    }

    setResolvingAgencyItem(null);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleDeleteArea = async (areaId: string, areaName: string) => {
    if (!isSuperAdmin) {
      alert("Unauthorized Action: Deleting area master records is restricted to Super Admin authority.");
      return;
    }

    if (window.confirm(`⚠️ SUPER ADMIN DELETE CONFIRMATION:\nAre you sure you want to delete Locality Area "${areaName}"?\n\nThis will permanently remove the record from Supabase areas table.`)) {
      await deleteAreaFromSupabase(areaId);
      setAreasList(prev => prev.filter(a => a.id !== areaId));
      if (selectedAreaId === areaId) setSelectedAreaId(null);
      setSuccessNotice(`Area "${areaName}" removed from live database.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const handleDownloadAreaCSV = () => {
    const headers = ['Area ID', 'Area Code', 'Area Name', 'City / District', 'Zone Code', 'Region', 'Mapped Agencies Count', 'Description'];
    const csvRows = areasList.map(a => [
      a.id,
      a.area_code,
      `"${a.area_name.replace(/"/g, '""')}"`,
      `"${a.city.replace(/"/g, '""')}"`,
      a.zone_code || '',
      a.region || '',
      getAgenciesForArea(a.area_name).length,
      `"${(a.description || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Area_Master_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cityAreasCount = areasList.filter(a => a.region === 'City' || (a.region || '').toLowerCase().includes('city')).length;
  const ruralAreasCount = areasList.filter(a => a.region === 'Rural' || (a.region || '').toLowerCase().includes('rural')).length;

  const selectedArea = selectedAreaId ? areasList.find(a => a.id === selectedAreaId) : null;
  const selectedAreaAgencies = selectedArea ? getAgenciesForArea(selectedArea.area_name) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner with Multi-Dimensional Counts */}
      <div style={{
        background: 'linear-gradient(135deg, #070e20 0%, #0f172a 50%, #1e1b4b 100%)',
        borderRadius: '20px',
        padding: '1.5rem 1.75rem',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            boxShadow: 'inset 0 0 15px rgba(56, 189, 248, 0.2)'
          }}>
            <MapPin size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Area Master & Territory Reconciliation
              </h2>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.15)',
                padding: '0.25rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Live Database (`areas`)
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.35rem', marginBottom: 0 }}>
              Hierarchical Breakdown: Area-wise, Zone-wise, City-wise & Region-wise Agency Mapping & Error Audit
            </p>
          </div>
        </div>

        {/* Live Metrics Breakdown Badges */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Area Wise */}
          <div 
            onClick={() => setActiveMainTab('LOCALITIES')}
            style={{ 
              background: activeMainTab === 'LOCALITIES' ? 'rgba(56, 189, 248, 0.2)' : '#0b1329', 
              border: activeMainTab === 'LOCALITIES' ? '1px solid #38bdf8' : '1px solid #1e293b', 
              borderRadius: '12px', 
              padding: '0.55rem 0.9rem', 
              textAlign: 'center', 
              cursor: 'pointer' 
            }}
          >
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>AREA WISE</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8' }}>{areasList.length} Localities</span>
          </div>

          {/* City Wise */}
          <div 
            onClick={() => setActiveMainTab('CITY_WISE')}
            style={{ 
              background: activeMainTab === 'CITY_WISE' ? 'rgba(251, 191, 36, 0.2)' : '#0b1329', 
              border: activeMainTab === 'CITY_WISE' ? '1px solid #fbbf24' : '1px solid #1e293b', 
              borderRadius: '12px', 
              padding: '0.55rem 0.9rem', 
              textAlign: 'center', 
              cursor: 'pointer' 
            }}
          >
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>CITY WISE</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24' }}>{cityWiseStats.length} Cities</span>
          </div>

          {/* Zone Wise */}
          <div 
            onClick={() => setActiveMainTab('ZONE_WISE')}
            style={{ 
              background: activeMainTab === 'ZONE_WISE' ? 'rgba(168, 85, 247, 0.2)' : '#0b1329', 
              border: activeMainTab === 'ZONE_WISE' ? '1px solid #a855f7' : '1px solid #1e293b', 
              borderRadius: '12px', 
              padding: '0.55rem 0.9rem', 
              textAlign: 'center', 
              cursor: 'pointer' 
            }}
          >
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>ZONE WISE</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#c084fc' }}>{zoneWiseStats.length} Zones</span>
          </div>

          {/* Region Wise */}
          <div 
            onClick={() => setActiveMainTab('REGION_WISE')}
            style={{ 
              background: activeMainTab === 'REGION_WISE' ? 'rgba(52, 211, 153, 0.2)' : '#0b1329', 
              border: activeMainTab === 'REGION_WISE' ? '1px solid #34d399' : '1px solid #1e293b', 
              borderRadius: '12px', 
              padding: '0.55rem 0.9rem', 
              textAlign: 'center', 
              cursor: 'pointer' 
            }}
          >
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>REGION WISE</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#34d399' }}>{regionWiseStats.length} Regions</span>
          </div>

          {/* Mapping Errors Alert Badge */}
          <div 
            onClick={() => setActiveMainTab('MAPPING_ERRORS')}
            style={{ 
              background: mappingErrors.length > 0 ? (activeMainTab === 'MAPPING_ERRORS' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.15)') : '#0b1329', 
              border: mappingErrors.length > 0 ? '1px solid #f43f5e' : '1px solid #1e293b', 
              borderRadius: '12px', 
              padding: '0.55rem 0.9rem', 
              textAlign: 'center', 
              cursor: 'pointer',
              boxShadow: mappingErrors.length > 0 ? '0 0 15px rgba(244, 63, 94, 0.25)' : 'none'
            }}
          >
            <span style={{ fontSize: '0.65rem', color: mappingErrors.length > 0 ? '#fb7185' : '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              {mappingErrors.length > 0 && <AlertTriangle size={12} />} MAPPED ERRORS
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: mappingErrors.length > 0 ? '#f43f5e' : '#34d399' }}>
              {mappingErrors.length} {mappingErrors.length === 1 ? 'Error' : 'Errors'}
            </span>
          </div>
        </div>
      </div>

      {successNotice && (
        <div style={{
          background: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          color: '#34d399',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      {/* Main Tab Switcher Bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: '#0b1329',
        padding: '0.4rem',
        borderRadius: 14,
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveMainTab('PINCODES')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            border: 'none',
            background: activeMainTab === 'PINCODES' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeMainTab === 'PINCODES' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Hash size={15} /> South Gujarat Pincodes ({OFFICIAL_PINCODE_MASTER.length})
        </button>

        <button
          onClick={() => setActiveMainTab('LOCALITIES')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            border: 'none',
            background: activeMainTab === 'LOCALITIES' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeMainTab === 'LOCALITIES' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <MapPin size={15} /> All Localities Master ({areasList.length})
        </button>

        <button
          onClick={() => setActiveMainTab('CITY_WISE')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            border: 'none',
            background: activeMainTab === 'CITY_WISE' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
            color: activeMainTab === 'CITY_WISE' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={15} /> City-wise Breakdown ({cityWiseStats.length})
        </button>

        <button
          onClick={() => setActiveMainTab('ZONE_WISE')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            border: 'none',
            background: activeMainTab === 'ZONE_WISE' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
            color: activeMainTab === 'ZONE_WISE' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Compass size={15} /> Zone-wise Breakdown ({zoneWiseStats.length})
        </button>

        <button
          onClick={() => setActiveMainTab('REGION_WISE')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            border: 'none',
            background: activeMainTab === 'REGION_WISE' ? 'linear-gradient(135deg, #059669, #047857)' : 'transparent',
            color: activeMainTab === 'REGION_WISE' ? '#ffffff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Map size={15} /> Region-wise Breakdown ({regionWiseStats.length})
        </button>

        <button
          onClick={() => setActiveMainTab('MAPPING_ERRORS')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            border: 'none',
            background: activeMainTab === 'MAPPING_ERRORS' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : (mappingErrors.length > 0 ? 'rgba(244, 63, 94, 0.15)' : 'transparent'),
            color: activeMainTab === 'MAPPING_ERRORS' ? '#ffffff' : (mappingErrors.length > 0 ? '#fb7185' : '#94a3b8'),
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
            borderRight: mappingErrors.length > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : 'none'
          }}
        >
          <AlertTriangle size={15} /> ⚠️ Mapping Errors ({mappingErrors.length})
        </button>
      </div>

      {/* Control Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#141f36',
        padding: '0.65rem 0.85rem',
        borderRadius: '14px',
        border: '1px solid #1e293b'
      }}>
        {/* Region Filters (for Localities View or Pincode View) */}
        {activeMainTab === 'PINCODES' ? (
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', background: '#0b1329', padding: '0.3rem 0.65rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8' }}>Filter Zone:</span>
            <select
              value={pincodeZoneFilter}
              onChange={e => setPincodeZoneFilter(e.target.value)}
              style={{
                background: '#141f36',
                color: pincodeZoneFilter !== 'ALL' ? '#38bdf8' : '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All South Gujarat Zones ({OFFICIAL_PINCODE_MASTER.length} PIN Codes)</option>
              <optgroup label="Surat City Zones">
                <option value="City-A">City-A (11 Pincodes · Varachha, Katargam, Amroli)</option>
                <option value="City-B">City-B (5 Pincodes · Textile Market, Puna, Yogichowk)</option>
                <option value="City-C">City-C (6 Pincodes · Old City, Adajan, Rander, Hazira)</option>
                <option value="City-D">City-D (4 Pincodes · Udhna, Dindoli, Pandesara, Sachin)</option>
                <option value="City-E">City-E (3 Pincodes · Vesu, VIP Road, Althan, Parle Point)</option>
              </optgroup>
              <optgroup label="South Gujarat Rural Zones">
                <option value="Upper South">Upper South (18 Pincodes · Vapi, Valsad, Daman, Silvassa)</option>
                <option value="South">South (22 Pincodes · Navsari, Bilimora, Chikhli, Kadodara)</option>
                <option value="East">East (11 Pincodes · Bardoli, Vyara, Songadh, Mandvi)</option>
                <option value="North">North (14 Pincodes · Bharuch, Ankleshwar, Kamrej, Kim)</option>
              </optgroup>
            </select>
          </div>
        ) : activeMainTab === 'LOCALITIES' ? (
          <div style={{ display: 'flex', gap: '0.35rem', background: '#0b1329', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <button
              onClick={() => setActiveRegionFilter('ALL')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeRegionFilter === 'ALL' ? '#38bdf8' : 'transparent',
                color: activeRegionFilter === 'ALL' ? '#090d16' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.775rem',
                cursor: 'pointer'
              }}
            >
              All ({areasList.length})
            </button>
            <button
              onClick={() => { setActiveRegionFilter('City'); setSelectedZoneFilter('ALL'); }}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeRegionFilter === 'City' ? '#fbbf24' : 'transparent',
                color: activeRegionFilter === 'City' ? '#090d16' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.775rem',
                cursor: 'pointer'
              }}
            >
              Surat City ({cityAreasCount})
            </button>
            <button
              onClick={() => { setActiveRegionFilter('Rural'); setSelectedZoneFilter('ALL'); }}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeRegionFilter === 'Rural' ? '#34d399' : 'transparent',
                color: activeRegionFilter === 'Rural' ? '#090d16' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.775rem',
                cursor: 'pointer'
              }}
            >
              Rural Zones ({ruralAreasCount})
            </button>

            <select
              value={selectedZoneFilter}
              onChange={e => setSelectedZoneFilter(e.target.value)}
              style={{
                background: '#141f36',
                color: selectedZoneFilter !== 'ALL' ? '#38bdf8' : '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All 9 Zones</option>
              <optgroup label="Surat City Zones">
                <option value="City-A">City-A (Varachha / Katargam)</option>
                <option value="City-B">City-B (Textile / Puna)</option>
                <option value="City-C">City-C (Old City / Adajan)</option>
                <option value="City-D">City-D (Udhana / Sachin)</option>
                <option value="City-E">City-E (Vesu / VIP Road)</option>
              </optgroup>
              <optgroup label="South Gujarat Rural Zones">
                <option value="Upper South">Upper South (Vapi / Valsad / Daman)</option>
                <option value="South">South (Navsari / Bilimora / Chikhli)</option>
                <option value="East">East (Bardoli / Vyara / Mandavi)</option>
                <option value="North">North (Bharuch / Ankleshwar / Kamrej)</option>
              </optgroup>
            </select>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={16} color="#38bdf8" />
            {activeMainTab === 'CITY_WISE' && 'City-wise Agency Distribution'}
            {activeMainTab === 'ZONE_WISE' && 'Zone-wise Agency Distribution'}
            {activeMainTab === 'REGION_WISE' && 'Region-wise Agency Scope'}
            {activeMainTab === 'MAPPING_ERRORS' && 'Agency Territory Mismatches (Data Not Matched)'}
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {activeMainTab === 'LOCALITIES' && (
            <div style={{ display: 'flex', gap: '0.25rem', background: '#070e20', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <button
                onClick={() => setViewMode('GRID')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'GRID' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: viewMode === 'GRID' ? '#fff' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'TABLE' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: viewMode === 'TABLE' ? '#fff' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Table
              </button>
            </div>
          )}

          <button
            onClick={handleRefreshLiveAreas}
            disabled={isSyncing}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              background: '#0b1329',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-anim' : ''} /> {isSyncing ? 'Syncing...' : 'Sync DB'}
          </button>

          <button
            onClick={handleStandardizeAgencyLocalities}
            disabled={isNormalizing}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: isNormalizing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Automatically convert uppercase, suffixes and aliases (KATARGAM -> Katargam, PAL GAM -> Pal) to official canonical areas"
          >
            <Zap size={13} className={isNormalizing ? 'spin-anim' : ''} /> {isNormalizing ? 'Standardizing...' : 'Clean Area Aliases'}
          </button>

          <button
            onClick={handleDownloadAreaCSV}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              background: '#0b1329',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Download size={13} /> Export CSV
          </button>

          <button
            onClick={() => setIsAddAreaModalOpen(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={15} /> + Add Area
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 0: SOUTH GUJARAT 94 PINCODE MASTER & COVERED AREAS */}
      {/* ========================================================================= */}
      {activeMainTab === 'PINCODES' && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hash size={18} color="#38bdf8" /> South Gujarat Pincode Master & Zone Breakdown
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                Showing <strong>{filteredPincodes.length}</strong> of <strong>{OFFICIAL_PINCODE_MASTER.length}</strong> Official Pincodes mapped across Surat City & South Gujarat Rural Zones.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid rgba(56,189,248,0.25)', fontWeight: 800 }}>
                📍 94 Verified Pincodes
              </span>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>PIN Code</th>
                  <th style={{ width: '130px' }}>Zone</th>
                  <th style={{ width: '150px' }}>Region Type</th>
                  <th>Covered Localities & Areas</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Mapped Parties</th>
                  <th style={{ width: '160px' }}>Mapping Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredPincodes.map(p => {
                  const mappedAgencies = getAgenciesForPincode(p.pincode);
                  const isSurat = p.region_type === 'Surat City' || p.region === 'City';
                  return (
                    <tr key={p.pincode}>
                      <td>
                        <code style={{
                          color: '#fbbf24',
                          fontWeight: 900,
                          fontSize: '0.85rem',
                          background: 'rgba(251, 191, 36, 0.12)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 6,
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          letterSpacing: '0.05em'
                        }}>
                          {p.pincode}
                        </code>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: isSurat ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: isSurat ? '#fbbf24' : '#38bdf8',
                          border: isSurat ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                        }}>
                          {p.zone_name}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isSurat ? '#fbbf24' : '#34d399'
                        }}>
                          {p.region_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {p.covered_areas.split(',').map((area, aIdx) => (
                            <span key={aIdx} style={{
                              fontSize: '0.725rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 4,
                              background: '#0b1329',
                              color: '#cbd5e1',
                              border: '1px solid #1e293b',
                              fontWeight: 600
                            }}>
                              {area.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.775rem',
                          fontWeight: 900,
                          padding: '0.2rem 0.65rem',
                          borderRadius: 20,
                          background: mappedAgencies.length > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: mappedAgencies.length > 0 ? '#34d399' : '#64748b',
                          border: mappedAgencies.length > 0 ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid #334155'
                        }}>
                          {mappedAgencies.length} Parties
                        </span>
                      </td>
                      <td>
                        {p.review_highlight ? (
                          <span style={{
                            fontSize: '0.675rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 6,
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: '#fb7185',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            textTransform: 'uppercase'
                          }}>
                            {p.review_highlight}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: MAPPING ERRORS & UNMAPPED AUDIT (Data Not Matched) */}
      {/* ========================================================================= */}
      {activeMainTab === 'MAPPING_ERRORS' && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '1px solid #1e293b', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert color="#f43f5e" size={20} />
                Territory Mapping Audit & Data Not Matched
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 3 }}>
                Agencies whose Locality, City, Zone, or Region do not match records in the Area Master. Click <strong>"Fix Mapping / Update Area Master"</strong> to sync them.
              </p>
            </div>
            <span style={{
              background: mappingErrors.length > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(52, 211, 153, 0.15)',
              color: mappingErrors.length > 0 ? '#fb7185' : '#34d399',
              border: mappingErrors.length > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)',
              padding: '0.35rem 0.85rem',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: '0.8rem'
            }}>
              {mappingErrors.length === 0 ? '✅ All Agencies Cleanly Mapped' : `⚠️ ${mappingErrors.length} Mapping Issues Found`}
            </span>
          </div>

          {mappingErrors.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: '#0b1329', borderRadius: 12, border: '1px solid #1e293b' }}>
              <CheckCircle2 size={40} color="#34d399" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 800 }}>All Agency Data Cleanly Matched!</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: 4 }}>Every registered B2B sales agency is cleanly mapped to a verified locality and zone in the Area Master.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Agency / Party</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Current Locality & City</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Current Zone & Region</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Mapping Status / Error Reason</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingErrors.map(({ agency: ag, reason, status }) => (
                    <tr key={ag.id} style={{ borderBottom: '1px solid #1e293b', background: 'rgba(244, 63, 94, 0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{ag.agency_name}</strong>
                        <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 700 }}>Code: {ag.agency_code || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem' }}>{ag.area_name || 'Missing Area'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{ag.city || 'Gujarat'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.8rem' }}>{ag.zone_name || 'N/A'}</span>
                        <div style={{ color: '#94a3b8', fontSize: '0.725rem' }}>{ag.zone_region || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 6,
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          background: 'rgba(244, 63, 94, 0.15)',
                          color: '#fb7185',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          display: 'inline-block'
                        }}>
                          {reason}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenResolveMapping({ agency: ag, reason, matchedArea: null })}
                          style={{
                            padding: '0.45rem 0.95rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.775rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          <Edit3 size={13} /> Fix & Update Area Master
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CITY-WISE AGENCY BREAKDOWN */}
      {/* ========================================================================= */}
      {activeMainTab === 'CITY_WISE' && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '1px solid #1e293b', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 color="#fbbf24" size={20} />
            City-wise Agency Count & Localities Summary
          </h3>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>City / District</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total Registered Agencies</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Covered Localities / Areas</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Registered B2B Parties</th>
                </tr>
              </thead>
              <tbody>
                {cityWiseStats.map(item => (
                  <tr key={item.city} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ color: '#fbbf24', fontSize: '0.95rem' }}>{item.city}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.25rem 0.65rem', borderRadius: 8, fontWeight: 900, fontSize: '0.85rem' }}>
                        {item.count} Parties
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.areas.map(area => (
                          <span key={area} style={{ fontSize: '0.725rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: '#0b1329', color: '#cbd5e1', border: '1px solid #1e293b' }}>
                            📍 {area}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.agencies.map(ag => (
                          <span key={ag.id} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.25)', fontWeight: 700 }}>
                            🏢 {ag.agency_name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ZONE-WISE AGENCY BREAKDOWN */}
      {/* ========================================================================= */}
      {activeMainTab === 'ZONE_WISE' && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '1px solid #1e293b', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass color="#c084fc" size={20} />
            Zone-wise Agency Count & Territory Scope
          </h3>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Zone Code / Name</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Region Scope</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total Registered Agencies</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Mapped Localities</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Registered B2B Parties</th>
                </tr>
              </thead>
              <tbody>
                {zoneWiseStats.map(item => (
                  <tr key={item.zone} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ color: '#c084fc', fontSize: '0.95rem' }}>{item.zone}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {item.region}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.25rem 0.65rem', borderRadius: 8, fontWeight: 900, fontSize: '0.85rem' }}>
                        {item.count} Parties
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.areas.map(area => (
                          <span key={area} style={{ fontSize: '0.725rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: '#0b1329', color: '#cbd5e1', border: '1px solid #1e293b' }}>
                            📍 {area}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.agencies.map(ag => (
                          <span key={ag.id} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 700 }}>
                            🏢 {ag.agency_name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: REGION-WISE AGENCY BREAKDOWN */}
      {/* ========================================================================= */}
      {activeMainTab === 'REGION_WISE' && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '1px solid #1e293b', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Map color="#34d399" size={20} />
            Region-wise Agency Count & Territory Distribution
          </h3>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Territory Region Scope</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total Registered Agencies</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Covered Zones</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Covered Cities</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Registered Parties</th>
                </tr>
              </thead>
              <tbody>
                {regionWiseStats.map(item => (
                  <tr key={item.region} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>{item.region}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.25rem 0.65rem', borderRadius: 8, fontWeight: 900, fontSize: '0.85rem' }}>
                        {item.count} Parties
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.zones.map(z => (
                          <span key={z} style={{ fontSize: '0.725rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: '#0b1329', color: '#c084fc', border: '1px solid #1e293b', fontWeight: 700 }}>
                            {z}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.cities.map(c => (
                          <span key={c} style={{ fontSize: '0.725rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: '#0b1329', color: '#fbbf24', border: '1px solid #1e293b' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.agencies.map(ag => (
                          <span key={ag.id} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 700 }}>
                            🏢 {ag.agency_name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: ALL LOCALITIES MASTER (GRID CARDS vs DATA TABLE) */}
      {/* ========================================================================= */}
      {activeMainTab === 'LOCALITIES' && (
        viewMode === 'GRID' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredAreas.map(area => {
              const areaAgencies = getAgenciesForArea(area.area_name, area.city);
              const isSelected = selectedAreaId === area.id;
              const isSurat = area.region === 'Surat City Zone' || area.city === 'Surat';

              return (
                <div
                  key={area.id}
                  style={{
                    background: '#141f36',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #38bdf8' : '1px solid #1e293b',
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease',
                    boxShadow: isSelected ? '0 8px 30px rgba(56, 189, 248, 0.25)' : '0 4px 15px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div>
                    {/* Header Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#38bdf8'
                        }}>
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                            {area.area_name}
                          </h3>
                          <code style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 800 }}>
                            {area.area_code}
                          </code>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.675rem',
                        fontWeight: 900,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '8px',
                        background: isSurat ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isSurat ? '#fbbf24' : '#34d399',
                        border: isSurat ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {area.city}
                      </span>
                    </div>

                    {/* Region & Zone Details */}
                    <div style={{ fontSize: '0.775rem', color: '#94a3b8', background: '#0b1329', padding: '0.65rem 0.85rem', borderRadius: 10, marginBottom: '0.85rem', border: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>Area Name:</span>
                        <span style={{ color: '#f8fafc', fontWeight: 800 }}>{area.area_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>City / District:</span>
                        <span style={{ color: '#fbbf24', fontWeight: 800 }}>{area.city}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>Zone Code:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 800 }}>{area.zone_code || 'ZN-SUR-A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>Region Scope:</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{area.region || 'Surat City Zone'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>Mapped Agencies:</span>
                        <span style={{ color: areaAgencies.length > 0 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                          {areaAgencies.length} Registered Parties
                        </span>
                      </div>

                      {areaAgencies.length > 0 && (
                        <div style={{ marginTop: '0.55rem', paddingTop: '0.45rem', borderTop: '1px dashed #1e293b' }}>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Mapped Parties in Agency Master:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {areaAgencies.slice(0, 3).map(ag => (
                              <span key={ag.id} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 700 }}>
                                🏢 {ag.agency_name}
                              </span>
                            ))}
                            {areaAgencies.length > 3 && (
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8', padding: '0.15rem 0.35rem' }}>
                                +{areaAgencies.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: '0.775rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '1rem' }}>
                      {area.description || `${area.area_name} locality in ${area.city}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedAreaId(isSelected ? null : area.id)}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: isSelected ? 'none' : '1px solid #1e293b',
                        background: isSelected ? 'linear-gradient(135deg, #38bdf8, #0284c7)' : '#0b1329',
                        color: isSelected ? 'white' : '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {isSelected ? 'Close Parties' : 'Inspect'} ({areaAgencies.length}) <ChevronRight size={15} />
                    </button>

                    <button
                      onClick={() => handleOpenEditArea(area)}
                      title="Edit Locality Details"
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        background: '#0b1329',
                        color: '#fbbf24',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Edit3 size={15} /> Edit
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteArea(area.id, area.area_name)}
                        title="Super Admin Authority: Delete area record from Supabase"
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(244, 63, 94, 0.4)',
                          background: 'rgba(244, 63, 94, 0.15)',
                          color: '#fb7185',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Data Table View */
          <div style={{ background: '#141f36', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Area Code</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Locality Area Name</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>City / District</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Zone Code</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Territory Region</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Mapped Parties</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area, idx) => {
                    const areaAgencies = getAgenciesForArea(area.area_name, area.city);
                    const isSurat = area.region === 'Surat City Zone' || area.city === 'Surat';
                    return (
                      <tr key={area.id} style={{ borderBottom: '1px solid #1e293b', background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.4)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <code style={{ color: '#38bdf8', fontWeight: 800 }}>{area.area_code}</code>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{area.area_name}</strong>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ color: isSurat ? '#fbbf24' : '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>
                            {area.city}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 700 }}>
                          {area.zone_code || 'ZN-SUR-A'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                          {area.region || 'Surat City Zone'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: areaAgencies.length > 0 ? '#34d399' : '#fbbf24', fontWeight: 800, background: 'rgba(52, 211, 153, 0.12)', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem' }}>
                              {areaAgencies.length} Parties
                            </span>
                            {areaAgencies.length > 0 && (
                              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={areaAgencies.map(a => a.agency_name).join(', ')}>
                                {areaAgencies.map(a => a.agency_name).join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => setSelectedAreaId(selectedAreaId === area.id ? null : area.id)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #38bdf8',
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                fontWeight: 800,
                                fontSize: '0.725rem',
                                cursor: 'pointer'
                              }}
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleOpenEditArea(area)}
                              style={{
                                padding: '0.35rem 0.55rem',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                background: '#0b1329',
                                color: '#fbbf24',
                                fontWeight: 800,
                                fontSize: '0.725rem',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteArea(area.id, area.area_name)}
                                style={{
                                  padding: '0.35rem 0.55rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(244, 63, 94, 0.4)',
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  color: '#fb7185',
                                  fontWeight: 800,
                                  fontSize: '0.725rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Selected Area Drawer for inspecting mapped parties */}
      {selectedArea && (
        <div style={{ background: '#141f36', border: '1px solid #38bdf8', borderRadius: 16, padding: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                📍 Mapped Agencies in Locality: <span style={{ color: '#38bdf8' }}>{selectedArea.area_name}</span> ({selectedAreaAgencies.length} Parties)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>
                City: <strong>{selectedArea.city}</strong> | Zone Code: <strong>{selectedArea.zone_code || 'ZN-SUR-A'}</strong> | Region: <strong>{selectedArea.region}</strong>
              </span>
            </div>

            <button
              onClick={() => setSelectedAreaId(null)}
              style={{ padding: '0.4rem', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {selectedAreaAgencies.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {selectedAreaAgencies.map(a => (
                <div key={a.id} style={{ background: '#0b1329', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid #1e293b' }}>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>{a.agency_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginTop: 2 }}>{a.agency_code} | {a.city}</div>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: 4 }}>Contact: {a.contact_person || 'N/A'} ({a.mobile || (a as any).phone || 'N/A'})</div>
                  <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700, marginTop: 4 }}>Credit Limit: ₹{(a.credit_limit || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#0b1329', borderRadius: 12, border: '1px solid #1e293b' }}>
              No registered B2B sales agencies mapped to {selectedArea.area_name} locality yet.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESOLVE MAPPING ERROR & UPDATE IN AREA MASTER */}
      {/* ========================================================================= */}
      {resolvingAgencyItem && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 14, 32, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-card" style={{ maxWidth: 540, width: '95vw', background: '#0f172a', border: '1px solid #f43f5e', borderRadius: 20, padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} color="#fb7185" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Resolve Territory Mapping Error
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Agency: <strong style={{ color: '#38bdf8' }}>{resolvingAgencyItem.agency.agency_name}</strong> ({resolvingAgencyItem.agency.agency_code})
                  </div>
                </div>
              </div>
              <button onClick={() => setResolvingAgencyItem(null)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#fca5a5' }}>
              <strong>Issue Detected:</strong> {resolvingAgencyItem.reason}
            </div>

            {/* Resolution Strategy Picker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setResolveMode('CREATE_IN_MASTER')}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 10,
                  border: resolveMode === 'CREATE_IN_MASTER' ? '2px solid #38bdf8' : '1px solid #1e293b',
                  background: resolveMode === 'CREATE_IN_MASTER' ? 'rgba(56, 189, 248, 0.15)' : '#0b1329',
                  color: resolveMode === 'CREATE_IN_MASTER' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 900 }}>Option 1: Add to Master</div>
                <div style={{ fontSize: '0.68rem', marginTop: 2, opacity: 0.85 }}>Register this locality in Area Master</div>
              </button>

              <button
                type="button"
                onClick={() => setResolveMode('MAP_EXISTING_AREA')}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 10,
                  border: resolveMode === 'MAP_EXISTING_AREA' ? '2px solid #34d399' : '1px solid #1e293b',
                  background: resolveMode === 'MAP_EXISTING_AREA' ? 'rgba(52, 211, 153, 0.15)' : '#0b1329',
                  color: resolveMode === 'MAP_EXISTING_AREA' ? '#34d399' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 900 }}>Option 2: Map to Existing</div>
                <div style={{ fontSize: '0.68rem', marginTop: 2, opacity: 0.85 }}>Pick an existing verified Area</div>
              </button>
            </div>

            <form onSubmit={handleConfirmResolveMapping} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {resolveMode === 'CREATE_IN_MASTER' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                      Locality Area Name <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={resolveAreaName}
                      onChange={e => setResolveAreaName(e.target.value)}
                      placeholder="e.g. Varachha, Katargam, Adajan"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>City / District</label>
                      <input
                        type="text"
                        value={resolveCity}
                        onChange={e => setResolveCity(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Delivery Zone</label>
                      <select
                        value={resolveZoneCode}
                        onChange={e => {
                          const val = e.target.value;
                          setResolveZoneCode(val);
                          const isRural = ['Upper South', 'South', 'East', 'North'].includes(val);
                          setResolveRegion(isRural ? 'Rural' : 'City');
                          if (!isRural) setResolveCity('Surat');
                        }}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        <optgroup label="Surat City Zones">
                          <option value="City-A">City-A (Varachha / Katargam)</option>
                          <option value="City-B">City-B (Textile / Puna)</option>
                          <option value="City-C">City-C (Old City / Adajan)</option>
                          <option value="City-D">City-D (Udhana / Sachin)</option>
                          <option value="City-E">City-E (Vesu / VIP Road)</option>
                        </optgroup>
                        <optgroup label="South Gujarat Rural Zones">
                          <option value="Upper South">Upper South (Vapi / Valsad / Daman)</option>
                          <option value="South">South (Navsari / Bilimora / Chikhli)</option>
                          <option value="East">East (Bardoli / Vyara / Mandavi)</option>
                          <option value="North">North (Bharuch / Ankleshwar / Kamrej)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Territory Region Scope</label>
                    <select
                      value={resolveRegion}
                      onChange={e => setResolveRegion(e.target.value as any)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <option value="City">City (Surat City)</option>
                      <option value="Rural">Rural (South Gujarat Rural / Highway)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Select Existing Master Area <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={selectedExistingAreaId}
                    onChange={e => setSelectedExistingAreaId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 0.85rem', background: '#070e20', border: '1px solid #38bdf8', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {areasList.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.area_name} ({a.city} · {a.zone_code} · {a.region})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
                    Agency's area, city, zone, and region will be updated to match this Area Master record.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResolvingAgencyItem(null)}
                  style={{ padding: '0.65rem 1.15rem', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.35rem', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                >
                  {resolveMode === 'CREATE_IN_MASTER' ? 'Register in Master & Fix Agency' : 'Apply Area Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT EXISTING AREA IN AREA MASTER */}
      {/* ========================================================================= */}
      {editingArea && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 14, 32, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-card" style={{ maxWidth: 520, width: '95vw', background: '#0f172a', border: '1px solid #fbbf24', borderRadius: 20, padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Edit Area Master: {editingArea.area_code}
                </h3>
              </div>
              <button onClick={() => setEditingArea(null)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditArea} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Locality / Area Name <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editAreaName}
                  onChange={e => setEditAreaName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>City / District</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Delivery Zone</label>
                  <select
                    value={editZoneCode}
                    onChange={e => {
                      const val = e.target.value;
                      setEditZoneCode(val);
                      const isRural = ['Upper South', 'South', 'East', 'North'].includes(val);
                      setEditRegion(isRural ? 'Rural' : 'City');
                      if (!isRural) setEditCity('Surat');
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    <optgroup label="Surat City Zones">
                      <option value="City-A">City-A (Varachha / Katargam)</option>
                      <option value="City-B">City-B (Textile / Puna)</option>
                      <option value="City-C">City-C (Old City / Adajan)</option>
                      <option value="City-D">City-D (Udhana / Sachin)</option>
                      <option value="City-E">City-E (Vesu / VIP Road)</option>
                    </optgroup>
                    <optgroup label="South Gujarat Rural Zones">
                      <option value="Upper South">Upper South (Vapi / Valsad / Daman)</option>
                      <option value="South">South (Navsari / Bilimora / Chikhli)</option>
                      <option value="East">East (Bardoli / Vyara / Mandavi)</option>
                      <option value="North">North (Bharuch / Ankleshwar / Kamrej)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Territory Region Scope</label>
                <select
                  value={editRegion}
                  onChange={e => setEditRegion(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="City">City (Surat City)</option>
                  <option value="Rural">Rural (South Gujarat Rural / Highway)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>Description</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  style={{ padding: '0.65rem 1.15rem', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.35rem', borderRadius: 10, background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: 'none', color: '#000', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)' }}
                >
                  Save Changes to Area Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW AREA IN AREA MASTER */}
      {/* ========================================================================= */}
      {isAddAreaModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 14, 32, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-card" style={{ maxWidth: 520, width: '95vw', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: 20, padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Create New Locality Area
                </h3>
              </div>
              <button onClick={() => setIsAddAreaModalOpen(false)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAreaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Locality / Area Name <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Varachha, Katargam, Adajan, Vesu"
                  value={newAreaName}
                  onChange={e => setNewAreaName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    City / District
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat, Navsari, Vapi"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Delivery Zone
                  </label>
                  <select
                    value={newZoneCode}
                    onChange={e => {
                      const val = e.target.value;
                      setNewZoneCode(val);
                      const isRural = ['Upper South', 'South', 'East', 'North'].includes(val);
                      setNewRegion(isRural ? 'Rural' : 'City');
                      if (!isRural) setNewCity('Surat');
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    <optgroup label="Surat City Zones">
                      <option value="City-A">City-A (Varachha / Katargam)</option>
                      <option value="City-B">City-B (Textile / Puna)</option>
                      <option value="City-C">City-C (Old City / Adajan)</option>
                      <option value="City-D">City-D (Udhana / Sachin)</option>
                      <option value="City-E">City-E (Vesu / VIP Road)</option>
                    </optgroup>
                    <optgroup label="South Gujarat Rural Zones">
                      <option value="Upper South">Upper South (Vapi / Valsad / Daman)</option>
                      <option value="South">South (Navsari / Bilimora / Chikhli)</option>
                      <option value="East">East (Bardoli / Vyara / Mandavi)</option>
                      <option value="North">North (Bharuch / Ankleshwar / Kamrej)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Territory Region Scope
                </label>
                <select
                  value={newRegion}
                  onChange={e => setNewRegion(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="City">City (Surat City)</option>
                  <option value="Rural">Rural (South Gujarat Rural / Highway)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Description / Landmark Info
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial diamond Hub / Industrial belt"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddAreaModalOpen(false)}
                  style={{ padding: '0.65rem 1.15rem', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
                >
                  Save & Sync to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isImportModalOpen && (
        <BulkImportModal
          isOpen={isImportModalOpen}
          masterType="zones"
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={() => {
            setIsImportModalOpen(false);
            setSuccessNotice("Bulk area master data imported successfully!");
            setTimeout(() => setSuccessNotice(null), 3000);
          }}
        />
      )}

    </div>
  );
};
