import React, { useState } from 'react';
import { api } from '../services/api';
import { getApiKey, setApiKey, getModel, setModel, testApiKey } from '../services/aiService';
import {
    Save, Server, Globe, CheckCircle, XCircle, RefreshCw, Key,
    Eye, EyeOff, Sparkles, Loader2, AlertCircle,
} from 'lucide-react';

const SettingsView: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState(api.getBaseUrl());
    const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');

    const [openRouterKey, setOpenRouterKey] = useState(getApiKey());
    const [aiModel, setAiModel] = useState(getModel());
    const [showKey, setShowKey] = useState(false);
    const [keyTestStatus, setKeyTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');
    const [keyTestError, setKeyTestError] = useState('');

    const handleSaveBackend = () => {
        api.setBaseUrl(baseUrl);
        window.location.reload();
    };

    const handleSaveAI = () => {
        setApiKey(openRouterKey);
        setModel(aiModel);
    };

    const handleTestBackend = async () => {
        setConnectionStatus('TESTING');
        const original = api.getBaseUrl();
        api.setBaseUrl(baseUrl);
        const ok = await api.testConnection();
        setConnectionStatus(ok ? 'SUCCESS' : 'FAILED');
        if (!ok) api.setBaseUrl(original);
    };

    const handleTestAI = async () => {
        if (!openRouterKey.trim()) {
            setKeyTestStatus('FAILED');
            setKeyTestError('Enter an API key first.');
            return;
        }
        setKeyTestStatus('TESTING');
        setKeyTestError('');
        const result = await testApiKey(openRouterKey);
        if (result.success) {
            setKeyTestStatus('SUCCESS');
        } else {
            setKeyTestStatus('FAILED');
            setKeyTestError(result.error || 'Test failed.');
        }
    };

    const POPULAR_MODELS = [
        { label: 'DeepSeek V3 (Free) — Recommended', value: 'deepseek/deepseek-chat-v3-0324:free' },
        { label: 'DeepSeek R1 (Free) — Best reasoning', value: 'deepseek/deepseek-r1:free' },
        { label: 'Gemini 2.5 Pro (Free)', value: 'google/gemini-2.5-pro-exp-03-25:free' },
        { label: 'Gemini 2.0 Flash (Free)', value: 'google/gemini-2.0-flash-exp:free' },
        { label: 'Llama 4 Maverick (Free)', value: 'meta-llama/llama-4-maverick:free' },
        { label: 'Llama 3.3 70B (Free)', value: 'meta-llama/llama-3.3-70b-instruct:free' },
        { label: 'Qwen3 235B (Free)', value: 'qwen/qwen3-235b-a22b:free' },
        { label: 'Mistral Small 3.1 24B (Free)', value: 'mistralai/mistral-small-3.1-24b-instruct:free' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h2>
                <p className="text-slate-500 mt-1">Configure your dashboard connections and AI preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Backend API */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Server size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">API Connection</h3>
                            <p className="text-xs text-slate-400">Manage backend endpoint</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Backend API URL</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => { setBaseUrl(e.target.value); setConnectionStatus('IDLE'); }}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-slate-800"
                                    placeholder="https://api.unimarket.edu/v1"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Base URL for all dashboard requests.</p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                                {connectionStatus === 'TESTING' && <RefreshCw className="animate-spin text-emerald-500" size={16} />}
                                {connectionStatus === 'SUCCESS' && <CheckCircle className="text-emerald-500" size={16} />}
                                {connectionStatus === 'FAILED' && <XCircle className="text-red-500" size={16} />}
                                <span className={`text-sm font-medium ${connectionStatus === 'SUCCESS' ? 'text-emerald-600' : connectionStatus === 'FAILED' ? 'text-red-600' : 'text-slate-400'}`}>
                                    {connectionStatus === 'IDLE' && 'Ready to test'}
                                    {connectionStatus === 'TESTING' && 'Testing…'}
                                    {connectionStatus === 'SUCCESS' && 'Connected'}
                                    {connectionStatus === 'FAILED' && 'Connection failed'}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleTestBackend} disabled={connectionStatus === 'TESTING'} className="text-sm font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50">
                                    Test
                                </button>
                                <button onClick={handleSaveBackend} className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-800">
                                    <Save size={14} /> Save &amp; Reload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Documentation */}
                <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16" />
                    <h3 className="font-bold text-lg mb-2 relative z-10">API Documentation</h3>
                    <p className="text-emerald-200 text-sm mb-6 relative z-10">
                        Ensure your backend endpoints match the expected structure.
                    </p>
                    <div className="space-y-2 relative z-10">
                        {[['GET', '/admin/users'], ['GET', '/admin/listings'], ['POST', '/admin/disputes/:id/resolve']].map(([method, path]) => (
                            <div key={path} className="flex items-center gap-3 text-sm bg-emerald-800/50 p-3 rounded-lg border border-emerald-700">
                                <span className="font-mono text-emerald-300">{method}</span>
                                <span>{path}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-emerald-700/50 relative z-10">
                        <p className="text-xs text-emerald-400 mb-1">Connected Service</p>
                        <div className="flex items-center gap-2 font-mono text-sm">
                            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'SUCCESS' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            {baseUrl}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Intelligence */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">AI Intelligence</h3>
                        <p className="text-xs text-slate-400">OpenRouter key for dashboard insights &amp; listing safety analysis</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                        {/* API Key */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">OpenRouter API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={openRouterKey}
                                    onChange={(e) => { setOpenRouterKey(e.target.value); setKeyTestStatus('IDLE'); }}
                                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-mono bg-white text-slate-800"
                                    placeholder="sk-or-v1-…"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                Get a free key at <span className="font-semibold text-violet-600">openrouter.ai/keys</span>. Stored in browser localStorage — never sent to the backend.
                            </p>
                        </div>

                        {/* Model */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">AI Model</label>
                            <select
                                value={aiModel}
                                onChange={(e) => setAiModel(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                {POPULAR_MODELS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                                {!POPULAR_MODELS.find(m => m.value === aiModel) && (
                                    <option value={aiModel}>{aiModel} (custom)</option>
                                )}
                            </select>
                            <p className="text-xs text-slate-400 mt-1.5">All listed models are free on OpenRouter — no usage costs.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={handleTestAI}
                                disabled={keyTestStatus === 'TESTING'}
                                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                            >
                                {keyTestStatus === 'TESTING' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                                Test Key
                            </button>
                            <button
                                onClick={handleSaveAI}
                                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-violet-100 transition-all"
                            >
                                <Save size={15} /> Save
                            </button>

                            <div className="flex items-center gap-1.5 ml-auto">
                                {keyTestStatus === 'TESTING' && <span className="text-xs text-slate-400">Checking…</span>}
                                {keyTestStatus === 'SUCCESS' && (
                                    <>
                                        <CheckCircle size={15} className="text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-semibold">Key is valid</span>
                                    </>
                                )}
                                {keyTestStatus === 'FAILED' && (
                                    <>
                                        <XCircle size={15} className="text-red-500" />
                                        <span className="text-xs text-red-600 font-semibold">{keyTestError}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info panel */}
                    <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Features</p>
                        {[
                            { icon: Sparkles, title: 'Dashboard Intelligence', desc: 'Executive summary of platform metrics, anomalies, and weekly trends.' },
                            { icon: AlertCircle, title: 'Listing Safety Analysis', desc: 'Per-listing risk assessment with reasoning and suggested admin action.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <Icon size={15} className="text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Your API key is stored only in your browser's localStorage. It is never sent to the Unimarket backend.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
