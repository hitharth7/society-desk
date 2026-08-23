import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import ComplaintDetails, { type Complaint } from '../components/ComplaintDetails';
import { NoticeBoard } from '../components/NoticeBoard';
import {
  ClipboardList,
  AlertOctagon,
  Megaphone,
  PlusCircle,
  FileText,
  Camera,
  QrCode,
  ArrowRight,
  Info,
  Loader2,
  Star,
} from 'lucide-react';

interface ResidentDashboardProps {
  initialSubTab?: string;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ initialSubTab = 'dashboard' }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [subTab, setSubTab] = useState(initialSubTab); // 'dashboard' | 'raise-complaint' | 'my-complaints' | 'notices'
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Form States
  const [category, setCategory] = useState('PLUMBING');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // QR Pre-fills
  const [qrBlock, setQrBlock] = useState<string | null>(null);
  const [qrUnit, setQrUnit] = useState<string | null>(null);

  // Read QR parameters from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const block = params.get('block');
    const unit = params.get('unit');
    if (block || unit) {
      setQrBlock(block);
      setQrUnit(unit);
      setSubTab('raise-complaint');
      // Clear URL params to avoid persistent prompts
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.get<Complaint[]>('/complaints');
      setComplaints(data);
      
      // If we are currently viewing a selected complaint, refresh its data
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

  useEffect(() => {
    fetchComplaints();
  }, [subTab]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error('File is too large. Max size is 5MB.');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      error('Description is required.');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      
      // Append QR pre-filled data to description if present
      let finalDescription = description;
      if (qrBlock || qrUnit) {
        finalDescription += `\n\n[Submitted via Location QR Code - Block: ${qrBlock || 'N/A'}, Unit: ${qrUnit || 'N/A'}]`;
      }
      formData.append('description', finalDescription);
      
      if (photo) {
        formData.append('photo', photo);
      }

      await api.post<Complaint>('/complaints', formData);
      success('Complaint raised successfully!');
      
      // Reset form
      setCategory('PLUMBING');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      setQrBlock(null);
      setQrUnit(null);
      
      // Redirect to list
      setSubTab('my-complaints');
    } catch (err: any) {
      error(err.message || 'Failed to raise complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Helper styles
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetails
        complaint={selectedComplaint}
        onBack={() => setSelectedComplaint(null)}
        onRefresh={fetchComplaints}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Resident Navigation Tabs (Mobile toggle) */}
      <div className="flex sm:hidden overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar">
        {[
          { id: 'dashboard', label: 'Home' },
          { id: 'raise-complaint', label: 'Raise Complaint' },
          { id: 'my-complaints', label: 'My Complaints' },
          { id: 'notices', label: 'Notice Board' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              subTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Sub-navigation Layout for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side: Desktop Tab panel */}
        <div className="hidden md:flex flex-col gap-1.5">
          {[
            { id: 'dashboard', label: 'Home Feed', icon: HomeIcon },
            { id: 'raise-complaint', label: 'Raise Complaint', icon: AlertOctagon },
            { id: 'my-complaints', label: 'My Complaints', icon: ClipboardList },
            { id: 'notices', label: 'Notice Board', icon: Megaphone },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = subTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Active view content */}
        <div className="md:col-span-3">
          
          {/* Sub-Tab 1: Dashboard Home */}
          {subTab === 'dashboard' && (
            <div className="space-y-6 text-left">
              {/* Profile Welcome Box */}
              <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden bg-gradient-to-r from-blue-950/20 to-indigo-950/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome, {user?.name}!
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-xl">
                  You are registered at <span className="text-blue-400 font-semibold">Block {user?.apartmentBlock} - Unit {user?.apartmentUnit}</span>. 
                  Use this portal to register complaints, rate completed repairs, and stay updated with announcements.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => setSubTab('raise-complaint')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Raise Complaint
                  </button>
                  <button
                    onClick={() => setSubTab('my-complaints')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <ClipboardList className="w-4 h-4" />
                    View My Tickets
                  </button>
                </div>
              </div>

              {/* Counts metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass border border-white/5 rounded-2xl p-5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Open Tickets</span>
                  <span className="text-2xl font-bold text-slate-100 block mt-1">
                    {complaints.filter((c) => c.status === 'OPEN').length}
                  </span>
                </div>
                <div className="glass border border-white/5 rounded-2xl p-5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">In Progress</span>
                  <span className="text-2xl font-bold text-amber-400 block mt-1">
                    {complaints.filter((c) => c.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="glass border border-white/5 rounded-2xl p-5 bg-white/[0.01] col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resolved</span>
                  <span className="text-2xl font-bold text-emerald-400 block mt-1">
                    {complaints.filter((c) => c.status === 'RESOLVED').length}
                  </span>
                </div>
              </div>

              {/* Quick info widget for QR */}
              <div className="glass border border-white/5 rounded-2xl p-5 flex gap-4 items-start bg-slate-900/30">
                <QrCode className="w-10 h-10 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">QR Code Deep Linking</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    When scanning a location QR code printed in your block corridor, you will be automatically routed to the Raise Complaint form with floor/unit pre-filled.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Raise Complaint Form */}
          {subTab === 'raise-complaint' && (
            <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <AlertOctagon className="w-5.5 h-5.5 text-blue-500" />
                  Raise Maintenance Ticket
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Fill in the details below. Our administrative team will inspect and resolve the issue.
                </p>
              </div>

              {/* QR Code Prefill Info Banner */}
              {(qrBlock || qrUnit) && (
                <div className="flex items-center gap-2.5 p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs">
                  <Info className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">Location Prefilled:</span> Block {qrBlock || 'N/A'} - Unit {qrUnit || 'N/A'} detected from scanned QR code deep link.
                  </div>
                </div>
              )}

              <form onSubmit={handleRaiseSubmit} className="space-y-5">
                {/* Category dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Issue Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all cursor-pointer"
                  >
                    <option value="PLUMBING" className="bg-slate-900 text-slate-200">Plumbing</option>
                    <option value="ELECTRICAL" className="bg-slate-900 text-slate-200">Electrical</option>
                    <option value="CLEANING" className="bg-slate-900 text-slate-200">Cleaning</option>
                    <option value="SECURITY" className="bg-slate-900 text-slate-200">Security</option>
                    <option value="OTHER" className="bg-slate-900 text-slate-200">Other</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Description of Issue
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Provide details about the issue (e.g. dripping kitchen pipe, water tank overflow, flickering bulb in corridor)..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-500 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Upload Photo Proof (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-xl hover:bg-white/[0.04] transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-slate-400 shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-xs font-bold text-slate-300 block">Click to select photo</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Supports PNG, JPG, JPEG up to 5MB</span>
                    </div>

                    {photoPreview && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 sm:ml-auto relative z-10">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/35 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {submittingComplaint ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Uploading to cloud & raising ticket...
                    </>
                  ) : (
                    <>
                      Submit Ticket
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Sub-Tab 3: Complaints List */}
          {subTab === 'my-complaints' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-blue-500" />
                  My Complaints
                </h2>
                <p className="text-sm text-slate-400">
                  Track the real-time resolution timeline of your submitted maintenance tickets.
                </p>
              </div>

              {loading && complaints.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : complaints.length === 0 ? (
                <div className="glass border border-white/5 rounded-2xl p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-300">No Tickets Filed Yet</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    You haven't registered any maintenance complaints for Unit {user?.apartmentBlock}-{user?.apartmentUnit} yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className="glass border border-white/5 hover:border-white/10 rounded-2xl p-5 bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col justify-between gap-4 group"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Title details */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            ID: #{c.id.slice(0, 8)}
                          </span>
                          <h3 className="text-base font-bold text-slate-200 mt-0.5 group-hover:text-slate-100">
                            {c.category.charAt(0) + c.category.slice(1).toLowerCase()} Issue
                          </h3>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getStatusColor(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                          {c.isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Snippet */}
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {c.description}
                      </p>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
                        <span>Reported on {new Date(c.createdAt).toLocaleDateString()}</span>
                        
                        {/* Star display if resolved */}
                        {c.status === 'RESOLVED' && (
                          <div className="flex items-center gap-1 text-slate-400">
                            {c.rating ? (
                              <div className="flex gap-0.5 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <StarIcon
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= c.rating! ? 'fill-amber-400' : 'text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 animate-pulse-subtle">
                                Tap to Rate Service
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 4: Notice Board */}
          {subTab === 'notices' && <NoticeBoard />}

        </div>

      </div>

    </div>
  );
};

// Internal mini icons to keep it simple and not import too many
const HomeIcon = (props: any) => <FileText {...props} />;
const StarIcon = (props: any) => <Star {...props} />;

export default ResidentDashboard;
