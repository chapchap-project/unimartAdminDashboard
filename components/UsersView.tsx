import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MoreVertical, Mail, ShieldCheck, ShieldAlert, Ban, CheckCircle, Trash2, Search, Filter, Loader2, UserPlus, X, AlertTriangle, Users, ShoppingBag, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

const UsersView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'risk' | 'reports' | 'activity' | 'newest'>('newest');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { success, error, toast } = useToast();

    // Add Admin Modal State
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [creatingAdmin, setCreatingAdmin] = useState(false);
    const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', universityEmail: '', password: '', role: 'USER' as UserRole });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', universityEmail: '' });
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState('');

    // Load users from API on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.getUsers();
                setUsers(data.users);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingAdmin(true);
        try {
            const res = await api.createUser(newUserForm);
            setUsers([res.user, ...users]);
            setIsAdminModalOpen(false);
            setNewUserForm({ name: '', universityEmail: '', password: '', role: UserRole.USER });
            success('User Created', `${res.user.name} has been added successfully.`);
        } catch (err: any) {
            error('Creation Failed', err.message);
        } finally {
            setCreatingAdmin(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            const res = await api.updateUserData(selectedUser.id, editForm);
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, name: res.user.name, universityEmail: res.user.universityEmail } : u));
            setSelectedUser({ ...selectedUser, name: res.user.name, universityEmail: res.user.universityEmail });
            setIsEditingProfile(false);
            success('Profile Updated', 'User data saved.');
        } catch (err: any) {
            error('Update Failed', err.message);
        }
    };

    const handleNotifyUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !notifyMessage.trim()) return;
        try {
            await api.notifyUser(selectedUser.id, { message: notifyMessage, title: 'Admin Communication' });
            setIsNotifyModalOpen(false);
            setNotifyMessage('');
            success('Notification Sent', `Message pushed to ${selectedUser.name}.`);
        } catch (err: any) {
            error('Notify Failed', err.message);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        // Optimistic UI Update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

        try {
            await api.updateUserRole(userId, newRole);
        } catch (error) {
            console.error("Failed to update role", error);
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

    const getSortedUsers = () => {
        let result = [...users];

        // Filter
        if (filter !== 'ALL') {
            result = result.filter(u => u.role === filter);
        }

        // Search
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(u => u.name.toLowerCase().includes(s) || u.universityEmail.toLowerCase().includes(s));
        }

        // Sort
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'risk': return b.riskScore - a.riskScore;
                case 'reports': return b.reportCount - a.reportCount;
                case 'activity': return b.activityCount - a.activityCount;
                default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    };

    const sortedUsers = getSortedUsers();

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
    }

    return (
        <div className="space-y-6 pb-10 animate-fade-in relative">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h2>
                    <p className="text-slate-500 mt-1">Manage {users.length} registered students.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAdminModalOpen(true)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 font-medium text-sm flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Add User
                    </button>
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    {['ALL', 'USER', 'ADMIN'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setFilter(role)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === role
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block"></div>
                    <div className="flex gap-2">
                        {(['risk', 'reports', 'activity', 'newest'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSortBy(s)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border ${sortBy === s
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                Sort: {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative w-full xl:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-slate-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Profile</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trust Score</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Activity</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No users found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            sortedUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                />
                                                {user.isVerified && (
                                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                        <CheckCircle size={12} className="text-emerald-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.universityEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 max-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${user.riskScore > 70 ? 'bg-rose-500' : user.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${user.riskScore}%` }}
                                                ></div>
                                            </div>
                                            <span className={`text-xs font-extrabold ${user.riskScore > 70 ? 'text-rose-600' : user.riskScore > 30 ? 'text-amber-600' : 'text-emerald-600'
                                                }`}>
                                                {user.riskScore}% Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-3">
                                            <div className="text-center" title="Listings">
                                                <p className="text-xs font-bold text-slate-700">{user.listingCount}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">List</p>
                                            </div>
                                            <div className="text-center" title="Transactions">
                                                <p className="text-xs font-bold text-slate-700">{user.transactionCount}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">Txn</p>
                                            </div>
                                            {user.reportCount > 0 && (
                                                <div className="text-center" title="Reports">
                                                    <p className="text-xs font-bold text-rose-600">{user.reportCount}</p>
                                                    <p className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">Flags</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${user.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            user.status === 'RESTRICTED' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                user.status === 'WARNED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'SUSPENDED' ? 'bg-rose-500' :
                                                user.status === 'RESTRICTED' ? 'bg-amber-500' :
                                                    user.status === 'WARNED' ? 'bg-orange-500' : 'bg-emerald-500'
                                                }`}></div>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>

            {/* User Profile Overlay */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedUser(null)}>
                    <div
                        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-slate-800 text-lg">User Intelligence Profile</h3>
                                {!isEditingProfile ? (
                                    <button 
                                        onClick={() => {
                                            setEditForm({ name: selectedUser.name, universityEmail: selectedUser.universityEmail });
                                            setIsEditingProfile(true);
                                        }}
                                        className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateUser} className="text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">Save</button>
                                        <button onClick={() => setIsEditingProfile(false)} className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => { setSelectedUser(null); setIsEditingProfile(false); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Trust Summary Area */}
                            <div className="flex items-start gap-6">
                                <div className="relative">
                                    <img
                                        src={selectedUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&size=128&background=random`}
                                        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-50 shadow-lg"
                                        alt=""
                                    />
                                    <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xl ring-2 ring-white ${selectedUser.riskScore > 70 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                                        }`}>
                                        {selectedUser.riskScore}
                                    </div>
                                </div>
                                <div className="flex-1 pt-2">
                                    {isEditingProfile ? (
                                        <div className="space-y-3 mb-4">
                                            <input 
                                                type="text" 
                                                value={editForm.name} 
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                                                className="w-full text-xl font-bold border-b border-slate-300 focus:border-emerald-500 outline-none pb-1 bg-transparent text-slate-900" 
                                            />
                                            <input 
                                                type="email" 
                                                value={editForm.universityEmail} 
                                                onChange={e => setEditForm({ ...editForm, universityEmail: e.target.value })} 
                                                className="w-full text-sm font-medium text-slate-600 border-b border-slate-300 focus:border-emerald-500 outline-none pb-1 bg-transparent" 
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedUser.name}</h4>
                                            <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-1 text-sm">
                                                <Mail size={14} /> {selectedUser.universityEmail}
                                            </p>
                                        </>
                                    )}
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-emerald-100">
                                            {selectedUser.role}
                                        </div>
                                        {selectedUser.isVerified && (
                                            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                                <CheckCircle size={10} /> Account Verified
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Trust Stats Row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Rating</p>
                                    <p className={`text-xl font-black ${selectedUser.riskScore > 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {selectedUser.riskScore > 70 ? 'CRITICAL' : selectedUser.riskScore > 30 ? 'MEDIUM' : 'SECURE'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Age</p>
                                    <p className="text-xl font-black text-slate-800">
                                        {Math.floor((Date.now() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)) || 1} yr
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Integrity</p>
                                    <p className="text-xl font-black text-slate-800">{100 - selectedUser.reportCount * 2}%</p>
                                </div>
                            </div>

                            {/* Activity Section */}
                            <div className="space-y-4 pt-4">
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    Activity Intelligence
                                    <div className="flex-1 h-px bg-slate-100"></div>
                                </h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            <ShoppingBag size={22} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-800">{selectedUser.listingCount}</p>
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Live Listings</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                            <CreditCard size={22} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-800">{selectedUser.transactionCount}</p>
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Transactions</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-5 rounded-2xl border transition-all ${selectedUser.reportCount > 5 ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'
                                    } flex items-center justify-between`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedUser.reportCount > 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'
                                            }`}>
                                            <AlertTriangle size={22} />
                                        </div>
                                        <div>
                                            <p className={`text-2xl font-black ${selectedUser.reportCount > 5 ? 'text-rose-700' : 'text-slate-800'}`}>
                                                {selectedUser.reportCount}
                                            </p>
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Moderation Flags</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-emerald-600 hover:underline">View History</button>
                                </div>
                            </div>

                            {/* Moderation Actions Terminal */}
                            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">Moderation Terminal</h5>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => {
                                            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'WARNED' } : u));
                                            setSelectedUser({ ...selectedUser, status: 'WARNED' });
                                            api.updateUserStatus(selectedUser.id, 'WARNED');
                                            api.createAuditLog('WARN_USER', selectedUser.id, `Issued official warning notification for community guidelines violation.`);
                                            success('User Warned', `An official warning has been sent to ${selectedUser.name}.`);
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Issue Official Warning</p>
                                                <p className="text-[10px] text-slate-400">Sends high-priority mail notification</p>
                                            </div>
                                        </div>
                                        <X size={14} className="text-slate-600 rotate-45 group-hover:text-white transition-all" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'RESTRICTED' } : u));
                                            setSelectedUser({ ...selectedUser, status: 'RESTRICTED' });
                                            api.updateUserStatus(selectedUser.id, 'RESTRICTED');
                                            api.createAuditLog('RESTRICT_USER', selectedUser.id, `Revoked marketplace privileges due to suspicious activity detected.`);
                                            toast('Access Restricted', `${selectedUser.name}'s marketplace privileges have been limited.`, 'warning');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                                                <ShieldAlert size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Restrict Marketplace Privileges</p>
                                                <p className="text-[10px] text-slate-400">Blocks new listings and messages</p>
                                            </div>
                                        </div>
                                        <X size={14} className="text-slate-600 rotate-45 group-hover:text-white transition-all" />
                                    </button>

                                    <button
                                        onClick={() => setShowSuspendConfirm(true)}
                                        className="w-full flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white">
                                                <Ban size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-rose-400">Full Account Suspension</p>
                                                <p className="text-[10px] text-rose-500/60 font-medium">Revokes all access immediately</p>
                                            </div>
                                        </div>
                                        <X size={14} className="text-rose-900 rotate-45 group-hover:text-white transition-all" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <button
                                onClick={() => handleDelete(selectedUser.id)}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                            >
                                <Trash2 size={14} /> Purge Identity Data
                            </button>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all"
                            >
                                Close Profile
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

                        <form onSubmit={() => {/* Logic to promote existing user or invite */ }}>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Search for an existing user to promote them to an administrator role.
                                </p>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        placeholder="jane.doe@egerton.ac.ke"
                                    />
                                </div>

                                <div className="bg-emerald-50 p-3 rounded-lg flex items-start gap-3 mt-2">
                                    <ShieldCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-emerald-800 leading-relaxed">
                                        Promoting a user to administrator gives them full access to all dashboard modules including User Management and Listings.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Suspension Confirm Modal */}
            {showSuspendConfirm && selectedUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-rose-100">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
                                <Ban className="text-rose-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Suspend Account?</h3>
                            <p className="text-slate-500 mt-3 leading-relaxed text-sm">
                                You are about to suspend **{selectedUser.name}**. This will hide all their active listings and revoke platform access immediately.
                            </p>

                            <div className="mt-8 flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'SUSPENDED' } : u));
                                        setSelectedUser({ ...selectedUser, status: 'SUSPENDED' });
                                        api.updateUserStatus(selectedUser.id, 'SUSPENDED');
                                        api.createAuditLog('SUSPEND_USER', selectedUser.id, `Full account suspension for critical risk profile and/or fraud reports.`);
                                        setShowSuspendConfirm(false);
                                        error('Account Suspended', `${selectedUser.name} has been banned from the platform.`);
                                    }}
                                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition-all active:scale-95"
                                >
                                    Yes, Suspend Account
                                </button>
                                <button
                                    onClick={() => setShowSuspendConfirm(false)}
                                    className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                        <div className="bg-rose-50/50 p-4 border-t border-rose-100 flex items-center gap-3">
                            <AlertTriangle className="text-rose-500 shrink-0" size={16} />
                            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                                This action will be logged in the audit history.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Notification Modal */}
            {isNotifyModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Message {selectedUser.name}</h3>
                            <button onClick={() => setIsNotifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleNotifyUser}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notification Payload</label>
                                    <textarea
                                        required
                                        autoFocus
                                        rows={4}
                                        value={notifyMessage}
                                        onChange={e => setNotifyMessage(e.target.value)}
                                        placeholder="Type the message to send to this user..."
                                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsNotifyModalOpen(false)}
                                        className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                                    >
                                        <Mail size={16} /> Send Alert
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersView;