import React, { useState, useEffect } from 'react';
import { Dispute } from '../types';
import { AlertCircle, MessageSquare, Gavel, CheckCircle, Search, Clock, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const DisputesView: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const data = await api.getDisputes();
        setDisputes(data);
      } catch (e) {
        console.error("Failed to load disputes", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const handleResolve = async (disputeId: string, outcome: 'RESOLVED_BUYER' | 'RESOLVED_SELLER') => {
    // Optimistic Update
    setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status: outcome } : d));
    setSelectedDispute(null);
    try {
        await api.resolveDispute(disputeId, outcome);
    } catch (e) {
        console.error("Failed to resolve dispute", e);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return d.status === 'OPEN';
    return d.status !== 'OPEN';
  });

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dispute Resolution</h2>
          <p className="text-slate-500 mt-1">Review and arbitrate student conflicts securely.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${filter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                All Cases
            </button>
            <button 
                onClick={() => setFilter('OPEN')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${filter === 'OPEN' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                Open
            </button>
            <button 
                onClick={() => setFilter('RESOLVED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${filter === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                Resolved
            </button>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Case ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reported By</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Issue</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDisputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedDispute(dispute)}>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">#{dispute.id.toUpperCase()}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-sm">{dispute.reporter}</div>
                  <div className="text-xs text-slate-400">vs {dispute.reportedUser}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm font-medium text-slate-700">{dispute.reason}</div>
                   <div className="text-xs text-slate-400 truncate w-48">{dispute.productName}</div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">${dispute.amount}</td>
                <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        dispute.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                        {dispute.status === 'OPEN' ? <Clock size={12}/> : <CheckCircle size={12} />}
                        {dispute.status.replace('_', ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Review Case</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <Gavel className="text-red-500" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                Dispute #{selectedDispute.id.toUpperCase()}
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                    selectedDispute.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                    {selectedDispute.status}
                                </span>
                            </h2>
                            <p className="text-sm text-slate-500">Opened on {selectedDispute.date}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedDispute(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body - Two Columns */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Case File */}
                    <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-100 bg-slate-50/50">
                        <div className="space-y-6">
                            {/* Transaction Summary */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText size={14} /> Transaction Details
                                </h3>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">📦</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg">{selectedDispute.productName}</p>
                                        <p className="text-slate-500 font-medium text-sm">Amount: <span className="text-slate-800 font-bold">${selectedDispute.amount}</span></p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            <span className="bg-slate-100 px-2 py-1 rounded">Seller: {selectedDispute.reportedUser}</span>
                                            <span>→</span>
                                            <span className="bg-slate-100 px-2 py-1 rounded">Buyer: {selectedDispute.reporter}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* The Claim */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <AlertCircle size={14} /> The Claim
                                </h3>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="font-semibold text-slate-800 mb-2">{selectedDispute.reason}</p>
                                    <p className="text-slate-600 text-sm leading-relaxed">{selectedDispute.description}</p>
                                </div>
                            </div>

                             {/* Evidence */}
                             <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <ImageIcon size={14} /> Submitted Evidence
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedDispute.evidence.length > 0 ? selectedDispute.evidence.map((url, idx) => (
                                        <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative group cursor-pointer">
                                            <img src={url} alt="evidence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                    )) : (
                                        <div className="col-span-2 p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                                            <ImageIcon size={24} className="mb-2 opacity-50"/>
                                            <p className="text-xs">No images provided</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Communication Log */}
                    <div className="w-1/2 flex flex-col bg-white">
                        <div className="p-4 border-b border-slate-100 bg-white z-10">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare size={14} /> Communication Log
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                            {selectedDispute.messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'BUYER' ? 'items-end' : msg.role === 'SELLER' ? 'items-start' : 'items-center'}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.role}</span>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                                    </div>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'BUYER' ? 'bg-indigo-600 text-white rounded-tr-none' : 
                                        msg.role === 'SELLER' ? 'bg-white text-slate-700 border border-slate-200 rounded-tl-none' :
                                        'bg-amber-50 text-amber-800 border border-amber-100 text-center w-full'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {selectedDispute.status === 'OPEN' && (
                    <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                        <button 
                            onClick={() => setSelectedDispute(null)}
                            className="px-5 py-2.5 rounded-lg text-slate-500 font-medium hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button 
                            onClick={() => handleResolve(selectedDispute.id, 'RESOLVED_SELLER')}
                            className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                            Release Funds to Seller
                        </button>
                        <button 
                            onClick={() => handleResolve(selectedDispute.id, 'RESOLVED_BUYER')}
                            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            Refund Buyer
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default DisputesView;
