import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { Shield, Clock, User as UserIcon, FileText, AlertTriangle, Loader2, Search, Filter, ArrowRight, Activity, Trash2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getLogIcon = (action: string) => {
    if (action.includes('USER')) return <UserIcon size={16} className="text-emerald-500" />;
    if (action.includes('LISTING')) return <FileText size={16} className="text-emerald-500" />;
    if (action.includes('SYSTEM') || action.includes('SETTINGS')) return <Activity size={16} className="text-amber-500" />;
    if (action.includes('CREATE_BROADCAST')) return <Shield size={16} className="text-teal-500" />;
    return <Clock size={16} className="text-slate-400" />;
  };

  const getActionStyles = (action: string) => {
    if (action.includes('SUSPEND') || action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (action.includes('RESTRICT') || action.includes('WARN')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.adminName?.toLowerCase().includes(search.toLowerCase()) ||
      (log.note || log.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' ||
      (filter === 'MODERATION' && (log.action.includes('USER') || log.action.includes('LISTING'))) ||
      (filter === 'SYSTEM' && (log.action.includes('SETTINGS') || log.action.includes('LOGIN'))) ||
      (filter === 'BROADCAST' && log.action.includes('BROADCAST'));
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">System Audit logs</h2>
          <p className="text-slate-500 mt-1">Real-time surveillance of administrative intelligence and decision history.</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Surveillance Active</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {['ALL', 'MODERATION', 'SYSTEM', 'BROADCAST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Query logs (Admin, Reason, Action)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-slate-200 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-300 transition-all group shadow-sm hover:shadow-md">
            <div className="flex flex-col md:flex-row">
              {/* Left Stripe - Action Indicator */}
              <div className={`w-full md:w-2 ${getActionStyles(log.action).split(' ')[0]}`}></div>

              <div className="flex-1 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${getActionStyles(log.action)}`}>
                      {getLogIcon(log.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight size={14} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 font-medium leading-relaxed">
                        {log.note || log.reason || 'No additional details provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {log.adminName?.charAt(0) || 'S'}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{log.adminName || 'System'}</span>
                    </div>
                    {log.targetId && (
                      <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                        Entity: <span className="text-slate-600 font-mono">{log.targetId}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Menu (Internal view) */}
              <div className="md:w-16 border-l border-slate-50 flex md:flex-col items-center justify-center p-2 bg-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Trace Action">
                  <Activity size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <ShieldAlert size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">No surveillance data matches your query.</p>
            <button onClick={() => { setSearch(''); setFilter('ALL'); }} className="mt-4 text-emerald-600 text-xs font-bold hover:underline">Clear all filters</button>
          </div>
        )}
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full"></div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Admin Actions</p>
          <p className="text-3xl font-black">{logs.length}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 w-fit px-2 py-1 rounded-full">
            <Activity size={10} /> +12% from last week
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Moderation</p>
          <p className="text-3xl font-black text-slate-800">{logs.filter(l => l.action.includes('SUSPEND') || l.action.includes('DELETE')).length}</p>
          <p className="text-xs text-rose-500 font-bold mt-4 flex items-center gap-1">
            <ShieldAlert size={14} /> Elevated Risk Level
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Admin Nodes</p>
          <p className="text-3xl font-black text-slate-800">4</p>
          <div className="flex -space-x-2 mt-4 ml-1">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=${i}`} alt="" /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;