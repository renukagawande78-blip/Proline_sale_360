import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Table, Sparkles, RefreshCw } from 'lucide-react';
import { MasterType, MASTER_SCHEMAS, downloadSampleCSV, parseCSVContent } from '../lib/masterImportExport';

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
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const schema = MASTER_SCHEMAS[masterType] || MASTER_SCHEMAS.agencies;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = parseCSVContent(content, masterType);
        if (result.success) {
          setParsedData(result.data);
        } else {
          setErrorMsg(result.error || 'Failed to parse CSV file content.');
          setParsedData([]);
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading file from disk.');
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) {
      setErrorMsg('No valid data rows found to import.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const count = parsedData.length;
      setSuccessMsg(`🎉 Successfully imported ${count} record(s) into ${schema.title}!`);

      if (onImportSuccess) {
        onImportSuccess(parsedData, masterType, count);
      }

      setTimeout(() => {
        onClose();
        setFile(null);
        setParsedData([]);
        setSuccessMsg(null);
      }, 1500);
    }, 800);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="modal-card"
        style={{
          maxWidth: 820,
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
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Bulk Import Data Sheet (.CSV)</h2>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.15rem 0.55rem', borderRadius: 6, border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  {schema.title}
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Upload your structured CSV file or download the sample sheet template to bulk update master records
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

        {/* Modal Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Banner & Sample Download */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.85rem 1.15rem', borderRadius: 14, border: '1px solid #334155' }}>
            <div>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>Need the CSV Template?</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Download pre-formatted sample sheet with example column headers</span>
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
              <FileSpreadsheet size={15} /> Download Sample Sheet (.CSV)
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

          {/* File Upload Drop Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #38bdf8',
              borderRadius: 16,
              padding: '2rem 1.5rem',
              textAlign: 'center',
              background: '#0b1329',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv, .txt" 
              style={{ display: 'none' }} 
            />
            <Upload size={36} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
              {file ? `File Selected: ${file.name}` : 'Click or Drag & Drop CSV Sheet Here'}
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              Supports `.csv` files. Uploading will automatically validate headers against `{schema.columns.map(c => c.header).slice(0, 4).join(', ')}...`
            </p>
          </div>

          {/* Parsed Data Preview Table */}
          {parsedData.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Table size={15} /> Previewing {parsedData.length} Row(s) Ready for Bulk Import
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Showing top 5 entries</span>
              </div>

              <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: '1px solid #1e293b', background: '#0b1329' }}>
                <table className="data-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      {schema.columns.slice(0, 6).map(col => (
                        <th key={col.key}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {schema.columns.slice(0, 6).map(col => (
                          <td key={col.key}>
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                              {String(row[col.key] || row[col.header] || '-')}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
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
              type="button"
              disabled={parsedData.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.5rem',
                background: parsedData.length > 0 ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#1e293b',
                color: parsedData.length > 0 ? '#ffffff' : '#64748b',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: 10,
                border: 'none',
                cursor: parsedData.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: parsedData.length > 0 ? '0 4px 15px rgba(2, 132, 199, 0.35)' : 'none',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              <Sparkles size={16} />
              <span>{isProcessing ? 'Processing Import...' : `⚡ Confirm & Execute Bulk Import (${parsedData.length})`}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
