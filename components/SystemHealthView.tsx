import React, { useState, useEffect } from 'react';
import { SystemHealth, SystemStatus } from '../types';
import { api } from '../services/api';
import {
    Activity,
    Server,
    CreditCard,
    Zap,
    Mail,
    Clock,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    Cpu,
    Database
} from 'lucide-react';

const SystemHealthView: React.FC = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHealth = async () => {
        setRefreshing(true);
        try {
            const data = await api.getSystemHealth();
            setHealth(data);
        } catch (error) {
            console.error("Failed to fetch system health", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading || !health) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    const getStatusColor = (status: SystemStatus) => {
        switch (status) {
            case SystemStatus.OPERATIONAL: return 'text-emerald-500';
            case SystemStatus.DEGRADED: return 'text-amber-500';
            case SystemStatus.DOWN: return 'text-rose-500';
            default: return 'text-slate-400';
        }
    };

    const getStatusBg = (status: SystemStatus) => {
        switch (status) {
            case SystemStatus.OPERATIONAL: return 'bg-emerald-50 border-emerald-100';
            case SystemStatus.DEGRADED: return 'bg-amber-50 border-amber-100';
            case SystemStatus.DOWN: return 'bg-rose-50 border-rose-100';
            default: return 'bg-slate-50 border-slate-100';
        }
    };

    const getStatusIcon = (status: SystemStatus) => {
        switch (status) {
            case SystemStatus.OPERATIONAL: return <CheckCircle2 size={18} className="text-emerald-500" />;
            case SystemStatus.DEGRADED: return <AlertCircle size={18} className="text-amber-500" />;
            case SystemStatus.DOWN: return <XCircle size={18} className="text-rose-500" />;
            default: return <Clock size={18} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Health</h2>
                    <p className="text-slate-500 mt-1">Real-time status of Unimarket infrastructure and third-party services.</p>
                </div>
                <button
                    onClick={fetchHealth}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition-all text-sm font-bold disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Checking...' : 'Check Now'}
                </button>
            </div>

            {/* Global Status Banner */}
            <div className={`p-6 rounded-2xl border flex items-center gap-4 ${getStatusBg(health.apiStatus)}`}>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                    {getStatusIcon(health.apiStatus)}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        {health.apiStatus === SystemStatus.OPERATIONAL ? 'All Systems Operational' : 'Some Systems Experiencing Issues'}
                    </h3>
                    <p className="text-sm text-slate-500">Last scanned: {new Date(health.lastCheck).toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Health Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthCard
                    title="API Interface"
                    status={health.apiStatus}
                    uptime={health.apiUptime}
                    metrics={`${health.apiLatency}ms latency`}
                    icon={Server}
                />
                <HealthCard
                    title="Payment Gateway"
                    status={health.paymentProviderStatus}
                    uptime={health.paymentProviderUptime}
                    metrics="Integrated via Stripe"
                    icon={CreditCard}
                />
                <HealthCard
                    title="Background Jobs"
                    status={health.backgroundJobsStatus}
                    uptime={health.backgroundJobsUptime}
                    metrics="Queue: 42 pending"
                    icon={Zap}
                />
                <HealthCard
                    title="Communication"
                    status={health.deliveryStatus}
                    uptime={health.deliveryUptime}
                    metrics="Email & SMS Delivery"
                    icon={Mail}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Metrics */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-emerald-500" />
                        Node.js Cluster Performance
                    </h3>

                    <div className="space-y-8">
                        <PerformanceBar
                            label="CPU Load"
                            value={health.cpuUsage}
                            icon={Cpu}
                            unit="%"
                            color="emerald"
                        />
                        <PerformanceBar
                            label="Memory Usage"
                            value={health.memoryUsage}
                            icon={Database}
                            unit="%"
                            color="teal"
                        />
                    </div>

                    <div className="mt-10 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex items-start gap-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Clock size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Health Monitoring</p>
                            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                Metrics are collected every 30 seconds from all active nodes. Historical data is available in the infrastructure monitoring tool (Grafana).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Region Status */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Service Regions</h3>
                    <div className="space-y-4">
                        <RegionItem name="Africa (Nairobi)" status={SystemStatus.OPERATIONAL} />
                        <RegionItem name="Europe (Frankfurt)" status={SystemStatus.OPERATIONAL} />
                        <RegionItem name="US East (N. Virginia)" status={SystemStatus.OPERATIONAL} />
                        <RegionItem name="Asia (Singapore)" status={SystemStatus.DEGRADED} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const HealthCard: React.FC<{
    title: string;
    status: SystemStatus;
    uptime: string;
    metrics: string;
    icon: React.ElementType;
}> = ({ title, status, uptime, metrics, icon: Icon }) => {
    const getStatusColor = (s: SystemStatus) => {
        switch (s) {
            case SystemStatus.OPERATIONAL: return 'text-emerald-500';
            case SystemStatus.DEGRADED: return 'text-amber-500';
            case SystemStatus.DOWN: return 'text-rose-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Icon size={20} />
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-opacity-10 ${getStatusColor(status).replace('text', 'bg')} ${getStatusColor(status)} ${getStatusColor(status).replace('text', 'border').replace('500', '100')}`}>
                    {status}
                </div>
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
            <div className="mt-4 flex items-end justify-between">
                <div>
                    <p className="text-xl font-bold text-slate-800 tracking-tight">{uptime}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Uptime (30d)</p>
                </div>
                <p className="text-xs text-slate-500 font-medium">{metrics}</p>
            </div>
        </div>
    );
};

const PerformanceBar: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    unit: string;
    color: 'emerald' | 'teal'
}> = ({ label, value, icon: Icon, unit, color }) => {
    const barColors = {
        emerald: 'bg-emerald-600',
        teal: 'bg-teal-600'
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-700">
                    <Icon size={16} className="text-slate-400" />
                    <span className="text-sm font-bold">{label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{value}{unit}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColors[color]} transition-all duration-1000 ease-out flex items-center justify-end px-2`}
                    style={{ width: `${value}%` }}
                >
                    <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

const RegionItem: React.FC<{ name: string; status: SystemStatus }> = ({ name, status }) => {
    const getStatusDot = (s: SystemStatus) => {
        switch (s) {
            case SystemStatus.OPERATIONAL: return 'bg-emerald-500';
            case SystemStatus.DEGRADED: return 'bg-amber-500';
            case SystemStatus.DOWN: return 'bg-rose-500';
            default: return 'bg-slate-300';
        }
    };

    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <span className="text-sm font-medium text-slate-600">{name}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                    {status === SystemStatus.OPERATIONAL ? 'Active' : status}
                </span>
                <div className={`w-2 h-2 rounded-full ${getStatusDot(status)} shadow-sm shadow-black/5`}></div>
            </div>
        </div>
    );
};

export default SystemHealthView;
