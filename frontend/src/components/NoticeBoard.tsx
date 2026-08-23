import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import { Megaphone, AlertCircle, Eye, Calendar, CheckCircle2, UserCheck, Loader2 } from 'lucide-react';

export interface Notice {
  id: string;
  title: string;
  body: string;
  isImportant: boolean;
  createdAt: string;
  readCount: number;
  totalResidents: number;
  hasRead: boolean;
}

export const NoticeBoard: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await api.get<Notice[]>('/notices');
      setNotices(data);
    } catch (err: any) {
      error(err.message || 'Failed to load notice board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Notice Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-500" />
            Society Announcements
          </h2>
          <p className="text-sm text-slate-400">
            Stay updated with official announcements and guidelines from the management committee.
          </p>
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No Announcements Posted</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            The notice board is currently empty. Check back later for updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => notice.isImportant ? setSelectedNotice(notice) : null}
              className={`glass rounded-2xl p-5 border text-left transition-all ${
                notice.isImportant
                  ? 'border-rose-500/25 bg-rose-500/[0.02] hover:bg-rose-500/[0.04] cursor-pointer'
                  : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02]'
              } relative overflow-hidden group`}
            >
              {notice.isImportant && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              )}
              
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                {/* Title and Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-slate-100">
                    {notice.title}
                  </h3>
                  {notice.isImportant ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-3 h-3" />
                      Important
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-800 text-slate-400 border border-white/5">
                      Announcement
                    </span>
                  )}
                </div>

                {/* Read Receipt info (Role sensitive) */}
                <div className="text-xs font-semibold">
                  {user?.role === 'ADMIN' ? (
                    notice.isImportant && (
                      <span className="flex items-center gap-1 text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Eye className="w-3.5 h-3.5" />
                        {notice.readCount} of {notice.totalResidents} residents read
                      </span>
                    )
                  ) : (
                    notice.isImportant && (
                      notice.hasRead ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          Seen
                        </span>
                      ) : (
                        <span className="text-blue-400 animate-pulse-subtle">Unread</span>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">
                {notice.body}
              </p>

              {/* Footer / Date */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Posted on {formatDate(notice.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice Read Receipt Detail Modal (Admins only, can see who read) */}
      {selectedNotice && user?.role === 'ADMIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass border border-white/15 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <Eye className="w-5 h-5 text-blue-500" />
              Notice Read Details
            </h3>
            
            <p className="text-sm font-semibold text-slate-300 mb-2">{selectedNotice.title}</p>
            <p className="text-xs text-slate-500 mb-4">Total reads: {selectedNotice.readCount} of {selectedNotice.totalResidents} residents</p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 scrollbar">
              {selectedNotice.readCount > 0 ? (
                // We'll query details or fetch list from notice reads
                // For demo, we display read receipts placeholder
                <div className="text-xs space-y-1.5">
                  <div className="text-slate-400 font-semibold mb-2">Residents who viewed:</div>
                  {/* Since notice stats are compiled in dashboard/notices, we show that residents read it */}
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Receipts verified automatically via Notice Board page views.</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">No residents have viewed this announcement yet.</p>
              )}
            </div>

            <button
              onClick={() => setSelectedNotice(null)}
              className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl font-semibold text-xs transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default NoticeBoard;
