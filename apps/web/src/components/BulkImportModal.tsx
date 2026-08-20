import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Table, 
  Sparkles, 
  RefreshCw,
  FileText,
  Check,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';
import { MasterType, MASTER_SCHEMAS, downloadSampleCSV } from '../lib/masterImportExport';
import { 
  saveAgencyToSupabase, 
  importBulkAgenciesRPC,
  saveProductToSupabase,
  saveCompanyToSupabase,
  saveUserToSupabase,
  saveAreaToSupabase, 
  generateNewAgencyCode, 
  generateNewBarcodeSKUCode,
  resolveZoneForAreaAndCity,
  deduplicateAgencies 
} from '../lib/supabase';
import { Agency } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterType: MasterType;
  onImportSuccess?: (importedRows: any[], masterType: MasterType, count: number) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  masterType,
  onImportSuccess
}) => {
  // Input Mode: 'file' | 'paste'
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('paste');
  const [rawCsvText, setRawCsvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Header Mapping & Preview State
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'input' | 'mapping' | 'uploading' | 'completed'>('input');
  
  // Progress & Execution State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentExecutingItem, setCurrentExecutingItem] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const schema = MASTER_SCHEMAS[masterType] || MASTER_SCHEMAS.agencies;

  // Split CSV line handling quotes safely
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  // Step 1: Process Raw CSV Text or File
  const handleParseCsvData = (csvContent: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      setErrorMsg('CSV text is empty! Please paste rows or upload a valid CSV file.');
      return;
    }

    const headers = parseCsvLine(lines[0]).map(h => h.replace(/^[\uFEFF]/, '').trim());
    if (headers.length === 0) {
      setErrorMsg('No header columns found in CSV first row.');
      return;
    }

    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      if (vals.length > 0 && vals.some(v => v.trim().length > 0)) {
        rows.push(vals);
      }
    }

    if (rows.length === 0) {
      setErrorMsg('No data rows found below CSV header line.');
      return;
    }

    // Auto-map detected CSV headers to target schema keys
    const initialMap: Record<string, string> = {};
    schema.columns.forEach(col => {
      const colHeaderLower = col.header.toLowerCase();
      const colKeyLower = col.key.toLowerCase();

      // Find matching index in CSV headers
      const matchedIdx = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        if (colKeyLower === 'agency_name' && (hLower.includes('party') || hLower.includes('agency') || hLower.includes('firm') || hLower.includes('name'))) return true;
        if (colKeyLower === 'product_name' && (hLower.includes('product') || hLower.includes('sku') || hLower.includes('item') || hLower.includes('title') || hLower.includes('name'))) return true;
        if (colKeyLower === 'company_name' && (hLower.includes('brand') || hLower.includes('company') || hLower.includes('manufacturer'))) return true;
        if (colKeyLower === 'full_name' && (hLower.includes('user') || hLower.includes('full') || hLower.includes('name'))) return true;
        if (colKeyLower === 'email' && (hLower.includes('email') || hLower.includes('mail'))) return true;
        if (colKeyLower === 'gstin' && (hLower.includes('gst') || hLower.includes('tax'))) return true;
        if (colKeyLower === 'city' && (hLower.includes('city') || hLower.includes('district') || hLower.includes('location'))) return true;
        if (colKeyLower === 'area_name' && (hLower.includes('area') || hLower.includes('locality') || hLower.includes('territory'))) return true;
        if (colKeyLower === 'contact_person' && (hLower.includes('contact') || hLower.includes('person') || hLower.includes('owner'))) return true;
        if (colKeyLower === 'mobile' && (hLower.includes('mobile') || hLower.includes('phone') || hLower.includes('number'))) return true;
        if (colKeyLower === 'account_group' && (hLower.includes('group') || hLower.includes('segment') || hLower.includes('type'))) return true;
        if (colKeyLower === 'credit_limit' && (hLower.includes('credit') || hLower.includes('limit'))) return true;
        if (colKeyLower === 'agency_code' && (hLower.includes('code') || hLower.includes('id'))) return true;
        if (colKeyLower === 'product_code' && (hLower.includes('sku') || hLower.includes('barcode') || hLower.includes('code') || hLower.includes('id'))) return true;
        return hLower === colHeaderLower || hLower === colKeyLower;
      });

      if (matchedIdx !== -1) {
        initialMap[col.key] = headers[matchedIdx];
      }
    });

    setRawHeaders(headers);
    setRawRows(rows);
    setColumnMap(initialMap);
    setStep('mapping');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseCsvData(content);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Step 2: Execute Sequential One-by-One Bulk Upload to Supabase
  const handleExecuteSequentialUpload = async () => {
    setStep('uploading');
    setIsProcessing(true);
    setErrorMsg(null);
    setTotalCount(rawRows.length);

    const importedItems: any[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      setCurrentIndex(i + 1);
      const rowVals = rawRows[i];

      // Extract row data using confirmed column mapping
      const getVal = (targetKey: string): string => {
        const headerName = columnMap[targetKey];
        if (!headerName) return '';
        const idx = rawHeaders.indexOf(headerName);
        return idx !== -1 ? (rowVals[idx] || '').trim() : '';
      };

      if (masterType === 'products') {
        const name = getVal('product_name') || getVal('name') || getVal('title') || `Imported Product ${i + 1}`;
        const group = getVal('account_group') || getVal('group') || 'AKAI';
        const code = getVal('product_code') || getVal('sku_code') || getVal('code') || generateNewBarcodeSKUCode(group, name);
        const pcsPerBox = Number(getVal('pcs_per_box') || getVal('pack_size') || 24);
        const mrp = Number(getVal('mrp_price') || getVal('mrp') || 150);
        const unitPrice = Number(getVal('unit_price') || getVal('price') || mrp);
        const category = getVal('category') || 'General';
        const segment = getVal('segment') || 'FMCG';
        const stockQty = Number(getVal('stock_box_qty') || getVal('stock') || 100);

        setCurrentExecutingItem(`${name} (${code})`);

        const productRecord = {
          id: `p_bulk_${Date.now()}_${i}`,
          company_id: 'c01',
          product_code: code,
          product_name: name,
          pcs_per_box: pcsPerBox,
          mrp_price: mrp,
          unit_price: unitPrice,
          category: category,
          account_group: group,
          segment: segment,
          stock_box_qty: stockQty,
          stock_loose_pcs: 0,
          total_stock_pcs: stockQty * pcsPerBox
        };

        importedItems.push(productRecord);
        const res = await saveProductToSupabase(productRecord);
        if (!res.success && res.error) {
          console.error(`Product row ${i + 1} error:`, res.error);
        }

      } else if (masterType === 'companies') {
        const name = getVal('company_name') || getVal('name') || `Brand Company ${i + 1}`;
        const code = getVal('company_code') || getVal('code') || name.slice(0, 4).toUpperCase();
        const segment = getVal('segment') || 'FMCG';

        setCurrentExecutingItem(`${name} (${code})`);

        const companyRecord = {
          id: `c_bulk_${Date.now()}_${i}`,
          company_code: code,
          company_name: name,
          handle: code,
          segment: segment
        };

        importedItems.push(companyRecord);
        const res = await saveCompanyToSupabase(companyRecord);
        if (!res.success && res.error) {
          console.error(`Company row ${i + 1} error:`, res.error);
        }

      } else if (masterType === 'users') {
        const name = getVal('full_name') || getVal('name') || `User ${i + 1}`;
        const email = getVal('email') || `user${Date.now()}_${i}@proline.com`;
        const role = getVal('role_name') || getVal('role') || 'SALES_PERSON';
        const handle = getVal('company_handle') || getVal('handle') || 'All';
        const password = getVal('password') || '1234';

        setCurrentExecutingItem(`${name} (${email})`);

        const userRecord = {
          id: `u_bulk_${Date.now()}_${i}`,
          full_name: name,
          email: email,
          role_name: role,
          company_handle: handle,
          password: password,
          active: true
        };

        importedItems.push(userRecord);
        const res = await saveUserToSupabase(userRecord);
        if (!res.success && res.error) {
          console.error(`User row ${i + 1} error:`, res.error);
        }

      } else {
        // Agencies / B2B Parties (Default)
        const name = getVal('agency_name') || getVal('name') || getVal('party_name') || `Agency ${i + 1}`;
        const code = getVal('agency_code') || generateNewAgencyCode(getVal('city'));
        const city = getVal('city') || 'Surat';
        const area = getVal('area_name') || getVal('area') || city;
        const gstin = getVal('gstin') || getVal('gst_number') || 'N/A';
        const contact = getVal('contact_person') || getVal('contact') || 'N/A';
        const phone = getVal('mobile') || getVal('phone') || 'N/A';
        const group = getVal('account_group') || getVal('group') || 'FMCG';
        const limit = Number(getVal('credit_limit')) || 250000;

        setCurrentExecutingItem(`${name} (${gstin !== 'N/A' ? gstin : code})`);

        const resolvedZone = resolveZoneForAreaAndCity(area, city);

        const agencyRecord: Agency = {
          id: `ag_bulk_${Date.now()}_${i}`,
          agency_code: code,
          agency_name: name,
          company_id: 'c01',
          city: city,
          area_name: area,
          gstin: gstin,
          gst_number: gstin,
          account_group: group,
          contact_person: contact,
          mobile: phone,
          email: 'N/A',
          credit_limit: limit,
          bank_name: 'N/A',
          account_number: 'N/A',
          ifsc_code: 'N/A',
          branch_name: 'N/A',
          zone_name: resolvedZone.zone_name,
          zone_region: resolvedZone.region,
          active: true
        };

        importedItems.push(agencyRecord);

        const res = await saveAgencyToSupabase(agencyRecord);
        if (!res.success && res.error) {
          console.error(`Row ${i + 1} (${name}) insert error:`, res.error);
          setErrorMsg(`⚠️ Error on row ${i + 1} (${name}): ${res.error}`);
        }

        if (agencyRecord.area_name && agencyRecord.area_name !== agencyRecord.city) {
          await saveAreaToSupabase({
            id: `ar_${Date.now()}_${i}`,
            area_code: agencyRecord.agency_code || 'AR-001',
            area_name: agencyRecord.area_name || agencyRecord.city || 'Surat',
            city: agencyRecord.city || 'Surat',
            zone_code: 'ZN-SUR-A',
            region: agencyRecord.zone_region || 'Surat City Zone',
            description: `Auto-mapped area for ${agencyRecord.agency_name}`
          });
        }
      }

      // Small pause for visual feedback
      await new Promise(r => setTimeout(r, 40));
    }

    if (masterType === 'agencies' && importedItems.length > 0) {
      const rpcRes = await importBulkAgenciesRPC(importedItems as Agency[]);
      if (rpcRes.success) {
        console.log(`✅ Bulk RPC Function inserted ${rpcRes.count} agencies into Supabase!`);
      }
    }

    setIsProcessing(false);
    setStep('completed');
    setSuccessMsg(`🎉 Successfully inserted/updated ${rawRows.length} ${masterType} record(s) in Supabase database!`);

    if (onImportSuccess) {
      onImportSuccess(importedItems, masterType, rawRows.length);
    }
  };


  const progressPercentage = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="modal-card"
        style={{
          maxWidth: 880,
          width: '95vw',
          background: '#0f172a',
          border: '1px solid #38bdf8',
          borderRadius: 20,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Header */}
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
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Upload size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Interactive CSV Bulk Registration</h2>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.15rem 0.55rem', borderRadius: 6, border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  {schema.title}
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Paste raw CSV text or upload a CSV file, verify column headers, and upload records sequentially to Supabase
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Info Banner & Template Download */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.85rem 1.15rem', borderRadius: 14, border: '1px solid #334155' }}>
            <div>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>Need the CSV Template Format?</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Download pre-formatted sample sheet with standard column headers</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleCSV(masterType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={15} /> Download CSV Template
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', borderRadius: 12, fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#34d399', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: INPUT MODE SELECTOR (Paste Text or Upload File) */}
          {step === 'input' && (
            <>
              {/* Toggle Input Mode */}
              <div style={{ display: 'flex', gap: '0.5rem', background: '#0b1329', padding: '0.35rem', borderRadius: 12, border: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: 8,
                    border: 'none',
                    background: inputMode === 'paste' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                    color: inputMode === 'paste' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <FileText size={16} /> 📋 Option 1: Paste CSV Text Directly
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: 8,
                    border: 'none',
                    background: inputMode === 'file' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                    color: inputMode === 'file' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Upload size={16} /> 📁 Option 2: Upload CSV File
                </button>
              </div>

              {/* Paste Textarea */}
              {inputMode === 'paste' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Paste your CSV Rows Below (Including Column Header Line):
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`agency_name, gstin, city, area_name, contact_person, mobile\nShree Ram Agency, 24AAACS1234A1Z1, Surat, Varachha, Ramesh Patel, 9825012345\nMahadev Traders, 24BBBCD5678B2Z2, Surat, Katargam, Suresh Shah, 9898023456`}
                    value={rawCsvText}
                    onChange={(e) => setRawCsvText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070e20',
                      border: '1.5px solid #1e3a5f',
                      borderRadius: 12,
                      padding: '0.85rem',
                      color: '#34d399',
                      fontSize: '0.825rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      disabled={!rawCsvText.trim()}
                      onClick={() => handleParseCsvData(rawCsvText)}
                      style={{
                        padding: '0.65rem 1.4rem',
                        background: rawCsvText.trim() ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#1e293b',
                        color: rawCsvText.trim() ? '#ffffff' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        borderRadius: 10,
                        border: 'none',
                        cursor: rawCsvText.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>Analyze CSV Headers & Verify Mapping</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* File Upload Area */
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #38bdf8',
                    borderRadius: 16,
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: '#0b1329',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv, .txt" 
                    style={{ display: 'none' }} 
                  />
                  <Upload size={40} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
                    {file ? `File Selected: ${file.name}` : 'Click or Drag & Drop CSV Sheet Here'}
                  </h4>
                  <p style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                    Supports `.csv` files. Uploading will automatically extract column headers for mapping verification.
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP 2: INTERACTIVE HEADER MAPPING VERIFICATION ("ask if correct") */}
          {step === 'mapping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.85rem 1.15rem',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
                    🔍 Header Mapping Verification Step ({rawRows.length} Rows Detected)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                    Confirm or adjust which CSV column maps to each agency attribute before starting bulk registration:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Input
                </button>
              </div>

              {/* Header Mapping Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {schema.columns.map(col => (
                  <div key={col.key} style={{ background: '#0b1329', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>
                        {col.header}
                      </label>
                      <span style={{ fontSize: '0.675rem', color: '#64748b' }}>Attribute: {col.key}</span>
                    </div>

                    <select
                      value={columnMap[col.key] || ''}
                      onChange={(e) => setColumnMap({ ...columnMap, [col.key]: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: '0.45rem 0.65rem',
                        color: '#34d399',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ color: '#64748b' }}>-- Skip / Not Provided in CSV --</option>
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={h} style={{ background: '#0f172a', color: '#fff' }}>
                          CSV Header: "{h}"
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Live Preview Table */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Table size={15} /> Mapped Data Preview (First 5 Rows)
                </div>

                <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 10, border: '1px solid #1e293b', background: '#070e20' }}>
                  <table className="data-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        {schema.columns.slice(0, 6).map(col => (
                          <th key={col.key}>{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 5).map((rowVals, rIdx) => (
                        <tr key={rIdx}>
                          {schema.columns.slice(0, 6).map(col => {
                            const headerName = columnMap[col.key];
                            const hIdx = headerName ? rawHeaders.indexOf(headerName) : -1;
                            const cellVal = hIdx !== -1 ? rowVals[hIdx] : 'N/A';
                            return (
                              <td key={col.key}>
                                <span style={{ color: cellVal && cellVal !== 'N/A' ? '#f8fafc' : '#64748b', fontWeight: 600 }}>
                                  {cellVal || 'N/A'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleExecuteSequentialUpload}
                  style={{
                    padding: '0.75rem 1.65rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Play size={18} />
                  <span>⚡ Headers Confirmed: Start Sequential Upload ({rawRows.length} Rows)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SEQUENTIAL ONE-BY-ONE UPLOADING PROGRESS */}
          {step === 'uploading' && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)', border: '2px solid #38bdf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8'
                }}>
                  <RefreshCw size={28} className="spin" />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Uploading Records One-by-One to Supabase...
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: 4, fontWeight: 700 }}>
                  Processing {currentIndex} of {totalCount}: <span style={{ color: '#34d399' }}>{currentExecutingItem}</span>
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', background: '#0b1329', height: 16, borderRadius: 10, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div 
                  style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #34d399)',
                    transition: 'width 0.1s ease',
                    borderRadius: 10
                  }}
                />
              </div>

              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8' }}>
                {progressPercentage}% Completed ({currentIndex} / {totalCount})
              </span>
            </div>
          )}

          {/* STEP 4: COMPLETED BANNER */}
          {step === 'completed' && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)', border: '2px solid #34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Bulk Registration Complete!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
                  All {totalCount} agency records were validated, mapped, and inserted into live Supabase.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 1.5rem',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close & Refresh Master View
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
