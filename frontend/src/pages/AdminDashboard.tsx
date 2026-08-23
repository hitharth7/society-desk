import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, AlertTriangle, Smile, BarChart3, Flame,
  ArrowDownToLine, Eye, Megaphone, Loader2, Calendar,
  TrendingUp, CheckCircle2, Clock, RefreshCw,
} from 'lucide-react';

interface DashboardData {
  complaintStats: {
    status: { OPEN: number; IN_PROGRESS: number; RESOLVED: number };
    category: Record<string, number>;
    overdueCount: number;
    categoryAverages: Record<string, number>;
  };
  recurringIssues: Array<{
    category: string; count: number; affectedUnits: string[]; reason: string;
  }>;
  noticesStats: Array<{
    id: string; title: string; createdAt: string;
    readCount: number; totalResidents: number; reads: string[];
  }>;
}

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { error, success } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<DashboardData>('/dashboard');
      setData(res);
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleExportPDF = () => {
    if (!data) return;
    setExporting(true);
    try {
      const doc = new jsPDF();

      // ── Header banner ──────────────────────────────────────
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setTextColor(20, 184, 166);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SOCIETY MAINTENANCE TRACKER REPORT', 14, 21);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 31);

      const totalComplaints =
        data.complaintStats.status.OPEN +
        data.complaintStats.status.IN_PROGRESS +
        data.complaintStats.status.RESOLVED;

      // ── Section 1: Overview ────────────────────────────────
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. METRICS OVERVIEW', 14, 50);

      const table1 = autoTable(doc, {
        startY: 55,
        head: [['Metric', 'Value']],
        body: [
          ['Total Complaints', String(totalComplaints)],
          ['Open', String(data.complaintStats.status.OPEN)],
          ['In Progress', String(data.complaintStats.status.IN_PROGRESS)],
          ['Resolved', String(data.complaintStats.status.RESOLVED)],
          ['Overdue', String(data.complaintStats.overdueCount)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [20, 184, 166] },
      });

      const afterTable1 = (table1 as any)?.finalY ?? 110;

      // ── Section 2: Categories ──────────────────────────────
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('2. CATEGORY BREAKDOWN & SATISFACTION', 14, afterTable1 + 14);

      const table2 = autoTable(doc, {
        startY: afterTable1 + 19,
        head: [['Category', 'Complaints', 'Avg. Satisfaction']],
        body: Object.entries(data.complaintStats.category).map(([cat, count]) => {
          const rating = data.complaintStats.categoryAverages[cat] || 0;
          return [
            cat.charAt(0) + cat.slice(1).toLowerCase(),
            String(count),
            rating > 0 ? `${rating} / 5.0` : '—',
          ];
        }),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] },
      });

      const afterTable2 = (table2 as any)?.finalY ?? afterTable1 + 60;

      // ── Section 3: Recurring patterns ─────────────────────
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('3. RECURRING PATTERNS (30-DAY WINDOW)', 14, afterTable2 + 14);

      if (data.recurringIssues.length > 0) {
        autoTable(doc, {
          startY: afterTable2 + 19,
          head: [['Category', 'Count', 'Affected Units', 'Trigger Reason']],
          body: data.recurringIssues.map((i) => [
            i.category.charAt(0) + i.category.slice(1).toLowerCase(),
            String(i.count),
            i.affectedUnits.join(', ') || 'N/A',
            i.reason,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] },
        });
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('No recurring patterns detected in the last 30 days.', 14, afterTable2 + 22);
      }

      doc.save(`societydesk-report-${Date.now()}.pdf`);
      success('Report exported successfully!');
    } catch (err: any) {
      console.error('PDF error:', err);
      error('Failed to generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const totalTickets = data.complaintStats.status.OPEN + data.complaintStats.status.IN_PROGRESS + data.complaintStats.status.RESOLVED;

  const kpiCards = [
    {
      label: 'Open Tickets',
      value: data.complaintStats.status.OPEN,
      icon: Clock,
      color: 'hsl(173, 80%, 40%)',
      dimColor: 'hsl(173 80% 40% / 0.12)',
      borderColor: 'hsl(173 80% 40% / 0.20)',
      textColor: 'hsl(173, 80%, 60%)',
      sub: 'Awaiting action',
    },
    {
      label: 'In Progress',
      value: data.complaintStats.status.IN_PROGRESS,
      icon: TrendingUp,
      color: 'hsl(38, 92%, 58%)',
      dimColor: 'hsl(38 92% 58% / 0.12)',
      borderColor: 'hsl(38 92% 58% / 0.20)',
      textColor: 'hsl(38, 92%, 68%)',
      sub: 'Under resolution',
    },
    {
      label: 'Resolved',
      value: data.complaintStats.status.RESOLVED,
      icon: CheckCircle2,
      color: 'hsl(142, 70%, 45%)',
      dimColor: 'hsl(142 70% 45% / 0.12)',
      borderColor: 'hsl(142 70% 45% / 0.20)',
      textColor: 'hsl(142, 70%, 60%)',
      sub: 'Successfully closed',
    },
    {
      label: 'Overdue',
      value: data.complaintStats.overdueCount,
      icon: AlertTriangle,
      color: 'hsl(4, 90%, 58%)',
      dimColor: 'hsl(4 90% 58% / 0.10)',
      borderColor: 'hsl(4 90% 58% / 0.25)',
      textColor: 'hsl(4, 90%, 65%)',
      sub: 'Priority escalated',
    },
  ];

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6" style={{ color: 'hsl(173,80%,50%)' }} />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-slate-200 font-medium">{user?.name}</span>. Here's your society overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboard}
            className="btn-secondary"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-primary"
          >
            {exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><ArrowDownToLine className="w-4 h-4" /> Export PDF</>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {kpiCards.map(({ label, value, icon: Icon, dimColor, borderColor, textColor, color, sub }) => (
          <div
            key={label}
            className="glass-card stat-card rounded-2xl p-5"
            style={{ background: dimColor, border: `1px solid ${borderColor}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColor }}>{label}</span>
              <div className="p-1.5 rounded-lg" style={{ background: dimColor }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-white mb-1">{value}</div>
            <div className="text-[10px] font-medium" style={{ color: textColor, opacity: 0.7 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts + Recurring patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category bars + satisfaction scores */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category distribution */}
          <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'hsl(173,80%,50%)' }} />
              Complaints by Category
            </h3>
            <div className="space-y-4">
              {Object.entries(data.complaintStats.category).map(([cat, count]) => {
                const pct = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                      <span className="text-slate-500">{count} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, hsl(173,80%,40%), hsl(190,70%,50%))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Satisfaction scores */}
          <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-400" />
              Resident Satisfaction Scores
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.complaintStats.categoryAverages).map(([cat, score]) => (
                <div
                  key={cat}
                  className="p-4 rounded-xl space-y-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </span>
                  <div className="text-2xl font-extrabold text-white">
                    {score > 0 ? score : <span className="text-slate-600 text-base">—</span>}
                    {score > 0 && <span className="text-slate-500 text-xs font-normal ml-1">/5</span>}
                  </div>
                  {score > 0 && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-xs" style={{ color: s <= Math.round(score) ? 'hsl(38,92%,58%)' : 'rgba(255,255,255,0.15)' }}>★</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {Object.keys(data.complaintStats.categoryAverages).length === 0 && (
                <div className="col-span-3 text-center py-6 text-xs text-slate-600 italic">
                  No satisfaction ratings submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recurring issues */}
        <div>
          <div
            className="glass-card rounded-2xl p-6 h-full flex flex-col"
            style={{ border: '1px solid hsl(4 90% 58% / 0.15)' }}
          >
            <h3 className="text-sm font-bold text-slate-200 mb-4 pb-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Flame className="w-4 h-4 text-rose-400" />
              Recurring Patterns
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: '380px' }}>
              {data.recurringIssues.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-600 italic">
                  No patterns detected in the last 30 days.
                </div>
              ) : (
                data.recurringIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl space-y-2"
                    style={{ background: 'hsl(4 90% 58% / 0.06)', border: '1px solid hsl(4 90% 58% / 0.15)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        {issue.category.charAt(0) + issue.category.slice(1).toLowerCase()}
                      </span>
                      <span
                        className="badge badge-overdue text-[9px]"
                        style={{ padding: '2px 8px' }}
                      >
                        {issue.count}×
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{issue.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {issue.affectedUnits.map((u) => (
                        <span key={u} className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-slate-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notice read receipts */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2">
          <Megaphone className="w-4 h-4" style={{ color: 'hsl(258,80%,70%)' }} />
          Notice Read Receipts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Notice Title', 'Published', 'Read Status', 'Recent Readers'].map((h) => (
                  <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.noticesStats.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-600 italic">No notices to display.</td></tr>
              ) : (
                data.noticesStats.map((n) => {
                  const ratio = n.totalResidents > 0 ? (n.readCount / n.totalResidents) * 100 : 0;
                  return (
                    <tr key={n.id} className="table-row">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{n.title}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{
                              background: ratio > 50 ? 'hsl(142 70% 45% / 0.12)' : 'hsl(38 92% 58% / 0.12)',
                              color: ratio > 50 ? 'hsl(142,70%,60%)' : 'hsl(38,92%,65%)',
                              border: `1px solid ${ratio > 50 ? 'hsl(142 70% 45% / 0.20)' : 'hsl(38 92% 58% / 0.20)'}`,
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            {n.readCount}/{n.totalResidents}
                          </span>
                          <span className="text-slate-500">({ratio.toFixed(0)}%)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {n.reads.length > 0 ? n.reads.join(', ') : <span className="italic text-slate-600">No readers yet</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
