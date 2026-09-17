import React, { useState, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  User as UserIcon, 
  Trash2, 
  Edit3, 
  Paperclip, 
  Bell, 
  MessageSquare, 
  PlayCircle, 
  PauseCircle, 
  CheckCheck,
  Send,
  UploadCloud,
  History,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskAttachment, TaskPriority, TaskCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { getRoleBadge } from '../context/NotificationContext';
import { generateUuid } from '../lib/supabase';

interface TaskDetailsModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, remarks?: string, proofDocs?: TaskAttachment[]) => void;
  onEditTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onEditTask,
  onDeleteTask
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionProofDocs, setCompletionProofDocs] = useState<TaskAttachment[]>([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [quickRemark, setQuickRemark] = useState('');

  if (!isOpen || !task) return null;

  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN' || 
    (currentUser?.full_name || '').toLowerCase().includes('chirag') || 
    (currentUser?.full_name || '').toLowerCase().includes('harshad');

  const isAssignedUser = currentUser?.id === task.assigned_to_id || 
    (currentUser?.full_name || '').toLowerCase() === (task.assigned_to_name || '').toLowerCase();

  const canManage = isSuperAdmin || currentUser?.role_name === 'SALES_ADMIN';

  // Due status calculation
  const now = new Date();
  const dueDate = new Date(task.due_date);
  const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dueDate < now;
  
  const diffHours = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  let dueText = '';
  if (task.status === 'COMPLETED') {
    dueText = 'Completed';
  } else if (isOverdue) {
    const daysAgo = Math.abs(Math.round(diffHours / 24));
    dueText = `Overdue by ${daysAgo > 0 ? `${daysAgo} day(s)` : `${Math.abs(diffHours)} hr(s)`}`;
  } else {
    const daysLeft = Math.round(diffHours / 24);
    dueText = daysLeft > 0 ? `Due in ${daysLeft} day(s)` : `Due in ${diffHours} hr(s)`;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadAttachment = (att: TaskAttachment) => {
    try {
      const link = document.createElement('a');
      link.href = att.url;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  };

  const handleProofFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingProof(true);

    const newDocs: TaskAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        newDocs.push({
          id: generateUuid(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: base64,
          uploaded_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    setCompletionProofDocs(prev => [...prev, ...newDocs]);
    setIsUploadingProof(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCompleteTaskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateStatus(task.id, 'COMPLETED', completionRemarks.trim() || 'Task marked as completed', completionProofDocs);
    setIsCompleting(false);
    setCompletionRemarks('');
    setCompletionProofDocs([]);
    onClose();
  };

  const getPriorityStyle = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT': return { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' };
      case 'HIGH': return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' };
      case 'NORMAL': return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' };
      case 'LOW': return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' };
      default: return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#334155' };
    }
  };

  const getStatusStyle = (s: TaskStatus) => {
    switch (s) {
      case 'COMPLETED': return { label: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2 };
      case 'IN_PROGRESS': return { label: 'In Progress', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', icon: PlayCircle };
      case 'ON_HOLD': return { label: 'On Hold', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', icon: PauseCircle };
      case 'CANCELLED': return { label: 'Cancelled', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: AlertCircle };
      default: return { label: 'Pending', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: Clock };
    }
  };

  const statusMeta = getStatusStyle(task.status);
  const StatusIcon = statusMeta.icon;
  const priorityStyle = getPriorityStyle(task.priority);

  return (
    <div className="modal-overlay" style={{ zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        className="modal-container"
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 16,
          width: '100%',
          maxWidth: 840,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div 
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 8,
                background: statusMeta.bg,
                border: `1px solid ${statusMeta.color}`,
                color: statusMeta.color,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: '0.82rem'
              }}
            >
              <StatusIcon size={16} />
              <span>{statusMeta.label}</span>
            </div>

            <span 
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.05em'
              }}
            >
              {task.task_number}
            </span>

            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: 6,
                background: priorityStyle.bg,
                border: `1px solid ${priorityStyle.border}`,
                color: priorityStyle.color,
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              {task.priority} Priority
            </span>

            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: 6,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {task.category}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {canManage && onEditTask && (
              <button
                type="button"
                onClick={() => { onClose(); onEditTask(task); }}
                title="Edit Task"
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            )}

            {canManage && onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                title="Delete Task"
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  cursor: 'pointer',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={15} />
              </button>
            )}

            <button 
              type="button" 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div style={{ overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Title & Due Date Bar */}
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.4, margin: '0 0 0.75rem 0' }}>
              {task.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
              {/* Due Date Indicator */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 8,
                  background: isOverdue ? 'rgba(244, 63, 94, 0.15)' : 'rgba(30, 41, 59, 0.8)',
                  border: `1px solid ${isOverdue ? 'rgba(244, 63, 94, 0.4)' : '#334155'}`,
                  color: isOverdue ? '#f43f5e' : '#cbd5e1',
                  fontWeight: 700
                }}
              >
                <Calendar size={15} />
                <span>Target: {new Date(task.due_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({dueText})</span>
              </div>

              {/* Scheduled Reminder Badge if configured */}
              {task.reminder_date && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.35rem 0.75rem',
                    borderRadius: 8,
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    color: '#fbbf24',
                    fontSize: '0.82rem'
                  }}
                >
                  <Bell size={14} />
                  <span>Reminder: {new Date(task.reminder_date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  {task.reminder_note && (
                    <span style={{ color: '#f8fafc', fontStyle: 'italic' }}>- "{task.reminder_note}"</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* People / Assignment Cards in Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Assigned To Card */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Assigned Team Member
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}
                >
                  {task.assigned_to_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {task.assigned_to_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {task.assigned_to_role || 'Field Staff'} {task.assigned_to_email ? `• ${task.assigned_to_email}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Created By Card */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Assigned By (Manager)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}
                >
                  {task.created_by_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {task.created_by_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Created on {new Date(task.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Summary & Instructions */}
          <div style={{ background: '#141f36', border: '1px solid #1e293b', borderRadius: 12, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} />
              <span>Task Summary & Scope of Work</span>
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#f1f5f9', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
              {task.summary || 'No detailed instructions provided.'}
            </p>
          </div>

          {/* Support Documents Section */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={16} color="#38bdf8" />
              <span>Support Documents & Attached Files ({task.support_docs?.length || 0})</span>
            </h3>

            {task.support_docs && task.support_docs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {task.support_docs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                      <div style={{ padding: '0.4rem', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {formatFileSize(doc.size)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(doc)}
                      title="Download document"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0
                      }}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '0.85rem 1rem', background: '#1e293b', borderRadius: 8, color: '#64748b', fontSize: '0.85rem' }}>
                No support documents were uploaded for this task.
              </div>
            )}
          </div>

          {/* Completion Details if Completed */}
          {task.status === 'COMPLETED' && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                <CheckCheck size={18} />
                <span>Task Successfully Completed</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Completed by {task.completed_by_name || task.assigned_to_name} on {task.completed_at ? new Date(task.completed_at).toLocaleString('en-IN') : 'N/A'}
              </div>
              {task.completion_remarks && (
                <div style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: 8, color: '#f8fafc', fontSize: '0.88rem' }}>
                  <strong>Completion Remarks:</strong> {task.completion_remarks}
                </div>
              )}

              {task.completion_proof_docs && task.completion_proof_docs.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Uploaded Proof Documents:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {task.completion_proof_docs.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleDownloadAttachment(doc)}
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          padding: '0.35rem 0.75rem',
                          color: '#38bdf8',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer'
                        }}
                      >
                        <FileText size={14} />
                        <span>{doc.name}</span>
                        <Download size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Log / Timeline */}
          {task.activity_log && task.activity_log.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={16} color="#a855f7" />
                <span>Task History & Audit Log</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {task.activity_log.map((log, idx) => (
                  <div 
                    key={log.id || idx}
                    style={{
                      background: '#1e293b',
                      borderRadius: 8,
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#f8fafc' }}>{log.user_name}</span>
                      <span style={{ color: '#94a3b8', marginLeft: 8 }}>{log.remarks || log.action}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mark Completed Prompt Box if in completing mode */}
          {isCompleting && (
            <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={18} />
                  <span>Submit Task Completion</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCompleting(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                  Completion Remarks / Feedback <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <textarea 
                  rows={3}
                  placeholder="Describe outcome, action taken, collection reference no, or verification summary..."
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              {/* Upload Proof Document (Optional) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Attach Completion Proof / Receipt (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <UploadCloud size={13} />
                    <span>Upload Doc</span>
                  </button>
                </div>

                <input 
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  onChange={(e) => handleProofFileUpload(e.target.files)}
                />

                {completionProofDocs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {completionProofDocs.map(doc => (
                      <div
                        key={doc.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          color: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <FileText size={12} color="#38bdf8" />
                        <span>{doc.name}</span>
                        <Trash2 
                          size={12} 
                          color="#f43f5e" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setCompletionProofDocs(prev => prev.filter(d => d.id !== doc.id))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCompleting(false)}
                  style={{ padding: '0.5rem 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteTaskSubmit}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: 6,
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Confirm & Mark Completed
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid #1e293b',
            background: 'rgba(15, 23, 42, 0.95)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* Status Progression Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {task.status === 'PENDING' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS', 'Started working on task')}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <PlayCircle size={16} />
                <span>Start Working (In Progress)</span>
              </button>
            )}

            {task.status !== 'COMPLETED' && (
              <button
                type="button"
                onClick={() => {
                  const remarks = completionRemarks.trim() || 'Task marked as completed';
                  onUpdateStatus(task.id, 'COMPLETED', remarks, completionProofDocs);
                  setIsCompleting(false);
                  onClose();
                }}
                style={{
                  padding: '0.65rem 1.35rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <CheckCircle2 size={16} />
                <span>Mark Task as Completed</span>
              </button>
            )}

            {task.status !== 'ON_HOLD' && task.status !== 'COMPLETED' && (
              <button
                type="button"
                onClick={() => {
                  const reason = window.prompt('Enter reason for putting task on hold:');
                  if (reason !== null) {
                    onUpdateStatus(task.id, 'ON_HOLD', reason || 'Put on hold');
                  }
                }}
                style={{
                  padding: '0.65rem 1rem',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: 8,
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <PauseCircle size={16} />
                <span>Put On Hold</span>
              </button>
            )}

            {task.status === 'COMPLETED' && canManage && (
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS', 'Task re-opened by Admin')}
                style={{
                  padding: '0.65rem 1rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 8,
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Re-open Task
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.25rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
