import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductionEntries, reviewProductionEntry } from '../../api/production';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonTable } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

const BADGE_CLASS = {
    PENDING: 'pf-badge-pending',
    APPROVED: 'pf-badge-approved',
    REJECTED: 'pf-badge-rejected',
};

const SHIFT_LABELS = { A: 'Shift A', B: 'Shift B', C: 'Shift C', GENERAL: 'General' };

export default function ReviewDmsPage() {
    const qc = useQueryClient();
    const toast = useToast();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: 'PENDING', shift: '', date: '' });
    const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

    const [rejectDialog, setRejectDialog] = useState({ open: false, entryId: null });

    const buildParams = () => {
        const p = { page, limit: 15 };
        if (filters.status) p.status = filters.status;
        if (filters.shift) p.shift = filters.shift;
        if (filters.date) { p.from = filters.date; p.to = filters.date; }
        return p;
    };

    const { data, isLoading } = useQuery({
        queryKey: ['dms-review', filters, page],
        queryFn: () => getProductionEntries(buildParams()).then(r => r.data),
    });

    const mutation = useMutation({
        mutationFn: ({ id, status }) => reviewProductionEntry(id, status),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['dms-review'] });
            toast.success(`Entry ${vars.status.toLowerCase()} successfully.`);
        },
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update status.'),
    });

    const handleApprove = (id) => mutation.mutate({ id, status: 'APPROVED' });
    const handleRejectClick = (id) => setRejectDialog({ open: true, entryId: id });
    const handleRejectConfirm = () => {
        mutation.mutate({ id: rejectDialog.entryId, status: 'REJECTED' });
        setRejectDialog({ open: false, entryId: null });
    };

    const getTotal = (e) => (e.volumeKhsPdw || 0) + (e.volumeKronesCsd || 0) + (e.volumeTetra || 0);

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <div className="glass-card overflow-hidden">
                {/* Header + Filters */}
                <div className="px-5 py-4 border-b border-pf-border flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 className="font-mono text-lg font-semibold text-pf-text">Review Production Entries</h2>
                        <p className="text-xs text-pf-muted mt-0.5">Approve or reject daily production data submissions</p>
                    </div>
                    <div className="flex gap-2.5 flex-wrap">
                        <select value={filters.status} onChange={e => setF('status', e.target.value)} className="pf-select text-xs w-auto">
                            <option value="">All Status</option>
                            {['PENDING', 'APPROVED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={filters.shift} onChange={e => setF('shift', e.target.value)} className="pf-select text-xs w-auto">
                            <option value="">All Shifts</option>
                            {['A', 'B', 'C', 'GENERAL'].map(s => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}
                        </select>
                        <input type="date" value={filters.date} onChange={e => setF('date', e.target.value)} className="pf-input text-xs w-auto" />
                        <button onClick={() => { setFilters({ status: 'PENDING', shift: '', date: '' }); setPage(1); }} className="pf-btn-ghost text-xs py-2 px-3">Reset</button>
                    </div>
                </div>

                {isLoading ? (
                    <SkeletonTable rows={6} cols={9} />
                ) : !data?.entries?.length ? (
                    <div className="py-16 text-center text-pf-muted">
                        <div className="text-5xl mb-4 opacity-30">✓</div>
                        <p>No production entries match filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="pf-table">
                                <thead>
                                    <tr>
                                        {['Date', 'Shift', 'Submitted By', 'KHS PDW', 'Krones CSD', 'Tetra', 'Total Vol', 'Status', 'Actions'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.entries.map(e => (
                                        <tr key={e.id}>
                                            <td className="text-xs">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <span className={`pf-badge ${e.shift === 'GENERAL' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                                                    {SHIFT_LABELS[e.shift] || e.shift}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-[13px] font-medium text-pf-text">{e.submittedBy?.name || 'Unknown'}</div>
                                                {e.submittedBy?.empId && <div className="text-[10px] text-pf-muted">{e.submittedBy.empId}</div>}
                                            </td>
                                            <td className="font-mono text-[13px]">{(e.volumeKhsPdw || 0).toLocaleString()}</td>
                                            <td className="font-mono text-[13px]">{(e.volumeKronesCsd || 0).toLocaleString()}</td>
                                            <td className="font-mono text-[13px]">{(e.volumeTetra || 0).toLocaleString()}</td>
                                            <td className="font-bold text-pf-accent">{getTotal(e).toLocaleString()}</td>
                                            <td><span className={BADGE_CLASS[e.status]}>{e.status}</span></td>
                                            <td>
                                                {e.status === 'PENDING' ? (
                                                    <div className="flex gap-1.5">
                                                        <button onClick={() => handleApprove(e.id)} disabled={mutation.isPending} className="pf-btn-success text-xs py-1 px-2.5">✓ Approve</button>
                                                        <button onClick={() => handleRejectClick(e.id)} disabled={mutation.isPending} className="pf-btn-danger text-xs py-1 px-2.5">✗ Reject</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-pf-muted">
                                                        by {e.reviewedBy?.name || '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {data.pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-pf-border">
                                <span className="text-xs text-pf-muted">Page {data.page} of {data.pages} · {data.total} total</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="pf-btn-ghost text-xs py-1.5 px-3">← Previous</button>
                                    <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="pf-btn-ghost text-xs py-1.5 px-3">Next →</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sequential Flow Indicator */}
            <div className="glass-card p-5 mt-6">
                <h3 className="text-xs text-pf-muted uppercase tracking-[1.5px] font-semibold mb-4">Approval Pipeline</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {['📝 Data Entry', '⏳ Pending Review', '✅ Approved', '📊 Dashboard'].map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${i === 0 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                    i === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        i === 2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                {step}
                            </div>
                            {i < 3 && <span className="text-pf-muted text-lg">→</span>}
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-pf-muted mt-3">
                    Data flows sequentially: operators enter data → supervisors review → approved data appears in dashboards & reports.
                </p>
            </div>

            <ConfirmDialog
                open={rejectDialog.open}
                title="Reject Production Entry"
                message="Are you sure you want to reject this production entry? This cannot be undone."
                confirmLabel="Reject Entry"
                variant="danger"
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectDialog({ open: false, entryId: null })}
            />
        </div>
    );
}
