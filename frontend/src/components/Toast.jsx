import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    const colors = {
        success: 'border-l-pf-green text-pf-green',
        error: 'border-l-pf-red text-pf-red',
        info: 'border-l-pf-accent text-pf-accent',
    };

    return (
        <div
            className={`animate-slide-down glass-card border-l-4 ${colors[toast.type]} px-4 py-3 flex items-start gap-3 min-w-[320px] max-w-[420px] shadow-2xl shadow-black/40`}
        >
            <span className="text-lg mt-0.5 font-bold">{icons[toast.type]}</span>
            <p className="flex-1 text-sm text-pf-text">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-pf-muted hover:text-pf-text transition-colors text-lg leading-none"
            >
                ×
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    const toast = useMemo(() => ({
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    }), [addToast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
