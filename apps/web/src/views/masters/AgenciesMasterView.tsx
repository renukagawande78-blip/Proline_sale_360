import React, { useState } from 'react';
import { Store, Plus, Landmark, UserCheck, Edit3, Trash2, FileSpreadsheet, DollarSign } from 'lucide-react';
import { Agency } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RegisterAgencyModal } from '../../components/RegisterAgencyModal';
import { UpdateAgencyModal } from '../../components/UpdateAgencyModal';
import { UpdatePartyBalanceModal } from '../../components/UpdatePartyBalanceModal';
import { BulkImportModal } from '../../components/BulkImportModal';
import { downloadSampleCSV } from '../../lib/masterImportExport';

interface AgenciesMasterViewProps {
  agencies: Agency[];
  searchQuery: string;
  onAgencyRegistered?: (newAgency: Agency) => void;
}

export const AgenciesMasterView: React.FC<AgenciesMasterViewProps> = ({ agencies, searchQuery, onAgencyRegistered }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN' || (currentUser?.full_name || '').toLowerCase().includes('chirag') || (currentUser?.full_name || '').toLowerCase().includes('harshad');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedAgencyToEdit, setSelectedAgencyToEdit] = useState<Agency | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localAgencies, setLocalAgencies] = useState<Agency[]>(agencies);

  const handleDeleteAgency = (agencyId: string, agencyName: string) => {
    if (window.confirm(`Are you sure you want to delete sales agency "${agencyName}"? This action is restricted to Super Admin authority.`)) {
      setLocalAgencies(prev => prev.filter(a => a.id !== agencyId));
    }
  };

  const activeAgencyList = localAgencies.length > 0 ? localAgencies : agencies;

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
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setIsImportModalOpen(true)}
          title="Upload CSV sheet for bulk importing agencies & B2B party records"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(2, 132, 199, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(2, 132, 199, 0.4)',
            fontWeight: 800,
            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <FileSpreadsheet size={15} /> 📥 Import Sheet (.CSV)
        </button>
        <button
          onClick={() => downloadSampleCSV('party_balances')}
          title="Download sample sheet template used for daily bulk party balance updates"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(52, 211, 153, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            fontWeight: 800,
            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <FileSpreadsheet size={15} /> Daily Balances Sample (.CSV)
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
          onClick={() => downloadSampleCSV('agencies')}
          title="Download sample sheet template used for bulk uploading agencies"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            background: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontWeight: 800,
            fontSize: '0.8rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <FileSpreadsheet size={15} /> Download Agency Sheet (.CSV)
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
              <th>Bank Account Details</th>
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
                  <td><code style={{ color: '#38bdf8', fontWeight: 800 }}>{a.agency_code}</code></td>
                  <td>
                    <strong style={{ color: '#f8fafc' }}>{a.agency_name}</strong>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{a.address || `${a.area_name}, ${a.city}`}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.2rem 0.55rem', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: isSurat ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isSurat ? '#fbbf24' : '#34d399',
                      border: isSurat ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {a.zone_name || 'City-D'}
                    </span>
                    <div style={{ fontSize: '0.725rem', color: '#38bdf8', marginTop: 3 }}>{a.area_name}, {a.city}</div>
                  </td>
                  <td>
                    <code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#34d399', fontSize: '0.75rem' }}>{a.gstin || a.gst_number || 'N/A'}</code>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{a.account_group || 'Sundry Debtors'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{a.contact_person || 'Field Dealer'}</div>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{a.mobile || '+91 98250 00000'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Landmark size={12} color="#38bdf8" /> {a.bank_name || 'HDFC Bank'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {a.account_number ? `A/C: ${a.account_number}` : 'A/C: Pending'} {a.ifsc_code ? `(${a.ifsc_code})` : ''}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.725rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.25)', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <UserCheck size={12} /> {a.assigned_salesperson || 'Chirag Patel'}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: 800, color: '#38bdf8' }}>₹{(a.credit_limit || 250000).toLocaleString()}</span></td>
                  <td><span className="status-badge status-APPROVED">MAPPED</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
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
