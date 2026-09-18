import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Paperclip, 
  Trash2, 
  FileCheck,
  Sparkles,
  Repeat,
  CheckSquare,
  Bell
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskCategory, TaskAttachment, User, TaskRepeatFrequency, TaskAssignmentType, TaskChecklistItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { generateUuid } from '../lib/supabase';
import { getRoleBadge } from '../context/NotificationContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTask: (task: TaskItem) => void;
  users: User[];
  taskToEdit?: TaskItem | null;
}

const CATEGORIES: { id: TaskCategory; label: string; icon: string; color: string }[] = [
  { id: 'CHECKLIST', label: 'Operation Checklist', icon: '📋', color: '#10b981' },
  { id: 'OPERATIONS', label: 'Operations', icon: '⚙️', color: '#a855f7' },
  { id: 'SALES', label: 'Sales & Orders', icon: '🛒', color: '#38bdf8' },
  { id: 'ACCOUNTS', label: 'Accounts & Ledger', icon: '🧾', color: '#ec4899' },
  { id: 'BILLING', label: 'Billing & Invoicing', icon: '💳', color: '#818cf8' },
  { id: 'DISPATCH', label: 'Dispatch & Logistics', icon: '🚚', color: '#f59e0b' },
  { id: 'AUDIT', label: 'Audit & Inventory', icon: '🔍', color: '#10b981' },
  { id: 'FOLLOW_UP', label: 'Party Follow-Up', icon: '📞', color: '#06b6d4' },
  { id: 'GENERAL', label: 'General Task', icon: '📌', color: '#94a3b8' }
];

const PRIORITIES: { id: TaskPriority; label: string; color: string; bg: string; border: string }[] = [
  { id: 'URGENT', label: '🔴 Urgent', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' },
  { id: 'HIGH', label: '🟠 High', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' },
  { id: 'NORMAL', label: '🔵 Normal', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
  { id: 'LOW', label: '🟢 Low', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' }
];

const SUGGESTED_TITLES = [
  'Follow up on overdue payment collection with agency',
  'Physical stock verification & warehouse carton count',
  'Collect signed & stamped physical POD from transporter',
  'Prepare monthly sales forecast & brand promotional schemes',
  'Verify pending GRN discrepancy with accounts billing',
  'Party address & GST verification for new agency onboarding'
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmitTask,
  users,
  taskToEdit
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [summary, setSummary] = useState(taskToEdit?.summary || '');
  const [category, setCategory] = useState<TaskCategory>(taskToEdit?.category || 'CHECKLIST');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'NORMAL');
  
  // Assignment State: For Self vs Assign to Other
  const [assignmentType, setAssignmentType] = useState<TaskAssignmentType>(() => {
    if (taskToEdit?.assignment_type) return taskToEdit.assignment_type;
    if (taskToEdit?.assigned_to_id && currentUser?.id && taskToEdit.assigned_to_id === currentUser.id) return 'SELF';
    return 'OTHER';
  });
  const [assignedToId, setAssignedToId] = useState(taskToEdit?.assigned_to_id || '');

  // Recurrence / Repeat Frequency State
  const [repeatFrequency, setRepeatFrequency] = useState<TaskRepeatFrequency>(taskToEdit?.repeat_frequency || 'NONE');
  const [skipWeekends, setSkipWeekends] = useState<boolean>(taskToEdit?.skip_weekends !== false);

  // Operation Checklist items
  const [checklistItems, setChecklistItems] = useState<TaskChecklistItem[]>(taskToEdit?.checklist_items || []);
  
  // Format default due date (tomorrow 17:00 local time)
  const defaultDueDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const defaultReminderDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const [dueDate, setDueDate] = useState<string>(() => {
    if (taskToEdit?.due_date) {
      return new Date(taskToEdit.due_date).toISOString().slice(0, 16);
    }
    return defaultDueDate();
  });

  const [enableReminder, setEnableReminder] = useState<boolean>(!!taskToEdit?.reminder_date);
  const [reminderDate, setReminderDate] = useState<string>(() => {
    if (taskToEdit?.reminder_date) {
      return new Date(taskToEdit.reminder_date).toISOString().slice(0, 16);
    }
    return defaultReminderDate();
  });
  const [reminderNote, setReminderNote] = useState<string>(taskToEdit?.reminder_note || '');

  // Support Documents State
  const [supportDocs, setSupportDocs] = useState<TaskAttachment[]>(taskToEdit?.support_docs || []);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when opened or taskToEdit changes
  React.useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setSummary(taskToEdit.summary);
        setCategory(taskToEdit.category);
        setPriority(taskToEdit.priority);
        const resolvedAssignType = taskToEdit.assignment_type || (taskToEdit.assigned_to_id === currentUser?.id ? 'SELF' : 'OTHER');
        setAssignmentType(resolvedAssignType);
        setAssignedToId(taskToEdit.assigned_to_id);
        setDueDate(new Date(taskToEdit.due_date).toISOString().slice(0, 16));
        setEnableReminder(!!taskToEdit.reminder_date);
        setReminderDate(taskToEdit.reminder_date ? new Date(taskToEdit.reminder_date).toISOString().slice(0, 16) : defaultReminderDate());
        setReminderNote(taskToEdit.reminder_note || '');
        setSupportDocs(taskToEdit.support_docs || []);
        setRepeatFrequency(taskToEdit.repeat_frequency || 'NONE');
        setSkipWeekends(taskToEdit.skip_weekends !== false);
        setChecklistItems(taskToEdit.checklist_items || []);
      } else {
        setTitle('');
        setSummary('');
        setCategory('CHECKLIST');
        setPriority('NORMAL');
        setAssignmentType('SELF');
        setAssignedToId(currentUser?.id || '');
        setDueDate(defaultDueDate());
        setEnableReminder(true);
        setReminderDate(defaultReminderDate());
        setReminderNote('');
        setSupportDocs([]);
        setRepeatFrequency('NONE');
        setSkipWeekends(true);
        setChecklistItems([]);
      }
      setErrorMsg(null);
    }
  }, [isOpen, taskToEdit, currentUser]);

  if (!isOpen) return null;

  // Filter available assignees (active users)
  const activeUsers = users.filter(u => u.active !== false);
  const selectedUser = users.find(u => u.id === assignedToId);

  // File Upload Handler (Converts files to Base64 for instant preview & persistence)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setErrorMsg(null);

    const newAttachments: TaskAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Max size: 15MB
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds 15MB size limit.`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: generateUuid(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: base64,
          uploaded_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('File read error:', err);
        setErrorMsg(`Failed to process file "${file.name}".`);
      }
    }

    setSupportDocs(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDoc = (docId: string) => {
    setSupportDocs(prev => prev.filter(d => d.id !== docId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Please provide a task title.');
      return;
    }

    const finalAssignedToId = assignmentType === 'SELF' ? (currentUser?.id || assignedToId) : assignedToId;
    if (!finalAssignedToId) {
      setErrorMsg('Please select a user to assign this task or select "For Self".');
      return;
    }

    if (!dueDate) {
      setErrorMsg('Please specify a completion/due date.');
      return;
    }

    const assignedUser = assignmentType === 'SELF' 
      ? currentUser 
      : users.find(u => u.id === finalAssignedToId);

    const nowIso = new Date().toISOString();
    const taskNumber = taskToEdit?.task_number || `TSK-${Date.now().toString().slice(-4)}`;

    const newTask: TaskItem = {
      id: taskToEdit?.id || generateUuid(),
      task_number: taskNumber,
      title: title.trim(),
      summary: summary.trim() || title.trim(),
      priority,
      category,
      status: taskToEdit?.status || 'PENDING',
      assignment_type: assignmentType,
      assigned_to_id: finalAssignedToId,
      assigned_to_name: assignedUser?.full_name || (assignmentType === 'SELF' ? 'Self' : 'Assigned User'),
      assigned_to_role: assignedUser?.role_name,
      assigned_to_email: assignedUser?.email,
      created_by_id: currentUser?.id || 'admin',
      created_by_name: currentUser?.full_name || 'Super Admin',
      created_by_role: currentUser?.role_name || 'SUPER_ADMIN',
      due_date: new Date(dueDate).toISOString(),
      reminder_date: enableReminder && reminderDate ? new Date(reminderDate).toISOString() : undefined,
      reminder_note: enableReminder ? reminderNote.trim() : undefined,
      reminder_sent: false,
      repeat_frequency: repeatFrequency,
      skip_weekends: repeatFrequency !== 'NONE' ? skipWeekends : false,
      checklist_items: checklistItems.filter(ci => ci.text.trim().length > 0),
      parent_task_id: taskToEdit?.parent_task_id,
      iteration_count: taskToEdit?.iteration_count || 1,
      support_docs: supportDocs,
      completion_remarks: taskToEdit?.completion_remarks,
      completion_proof_docs: taskToEdit?.completion_proof_docs,
      completed_at: taskToEdit?.completed_at,
      completed_by_id: taskToEdit?.completed_by_id,
      completed_by_name: taskToEdit?.completed_by_name,
      created_at: taskToEdit?.created_at || nowIso,
      updated_at: nowIso,
      activity_log: [
        ...(taskToEdit?.activity_log || []),
        {
          id: generateUuid(),
          action: taskToEdit ? 'UPDATED' : 'CREATED',
          user_id: currentUser?.id || 'admin',
          user_name: currentUser?.full_name || 'Super Admin',
          timestamp: nowIso,
          remarks: taskToEdit ? 'Task updated' : `Task created (${assignmentType === 'SELF' ? 'For Self' : `Assigned to ${assignedUser?.full_name || 'User'}`}${repeatFrequency !== 'NONE' ? `, Repeat: ${repeatFrequency}` : ''})`
        }
      ]
    };

    onSubmitTask(newTask);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        className="modal-container"
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 16,
          width: '100%',
          maxWidth: 820,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)'
              }}
            >
              <FileCheck size={22} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                {taskToEdit ? 'Edit Task Assignment' : 'Assign New Operational Task'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, marginTop: 2 }}>
                Create clear task objectives, attach support documentation, set due dates & reminders.
              </p>
            </div>
          </div>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {errorMsg && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 8, color: '#fda4af', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
                Task Title / Subject <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Quick suggestions below</span>
            </div>
            <input 
              type="text"
              placeholder="e.g. Follow up on Surat City Agencies Overdue Outstanding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.95rem',
                fontWeight: 600,
                outline: 'none'
              }}
              required
            />
            {/* Quick title suggestions pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {SUGGESTED_TITLES.slice(0, 3).map((st, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTitle(st)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 20,
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Sparkles size={12} />
                  <span>{st.length > 35 ? st.substring(0, 35) + '...' : st}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category & Priority in 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Category */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.4rem' }}>
                Category / Department
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.4rem' }}>
                Priority Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    style={{
                      padding: '0.65rem 0.25rem',
                      borderRadius: 8,
                      background: priority === p.id ? p.bg : '#1e293b',
                      border: `1px solid ${priority === p.id ? p.color : '#334155'}`,
                      color: priority === p.id ? p.color : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignment Selection: For Self vs Assign to Other */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.65rem' }}>
              Task Assignment <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('SELF');
                  if (currentUser?.id) setAssignedToId(currentUser.id);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: assignmentType === 'SELF' ? '2px solid #a855f7' : '1px solid #334155',
                  background: assignmentType === 'SELF' ? 'rgba(168, 85, 247, 0.18)' : '#0f172a',
                  color: assignmentType === 'SELF' ? '#c084fc' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🙋 For Self (Personal Task / Checklist)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssignmentType('OTHER');
                  if (assignedToId === currentUser?.id) setAssignedToId('');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: assignmentType === 'OTHER' ? '2px solid #38bdf8' : '1px solid #334155',
                  background: assignmentType === 'OTHER' ? 'rgba(56, 189, 248, 0.18)' : '#0f172a',
                  color: assignmentType === 'OTHER' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👥 Assign to Other (Delegate)</span>
              </button>
            </div>

            {assignmentType === 'SELF' ? (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 8, padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {currentUser?.full_name || 'Current User'} <span style={{ color: '#c084fc', fontWeight: 600 }}>(You)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Role: <strong style={{ color: '#38bdf8' }}>{currentUser?.role_name || 'User'}</strong> {currentUser?.email ? `• ${currentUser.email}` : ''}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required={assignmentType === 'OTHER'}
                >
                  <option value="">-- Select Team Member to Assign --</option>
                  {activeUsers.map(u => {
                    const roleBadge = getRoleBadge(u.role_name);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({roleBadge.label}) - {u.email}
                      </option>
                    );
                  })}
                </select>
                {selectedUser && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                      {selectedUser.role_name}
                    </span>
                    {selectedUser.company_handle && <span>Handle: {selectedUser.company_handle}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Repeat Task & Recurrence Settings (Daily, Weekly, Monthly, Skip Weekends) */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Repeat size={16} color="#a855f7" />
                <span>Repeat Task / Operational Checklist Frequency</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Auto-recreates on completion</span>
            </div>

            {/* Repeat Frequency Options: None, Daily, Weekly, Monthly */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
              {[
                { id: 'NONE', label: '⏹️ One-Time', desc: 'No Repeat' },
                { id: 'DAILY', label: '📅 Daily', desc: 'Repeats everyday' },
                { id: 'WEEKLY', label: '🗓️ Weekly', desc: 'Repeats every 7 days' },
                { id: 'MONTHLY', label: '📆 Monthly', desc: 'Repeats every month' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setRepeatFrequency(opt.id as any);
                    if (opt.id !== 'NONE' && category === 'GENERAL') {
                      setCategory('CHECKLIST');
                    }
                  }}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: 8,
                    border: repeatFrequency === opt.id ? '2px solid #a855f7' : '1px solid #334155',
                    background: repeatFrequency === opt.id ? 'rgba(168, 85, 247, 0.2)' : '#0f172a',
                    color: repeatFrequency === opt.id ? '#c084fc' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{opt.label}</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* If repeating: Skip Weekends toggle */}
            {repeatFrequency !== 'NONE' && (
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid #334155', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⏭️ Skip Weekends (Saturday &amp; Sunday)</span>
                    {skipWeekends && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                        Active (Mon–Fri only)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                    When scheduled or completed, tasks falling on Saturday or Sunday advance to Monday.
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: skipWeekends ? '#a855f7' : '#334155',
                    borderRadius: 24,
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: 18, width: 18,
                      left: skipWeekends ? 22 : 3,
                      bottom: 3,
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Operation Checklist Items (Sub-tasks to tick off) */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckSquare size={16} color="#34d399" />
                <span>Operation Checklist Items (Optional Steps)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setChecklistItems(prev => [...prev, { id: generateUuid(), text: '', completed: false }]);
                }}
                style={{
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid #34d399',
                  color: '#34d399',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                + Add Step
              </button>
            </div>

            {checklistItems.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                No checklist steps added yet. Click "+ Add Step" to add action items like "1. Verify carton seals", "2. Check tax invoice copy", etc.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {checklistItems.map((ci, idx) => (
                  <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, width: 20 }}>
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      placeholder={`Checklist item #${idx + 1}`}
                      value={ci.text}
                      onChange={(e) => {
                        const updated = [...checklistItems];
                        updated[idx].text = e.target.value;
                        setChecklistItems(updated);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.75rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setChecklistItems(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 4 }}
                      title="Remove step"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completion Date */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.4rem' }}>
              Target Due Date &amp; Time <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input 
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              required
            />
          </div>

          {/* Summary / Detailed Instructions */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.4rem' }}>
              Task Summary & Instructions <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500 }}>(Optional)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Provide clear step-by-step summary of what needs to be accomplished, party details, special ledger/dispatch notes, or expected outcome..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Support Document Upload Section */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px dashed #334155', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={16} color="#38bdf8" />
                  <span>Support Documents & Attachments</span>
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Upload support files (PDF statements, Excel sheets, invoices, images, dispatch notes).
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.5rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <UploadCloud size={16} />
                <span>{isUploading ? 'Uploading...' : 'Browse & Upload Doc'}</span>
              </button>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {/* Uploaded Documents List */}
            {supportDocs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }}>
                {supportDocs.map(doc => (
                  <div 
                    key={doc.id}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <FileText size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {formatFileSize(doc.size)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      title="Remove document"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f43f5e',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  textAlign: 'center',
                  padding: '1.25rem 0',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                No support documents attached yet. Click to upload (PDF, Excel, Word, Images).
              </div>
            )}
          </div>

          {/* Scheduled Reminder Section */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enableReminder ? '0.75rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.35rem', borderRadius: 6, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={16} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    Remind Assignee About Task
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Sends notification alert to assigned user and management.
                  </div>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={enableReminder}
                  onChange={(e) => setEnableReminder(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </label>
            </div>

            {enableReminder && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                    Reminder Date & Time
                  </label>
                  <input 
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                    Reminder Alert Note (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Please share payment receipt before 4 PM"
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions Footer */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #1e293b',
              marginTop: '0.5rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.7rem 1.4rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '0.7rem 1.75rem',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <CheckCircle2 size={18} />
              <span>{taskToEdit ? 'Save Task Updates' : 'Assign Task Now'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
