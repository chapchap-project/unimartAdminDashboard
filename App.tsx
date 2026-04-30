import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import ListingsView from './components/ListingsView';
import UsersView from './components/UsersView';
import ReportsView from './components/DisputesView';
import TransactionsView from './components/TransactionsView';
import AuditLogsView from './components/AuditLogsView';
import AnnouncementsView from './components/AnnouncementsView';
import NotificationAnalyticsView from './components/NotificationAnalyticsView';
import SystemHealthView from './components/SystemHealthView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import LogsView from './components/LogsView';
import WalletView from './components/WalletView';
import CommandPalette from './components/CommandPalette';
import { ViewState, User } from './types';
import { Bell, Search, GraduationCap, LogIn, Lock, AlertCircle, X } from 'lucide-react';
import { api } from './services/api';
import { socketService } from './services/socketService';
import { Report } from './types';
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setView] = useState<ViewState>('DASHBOARD');
  const [initialListingId, setInitialListingId] = useState<string | null>(null);
  const [initialReportId, setInitialReportId] = useState<string | null>(null);
  const [initialFraudOnly, setInitialFraudOnly] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'REPORT' | 'ALERT', data: any }[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Check for existing token and fetch profile
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const user = await api.getProfile();
          if (user.role !== 'ADMIN') {
            console.warn("Non-admin user attempted dashboard access");
            handleLogout();
            return;
          }
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Token invalid or expired", err);
          handleLogout();
        }
      }
    };
    checkAuth();
  }, []);

  const navigateToView = (view: ViewState, params?: { targetId?: string, fraudOnly?: boolean }) => {
    setView(view);
    if (params?.targetId) {
      if (view === 'LISTINGS') setInitialListingId(params.targetId);
      if (view === 'REPORTS') setInitialReportId(params.targetId);
    }
    if (params?.fraudOnly !== undefined) {
      setInitialFraudOnly(params.fraudOnly);
    }
  };

  // WebSocket Connection
  React.useEffect(() => {
    if (isAuthenticated) {
      const socket = socketService.connect();

      socketService.onNewReport((report: Report) => {
        const id = Math.random().toString(36).substring(7);
        setNotifications(prev => [{
          id,
          message: `New Report: ${report.reason}`,
          type: 'REPORT',
          data: report
        }, ...prev]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 10000);
      });

      socketService.onNewAlert((alert: any) => {
        const id = Math.random().toString(36).substring(7);
        // Push to API local state so it appears in Dashboard
        api.pushNewAlert(alert);

        setNotifications(prev => [{
          id,
          message: alert.message,
          type: 'ALERT',
          data: alert
        }, ...prev]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 10000);
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  // Command Palette Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      
      if (response.user.role !== 'ADMIN') {
        throw new Error('Access Denied: Administrator privileges are required for this dashboard.');
      }

      api.setToken(response.token); // Persist token
      setCurrentUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setView('DASHBOARD');
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <DashboardHome setView={navigateToView} />;
      case 'LISTINGS':
        return <ListingsView
          initialListingId={initialListingId}
          onClearInitial={() => setInitialListingId(null)}
          initialFraudOnly={initialFraudOnly}
          onClearFraud={() => setInitialFraudOnly(false)}
        />;
      case 'USERS':
        return <UsersView />;
      case 'REPORTS':
        return <ReportsView initialReportId={initialReportId} onClearInitial={() => setInitialReportId(null)} />;
      case 'TRANSACTIONS':
        return <TransactionsView />;
      case 'AUDIT_LOGS':
        return <AuditLogsView />;
      case 'ANNOUNCEMENTS':
        return <AnnouncementsView />;
      case 'NOTIFICATIONS':
        return <NotificationsView />;
      case 'NOTIFICATION_ANALYTICS':
        return <NotificationAnalyticsView />;
      case 'SYSTEM_HEALTH':
        return <SystemHealthView />;
      case 'LOGS':
        return <LogsView />;
      case 'ANALYTICS':
        return <AnalyticsView />;
      case 'SETTINGS':
        return <SettingsView />;
      case 'WALLET':
        return <WalletView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <h3 className="text-lg font-medium">This module is under development</h3>
            <p>Check back later for Updates.</p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 z-10 relative">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <GraduationCap className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Unimarket Admin</h1>
              <p className="text-slate-500 text-sm mt-2">Secure access for university staff</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                    placeholder="admin@egerton.ac.ke"
                  />
                  <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 font-medium text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In Dashboard</>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-xs text-slate-400">
                Protected by Enterprise Single Sign-On
              </p>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        <Sidebar currentView={currentView} setView={setView} user={currentUser} onLogout={handleLogout} />

        <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-30 shadow-sm">
            <div className="relative w-96 group cursor-pointer" onClick={() => setIsPaletteOpen(true)}>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <Search size={18} />
              </span>
              <input
                type="text"
                readOnly
                placeholder="Press ⌘K for Global Search & Actions..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent border rounded-lg focus:outline-none cursor-pointer hover:bg-slate-200 transition-all text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="px-1.5 py-0.5 border border-slate-300 rounded text-[10px] font-bold text-slate-500">⌘</div>
                <div className="px-1.5 py-0.5 border border-slate-300 rounded text-[10px] font-bold text-slate-500">K</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button className="relative p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700">{currentUser?.name || 'Admin User'}</p>
                  <p className="text-xs text-emerald-500 font-medium">{currentUser?.role || 'Staff'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-md cursor-pointer hover:shadow-lg transition-all">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                    {currentUser?.profileImage ? (
                      <img src={currentUser.profileImage} alt="Admin" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-emerald-600 font-bold text-xs">
                        {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
            <div className="max-w-7xl mx-auto">
              {renderView()}
            </div>
          </main>
        </div>

        <div className="fixed bottom-6 right-6 z-[100] space-y-3 max-w-sm w-full">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`${notif.type === 'ALERT' && notif.data.severity === 'CRITICAL' ? 'bg-rose-950 border-rose-500 ring-2 ring-rose-500/20' : 'bg-slate-900 border-slate-700'} text-white p-4 rounded-xl shadow-2xl border flex items-start gap-4 animate-in slide-in-from-right-8 duration-300`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'ALERT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'
                }`}>
                {notif.type === 'ALERT' ? <Bell size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  {notif.type === 'ALERT' ? `${notif.data.type} Alert` : 'New Moderation Report'}
                </p>
                <p className="text-slate-400 text-xs mt-1 leading-tight">{notif.message}</p>
                <button
                  onClick={() => {
                    if (notif.type === 'ALERT') {
                      if (notif.data.actionView) setView(notif.data.actionView);
                      // We don't have targetId handled universally in toasts yet but View change is enough for demo
                    } else {
                      setView('REPORTS');
                    }
                    setNotifications(prev => prev.filter(n => n.id !== notif.id));
                  }}
                  className="mt-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
                >
                  Investigate Now
                </button>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        setView={navigateToView}
      />
    </ToastProvider>
  );
};

export default App;