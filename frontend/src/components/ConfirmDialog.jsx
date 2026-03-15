import { useState } from 'react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel, children }) {
    if (!open) return null;

    const btnClass = variant === 'danger' ? 'pf-btn-danger' : 'pf-btn-primary';

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
            <div className="glass-card-lg p-8 w-[440px] max-w-[90vw] animate-scale-in shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
                <h3 className="font-mono text-lg font-bold text-pf-text mb-2">{title}</h3>
                <p className="text-sm text-pf-muted mb-4">{message}</p>
                {children && <div className="mb-4">{children}</div>}
                <div className="flex gap-3 mt-6">
                    <button onClick={onConfirm} className={btnClass}>{confirmLabel}</button>
                    <button onClick={onCancel} className="pf-btn-ghost">{cancelLabel}</button>
                </div>
            </div>
        </div>
    );
}
 