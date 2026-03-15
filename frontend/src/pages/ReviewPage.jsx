import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShiftLogs, updateLogStatus } from '../api/entries';
import { getLines } from '../api/lines';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';

const BADGE_CLASS = {
  PENDING: 'pf-badge-pending',
  APPROVED: 'pf-badge-approved',
  REJECTED: 'pf-badge-rejected',
};

export default function ReviewPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: 'PENDING', lineId: '', date: '' });
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const [rejectDialog, setRejectDialog] = useState({ open: false, logId: null });

  const { data: lines = [] } = useQuery({
    queryKey: ['lines'],
    queryFn: () => getLines().then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shift-logs-review', filters, page],
    queryFn: () => getShiftLogs({ ...filters, page, limit: 15 }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateLogStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shift-logs-review'] });
      toast.success(`Log ${vars.status.toLowerCase()} successfully.`);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update log status.'),
  });

  const handleApprove = (id) => mutation.mutate({ id, status: 'APPROVED' });
  const handleRejectClick = (id) => setRejectDialog({ open: true, logId: id });
  const handleRejectConfirm = () => {
    mutation.mutate({ id: rejectDialog.logId, status: 'REJECTED' });
    setRejectDialog({ open: false, logId: null });
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="glass-card overflow-hidden">
        {/* Header + Filters */}
        <div className="px-5 py-4 border-b border-pf-border flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-mono text-lg font-semibold text-pf-text">Review Shift Logs</h2>
          <div className="flex gap-2.5 flex-wrap">
            <select value={filters.status} onChange={e => setF('status', e.target.value)} className="pf-select text-xs w-auto">
              <option value="">All Status</option>
              {['PENDING', 'APPROVED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.lineId} onChange={e => setF('lineId', e.target.value)} className="pf-select text-xs w-auto">
              <option value="">All Lines</option>
              {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <input type="date" value={filters.date} onChange={e => setF('date', e.target.value)} className="pf-input text-xs w-auto" />
            <button onClick={() => { setFilters({ status: 'PENDING', lineId: '', date: '' }); setPage(1); }} className="pf-btn-ghost text-xs py-2 px-3">Reset</button>
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable rows={6} cols={10} />
        ) : !data?.logs?.length ? (
          <div className="py-16 text-center text-pf-muted">
            <div className="text-5xl mb-4 opacity-30">✓</div>
            <p>No shift logs match filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="pf-table">
                <thead>
                  <tr>
                    {['Date', 'Operator', 'Line', 'Shift', 'Gross', 'Good', 'OEE', 'Downtime', 'Status', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map(l => (
                    <tr key={l.id}>
                      <td className="text-xs">{new Date(l.date).toLocaleDateString()}</td>
                      <td>
                        <div className="text-[13px] font-medium text-pf-text">{l.submittedBy?.name}</div>
                        {l.submittedBy?.empId && <div className="text-[10px] text-pf-muted">{l.submittedBy.empId}</div>}
                        {l.remarks && <div className="text-[11px] text-pf-muted mt-0.5">💬 {l.remarks}</div>}
                      </td>
                      <td className="text-[13px]">{l.line?.name || '—'}</td>
                      <td className="text-[11px] text-pf-muted">Shift {l.shift}</td>
                      <td className="font-bold text-pf-accent">{l.grossProduction}</td>
                      <td className="text-pf-green">{l.goodQty}</td>
                      <td className={`font-mono font-semibold text-xs ${l.oeeScore >= 85 ? 'text-pf-green' : l.oeeScore >= 65 ? 'text-pf-amber' : 'text-pf-red'}`}>
                        {l.oeeScore != null ? `${l.oeeScore}%` : '—'}
                      </td>
                      <td className={`text-[13px] ${l.unplannedDowntime > 30 ? 'text-pf-red' : l.unplannedDowntime > 0 ? 'text-pf-amber' : 'text-pf-muted'}`}>
                        {l.unplannedDowntime}m
                      </td>
                      <td><span className={BADGE_CLASS[l.status]}>{l.status}</span></td>
                      <td>
                        {l.status === 'PENDING' ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleApprove(l.id)} className="pf-btn-success text-xs py-1 px-2.5">✓ Approve</button>
                            <button onClick={() => handleRejectClick(l.id)} className="pf-btn-danger text-xs py-1 px-2.5">✗ Reject</button>
                          </div>
                        ) : <span className="text-xs text-pf-muted">by {l.reviewedBy?.name || '—'}</span>}
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

      <ConfirmDialog
        open={rejectDialog.open}
        title="Reject Shift Log"
        message="Are you sure you want to reject this shift log? This cannot be undone."
        confirmLabel="Reject Log"
        variant="danger"
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectDialog({ open: false, logId: null })}
      />
    </div>
  );
}