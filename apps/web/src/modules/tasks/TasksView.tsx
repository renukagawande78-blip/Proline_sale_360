import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PlayCircle, 
  PauseCircle, 
  FileText, 
  Paperclip, 
  User as UserIcon, 
  Download, 
  LayoutGrid, 
  List, 
  Sparkles, 
  ArrowUpDown, 
  FileSpreadsheet, 
  Bell, 
  CheckCheck,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit3,
  RefreshCw,
  FolderOpen,
  Repeat
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskPriority, TaskCategory, User, TaskAttachment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getRoleBadge } from '../../context/NotificationContext';

interface TasksViewProps {
  tasks: TaskItem[];
  users: User[];
  onOpenCreateTask: () => void;
  onSelectTask: (task: TaskItem) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus, remarks?: string, proofDocs?: TaskAttachment[]) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onRefreshTasks?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  users,
  onOpenCreateTask,
  onSelectTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onEditTask,
  onRefreshTasks
}) => {
  const { currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role_name === 'SUPER_ADMIN' || 
    (currentUser?.full_name || '').toLowerCase().includes('chirag') || 
    (currentUser?.full_name || '').toLowerCase().includes('harshad');

  const canCreateTask = isSuperAdmin || currentUser?.role_name === 'SALES_ADMIN';

  // Filters State
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY_PENDING' | 'TOMORROW' | 'COMPLETED' | 'FOR_SELF' | 'DELEGATED' | 'CHECKLIST' | 'PENDING' | 'IN_PROGRESS' | 'OVERDUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');

  // Date helper functions
  const isSameDay = (d1: Date, d2: Date) => (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );

  const parseValidDate = (d: string | Date | undefined): Date | null => {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const forSelfTasks = tasks.filter(t => 
      t.assignment_type === 'SELF' ||
      t.assigned_to_id === currentUser?.id || 
      (t.assigned_to_name || '').toLowerCase() === (currentUser?.full_name || '').toLowerCase()
    );

    const delegatedTasks = tasks.filter(t => 
      t.assignment_type === 'OTHER' ||
      (t.assigned_to_id !== currentUser?.id && (t.assigned_to_name || '').toLowerCase() !== (currentUser?.full_name || '').toLowerCase())
    );

    const checklistTasks = tasks.filter(t => 
      t.category === 'CHECKLIST' ||
      (t.repeat_frequency && t.repeat_frequency !== 'NONE') ||
      (t.checklist_items && t.checklist_items.length > 0)
    );

    const todayPendingTasks = tasks.filter(t => {
      const d = parseValidDate(t.due_date);
      return d ? isSameDay(d, today) && t.status !== 'COMPLETED' && t.status !== 'CANCELLED' : false;
    });

    const tomorrowTasks = tasks.filter(t => {
      const d = parseValidDate(t.due_date);
      return d ? isSameDay(d, tomorrow) && t.status !== 'CANCELLED' : false;
    });

    const pending = tasks.filter(t => t.status === 'PENDING');
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const completed = tasks.filter(t => t.status === 'COMPLETED');
    const overdue = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.due_date) < now);
    const myPending = forSelfTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

    return {
      total: tasks.length,
      todayPending: todayPendingTasks.length,
      tomorrow: tomorrowTasks.length,
      completed: completed.length,
      forSelf: forSelfTasks.length,
      myTotal: forSelfTasks.length,
      delegated: delegatedTasks.length,
      checklist: checklistTasks.length,
      myPending: myPending.length,
      pending: pending.length,
      inProgress: inProgress.length,
      overdue: overdue.length
    };
  }, [tasks, currentUser]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return tasks.filter(task => {
      // Tab filter
      if (activeTab === 'TODAY_PENDING') {
        const d = parseValidDate(task.due_date);
        const isTodayDue = d ? isSameDay(d, today) : false;
        const isPending = task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
        if (!isTodayDue || !isPending) return false;
      } else if (activeTab === 'TOMORROW') {
        const d = parseValidDate(task.due_date);
        const isTomorrowDue = d ? isSameDay(d, tomorrow) : false;
        const notCancelled = task.status !== 'CANCELLED';
        if (!isTomorrowDue || !notCancelled) return false;
      } else if (activeTab === 'COMPLETED') {
        if (task.status !== 'COMPLETED') return false;
      } else if (activeTab === 'FOR_SELF') {
        const isSelf = task.assignment_type === 'SELF' ||
          task.assigned_to_id === currentUser?.id || 
          (task.assigned_to_name || '').toLowerCase() === (currentUser?.full_name || '').toLowerCase();
        if (!isSelf) return false;
      } else if (activeTab === 'DELEGATED') {
        const isDelegated = task.assignment_type === 'OTHER' ||
          (task.assigned_to_id !== currentUser?.id && (task.assigned_to_name || '').toLowerCase() !== (currentUser?.full_name || '').toLowerCase());
        if (!isDelegated) return false;
      } else if (activeTab === 'CHECKLIST') {
        const isChecklist = task.category === 'CHECKLIST' ||
          (task.repeat_frequency && task.repeat_frequency !== 'NONE') ||
          (task.checklist_items && task.checklist_items.length > 0);
        if (!isChecklist) return false;
      } else if (activeTab === 'PENDING' && task.status !== 'PENDING') {
        return false;
      } else if (activeTab === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS') {
        return false;
      } else if (activeTab === 'OVERDUE') {
        const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && new Date(task.due_date) < now;
        if (!isOverdue) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          task.task_number.toLowerCase().includes(q) ||
          task.title.toLowerCase().includes(q) ||
          task.summary.toLowerCase().includes(q) ||
          task.assigned_to_name.toLowerCase().includes(q) ||
          task.created_by_name.toLowerCase().includes(q) ||
          task.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && task.category !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'ALL' && task.assigned_to_id !== assigneeFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery, categoryFilter, priorityFilter, assigneeFilter, currentUser]);

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Task Number', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Assigned By', 'Target Due Date', 'Support Docs Count', 'Completion Remarks', 'Created At'];
      const rows = filteredTasks.map(t => [
        t.task_number,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.priority,
        t.status,
        `"${t.assigned_to_name}"`,
        `"${t.created_by_name}"`,
        new Date(t.due_date).toLocaleString('en-IN'),
        t.support_docs?.length || 0,
        `"${(t.completion_remarks || '').replace(/"/g, '""')}"`,
        new Date(t.created_at).toLocaleString('en-IN')
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Proline_Tasks_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT': return { label: 'Urgent', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' };
      case 'HIGH': return { label: 'High', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' };
      case 'NORMAL': return { label: 'Normal', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' };
      case 'LOW': return { label: 'Low', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' };
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'COMPLETED': return { label: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2 };
      case 'IN_PROGRESS': return { label: 'In Progress', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', icon: PlayCircle };
      case 'ON_HOLD': return { label: 'On Hold', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', icon: PauseCircle };
      case 'CANCELLED': return { label: 'Cancelled', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: AlertTriangle };
      default: return { label: 'Pending', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: Clock };
    }
  };

  return (
    <div className="orders-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner & Header */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
          padding: '1.25rem 1.5rem',
          borderRadius: 16,
          border: '1px solid #1e293b',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
            }}
          >
            <CheckSquare size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Operational Task Management
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, marginTop: 2 }}>
              Super Admin task delegation, support documentation, target deadlines & real-time team progress.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onRefreshTasks && (
            <button
              type="button"
              onClick={onRefreshTasks}
              title="Refresh Task Board"
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '0.65rem 1rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>

          {canCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.35rem',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Plus size={18} />
              <span>Assign New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
        
        {/* Total Tasks */}
        <div 
          onClick={() => setActiveTab('ALL')}
          style={{
            background: activeTab === 'ALL' ? 'rgba(56, 189, 248, 0.12)' : '#141f36',
            border: `1px solid ${activeTab === 'ALL' ? '#38bdf8' : '#1e293b'}`,
            borderRadius: 12,
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total Tasks</span>
            <CheckSquare size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>{metrics.total}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>All organizational tasks</div>
        </div>

        {/* Today Pending Tasks */}
        <div 
          onClick={() => setActiveTab('TODAY_PENDING')}
          style={{
            background: activeTab === 'TODAY_PENDING' ? 'rgba(245, 158, 11, 0.18)' : '#141f36',
            border: `1px solid ${activeTab === 'TODAY_PENDING' ? '#f59e0b' : metrics.todayPending > 0 ? 'rgba(245, 158, 11, 0.4)' : '#1e293b'}`,
            borderRadius: 12,
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>Today Pending</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{metrics.todayPending}</div>
          <div style={{ fontSize: '0.72rem', color: '#fbbf24' }}>Due today needing action</div>
        </div>

        {/* Tomorrow Tasks */}
        <div 
          onClick={() => setActiveTab('TOMORROW')}
          style={{
            background: activeTab === 'TOMORROW' ? 'rgba(56, 189, 248, 0.18)' : '#141f36',
            border: `1px solid ${activeTab === 'TOMORROW' ? '#38bdf8' : '#1e293b'}`,
            borderRadius: 12,
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Tomorrow Tasks</span>
            <Calendar size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{metrics.tomorrow}</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Scheduled for tomorrow</div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setActiveTab('COMPLETED')}
          style={{
            background: activeTab === 'COMPLETED' ? 'rgba(16, 185, 129, 0.18)' : '#141f36',
            border: `1px solid ${activeTab === 'COMPLETED' ? '#10b981' : '#1e293b'}`,
            borderRadius: 12,
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Completed</span>
            <CheckCheck size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{metrics.completed}</div>
          <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>Finished successfully</div>
        </div>

        {/* My Tasks (For Self) */}
        <div 
          onClick={() => setActiveTab('FOR_SELF')}
          style={{
            background: activeTab === 'FOR_SELF' ? 'rgba(168, 85, 247, 0.15)' : '#141f36',
            border: `1px solid ${activeTab === 'FOR_SELF' ? '#a855f7' : '#1e293b'}`,
            borderRadius: 12,
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>For Self (My Tasks)</span>
            <UserIcon size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e879f9' }}>{metrics.myPending}</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Assigned to you ({metrics.myTotal} total)</div>
        </div>

        {/* Overdue Alert */}
        <div 
          onClick={() => setActiveTab('OVERDUE')}
          style={{
            background: activeTab === 'OVERDUE' ? 'rgba(244, 63, 94, 0.18)' : '#141f36',
            border: `1px solid ${activeTab === 'OVERDUE' ? '#f43f5e' : metrics.overdue > 0 ? 'rgba(244, 63, 94, 0.4)' : '#1e293b'}`,
            borderRadius: 12,
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase' }}>Overdue</span>
            <AlertTriangle size={16} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e' }}>{metrics.overdue}</div>
          <div style={{ fontSize: '0.72rem', color: '#fda4af' }}>Requires urgent attention</div>
        </div>

      </div>

      {/* Filter Tabs & Search Controls */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: '#141f36',
          border: '1px solid #1e293b',
          borderRadius: 14,
          padding: '1rem 1.25rem'
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Tasks', count: metrics.total },
              { id: 'TODAY_PENDING', label: '📅 Today Pending', count: metrics.todayPending, tone: 'amber' },
              { id: 'TOMORROW', label: '⏳ Tomorrow Tasks', count: metrics.tomorrow, tone: 'cyan' },
              { id: 'COMPLETED', label: '✅ Completed', count: metrics.completed, tone: 'emerald' },
              { id: 'FOR_SELF', label: '🙋 For Self', count: metrics.forSelf, tone: 'purple' },
              { id: 'DELEGATED', label: '👥 Assigned to Others', count: metrics.delegated },
              { id: 'CHECKLIST', label: '📋 Operation Checklist', count: metrics.checklist, tone: 'teal' },
              { id: 'PENDING', label: 'Pending', count: metrics.pending },
              { id: 'IN_PROGRESS', label: 'In Progress', count: metrics.inProgress },
              { id: 'OVERDUE', label: '⚠️ Overdue', count: metrics.overdue, tone: 'rose' }
            ].map(tab => {
              const getTabBg = () => {
                if (activeTab !== tab.id) return '#1e293b';
                switch (tab.tone) {
                  case 'amber': return '#d97706';
                  case 'cyan': return '#0284c7';
                  case 'emerald': return '#059669';
                  case 'purple': return '#9333ea';
                  case 'teal': return '#0d9488';
                  case 'rose': return '#e11d48';
                  default: return '#0284c7';
                }
              };
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: 8,
                    background: getTabBg(),
                    border: `1px solid ${activeTab === tab.id ? 'transparent' : '#334155'}`,
                    color: activeTab === tab.id ? 'white' : '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  <span 
                    style={{
                      padding: '0.1rem 0.45rem',
                      borderRadius: 10,
                      background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(15, 23, 42, 0.6)',
                      fontSize: '0.72rem'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Switcher: List vs Kanban */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              title="Table / List View"
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 6,
                background: viewMode === 'LIST' ? '#1e293b' : 'transparent',
                border: 'none',
                color: viewMode === 'LIST' ? '#38bdf8' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <List size={14} />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('KANBAN')}
              title="Kanban Board View"
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 6,
                background: viewMode === 'KANBAN' ? '#1e293b' : 'transparent',
                border: 'none',
                color: viewMode === 'KANBAN' ? '#38bdf8' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <LayoutGrid size={14} />
              <span>Kanban</span>
            </button>
          </div>
        </div>

        {/* Search & Dropdown Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search task title, summary, assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.25rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="CHECKLIST">📋 Operation Checklist</option>
              <option value="OPERATIONS">⚙️ Operations</option>
              <option value="SALES">🛒 Sales & Orders</option>
              <option value="ACCOUNTS">🧾 Accounts & Ledger</option>
              <option value="BILLING">💳 Billing</option>
              <option value="DISPATCH">🚚 Dispatch</option>
              <option value="AUDIT">🔍 Stock Audit</option>
              <option value="FOLLOW_UP">📞 Party Follow-Up</option>
              <option value="GENERAL">📌 General</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="NORMAL">🔵 Normal</option>
              <option value="LOW">🟢 Low</option>
            </select>

            {/* Assignee Filter (Super Admin) */}
            {isSuperAdmin && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none',
                  maxWidth: 180
                }}
              >
                <option value="ALL">All Team Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role_name})
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setPriorityFilter('ALL');
                  setAssigneeFilter('ALL');
                }}
                style={{
                  padding: '0.55rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Task Listing: Table View or Kanban View */}
      {viewMode === 'LIST' ? (
        /* TABLE / LIST VIEW */
        <div style={{ background: '#141f36', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Task & Subject</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assigned To</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target Completion</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const statusMeta = getStatusBadge(task.status);
                    const StatusIcon = statusMeta.icon;
                    const priorityMeta = getPriorityBadge(task.priority);
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    const dueDate = new Date(task.due_date);
                    const isDueToday = isSameDay(dueDate, today);
                    const isDueTomorrow = isSameDay(dueDate, tomorrow);
                    const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dueDate < now;
                    const isAssignedToMe = task.assigned_to_id === currentUser?.id || (task.assigned_to_name || '').toLowerCase() === (currentUser?.full_name || '').toLowerCase();

                    return (
                      <tr 
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          cursor: 'pointer',
                          background: isOverdue ? 'rgba(244, 63, 94, 0.04)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isOverdue ? 'rgba(244, 63, 94, 0.04)' : 'transparent')}
                      >
                        {/* Task Number & Title */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                            <div 
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: statusMeta.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: statusMeta.color,
                                flexShrink: 0,
                                marginTop: 2
                              }}
                            >
                              <StatusIcon size={16} />
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>
                                  {task.task_number}
                                </span>
                                {task.support_docs && task.support_docs.length > 0 && (
                                  <span 
                                    title={`${task.support_docs.length} Support document(s) attached`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: 4,
                                      background: 'rgba(56, 189, 248, 0.12)',
                                      color: '#38bdf8',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Paperclip size={10} />
                                    <span>{task.support_docs.length} Doc</span>
                                  </span>
                                )}
                                {task.repeat_frequency && task.repeat_frequency !== 'NONE' && (
                                  <span 
                                    title={`Repeats ${task.repeat_frequency}${task.skip_weekends ? ' (Skipping weekends)' : ''}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: 4,
                                      background: 'rgba(168, 85, 247, 0.15)',
                                      color: '#c084fc',
                                      border: '1px solid rgba(168, 85, 247, 0.3)',
                                      fontSize: '0.7rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    <Repeat size={10} />
                                    <span>
                                      {task.repeat_frequency === 'DAILY' ? 'Daily' : task.repeat_frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                                      {task.skip_weekends ? ' (Excl. W/E)' : ''}
                                    </span>
                                  </span>
                                )}

                                {task.assignment_type === 'SELF' ? (
                                  <span 
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: 4,
                                      background: 'rgba(168, 85, 247, 0.15)',
                                      color: '#c084fc',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    🙋 For Self
                                  </span>
                                ) : (
                                  <span 
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: 4,
                                      background: 'rgba(56, 189, 248, 0.12)',
                                      color: '#38bdf8',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    👥 Delegated
                                  </span>
                                )}

                                {task.checklist_items && task.checklist_items.length > 0 && (
                                  <span 
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: 4,
                                      background: 'rgba(52, 211, 153, 0.15)',
                                      color: '#34d399',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <CheckSquare size={10} />
                                    <span>{task.checklist_items.filter(c => c.completed).length}/{task.checklist_items.length} Checklist</span>
                                  </span>
                                )}

                                {task.reminder_date && (
                                  <span title="Scheduled reminder active" style={{ color: '#fbbf24', display: 'inline-flex' }}>
                                    <Bell size={12} />
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                                {task.title}
                              </div>

                              {task.summary && (
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {task.summary}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}>
                            {task.category}
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: priorityMeta.bg, border: `1px solid ${priorityMeta.border}`, color: priorityMeta.color, fontSize: '0.75rem', fontWeight: 800 }}>
                            {priorityMeta.label}
                          </span>
                        </td>

                        {/* Assigned To */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div 
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: isAssignedToMe ? 'linear-gradient(135deg, #a855f7, #6366f1)' : '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                flexShrink: 0
                              }}
                            >
                              {task.assigned_to_name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: isAssignedToMe ? '#c084fc' : '#f8fafc', fontSize: '0.85rem' }}>
                                {task.assigned_to_name} {isAssignedToMe ? '(You)' : ''}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {task.assigned_to_role || 'Staff'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Target Completion */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ color: isOverdue ? '#f43f5e' : isDueToday ? '#f59e0b' : isDueTomorrow ? '#38bdf8' : '#cbd5e1', fontWeight: isOverdue || isDueToday ? 800 : 600 }}>
                            {new Date(task.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isOverdue ? '#fda4af' : isDueToday ? '#fbbf24' : isDueTomorrow ? '#7dd3fc' : '#64748b' }}>
                            {isOverdue 
                              ? '⚠️ Overdue' 
                              : isDueToday 
                              ? '📅 Due Today' 
                              : isDueTomorrow 
                              ? '⏳ Due Tomorrow' 
                              : task.status === 'COMPLETED' 
                              ? 'Completed' 
                              : 'On Schedule'}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.65rem', borderRadius: 20, background: statusMeta.bg, color: statusMeta.color, fontSize: '0.75rem', fontWeight: 800 }}>
                            <StatusIcon size={12} />
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {task.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateTaskStatus(task.id, 'COMPLETED', 'Marked completed from task list');
                                }}
                                title="Mark as Completed"
                                style={{
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  border: 'none',
                                  borderRadius: 6,
                                  color: 'white',
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <CheckCircle2 size={13} />
                                <span>Mark Done</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onSelectTask(task)}
                              title="View Details"
                              style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: 6,
                                color: '#cbd5e1',
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <FolderOpen size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8' }}>No tasks match your filters</div>
                      <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                        {canCreateTask ? 'Click "Assign New Task" above to delegate a task.' : 'You have no assigned tasks in this view.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'flex-start' }}>
          {(['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] as TaskStatus[]).map(colStatus => {
            const colTasks = filteredTasks.filter(t => t.status === colStatus);
            const statusMeta = getStatusBadge(colStatus);
            const ColIcon = statusMeta.icon;

            return (
              <div 
                key={colStatus}
                style={{
                  background: '#141f36',
                  border: '1px solid #1e293b',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '75vh',
                  overflow: 'hidden'
                }}
              >
                {/* Column Header */}
                <div 
                  style={{
                    padding: '1rem 1.25rem',
                    background: '#0f172a',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ padding: 4, borderRadius: 6, background: statusMeta.bg, color: statusMeta.color }}>
                      <ColIcon size={16} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <span style={{ padding: '0.15rem 0.55rem', borderRadius: 12, background: '#1e293b', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                  {colTasks.length > 0 ? (
                    colTasks.map(task => {
                      const priorityMeta = getPriorityBadge(task.priority);
                      const now = new Date();
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                      const dueDate = new Date(task.due_date);
                      const isDueToday = isSameDay(dueDate, today);
                      const isDueTomorrow = isSameDay(dueDate, tomorrow);
                      const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dueDate < now;

                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task)}
                          style={{
                            background: '#1e293b',
                            border: `1px solid ${isOverdue ? 'rgba(244, 63, 94, 0.4)' : '#334155'}`,
                            borderRadius: 10,
                            padding: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Card Top Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>
                              {task.task_number}
                            </span>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: 4, background: priorityMeta.bg, border: `1px solid ${priorityMeta.border}`, color: priorityMeta.color, fontSize: '0.68rem', fontWeight: 800 }}>
                              {priorityMeta.label}
                            </span>
                          </div>

                          {/* Card Title */}
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                            {task.title}
                          </div>

                          {/* Summary snippet */}
                          {task.summary && (
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {task.summary}
                            </div>
                          )}

                          {/* Support doc & reminder chips */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {task.support_docs && task.support_docs.length > 0 && (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Paperclip size={11} />
                                <span>{task.support_docs.length} Attachment</span>
                              </span>
                            )}
                            {task.repeat_frequency && task.repeat_frequency !== 'NONE' && (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
                                <Repeat size={10} />
                                <span>{task.repeat_frequency === 'DAILY' ? 'Daily' : task.repeat_frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}{task.skip_weekends ? ' (Excl. W/E)' : ''}</span>
                              </span>
                            )}
                            {task.assignment_type === 'SELF' ? (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', fontSize: '0.7rem', fontWeight: 700 }}>
                                🙋 Self
                              </span>
                            ) : (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 700 }}>
                                👥 Delegated
                              </span>
                            )}
                            {task.checklist_items && task.checklist_items.length > 0 && (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <CheckSquare size={10} />
                                <span>{task.checklist_items.filter(c => c.completed).length}/{task.checklist_items.length}</span>
                              </span>
                            )}
                            <span style={{ padding: '0.15rem 0.45rem', borderRadius: 4, background: '#0f172a', color: '#cbd5e1', fontSize: '0.7rem' }}>
                              {task.category}
                            </span>
                          </div>

                          {/* Card Footer */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #334155', marginTop: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                                {task.assigned_to_name.charAt(0)}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                                {task.assigned_to_name.split(' ')[0]}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {task.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateTaskStatus(task.id, 'COMPLETED', 'Marked completed from Kanban card');
                                  }}
                                  title="Mark Task as Completed"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    color: '#34d399',
                                    borderRadius: 4,
                                    padding: '0.15rem 0.45rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3
                                  }}
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Done</span>
                                </button>
                              )}
                              <div style={{ fontSize: '0.72rem', color: isOverdue ? '#f43f5e' : isDueToday ? '#f59e0b' : isDueTomorrow ? '#38bdf8' : '#94a3b8', fontWeight: isOverdue || isDueToday ? 800 : 500 }}>
                                {isOverdue ? '⚠️ Overdue' : isDueToday ? '📅 Today' : isDueTomorrow ? '⏳ Tomorrow' : new Date(task.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                      No tasks in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
