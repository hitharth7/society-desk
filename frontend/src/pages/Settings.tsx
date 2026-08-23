import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import api from '../utils/api';
import { Settings as SettingsIcon, ShieldAlert, Save, Loader2, Clock, Zap } from 'lucide-react';

interface SettingsData {
  overdueThresholdDays: number;
  maxComplaintsPerDay: number;
}

export const Settings: React.FC = () => {
  const { success, error } = useToast();
  const [overdueThresholdDays, setOverdueThresholdDays] = useState(3);
  const [maxComplaintsPerDay, setMaxComplaintsPerDay] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get<SettingsData>('/settings');
      setOverdueThresholdDays(data.overdueThresholdDays);
      setMaxComplaintsPerDay(data.maxComplaintsPerDay);
    } catch (err: any) {
      error(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overdueThresholdDays < 1 || maxComplaintsPerDay < 1) {
      error('Values must be ≥ 1.'); return;
    }
    setSaving(true);
    try {
      await api.put('/settings', { overdueThresholdDays, maxComplaintsPerDay });
      success('Settings updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-fade-up">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-4 w-72 rounded-lg" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  const settingsFields = [
    {
      key: 'overdueThresholdDays' as const,
      label: 'Overdue Threshold',
      unit: 'Days',
      icon: Clock,
      color: 'hsl(38,92%,58%)',
      dimColor: 'hsl(38 92% 58% / 0.08)',
      borderColor: 'hsl(38 92% 58% / 0.20)',
      value: overdueThresholdDays,
      setter: setOverdueThresholdDays,
      description: 'Tickets unresolved beyond this many days are automatically flagged as Overdue, and their priority is escalated one tier.',
    },
    {
      key: 'maxComplaintsPerDay' as const,
      label: 'Daily Complaint Limit',
      unit: 'Per Resident / Day',
      icon: Zap,
      color: 'hsl(173,80%,50%)',
      dimColor: 'hsl(173 80% 40% / 0.08)',
      borderColor: 'hsl(173 80% 40% / 0.20)',
      value: maxComplaintsPerDay,
      setter: setMaxComplaintsPerDay,
      description: 'Maximum complaints a resident can submit in a 24-hour rolling window. Exceeding this returns a 429 rate limit error.',
    },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-7 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6" style={{ color: 'hsl(173,80%,50%)' }} />
          Portal Configuration
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure dynamic thresholds for escalation logic and rate limiting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {settingsFields.map(({ key, label, unit, icon: Icon, color, dimColor, borderColor, value, setter, description }) => (
          <div
            key={key}
            className="rounded-2xl p-5 space-y-3"
            style={{ background: dimColor, border: `1px solid ${borderColor}` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg" style={{ background: `${dimColor}` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">{label}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color, opacity: 0.75 }}>{unit}</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                required
                className="w-24 text-center text-xl font-bold text-white rounded-xl py-2 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1.5px solid ${borderColor}`,
                }}
              />
              <input
                type="range"
                min="1"
                max={key === 'overdueThresholdDays' ? 30 : 20}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full cursor-pointer"
                style={{ accentColor: color }}
              />
            </div>
          </div>
        ))}

        {/* Warning note */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl text-xs text-rose-400"
          style={{ background: 'hsl(4 90% 58% / 0.07)', border: '1px solid hsl(4 90% 58% / 0.18)' }}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <strong>Admin-only:</strong> These parameters apply system-wide instantly at runtime.
            Changes take effect on the next API request.
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            : <><Save className="w-4 h-4" /> Save Configuration</>
          }
        </button>
      </form>
    </div>
  );
};

export default Settings;
