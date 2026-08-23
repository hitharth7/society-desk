import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import { Mail, Lock, ArrowRight, Loader2, Building2, Sparkles } from 'lucide-react';

interface LoginProps {
  onToggleAuth: () => void;
}

export const Login: React.FC<LoginProps> = ({ onToggleAuth }) => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { error('Please enter both email and password.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string; user: any }>('/auth/login', { email, password });
      login(res.token, res.user);
      success(`Welcome back, ${res.user.name}! 👋`);
    } catch (err: any) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'admin' | 'resident') => {
    if (role === 'admin') { setEmail('admin@society.com'); setPassword('admin123'); }
    else { setEmail('john@society.com'); setPassword('password123'); }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'hsl(222, 47%, 5%)' }}>
      {/* Ambient blobs */}
      <div className="blob blob-teal w-96 h-96 top-[-80px] right-[-40px]" />
      <div className="blob blob-violet w-72 h-72 bottom-[-60px] left-[-40px]" />
      <div className="blob blob-amber w-64 h-64 top-1/2 left-1/3 opacity-30" />

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] relative p-12">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(173,80%,35%), hsl(190,75%,42%))' }}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient-teal">SocietyDesk</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight text-gradient-hero mb-4">
              Your Society,<br />Smarter.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Raise maintenance tickets, track resolutions, receive announcements — all in one beautifully unified portal.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { emoji: '🔔', label: 'Live ticket status & smart escalations' },
              { emoji: '📢', label: 'Notice board with read receipts' },
              { emoji: '⭐', label: 'Satisfaction ratings for every resolution' },
              { emoji: '📊', label: 'Admin analytics & PDF reports' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 glass-surface px-4 py-2.5 rounded-xl">
                <span className="text-lg">{f.emoji}</span>
                <span className="text-sm text-slate-300 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© {new Date().getFullYear()} SocietyDesk · Built for evaluation</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm animate-scale-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="p-3 rounded-2xl mb-3 animate-pulse-ring" style={{ background: 'linear-gradient(135deg, hsl(173,80%,35%), hsl(190,75%,42%))' }}>
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient-teal">SocietyDesk</h1>
            <p className="text-xs text-slate-500 mt-1">Maintenance & Notices Portal</p>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-8 shadow-2xl" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign in</h2>
              <p className="text-sm text-slate-400 mt-1">Access your resident or admin portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@society.com"
                    required
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full mt-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Enter Portal <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick demo access
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fillDemo('admin')}
                  className="flex-1 text-xs py-2 rounded-lg font-medium text-violet-400 transition-all hover:opacity-80"
                  style={{ background: 'hsl(258 80% 65% / 0.12)', border: '1px solid hsl(258 80% 65% / 0.20)' }}
                >
                  Admin Demo
                </button>
                <button
                  onClick={() => fillDemo('resident')}
                  className="flex-1 text-xs py-2 rounded-lg font-medium text-teal-400 transition-all hover:opacity-80"
                  style={{ background: 'hsl(173 80% 40% / 0.12)', border: '1px solid hsl(173 80% 40% / 0.20)' }}
                >
                  Resident Demo
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              New resident?{' '}
              <button onClick={onToggleAuth} className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                Create an account →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
