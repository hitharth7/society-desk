import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import ComplaintDetails, { type Complaint } from '../components/ComplaintDetails';
import {
  ClipboardList, Loader2, X, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Search, RefreshCw,
  ChevronRight, MapPin, Calendar, User, Zap,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  OPEN:        { label: 'Open',        badge: 'badge badge-open',     dot: 'hsl(173,80%,50%)' },
  IN_PROGRESS: { label: 'In Progress', badge: 'badge badge-progress', dot: 'hsl(38,92%,58%)' },
  RESOLVED:    { label: 'Resolved',    badge: 'badge badge-resolved', dot: 'hsl(142,70%,50%)' },
};

const priorityConfig: Record<string, { badge: string }> = {
  LOW:    { badge: 'badge badge-low' },
  MEDIUM: { badge: 'badge badge-medium' },
  HIGH:   { badge: 'badge badge-high' },
};

const CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'OTHER'];

export const AdminComplaints: React.FC = () => {
  const { success, error } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [search, setSearch] = useState('');

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [statusVal, setStatusVal] = useState('');
  const [priorityVal, setPriorityVal] = useState('');
  const [actionNote, setActionNote] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let query = '/complaints?';
      if (filterCategory) query += `category=${filterCategory}&`;
      if (filterStatus) query += `status=${filterStatus}&`;
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;
      const data = await api.get<Complaint[]>(query);
      setComplaints(data);
      if (selectedComplaint) {
        const updated = data.find((c) => c.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [filterCategory, filterStatus, startDate, endDate]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !statusVal) return;
    setUpdatingStatus(true);
    try {
      await api.patch<Complaint>(`/complaints/${selectedComplaint.id}/status`, { status: statusVal, note: actionNote });
      success(`Status updated to ${statusVal.replace('_', ' ')}!`);
      setActionNote('');
      fetchComplaints();
    } catch (err: any) {
      error(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !priorityVal) return;
    setUpdatingPriority(true);
    try {
      await api.patch<Complaint>(`/complaints/${selectedComplaint.id}/priority`, { priority: priorityVal, note: actionNote });
      success(`Priority set to ${priorityVal}!`);
      setActionNote('');
      fetchComplaints();
    } catch (err: any) {
      error(err.message || 'Failed to update priority.');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const openSelect = (c: Complaint) => {
    setSelectedComplaint(c);
    setStatusVal(c.status);
    setPriorityVal(c.priority);
    setActionNote('');
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.resident.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  // Quick stats
  const stats = {
    open: complaints.filter((c) => c.status === 'OPEN').length,
    inProgress: complaints.filter((c) => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter((c) => c.status === 'RESOLVED').length,
    overdue: complaints.filter((c) => c.isOverdue).length,
  };

  const activeFilters = [filterCategory, filterStatus, startDate, endDate].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6" style={{ color: 'hsl(173,80%,50%)' }} />
            Maintenance Requests
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage all resident tickets, update statuses, and track resolution progress.
          </p>
        </div>
        <button onClick={fetchComplaints} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Mini KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Open',        value: stats.open,       icon: Clock,         color: 'hsl(173,80%,50%)', dim: 'hsl(173 80% 40% / 0.10)', border: 'hsl(173 80% 40% / 0.20)' },
          { label: 'In Progress', value: stats.inProgress, icon: TrendingUp,    color: 'hsl(38,92%,58%)',  dim: 'hsl(38 92% 58% / 0.10)',  border: 'hsl(38 92% 58% / 0.20)' },
          { label: 'Resolved',    value: stats.resolved,   icon: CheckCircle2,  color: 'hsl(142,70%,50%)', dim: 'hsl(142 70% 45% / 0.10)', border: 'hsl(142 70% 45% / 0.20)' },
          { label: 'Overdue',     value: stats.overdue,    icon: AlertTriangle, color: 'hsl(4,90%,60%)',   dim: 'hsl(4 90% 58% / 0.10)',   border: 'hsl(4 90% 58% / 0.22)' },
        ].map(({ label, value, icon: Icon, color, dim, border }) => (
          <div
            key={label}
            className="stat-card glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer"
            style={{ background: dim, border: `1px solid ${border}` }}
            onClick={() => label !== 'Overdue' && setFilterStatus(label === 'In Progress' ? 'IN_PROGRESS' : label.toUpperCase() === 'RESOLVED' || label.toUpperCase() === 'OPEN' ? label.toUpperCase() : '')}
          >
            <div className="p-2 rounded-lg shrink-0" style={{ background: dim }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white leading-none">{value}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color, opacity: 0.8 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, description, ID..."
                className="input-field text-xs"
                style={{ paddingLeft: '2.2rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field text-xs select-field" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0.75rem' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field text-xs" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0.75rem' }}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field text-xs" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0.75rem', width: '140px' }} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field text-xs" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0.75rem', width: '140px' }} />
          </div>

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterCategory(''); setFilterStatus(''); setStartDate(''); setEndDate(''); setSearch(''); }}
              className="btn-secondary text-xs flex items-center gap-1.5"
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            >
              <X className="w-3.5 h-3.5" />
              Clear ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Table / Empty state */}
      {loading && complaints.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-14 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <ClipboardList className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-base font-bold text-slate-300 mb-1">No tickets found</h3>
          <p className="text-sm text-slate-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Count bar */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-xs text-slate-400">
              Showing <span className="text-slate-200 font-semibold">{filteredComplaints.length}</span> {filteredComplaints.length === 1 ? 'ticket' : 'tickets'}
            </span>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                  {['Ticket', 'Resident', 'Category', 'Filed', 'Status', 'Priority', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openSelect(c)}
                    className="table-row cursor-pointer group"
                    style={c.isOverdue ? { background: 'hsl(4 90% 58% / 0.04)' } : {}}
                  >
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2">
                        {c.isOverdue && (
                          <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 animate-pulse" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-300 font-mono">#{c.id.slice(0, 8)}</div>
                          {c.isOverdue && (
                            <div className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mt-0.5">⚠ Overdue</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Resident */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, hsl(173,80%,30%), hsl(190,70%,38%))' }}
                        >
                          {c.resident.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{c.resident.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {c.resident.apartmentBlock}-{c.resident.apartmentUnit}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category + Description */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="text-xs font-semibold text-slate-200">
                        {c.category.charAt(0) + c.category.slice(1).toLowerCase()}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{c.description}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={statusConfig[c.status]?.badge ?? 'badge'}>
                        {statusConfig[c.status]?.label ?? c.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <span className={priorityConfig[c.priority]?.badge ?? 'badge'}>
                        {c.priority}
                      </span>
                    </td>

                    {/* Inspect */}
                    <td className="py-3.5 px-4">
                      <button
                        className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 group-hover:text-teal-400 transition-colors"
                        onClick={(e) => { e.stopPropagation(); openSelect(c); }}
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail slide-over panel ── */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedComplaint(null)}
        >
          <div
            className="relative w-full max-w-4xl h-full overflow-y-auto animate-slide-right shadow-2xl"
            style={{ background: 'hsl(222,47%,7%)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-5 right-5 z-20 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
              {/* Left: complaint detail timeline */}
              <div
                className="lg:col-span-7 p-6 sm:p-8 overflow-y-auto"
                style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
              >
                <ComplaintDetails
                  complaint={selectedComplaint}
                  onBack={() => setSelectedComplaint(null)}
                  onRefresh={fetchComplaints}
                />
              </div>

              {/* Right: admin controls */}
              <div className="lg:col-span-5 p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4" style={{ color: 'hsl(173,80%,50%)' }} />
                  <h3 className="text-sm font-bold text-slate-200">Admin Controls</h3>
                </div>

                {/* Current badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={statusConfig[selectedComplaint.status]?.badge ?? 'badge'}>
                    {statusConfig[selectedComplaint.status]?.label}
                  </span>
                  <span className={priorityConfig[selectedComplaint.priority]?.badge ?? 'badge'}>
                    {selectedComplaint.priority}
                  </span>
                  {selectedComplaint.isOverdue && (
                    <span className="badge badge-overdue">Overdue</span>
                  )}
                </div>

                {/* Status Update */}
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'hsl(173 80% 40% / 0.06)', border: '1px solid hsl(173 80% 40% / 0.15)' }}
                >
                  <label className="block text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                    Update Status
                  </label>
                  <form onSubmit={handleUpdateStatus} className="space-y-3">
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      disabled={selectedComplaint.status === 'RESOLVED' && statusVal === 'RESOLVED'}
                      className="input-field text-xs"
                      style={{ paddingTop: '0.55rem', paddingBottom: '0.55rem', paddingLeft: '0.75rem' }}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Add a resolution note (e.g. Plumber dispatched, parts ordered)..."
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl resize-none outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1.5px solid rgba(255,255,255,0.08)',
                        color: 'hsl(210,40%,90%)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={updatingStatus || (selectedComplaint.status === 'RESOLVED' && statusVal === 'RESOLVED')}
                      className="btn-primary w-full text-xs"
                      style={{ paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
                    >
                      {updatingStatus ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</> : 'Apply Status'}
                    </button>
                  </form>
                </div>

                {/* Priority Override */}
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'hsl(38 92% 58% / 0.06)', border: '1px solid hsl(38 92% 58% / 0.15)' }}
                >
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Override Priority
                  </label>
                  <form onSubmit={handleUpdatePriority} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriorityVal(p)}
                          className="py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{
                            background: priorityVal === p
                              ? (p === 'HIGH' ? 'hsl(4 90% 58% / 0.25)' : p === 'MEDIUM' ? 'hsl(38 92% 58% / 0.25)' : 'hsl(173 80% 40% / 0.25)')
                              : 'rgba(255,255,255,0.04)',
                            border: `1.5px solid ${priorityVal === p
                              ? (p === 'HIGH' ? 'hsl(4 90% 58% / 0.50)' : p === 'MEDIUM' ? 'hsl(38 92% 58% / 0.50)' : 'hsl(173 80% 40% / 0.50)')
                              : 'rgba(255,255,255,0.08)'}`,
                            color: priorityVal === p
                              ? (p === 'HIGH' ? 'hsl(4,90%,70%)' : p === 'MEDIUM' ? 'hsl(38,92%,70%)' : 'hsl(173,80%,65%)')
                              : 'hsl(215,20%,50%)',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={updatingPriority || selectedComplaint.status === 'RESOLVED' || selectedComplaint.priority === priorityVal}
                      className="btn-secondary w-full text-xs"
                      style={{ paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
                    >
                      {updatingPriority ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Setting...</> : 'Apply Priority'}
                    </button>
                  </form>
                </div>

                {/* Resident info box */}
                <div
                  className="rounded-xl p-4 text-xs space-y-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Resident
                  </div>
                  <div className="font-semibold text-slate-200">{selectedComplaint.resident.name}</div>
                  <div className="text-slate-500">{selectedComplaint.resident.email}</div>
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Block {selectedComplaint.resident.apartmentBlock} · Unit {selectedComplaint.resident.apartmentUnit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
