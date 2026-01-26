import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductStatus, Category, User, HeuristicMatch, EditEntry } from '../types';
import {
  Eye, Trash2, CheckCircle, AlertTriangle, ShieldAlert, Flag, Search, Filter,
  XCircle, Loader2, X, ShoppingBag, ChevronRight, MoreVertical, Clock,
  CheckCircle2, AlertCircle, TrendingDown, Users, Calendar, DollarSign,
  Info, ExternalLink, Zap, Shield, Image as ImageIcon, History,
  UserCheck, ShieldCheck, Ban, MessageSquare, Star, ArrowRight
} from 'lucide-react';
import { analyzeListingForSafety } from '../services/geminiService';
import { api } from '../services/api';
import { useToast } from './Toast';

interface ListingsViewProps {
  initialListingId?: string | null;
  onClearInitial?: () => void;
  initialFraudOnly?: boolean;
  onClearFraud?: () => void;
}

const ListingsView: React.FC<ListingsViewProps> = ({ initialListingId, onClearInitial, initialFraudOnly, onClearFraud }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReasonModal, setShowReasonModal] = useState<{ id: string | string[], status: ProductStatus } | null>(null);
  const { success, error, toast } = useToast();

  // Advanced Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<number>(0);
  const [dateSort, setDateSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, u] = await Promise.all([api.getProducts(), api.getUsers()]);
        setProducts(p);
        setUsers(u);
      } catch (e) {
        console.error("Failed to load listings data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialFraudOnly) {
      setRiskFilter(7); // Show high risk
      if (onClearFraud) onClearFraud();
    }
  }, [initialFraudOnly]);

  useEffect(() => {
    if (initialListingId && products.length > 0) {
      const product = products.find(p => p.id === initialListingId);
      if (product) {
        setSelectedProduct(product);
        if (onClearInitial) onClearInitial();
      }
    }
  }, [initialListingId, products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.seller.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesRisk = p.riskScore >= riskFilter;
      return matchesSearch && matchesCat && matchesStatus && matchesRisk;
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateSort === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });
  }, [products, search, categoryFilter, statusFilter, riskFilter, dateSort]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: 'APPROVE' | 'REMOVE' | 'HIDE' | 'WARN') => {
    const newStatus = action === 'APPROVE' ? ProductStatus.ACTIVE :
      action === 'REMOVE' ? ProductStatus.REMOVED :
        action === 'HIDE' ? ProductStatus.HIDDEN : ProductStatus.FLAGGED;

    if (action === 'REMOVE') {
      setShowReasonModal({ id: selectedIds, status: newStatus as ProductStatus });
      return;
    }

    if (!confirm(`Apply this action to ${selectedIds.length} listings?`)) return;

    try {
      for (const id of selectedIds) {
        await api.updateProductStatus(id, newStatus as ProductStatus);
      }
      setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: newStatus as ProductStatus } : p));
      setSelectedIds([]);
      success(`Bulk Action Complete`, `${selectedIds.length} listings have been updated.`);
    } catch (err) {
      error(`Action Failed`, `Could not update some listings.`);
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen relative overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${selectedProduct ? 'mr-[450px]' : ''}`}>
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Listings Triage</h2>
              <p className="text-slate-500 mt-2 flex items-center gap-2">
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                Rapid scanning and multi-vector moderation queue.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <button
                  onClick={() => setDateSort('NEWEST')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dateSort === 'NEWEST' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setDateSort('OLDEST')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dateSort === 'OLDEST' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Oldest
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by Title, ID, or Seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_REVIEW">Pending</option>
              <option value="FLAGGED">Flagged</option>
              <option value="HIDDEN">Hidden</option>
              <option value="REMOVED">Removed</option>
              <option value="SOLD">Sold</option>
            </select>

            <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-xl border border-transparent">
              <ShieldAlert size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Risk &gt; {riskFilter}</span>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={riskFilter}
                onChange={(e) => setRiskFilter(parseInt(e.target.value))}
                className="w-24 accent-indigo-600"
              />
            </div>

            {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || riskFilter > 0) && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter('ALL'); setStatusFilter('ALL'); setRiskFilter(0); }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">
                  {selectedIds.length}
                </div>
                <p className="font-bold">Listings Selected</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkAction('APPROVE')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-black transition-all flex items-center gap-2">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleBulkAction('HIDE')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-black transition-all flex items-center gap-2">
                  <Eye size={14} /> Hide
                </button>
                <button onClick={() => handleBulkAction('WARN')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-xs font-black transition-all flex items-center gap-2">
                  <MessageSquare size={14} /> Warn Seller
                </button>
                <button onClick={() => handleBulkAction('REMOVE')} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs font-black transition-all flex items-center gap-2">
                  <Trash2 size={14} /> Remove
                </button>
                <div className="h-6 w-[1px] bg-white/20 mx-2"></div>
                <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-white/10 rounded-lg text-white/60">
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Table View */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Overview</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Triage</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rapid Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr
                    key={p.id}
                    className={`group hover:bg-indigo-50/30 transition-all cursor-pointer ${selectedProduct?.id === p.id ? 'bg-indigo-50 shadow-inner' : ''}`}
                    onClick={() => setSelectedProduct(p)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleToggleSelect(p.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                          <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400">
                            <span className="flex items-center gap-1 uppercase tracking-widest font-black text-slate-300">{p.category}</span>
                            <span>•</span>
                            <span className="text-indigo-500">KSH {p.price.toLocaleString()}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1"><Clock size={10} /> {new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ring-4 ${p.riskScore > 7 ? 'bg-rose-500 ring-rose-500/10' :
                            p.riskScore > 4 ? 'bg-amber-500 ring-amber-500/10' :
                              'bg-emerald-500 ring-emerald-500/10'
                            }`} />
                          <span className={`text-[11px] font-black uppercase tracking-widest ${p.riskScore > 7 ? 'text-rose-600' :
                            p.riskScore > 4 ? 'text-amber-600' :
                              'text-emerald-600'
                            }`}>
                            {p.riskScore > 7 ? 'High Risk' : p.riskScore > 4 ? 'Medium Risk' : 'Clean'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.flags.map(f => (
                            <span key={f} className="text-[9px] font-black uppercase tracking-tight bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                              {f}
                            </span>
                          ))}
                          {p.flags.length === 0 && <span className="text-[9px] font-bold text-slate-300 italic">No flags</span>}
                        </div>
                      </div>
                      <SLABadge createdAt={p.createdAt} riskScore={p.riskScore} />
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all">
                          <MoreVertical size={16} />
                        </button>
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                        >
                          Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-20 flex flex-col items-center text-center">
                <Search size={48} className="text-slate-200 mb-4" />
                <h4 className="text-lg font-bold text-slate-400">No listings match your filters</h4>
                <button onClick={() => { setSearch(''); setCategoryFilter('ALL'); setStatusFilter('ALL'); setRiskFilter(0); }} className="mt-4 text-indigo-500 font-bold hover:underline">
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision side Panel */}
      {selectedProduct && (
        <ListingDetailPanel
          product={selectedProduct}
          seller={users.find(u => u.id === selectedProduct.seller.id)}
          onClose={() => setSelectedProduct(null)}
          onModerated={async (id, status, reason) => {
            if (status === 'REMOVED' && !reason) {
              setShowReasonModal({ id, status: ProductStatus.REMOVED });
              return;
            }
            try {
              await api.updateProductStatus(id, status as ProductStatus, reason);
              setProducts(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p));
              setSelectedProduct(null);
              success(`Listing Updated`, `Status changed to ${status}.`);
            } catch (err) {
              error(`Update Failed`, `Could not update listing ${id}.`);
            }
          }}
        />
      )}

      {/* Removal Reason Modal */}
      {showReasonModal && (
        <RemovalReasonModal
          onClose={() => setShowReasonModal(null)}
          onSubmit={async (reason, note) => {
            const { id, status } = showReasonModal;
            const ids = Array.isArray(id) ? id : [id];
            try {
              for (const targetId of ids) {
                await api.updateProductStatus(targetId, status, reason, note);
              }
              setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status } : p));
              setShowReasonModal(null);
              setSelectedProduct(null);
              setSelectedIds([]);
              error(`Items Removed`, `${ids.length} listing(s) have been removed permanently.`);
            } catch (err) {
              error(`Removal Failed`, `Could not process the removal request.`);
            }
          }}
        />
      )}
    </div>
  );
};

// Side Panel Component
const ListingDetailPanel: React.FC<{ product: Product; seller?: User; onClose: () => void; onModerated: (id: string, status: string, reason?: string) => void }> = ({ product, seller, onClose, onModerated }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l border-slate-200 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${product.riskScore > 7 ? 'bg-rose-500' : 'bg-indigo-600'} text-white shadow-lg`}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tighter">Decision Center</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {product.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* 1. Header Summary */}
        <section>
          <div className="flex items-start justify-between">
            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">{product.title}</h4>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${product.status === ProductStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
              {product.status}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
              <p className="text-sm font-black text-indigo-600">KSH {product.price}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Views</p>
              <p className="text-sm font-black text-slate-700">{product.views}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Age</p>
              <p className="text-sm font-black text-slate-700">2d</p>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${product.riskScore > 7 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk</p>
              <p className={`text-sm font-black ${product.riskScore > 7 ? 'text-rose-600' : 'text-indigo-600'}`}>{product.riskScore}/10</p>
            </div>
          </div>
        </section>

        {/* 2. Imagery */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> Images Analysis
            </h5>
            {product.flags.includes('STOCK_PHOTO') && (
              <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-2 py-0.5 rounded">
                <AlertCircle size={10} /> Stock Detected
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {product.images.map((img, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group relative cursor-pointer">
                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ArrowRight size={24} className="text-white -rotate-45" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Seller Snapshot */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <UserCheck size={80} />
          </div>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14} className="text-indigo-400" /> Seller Trust Snapshot
          </h5>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <span className="text-xl font-black">{product.seller.name.charAt(0)}</span>
            </div>
            <div>
              <h6 className="font-black text-lg leading-none">{product.seller.name}</h6>
              <p className="text-xs text-slate-400 mt-1">{product.seller.universityEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Account Age</p>
              <p className="text-sm font-bold">{seller?.accountAgeDays || 0} Days</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Removals</p>
              <p className={`text-sm font-bold ${(seller?.pastRemovals || 0) > 3 ? 'text-rose-400' : 'text-emerald-400'}`}>{seller?.pastRemovals || 0}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Verification</p>
              <div className="flex items-center gap-1.5 pt-0.5">
                {seller?.isVerified ? <CheckCircle2 size={12} className="text-indigo-400" /> : <XCircle size={12} className="text-slate-500" />}
                <span className="text-[10px] font-black uppercase tracking-tighter">{seller?.isVerified ? 'Verified' : 'Unlinked'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Heuristics & Explainability */}
        <section>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> Heuristic Explainer
          </h5>
          <div className="space-y-2">
            {product.heuristics.map((h, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between ${h.passed ? 'bg-emerald-50/30 border-emerald-100/50' :
                h.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                }`}>
                <div className="flex items-center gap-3">
                  {h.passed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className={h.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'} />}
                  <span className={`text-[11px] font-bold ${h.passed ? 'text-slate-500' : 'text-slate-900'}`}>{h.label}</span>
                </div>
                {!h.passed && <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${h.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>{h.severity}</span>}
              </div>
            ))}
          </div>
        </section>

        {/* 5. AI Analysis (Decision Assist) */}
        {product.aiAnalysis && (
          <section className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap size={60} />
            </div>
            <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">AI Copilot Analysis</h5>
            <p className="text-sm text-indigo-900 leading-relaxed font-medium">
              {product.aiAnalysis.reasoning}
            </p>
            <div className="mt-4 flex items-center gap-2 bg-indigo-600/5 p-3 rounded-xl border border-indigo-600/10">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest shrink-0">Suggested:</span>
              <span className="text-[11px] font-black text-indigo-800 uppercase tracking-tighter">{product.aiAnalysis.suggestedAction}</span>
            </div>
          </section>
        )}

        {/* 6. History Log */}
        <section>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History size={14} className="text-slate-400" /> Audit History
          </h5>
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {product.history.map((entry, i) => (
              <div key={i} className="pl-8 relative">
                <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(entry.timestamp).toLocaleDateString()} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-slate-600 mt-1 font-bold">
                  Changed <span className="text-indigo-600">{entry.field}</span> from <span className="line-through opacity-50">{entry.oldValue}</span> to <span className="text-slate-900">{entry.newValue}</span>
                </p>
              </div>
            ))}
            {product.history.length === 0 && <p className="text-[11px] text-slate-400 italic pl-8">No edit history recorded.</p>}
          </div>
        </section>
      </div>

      {/* Sticky Actions Panel */}
      <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.1)] space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => onModerated(product.id, 'ACTIVE')}
            className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-100 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> Approve
          </button>
          <button
            onClick={() => onModerated(product.id, 'HIDDEN')}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-amber-100 hover:text-amber-700 transition-all"
          >
            Hide
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onModerated(product.id, 'WARNED')}
            className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
          >
            Warn Seller
          </button>
          <button
            onClick={() => onModerated(product.id, 'ESCALATED')}
            className="flex-1 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all"
          >
            Escalate
          </button>
          <button
            onClick={() => onModerated(product.id, 'REMOVED')}
            className="flex-1 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-1"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const SLABadge: React.FC<{ createdAt: string; riskScore: number }> = ({ createdAt, riskScore }) => {
  const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600);
  const slaLimit = riskScore > 7 ? 2 : 24;
  const isBreached = hoursElapsed > slaLimit;
  const timeLeft = Math.max(0, slaLimit - hoursElapsed);

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isBreached ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-500'
      }`}>
      <Clock size={10} className={isBreached ? 'animate-pulse' : ''} />
      <span className="text-[10px] font-black uppercase tracking-tighter">
        {isBreached ? 'SLA BREACHED' : `${timeLeft.toFixed(1)}h Remaining`}
      </span>
    </div>
  );
};

const RemovalReasonModal: React.FC<{ onClose: () => void; onSubmit: (reason: string, note: string) => void }> = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState('FRAUD');
  const [note, setNote] = useState('');
  const reasons = [
    { id: 'FRAUD', label: 'Potential Fraud', icon: <ShieldAlert size={14} /> },
    { id: 'PROHIBITED_ITEM', label: 'Prohibited Item', icon: <XCircle size={14} /> },
    { id: 'MISLEADING_CONTENT', label: 'Misleading Info', icon: <AlertTriangle size={14} /> },
    { id: 'SPAM', label: 'Spam / Repeated', icon: <Ban size={14} /> },
    { id: 'OTHER', label: 'Other violation', icon: <MoreVertical size={14} /> }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="p-8 pb-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 shadow-inner ring-4 ring-rose-50/50">
            <Trash2 size={24} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Remove Listing</h3>
          <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed">
            Specify the platform policy violation to proceed with this enforcement action.
          </p>
        </div>

        <div className="px-8 py-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Primary Reason</p>
          <div className="grid grid-cols-1 gap-2">
            {reasons.map((r) => (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${reason === r.id
                  ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10'
                  : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${reason === r.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                    {r.icon}
                  </div>
                  <span className={`text-sm font-bold ${reason === r.id ? 'text-indigo-900' : 'text-slate-600'}`}>{r.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${reason === r.id ? 'border-indigo-600' : 'border-slate-200'}`}>
                  {reason === r.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Note (Admin only)</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add specifics for the audit trail..."
              className="w-full h-24 bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason, note)}
            className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all"
          >
            Confirm Removal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingsView;
