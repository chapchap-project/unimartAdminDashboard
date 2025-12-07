import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import ListingsView from './components/ListingsView';
import UsersView from './components/UsersView';
import DisputesView from './components/DisputesView';
import { ViewState } from './types';
import { mockMetrics, mockProducts, mockUsers, mockDisputes } from './mockData';
import { Bell, Search, UserCircle, LogIn, Lock, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setView] = useState<ViewState>('DASHBOARD');

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock Authentication Logic
    setTimeout(() => {
      if (email === 'admin@unimarket.edu' && password === 'admin') {
        setIsAuthenticated(true);
      } else {
        setError('Invalid credentials. Try admin@unimarket.edu / admin');
        setIsLoading(false);
      }
    }, 1000);
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <DashboardHome metrics={mockMetrics} />;
      case 'LISTINGS':
        return <ListingsView products={mockProducts} />;
      case 'USERS':
        return <UsersView users={mockUsers} />;
      case 'DISPUTES':
        return <DisputesView disputes={mockDisputes} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <h3 className="text-lg font-medium">This module is under development</h3>
            <p>Check back later for Updates.</p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 z-10 relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Unimarket Admin</h1>
            <p className="text-slate-500 text-sm mt-2">Secure access for university staff</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                  placeholder="admin@unimarket.edu"
                />
                <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 font-medium text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In Dashboard</>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Protected by Enterprise Single Sign-On
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar currentView={currentView} setView={setView} />
      
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-30 shadow-sm">
          <div className="relative w-96 group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Global Search (Users, Listings, Disputes)..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-100 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">Jessica Pearson</p>
                <p className="text-xs text-indigo-500 font-medium">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-md cursor-pointer hover:shadow-lg transition-all">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                   <img src="https://picsum.photos/200/200?random=4" alt="Admin" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;