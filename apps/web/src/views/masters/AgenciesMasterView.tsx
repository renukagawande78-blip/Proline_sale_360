import React, { useState, useEffect } from 'react';
import { Store, Plus, Landmark, UserCheck, Edit3, Trash2, FileSpreadsheet, DollarSign, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Agency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RegisterAgencyModal } from '../../components/RegisterAgencyModal';
import { UpdateAgencyModal } from '../../components/UpdateAgencyModal';
import { UpdatePartyBalanceModal } from '../../components/UpdatePartyBalanceModal';
import { BulkImportModal } from '../../components/BulkImportModal';
import { downloadSampleCSV } from '../../lib/masterImportExport';
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localAgencies, setLocalAgencies] = useState<Agency[]>(agencies);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterType="agencies"
        onImportSuccess={() => {
          handleSyncLiveAgencies();
        }}
      />

      {fetchError && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#fb7185',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 800,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <AlertCircle size={18} /> ⚠️ Supabase Database Fetch Error: {fetchError}
        </div>
      )}

      {successNotice && (
        <div style={{
          background: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          color: '#34d399',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 800,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleSyncLiveAgencies}
          disabled={isSyncing}
          title="Fetch latest agency records directly from live Supabase agencies table"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            fontWeight: 800,
            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: isSyncing ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} /> {isSyncing ? 'Syncing...' : '🔄 Sync Live DB'}
        </button>
        <button
          onClick={() => setIsBalanceModalOpen(true)}
          title="Bulk update party balances & credit limits for today's billing cycle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            fontWeight: 800,
            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <DollarSign size={15} /> Bulk Update Balances
        </button>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.15rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.825rem',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Plus size={16} /> Register New Sales Agency
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Agency / Party Name</th>
              <th>Zone & Territory</th>
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
