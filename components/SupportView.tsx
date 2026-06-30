import React, { useState, useEffect, useCallback } from 'react';
import {
  Headphones, Search, Filter, RefreshCw, ChevronDown, X,
  User, ShoppingBag, CreditCard, ShieldAlert, HelpCircle,
  Clock, CheckCircle2, AlertTriangle, XCircle, MessageSquare,
  Loader2, Save, ChevronLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '../types';
import { useToast } from './Toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  OPEN:        { label: 'Open',        color: 'bg-blue-100 text-blue-700',    icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700',  icon: RefreshCw },
  RESOLVED:    { label: 'Resolved',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  CLOSED:      { label: 'Closed',      color: 'bg-slate-100 text-slate-500',  icon: XCircle },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; dot: string }> = {
  LOW:    { label: 'Low',    dot: 'bg-slate-300' },
  MEDIUM: { label: 'Medium', dot: 'bg-blue-400' },
  HIGH:   { label: 'High',   dot: 'bg-amber-400' },
  URGENT: { label: 'Urgent', dot: 'bg-rose-500' },
};

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; icon: React.ElementType }> = {
  ACCOUNT: { label: 'Account',  icon: User },
  LISTING: { label: 'Listing',  icon: ShoppingBag },
  PAYMENT: { label: 'Payment',  icon: CreditCard },
  SAFETY:  { label: 'Safety',   icon: ShieldAlert },
  OTHER:   { label: 'Other',    icon: HelpCircle },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const { label, dot } = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  const { label, icon: Icon } = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Icon size={11} />
      {label}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Main component ───────────────────────────────────────────────────────────

const SupportView: React.FC = () => {
  const { success, error: toastError } = useToast();

  // List state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('');
  const [filterCategory, setFilterCategory] = useState<TicketCategory | ''>('');

  // Detail panel
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>('OPEN');
  const [editPriority, setEditPriority] = useState<TicketPriority>('MEDIUM');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTickets = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.getSupportTickets({
        page: p, limit: 25,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        category: filterCategory || undefined,
        search: search.trim() || undefined,
      });
      setTickets(data.tickets);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setStatusCounts(data.statusCounts);
    } catch {
      toastError('Load Failed', 'Could not fetch support tickets.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterCategory, search]);

  useEffect(() => { fetchTickets(1); }, [filterStatus, filterPriority, filterCategory]);

  useEffect(() => {
    const t = setTimeout(() => fetchTickets(1), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditNote(ticket.adminNote || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { ticket } = await api.updateSupportTicket(selected.id, {
        status: editStatus,
        priority: editPriority,
        adminNote: editNote,
      });
      setSelected(ticket);
      setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
      success('Ticket Updated', `#${ticket.id.slice(-6).toUpperCase()} has been updated.`);
    } catch (err: any) {
      toastError('Update Failed', err.message || 'Could not update ticket.');
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: 'Open', count: statusCounts['OPEN'] ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    { label: 'In Progress', count: statusCounts['IN_PROGRESS'] ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', icon: RefreshCw },
    { label: 'Resolved', count: statusCounts['RESOLVED'] ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    { label: 'Closed', count: statusCounts['CLOSED'] ?? 0, color: 'text-slate-500', bg: 'bg-slate-50', icon: XCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Support Tickets</h2>
        <p className="text-slate-500 mt-1">Respond to user requests and track resolution status.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, count, color, bg, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setFilterStatus(label === filterStatus ? '' : (label.replace(' ', '_').toUpperCase() as TicketStatus))}
            className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-left transition-all hover:shadow-md ${filterStatus === label.replace(' ', '_').toUpperCase() ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-black text-slate-800">{count}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Ticket list */}
        <div className={`flex-1 min-w-0 transition-all ${selected ? 'hidden lg:block' : ''}`}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets, users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
              />
            </div>

            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as TicketPriority | '')}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Priorities</option>
              {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as TicketCategory | '')}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {(Object.keys(CATEGORY_CONFIG) as TicketCategory[]).map(c => (
                <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>

            <button
              onClick={() => fetchTickets(page)}
              className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Active filters */}
          {(filterStatus || filterPriority || filterCategory || search) && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">Filters:</span>
              {filterStatus && <FilterChip label={STATUS_CONFIG[filterStatus as TicketStatus]?.label} onRemove={() => setFilterStatus('')} />}
              {filterPriority && <FilterChip label={`Priority: ${PRIORITY_CONFIG[filterPriority as TicketPriority]?.label}`} onRemove={() => setFilterPriority('')} />}
              {filterCategory && <FilterChip label={CATEGORY_CONFIG[filterCategory as TicketCategory]?.label} onRemove={() => setFilterCategory('')} />}
              {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />}
            </div>
          )}

          {/* List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-slate-300" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Headphones size={40} className="mb-3 opacity-30" />
                <p className="font-semibold">No tickets found</p>
                <p className="text-sm mt-1">Adjust your filters or check back later.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {tickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group ${selected?.id === ticket.id ? 'bg-emerald-50/60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${PRIORITY_CONFIG[ticket.priority]?.dot ?? 'bg-slate-300'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm truncate">{ticket.subject}</span>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-slate-500 truncate">{ticket.user.name} · {ticket.user.email}</span>
                          <CategoryBadge category={ticket.category} />
                          <span className="text-[10px] text-slate-400">{timeAgo(ticket.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ticket.message}</p>
                      </div>
                      <ChevronDown size={14} className="text-slate-300 -rotate-90 flex-shrink-0 mt-1 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50">
                <p className="text-xs text-slate-400">{total} tickets total</p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => fetchTickets(page - 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >Prev</button>
                  <span className="px-3 py-1.5 text-xs text-slate-500">{page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => fetchTickets(page + 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-0">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ticket #{selected.id.slice(-6).toUpperCase()}
                </p>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 hidden lg:block">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar">
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black text-sm flex-shrink-0">
                    {selected.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{selected.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{selected.user.email}</p>
                  </div>
                </div>

                {/* Ticket details */}
                <div>
                  <p className="font-bold text-slate-800 mb-1">{selected.subject}</p>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <StatusBadge status={selected.status} />
                    <PriorityBadge priority={selected.priority} />
                    <CategoryBadge category={selected.category} />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Submitted {new Date(selected.createdAt).toLocaleString()}</p>
                </div>

                {/* Admin note (if exists) */}
                {selected.adminNote && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1.5">
                      <MessageSquare size={12} /> Staff Note
                    </p>
                    <p className="text-sm text-amber-800 leading-relaxed">{selected.adminNote}</p>
                  </div>
                )}

                <div className="border-t border-slate-50 pt-4 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Ticket</p>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as TicketStatus)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 bg-white text-slate-700"
                    >
                      {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                    <select
                      value={editPriority}
                      onChange={e => setEditPriority(e.target.value as TicketPriority)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 bg-white text-slate-700"
                    >
                      {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map(p => (
                        <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Staff Note <span className="text-slate-400 font-normal">(sent to user on resolve)</span>
                    </label>
                    <textarea
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      rows={3}
                      placeholder="Add a note for the user…"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-emerald-500 text-slate-700 placeholder:text-slate-300"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
      {label}
      <button onClick={onRemove} className="hover:text-rose-500 transition-colors"><X size={10} /></button>
    </span>
  );
}

export default SupportView;
