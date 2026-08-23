import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import confetti from 'canvas-confetti';
import {
  Calendar, AlertTriangle, Clock, CheckCircle2, Star,
  User, ArrowLeft, Camera, Send, Loader2, MapPin,
  Tag, Zap, MessageSquare, ShieldCheck,
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  changedBy: string;
  note: string | null;
  timestamp: string;
}

export interface Complaint {
  id: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'CLEANING' | 'SECURITY' | 'OTHER';
  description: string;
  photoUrl: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  rating: number | null;
  ratingComment: string | null;
  createdAt: string;
  isOverdue: boolean;
  statusHistory: HistoryRecord[];
  resident: {
    name: string;
    email: string;
    apartmentBlock: string;
    apartmentUnit: string;
  };
}

interface ComplaintDetailsProps {
  complaint: Complaint;
  onBack: () => void;
  onRefresh: () => void;
}

// ── Timeline dot config ──────────────────────────────────────────────────────
const timelineDot: Record<string, { bg: string; ring: string; icon: typeof Clock }> = {
  OPEN:        { bg: 'hsl(173,80%,40%)',  ring: 'hsl(173 80% 40% / 0.30)', icon: Clock },
  IN_PROGRESS: { bg: 'hsl(38,92%,55%)',   ring: 'hsl(38 92% 55% / 0.30)',  icon: Zap },
  RESOLVED:    { bg: 'hsl(142,70%,45%)',  ring: 'hsl(142 70% 45% / 0.30)', icon: CheckCircle2 },
  VIRTUAL:     { bg: 'hsl(4,90%,58%)',    ring: 'hsl(4 90% 58% / 0.30)',   icon: AlertTriangle },
};

const statusLabel: Record<string, string> = {
  OPEN: 'Opened', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved',
};

export const ComplaintDetails: React.FC<ComplaintDetailsProps> = ({
  complaint,
  onBack,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) { error('Please select a rating.'); return; }
    setSubmittingRating(true);
    try {
      await api.post(`/complaints/${complaint.id}/rate`, { rating, ratingComment: comment });
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#14B8A6', '#F59E0B', '#10B981', '#6366F1', '#FB7185'],
      });
      success('Thanks for your feedback! 🎉');
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-5 text-left">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors text-xs font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to list
      </button>

      {/* ── Ticket header ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Subtle top-left glow */}
        <div
          className="absolute top-0 left-0 w-48 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(173,80%,40%), transparent 70%)', filter: 'blur(32px)' }}
        />

        <div className="relative">
          {/* ID + title */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <span className="text-[9px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Ticket #{complaint.id.slice(0, 8).toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {complaint.category.charAt(0) + complaint.category.slice(1).toLowerCase()} Issue
              </h3>
            </div>
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {complaint.isOverdue && (
                <span className="badge badge-overdue animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                </span>
              )}
              <span className={`badge ${
                complaint.status === 'OPEN' ? 'badge-open' :
                complaint.status === 'IN_PROGRESS' ? 'badge-progress' : 'badge-resolved'
              }`}>
                {complaint.status.replace('_', ' ')}
              </span>
              <span className={`badge ${
                complaint.priority === 'HIGH' ? 'badge-high' :
                complaint.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
              }`}>
                {complaint.priority}
              </span>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Filed by</div>
                <div className="text-slate-300 font-medium">{complaint.resident.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Location</div>
                <div className="text-slate-300 font-medium">
                  Block {complaint.resident.apartmentBlock} · {complaint.resident.apartmentUnit}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Filed on</div>
                <div className="text-slate-300 font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Tag className="w-3 h-3" /> Description
            </div>
            <p
              className="text-sm text-slate-300 leading-relaxed p-3.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {complaint.description}
            </p>
          </div>
        </div>
      </div>

      {/* ── Photo attachment ─────────────────────────────────────────────── */}
      {complaint.photoUrl && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5" /> Photo Attachment
          </div>
          <div
            className="rounded-xl overflow-hidden w-full max-w-sm"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <img
              src={complaint.photoUrl}
              alt="Complaint evidence"
              className="w-full object-cover max-h-60 hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        </div>
      )}

      {/* ── Audit Resolution Trail (vertical timeline) ─────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-1"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-5">
          <Clock className="w-4 h-4" style={{ color: 'hsl(173,80%,50%)' }} />
          Audit Resolution Trail
          <span
            className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'hsl(173 80% 40% / 0.12)', color: 'hsl(173,80%,60%)', border: '1px solid hsl(173 80% 40% / 0.20)' }}
          >
            {complaint.statusHistory.length} event{complaint.statusHistory.length !== 1 ? 's' : ''}
          </span>
        </div>

        {complaint.statusHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-600 italic">
            No status events recorded yet.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[11px] top-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.02))' }}
            />

            <div className="space-y-4">
              {complaint.statusHistory.map((hist, idx) => {
                const isVirtual = hist.id.startsWith('virtual-');
                const dotKey = isVirtual ? 'VIRTUAL' : hist.status;
                const dot = timelineDot[dotKey] || timelineDot.OPEN;
                const DotIcon = dot.icon;
                const isLast = idx === complaint.statusHistory.length - 1;

                return (
                  <div key={hist.id} className="relative flex gap-4 pl-1">
                    {/* Timeline dot */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: dot.bg,
                          boxShadow: `0 0 0 3px ${dot.ring}, 0 0 12px ${dot.bg}55`,
                        }}
                      >
                        <DotIcon className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 rounded-xl p-3.5 space-y-1.5 transition-all ${isLast ? 'ring-1' : ''}`}
                      style={{
                        background: isVirtual
                          ? 'hsl(4 90% 58% / 0.06)'
                          : hist.status === 'RESOLVED'
                          ? 'hsl(142 70% 45% / 0.06)'
                          : hist.status === 'IN_PROGRESS'
                          ? 'hsl(38 92% 58% / 0.06)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isVirtual
                          ? 'hsl(4 90% 58% / 0.15)'
                          : hist.status === 'RESOLVED'
                          ? 'hsl(142 70% 45% / 0.15)'
                          : hist.status === 'IN_PROGRESS'
                          ? 'hsl(38 92% 58% / 0.15)'
                          : 'rgba(255,255,255,0.06)'}`,
                        ...(isLast ? { ringColor: dot.ring } : {}),
                      }}
                    >
                      {/* Top row: status label + timestamp */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: dot.bg }}
                          >
                            {isVirtual
                              ? '⚡ Auto-Escalated'
                              : statusLabel[hist.status] ?? hist.status.replace('_', ' ')}
                          </span>
                          {isLast && (
                            <span
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{ background: `${dot.bg}22`, color: dot.bg }}
                            >
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 whitespace-nowrap">
                          {fmt(hist.timestamp)}
                        </span>
                      </div>

                      {/* Changed by */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        {isVirtual
                          ? <ShieldCheck className="w-3 h-3 text-rose-400 shrink-0" />
                          : <User className="w-3 h-3 shrink-0" />
                        }
                        <span className={isVirtual ? 'text-rose-400' : ''}>{hist.changedBy}</span>
                      </div>

                      {/* Note */}
                      {hist.note && (
                        <div
                          className="flex items-start gap-2 p-2.5 rounded-lg text-xs text-slate-300 leading-relaxed"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <MessageSquare className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                          <span>{hist.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Satisfaction Rating ──────────────────────────────────────────── */}
      {complaint.status === 'RESOLVED' && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: complaint.rating
              ? 'hsl(142 70% 45% / 0.06)'
              : 'hsl(38 92% 58% / 0.06)',
            border: `1px solid ${complaint.rating
              ? 'hsl(142 70% 45% / 0.18)'
              : 'hsl(38 92% 58% / 0.18)'}`,
          }}
        >
          <div className="flex items-center gap-2 text-xs font-bold mb-4" style={{ color: complaint.rating ? 'hsl(142,70%,60%)' : 'hsl(38,92%,65%)' }}>
            <Star className="w-4 h-4" />
            Satisfaction Rating
          </div>

          {complaint.rating ? (
            /* Already rated */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-5 h-5 transition-colors"
                      style={{ color: s <= complaint.rating! ? 'hsl(38,92%,58%)' : 'rgba(255,255,255,0.12)', fill: s <= complaint.rating! ? 'hsl(38,92%,58%)' : 'transparent' }}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">{complaint.rating}/5</span>
              </div>
              {complaint.ratingComment && (
                <div
                  className="p-3 rounded-xl text-xs text-slate-300 italic leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  "{complaint.ratingComment}"
                </div>
              )}
            </div>
          ) : user?.role === 'RESIDENT' ? (
            /* Rating form */
            <form onSubmit={handleRate} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                This ticket has been resolved. How satisfied are you with the service provided?
              </p>

              {/* Star picker */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-all active:scale-90 focus:outline-none hover:scale-110"
                  >
                    <Star
                      className="w-8 h-8 transition-all duration-100"
                      style={{
                        color: star <= (hoverRating || rating) ? 'hsl(38,92%,58%)' : 'rgba(255,255,255,0.15)',
                        fill: star <= (hoverRating || rating) ? 'hsl(38,92%,58%)' : 'transparent',
                        filter: star <= (hoverRating || rating) ? 'drop-shadow(0 0 6px hsl(38,92%,58%))' : 'none',
                      }}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs text-amber-400 font-semibold ml-1">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                  </span>
                )}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (optional)..."
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
                disabled={submittingRating || rating === 0}
                className="btn-primary text-xs"
                style={{ paddingTop: '0.55rem', paddingBottom: '0.55rem', background: 'linear-gradient(135deg, hsl(38,80%,42%), hsl(20,80%,46%))' }}
              >
                {submittingRating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                  : <><Send className="w-3.5 h-3.5" /> Submit Rating</>
                }
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No satisfaction rating submitted by the resident yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
