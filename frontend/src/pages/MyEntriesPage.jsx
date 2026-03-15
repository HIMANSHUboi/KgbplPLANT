import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getShiftLogs } from '../api/entries';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';

const BADGE_CLASS = {
  PENDING: 'pf-badge-pending',
  APPROVED: 'pf-badge-approved',
  REJECTED: 'pf-badge-rejected',
};

export default function MyEntriesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['my-shift-logs', page],
    queryFn: () => getShiftLogs({ page, limit: 15 }).then(r => r.data),
  });

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader title="My Submissions" subtitle="Track your shift log entries and their review status." />

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} cols={9} />
        ) : !data?.logs?.length ? (
          <div className="py-16 text-center text-pf-muted">
            <div className="text-5xl mb-4 opacity-30">📋</div>
            <p>No shift logs yet. Submit your first shift log!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="pf-table">
                <thead>
                  <tr>
                    {['Date', 'Shift', 'Line', 'SKU', 'Gross', 'Good', 'OEE %', 'Status', 'Reviewed By'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map(l => (
                    <tr key={l.id}>
                      <td className="text-[13px]">{new Date(l.date).toLocaleDateString()}</td>
                      <td className="text-xs text-pf-muted">Shift {l.shift}</td>
                      <td className="text-[13px]">{l.line?.name || '—'}</td>
                      <td className="text-xs text-pf-muted">{l.sku?.name || l.skuName || '—'}</td>
                      <td className="font-bold text-pf-accent">{l.grossProduction}</td>
                      <td className="text-pf-green">{l.goodQty}</td>
                      <td className={`font-mono font-semibold ${l.oeeScore >= 85 ? 'text-pf-green' : l.oeeScore >= 65 ? 'text-pf-amber' : 'text-pf-red'}`}>
                        {l.oeeScore != null ? `${l.oeeScore}%` : '—'}
                      </td>
                      <td><span className={BADGE_CLASS[l.status]}>{l.status}</span></td>
                      <td className="text-xs text-pf-muted">{l.reviewedBy?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-pf-border">
                <span className="text-xs text-pf-muted">Page {data.page} of {data.pages} · {data.total} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="pf-btn-ghost text-xs py-1.5 px-3">
                    ← Previous
                  </button>
                  <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="pf-btn-ghost text-xs py-1.5 px-3">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}