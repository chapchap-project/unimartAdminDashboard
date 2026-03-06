import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Save, Server, Globe, ToggleLeft, ToggleRight, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react';

const SettingsView: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState(api.getBaseUrl());
    const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');

    const handleSave = () => {
        api.setBaseUrl(baseUrl);
        // Force a reload to apply changes globally or reset services
        window.location.reload();
    };

    const handleTestConnection = async () => {
        setConnectionStatus('TESTING');
        // Temporarily apply current URL for the test
        const originalUrl = api.getBaseUrl();

        api.setBaseUrl(baseUrl);

        const success = await api.testConnection();
        setConnectionStatus(success ? 'SUCCESS' : 'FAILED');

        // Revert if not saved
        if (!success) {
            api.setBaseUrl(originalUrl);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h2>
                    <p className="text-slate-500 mt-1">Configure your dashboard connections and preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-emerald-200 font-medium flex items-center gap-2 transition-all"
                >
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Configuration Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Server size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">API Connection</h3>
                            <p className="text-xs text-slate-400">Manage backend endpoints</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Backend API URL</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => {
                                        setBaseUrl(e.target.value);
                                        setConnectionStatus('IDLE');
                                    }}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all bg-white text-slate-800"
                                    placeholder="https://api.unimarket.edu/v1"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                The base URL for all dashboard requests. Must support HTTPS.
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                {connectionStatus === 'TESTING' && <RefreshCw className="animate-spin text-emerald-500" size={18} />}
                                {connectionStatus === 'SUCCESS' && <CheckCircle className="text-emerald-500" size={18} />}
                                {connectionStatus === 'FAILED' && <XCircle className="text-red-500" size={18} />}

                                <span className={`text-sm font-medium ${connectionStatus === 'SUCCESS' ? 'text-emerald-600' :
                                        connectionStatus === 'FAILED' ? 'text-red-600' : 'text-slate-500'
                                    }`}>
                                    {connectionStatus === 'IDLE' && 'Ready to test'}
                                    {connectionStatus === 'TESTING' && 'Testing connection...'}
                                    {connectionStatus === 'SUCCESS' && 'Connected successfully'}
                                    {connectionStatus === 'FAILED' && 'Connection failed'}
                                </span>
                            </div>
                            <button
                                onClick={handleTestConnection}
                                disabled={connectionStatus === 'TESTING'}
                                className="text-sm font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                            >
                                Test Connectivity
                            </button>
                        </div>
                    </div>
                </div>

                {/* Documentation Info */}
                <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>

                    <h3 className="font-bold text-lg mb-2 relative z-10">API Documentation</h3>
                    <p className="text-emerald-200 text-sm mb-6 relative z-10">
                        Ensure your backend endpoints match the expected structure for the dashboard to function correctly.
                    </p>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3 text-sm bg-emerald-800/50 p-3 rounded-lg border border-emerald-700">
                            <span className="font-mono text-emerald-300">GET</span>
                            <span>/admin/users</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm bg-emerald-800/50 p-3 rounded-lg border border-emerald-700">
                            <span className="font-mono text-emerald-300">GET</span>
                            <span>/admin/listings</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm bg-emerald-800/50 p-3 rounded-lg border border-emerald-700">
                            <span className="font-mono text-emerald-300">POST</span>
                            <span>/admin/disputes/:id/resolve</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-emerald-700/50">
                        <p className="text-xs text-emerald-400 mb-2">Connected Service</p>
                        <div className="flex items-center gap-2 font-mono text-sm">
                            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'SUCCESS' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            {baseUrl}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;