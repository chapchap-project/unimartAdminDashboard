import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Plus, X, Send, Bell, Users, Building2, Globe,
  CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Trash2, Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

type TargetType = 'all' | 'university' | 'specific';
type StatusFilter = 'ALL' | 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED';

interface ScheduledNotification {
  id: string;
  title: string | null;
  message: string;
  type: string;
  targetType: TargetType;
  targetValue: string | null;
  userIds: string[];
  scheduledAt: string;
  sendEmail: boolean;
  emailSubject: string | null;
  status: string;
  sentAt: string | null;
  sentCount: number | null;
  errorMessage: string | null;
  createdBy: string;
  createdAt: string;
}

const UNIVERSITIES = ['Egerton University', 'Pwani University', 'Technical University of Mombasa', 'Mount Kenya University'];

const statusColors: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700 border border-amber-200',
  SENDING:  'bg-blue-100 text-blue-700 border border-blue-200',
  SENT:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
  CANCELLED:'bg-slate-100 text-slate-600 border border-slate-200',
  FAILED:   'bg-red-100 text-red-700 border border-red-200',
};

const StatusIcon: React.FC<{ status: string; size?: number }> = ({ status, size = 14 }) => {
  switch (status) {
    case 'SENT':      return <CheckCircle size={size} />;
    case 'FAILED':    return <XCircle size={size} />;
    case 'CANCELLED': return <X size={size} />;
    case 'SENDING':   return <Loader2 size={size} className="animate-spin" />;
    default:          return <Clock size={size} />;
  }
};

const ScheduledNotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'system',
    targetType: 'all' as TargetType,
    targetValue: '',
    scheduledAt: '',
    sendEmail: false,
    emailSubject: '',
  });
  const [specificUsers, setSpecificUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await api.getScheduledNotifications(status, 1, 50);
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Debounced user search for "specific" targeting
  useEffect(() => {
    if (!userSearch.trim()) { setUserSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchUsers(userSearch, 1, 8);
        setUserSearchResults(res.users.filter(u => !specificUsers.find(s => s.id === u.id)));
      } catch {
        // silently handled
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [userSearch, specificUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.message.trim()) { setFormError('Message is required.'); return; }
    if (!form.scheduledAt)    { setFormError('Please set a scheduled date and time.'); return; }
    if (new Date(form.scheduledAt) <= new Date()) { setFormError('Scheduled time must be in the future.'); return; }
    if (form.targetType === 'university' && !form.targetValue) { setFormError('Please select a university.'); return; }
    if (form.targetType === 'specific' && specificUsers.length === 0) { setFormError('Please select at least one user.'); return; }

    setSubmitting(true);
    try {
      await api.createScheduledNotification({
        title:        form.title || undefined,
        message:      form.message,
        type:         form.type,
        targetType:   form.targetType,
        targetValue:  form.targetType === 'university' ? form.targetValue : undefined,
        userIds:      form.targetType === 'specific' ? specificUsers.map(u => u.id) : undefined,
        scheduledAt:  new Date(form.scheduledAt).toISOString(),
        sendEmail:    form.sendEmail,
        emailSubject: form.sendEmail ? form.emailSubject || undefined : undefined,
      });

      setFormSuccess('Notification scheduled successfully!');
      setForm({ title: '', message: '', type: 'system', targetType: 'all', targetValue: '', scheduledAt: '', sendEmail: false, emailSubject: '' });
      setSpecificUsers([]);
      fetchNotifications();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule notification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await api.cancelScheduledNotification(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'CANCELLED' } : n));
    } catch {
      // silently handled
    } finally {
      setCancelling(null);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const targetLabel = (n: ScheduledNotification) => {
    if (n.targetType === 'all') return 'All Users';
    if (n.targetType === 'university') return n.targetValue || 'University';
    return `${n.userIds.length} specific user${n.userIds.length !== 1 ? 's' : ''}`;
  };

  const minDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    return d.toISOString().slice(0, 16);
  };

  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Failed', value: 'FAILED' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scheduled Notifications</h2>
          <p className="text-slate-500 text-sm mt-0.5">{total} notification{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm shadow-emerald-200"
          >
            <Plus size={16} />
            Schedule Notification
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Schedule Notification</h3>
                  <p className="text-xs text-slate-500">Set a future delivery time for your notification</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Title (optional)</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Notification title..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="system">System</option>
                    <option value="order">Order</option>
                    <option value="price">Price</option>
                    <option value="message">Message</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write the notification message..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-right text-xs text-slate-400 mt-1">{form.message.length}/1000</p>
              </div>

              {/* Scheduled Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  min={minDateTime()}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Target Audience *</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'all',        label: 'All Users',      icon: Globe },
                    { value: 'university', label: 'By University',  icon: Building2 },
                    { value: 'specific',   label: 'Specific Users', icon: Users },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, targetType: value, targetValue: '' }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.targetType === value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>

                {form.targetType === 'university' && (
                  <select
                    value={form.targetValue}
                    onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                    className="mt-3 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select university...</option>
                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                )}

                {form.targetType === 'specific' && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {searching && <Loader2 size={16} className="absolute right-3 top-3 text-slate-400 animate-spin" />}
                    </div>
                    {userSearchResults.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        {userSearchResults.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setSpecificUsers(prev => [...prev, u]); setUserSearchResults(prev => prev.filter(r => r.id !== u.id)); setUserSearch(''); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {specificUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {specificUsers.map(u => (
                          <span key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            {u.name}
                            <button type="button" onClick={() => setSpecificUsers(prev => prev.filter(s => s.id !== u.id))}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Email Option */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={form.sendEmail}
                  onChange={e => setForm(f => ({ ...f, sendEmail: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                />
                <label htmlFor="sendEmail" className="text-sm font-medium text-slate-700 cursor-pointer">Also send via email</label>
              </div>
              {form.sendEmail && (
                <input
                  type="text"
                  value={form.emailSubject}
                  onChange={e => setForm(f => ({ ...f, emailSubject: e.target.value }))}
                  placeholder="Email subject (optional, defaults to title)"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}

              {/* Feedback */}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                  <CheckCircle size={16} />
                  {formSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Bell size={40} className="mb-3 opacity-40" />
          <p className="font-medium">No scheduled notifications</p>
          <p className="text-sm mt-1">Create one with the button above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              {/* Time column */}
              <div className="shrink-0 text-center w-20">
                <div className="text-xs font-bold text-slate-800">
                  {new Date(n.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(n.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {n.title && <span className="font-semibold text-slate-800 text-sm">{n.title}</span>}
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[n.status] || statusColors.PENDING}`}>
                    <StatusIcon status={n.status} size={11} />
                    {n.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    {n.targetType === 'all' ? <Globe size={12} /> : n.targetType === 'university' ? <Building2 size={12} /> : <Users size={12} />}
                    {targetLabel(n)}
                  </span>
                  <span>Type: {n.type}</span>
                  {n.sendEmail && <span>+ Email</span>}
                  {n.sentCount !== null && <span>{n.sentCount} delivered</span>}
                  <span>by {n.createdBy}</span>
                </div>
                {n.status === 'FAILED' && n.errorMessage && (
                  <p className="mt-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg">{n.errorMessage}</p>
                )}
              </div>

              {/* Actions */}
              {n.status === 'PENDING' && (
                <button
                  onClick={() => handleCancel(n.id)}
                  disabled={cancelling === n.id}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancelling === n.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Trash2 size={12} />
                  }
                  Cancel
                </button>
              )}
              {n.status === 'SENT' && n.sentAt && (
                <div className="shrink-0 text-right text-xs text-slate-400">
                  <p>Sent</p>
                  <p>{formatDateTime(n.sentAt)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledNotificationsView;
