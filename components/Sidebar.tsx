import React, { useState, useEffect } from 'react';
import { ViewState, User } from '../types';
import {
  LayoutDashboard, Users, ShoppingBag, AlertCircle, Settings, LogOut,
  GraduationCap, FileText, CreditCard, Megaphone, Activity, BarChart3,
  Wallet, Bell, TrendingUp, CalendarClock, ChevronDown, ChevronRight,
  Shield, Terminal, Headphones
} from 'lucide-react';
import { api } from '../services/api';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User | null;
  onLogout: () => void;
  isModerator?: boolean;
}

const NOTIFICATION_VIEWS: ViewState[] = ['ANNOUNCEMENTS', 'NOTIFICATIONS', 'SCHEDULED_NOTIFICATIONS', 'NOTIFICATION_ANALYTICS'];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, isModerator = false }) => {
  const [notifExpanded, setNotifExpanded] = useState(NOTIFICATION_VIEWS.includes(currentView));
  const [openReports, setOpenReports] = useState<number | null>(null);

  // Fetch pending report count for the badge
  useEffect(() => {
    api.getReports(1, 1).then(data => {
      const pending = data.reports.filter(r => r.status === 'PENDING').length;
      // Use totalItems as proxy if available, fall back to filtered count
      setOpenReports(data.totalItems > 0 ? data.totalItems : pending);
    }).catch(() => {});
  }, []);

  // Auto-expand notifications group when a notification view is active
  useEffect(() => {
    if (NOTIFICATION_VIEWS.includes(currentView)) {
      setNotifExpanded(true);
    }
  }, [currentView]);

  const NavItem = ({
    id,
    label,
    icon: Icon,
    badge,
    indent = false,
  }: {
    id: ViewState;
    label: string;
    icon: React.ElementType;
    badge?: number;
    indent?: boolean;
  }) => {
    const isActive = currentView === id;
    return (
      <button
        onClick={() => setView(id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
          indent ? 'ml-4 pl-3 w-[calc(100%-16px)]' : ''
        } ${
          isActive
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon
          size={indent ? 15 : 18}
          className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}
        />
        <span className={`font-medium ${indent ? 'text-xs' : 'text-sm'} flex-1 text-left`}>{label}</span>
        {badge != null && badge > 0 && (
          <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
            isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
          }`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {isActive && !indent && (
          <div className="absolute right-2 w-1.5 h-1.5 bg-white/70 rounded-full" />
        )}
      </button>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] px-3 pt-5 pb-1.5 select-none">
      {label}
    </p>
  );

  return (
    <div className="w-60 h-screen fixed left-0 top-0 flex flex-col z-50 bg-slate-900 border-r border-slate-800">
      {/* Brand */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50 flex-shrink-0">
          <GraduationCap className="text-white" size={18} />
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-bold tracking-tight text-base leading-tight">Unimarket</h1>
          <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 ${
            isModerator
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isModerator ? 'Moderator' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto hide-scrollbar py-2">
        <SectionLabel label="Main" />

        <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
        <NavItem id="USERS" label="Users" icon={Users} />
        <NavItem id="LISTINGS" label="Listings" icon={ShoppingBag} />
        <NavItem id="REPORTS" label="Reports" icon={AlertCircle} badge={openReports ?? undefined} />
        <NavItem id="TRANSACTIONS" label="Transactions" icon={CreditCard} />
        <NavItem id="ANALYTICS" label="Analytics" icon={BarChart3} />
        {!isModerator && <NavItem id="WALLET" label="System Wallet" icon={Wallet} />}

        <SectionLabel label="Notifications" />

        {/* Collapsible Notifications Group */}
        <button
          onClick={() => setNotifExpanded(v => !v)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
            NOTIFICATION_VIEWS.includes(currentView)
              ? 'text-emerald-400'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Bell size={18} className="flex-shrink-0" />
          <span className="font-medium text-sm flex-1 text-left">Notifications</span>
          {notifExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {notifExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {!isModerator && <NavItem id="ANNOUNCEMENTS" label="Broadcasts" icon={Megaphone} indent />}
            <NavItem id="NOTIFICATIONS" label="Send to Users" icon={Bell} indent />
            {!isModerator && <NavItem id="SCHEDULED_NOTIFICATIONS" label="Scheduled" icon={CalendarClock} indent />}
            <NavItem id="NOTIFICATION_ANALYTICS" label="Analytics" icon={TrendingUp} indent />
          </div>
        )}

        <SectionLabel label="System" />

        <NavItem id="AUDIT_LOGS" label="Audit Logs" icon={Shield} />
        <NavItem id="SYSTEM_HEALTH" label="System Health" icon={Activity} />
        <NavItem id="SUPPORT" label="Support" icon={Headphones} />
        {!isModerator && <NavItem id="LOGS" label="Server Logs" icon={Terminal} />}
        {!isModerator && <NavItem id="SETTINGS" label="Settings" icon={Settings} />}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white uppercase flex-shrink-0">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-rose-900/20 hover:text-rose-400 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
