import React from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, Users, ShoppingBag, AlertCircle, Settings, LogOut, GraduationCap, FileText, CreditCard, Megaphone, Activity, BarChart3 } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'USERS', label: 'User Management', icon: Users },
    { id: 'LISTINGS', label: 'Listings', icon: ShoppingBag },
    { id: 'REPORTS', label: 'Reports', icon: AlertCircle },
    { id: 'TRANSACTIONS', label: 'Transactions', icon: CreditCard },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'ANNOUNCEMENTS', label: 'Broadcasts', icon: Megaphone },
  ];

  return (
    <div className="w-64 h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 bg-slate-900 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <GraduationCap className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-white font-bold tracking-tight text-lg leading-tight">Unimarket</h1>
          <p className="text-xs text-slate-400 font-medium">Admin Portal</p>
        </div>
      </div>

      <div className="px-6 py-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full shadow-lg animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System</p>
      </div>

      <div className="p-3 mb-4 space-y-1">
        <button
          onClick={() => setView('AUDIT_LOGS')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${currentView === 'AUDIT_LOGS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <FileText size={20} />
          <span className="font-medium text-sm">Audit Logs</span>
        </button>
        <button
          onClick={() => setView('SYSTEM_HEALTH')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${currentView === 'SYSTEM_HEALTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Activity size={20} />
          <span className="font-medium text-sm">System Health</span>
        </button>
        <button
          onClick={() => setView('SETTINGS')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${currentView === 'SETTINGS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Settings size={20} />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>

      {/* Admin Profile Mini */}
      <div className="mx-4 mb-6 p-3 bg-slate-800 rounded-xl flex items-center gap-3 border border-slate-700">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
          {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin User'}</p>
          <p className="text-[10px] text-slate-400 truncate">{user?.universityEmail || 'admin@egerton.ac.ke'}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;