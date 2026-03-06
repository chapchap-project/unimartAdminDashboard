import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag, AlertCircle, X, Command, Terminal, ChevronRight, Zap, Shield, Trash2, Ban } from 'lucide-react';
import { ViewState, Product, Report, User as UserType } from '../types';
import { api } from '../services/api';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    setView: (view: ViewState, params?: any) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, setView }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ type: 'USER' | 'LISTING' | 'REPORT' | 'NAV' | 'ACTION', id: string, title: string, subtitle?: string, icon: any, data?: any }[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Execute Search
    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([
                    { type: 'NAV', id: 'DASHBOARD', title: 'Go to Dashboard', icon: Zap },
                    { type: 'NAV', id: 'USERS', title: 'Go to Users Management', icon: User },
                    { type: 'NAV', id: 'LISTINGS', title: 'Go to Listings Management', icon: ShoppingBag },
                    { type: 'NAV', id: 'REPORTS', title: 'Go to Moderation Queue', icon: AlertCircle },
                ]);
                return;
            }

            // Action Commands
            if (query.startsWith('>')) {
                const cmd = query.slice(1).trim().toLowerCase();
                if (cmd.startsWith('suspend')) {
                    setResults([{ type: 'ACTION', id: 'suspend', title: 'Execute: Suspend User', subtitle: 'Type username or ID after command', icon: Ban }]);
                } else if (cmd.startsWith('delete')) {
                    setResults([{ type: 'ACTION', id: 'delete', title: 'Execute: Delete Listing', subtitle: 'Type listing ID after command', icon: Trash2 }]);
                }
                return;
            }

            // Real Search
            try {
                const [users, products, reports] = await Promise.all([
                    api.getUsers(),
                    api.getProducts(),
                    api.getReports()
                ]);

                const q = query.toLowerCase();
                const filteredUsers = users.filter(u => u.name.toLowerCase().includes(q) || u.universityEmail.toLowerCase().includes(q)).slice(0, 3);
                const filteredProducts = products.filter(p => p.title.toLowerCase().includes(q)).slice(0, 3);
                const filteredReports = reports.filter(r => r.reason.toLowerCase().includes(q)).slice(0, 3);

                const newResults: any[] = [
                    ...filteredUsers.map(u => ({ type: 'USER', id: u.id, title: u.name, subtitle: u.universityEmail, icon: User, data: u })),
                    ...filteredProducts.map(p => ({ type: 'LISTING', id: p.id, title: p.title, subtitle: `KSH ${p.price}`, icon: ShoppingBag, data: p })),
                    ...filteredReports.map(r => ({ type: 'REPORT', id: r.id, title: r.reason, subtitle: `By ${r.reporter.name}`, icon: AlertCircle, data: r }))
                ];

                if (newResults.length === 0) {
                    newResults.push({ type: 'NAV', id: 'SEARCH', title: `No direct matches for "${query}"`, subtitle: 'Press Enter to try a global system search', icon: Terminal });
                }

                setResults(newResults);
                setSelectedIndex(0);
            } catch (e) {
                console.error("Search failed", e);
            }
        };

        const timeout = setTimeout(search, 150);
        return () => clearTimeout(timeout);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(results[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (item: any) => {
        if (!item) return;

        if (item.type === 'NAV') {
            if (item.id !== 'SEARCH') setView(item.id as ViewState);
        } else if (item.type === 'USER') {
            setView('USERS'); // In a real app we'd deep link to user profile
        } else if (item.type === 'LISTING') {
            setView('LISTINGS', { targetId: item.id });
        } else if (item.type === 'REPORT') {
            setView('REPORTS', { targetId: item.id });
        } else if (item.type === 'ACTION') {
            // Implement specific action triggers
            console.log(`Executing ${item.id} action`);
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Input Area */}
                <div className="p-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <Search size={22} className="text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search users, listings, or type '>' for commands..."
                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400">ESC</span>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.map((item, idx) => (
                        <button
                            key={`${item.type}-${item.id}-${idx}`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${selectedIndex === idx ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 translate-x-1' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${selectedIndex === idx ? 'bg-white/20' : 'bg-slate-100'}`}>
                                <item.icon size={20} className={selectedIndex === idx ? 'text-white' : 'text-slate-500'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm leading-none flex items-center gap-2">
                                    {item.title}
                                    {item.type === 'ACTION' && <span className={`text-[10px] uppercase font-black px-1 rounded ${selectedIndex === idx ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'}`}>System</span>}
                                </p>
                                {item.subtitle && (
                                    <p className={`text-xs mt-1 truncate ${selectedIndex === idx ? 'text-emerald-100' : 'text-slate-400'}`}>
                                        {item.subtitle}
                                    </p>
                                )}
                            </div>
                            <ChevronRight size={16} className={`${selectedIndex === idx ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-6">
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Zap size={10} className="text-emerald-500" /> Navigate</span>
                        <span className="flex items-center gap-1.5"><Shield size={10} className="text-rose-500" /> Action</span>
                        <span className="flex items-center gap-1.5"><Terminal size={10} className="text-emerald-500" /> Command</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                        <Command size={10} /> + K to open
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
