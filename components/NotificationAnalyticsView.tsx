import React, { useState, useEffect } from 'react';
import {
    ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Eye, Send, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AnalyticsData {
    period: string;
    totalSent: number;
    totalRead: number;
    readRate: number;
    notificationsByType: Array<{
        type: string;
        sent: number;
        read: number;
        readRate: number;
    }>;
    dailyStats: Array<{
        date: string;
        sent: number;
        read: number;
        read_rate: number;
    }>;
    readTimeStats: {
        avg_read_hours: number;
        min_read_hours: number;
        max_read_hours: number;
    };
    oldUnreadCount: number;
    summary: {
        period: string;
        totalNotifications: number;
        readRate: string;
        avgReadTime: string;
        oldUnreadAlerts: number;
    };
}

const fmtDate = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtType = (t: string) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
        if (['read_rate', 'readRate'].includes(dataKey)) return `${value}%`;
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

const TYPE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];

const StatCard = ({
    icon: Icon,
    label,
    value,
    iconColor,
    bgColor,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    iconColor: string;
    bgColor: string;
}) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={iconColor} />
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 leading-tight mt-0.5">{value}</p>
        </div>
    </div>
);

const NotificationAnalyticsView: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [selectedType, setSelectedType] = useState<string>('');

    useEffect(() => {
        loadAnalytics();
    }, [period, selectedType]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await api.getNotificationAnalytics(period, selectedType || undefined);
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-96 text-slate-400">
                <div className="text-center">
                    <BarChart3 className="w-14 h-14 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Unable to load analytics data</p>
                </div>
            </div>
        );
    }

    const readRatePct = analytics.readRate ?? 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Notification Analytics</h2>
                    <p className="text-slate-500 mt-1 text-sm">
                        Delivery performance, engagement rates, and read-time distribution.
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {(['7d', '30d', '90d'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                period === p
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Send}
                    label="Total Sent"
                    value={analytics.totalSent.toLocaleString()}
                    iconColor="text-indigo-500"
                    bgColor="bg-indigo-50"
                />
                <StatCard
                    icon={Eye}
                    label="Total Read"
                    value={analytics.totalRead.toLocaleString()}
                    iconColor="text-emerald-500"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Read Rate"
                    value={`${readRatePct}%`}
                    iconColor="text-violet-500"
                    bgColor="bg-violet-50"
                />
                <StatCard
                    icon={Clock}
                    label="Avg Read Time"
                    value={analytics.summary.avgReadTime}
                    iconColor="text-amber-500"
                    bgColor="bg-amber-50"
                />
            </div>

            {/* Alert */}
            {analytics.oldUnreadCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">
                            {analytics.oldUnreadCount} notifications unread for more than 7 days
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Consider following up with users who haven't read older notifications.
                        </p>
                    </div>
                </div>
            )}

            {/* Daily Performance Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-slate-800">Daily Performance</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                            Sent
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                            Read
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-5 border-t-2 border-dashed border-amber-400 inline-block" />
                            Read Rate
                        </span>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analytics.dailyStats} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
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
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                unit="%"
                                domain={[0, 100]}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar
                                yAxisId="left"
                                dataKey="sent"
                                name="Sent"
                                fill="#6366f1"
                                fillOpacity={0.85}
                                radius={[3, 3, 0, 0]}
                                maxBarSize={20}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="read"
                                name="Read"
                                fill="#10b981"
                                fillOpacity={0.85}
                                radius={[3, 3, 0, 0]}
                                maxBarSize={20}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="read_rate"
                                name="Read Rate"
                                stroke="#f59e0b"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                strokeDasharray="6 3"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Performance by Type */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-slate-800">Performance by Type</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent vs Read</span>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={analytics.notificationsByType}
                            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="type"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={fmtType}
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
                            <Bar
                                dataKey="sent"
                                name="Sent"
                                fill="#6366f1"
                                fillOpacity={0.85}
                                radius={[3, 3, 0, 0]}
                                maxBarSize={28}
                            >
                                {analytics.notificationsByType.map((_, i) => (
                                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} fillOpacity={0.3} />
                                ))}
                            </Bar>
                            <Bar
                                dataKey="read"
                                name="Read"
                                fill="#10b981"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={28}
                            >
                                {analytics.notificationsByType.map((_, i) => (
                                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Read Rate badges per type */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {analytics.notificationsByType.map((t, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
                            style={{
                                borderColor: `${TYPE_COLORS[i % TYPE_COLORS.length]}40`,
                                backgroundColor: `${TYPE_COLORS[i % TYPE_COLORS.length]}10`,
                                color: TYPE_COLORS[i % TYPE_COLORS.length],
                            }}
                        >
                            <span className="capitalize">{fmtType(t.type)}</span>
                            <span className="opacity-60">·</span>
                            <span>{t.readRate}% read</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Read Time Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-6">Read Time Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Average</p>
                        <p className="text-3xl font-black text-indigo-700">
                            {analytics.readTimeStats.avg_read_hours
                                ? `${Math.round(analytics.readTimeStats.avg_read_hours * 10) / 10}h`
                                : '—'}
                        </p>
                        <p className="text-xs text-indigo-400 mt-1">after delivery</p>
                    </div>
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Fastest</p>
                        <p className="text-3xl font-black text-emerald-700">
                            {analytics.readTimeStats.min_read_hours
                                ? `${Math.round(analytics.readTimeStats.min_read_hours * 10) / 10}h`
                                : '—'}
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">fastest engagement</p>
                    </div>
                    <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 text-center">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Slowest</p>
                        <p className="text-3xl font-black text-amber-700">
                            {analytics.readTimeStats.max_read_hours
                                ? `${Math.round(analytics.readTimeStats.max_read_hours * 10) / 10}h`
                                : '—'}
                        </p>
                        <p className="text-xs text-amber-400 mt-1">slowest engagement</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationAnalyticsView;
