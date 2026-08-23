import React, { useState } from 'react';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import NoticeBoard from '../components/NoticeBoard';
import { PlusCircle, AlertCircle, Send, Loader2 } from 'lucide-react';

export const AdminNotices: React.FC = () => {
  const { success, error } = useToast();
  
  // Notice Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Key to force refresh NoticeBoard component
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      error('Title and body are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/notices', {
        title,
        body,
        isImportant,
      });

      success(
        isImportant
          ? 'Notice posted! Broadcast emails are being sent to all residents.'
          : 'Notice posted successfully!'
      );
      
      // Reset form
      setTitle('');
      setBody('');
      setIsImportant(false);
      
      // Force refresh of the notice list
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      error(err.message || 'Failed to post notice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Left Column: Post Notice Form (5 cols) */}
      <div className="lg:col-span-5 h-fit">
        <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <PlusCircle className="w-5.5 h-5.5 text-blue-500" />
              Publish Announcement
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast guidelines, warnings, or committee updates to all residents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Schedule for Painting Audit, Water Tank Cleaning..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 text-sm focus:border-blue-500/50 outline-none transition-all"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Notice Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="Provide announcement details here..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-600 text-sm focus:border-blue-500/50 outline-none transition-all"
              />
            </div>

            {/* Is Important Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <input
                type="checkbox"
                id="isImportant"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-4.5 h-4.5 bg-white/5 border border-white/10 rounded focus:ring-blue-500/50 text-blue-600 cursor-pointer"
              />
              <label htmlFor="isImportant" className="text-xs text-slate-300 font-semibold cursor-pointer select-none">
                Mark as <span className="text-rose-400">Important Broadcast</span>
              </label>
            </div>

            {isImportant && (
              <div className="flex items-start gap-2 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Email Notice:</strong> Since this is marked important, a fire-and-forget notification email will be broadcasted to all registered residents.
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/35 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Broadcasting announcement...
                </>
              ) : (
                <>
                  Publish Notice
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Live Notice Board Preview (7 cols) */}
      <div className="lg:col-span-7">
        <NoticeBoard key={refreshKey} />
      </div>

    </div>
  );
};
export default AdminNotices;
