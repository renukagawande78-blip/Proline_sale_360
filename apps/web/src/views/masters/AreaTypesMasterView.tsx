import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  RefreshCw, 
  Download, 
  Layers, 
  ShieldCheck, 
  Compass, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { AreaTypeMaster, Agency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { fetchAreaTypesFromSupabase, saveAreaTypeToSupabase, checkIsSuperAdmin } from '../../lib/supabase';
import { DEFAULT_AREA_TYPES, RAW_OFFICIAL_AREAS } from '../../data/officialAreasData';

interface AreaTypesMasterViewProps {
  agencies?: Agency[];
  searchQuery?: string;
  onNavigateToAreas?: (regionFilter: 'City' | 'Rural') => void;
}

export const AreaTypesMasterView: React.FC<AreaTypesMasterViewProps> = ({
  agencies = [],
  searchQuery = '',
  onNavigateToAreas
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);

  const [areaTypes, setAreaTypes] = useState<AreaTypeMaster[]>(DEFAULT_AREA_TYPES);
  const [selectedType, setSelectedType] = useState<AreaTypeMaster | null>(DEFAULT_AREA_TYPES[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingType, setEditingType] = useState<AreaTypeMaster | null>(null);
  const [editSla, setEditSla] = useState('');
  const [editVehicle, setEditVehicle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchAreaTypesFromSupabase().then(data => {
      if (data && data.length > 0) {
        setAreaTypes(data);
        if (!selectedType) setSelectedType(data[0]);
      }
    });
  }, []);

  const handleSyncLive = async () => {
    setIsSyncing(true);
    const data = await fetchAreaTypesFromSupabase();
    if (data && data.length > 0) {
      setAreaTypes(data);
      setSuccessNotice('🔄 Area types synchronized with database!');
      setTimeout(() => setSuccessNotice(null), 3000);
    }
    setIsSyncing(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    const updated: AreaTypeMaster = {
      ...editingType,
      delivery_sla: editSla.trim() || editingType.delivery_sla,
      default_vehicle_mode: editVehicle.trim() || editingType.default_vehicle_mode,
      description: editDesc.trim() || editingType.description
    };

    setAreaTypes(prev => prev.map(t => t.type_code === updated.type_code ? updated : t));
    if (selectedType?.type_code === updated.type_code) {
      setSelectedType(updated);
    }

    await saveAreaTypeToSupabase(updated);
    setEditingType(null);
    setSuccessNotice(`✅ Area Type "${updated.type_name}" updated successfully!`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = ['Type Code', 'Type Name', 'Description', 'Delivery SLA', 'Transport Mode', 'Total Localities', 'Associated Zones'];
    const rows = areaTypes.map(t => [
      t.type_code,
      t.type_name,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.delivery_sla}"`,
      `"${t.default_vehicle_mode}"`,
      t.localities_count || 0,
      `"${t.associated_zones.join(', ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Area_Types_Master_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTypes = areaTypes.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.type_name.toLowerCase().includes(q) ||
      t.type_code.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.associated_zones.some(z => z.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notice */}
      {successNotice && (
        <div style={{ background: '#064e3b', border: '1px solid #059669', color: '#6ee7b7', padding: '0.75rem 1.25rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
          {successNotice}
        </div>
      )}

      {/* KPI Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* City Type Summary Card */}
        <div 
          onClick={() => setSelectedType(areaTypes.find(t => t.type_name === 'City') || null)}
          style={{
            background: selectedType?.type_name === 'City' ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
            border: selectedType?.type_name === 'City' ? '2px solid #38bdf8' : '1px solid #334155',
            borderRadius: 12,
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: selectedType?.type_name === 'City' ? '0 8px 24px rgba(56, 189, 248, 0.2)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <Building2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>City</h3>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>CODE: CITY</span>
              </div>
            </div>
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
              5 Zones • 47 Areas
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
            Surat Municipal Corporation urban areas, textile markets, diamond corridor & local industrial belts.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#cbd5e1', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span>⚡ SLA: <strong>Same Day (4-8 Hrs)</strong></span>
            <span>🚚 Transport: <strong>Local Tempo / Van</strong></span>
          </div>
        </div>

        {/* Rural Type Summary Card */}
        <div 
          onClick={() => setSelectedType(areaTypes.find(t => t.type_name === 'Rural') || null)}
          style={{
            background: selectedType?.type_name === 'Rural' ? 'rgba(52, 211, 153, 0.12)' : '#1e293b',
            border: selectedType?.type_name === 'Rural' ? '2px solid #34d399' : '1px solid #334155',
            borderRadius: 12,
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: selectedType?.type_name === 'Rural' ? '0 8px 24px rgba(52, 211, 153, 0.2)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(52, 211, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <Compass size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Rural</h3>
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>CODE: RURAL</span>
              </div>
            </div>
            <span style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
              4 Zones • 28 Areas
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
            South Gujarat highway, outstation, taluka, and heavy industrial corridors (Vapi, Navsari, Bardoli, Bharuch).
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#cbd5e1', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span>⚡ SLA: <strong>Next Day (24-48 Hrs)</strong></span>
            <span>🚚 Transport: <strong>F.O.R Heavy Truck</strong></span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table Header Controls */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Area Classification Types Master
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
              Standard operational classification governing territory logistics, delivery SLAs, and vehicle dispatch modes
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={handleSyncLive}
              disabled={isSyncing}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Database'}
            </button>
            <button 
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, borderColor: '#34d399', color: '#34d399' }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>AREA TYPE CODE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>AREA TYPE NAME</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>DESCRIPTION / SCOPE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>ASSOCIATED ZONES</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>LOCALITIES COUNT</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>DELIVERY SLA</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>DEFAULT DISPATCH MODE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map(t => {
                const isCity = t.type_name === 'City';
                const isSelected = selectedType?.type_code === t.type_code;

                return (
                  <tr 
                    key={t.type_code}
                    onClick={() => setSelectedType(t)}
                    style={{
                      borderBottom: '1px solid #334155',
                      background: isSelected ? (isCity ? 'rgba(56, 189, 248, 0.08)' : 'rgba(52, 211, 153, 0.08)') : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Type Code */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 6,
                        background: isCity ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: isCity ? '#38bdf8' : '#34d399',
                        border: isCity ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)'
                      }}>
                        {t.type_code}
                      </span>
                    </td>

                    {/* Type Name */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCity ? <Building2 size={16} color="#38bdf8" /> : <Compass size={16} color="#34d399" />}
                        <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{t.type_name}</strong>
                      </div>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '1rem', minWidth: 260, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {t.description}
                    </td>

                    {/* Associated Zones */}
                    <td style={{ padding: '1rem', minWidth: 220 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {t.associated_zones.map(z => (
                          <span 
                            key={z}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#0f172a',
                              color: '#cbd5e1',
                              border: '1px solid #334155',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 4
                            }}
                          >
                            {z}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Localities Count */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
                        {t.localities_count} Localities
                      </span>
                    </td>

                    {/* Delivery SLA */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>
                        <Clock size={13} /> {t.delivery_sla}
                      </div>
                    </td>

                    {/* Dispatch Mode */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                        <Truck size={13} color="#38bdf8" /> {t.default_vehicle_mode}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 20,
                        border: '1px solid rgba(52, 211, 153, 0.3)'
                      }}>
                        ACTIVE
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {isSuperAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingType(t);
                              setEditSla(t.delivery_sla);
                              setEditVehicle(t.default_vehicle_mode);
                              setEditDesc(t.description);
                            }}
                            className="btn btn-outline"
                            title="Edit SLA & Specifications"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                        {onNavigateToAreas && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToAreas(t.type_name);
                            }}
                            className="btn btn-outline"
                            title="View Localities in Area Master"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', borderColor: '#38bdf8', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            <ExternalLink size={12} /> View Areas
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

      {/* Selected Area Type Drilldown */}
      {selectedType && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                Localities Mapping Drilldown for: <span style={{ color: selectedType.type_name === 'City' ? '#38bdf8' : '#34d399' }}>{selectedType.type_name}</span>
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Showing all official localities categorized under {selectedType.type_name}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
            {RAW_OFFICIAL_AREAS
              .filter(a => a.region === selectedType.type_name)
              .map((area, i) => (
                <div 
                  key={area.area_name + i}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    padding: '0.6rem 0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: '#f8fafc', display: 'block' }}>{area.area_name}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{area.city}</span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: selectedType.type_name === 'City' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                    color: selectedType.type_name === 'City' ? '#38bdf8' : '#34d399',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 4
                  }}>
                    {area.zone_name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Area Type Modal */}
      {editingType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 14,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Edit Specifications: {editingType.type_name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingType(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Delivery SLA Rule
                </label>
                <input 
                  type="text"
                  value={editSla}
                  onChange={e => setEditSla(e.target.value)}
                  placeholder="e.g. Within 4-8 Hours (Same Day Delivery)"
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#f8fafc', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Default Transport & Vehicle Mode
                </label>
                <input 
                  type="text"
                  value={editVehicle}
                  onChange={e => setEditVehicle(e.target.value)}
                  placeholder="e.g. Local Tempo / Van / Chhota Hathi"
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#f8fafc', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Description / Operational Scope
                </label>
                <textarea 
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#f8fafc', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
