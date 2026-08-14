import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  X, 
  Building2, 
  CheckCircle2, 
  Clock, 
  FileText,
  CreditCard,
  User,
  Tag,
  Save,
  MapPin,
  Landmark,
  Sparkles,
  FileSpreadsheet,
  Upload,
  Layers
} from 'lucide-react';
import { Agency, AgencyFinancials } from '../types';
import { getAgencyFinancialsByAgencyId, updateAgencyFinancials, MOCK_AGENCIES } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { downloadSampleCSV, parseCSVContent } from '../lib/masterImportExport';

interface UpdatePartyBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAgencyId?: string;
  onSuccess?: (updatedRecord: AgencyFinancials) => void;
}

export const UpdatePartyBalanceModal: React.FC<UpdatePartyBalanceModalProps> = ({
  isOpen,
  onClose,
  initialAgencyId,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK_CSV'>('SINGLE');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  
  // Form fields
  const [creditLimit, setCreditLimit] = useState<number>(250000);
  const [currentOutstanding, setCurrentOutstanding] = useState<number>(0);
  const [overdueAmount, setOverdueAmount] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [accountType, setAccountType] = useState<string>('Sundry Debtors-Electronics');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bulk CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultId = initialAgencyId || MOCK_AGENCIES[0]?.id || '';
      setSelectedAgencyId(defaultId);
      loadAgencyFinancials(defaultId);
    }
  }, [isOpen, initialAgencyId]);

  const loadAgencyFinancials = (agencyId: string) => {
    if (!agencyId) return;
    const fin = getAgencyFinancialsByAgencyId(agencyId);
    setCreditLimit(fin.credit_limit || 250000);
    setCurrentOutstanding(fin.current_outstanding || fin.outstanding_amount || 0);
    setOverdueAmount(fin.overdue_amount || 0);
    setAdvanceAmount(fin.advance_amount || 0);
    setAccountType(fin.account_type || 'Sundry Debtors-Electronics');
    setRemarks(fin.remarks || '');
    setSuccessMsg(null);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setBulkStatus(null);
    setBulkError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = parseCSVContent(content, 'party_balances');
        if (result.success && result.data.length > 0) {
          setParsedRows(result.data);
          setBulkStatus(`Loaded ${result.data.length} row(s) from "${file.name}". Click process below to match Party IDs & update balances.`);
        } else {
          setBulkError(result.error || 'Failed to parse CSV file content.');
          setParsedRows([]);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleProcessBulkCsv = () => {
    let updatedCount = 0;
    let notFoundCount = 0;

    const rowsToProcess = parsedRows.length > 0 ? parsedRows : MOCK_AGENCIES.map(a => ({
      agency_code: a.agency_code || a.id,
      agency_name: a.agency_name,
      credit_limit: a.credit_limit || 300000,
      outstanding_balance: Math.floor((a.credit_limit || 300000) * 0.4),
      overdue_amount: 0
    }));

    rowsToProcess.forEach((row) => {
      const lookupCode = (row.agency_code || row.agency_id || row['Agency Code / Party ID'] || row.id || '').toString().trim().toLowerCase();
      const lookupName = (row.agency_name || row['Agency / Party Name'] || row.name || '').toString().trim().toLowerCase();

      // Strict Party Match by Party ID / Agency Code or Name
      const existingAgency = MOCK_AGENCIES.find(a => 
        (a.id || '').toLowerCase() === lookupCode ||
        (a.agency_code || '').toLowerCase() === lookupCode ||
        (lookupName && (a.agency_name || '').toLowerCase() === lookupName)
      );

      if (existingAgency) {
        const creditLimitVal = Number(row.credit_limit || row['Credit Limit (INR)'] || existingAgency.credit_limit || 250000);
        const outstandingVal = Number(row.outstanding_balance || row.current_outstanding || row['Current Outstanding Balance (INR)'] || 0);
        const overdueVal = Number(row.overdue_amount || row['Overdue Amount (INR)'] || 0);

        updateAgencyFinancials(existingAgency.id, {
          credit_limit: creditLimitVal,
          current_outstanding: outstandingVal,
          outstanding_amount: outstandingVal,
          overdue_amount: overdueVal,
          remarks: `Daily Bulk Balance Update by ${currentUser?.full_name || 'Accounts Officer'}`,
          updated_at: new Date().toISOString(),
          updated_by_name: currentUser?.full_name || 'Accounts Officer'
        });
        updatedCount++;
      } else {
        notFoundCount++;
      }
    });

    setBulkStatus(`✅ Successfully updated balances for ${updatedCount} existing parties matched by Party ID! (0 new party rows created${notFoundCount > 0 ? `, ${notFoundCount} unrecognized Party IDs skipped` : ''}).`);
    
    setTimeout(() => {
      onClose();
      setCsvFile(null);
      setParsedRows([]);
      setBulkStatus(null);
    }, 1800);
  };

  if (!isOpen) return null;

  const selectedAgency = MOCK_AGENCIES.find(a => a.id === selectedAgencyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgencyId) return;

    setIsSubmitting(true);

    const updatedRecord = updateAgencyFinancials(selectedAgencyId, {
      credit_limit: Number(creditLimit),
      current_outstanding: Number(currentOutstanding),
      outstanding_amount: Number(currentOutstanding),
      overdue_amount: Number(overdueAmount),
      advance_amount: Number(advanceAmount),
      account_type: accountType,
      remarks: remarks.trim() || 'Balance updated by Accounts Officer',
      updated_at: new Date().toISOString(),
      updated_by_name: currentUser?.full_name || 'Accounts Officer'
    });

    setIsSubmitting(false);
    setSuccessMsg(`Financial ledger balance for "${selectedAgency?.agency_name}" saved & updated successfully!`);

    if (onSuccess) {
      onSuccess(updatedRecord);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const calculatedAvailableCredit = Math.max(0, Number(creditLimit) - Number(currentOutstanding) + Number(advanceAmount));

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: 720, 
          width: '95vw', 
          background: '#0f172a', 
          border: '1px solid #38bdf8', 
          borderRadius: 20, 
          padding: 0, 
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
      >
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Update Party Account Balance</h2>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '0.15rem 0.55rem', borderRadius: 6, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  Accounts Ledger
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Update party financial status, overdue balances, account type, and audit remarks for System Admin analysis
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem',
              borderRadius: 10,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0b1329' }}>
          <button
            type="button"
            onClick={() => setActiveTab('SINGLE')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: activeTab === 'SINGLE' ? '#0f172a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'SINGLE' ? '2px solid #38bdf8' : 'none',
              color: activeTab === 'SINGLE' ? '#38bdf8' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <User size={16} /> Single Party Balance Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BULK_CSV')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: activeTab === 'BULK_CSV' ? '#0f172a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'BULK_CSV' ? '2px solid #fbbf24' : 'none',
              color: activeTab === 'BULK_CSV' ? '#fbbf24' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FileSpreadsheet size={16} /> 📁 Daily Bulk CSV Balance Update
          </button>
        </div>

        {/* Modal Form / Bulk CSV Body */}
        {activeTab === 'BULK_CSV' ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 12, padding: '1rem', color: '#38bdf8', fontSize: '0.825rem' }}>
              <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: 4 }}>Daily Bulk Party Ledger Balance Sync</strong>
              Download the official sample CSV sheet, fill in daily outstanding & overdue balances for parties, and upload to update all accounts in bulk.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => downloadSampleCSV('party_balances')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.1rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'pointer'
                }}
              >
                <FileSpreadsheet size={18} /> Download Sample Sheet (.CSV)
              </button>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Template: Daily_Party_Balances_Bulk_Update_Sample.csv</span>
            </div>

            {bulkError && (
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem' }}>
                {bulkError}
              </div>
            )}

            {bulkStatus && (
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#34d399', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem' }}>
                {bulkStatus}
              </div>
            )}

            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed #38bdf8', borderRadius: 14, padding: '2rem 1rem', textAlign: 'center', background: '#0b1329', cursor: 'pointer' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCsvFileChange} 
                accept=".csv, .txt" 
                style={{ display: 'none' }} 
              />
              <Upload size={32} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
                {csvFile ? `Selected Sheet: ${csvFile.name}` : 'Click to Upload Daily Balances CSV File'}
              </h4>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Updates existing Party Balances by Party ID / Agency Code (Does NOT create new party rows)
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProcessBulkCsv();
                }}
                style={{
                  padding: '0.65rem 1.5rem',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ⚡ Update Balances by Party ID ({parsedRows.length > 0 ? parsedRows.length : 'Default'})
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {successMsg && (
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                borderRadius: 12,
                fontSize: '0.825rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Select Agency Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Select Party / Sales Agency
            </label>
            <select
              value={selectedAgencyId}
              onChange={(e) => {
                setSelectedAgencyId(e.target.value);
                loadAgencyFinancials(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: '#1e293b',
                border: '1px solid #38bdf8',
                borderRadius: 10,
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              {MOCK_AGENCIES.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.agency_name} ({agency.agency_code}) - {agency.city} [{agency.zone_name || 'City-D'}]
                </option>
              ))}
            </select>
          </div>

          {/* Selected Agency Info Chip */}
          {selectedAgency && (
            <div style={{
              padding: '0.65rem 0.95rem',
              background: '#141f36',
              borderRadius: 10,
              border: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.775rem',
              color: '#94a3b8'
            }}>
              <span>GSTIN: <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>{selectedAgency.gstin || 'N/A'}</strong></span>
              <span>Territory: <strong style={{ color: '#38bdf8' }}>{selectedAgency.area_name}, {selectedAgency.city}</strong></span>
            </div>
          )}

          {/* Account Classification Type & Credit Limit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                <Tag size={14} color="#6366f1" />
                <span>Account Type / Group</span>
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              >
                <option value="Sundry Debtors-Electronics">Sundry Debtors-Electronics</option>
                <option value="Sundry Debtors-FMCG">Sundry Debtors-FMCG</option>
                <option value="Sundry Debtors-Retail">Sundry Debtors-Retail</option>
                <option value="Advance Deposit Account">Advance Deposit Account</option>
                <option value="VIP Priority Dealer">VIP Priority Dealer</option>
                <option value="Regular Credit Account">Regular Credit Account</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                <CreditCard size={14} color="#6366f1" />
                <span>Approved Credit Limit (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Financial Amounts Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.85rem',
            padding: '1rem',
            background: '#141f36',
            borderRadius: 14,
            border: '1px solid #1e293b'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>
                Total Outstanding (₹)
              </label>
              <input
                type="number"
                min="0"
                value={currentOutstanding}
                onChange={(e) => setCurrentOutstanding(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#fb7185', marginBottom: 4 }}>
                Overdue Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                value={overdueAmount}
                onChange={(e) => setOverdueAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: 8,
                  color: '#fb7185',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
                Advance Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: 8,
                  color: '#34d399',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Calculated Available Credit Indicator */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#e2e8f0' }}>
              Calculated Net Available Credit:
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>
              ₹{calculatedAvailableCredit.toLocaleString()}
            </span>
          </div>

          {/* Remarks & Notes for System Admin Analysis */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
              <FileText size={14} color="#6366f1" />
              <span>Accounts Remark / Payment Reference Notes</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Received ₹50,000 via NEFT Ref #987123. Overdue cleared. Account approved for new orders."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Audit Timestamp Notice */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#64748b', paddingTop: '0.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={12} /> Updating as: <strong style={{ color: '#cbd5e1' }}>{currentUser?.full_name || 'Accounts Officer'}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} /> Date & Time Stamp: {new Date().toLocaleString()}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #1e293b' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.15rem',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: 10,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.35rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.825rem',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Saving Ledger Update...' : 'Save Financial Balance'}</span>
            </button>
          </div>

        </form>
        )}

      </div>
    </div>
  );
};
