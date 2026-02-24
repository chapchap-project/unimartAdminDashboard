import React, { useState, useEffect } from 'react';
import { Report } from '../types';
import { AlertCircle, MessageSquare, Gavel, CheckCircle, Search, Clock, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ReportsViewProps {
    initialReportId?: string | null;
    onClearInitial?: () => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ initialReportId, onClearInitial }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await api.getReports();
                setReports(data.reports);
            } catch (e) {
                console.error("Failed to load reports", e);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    useEffect(() => {
        if (initialReportId && reports.length > 0) {
            const report = reports.find(r => r.id === initialReportId);
            if (report) {
                setSelectedReport(report);
                if (onClearInitial) onClearInitial();
            }
        }
    }, [initialReportId, reports, onClearInitial]);

    const handleStatusChange = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
        const report = reports.find(r => r.id === reportId);
        // Optimistic Update
        setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
        setSelectedReport(null);
        try {
            await api.updateReportStatus(reportId, status);
            if (report) {
                api.createAuditLog(
                    status === 'RESOLVED' ? 'RESOLVE_DISPUTE' : 'DISMISS_REPORT',
                    reportId,
                    `${status === 'RESOLVED' ? 'Resolved' : 'Dismissed'} report [${report.reason}] by ${report.reporter.name}. Target entity: ${report.type === 'LISTING' ? report.listing?.id : report.reportedUser?.id}`
                );
            }
        } catch (e) {
            console.error("Failed to update report status", e);
        }
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'ALL') return true;
        return r.status === filter;
    });

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
    }

    return (
        <div className="space-y-6 pb-10 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reports & Moderation</h2>
                    <p className="text-slate-500 mt-1">Review and resolve user and listing reports.</p>
                </div>
                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${filter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reporter</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedReport(report)}>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${report.type === 'LISTING' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                        {report.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-sm">{report.reporter.name}</div>
                                    <div className="text-xs text-slate-400">{report.reporter.universityEmail}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-700 max-w-xs truncate">{report.reason}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {report.type === 'LISTING' ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{report.listing?.title || 'Unknown Listing'}</span>
                                            <span className="text-[10px] text-slate-400">ID: {report.listing?.id.split('-')[0]}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{report.reportedUser?.name || 'Unknown User'}</span>
                                            <span className="text-[10px] text-slate-400">ID: {report.reportedUser?.id.split('-')[0]}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${report.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                        {report.status === 'PENDING' ? <Clock size={12} /> : <CheckCircle size={12} />}
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Review</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detailed Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <Gavel size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Report Details</h2>
                                    <p className="text-sm text-slate-500">Created on {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reporter</h3>
                                    <p className="font-bold text-slate-800">{selectedReport.reporter.name}</p>
                                    <p className="text-sm text-slate-500">{selectedReport.reporter.universityEmail}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target ({selectedReport.type})</h3>
                                    <p className="font-bold text-slate-800">
                                        {selectedReport.type === 'LISTING' ? selectedReport.listing?.title : selectedReport.reportedUser?.name}
                                    </p>
                                    <p className="text-xs font-mono text-slate-400">ID: {selectedReport.type === 'LISTING' ? selectedReport.listing?.id : selectedReport.reportedUser?.id}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason</h3>
                                <p className="text-lg font-bold text-slate-800">{selectedReport.reason}</p>
                            </div>

                            {selectedReport.description && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                                        {selectedReport.description}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedReport.status === 'PENDING' && (
                            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                                <button
                                    onClick={() => handleStatusChange(selectedReport.id, 'DISMISSED')}
                                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                                    Dismiss Report
                                </button>
                                <button
                                    onClick={() => handleStatusChange(selectedReport.id, 'RESOLVED')}
                                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                                    Mark as Resolved
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
