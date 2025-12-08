import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { MoreVertical, Mail, ShieldCheck, ShieldAlert, Ban, CheckCircle, Trash2, Search, Filter, Loader2, UserPlus, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Ban Modal State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  // Add Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', university: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Load users from API on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    // If banning, divert to modal flow
    if (newStatus === UserStatus.BANNED) {
        const user = users.find(u => u.id === userId);
        if (user) {
            setUserToBan(user);
            setBanReason('');
            setIsBanModalOpen(true);
        }
        return;
    }

    // Otherwise proceed with standard update (e.g., Unban)
    // Optimistic UI Update
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    try {
        await api.updateUserStatus(userId, newStatus);
    } catch (error) {
        // Revert on failure
        console.error("Failed to update status", error);
        // You would ideally refetch or revert state here
    }
  };

  const confirmBan = async () => {
    if (!userToBan) return;
    if (!banReason.trim()) {
        alert("Please provide a reason for the ban.");
        return;
    }

    // Optimistic Update
    setUsers(users.map(u => u.id === userToBan.id ? { ...u, status: UserStatus.BANNED } : u));
    setIsBanModalOpen(false);

    try {
        await api.updateUserStatus(userToBan.id, UserStatus.BANNED, banReason);
    } catch (error) {
        console.error("Failed to ban user", error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newAdmin.name || !newAdmin.email || !newAdmin.university) return;

    setCreatingAdmin(true);
    try {
        const createdUser = await api.createAdmin(newAdmin);
        setUsers([createdUser, ...users]);
        setIsAdminModalOpen(false);
        setNewAdmin({ name: '', email: '', university: '' });
    } catch (e) {
        console.error("Failed to create admin", e);
        alert("Failed to create administrator. Please check the logs.");
    } finally {
        setCreatingAdmin(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
        // Optimistic UI Update
        setUsers(users.filter(u => u.id !== userId));
        try {
            await api.deleteUser(userId);
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'ALL' || user.status === filter;
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h2>
          <p className="text-slate-500 mt-1">Manage {users.length} registered students across {new Set(users.map(u => u.university)).size} universities.</p>
        </div>
        <div className="flex gap-2">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2">
                <Filter size={16} />
                Export CSV
            </button>
            <button 
                onClick={() => setIsAdminModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 font-medium text-sm flex items-center gap-2"
            >
                <UserPlus size={16} />
                Add Administrator
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'VERIFIED', 'PENDING', 'BANNED'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                        filter === status 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
                type="text" 
                placeholder="Search students..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-slate-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Institution</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            No users found matching your filters.
                        </td>
                    </tr>
                ) : (
                filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${user.status === 'BANNED' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                                    <div className="text-xs text-slate-400 font-medium">Joined {user.joinDate}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-200">
                                <Mail size={12} className="text-slate-400"/>
                                {user.email}
                             </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{user.university}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                user.status === UserStatus.VERIFIED ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                user.status === UserStatus.BANNED ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                                {user.status === UserStatus.VERIFIED ? <ShieldCheck size={12}/> : <ShieldAlert size={12} />}
                                {user.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {user.status !== UserStatus.BANNED ? (
                                    <button 
                                        onClick={() => handleStatusChange(user.id, UserStatus.BANNED)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Ban User">
                                        <Ban size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleStatusChange(user.id, UserStatus.VERIFIED)}
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Unban User">
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => handleDelete(user.id)}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors" title="Delete Account">
                                    <Trash2 size={16} />
                                </button>
                                <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                )))}
            </tbody>
        </table>
      </div>

      {/* Ban Reason Modal */}
      {isBanModalOpen && userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Ban User</h3>
                            <p className="text-sm text-slate-500">Action against: <span className="font-semibold text-slate-700">{userToBan.name}</span></p>
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4">
                        This action will immediately restrict the user's access to Unimarket. 
                        Please provide a specific reason for this moderation action.
                    </p>

                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason for Ban</label>
                    <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none resize-none h-32"
                        placeholder="e.g. Violation of terms, fraudulent listing activity..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                    ></textarea>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button 
                        onClick={() => setIsBanModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmBan}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-200"
                    >
                        Confirm Ban
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Add New Administrator</h3>
                    <button onClick={() => setIsAdminModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleCreateAdmin}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input 
                                type="text"
                                required
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">University Email</label>
                            <input 
                                type="email"
                                required
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="jane.doe@university.edu"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">University / Campus</label>
                            <input 
                                type="text"
                                required
                                value={newAdmin.university}
                                onChange={(e) => setNewAdmin({...newAdmin, university: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="State University"
                            />
                        </div>
                        
                        <div className="bg-indigo-50 p-3 rounded-lg flex items-start gap-3 mt-2">
                             <ShieldCheck className="text-indigo-600 flex-shrink-0 mt-0.5" size={16} />
                             <p className="text-xs text-indigo-800 leading-relaxed">
                                The new administrator will receive an email invitation to set their password. They will have full access to User Management, Listings, and Dispute Resolution.
                             </p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                        <button 
                            type="button"
                            onClick={() => setIsAdminModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={creatingAdmin}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 flex items-center gap-2"
                        >
                            {creatingAdmin ? <Loader2 className="animate-spin" size={16}/> : null}
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;