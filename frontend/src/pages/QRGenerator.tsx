import React, { useState } from 'react';
import { QrCode, Copy, ExternalLink, Check, MapPin, Info } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const QRGenerator: React.FC = () => {
  const { success } = useToast();
  const [block, setBlock] = useState('Block A');
  const [unit, setUnit] = useState('101');
  const [copied, setCopied] = useState(false);

  const getDeepLink = () =>
    `${window.location.origin}/?block=${encodeURIComponent(block)}&unit=${encodeURIComponent(unit)}`;

  const getQRUrl = () =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=0B1120&color=14B8A6&data=${encodeURIComponent(getDeepLink())}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getDeepLink());
    setCopied(true);
    success('Location deep link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const presets = [
    { label: 'Block A · 101', block: 'Block A', unit: '101' },
    { label: 'Block B · 202', block: 'Block B', unit: '202' },
    { label: 'Clubhouse', block: 'Common', unit: 'Clubhouse' },
    { label: 'Parking', block: 'Common', unit: 'Parking Lot' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <QrCode className="w-6 h-6" style={{ color: 'hsl(173,80%,50%)' }} />
          Location QR Generator
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Generate QR code stickers for apartment units. Residents scan to auto-fill their complaint location.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Controls */}
        <div className="space-y-5">
          {/* Preset quick fill */}
          <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBlock(p.block); setUnit(p.unit); }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                    block === p.block && unit === p.unit
                      ? 'text-teal-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    background: block === p.block && unit === p.unit
                      ? 'hsl(173 80% 40% / 0.12)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${block === p.block && unit === p.unit ? 'hsl(173 80% 40% / 0.25)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="glass-card rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Location</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Block / Wing</label>
              <input
                type="text" value={block} onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. Block A" className="input-field" style={{ paddingLeft: '1rem' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unit / Floor</label>
              <input
                type="text" value={unit} onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 102 or Lobby" className="input-field" style={{ paddingLeft: '1rem' }}
              />
            </div>
          </div>

          {/* How it works */}
          <div
            className="rounded-xl p-4 text-xs leading-relaxed space-y-1.5"
            style={{ background: 'hsl(173 80% 40% / 0.06)', border: '1px solid hsl(173 80% 40% / 0.15)' }}
          >
            <div className="flex items-center gap-2 font-bold text-teal-400 mb-2">
              <Info className="w-3.5 h-3.5" /> How it works
            </div>
            <p className="text-slate-400">① Enter location details above (or choose a preset).</p>
            <p className="text-slate-400">② Download / print the generated QR code.</p>
            <p className="text-slate-400">③ Paste it near the physical location (corridor, meter room, elevator).</p>
            <p className="text-slate-400">④ Residents scan → complaint form opens with location pre-filled.</p>
          </div>
        </div>

        {/* Right: QR Preview */}
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Live Preview</h3>

          {/* QR box */}
          <div
            className="p-4 rounded-2xl transition-all duration-300"
            style={{ background: '#0B1120', border: '1.5px solid hsl(173 80% 40% / 0.30)', boxShadow: '0 0 32px hsl(173 80% 40% / 0.12)' }}
          >
            <img
              src={getQRUrl()}
              alt={`QR for ${block}-${unit}`}
              className="w-52 h-52 object-contain rounded-xl"
            />
          </div>

          {/* Location tag */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-teal-300" style={{ background: 'hsl(173 80% 40% / 0.10)', border: '1px solid hsl(173 80% 40% / 0.20)' }}>
            <MapPin className="w-4 h-4" />
            {block} · Unit {unit}
          </div>

          {/* Deep link preview */}
          <div
            className="w-full px-3 py-2 rounded-xl text-[10px] text-slate-500 font-mono truncate"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {getDeepLink()}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopyLink}
              className="flex-1 btn-secondary"
            >
              {copied
                ? <><Check className="w-4 h-4 text-teal-400" /> Copied!</>
                : <><Copy className="w-4 h-4" /> Copy Link</>
              }
            </button>
            <a
              href={getDeepLink()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 btn-primary justify-center"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink className="w-4 h-4" />
              Test Route
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
