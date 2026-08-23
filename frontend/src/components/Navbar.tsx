import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Home, AlertOctagon, ClipboardList,
  Megaphone, QrCode, Settings as SettingsIcon,
  Building2, Menu, X
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const menuItems = isAdmin
    ? [
        { id: 'dashboard',   label: 'Dashboard',    icon: Home },
        { id: 'complaints',  label: 'Complaints',   icon: ClipboardList },
        { id: 'notices',     label: 'Notices',      icon: Megaphone },
        { id: 'qr-generator',label: 'QR Generator', icon: QrCode },
        { id: 'settings',    label: 'Settings',     icon: SettingsIcon },
      ]
    : [
        { id: 'dashboard',      label: 'Home',          icon: Home },
        { id: 'raise-complaint',label: 'Raise Ticket',  icon: AlertOctagon },
        { id: 'my-complaints',  label: 'My Tickets',    icon: ClipboardList },
        { id: 'notices',        label: 'Notices',       icon: Megaphone },
      ];

  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15" style={{ height: '3.75rem' }}>
            
            {/* Logo */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 group"
            >
              <div
                className="relative p-2 rounded-xl transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, hsl(173,80%,35%) 0%, hsl(190,75%,40%) 100%)',
                  boxShadow: '0 4px 16px hsl(173 80% 35% / 0.40)',
                }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <div className="font-bold text-base text-gradient-teal tracking-tight">
                  SocietyDesk
                </div>
                <div className="text-[9px] text-slate-500 font-semibold tracking-[0.12em] uppercase mt-0.5">
                  {isAdmin ? 'Admin Portal' : 'Resident Portal'}
                </div>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`nav-pill ${activeTab === id ? 'active' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </nav>

            {/* User section */}
            <div className="flex items-center gap-3">
              {/* User chip */}
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-surface">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: isAdmin
                      ? 'linear-gradient(135deg, hsl(258,80%,55%), hsl(280,70%,60%))'
                      : 'linear-gradient(135deg, hsl(173,80%,35%), hsl(190,75%,40%))',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="leading-none">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
                    {isAdmin ? 'Admin' : `${user.apartmentBlock} · ${user.apartmentUnit}`}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.04] text-slate-400 hover:bg-rose-500/[0.12] hover:text-rose-400 hover:border-rose-500/20 transition-all duration-200 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] animate-fade-up">
            <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 bg-white/[0.03] border border-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
