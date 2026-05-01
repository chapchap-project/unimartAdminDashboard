import React, { useState, useEffect } from 'react';
import { AnalyticsData, Timeframe } from '../types';
import { api } from '../services/api';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
    ReferenceLine, LabelList,
} from 'recharts';
import { TrendingUp, ShieldAlert, BarChart3, Filter, Loader2, Target, Zap, Users2, Activity } from 'lucide-react';

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const fmtDate = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtKSH = (v: number) =>
    v >= 1_000_000 ? `KSH ${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000 ? `KSH ${(v / 1_000).toFixed(0)}k`
    : `KSH ${v}`;

interface PayloadEntry {
    color: string;
    name: string;
    dataKey: string;
    value: number;
}

const ChartTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: PayloadEntry[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;

    const fmt = ({ dataKey, value }: PayloadEntry) => {
        if (['rate', 'read_rate', 'readRate'].includes(dataKey)) return `${value}%`;
        if (dataKey === 'revenue') return fmtKSH(value);
        return value.toLocaleString();
    };

    return (
        <div className="bg-slate-900 rounded-xl px-4 py-3 shadow-2xl border border-slate-700/50">
            {label && (
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    {fmtDate(label)}
                </p>
            )}
            {payload.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-slate-400">{e.name}:</span>
                    <span className="text-white font-bold">{fmt(e)}</span>
                </div>
            ))}
        </div>
    );
};

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
            console.error('Failed to fetch analytics', error);
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

    const avgFraud = data.fraudRate.length
        ? +(data.fraudRate.reduce((s, d) => s + d.rate, 0) / data.fraudRate.length).toFixed(1)
        : 0;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Intelligence</h2>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                        <Target size={14} className="text-emerald-500" />
                        Monitoring behavioral patterns and conversion velocity.
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {(['TODAY', '7D', '30D', 'CUSTOM'] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                timeframe === tf
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
                {/* 1. User Retention */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Users2 size={18} className="text-emerald-500" />
                            User Retention Cycle
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New vs Returning</span>
                    </div>

                    <div className="h-72 w-full mt-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.retention} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="gradReturning" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={fmtDate}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11, paddingTop: 10, color: '#64748b' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="returningUsers"
                                    name="Returning"
                                    stackId="1"
                                    stroke="#10b981"
                                    fill="url(#gradReturning)"
                                    strokeWidth={2.5}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="newUsers"
                                    name="New Users"
                                    stackId="1"
                                    stroke="#6366f1"
                                    fill="url(#gradNew)"
                                    strokeWidth={2.5}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                        <Zap size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            Returning user activity accounts for 68% of sessions. Stickiness is increasing (+4% WOW).
                        </p>
                    </div>
                </div>

                {/* 2. Fraud Suppression */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-rose-500" />
                            Fraud Suppression Trend
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flagged Rate (%)</span>
                    </div>

                    <div className="h-72 w-full mt-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.fraudRate} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={fmtDate}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    unit="%"
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <ReferenceLine
                                    y={avgFraud}
                                    stroke="#94a3b8"
                                    strokeDasharray="5 4"
                                    label={{
                                        value: `Avg ${avgFraud}%`,
                                        position: 'insideTopRight',
                                        fill: '#94a3b8',
                                        fontSize: 10,
                                        fontWeight: 600,
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="rate"
                                    name="Fraud Rate"
                                    stroke="#f43f5e"
                                    fill="url(#gradFraud)"
                                    strokeWidth={2.5}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-5 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                        <ShieldAlert size={15} className="text-rose-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-900 leading-relaxed font-medium">
                            Spike detected on Nov 3. Correlates with "Electronics" bulk uploads. Recommend tightening heuristics.
                        </p>
                    </div>
                </div>

                {/* 3. Revenue Contribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-emerald-500" />
                            Revenue Contribution
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KSH per Category</span>
                    </div>

                    <div className="h-72 w-full mt-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.revenueByCategory}
                                layout="vertical"
                                margin={{ top: 4, right: 90, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                />
                                <YAxis
                                    dataKey="category"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={90}
                                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={<ChartTooltip />}
                                />
                                <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]}>
                                    {(data.revenueByCategory ?? []).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="revenue"
                                        position="right"
                                        formatter={(v: number) => fmtKSH(v)}
                                        style={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                        <TrendingUp size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            "Textbooks" dominate revenue (42%). Electronics volume is high but average order value is lower than Furniture.
                        </p>
                    </div>
                </div>

                {/* 4. Marketplace Velocity (Funnel) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Filter size={18} className="text-blue-500" />
                            Marketplace Velocity
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing to Sale</span>
                    </div>

                    <div className="space-y-3 flex-1 mt-5">
                        {data.funnel.map((step, idx) => {
                            const prevPct = idx > 0 ? data.funnel[idx - 1].percentage : 100;
                            const dropOff = idx > 0 ? (prevPct - step.percentage).toFixed(0) : null;
                            return (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                                                {step.stage}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {dropOff && (
                                                <span className="text-[10px] font-semibold text-rose-400">▼ {dropOff}%</span>
                                            )}
                                            <span className="text-xs font-bold text-slate-400">
                                                {step.count.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-7 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 shadow-inner">
                                        <div
                                            className="h-full flex items-center justify-end px-3 transition-all duration-1000 ease-out rounded-lg"
                                            style={{
                                                width: `${step.percentage}%`,
                                                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                                                opacity: Math.max(0.4, 0.9 - idx * 0.12),
                                            }}
                                        >
                                            <span className="text-white text-[10px] font-black">{step.percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <Activity size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            Significant dropout (46%) between Cart and Checkout. Potential friction in Payment Gateway or Shipping calculation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
