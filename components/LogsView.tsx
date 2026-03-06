import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, RefreshCw, AlertCircle, File, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/api';

interface LogFile {
  filename: string;
  size: number;
  modifiedAt: string;
}

const LogsView: React.FC = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogFiles();
  }, []);

  const fetchLogFiles = async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const files = await api.getLogFiles();
      setLogFiles(files);
      if (files.length > 0 && !selectedFile) {
        handleSelectFile(files[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch log files');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSelectFile = async (file: LogFile) => {
    setSelectedFile(file);
    setIsLoadingContent(true);
    setError(null);
    setLogContent('');
    try {
      const content = await api.getLogContent(file.filename);
      setLogContent(content);
      // Scroll to bottom after a short delay to ensure rendering
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch log content');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const refreshCurrentLog = () => {
    if (selectedFile) handleSelectFile(selectedFile);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = logFiles.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));

  const downloadLog = () => {
    if (!selectedFile || !logContent) return;
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">System Logs</h2>
            <p className="text-sm text-slate-500">Monitor backend application and error logs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogFiles}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={isLoadingList ? 'animate-spin' : ''} />
            Refresh List
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File List */}
        <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
            {isLoadingList ? (
              <div className="p-4 text-center text-slate-500 text-sm">Loading files...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No log files found</div>
            ) : (
              filteredFiles.map(file => (
                <button
                  key={file.filename}
                  onClick={() => handleSelectFile(file)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors ${
                    selectedFile?.filename === file.filename 
                      ? 'bg-emerald-50 border border-emerald-100' 
                      : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File size={16} className={selectedFile?.filename === file.filename ? 'text-emerald-500' : 'text-slate-400'} />
                    <div className="truncate">
                      <p className={`text-sm font-medium truncate ${selectedFile?.filename === file.filename ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {file.filename}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatSize(file.size)} • {new Date(file.modifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {selectedFile?.filename === file.filename && (
                    <ChevronRight size={16} className="text-emerald-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content - Log Viewer */}
        <div className="flex-1 flex flex-col bg-white">
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} className="mb-4 text-slate-200" />
              <p>Select a log file to view its contents</p>
            </div>
          ) : (
            <>
              {/* File Info Bar */}
              <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-slate-700">{selectedFile.filename}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">{formatSize(selectedFile.size)}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Last modified: {new Date(selectedFile.modifiedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadLog}
                    disabled={!logContent || isLoadingContent}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Download Log"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={refreshCurrentLog}
                    disabled={isLoadingContent}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh Content"
                  >
                    <RefreshCw size={18} className={isLoadingContent ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Log Content Area */}
              <div 
                className="flex-1 bg-[#1e1e1e] overflow-hidden relative"
              >
                {isLoadingContent ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]/80 z-10">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-300 text-sm font-medium">Loading log content...</p>
                    </div>
                  </div>
                ) : null}
                <div 
                  ref={contentRef}
                  className="w-full h-full overflow-auto p-4 font-mono text-sm leading-relaxed"
                >
                  <pre className={`whitespace-pre-wrap word-break h-full ${logContent ? 'text-slate-300' : 'text-slate-500 italic'}`}>
                    {logContent || 'File is empty.'}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsView;
