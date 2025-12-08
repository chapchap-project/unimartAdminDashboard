import React, { useState, useEffect } from 'react';
import { DashboardMetrics } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, DollarSign, ShoppingBag, AlertTriangle, Sparkles, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getDashboardInsights } from '../services/geminiService';
import { api } from '../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const DashboardHome: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch dashboard metrics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const generateInsight = async () => {
    if (!metrics) return;
    setLoadingInsight(true);
    const result = await getDashboardInsights(metrics, "No major outages reported. User signups spiked on Tuesday.");
    setInsight(result);
    setLoadingInsight(false);
  };

  if (loading || !metrics) {
    return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Overview</h2>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening on campus today.</p>
        </div>
        <button
          onClick={generateInsight}
          disabled={loadingInsight}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-slate-200 transition-all disabled:opacity-70 text-sm font-medium border border-slate-700"
        >
          {loadingInsight ? <Loader2 className="animate-spin text-indigo-400" size={16} /> : <Sparkles size={16} className="text-indigo-400" />}
          {loadingInsight ? 'Analyzing Data...' : 'Generate AI Report'}
        </button>
      </div>

      {/* AI Insight Box */}
      {insight && (
        <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 p-6 rounded-2xl shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 mt-1">
                <Sparkles size={20} />
            </div>
            <div className="flex-1">
                 <h3 className="text-indigo-900 font-bold text-lg mb-2">Strategic Insights</h3>
                 <div className="prose prose-sm prose-indigo text-slate-600 max-w-none">
                    <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 border-0 text-sm leading-relaxed">{insight}</pre>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={metrics.totalUsers.toLocaleString()} 
          icon={Users} 
          trend={12}
          color="indigo"
          subtitle="Verified .edu emails"
        />
        <StatCard 
          title="Market Volume" 
          value={`$${metrics.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend={8} 
          color="emerald"
          subtitle="Gross transaction value"
        />
        <StatCard 
          title="Active Listings" 
          value={metrics.activeListings.toLocaleString()} 
          icon={ShoppingBag} 
          trend={-2} 
          color="blue"
          subtitle="Live products"
        />
        <StatCard 
          title="Disputes" 
          value={metrics.pendingDisputes.toString()} 
          icon={AlertTriangle} 
          trend={15}
          inverseTrend 
          color="amber"
          subtitle="Requires moderation"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
                 <h3 className="text-lg font-bold text-slate-800">Revenue Trends</h3>
                 <p className="text-xs text-slate-400">Weekly transaction performance</p>
            </div>
            <select className="text-sm border-slate-200 border rounded-md px-3 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4">
             <h3 className="text-lg font-bold text-slate-800">Categories</h3>
             <p className="text-xs text-slate-400">Distribution of active listings</p>
          </div>
          
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {metrics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500">Top Performer</span>
                <span className="text-xs font-bold text-indigo-600">45%</span>
             </div>
             <p className="text-sm font-bold text-slate-800">Textbooks & Course Material</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: number;
  color: 'indigo' | 'emerald' | 'blue' | 'amber';
  subtitle: string;
  inverseTrend?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color, subtitle, inverseTrend }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  };

  const isPositive = trend > 0;
  // If inverseTrend is true (like disputes), a positive number is BAD (red), negative is GOOD (green)
  const isGood = inverseTrend ? !isPositive : isPositive;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorStyles[color]} ring-1 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        <p className="text-sm font-semibold text-slate-600 mt-1">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

export default DashboardHome;
