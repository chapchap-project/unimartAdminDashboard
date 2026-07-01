import React, { useState, useEffect } from 'react';
import { Send, Bell, Mail, Search, Loader2, CheckCircle, AlertCircle, X, Copy, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useToast } from './Toast';

interface Template {
  id: string;
  category: string;
  title: string;
  subject: string;
  message: string;
}

const NotificationsView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);

  useEffect(() => {
    api.getNotificationTemplates()
      .then(data => {
        setTemplates(data.templates);
        setCategories(data.categories);
        setFilteredTemplates(data.templates);
      })
      .catch(console.error)
      .finally(() => setTemplatesLoading(false));
  }, []);

  useEffect(() => {
    setFilteredTemplates(
      selectedCategory ? templates.filter(t => t.category === selectedCategory) : templates
    );
  }, [selectedCategory, templates]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setSearching(true);
        try {
          const result = await api.searchUsers(searchQuery, 1, 10);
          setSearchResults(result.users);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) setSelectedUsers(prev => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectTemplate = (template: Template) => {
    setTitle(template.title);
    setMessage(template.message);
    setEmailSubject(template.subject);
    setSendViaEmail(true);
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedUsers.length === 0) return;
    setSending(true);
    try {
      await Promise.all(
        selectedUsers.map(user =>
          api.sendNotificationToUser(user.id, {
            message,
            title: title || 'Notification from Admin',
            type: 'system',
            sendEmail: sendViaEmail,
            emailSubject: emailSubject || title || 'Important Notification',
          })
        )
      );
      success(
        'Notifications Sent',
        `Delivered to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}${sendViaEmail ? ' via app and email' : ''}.`
      );
      setMessage('');
      setTitle('');
      setSelectedUsers([]);
      setSendViaEmail(false);
      setEmailSubject('');
    } catch {
      toastError('Send Failed', 'Could not deliver notifications. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const canSend = !sending && selectedUsers.length > 0 && message.trim().length > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Send Notifications</h2>
        <p className="text-slate-500 mt-1">Push messages directly to individual users, with optional email delivery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recipient search */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Recipients</h3>

            <div className="relative">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
                {searching && <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />}
              </div>

              {searchQuery && searchResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddUser(user)}
                      disabled={selectedUsers.some(u => u.id === user.id)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-6 text-center text-sm text-slate-400">
                  No users found for "{searchQuery}"
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5"
                  >
                    <span className="text-sm font-medium text-emerald-800">{user.name}</span>
                    <button
                      onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                      className="text-emerald-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message composition */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Account Update"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-800 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your notification message here…"
                  rows={6}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-800 resize-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{message.length} / 1000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Templates */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <button
              onClick={() => setShowTemplates(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-bold text-slate-800">Templates</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </button>

            {showTemplates && (
              <div className="mt-4 space-y-3">
                <select
                  value={selectedCategory || ''}
                  onChange={e => setSelectedCategory(e.target.value || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-700"
                >
                  <option value="">All categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <div className="space-y-2">
                  {templatesLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  ) : filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                      <div key={template.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">{template.title}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{template.category}</p>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(`${template.title}\n\n${template.message}`)}
                            className="text-slate-300 hover:text-slate-500 flex-shrink-0 p-1"
                            title="Copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{template.message}</p>
                        <button
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          Use Template
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No templates available</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delivery options */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Delivery</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <Bell className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">In-App</p>
                  <p className="text-xs text-slate-400">Always sent</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
              </div>

              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={sendViaEmail}
                  onChange={e => setSendViaEmail(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-800">Also Send via Email</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">User receives an email copy</p>
                </div>
              </label>

              {sendViaEmail && (
                <div className="pl-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder={title || 'Notification from Vendas'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary + send */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipients</span>
                <span className="font-bold">{selectedUsers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery</span>
                <span className="font-bold">{sendViaEmail ? 'App + Email' : 'App only'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Message</span>
                <span className={message.trim() ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                  {message.trim() ? '✓ Ready' : 'Empty'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send Now</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
