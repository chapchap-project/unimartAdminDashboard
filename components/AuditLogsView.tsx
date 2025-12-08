import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { Shield, Clock, User, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs</h2>
        <p className="text-slate-500 mt-1">Track administrative actions and system security events.</p>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-4">
        {logs.map((log) => (
            <div key={log.id} className="relative pl-8 group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors ${
                    log.severity === 'HIGH' ? 'bg-red-500' : 
                    log.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-indigo-500'
                }`}></div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase tracking-wider">
                                {log.action.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={12} /> {log.timestamp}
                            </span>
                        </div>
                        {log.severity === 'HIGH' && (
                             <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                <AlertTriangle size={12} /> High Severity
                             </span>
                        )}
                    </div>
                    
                    <h4 className="text-slate-800 font-semibold text-lg flex items-center gap-2">
                        {log.details}
                    </h4>
                    
                    <div className="mt-3 flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-indigo-500"/>
                            Admin: <span className="text-slate-700 font-medium">{log.adminName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400"/>
                            Target: <span className="text-slate-700 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{log.target}</span>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
      
      <div className="text-center pt-4">
        <button className="text-sm text-slate-400 hover:text-indigo-600 font-medium transition-colors">
            Load Older Logs
        </button>
      </div>
    </div>
  );
};

export default AuditLogsView;