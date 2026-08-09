import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Building2, 
  Search, 
  X, 
  ShieldCheck, 
  Plus, 
  Tag, 
  CheckCircle2, 
  Map, 
  Users,
  ChevronRight,
  Sparkles,
  Edit2
} from 'lucide-react';
import { ZoneMaster, Agency, ZoneRegion } from '../types';
import { MOCK_ZONES } from '../lib/supabase';

interface ZoneMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
}

export const ZoneMasterModal: React.FC<ZoneMasterModalProps> = ({
  isOpen,
  onClose,
  agencies
}) => {
  const [activeRegionTab, setActiveRegionTab] = useState<'ALL' | ZoneRegion>('ALL');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zonesList, setZonesList] = useState<ZoneMaster[]>(MOCK_ZONES);
  const [isEditingAreas, setIsEditingAreas] = useState<string | null>(null); // zone id
  const [newAreaInput, setNewAreaInput] = useState('');

  if (!isOpen) return null;

  const filteredZones = zonesList.filter(z => {
    if (activeRegionTab !== 'ALL' && z.region !== activeRegionTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = z.zone_name.toLowerCase().includes(q);
      const matchCode = z.zone_code.toLowerCase().includes(q);
      const matchArea = z.major_areas.some(a => a.toLowerCase().includes(q));
      return matchName || matchCode || matchArea;
    }
    return true;
  });

  const getAgenciesForZone = (zoneName: string) => {
    return agencies.filter(a => a.zone_name === zoneName);
  };

  const selectedZone = selectedZoneId ? zonesList.find(z => z.id === selectedZoneId) : null;
  const selectedZoneAgencies = selectedZone ? getAgenciesForZone(selectedZone.zone_name) : [];

  const handleAddArea = (zoneId: string) => {
    if (!newAreaInput.trim()) return;
    setZonesList(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          major_areas: [...z.major_areas, newAreaInput.trim()]
        };
      }
      return z;
    }));
    setNewAreaInput('');
  };

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-wide">Zone Master Management</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Territory & Party Mapping
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage Surat City Zones & South Gujarat Rural Zones and view mapped sales agencies
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region & Search Controls Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveRegionTab('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRegionTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Zones ({zonesList.length})
            </button>
            <button
              onClick={() => setActiveRegionTab('Surat City Zone')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeRegionTab === 'Surat City Zone'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Surat City Zone (5)</span>
            </button>
            <button
              onClick={() => setActiveRegionTab('South Gujarat Rural Zone')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeRegionTab === 'South Gujarat Rural Zone'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>South Gujarat Rural (4)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search zone or area name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredZones.map(zone => {
              const mappedAgencies = getAgenciesForZone(zone.zone_name);
              const isSelected = selectedZoneId === zone.id;
              const isSurat = zone.region === 'Surat City Zone';

              return (
                <div
                  key={zone.id}
                  className={`bg-white dark:bg-slate-800/80 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                    isSelected 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full mb-1.5 ${
                          isSurat 
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {zone.region}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{zone.zone_name}</span>
                          <span className="text-xs font-normal text-slate-400">({zone.zone_code})</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-900">
                          <Users className="w-3.5 h-3.5" />
                          <span>{mappedAgencies.length} Parties</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                      {zone.description}
                    </p>

                    {/* Major Covered Areas */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <span className="flex items-center space-x-1">
                          <Tag className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Covered Major Areas ({zone.major_areas.length})</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingAreas(isEditingAreas === zone.id ? null : zone.id);
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        {zone.major_areas.map((area, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            {area}
                            {isEditingAreas === zone.id && (
                              <button
                                onClick={() => handleRemoveArea(zone.id, area)}
                                className="ml-1 text-slate-400 hover:text-red-500"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Add new area field when editing */}
                      {isEditingAreas === zone.id && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Add new area..."
                            value={newAreaInput}
                            onChange={(e) => setNewAreaInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddArea(zone.id);
                            }}
                            className="flex-1 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                          />
                          <button
                            onClick={() => handleAddArea(zone.id)}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {mappedAgencies.length > 0 ? `${mappedAgencies.length} Sales Agencies Auto-Mapped` : 'No Agencies Mapped'}
                    </span>
                    <button
                      onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span>{isSelected ? 'Hide Parties' : 'View Parties'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Zone Parties Detail Panel */}
          {selectedZone && (
            <div className="bg-slate-50 dark:bg-slate-800/90 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900 shadow-inner animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedZone.zone_name.slice(-1)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>Mapped Parties in {selectedZone.zone_name} ({selectedZone.region})</span>
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                        {selectedZoneAgencies.length} Total Parties
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Agencies auto-mapped based on covered area keywords ({selectedZone.major_areas.join(', ')})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedZoneId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedZoneAgencies.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No agencies currently mapped to this zone area list.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {selectedZoneAgencies.map((agency) => (
                    <div
                      key={agency.id}
                      className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {agency.agency_name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {agency.area_name || 'N/A'}, {agency.city}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {agency.agency_code}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>GSTIN: {agency.gstin || 'N/A'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Limit: ₹{(agency.credit_limit / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>9 Master Zones Configured (5 Surat City + 4 South Gujarat Rural)</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const headers = ['Zone Name', 'Zone Code', 'Region', 'Description', 'Major Covered Areas', 'Mapped Parties Count'];
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
                link.setAttribute('download', `Zone_Master_Territory_Export_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center space-x-1.5"
            >
              <span>Download Zone Master CSV</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close Master
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
