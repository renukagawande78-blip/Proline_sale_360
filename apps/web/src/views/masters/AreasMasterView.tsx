import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet, 
  ChevronRight,
  Globe,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AreaMaster, Agency } from '../../types';
import { 
  DEFAULT_AREAS, 
  fetchAreasFromSupabaseTable, 
  saveAreaToSupabase, 
  deleteAreaFromSupabase, 
  deduplicateAreas,
  MOCK_AGENCIES,
  supabase
} from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { BulkImportModal } from '../../components/BulkImportModal';
import { downloadSampleCSV } from '../../lib/masterImportExport';

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

  const [areasList, setAreasList] = useState<AreaMaster[]>(DEFAULT_AREAS);
  const [localAgencies, setLocalAgencies] = useState<Agency[]>(agencies);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [activeRegionFilter, setActiveRegionFilter] = useState<'ALL' | 'Surat City Zone' | 'South Gujarat Rural Zone'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Selected Area Drawer for inspecting mapped parties
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Add Area Modal state
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [newAreaName, setNewAreaName] = useState('');
  const [newCity, setNewCity] = useState('Surat');
  const [newZoneCode, setNewZoneCode] = useState('ZN-SUR-A');
  const [newRegion, setNewRegion] = useState<'Surat City Zone' | 'South Gujarat Rural Zone'>('Surat City Zone');
  const [newDesc, setNewDesc] = useState('');

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  useEffect(() => {
    if (agencies && agencies.length > 0) {
      setLocalAgencies(agencies);
    } else {
      setLocalAgencies(MOCK_AGENCIES);
    }
  }, [agencies]);

  const [isSyncing, setIsSyncing] = useState(false);

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

  // Filtered areas calculation
  const filteredAreas = areasList.filter(a => {
    if (activeRegionFilter !== 'ALL' && a.region !== activeRegionFilter) return false;
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

  const getAgenciesForArea = (areaName: string) => {
    const key = areaName.toLowerCase().trim();
    return localAgencies.filter(agency => {
      const aLoc = (agency.area_name || agency.city || '').toLowerCase().trim();
      return aLoc.includes(key) || key.includes(aLoc);
    });
  };

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

    // Save to live Supabase database table
    await saveAreaToSupabase(newArea);

    setAreasList(prev => deduplicateAreas([newArea, ...prev]));
    setSuccessNotice(`Locality Area "${newArea.area_name}" (${newArea.area_code}) created successfully & synced to live database!`);
    setIsAddAreaModalOpen(false);

    // Reset Form
    setNewAreaName('');
    setNewCity('Surat');
    setNewDesc('');

    setTimeout(() => {
      setSuccessNotice(null);
    }, 4000);
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
    const headers = ['Area ID', 'Area Code', 'Area Name', 'City / District', 'Zone Code', 'Region', 'Description'];
    const csvRows = areasList.map(a => [
      a.id,
      a.area_code,
      `"${a.area_name.replace(/"/g, '""')}"`,
      `"${a.city.replace(/"/g, '""')}"`,
      a.zone_code || '',
      a.region || '',
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

  const cityAreasCount = areasList.filter(a => a.region === 'Surat City Zone').length;
  const ruralAreasCount = areasList.filter(a => a.region === 'South Gujarat Rural Zone').length;

  const selectedArea = selectedAreaId ? areasList.find(a => a.id === selectedAreaId) : null;
  const selectedAreaAgencies = selectedArea ? getAgenciesForArea(selectedArea.area_name) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
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
                Area Master Management
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
                Live Database (`areas` table)
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.35rem', marginBottom: 0 }}>
              Live territory locality areas, Surat city zones, district coverage & B2B party mapping
            </p>
          </div>
        </div>

        {/* Live Metrics Summary Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.6rem 1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>TOTAL LOCALITIES</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>{areasList.length}</span>
          </div>

          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.6rem 1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>SURAT CITY</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>{cityAreasCount}</span>
          </div>

          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.6rem 1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>SOUTH GUJARAT RURAL</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34d399' }}>{ruralAreasCount}</span>
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
        {/* Region Filters & View Switcher */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All Localities ({areasList.length})
            </button>
            <button
              onClick={() => setActiveRegionFilter('Surat City Zone')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeRegionFilter === 'Surat City Zone' ? '#fbbf24' : 'transparent',
                color: activeRegionFilter === 'Surat City Zone' ? '#090d16' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.775rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={13} /> Surat City ({cityAreasCount})
            </button>
            <button
              onClick={() => setActiveRegionFilter('South Gujarat Rural Zone')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeRegionFilter === 'South Gujarat Rural Zone' ? '#34d399' : 'transparent',
                color: activeRegionFilter === 'South Gujarat Rural Zone' ? '#090d16' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.775rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Map size={13} /> South Gujarat Rural ({ruralAreasCount})
            </button>
          </div>

          {/* View Switcher: Grid vs Table */}
          <div style={{ display: 'flex', gap: '0.25rem', background: '#070e20', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <button
              onClick={() => setViewMode('GRID')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'GRID' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: viewMode === 'GRID' ? '#fff' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Layers size={13} /> Grid Cards
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'TABLE' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: viewMode === 'TABLE' ? '#fff' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <FileSpreadsheet size={13} /> Data Table
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefreshLiveAreas}
            disabled={isSyncing}
            title="Fetch latest rows directly from live Supabase areas table"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} /> {isSyncing ? 'Syncing...' : '🔄 Sync Live DB'}
          </button>

          <button
            onClick={() => setIsAddAreaModalOpen(true)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Plus size={14} /> Create New Area
          </button>


          <button
            onClick={handleDownloadAreaCSV}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #34d399',
              background: 'rgba(52, 211, 153, 0.12)',
              color: '#34d399',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Download size={14} /> Export Area CSV
          </button>
        </div>
      </div>

      {/* Main Content Display: Grid Cards vs Data Table */}
      {viewMode === 'GRID' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredAreas.map(area => {
            const areaAgencies = getAgenciesForArea(area.area_name);
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
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Zone Code:</span>
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>{area.zone_code || 'ZN-SUR-A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Region Scope:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{area.region || 'Surat City Zone'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Mapped Parties:</span>
                      <span style={{ color: areaAgencies.length > 0 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                        {areaAgencies.length} Registered Agencies
                      </span>
                    </div>
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
                    {isSelected ? 'Close Mapped Parties' : 'Inspect Parties'} ({areaAgencies.length}) <ChevronRight size={15} />
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
                      <Trash2 size={15} /> Delete
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
                  const areaAgencies = getAgenciesForArea(area.area_name);
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
                        <span style={{ color: areaAgencies.length > 0 ? '#34d399' : '#fbbf24', fontWeight: 800, background: 'rgba(52, 211, 153, 0.12)', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem' }}>
                          {areaAgencies.length} Parties
                        </span>
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
      )}

      {/* Selected Area Inspection Panel */}
      {selectedArea && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '2px solid #38bdf8', padding: '1.35rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="#38bdf8" /> Mapped Agencies in {selectedArea.area_name} ({selectedArea.city})
              </h3>
              <span style={{ fontSize: '0.785rem', color: '#94a3b8' }}>
                Zone Code: <strong>{selectedArea.zone_code || 'ZN-SUR-A'}</strong> | Region: <strong>{selectedArea.region}</strong>
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

      {/* Add Area Modal */}
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
                    Zone Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ZN-SUR-A"
                    value={newZoneCode}
                    onChange={e => setNewZoneCode(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070e20', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                  />
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
                  <option value="Surat City Zone">Surat City Zone</option>
                  <option value="South Gujarat Rural Zone">South Gujarat Rural Zone</option>
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
