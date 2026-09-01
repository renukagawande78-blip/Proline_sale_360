import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, PackageX, RefreshCw, FileText } from 'lucide-react';
import { Order } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface PODVerificationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPOD: (orderId: string, podStatus: 'CLEAN' | 'ISSUE_RAISED', issueType?: 'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' | 'OTHER', details?: string) => void;
}

export const PODVerificationModal: React.FC<PODVerificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPOD
}) => {
  const { addNotification } = useNotifications();
  const [verificationType, setVerificationType] = useState<'CLEAN' | 'ISSUE_RAISED'>('CLEAN');
  const [issueType, setIssueType] = useState<'SHORTAGE' | 'DAMAGED' | 'GOOD_RETURN' | 'OTHER'>('SHORTAGE');
  const [details, setDetails] = useState('');

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    if (verificationType === 'CLEAN') {
      onConfirmPOD(order.id, 'CLEAN');
      addNotification({
        title: `✅ POD Verified Clean: ${order.order_number}`,
        message: `Delivery confirmed with no issues for ${order.agency_name}. Order marked COMPLETED.`,
        event_type: 'POD_CLEAN',
        order_id: order.id
      });
    } else {
      const issueDescriptions: Record<string, string> = {
        SHORTAGE: 'Shortage reported — Discrepancy in Delivered Quantity',
        DAMAGED: 'Damaged Goods reported — Physical Goods Damaged in Transport',
        GOOD_RETURN: 'Good Return — Intact Goods Returned by Customer',
        OTHER: 'Delivery Exception reported during drop'
      };
      const note = details.trim() || issueDescriptions[issueType] || 'Delivery exception reported during drop';
      onConfirmPOD(order.id, 'ISSUE_RAISED', issueType, note);
      addNotification({
        title: `⚠️ Delivery Exception Raised: ${order.order_number}`,
        message: `Delivery Issue (${issueType}) reported for ${order.agency_name}. Exception alert sent to Chirag Sir (Super Admin) & Sales Admin Exception Desk. Notes: "${note}"`,
        event_type: 'POD_ISSUE_RAISED',
        order_id: order.id
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 540 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FileText size={22} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Stage 6: Delivery Drop & POD Verification
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Order Details Banner */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
          <div>Order Number: <strong style={{ color: '#38bdf8' }}>{order.order_number}</strong></div>
          <div style={{ marginTop: 3 }}>B2B Agency: <strong style={{ color: '#f8fafc' }}>{order.agency_name}</strong></div>
          <div style={{ marginTop: 3 }}>Driver / Vehicle: <strong style={{ color: '#34d399' }}>{order.driver_name || 'Assigned Driver'} ({order.vehicle_number || 'Transport'})</strong></div>
        </div>

        {/* Verification Option Buttons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>
            SELECT POD VERIFICATION STATUS
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setVerificationType('CLEAN')}
              style={{
                padding: '0.85rem',
                borderRadius: 8,
                border: verificationType === 'CLEAN' ? '2px solid #34d399' : '1px solid #334155',
                background: verificationType === 'CLEAN' ? 'rgba(52, 211, 153, 0.15)' : '#0f172a',
                color: verificationType === 'CLEAN' ? '#34d399' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle size={18} /> POD Verified — No Issue
            </button>

            <button
              type="button"
              onClick={() => setVerificationType('ISSUE_RAISED')}
              style={{
                padding: '0.85rem',
                borderRadius: 8,
                border: verificationType === 'ISSUE_RAISED' ? '2px solid #f43f5e' : '1px solid #334155',
                background: verificationType === 'ISSUE_RAISED' ? 'rgba(244, 63, 94, 0.15)' : '#0f172a',
                color: verificationType === 'ISSUE_RAISED' ? '#fb7185' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <AlertTriangle size={18} /> POD Verified — Issue Raised
            </button>
          </div>
        </div>

        {/* Issue Details Form (If Issue Raised) */}
        {verificationType === 'ISSUE_RAISED' && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#fb7185', marginBottom: 4 }}>
              SELECT DELIVERY EXCEPTION TYPE
            </label>
            <select
              value={issueType}
              onChange={e => setIssueType(e.target.value as any)}
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontWeight: 700, marginBottom: '0.65rem', fontSize: '0.8rem' }}
            >
              <option value="SHORTAGE">🚨 Shortage — Discrepancy in Delivered Quantity</option>
              <option value="DAMAGED">📦 Damaged Goods — Physical Goods Damaged in Transport</option>
              <option value="GOOD_RETURN">🔄 Good Return — Intact Goods Returned by Customer</option>
              <option value="OTHER">📝 Other — Any Other Delivery Query</option>
            </select>

            <textarea
              rows={3}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Enter the message received from the salesperson or driver..."
              style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: 'white', fontSize: '0.8rem' }}
            />
            <span style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 700, display: 'block', marginTop: 6 }}>
              ⚠️ Exception alert will be automatically routed to Chirag Sir (Super Admin) & Sales Admin Exception Desk.
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={verificationType === 'CLEAN' ? 'btn btn-success' : 'btn btn-danger'}
            onClick={handleConfirm}
            style={{ fontWeight: 800, cursor: 'pointer' }}
          >
            {verificationType === 'CLEAN' ? 'Confirm Delivery (Clean POD)' : 'Raise Delivery Exception to Chirag Sir'}
          </button>
        </div>

      </div>
    </div>
  );
};
