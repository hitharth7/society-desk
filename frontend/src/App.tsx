import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider as CustomToastProvider } from './components/ui/Toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminNotices from './pages/AdminNotices';
import QRGenerator from './pages/QRGenerator';
import Settings from './pages/Settings';
import { Loader2, Building2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (user) setActiveTab('dashboard');
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get('block') || params.get('unit')) && user?.role === 'RESIDENT') {
      setActiveTab('raise-complaint');
    }
  }, [user]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5 relative overflow-hidden"
        style={{ background: 'hsl(222, 47%, 5%)' }}
      >
        {/* Ambient blobs */}
        <div className="blob blob-teal w-96 h-96 top-[-60px] left-[-60px]" />
        <div className="blob blob-violet w-72 h-72 bottom-[-40px] right-[-40px]" />

        <div
          className="p-4 rounded-2xl animate-float"
          style={{
            background: 'linear-gradient(135deg, hsl(173,80%,35%), hsl(190,75%,42%))',
            boxShadow: '0 8px 32px hsl(173 80% 35% / 0.50)',
          }}
        >
          <Building2 className="w-10 h-10 text-white" />
        </div>

        <div className="text-center">
          <div className="text-xl font-bold text-gradient-teal mb-1">SocietyDesk</div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
            Loading secure portal...
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full animate-pulse"
            style={{ background: 'linear-gradient(90deg, hsl(173,80%,40%), hsl(190,75%,50%))', width: '60%' }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return isRegistering
      ? <Register onToggleAuth={() => setIsRegistering(false)} />
      : <Login onToggleAuth={() => setIsRegistering(true)} />;
  }

  const renderPage = () => {
    const isAdmin = user.role === 'ADMIN';
    if (isAdmin) {
      switch (activeTab) {
        case 'dashboard':    return <AdminDashboard />;
        case 'complaints':   return <AdminComplaints />;
        case 'notices':      return <AdminNotices />;
        case 'qr-generator': return <QRGenerator />;
        case 'settings':     return <Settings />;
        default:             return <AdminDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':       return <ResidentDashboard initialSubTab="dashboard" />;
        case 'raise-complaint': return <ResidentDashboard initialSubTab="raise-complaint" />;
        case 'my-complaints':   return <ResidentDashboard initialSubTab="my-complaints" />;
        case 'notices':         return <ResidentDashboard initialSubTab="notices" />;
        default:                return <ResidentDashboard initialSubTab="dashboard" />;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(222, 47%, 5%)' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={activeTab} className="animate-fade-up">
          {renderPage()}
        </div>
      </main>

      <footer className="py-5 border-t border-white/[0.04] text-center">
        <p className="text-[10px] text-slate-600 font-medium tracking-wide">
          © {new Date().getFullYear()} SocietyDesk · Maintenance & Notice Management Portal
        </p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <CustomToastProvider>
      <AppContent />
    </CustomToastProvider>
  </AuthProvider>
);

export default App;
