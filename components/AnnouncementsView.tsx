import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import { Megaphone, Plus, Calendar, Eye, AlertTriangle, Info, AlertOctagon, X, Loader2, Send } from 'lucide-react';
import { api } from '../services/api';

const AnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // New Announcement Form State
  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    targetAudience: Announcement['targetAudience'];
    priority: Announcement['priority'];
    expiresAt: string;
  }>({
    title: '',
    message: '',
    targetAudience: 'ALL',
    priority: 'INFO',
    expiresAt: ''
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await api.getAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.expiresAt) {
        alert("Please fill in all required fields.");
        return;
    }

    setSending(true);
    try {
        const newAnnouncement = await api.createAnnouncement(formData);
        setAnnouncements([newAnnouncement, ...announcements]);
        setIsModalOpen(false);
        setFormData({ title: '', message: '', targetAudience: 'ALL', priority: 'INFO', expiresAt: '' });
    } catch (error) {
        console.error("Failed to create announcement", error);
    } finally {
        setSending(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
        case 'CRITICAL': return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100"><AlertOctagon size={12}/> Critical</span>;
        case 'WARNING': return <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100"><AlertTriangle size={12}/> Warning</span>;
        default: return <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100"><Info size={12}/> Info</span>;
    }
  };

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Broadcasts</h2>
          <p className="text-slate-500 mt-1">Push notifications and banners to the student mobile app.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-200 font-medium flex items-center gap-2 transition-all"
        >
            <Plus size={18} />
            Create Announcement
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority / Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Audience</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Posted By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {announcements.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="mb-2">{getPriorityBadge(ann.priority)}</div>
                    <div className="font-bold text-slate-800 text-sm">{ann.title}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate w-64">{ann.message}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{ann.targetAudience}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                     {ann.author}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        <div>
                            <p>From: {ann.postedAt}</p>
                            <p>To: {ann.expiresAt}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${ann.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {ann.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-slate-500 text-xs font-medium">
                        <Eye size={14} />
                        {ann.views.toLocaleString()} views
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Megaphone size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">New Broadcast</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input 
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="e.g. Scheduled Maintenance"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority Level</label>
                                <select 
                                    value={formData.priority}
                                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="INFO">Info (Blue)</option>
                                    <option value="WARNING">Warning (Amber)</option>
                                    <option value="CRITICAL">Critical (Red)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Audience</label>
                                <select 
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value as Announcement['targetAudience']})}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="ALL">All Users</option>
                                    <option value="BUYERS">Buyers Only</option>
                                    <option value="SELLERS">Sellers Only</option>
                                    <option value="FACULTY">Faculty Only</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message Body</label>
                            <textarea 
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none h-24"
                                placeholder="Write your message here..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expires On</label>
                            <input 
                                type="date"
                                required
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={sending}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 flex items-center gap-2"
                        >
                            {sending ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                            Publish Broadcast
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsView;