import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    title: string;
    message?: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (title: string, message?: string, type?: ToastType) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    const success = (title: string, message?: string) => addToast(title, message, 'success');
    const error = (title: string, message?: string) => addToast(title, message, 'error');

    return (
        <ToastContext.Provider value={{ toast: addToast, success, error }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-0 right-0 p-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-md w-full">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={18} />,
        error: <XCircleIcon className="text-rose-500" size={18} />,
        warning: <AlertTriangle className="text-amber-500" size={18} />,
        info: <Info className="text-emerald-500" size={18} />,
    };

    const bgStyles = {
        success: 'bg-white border-emerald-100',
        error: 'bg-white border-rose-100',
        warning: 'bg-white border-amber-100',
        info: 'bg-white border-emerald-100',
    };

    return (
        <div className={`pointer-events-auto w-full bg-white border rounded-xl shadow-2xl p-4 flex items-start gap-4 animate-in slide-in-from-right-full duration-300 ${bgStyles[toast.type]}`}>
            <div className="mt-0.5 shrink-0">
                {icons[toast.type]}
            </div>
            <div className="flex-1 min-w-0">
                <h5 className="text-sm font-bold text-slate-900 leading-tight">{toast.title}</h5>
                {toast.message && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{toast.message}</p>}
            </div>
            <button
                onClick={onRemove}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};

// Internal icon component to avoid importing X again
const XCircleIcon = ({ className, size }: { className?: string; size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
    </svg>
);
