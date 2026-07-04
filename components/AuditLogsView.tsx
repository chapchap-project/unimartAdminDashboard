import React, { useState, useEffect, useMemo } from 'react';
import { AuditLog } from '../types';
import {
  Clock, User as UserIcon, FileText, AlertTriangle, Loader2,
  Search, ArrowRight, Activity, ShieldAlert, Bell,
  TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';

const PAGE_SIZE = 20;

const getDescription = (log: AuditLog): string => {
  switch (log.action) {
    case 'UPDATE_LISTING_STATUS': {
      const base = `Status changed to ${log.status ?? 'unknown'}`;
      return log.rejectionReason ? `${base}. Reason: ${log.rejectionReason}` : base;
    }
    case 'UPDATE_USER_ROLE':       return `Role changed to ${log.role ?? 'unknown'}`;
    case 'UPDATE_USER_STATUS':     return `User account set to ${log.status ?? 'unknown'}`;
    case 'DELETE_USER':            return 'User account permanently deleted';
    case 'CREATE_USER':            return 'New user account created by admin';
    case 'UPDATE_USER_DATA':       return [log.name && `Name: ${log.name}`, log.email && `Email: ${log.email}`].filter(Boolean).join(', ') || 'User data updated';
    case 'NOTIFY_USER':            return log.message ? `Message sent: "${log.message}"` : 'Direct notification sent to user';
    case 'BROADCAST_NOTIFICATION': return log.message ? `Broadcast: "${log.message}"` : 'Broadcast notification sent';
    case 'UPDATE_REPORT_STATUS':   return `Report marked as ${log.status ?? 'unknown'}`;
    case 'UPDATE_ALERT_STATUS':    return `Alert status set to ${log.status ?? 'unknown'}`;
    case 'CREATE_LISTING':         return 'New listing created by admin';
    case 'CREATE_SCHEDULED_NOTIFICATION': return log.message ? `Scheduled: "${log.message}"` : 'Scheduled notification created';
    case 'CANCEL_SCHEDULED_NOTIFICATION': return 'Scheduled notification cancelled';
    default:                       return log.note || log.reason || 'No additional details';
  }
};

const getLogIcon = (action: string) => {
  if (action.includes('USER'))      return <UserIcon size={16} className="text-emerald-500" />;
  if (action.includes('LISTING'))   return <FileText size={16} className="text-blue-500" />;
  if (action.includes('BROADCAST')) return <Bell size={16} className="text-teal-500" />;
  if (action.includes('NOTIFY'))    return <Bell size={16} className="text-teal-500" />;
  if (action.includes('REPORT'))    return <AlertTriangle size={16} className="text-amber-500" />;
  if (action.includes('ALERT'))     return <ShieldAlert size={16} className="text-rose-500" />;
  if (action.includes('SCHEDULED')) return <Clock size={16} className="text-purple-500" />;
  return <Activity size={16} className="text-slate-400" />;
};

const getActionStyles = (action: string): string => {
  if (action === 'DELETE_USER' || action === 'UPDATE_USER_STATUS') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (action.includes('REPORT') || action.includes('ALERT'))       return 'bg-amber-50 text-amber-700 border-amber-100';
  if (action.includes('CREATE'))                                    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (action.includes('BROADCAST') || action.includes('NOTIFY'))   return 'bg-teal-50 text-teal-700 border-teal-100';
  if (action.includes('LISTING'))                                   return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-slate-50 text-slate-700 border-slate-100';
};

const getStripeColor = (action: string): string => {
  if (action === 'DELETE_USER' || action === 'UPDATE_USER_STATUS') return 'bg-rose-400';
  if (action.includes('REPORT') || action.includes('ALERT'))       return 'bg-amber-400';
  if (action.includes('CREATE'))                                    return 'bg-emerald-400';
  if (action.includes('BROADCAST') || action.includes('NOTIFY'))   return 'bg-teal-400';
  if (action.includes('LISTING'))                                   return 'bg-blue-400';
  return 'bg-slate-300';
};

const isCritical = (log: AuditLog): boolean =>
  log.action === 'DELETE_USER' ||
  (log.action === 'UPDATE_USER_STATUS' && (log.status === 'BANNED' || log.status === 'SUSPENDED')) ||
  (log.action === 'UPDATE_LISTING_STATUS' && (log.status === 'REMOVED' || log.status === 'REJECTED'));

const weekOverWeekChange = (logs: AuditLog[]): number => {
  const now = Date.now();
  const msDay = 86_400_000;
  const thisWeek = logs.filter(l => now - new Date(l.createdAt).getTime() < 7 * msDay).length;
  const lastWeek = logs.filter(l => {
    const age = now - new Date(l.createdAt).getTime();
    return age >= 7 * msDay && age < 14 * msDay;
  }).length;
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
};

const matchesCategory = (log: AuditLog, filter: string): boolean => {
  if (filter === 'ALL')        return true;
  if (filter === 'MODERATION') return log.action.includes('USER') || log.action.includes('LISTING') || log.action.includes('REPORT');
  if (filter === 'SYSTEM')     return log.action.includes('ALERT') || log.action.includes('SCHEDULED') || log.action.includes('SETTINGS') || log.action.includes('LOGIN');
  if (filter === 'BROADCAST')  return log.action.includes('BROADCAST') || log.action.includes('NOTIFY');
  return true;
};

const FILTERS = ['ALL', 'MODERATION', 'SYSTEM', 'BROADCAST'] as const;
const ADMIN_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500'];

const AuditLogsView: React.FC = () => {
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<string>('ALL');
  const [page, setPage]       = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => { setPage(1); }, [search, filter]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter(log => {
      const matchesSearch = !q ||
        (log.adminName ?? '').toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        getDescription(log).toLowerCase().includes(q) ||
        (log.targetId ?? '').toLowerCase().includes(q);
      return matchesSearch && matchesCategory(log, filter);
    });
  }, [logs, search, filter]);

  const visibleLogs  = filteredLogs.slice(0, page * PAGE_SIZE);
  const hasMore      = visibleLogs.length < filteredLogs.length;
  const criticalCount = useMemo(() => logs.filter(isCritical).length, [logs]);
  const uniqueAdmins  = useMemo(() => [...new Set(logs.map(l => l.adminId))], [logs]);
  const weekChange    = useMemo(() => weekOverWeekChange(logs), [logs]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-96 items-center justify-center gap-4">
        <ShieldAlert size={40} className="text-rose-400" />
        <p className="text-slate-600 font-semibold">{error}</p>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">System Audit Logs</h2>
          <p className="text-slate-500 mt-1">Complete record of administrative actions and decisions.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">{logs.length} total entries</span>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by admin, action, or detail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-slate-200 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="grid grid-cols-1 gap-4">
        {visibleLogs.map(log => (
          <div key={log.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-300 transition-all group shadow-sm hover:shadow-md">
            <div className="flex flex-col md:flex-row">
              <div className={`w-full md:w-2 ${getStripeColor(log.action)}`} />
              <div className="flex-1 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border flex-shrink-0 ${getActionStyles(log.action)}`}>
                      {getLogIcon(log.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight size={14} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 font-medium leading-relaxed">
                        {getDescription(log)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {(log.adminName ?? 'S').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{log.adminName || 'System'}</span>
                    </div>
                    {log.targetId && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Target: <span className="text-slate-600 font-mono">{log.targetId.slice(0, 12)}…</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <ShieldAlert size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">No log entries match your query.</p>
            <button
              onClick={() => { setSearch(''); setFilter('ALL'); }}
              className="mt-4 text-emerald-600 text-xs font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronDown size={16} /> Load more ({filteredLogs.length - visibleLogs.length} remaining)
          </button>
        )}
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Total Actions */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full" />
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Admin Actions</p>
          <p className="text-3xl font-black">{logs.length}</p>
          <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold w-fit px-2 py-1 rounded-full ${
            weekChange > 0 ? 'text-emerald-300 bg-emerald-500/10' :
            weekChange < 0 ? 'text-rose-300 bg-rose-500/10' :
            'text-slate-400 bg-slate-700'
          }`}>
            {weekChange > 0 ? <TrendingUp size={10} /> : weekChange < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
            {weekChange > 0 ? '+' : ''}{weekChange}% vs last week
          </div>
        </div>

        {/* Critical Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Actions</p>
          <p className="text-3xl font-black text-slate-800">{criticalCount}</p>
          <p className={`text-xs font-bold mt-4 flex items-center gap-1 ${criticalCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            <ShieldAlert size={14} /> {criticalCount > 0 ? 'Bans, removals & deletions' : 'No critical actions recorded'}
          </p>
        </div>

        {/* Unique Admins */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admin Nodes Active</p>
          <p className="text-3xl font-black text-slate-800">{uniqueAdmins.length}</p>
          <div className="flex -space-x-2 mt-4 ml-1">
            {uniqueAdmins.slice(0, 6).map((adminId, i) => {
              const adminLog = logs.find(l => l.adminId === adminId);
              const initial = (adminLog?.adminName ?? 'A').charAt(0).toUpperCase();
              return (
                <div
                  key={adminId}
                  title={adminLog?.adminName ?? adminId}
                  className={`w-7 h-7 rounded-full border-2 border-white ${ADMIN_COLORS[i % ADMIN_COLORS.length]} flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {initial}
                </div>
              );
            })}
            {uniqueAdmins.length > 6 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-600">
                +{uniqueAdmins.length - 6}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;
