import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { MoreVertical, Mail, ShieldCheck, ShieldAlert, Ban, CheckCircle, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

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
    <div className="space-y-6 pb-10 animate-fade-in">
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
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 font-medium text-sm">
                + Add Administrator
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
    </div>
  );
};

export default UsersView;
