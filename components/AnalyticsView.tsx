import React, { useState, useEffect } from 'react';
import { AnalyticsData, Timeframe, Category } from '../types';
import { api } from '../services/api';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
    ComposedChart
} from 'recharts';
import { TrendingUp, ShieldAlert, BarChart3, Filter, Clock, Loader2, Calendar, Target, Zap, Users2, Activity } from 'lucide-react';

const AnalyticsView: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<Timeframe>('30D');

    const fetchAnalytics = async (tf: Timeframe) => {
        setLoading(true);
        try {
            const analytics = await api.getAnalytics(tf);
            setData(analytics);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(timeframe);
    }, [timeframe]);

    if (loading || !data) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Intelligence</h2>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Target size={14} className="text-emerald-500" />
                        Monitoring behavioral patterns and conversion velocity.
                    </p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {(['TODAY', '7D', '30D', 'CUSTOM'] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === tf
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Retention Monitoring (Actionable: Is our userbase sticky?) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users2 size={20} className="text-emerald-500" />
                            User Retention Cycle
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New vs Returning</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.retention}>
                                <defs>
                                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="returningUsers" stackId="1" stroke="#10b981" fill="url(#colorReturning)" strokeWidth={3} />
                                <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#6366f1" fill="url(#colorNew)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-4">
                        <Zap size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            **Monitoring Insight**: Returning user activity accounts for 68% of sessions. Stickiness is increasing (+4% WOW).
                        </p>
                    </div>
                </div>

                {/* 2. Fraud Rate Trend (Actionable: Is our AI working?) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={20} className="text-rose-500" />
                            Fraud Suppression Trend
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flagged (%)</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.fraudRate}>
                                <defs>
                                    <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="rate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFraud)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-4">
                        <ShieldAlert size={16} className="text-rose-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-900 leading-relaxed font-medium">
                            **Intervention Required**: Spike detected on Nov 3. Correlates with "Electronics" bulk uploads. Recommend tightening heuristics.
                        </p>
                    </div>
                </div>

                {/* 3. Revenue Contribution (Actionable: Where is the money?) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={20} className="text-emerald-500" />
                            Revenue Contribution
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KSH per Category</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.revenueByCategory} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="category"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                    {(data.revenueByCategory || []).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-4">
                        <TrendingUp size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            **Economic Signal**: "Textbooks" dominate revenue (42%). Electronics transaction volume is high but average order value is lower than Furniture.
                        </p>
                    </div>
                </div>

                {/* 4. Conversion Funnel (Actionable: Friction points?) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Filter size={20} className="text-blue-500" />
                            Marketplace Velocity
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing to Sale Funnel</span>
                    </div>
                    <div className="space-y-4 flex-1">
                        {data.funnel.map((step, idx) => (
                            <div key={idx} className="relative group">
                                <div className="flex items-center justify-between mb-1.5 px-1">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{step.stage}</span>
                                    <span className="text-xs font-bold text-slate-400">{step.count.toLocaleString()}</span>
                                </div>
                                <div className="h-8 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 relative shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-out flex items-center justify-end px-3 relative z-10"
                                        style={{ width: `${step.percentage}%`, opacity: 1 - (idx * 0.15) }}
                                    >
                                        <span className="text-white text-[10px] font-bold">{step.percentage}%</span>
                                    </div>
                                    <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4">
                        <Activity size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            **Flow Analysis**: Significant dropout (46%) between Cart and Checkout. Potential Friction in Payment Gateway or Shipping calculation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
