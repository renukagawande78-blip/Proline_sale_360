import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, PackageX, FileText, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Order } from '../types';

interface PODVerificationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPOD: (
    orderId: string,
    podStatus: 'CLEAN' | 'ISSUE_RAISED',
    issueType?: 'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' | 'OTHER',
    details?: string,
    resolutionAction?: 'CREATE_GRN' | 'REATTEMPT_DELIVERY'
  ) => void;
}

export const PODVerificationModal: React.FC<PODVerificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPOD
}) => {
  const [verificationType, setVerificationType] = useState<'CLEAN' | 'ISSUE_RAISED'>('CLEAN');
  const [resolutionAction, setResolutionAction] = useState<'CREATE_GRN' | 'REATTEMPT_DELIVERY'>('CREATE_GRN');
  const [issueType, setIssueType] = useState<'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' | 'OTHER'>('SHORTAGE');
  const [details, setDetails] = useState('');

  if (!isOpen || !order) return null;

  const reattemptOrderNumber = `RN-${order.order_number.replace(/^RN-/, '')}`;

  const handleConfirm = () => {
    if (verificationType === 'CLEAN') {
      onConfirmPOD(order.id, 'CLEAN');
    } else {
      const issueDescriptions: Record<string, string> = {
        SHORTAGE: 'Shortage reported — Discrepancy in Delivered Quantity',
        DAMAGED: 'Damaged Goods reported — Physical Goods Damaged in Transport',
        GOOD_RETURN: 'Good Return — Intact Goods Returned by Customer',
        OTHER: 'Delivery Exception reported during drop'
      };
      const note = details.trim() || issueDescriptions[issueType] || 'Delivery exception reported during drop';
      onConfirmPOD(order.id, 'ISSUE_RAISED', issueType, note, resolutionAction);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 580 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FileText size={22} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Stage 6: Delivery Drop &amp; POD Verification
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Order Details Banner */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div>Order Number: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></div>
            <div>Bill No: <strong style={{ color: '#fbbf24' }}>{order.invoice_number || '—'}</strong></div>
          </div>
          <div style={{ marginTop: 4 }}>B2B Agency: <strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong></div>
          <div style={{ marginTop: 4 }}>Driver / Vehicle: <strong style={{ color: '#34d399' }}>{order.driver_name || 'Assigned Driver'} ({order.vehicle_number || 'Transport'})</strong></div>
        </div>

        {/* 2 Clear POD Options */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CHOOSE POD ACTION (2 OPTIONS)
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            
            {/* OPTION 1: CLEAN POD */}
            <button
              type="button"
              onClick={() => setVerificationType('CLEAN')}
              style={{
                padding: '1rem 0.85rem',
                borderRadius: 10,
                border: verificationType === 'CLEAN' ? '2px solid #34d399' : '1px solid #334155',
                background: verificationType === 'CLEAN' ? 'rgba(52, 211, 153, 0.12)' : '#0f172a',
                color: verificationType === 'CLEAN' ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                transition: 'all 0.2s ease',
                boxShadow: verificationType === 'CLEAN' ? '0 0 15px rgba(52, 211, 153, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.875rem' }}>
                <CheckCircle size={18} color={verificationType === 'CLEAN' ? '#34d399' : '#64748b'} />
                <span>1. Clean POD</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: verificationType === 'CLEAN' ? '#cbd5e1' : '#64748b', lineHeight: 1.35 }}>
                Delivered safely with store stamp. No discrepancy. Mark COMPLETED.
              </span>
            </button>

            {/* OPTION 2: CREATE GRN / ISSUE RAISED */}
            <button
              type="button"
              onClick={() => setVerificationType('ISSUE_RAISED')}
              style={{
                padding: '1rem 0.85rem',
                borderRadius: 10,
                border: verificationType === 'ISSUE_RAISED' ? '2px solid #fb7185' : '1px solid #334155',
                background: verificationType === 'ISSUE_RAISED' ? 'rgba(244, 63, 94, 0.12)' : '#0f172a',
                color: verificationType === 'ISSUE_RAISED' ? '#fb7185' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                transition: 'all 0.2s ease',
                boxShadow: verificationType === 'ISSUE_RAISED' ? '0 0 15px rgba(244, 63, 94, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.875rem' }}>
                <AlertTriangle size={18} color={verificationType === 'ISSUE_RAISED' ? '#fb7185' : '#64748b'} />
                <span>2. Create GRN</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: verificationType === 'ISSUE_RAISED' ? '#cbd5e1' : '#64748b', lineHeight: 1.35 }}>
                Damage / Shortage / Return. Routes to Billing to Issue GRN.
              </span>
            </button>
          </div>
        </div>

        {/* Option 1 Guidance Banner */}
        {verificationType === 'CLEAN' && (
          <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} style={{ flexShrink: 0 }} />
            <span>Store stamp verified. Order will be marked <strong>COMPLETED</strong> in full across all dashboards.</span>
          </div>
        )}

        {/* Option 2: Delivery Exception / Issue Raised - 2 Resolution Options */}
        {verificationType === 'ISSUE_RAISED' && (
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: 10, padding: '0.95rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
              <PackageX size={18} color="#fb7185" />
              <strong style={{ fontSize: '0.8rem', color: '#fb7185' }}>SELECT EXCEPTION TYPE</strong>
            </div>

            <select
              value={issueType}
              onChange={e => setIssueType(e.target.value as any)}
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: 'white', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.825rem' }}
            >
              <option value="SHORTAGE">🚨 Shortage — Discrepancy in Delivered Quantity</option>
              <option value="DAMAGED">📦 Damaged Goods — Physical Goods Damaged in Transport</option>
              <option value="GOOD_RETURN">🔄 Good Return — Intact Goods Returned by Customer</option>
              <option value="OTHER">📝 Other — Delivery Failed / Customer Unavailable</option>
            </select>

            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
              EXCEPTION DETAILS &amp; DRIVER REMARKS
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Enter details of shortage, customer reason, shop closed, or driver report..."
              style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, color: 'white', fontSize: '0.8rem', resize: 'vertical', marginBottom: '0.85rem' }}
            />

            {/* TWO OPTIONS FOR EXCEPTION HANDLING */}
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CHOOSE ACTION (2 OPTIONS)
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
              {/* Option A: Create GRN */}
              <button
                type="button"
                onClick={() => setResolutionAction('CREATE_GRN')}
                style={{
                  padding: '0.75rem 0.65rem',
                  borderRadius: 8,
                  border: resolutionAction === 'CREATE_GRN' ? '2px solid #fb7185' : '1px solid #334155',
                  background: resolutionAction === 'CREATE_GRN' ? 'rgba(244, 63, 94, 0.2)' : '#0f172a',
                  color: resolutionAction === 'CREATE_GRN' ? '#fb7185' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                  <PackageX size={15} color={resolutionAction === 'CREATE_GRN' ? '#fb7185' : '#64748b'} />
                  <span>Option 1: Create GRN</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: resolutionAction === 'CREATE_GRN' ? '#cbd5e1' : '#64748b', lineHeight: 1.3 }}>
                  Route to Billing to issue Goods Return Note &amp; settle credit.
                </span>
              </button>

              {/* Option B: Reattempt Delivery */}
              <button
                type="button"
                onClick={() => setResolutionAction('REATTEMPT_DELIVERY')}
                style={{
                  padding: '0.75rem 0.65rem',
                  borderRadius: 8,
                  border: resolutionAction === 'REATTEMPT_DELIVERY' ? '2px solid #38bdf8' : '1px solid #334155',
                  background: resolutionAction === 'REATTEMPT_DELIVERY' ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                  color: resolutionAction === 'REATTEMPT_DELIVERY' ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                  <Truck size={15} color={resolutionAction === 'REATTEMPT_DELIVERY' ? '#38bdf8' : '#64748b'} />
                  <span>Option 2: Re-attempt Delivery</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: resolutionAction === 'REATTEMPT_DELIVERY' ? '#cbd5e1' : '#64748b', lineHeight: 1.3 }}>
                  Create new order <strong>{reattemptOrderNumber}</strong> with all items copied.
                </span>
              </button>
            </div>

            {resolutionAction === 'CREATE_GRN' ? (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.6rem 0.75rem', fontSize: '0.72rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowRight size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Routing:</strong> Sent to <strong>Billing Console &rarr; "Issue GRN"</strong> tab for GRN document entry.
                </span>
              </div>
            ) : (
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: 6, padding: '0.6rem 0.75rem', fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>New Order:</strong> Creates <strong>{reattemptOrderNumber}</strong> with all process identical (Billing &rarr; Dispatch &rarr; Drop).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={verificationType === 'CLEAN' ? 'btn btn-success' : resolutionAction === 'CREATE_GRN' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={handleConfirm}
            style={{ fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {verificationType === 'CLEAN' ? (
              <>
                <CheckCircle size={16} /> Confirm Delivery (Clean POD)
              </>
            ) : resolutionAction === 'CREATE_GRN' ? (
              <>
                <PackageX size={16} /> 1. Create GRN &amp; Route to Billing
              </>
            ) : (
              <>
                <Truck size={16} /> 2. Create New Order ({reattemptOrderNumber})
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

