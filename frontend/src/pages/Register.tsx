import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import { User, Mail, Lock, Building, ArrowLeft, Loader2, CheckCircle, Building2 } from 'lucide-react';

interface RegisterProps {
  onToggleAuth: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onToggleAuth }) => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apartmentBlock, setApartmentBlock] = useState('');
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !apartmentBlock || !apartmentUnit) {
      error('Please fill in all fields.'); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string; user: any }>('/auth/register', {
        name, email, password, apartmentBlock, apartmentUnit,
      });
      login(res.token, res.user);
      success(`Welcome to SocietyDesk, ${res.user.name}! 🎉`);
    } catch (err: any) {
      error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: 'hsl(222, 47%, 5%)' }}>
      {/* Ambient blobs */}
      <div className="blob blob-teal w-80 h-80 top-[-60px] left-[-40px]" />
      <div className="blob blob-violet w-72 h-72 bottom-[-40px] right-[-40px]" />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Back button */}
        <button
          onClick={onToggleAuth}
          className="flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(173,80%,35%), hsl(190,75%,42%))' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Resident Account</h2>
              <p className="text-xs text-slate-400 mt-0.5">Register your apartment unit to get started</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" required className="input-field" style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@society.com" required className="input-field" style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required className="input-field" style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Block + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Block</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text" value={apartmentBlock} onChange={(e) => setApartmentBlock(e.target.value)}
                    placeholder="e.g. A" required className="input-field" style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unit / Flat</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text" value={apartmentUnit} onChange={(e) => setApartmentUnit(e.target.value)}
                    placeholder="e.g. 102" required className="input-field" style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs text-slate-400" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              Resident accounts give access to ticket filing, notice board, and real-time updates.
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                : <><CheckCircle className="w-4 h-4" /> Create Account</>
              }
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already registered?{' '}
            <button onClick={onToggleAuth} className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Sign in →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
