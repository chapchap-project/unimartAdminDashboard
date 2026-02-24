import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { Search, Filter, Loader2, ArrowDownLeft, ArrowUpRight, DollarSign, Download, CreditCard, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await api.getTransactions();
        setTransactions(data.payments);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'ALL' || t.paymentStatus === filter;
    const matchesSearch = t.listing.title.toLowerCase().includes(search.toLowerCase()) ||
      t.buyer.name.toLowerCase().includes(search.toLowerCase()) ||
      t.seller.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'FAILED': return 'bg-red-50 text-red-700 border-red-100';
      case 'REFUNDED': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  const totalVolume = transactions.filter(t => t.paymentStatus === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Transactions</h2>
          <p className="text-slate-500 mt-1">Monitor payments, refunds, and platform activity.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">KSH {totalVolume.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${filter === status
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parties</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{tx.id.toUpperCase().split('-')[0]}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{tx.listing.title}</div>
                    <div className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-slate-600">
                        <ArrowDownLeft size={12} className="text-emerald-500" /> From: {tx.buyer.name}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <ArrowUpRight size={12} className="text-indigo-500" /> To: {tx.seller.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">KSH {tx.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{tx.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(tx.paymentStatus)}`}>
                      {tx.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;