import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, markAlertRead, deleteAlert, bulkDeleteAlerts } from '../api/audit';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';

const SEV_COLORS = {
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AlertsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const qc = useQueryClient();
    const isAdmin = ['ADMIN', 'GLOBAL_ADMIN'].includes(user?.role);
    const [page, setPage] = useState(1);
    const [severity, setSeverity] = useState('');
    const [type, setType] = useState('');
    const [selected, setSelected] = useState([]);

    const { data, isLoading } = useQuery({
        queryKey: ['alerts', page, severity, type],
        queryFn: () => getAlerts({ page, limit: 20, severity: severity || undefined, type: type || undefined }).then(r => r.data),
    });

    const markMut = useMutation({
        mutationFn: markAlertRead,
        onSuccess: () => qc.invalidateQueries(['alerts']),
    });

    const deleteMut = useMutation({
        mutationFn: deleteAlert,
        onSuccess: () => {
            toast.success('Alert deleted');
            qc.invalidateQueries(['alerts']);
        },
        onError: () => toast.error('Failed to delete alert'),
    });

    const bulkDeleteMut = useMutation({
        mutationFn: bulkDeleteAlerts,
        onSuccess: (res) => {
            toast.success(res.data.message);
            setSelected([]);
            qc.invalidateQueries(['alerts']);
        },
        onError: () => toast.error('Failed to delete alerts'),
    });

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const toggleAll = () => {
        const ids = data?.alerts?.map(a => a.id) || [];
        setSelected(prev => prev.length === ids.length ? [] : ids);
    };

    const handleBulkDelete = () => {
        if (selected.length === 0) return;
        if (!confirm(`Delete ${selected.length} alert(s)?`)) return;
        bulkDeleteMut.mutate(selected);
    };

    const alerts = data?.alerts || [];

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Alerts" subtitle="System notifications and warnings">
                {isAdmin && selected.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleteMut.isPending}
                        className="pf-btn text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    >
                        🗑 Delete {selected.length} selected
                    </button>
                )}
            </PageHeader>

            {/* Filters */}
            <div className="glass-card p-4 mb-5 flex flex-wrap gap-3">
                <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }} className="pf-select w-auto text-xs">
                    <option value="">All Severity</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>
                <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="pf-select w-auto text-xs">
                    <option value="">All Types</option>
                    <option value="LOW_OEE">Low OEE</option>
                    <option value="DOWNTIME">Downtime</option>
                    <option value="QUALITY">Quality</option>
                    <option value="SYSTEM">System</option>
                </select>
            </div>

            {isLoading ? <SkeletonTable rows={6} cols={5} /> : alerts.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="text-5xl mb-4 opacity-30">🔔</div>
                    <p className="text-pf-muted text-sm">No alerts to display</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="pf-table">
                        <thead>
                            <tr>
                                {isAdmin && (
                                    <th className="w-10">
                                        <input type="checkbox" checked={selected.length === alerts.length && alerts.length > 0}
                                            onChange={toggleAll} className="accent-pf-accent" />
                                    </th>
                                )}
                                <th>Severity</th>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Message</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map(a => (
                                <tr key={a.id} className={a.isRead ? 'opacity-60' : ''}>
                                    {isAdmin && (
                                        <td>
                                            <input type="checkbox" checked={selected.includes(a.id)}
                                                onChange={() => toggleSelect(a.id)} className="accent-pf-accent" />
                                        </td>
                                    )}
                                    <td>
                                        <span className={`pf-badge ${SEV_COLORS[a.severity] || ''}`}>
                                            {a.severity}
                                        </span>
                                    </td>
                                    <td className="text-xs text-pf-muted">{a.type}</td>
                                    <td className="font-medium text-pf-text">{a.title}</td>
                                    <td className="text-xs text-pf-muted max-w-[250px] truncate">{a.message}</td>
                                    <td className="text-xs text-pf-muted whitespace-nowrap">
                                        {new Date(a.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {!a.isRead && (
                                                <button onClick={() => markMut.mutate(a.id)} className="text-xs text-pf-accent hover:underline">
                                                    Mark read
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => { if (confirm('Delete this alert?')) deleteMut.mutate(a.id); }}
                                                    className="text-xs text-red-400 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-pf-muted">Page {data.page} of {data.pages} · {data.total} total</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="pf-btn-ghost text-xs">← Prev</button>
                        <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="pf-btn-ghost text-xs">Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
