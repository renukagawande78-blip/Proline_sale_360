import React, { useState } from 'react';
import { 
  MapPin, 
  Building2, 
  Map, 
  Users, 
  ChevronRight, 
  Tag, 
  Plus, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Edit3,
  Trash2,
  Layers,
  ArrowRightLeft,
  X,
  Compass,
  Check,
  Globe,
  FileSpreadsheet
} from 'lucide-react';
import { ZoneMaster, Agency, ZoneRegion } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MOCK_ZONES } from '../../lib/supabase';
import { downloadSampleCSV } from '../../lib/masterImportExport';
import { BulkImportModal } from '../../components/BulkImportModal';

interface ZonesMasterViewProps {
  agencies: Agency[];
  searchQuery: string;
}

export const ZonesMasterView: React.FC<ZonesMasterViewProps> = ({ agencies, searchQuery }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN' || (currentUser?.full_name || '').toLowerCase().includes('chirag') || (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeRegionFilter, setActiveRegionFilter] = useState<'ALL' | ZoneRegion>('ALL');
  const [zonesList, setZonesList] = useState<ZoneMaster[]>(MOCK_ZONES);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [newAreaInputs, setNewAreaInputs] = useState<Record<string, string>>({});
  const [localAgencies, setLocalAgencies] = useState<Agency[]>(agencies);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleDeleteZone = (zoneId: string, zoneName: string) => {
    if (window.confirm(`Are you sure you want to delete Zone Master "${zoneName}"? This action is restricted to Super Admin authority.`)) {
      setZonesList(prev => prev.filter(z => z.id !== zoneId));
      setSuccessNotice(`Zone "${zoneName}" deleted by Super Admin.`);
    }
  };

  // New Zone Creation Modal State
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneRegion, setNewZoneRegion] = useState<ZoneRegion>('Surat City Zone');
  const [newZoneDesc, setNewZoneDesc] = useState('');
  const [newZoneAreas, setNewZoneAreas] = useState('');

  const activeAgencies = localAgencies.length > 0 ? localAgencies : agencies;

  const filteredZones = zonesList.filter(z => {
    if (activeRegionFilter !== 'ALL' && z.region !== activeRegionFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      z.zone_name.toLowerCase().includes(q) ||
      z.zone_code.toLowerCase().includes(q) ||
      z.region.toLowerCase().includes(q) ||
      z.major_areas.some(a => a.toLowerCase().includes(q))
    );
  });

  const getAgenciesForZone = (zoneName: string) => {
    return activeAgencies.filter(a => a.zone_name === zoneName);
  };

  const selectedZone = selectedZoneId ? zonesList.find(z => z.id === selectedZoneId) : null;
  const selectedZoneAgencies = selectedZone ? getAgenciesForZone(selectedZone.zone_name) : [];

  // Regional Stats
  const cityZones = zonesList.filter(z => z.region === 'Surat City Zone');
  const ruralZones = zonesList.filter(z => z.region === 'South Gujarat Rural Zone');

  const cityAgenciesCount = activeAgencies.filter(a => a.zone_region === 'Surat City Zone').length;
  const ruralAgenciesCount = activeAgencies.filter(a => a.zone_region === 'South Gujarat Rural Zone').length;

  const totalCityAreas = cityZones.reduce((acc, z) => acc + z.major_areas.length, 0);
  const totalRuralAreas = ruralZones.reduce((acc, z) => acc + z.major_areas.length, 0);

  // Add Area Tag to specific Zone
  const handleAddAreaToZone = (zoneId: string) => {
    const areaText = (newAreaInputs[zoneId] || '').trim();
    if (!areaText) return;

    setZonesList(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          major_areas: Array.from(new Set([...z.major_areas, areaText]))
        };
      }
      return z;
    }));

    setNewAreaInputs(prev => ({ ...prev, [zoneId]: '' }));
    setSuccessNotice(`Added locality "${areaText}" to zone!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Remove Area Tag
  const handleRemoveArea = (zoneId: string, areaToRemove: string) => {
    setZonesList(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          major_areas: z.major_areas.filter(a => a !== areaToRemove)
        };
      }
      return z;
    }));
  };

  // Re-map Party to different Zone
  const handleRemapPartyZone = (agencyId: string, targetZoneName: any) => {
    const targetZone = zonesList.find(z => z.zone_name === targetZoneName);
    if (!targetZone) return;

    setLocalAgencies(prev => prev.map(a => {
      if (a.id === agencyId) {
        return {
          ...a,
          zone_id: targetZone.id,
          zone_name: targetZone.zone_name,
          zone_region: targetZone.region
        };
      }
      return a;
    }));

    setSuccessNotice(`Party re-mapped to ${targetZone.zone_name} (${targetZone.region})!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Create New Territory Zone
  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const parsedAreas = newZoneAreas
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const createdZone: ZoneMaster = {
      id: `z_custom_${Date.now()}`,
      zone_code: newZoneCode.trim() || `Z-SUR-${zonesList.length + 1}`,
      zone_name: newZoneName.trim() as any,
      region: newZoneRegion,
      description: newZoneDesc.trim() || `Custom territory zone for ${newZoneName}`,
      major_areas: parsedAreas.length > 0 ? parsedAreas : ['Central Market', 'Main GIDC']
    };

    setZonesList(prev => [...prev, createdZone]);
    setIsAddZoneModalOpen(false);
    setNewZoneName('');
    setNewZoneCode('');
    setNewZoneDesc('');
    setNewZoneAreas('');
    setSuccessNotice(`New Territory Zone "${createdZone.zone_name}" created successfully!`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Download Zone Master Territory CSV
  const handleDownloadZoneCSV = () => {
    const headers = ['Zone Name', 'Zone Code', 'Region', 'Description', 'Covered Locality Areas', 'Mapped Party Count'];
    const rows = zonesList.map(z => [
      z.zone_name,
      z.zone_code,
      z.region,
      `"${z.description}"`,
      `"${z.major_areas.join(', ')}"`,
      getAgenciesForZone(z.zone_name).length
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Proline_Zone_Master_Territories_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {successNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {successNotice}
        </div>
      )}

      {/* Regional Analytics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Surat City Region Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(180, 83, 9, 0.05))',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={15} /> Surat City Territory Master
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.2)', padding: '0.2rem 0.65rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              5 Master Zones
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc' }}>
              {cityAgenciesCount}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>Mapped B2B Agencies</span>
          </div>

          <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Covers <strong>{totalCityAreas} urban localities & commercial hubs</strong> (City-A to City-E)
          </div>
        </div>

        {/* South Gujarat Rural Region Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(4, 120, 87, 0.05))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={15} /> South Gujarat Rural Territory Master
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.65rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              4 Master Zones
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc' }}>
              {ruralAgenciesCount}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>Mapped Rural Agencies</span>
          </div>

          <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Covers <strong>{totalRuralAreas} regional towns & talukas</strong> (Upper South, South, East, North)
          </div>
        </div>

      </div>

      {/* Control Toolbar Bar: Segmented Region Selector & Custom Zone Button */}
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
        {/* Segmented Region Pills */}
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
            All 9 Zones ({zonesList.length})
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
            <Building2 size={13} /> Surat City (5)
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
            <Map size={13} /> South Gujarat Rural (4)
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsAddZoneModalOpen(true)}
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
            <Plus size={14} /> Create Custom Zone
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Upload CSV sheet for bulk importing sales zones"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid rgba(2, 132, 199, 0.4)',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <FileSpreadsheet size={14} /> 📥 Import Sheet (.CSV)
          </button>

          <button
            onClick={() => downloadSampleCSV('zones')}
            title="Download sample sheet for bulk uploading zones"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #38bdf8',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <FileSpreadsheet size={14} /> Download Sample Sheet (.CSV)
          </button>

          <button
            onClick={handleDownloadZoneCSV}
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
            <Download size={14} /> Export Territory CSV
          </button>
        </div>
      </div>

      {/* Zone Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredZones.map(zone => {
          const zoneAgencies = getAgenciesForZone(zone.zone_name);
          const isSelected = selectedZoneId === zone.id;
          const isSurat = zone.region === 'Surat City Zone';
          const isEditing = editingZoneId === zone.id;
          const areaInputVal = newAreaInputs[zone.id] || '';

          return (
            <div
              key={zone.id}
              style={{
                background: '#141f36',
                borderRadius: '16px',
                border: isSelected ? '2px solid #38bdf8' : '1px solid #1e293b',
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 8px 30px rgba(56, 189, 248, 0.25)' : '0 4px 15px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div>
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      background: isSurat ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isSurat ? '#fbbf24' : '#34d399',
                      border: isSurat ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      marginBottom: '0.4rem'
                    }}>
                      {isSurat ? <Building2 size={11} /> : <Globe size={11} />} {zone.region}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {zone.zone_name} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>({zone.zone_code})</span>
                    </h3>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.775rem',
                    fontWeight: 800,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    <Users size={13} /> {zoneAgencies.length} Parties
                  </span>
                </div>

                <p style={{ fontSize: '0.785rem', color: '#94a3b8', marginBottom: '1.15rem', lineHeight: 1.45 }}>
                  {zone.description}
                </p>

                {/* Covered Locality Tag Chips & Live Area Add Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Tag size={13} color="#38bdf8" /> Covered Locality Areas ({zone.major_areas.length}):
                    </span>

                    <button
                      onClick={() => setEditingZoneId(isEditing ? null : zone.id)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit3 size={12} /> {isEditing ? 'Done' : 'Manage Tags'}
                    </button>
                  </div>

                  {/* Locality Tags Chip Container */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: 115, overflowY: 'auto', padding: '0.5rem', background: '#0b1329', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    {zone.major_areas.map((area, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          background: '#1a2744',
                          color: '#e2e8f0',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid #2e3e66',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {area}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveArea(zone.id, area)}
                            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 900, padding: 0, lineHeight: 1 }}
                            title="Remove locality area"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Quick Add Area Pill Input */}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      placeholder="+ Add locality (e.g. Parle Point, Vapi GIDC)"
                      value={areaInputVal}
                      onChange={(e) => setNewAreaInputs({ ...newAreaInputs, [zone.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddAreaToZone(zone.id); }}
                      style={{ flex: 1, padding: '0.35rem 0.6rem', background: '#0b1329', border: '1px solid #1e293b', borderRadius: '8px', color: 'white', fontSize: '0.75rem', outline: 'none' }}
                    />
                    <button
                      onClick={() => handleAddAreaToZone(zone.id)}
                      style={{ padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
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
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(56, 189, 248, 0.4)' : 'none'
                  }}
                >
                  {isSelected ? 'Close Mapped Parties Drawer' : 'Inspect Mapped Parties'} <ChevronRight size={15} />
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteZone(zone.id, zone.zone_name)}
                    title="Super Admin Authority: Delete zone master record"
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

      {/* Selected Zone Mapped Parties Re-Mapping Panel */}
      {selectedZone && (
        <div style={{ background: '#141f36', borderRadius: '16px', border: '2px solid #38bdf8', padding: '1.35rem', marginTop: '0.5rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="#38bdf8" /> Mapped Parties in {selectedZone.zone_name} ({selectedZone.region})
              </h3>
              <span style={{ fontSize: '0.785rem', color: '#94a3b8' }}>
                Locality coverage: <strong>{selectedZone.major_areas.join(', ')}</strong>
              </span>
            </div>

            <button
              onClick={() => setSelectedZoneId(null)}
              style={{ background: '#0b1329', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: '8px', padding: '0.4rem 0.85rem', cursor: 'pointer', fontSize: '0.775rem', fontWeight: 800 }}
            >
              Close Panel
            </button>
          </div>

          {selectedZoneAgencies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
              No sales agencies currently assigned to this territory zone.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agency Code</th>
                    <th>Party Firm Name</th>
                    <th>Locality Area</th>
                    <th>City</th>
                    <th>GSTIN Number</th>
                    <th>Credit Limit</th>
                    <th>Assigned Territory Zone Re-Mapping</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedZoneAgencies.map(a => (
                    <tr key={a.id}>
                      <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{a.agency_code}</code></td>
                      <td><strong style={{ color: '#f8fafc' }}>{a.agency_name}</strong></td>
                      <td><span style={{ fontWeight: 700, color: '#cbd5e1' }}>{a.area_name || 'N/A'}</span></td>
                      <td><span style={{ color: '#38bdf8', fontWeight: 700 }}>{a.city}</span></td>
                      <td><code style={{ background: '#0b1329', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#34d399', fontSize: '0.75rem' }}>{a.gstin || a.gst_number || 'N/A'}</code></td>
                      <td><span style={{ fontWeight: 800, color: '#38bdf8' }}>₹{(a.credit_limit || 250000).toLocaleString()}</span></td>
                      <td>
                        <select
                          value={a.zone_name || selectedZone.zone_name}
                          onChange={(e) => handleRemapPartyZone(a.id, e.target.value)}
                          style={{
                            background: '#0b1329',
                            border: '1px solid #334155',
                            color: '#34d399',
                            fontSize: '0.775rem',
                            fontWeight: 800,
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {zonesList.map(z => (
                            <option key={z.id} value={z.zone_name}>{z.zone_name} ({z.region})</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW CUSTOM ZONE MODAL */}
      {isAddZoneModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden">
            
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create Custom Territory Zone</h3>
              </div>
              <button onClick={() => setIsAddZoneModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Territory Zone Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. City-F, West Zone, or Special Industrial Hub"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 text-white text-xs font-bold border border-slate-700 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Zone Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Z-SUR-10"
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 text-white text-xs font-mono font-bold border border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Region Scope
                  </label>
                  <select
                    value={newZoneRegion}
                    onChange={(e) => setNewZoneRegion(e.target.value as ZoneRegion)}
                    className="w-full px-3.5 py-2 bg-slate-800 text-white text-xs font-bold border border-slate-700 rounded-xl outline-none"
                  >
                    <option value="Surat City Zone">Surat City Zone</option>
                    <option value="South Gujarat Rural Zone">South Gujarat Rural Zone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Covered Localities / Areas (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="Parle Point, Piplod, Adajan, Vesu"
                  value={newZoneAreas}
                  onChange={(e) => setNewZoneAreas(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 text-white text-xs font-semibold border border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Territory Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Key commercial areas and boundaries..."
                  value={newZoneDesc}
                  onChange={(e) => setNewZoneDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 text-white text-xs border border-slate-700 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddZoneModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Save Territory Zone
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="zones"
      />

    </div>
  );
};
