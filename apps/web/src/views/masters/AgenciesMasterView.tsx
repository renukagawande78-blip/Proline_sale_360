import React, { useState, useEffect } from 'react';
import { Store, Plus, Landmark, UserCheck, Edit3, Trash2, FileSpreadsheet, DollarSign, RefreshCw, Check, AlertCircle, AlertTriangle, Upload, Download } from 'lucide-react';
import { Agency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RegisterAgencyModal } from '../../components/RegisterAgencyModal';
import { UpdateAgencyModal } from '../../components/UpdateAgencyModal';
import { UpdatePartyBalanceModal } from '../../components/UpdatePartyBalanceModal';
import { BulkImportModal } from '../../components/BulkImportModal';
import { downloadSampleCSV, exportMasterCSV } from '../../lib/masterImportExport';
import { 
  checkIsSuperAdmin, 
  fetchAgenciesFromSupabaseTable, 
  deleteAgencyFromSupabase, 
  deduplicateAgencies, 
  supabase 
} from '../../lib/supabase';

interface AgenciesMasterViewProps {
  agencies: Agency[];
  searchQuery: string;
  onAgencyRegistered?: (newAgency: Agency) => void;
  onOpenCreateOrderForAgency?: (agencyId: string) => void;
}

export const AgenciesMasterView: React.FC<AgenciesMasterViewProps> = ({ agencies, searchQuery, onAgencyRegistered, onOpenCreateOrderForAgency }) => {

  const { currentUser } = useAuth();
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedAgencyToEdit, setSelectedAgencyToEdit] = useState<Agency | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [localAgencies, setLocalAgencies] = useState<Agency[]>(agencies);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleDownloadAgencyCSV = () => {
    exportMasterCSV('agencies', localAgencies);
  };

  useEffect(() => {
    if (agencies) {
      setLocalAgencies(agencies);
    }
  }, [agencies]);

  const handleSyncLiveAgencies = async () => {
    setIsSyncing(true);
    const { agencies: liveList, error } = await fetchAgenciesFromSupabaseTable();
    if (error) {
      setFetchError(error);
    } else {
      setFetchError(null);
      setLocalAgencies(liveList);
      setSuccessNotice("🔄 Synced latest sales agencies & B2B party data directly from live Supabase `agencies` table!");
      setTimeout(() => setSuccessNotice(null), 3500);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadLiveAgencies = async () => {
      const { agencies: liveList, error } = await fetchAgenciesFromSupabaseTable();
      if (isMounted) {
        if (error) {
          setFetchError(error);
        } else {
          setFetchError(null);
          setLocalAgencies(liveList);
        }
      }
    };
    loadLiveAgencies();

    // Supabase Realtime Listener for Instant Live Database Updates
    const channel = supabase
      .channel('public:agencies_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agencies' }, async () => {
        const { agencies: refreshed, error } = await fetchAgenciesFromSupabaseTable();
        if (isMounted) {
          if (error) {
            setFetchError(error);
          } else {
            setFetchError(null);
            setLocalAgencies(refreshed);
          }
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteAgency = async (agencyId: string, agencyName: string) => {
    if (window.confirm(`Are you sure you want to delete sales agency "${agencyName}"? This action is restricted to Super Admin authority.`)) {
      await deleteAgencyFromSupabase(agencyId);
      setLocalAgencies(prev => prev.filter(a => a.id !== agencyId));
      setSuccessNotice(`Agency "${agencyName}" removed from live database.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const activeAgencyList = localAgencies;

  const filteredAgencies = activeAgencyList.filter(a => 
    a.agency_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.agency_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.zone_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.pincode || a.pin_code || '').includes(searchQuery) ||
    (a.assigned_salesperson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <RegisterAgencyModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(newAgency) => {
          setLocalAgencies(prev => [newAgency, ...prev]);
          if (onAgencyRegistered) onAgencyRegistered(newAgency);
        }}
      />

      <UpdateAgencyModal
        isOpen={!!selectedAgencyToEdit}
        onClose={() => setSelectedAgencyToEdit(null)}
        agency={selectedAgencyToEdit}
        onSuccess={(updated) => {
          setLocalAgencies(prev => prev.map(a => a.id === updated.id ? updated : a));
        }}
      />

      <UpdatePartyBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        masterType="agencies"
        onImportSuccess={(importedData) => {
          const formatted: Agency[] = importedData.map((r: any, i: number) => ({
            id: 'ag_imp_' + Date.now() + '_' + i,
            agency_code: r.agency_code || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
            agency_name: r.agency_name || 'Imported Agency',
            city: r.city || 'Surat',
            area_name: r.area_name || 'Central Zone',
            pincode: r.pincode || r.pin_code || '',
            contact_person: r.contact_person || 'Haresh Patel',
            mobile: r.mobile || '9898000000',
            email: r.email || 'party@proline.com',
            gstin: r.gstin || '24AAACI1234F1Z9',
            credit_limit: Number(r.credit_limit) || 250000,
            assigned_salesperson: r.assigned_salesperson || 'Chirag Patel'
          }));
          setLocalAgencies(prev => [...formatted, ...prev]);
          setSuccessNotice(`Successfully imported ${formatted.length} Agencies / B2B Parties into live view!`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Agency / Party Master Directory</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Registered Sales Agencies, B2B Superstockists & Authorized Dealers ({activeAgencyList.length})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline"
            onClick={() => setIsBulkImportOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#fbbf24', color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem' }}
          >
            <Upload size={14} /> Bulk Import Agencies CSV
          </button>
          <button 
            className="btn btn-outline"
            onClick={handleDownloadAgencyCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#34d399', color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}
          >
            <Download size={14} /> Export Agencies CSV
          </button>
        </div>
      </div>

      {fetchError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          padding: '0.85rem 1rem',
          borderRadius: 10,
          fontSize: '0.825rem',
          fontWeight: 700,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          <span>Database connection notice: {fetchError}. Displaying local cached records.</span>
        </div>
      )}

      {successNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#34d399',
          padding: '0.85rem 1rem',
          borderRadius: 10,
          fontSize: '0.825rem',
          fontWeight: 700,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Agency / Party Name</th>
              <th>Zone & Territory</th>
              <th>PIN Code</th>
              <th>GSTIN & Account Group</th>
              <th>Contact Person & Mobile</th>
              <th>Assigned Salesperson</th>
              <th>Credit Limit</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgencies.map(a => {
              const isSurat = a.zone_region === 'Surat City Zone';
              return (
                <tr key={a.id}>
                  <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{a.agency_code || 'N/A'}</code></td>
                  <td>
                    <strong style={{ color: '#f8fafc' }}>{a.agency_name || 'N/A'}</strong>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{a.address || `${a.area_name || 'N/A'}, ${a.city || 'N/A'}`}</div>
                  </td>
                  <td>
                    {a.zone_name ? (
                      <span style={{ 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: isSurat ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isSurat ? '#fbbf24' : '#34d399',
                        border: isSurat ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {a.zone_name}
                      </span>
                    ) : null}
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginTop: a.zone_name ? 3 : 0 }}>
                      {a.area_name ? `${a.area_name}, ` : ''}{a.city || 'Gujarat'}
                    </div>
                  </td>
                  <td>
                    {a.pincode || a.pin_code ? (
                      <code style={{ 
                        color: '#fbbf24', 
                        fontWeight: 800, 
                        fontSize: '0.75rem', 
                        background: 'rgba(251, 191, 36, 0.1)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: 6, 
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        letterSpacing: '0.05em'
                      }}>
                        {a.pincode || a.pin_code}
                      </code>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.725rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#34d399', fontSize: '0.75rem' }}>{a.gstin || a.gst_number || 'N/A'}</code>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        padding: '0.12rem 0.45rem',
                        borderRadius: 4,
                        background: (a.account_group || '').toUpperCase().includes('FMCD') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: (a.account_group || '').toUpperCase().includes('FMCD') ? '#fbbf24' : '#34d399',
                        border: (a.account_group || '').toUpperCase().includes('FMCD') ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)'
                      }}>
                        {a.account_group || 'FMCG'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{a.contact_person || 'N/A'}</div>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{a.mobile || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {(a.assigned_salesperson || 'Unassigned').split(',').map((sp, sIdx) => {
                        const trimmed = sp.trim();
                        if (!trimmed) return null;
                        return (
                          <span key={sIdx} style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.25)', padding: '0.15rem 0.45rem', borderRadius: 6, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserCheck size={11} /> {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                      ₹{(Number(a.credit_limit) || 0).toLocaleString()}
                    </span>
                  </td>
                  <td><span className="status-badge status-APPROVED">MAPPED</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      {onOpenCreateOrderForAgency && (
                        <button
                          className="btn btn-primary"
                          onClick={() => onOpenCreateOrderForAgency(a.id)}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#38bdf8', color: '#0f172a' }}
                          title={`Create new sales order for ${a.agency_name}`}
                        >
                          <Plus size={13} /> Create Order
                        </button>
                      )}
                      <button
                        className="btn btn-outline"
                        onClick={() => setSelectedAgencyToEdit(a)}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Edit3 size={13} /> Edit Details
                      </button>

                      {isSuperAdmin && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteAgency(a.id, a.agency_name)}
                          title="Super Admin Authority: Delete agency master record"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Trash2 size={13} /> Delete
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
    </>
  );
};
