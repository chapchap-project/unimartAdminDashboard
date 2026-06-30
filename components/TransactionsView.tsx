import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { Search, Loader2, ArrowDownLeft, ArrowUpRight, DollarSign, CreditCard, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

const PAGE_SIZE = 50;

const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const data = await api.getTransactions(page, PAGE_SIZE);
      setTransactions(data.payments);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
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
      case 'REFUNDED': return 'bg-teal-50 text-teal-700 border-teal-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  }

  const totalVolume = transactions.filter(t => t.paymentStatus === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
  const successCount = transactions.filter(t => t.paymentStatus === 'SUCCESS').length;
  const pendingCount = transactions.filter(t => t.paymentStatus === 'PENDING').length;
  const failedCount = transactions.filter(t => t.paymentStatus === 'FAILED').length;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Transactions</h2>
          <p className="text-slate-500 mt-1">Monitor payments, refunds, and platform activity &middot; {totalItems.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">KSH {totalVolume.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <DollarSign size={22} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Successful</p>
            <h3 className="text-xl font-bold text-emerald-700 mt-1">{successCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle size={22} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</p>
            <h3 className="text-xl font-bold text-amber-700 mt-1">{pendingCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={22} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed</p>
            <h3 className="text-xl font-bold text-rose-700 mt-1">{failedCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter Tabs with counts */}
        <div className="flex border-b border-slate-100 px-4 overflow-x-auto gap-1">
          {[
            { status: 'ALL', label: 'All', count: transactions.length },
            { status: 'SUCCESS', label: 'Successful', count: successCount },
            { status: 'PENDING', label: 'Pending', count: pendingCount },
            { status: 'FAILED', label: 'Failed', count: failedCount },
            { status: 'REFUNDED', label: 'Refunded', count: transactions.filter(t => t.paymentStatus === 'REFUNDED').length },
          ].map(({ status, label, count }) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${filter === status
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filter === status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
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
                        <ArrowUpRight size={12} className="text-emerald-500" /> To: {tx.seller.name}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Page {currentPage} of {totalPages} &middot; {totalItems.toLocaleString()} transactions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchTransactions(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => fetchTransactions(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsView;