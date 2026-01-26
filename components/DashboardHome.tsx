import React, { useState, useEffect } from 'react';
import { DashboardMetrics, PriorityAlert, FraudQueueItem, ViewState } from '../types';
import { Users, DollarSign, ShoppingBag, AlertTriangle, Sparkles, Loader2, ArrowUpRight, ArrowDownRight, X, ShieldAlert, ChevronRight, MessageSquare, ExternalLink, Flag, MoreVertical, Clock, ArrowUpCircle, CheckCircle2, History } from 'lucide-react';
import { getDashboardInsights } from '../services/geminiService';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DashboardHomeProps {
  setView: (view: ViewState, params?: { targetId?: string, fraudOnly?: boolean }) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ setView }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [fraudQueue, setFraudQueue] = useState<FraudQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [snoozeModalId, setSnoozeModalId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [m, a, f] = await Promise.all([
        api.getDashboardMetrics(),
        api.getPriorityAlerts(),
        api.getFraudQueue()
      ]);
      setMetrics(m);
      setAlerts(a);
      setFraudQueue(f);

      if (m && !insight) {
        setLoadingInsight(true);
        const summary = `Users: ${m.users}, Revenue: KSH ${m.totalRevenue}, Reports: ${m.openReports}, Flagged: ${m.flaggedListings}`;
        const result = await getDashboardInsights(m, summary);
        setInsight(result);
        setLoadingInsight(false);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll for alerts every 30s to catch real-time simulations
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAlertAction = async (id: string, status: PriorityAlert['status'], duration?: number) => {
    let snoozedUntil;
    if (duration) {
      snoozedUntil = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
    }
    await api.updateAlertStatus(id, status, snoozedUntil);
    setSnoozeModalId(null);
    fetchDashboardData(); // Refresh list
  };

  if (loading || !metrics) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={40} />
          <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Intelligence...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Users', value: metrics.users.toLocaleString(), delta: metrics.deltas.users, icon: Users, color: 'indigo', view: 'USERS' as ViewState },
    { title: 'Active Listings', value: metrics.activeListings.toLocaleString(), delta: metrics.deltas.activeListings, icon: ShoppingBag, color: 'blue', view: 'LISTINGS' as ViewState },
    { title: 'Revenue (7d)', value: `KSH ${metrics.totalRevenue.toLocaleString()}`, delta: metrics.deltas.revenue, icon: DollarSign, color: 'emerald', view: 'TRANSACTIONS' as ViewState },
    { title: 'Open Reports', value: metrics.openReports, delta: metrics.deltas.openReports, icon: MessageSquare, color: 'amber', view: 'REPORTS' as ViewState, inverseDelta: true },
    { title: 'Flagged Listings', value: metrics.flaggedListings, delta: metrics.deltas.flaggedListings, icon: Flag, color: 'rose', view: 'LISTINGS' as ViewState, inverseDelta: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Command Center
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded uppercase tracking-widest">v2.0 PROACTIVE</span>
          </h2>
          <p className="text-slate-500 font-medium">Platform Surveillance & Situational Intelligence</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Monitoring Active</span>
        </div>
      </div>

      {/* Section A: KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <button
            key={idx}
            onClick={() => setView(kpi.view)}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all text-left group relative overflow-hidden"
          >
            <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600 w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">{kpi.value}</h3>

            <div className={`mt-3 flex items-center gap-1 text-[10px] font-bold ${(kpi.inverseDelta ? kpi.delta < 0 : kpi.delta > 0) ? 'text-emerald-600' : 'text-rose-600'
              }`}>
              {kpi.delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(kpi.delta)}%
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Alerts & AI Summary */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section B: Proactive Priority Alerts Panel */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Surveillance Feed</h4>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Real-time Intervention Required</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{alerts.length} Active</span>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 size={40} className="text-emerald-200 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ecosystem Status Healthy</p>
                  <p className="text-[10px] text-slate-300 mt-1">No critical intervention signals at this time.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-6 flex items-start gap-5 hover:bg-slate-50/50 transition-all group relative border-l-4 ${alert.status === 'ESCALATED' ? 'border-rose-600 bg-rose-50/20' :
                    alert.severity === 'CRITICAL' ? 'border-rose-400' :
                      alert.severity === 'WARNING' ? 'border-amber-400' : 'border-blue-400'
                    }`}>
                    <div className={`mt-1 p-2 rounded-xl shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-500' :
                      alert.severity === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                      {alert.type === 'FRAUD' && <ShieldAlert size={18} />}
                      {alert.type === 'SPIKE' && <Activity size={18} />}
                      {alert.type === 'PAYMENT' && <DollarSign size={18} />}
                      {alert.type === 'REPORT' && <MessageSquare size={18} />}
                      {alert.type === 'SYSTEM' && <AlertTriangle size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${alert.status === 'ESCALATED' ? 'bg-rose-600 text-white animate-pulse' :
                            alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                              alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {alert.status === 'ESCALATED' ? 'ESCALATED' : alert.severity}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{alert.message}</p>

                      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                        {alert.actionLabel && (
                          <button
                            onClick={() => alert.actionView && setView(alert.actionView, { targetId: alert.targetId })}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
                          >
                            {alert.actionLabel}
                          </button>
                        )}
                        <button
                          onClick={() => handleAlertAction(alert.id, 'DISMISSED')}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Dismiss
                        </button>
                        <button
                          onClick={() => setSnoozeModalId(alert.id)}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-1"
                        >
                          <History size={12} /> Snooze
                        </button>
                        {alert.status !== 'ESCALATED' && (
                          <button
                            onClick={() => handleAlertAction(alert.id, 'ESCALATED')}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-1 ml-auto"
                          >
                            <ArrowUpCircle size={12} /> Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {alerts.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Intervention stream synced to real-time events</p>
              </div>
            )}
          </section>

          {/* Section D: AI Executive Summary */}
          <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  AI Executive Intelligence Summary
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                </h4>
                <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {loadingInsight ? (
                <div className="space-y-4 py-4">
                  <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
                  <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {insight || "Awaiting intelligence processing..."}
                    </ReactMarkdown>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                      <Activity size={20} />
                    </div>
                    <p className="text-xs text-indigo-100/60 leading-relaxed font-medium">
                      Insight derived from multi-vector analysis of platform metrics, fraud signals, and transaction velocity.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Fraud Queue Snapshot */}
        <div className="lg:col-span-5">
          {/* Section C: Fraud Queue Snapshot */}
          <section className="bg-white rounded-3xl border border-indigo-50 shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-indigo-50/50">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert size={14} className="text-rose-500" />
                Fraud Queue Snapshot
              </h4>
              <button
                onClick={() => setView('LISTINGS', { fraudOnly: true })}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                View Full Queue <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fraudQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate w-48">{item.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black border tracking-tighter w-fit ${item.riskScore >= 8 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          item.riskScore >= 6 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                          {item.riskScore.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setView('LISTINGS', { targetId: item.id })}
                          className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-rose-50/30 border-t border-rose-100/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-0.5">Tactical Awareness</p>
                  <p className="text-xs text-rose-600/70 font-medium leading-tight">These items represent active risk vectors detected in the current session.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Snooze Options Modal */}
      {snoozeModalId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-800 font-bold">
                <Clock size={20} className="text-indigo-500" />
                <span>Snooze Alert</span>
              </div>
              <button onClick={() => setSnoozeModalId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-widest text-[10px]">Select recurrence silence duration</p>
              <button
                onClick={() => handleAlertAction(snoozeModalId, 'SNOOZED', 1)}
                className="w-full flex items-center justify-between group p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700"
              >
                <span>1 Hour</span>
                <History size={18} className="text-slate-300 group-hover:text-indigo-500" />
              </button>
              <button
                onClick={() => handleAlertAction(snoozeModalId, 'SNOOZED', 4)}
                className="w-full flex items-center justify-between group p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700"
              >
                <span>4 Hours</span>
                <History size={18} className="text-slate-300 group-hover:text-indigo-500" />
              </button>
              <button
                onClick={() => handleAlertAction(snoozeModalId, 'SNOOZED', 24)}
                className="w-full flex items-center justify-between group p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700"
              >
                <span>24 Hours (Next Day)</span>
                <History size={18} className="text-slate-300 group-hover:text-indigo-500" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setSnoozeModalId(null)}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-white/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Activity = ({ size, className }: { size: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default DashboardHome;
