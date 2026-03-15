import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';

const ACTION_LABELS = {
    ENTRY_CREATED: { label: 'Entry Created', color: 'bg-blue-500/15 text-blue-400' },
    SHIFT_LOG_CREATED: { label: 'Log Created', color: 'bg-blue-500/15 text-blue-400' },
    STATUS_UPDATED: { label: 'Status Updated', color: 'bg-amber-500/15 text-amber-400' },
    LOG_APPROVED: { label: 'Log Approved', color: 'bg-green-500/15 text-green-400' },
    LOG_REJECTED: { label: 'Log Rejected', color: 'bg-red-500/15 text-red-400' },
    USER_CREATED: { label: 'User Created', color: 'bg-purple-500/15 text-purple-400' },
    USER_UPDATED: { label: 'User Updated', color: 'bg-purple-500/15 text-purple-400' },
    USER_DEACTIVATED: { label: 'User Deactivated', color: 'bg-red-500/15 text-red-400' },
    PASSWORD_CHANGED: { label: 'Password Changed', color: 'bg-amber-500/15 text-amber-400' },
    PLANT_CREATED: { label: 'Plant Created', color: 'bg-teal-500/15 text-teal-400' },
    PLANT_UPDATED: { label: 'Plant Updated', color: 'bg-teal-500/15 text-teal-400' },
};

export default function AuditLogPage() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', page, actionFilter],
        queryFn: () => getAuditLogs({ page, limit: 20, action: actionFilter || undefined }).then(r => r.data),
    });

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Activity Log" subtitle="Track all actions performed in the system.">
                <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="pf-select w-auto text-xs">
                    <option value="">All Actions</option>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </PageHeader>

            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={5} />
                ) : !data?.logs?.length ? (
                    <div className="py-16 text-center text-pf-muted">
                        <div className="text-5xl mb-4 opacity-30">📜</div>
                        <p>No audit logs found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="pf-table">
                                <thead>
                                    <tr>{['Time', 'User', 'Action', 'Details', 'Target ID'].map(h => <th key={h}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {data.logs.map(l => {
                                        const act = ACTION_LABELS[l.action] || { label: l.action, color: 'bg-gray-500/15 text-gray-400' };
                                        return (
                                            <tr key={l.id}>
                                                <td className="text-xs text-pf-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <div className="text-[13px] font-medium text-pf-text">{l.userName || '—'}</div>
                                                </td>
                                                <td><span className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full ${act.color}`}>{act.label}</span></td>
                                                <td className="text-xs text-pf-muted max-w-[200px] truncate">{l.details || '—'}</td>
                                                <td className="text-xs text-pf-muted font-mono">{l.targetId || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {data.pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-pf-border">
                                <span className="text-xs text-pf-muted">Page {data.page} of {data.pages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="pf-btn-ghost text-xs py-1.5 px-3">← Previous</button>
                                    <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="pf-btn-ghost text-xs py-1.5 px-3">Next →</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
