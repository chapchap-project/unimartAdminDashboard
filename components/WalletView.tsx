import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WalletBalance } from '../types';
import { Wallet, ArrowUpCircle, RefreshCw, AlertCircle, CheckCircle2, Phone, CreditCard } from 'lucide-react';

const WalletView: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWalletBalance();
      setBalance(data);
    } catch (err) {
      console.error("Failed to fetch balance", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAmount || !phoneNumber) return;

    setIsTopupLoading(true);
    setStatus(null);

    try {
      const response = await api.topupServiceWallet(Number(topupAmount), phoneNumber);
      if (response.success) {
        setStatus({ type: 'success', message: 'Top-up initiated. Please check your phone for the M-Pesa prompt.' });
        setTopupAmount('');
      } else {
        setStatus({ type: 'error', message: response.message || 'Failed to initiate top-up' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'An unexpected error occurred' });
    } finally {
      setIsTopupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Fetching wallet data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Wallet Management</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and fund the system payout (B2C) wallets</p>
        </div>
        <button 
          onClick={fetchBalance}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Balances
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collection Wallet Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CreditCard size={80} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Collection Wallet (Till)</p>
              <h3 className="text-sm font-bold text-slate-700">Accumulated Revenue</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{balance?.currency}</span>
            <span className="text-5xl font-black text-slate-900 tracking-tighter">
              {balance?.collection_balance.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Funds received from customer STK pushes. Standard settlement applies.
          </p>
        </div>

        {/* Service Wallet Card */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group ring-2 ring-emerald-500/5">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-600">
            <Wallet size={80} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Service Wallet (Payout Float)</p>
              <h3 className="text-sm font-bold text-slate-700">Available for Withdrawals</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{balance?.currency}</span>
            <span className="text-5xl font-black text-emerald-600 tracking-tighter">
              {balance?.service_balance.toLocaleString()}
            </span>
          </div>
          {balance && balance.service_balance < 1000 && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 animate-pulse">
              <AlertCircle size={14} />
              <p className="text-[10px] font-bold uppercase tracking-tight">Low Balance Indicator</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payout Information */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
             <h3 className="font-bold flex items-center gap-2 mb-4">
               <AlertCircle size={18} className="text-amber-400" />
               B2C Payout Rules
             </h3>
             <ul className="space-y-3 text-xs text-slate-300">
               <li className="flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span>
                 Withdrawals require 105% of the payout amount in the Service Wallet (to cover fees).
               </li>
               <li className="flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span>
                 If Service balance is empty, withdrawals return a 417 error.
               </li>
               <li className="flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span>
                 Service wallet funds cannot be withdrawn; they are strictly for payouts and fees.
               </li>
             </ul>
          </div>
        </div>

        {/* Top-up Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ArrowUpCircle className="text-emerald-500" />
              Top Up Payout Float
            </h3>

            <form onSubmit={handleTopup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount to Top Up (KSH)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">KSH</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">M-Pesa Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>
              </div>

              {status && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2 ${
                  status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                  <p className="text-sm font-medium">{status.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isTopupLoading || !topupAmount || !phoneNumber}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTopupLoading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <>Initiate STK Push</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
