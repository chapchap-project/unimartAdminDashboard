import React, { useState, useEffect } from 'react';
import { DashboardMetrics, PriorityAlert, FraudQueueItem, ViewState } from '../types';
import { Users, DollarSign, ShoppingBag, AlertTriangle, Sparkles, Loader2, ArrowUpRight, ArrowDownRight, X, ShieldAlert, ChevronRight, MessageSquare, ExternalLink, Flag, MoreVertical, Clock, ArrowUpCircle, CheckCircle2, History, RefreshCw, Settings } from 'lucide-react';
import { getDashboardInsights } from '../services/aiService';
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

  const runInsight = async (m: DashboardMetrics) => {
    setLoadingInsight(true);
    try {
      const summary = `Users: ${m.users}, Revenue: KSH ${m.totalRevenue}, Reports: ${m.openReports}, Flagged: ${m.flaggedListings}`;
      const result = await getDashboardInsights(m, summary);
      setInsight(result);
    } catch (err) {
      console.error('Failed to generate AI insight', err);
      setInsight('__ERROR__');
    } finally {
      setLoadingInsight(false);
    }
  };

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
      setLoading(false); // Reveal UI as soon as raw data is ready

      // Run AI insights in background
      if (m && !insight) {
        runInsight(m);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
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
          <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={40} />
          <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">
            {loading ? "Synchronizing Intelligence..." : "Establishing Secure Connection..."}
          </p>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Users', value: metrics.users.toLocaleString(), delta: metrics.deltas.users, icon: Users, color: 'emerald', view: 'USERS' as ViewState },
    { title: 'Active Listings', value: metrics.activeListings.toLocaleString(), delta: metrics.deltas.activeListings, icon: ShoppingBag, color: 'blue', view: 'LISTINGS' as ViewState },
    { title: 'Revenue (7d)', value: `KSH ${metrics.totalRevenue.toLocaleString()}`, delta: metrics.deltas.revenue, icon: DollarSign, color: 'emerald', view: 'TRANSACTIONS' as ViewState },
    { title: 'Open Reports', value: metrics.openReports, delta: metrics.deltas.openReports, icon: MessageSquare, color: 'amber', view: 'REPORTS' as ViewState, inverseDelta: true },
    { title: 'Flagged Listings', value: metrics.flaggedListings, delta: metrics.deltas.flaggedListings, icon: Flag, color: 'rose', view: 'LISTINGS' as ViewState, inverseDelta: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-500">Live</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi, idx) => {
          const isPositive = kpi.inverseDelta ? kpi.delta < 0 : kpi.delta > 0;
          return (
            <button
              key={idx}
              onClick={() => setView(kpi.view)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-1.5 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                  <kpi.icon size={16} />
                </div>
                <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {kpi.delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(kpi.delta)}%
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">{kpi.title}</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5 leading-tight">{kpi.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1">vs last 30 days</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Alerts & AI Summary */}
        <div className="lg:col-span-7 space-y-8">
          {/* Active Alerts */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-amber-500" />
                <h4 className="text-sm font-bold text-slate-800">Active Alerts</h4>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              {alerts.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 size={32} className="text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No active alerts</p>
                  <p className="text-xs text-slate-300 mt-1">The platform is running normally.</p>
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
                      <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{alert.message}</p>

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
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">Updates automatically every 30 seconds</p>
              </div>
            )}
          </section>

          {/* AI Summary */}
          <section className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">AI Summary</h4>
                  {!loadingInsight && insight && insight !== '__NO_KEY__' && insight !== '__ERROR__' && (
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {metrics && !loadingInsight && insight !== '__NO_KEY__' && (
                    <button
                      onClick={() => runInsight(metrics)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                </div>
              </div>

              {loadingInsight ? (
                <div className="space-y-4 py-4">
                  <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-2/3 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                </div>
              ) : insight === '__NO_KEY__' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Sparkles size={22} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">AI insights not configured</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Add your OpenRouter API key in Settings to enable executive summaries and listing safety analysis.
                    </p>
                  </div>
                  <button
                    onClick={() => setView('SETTINGS')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                  >
                    <Settings size={13} /> Open Settings
                  </button>
                </div>
              ) : insight === '__ERROR__' ? (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                  <p className="text-sm font-semibold text-rose-400">Failed to generate insights</p>
                  <p className="text-xs text-slate-500">Check your API key and model in Settings, then try again.</p>
                  {metrics && (
                    <button
                      onClick={() => runInsight(metrics)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                    >
                      <RefreshCw size={13} /> Retry
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {insight || 'Awaiting intelligence processing…'}
                    </ReactMarkdown>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Based on current platform metrics, fraud signals, and transaction data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Fraud Queue */}
        <div className="lg:col-span-5">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-rose-500" />
                <h4 className="text-sm font-bold text-slate-800">Fraud Queue</h4>
              </div>
              <button
                onClick={() => setView('LISTINGS', { fraudOnly: true })}
                className="text-xs font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700"
              >
                View all <ChevronRight size={13} />
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

            {fraudQueue.length === 0 && (
              <div className="py-10 text-center text-slate-400">
                <ShieldAlert size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No items in fraud queue</p>
              </div>
            )}
            <div className="px-5 py-3 bg-rose-50/40 border-t border-rose-100/50 mt-auto">
              <p className="text-xs text-rose-500 font-medium">
                {fraudQueue.length > 0 ? `${fraudQueue.length} items flagged for review` : 'Queue is clear'}
              </p>
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
                <Clock size={20} className="text-emerald-500" />
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
                <History size={18} className="text-slate-300 group-hover:text-emerald-500" />
              </button>
              <button
                onClick={() => handleAlertAction(snoozeModalId, 'SNOOZED', 4)}
                className="w-full flex items-center justify-between group p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700"
              >
                <span>4 Hours</span>
                <History size={18} className="text-slate-300 group-hover:text-emerald-500" />
              </button>
              <button
                onClick={() => handleAlertAction(snoozeModalId, 'SNOOZED', 24)}
                className="w-full flex items-center justify-between group p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700"
              >
                <span>24 Hours (Next Day)</span>
                <History size={18} className="text-slate-300 group-hover:text-emerald-500" />
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
