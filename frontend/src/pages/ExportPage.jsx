import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportLogs } from '../api/entries';
import { getLines } from '../api/lines';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';

export default function ExportPage() {
  const toast = useToast();
  const [params, setParams] = useState({ days: '30', lineId: '', status: '' });
  const [loading, setLoading] = useState(false);
  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const { data: lines = [] } = useQuery({
    queryKey: ['lines'],
    queryFn: () => getLines().then(r => r.data),
  });

  const doExport = async () => {
    setLoading(true);
    try {
      const { data } = await exportLogs(params);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantflow_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file exported successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[700px] animate-fade-in">
      <PageHeader title="Data Export" subtitle="Export shift log data as a XLSX file for reporting." />

      <div className="glass-card p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <div>
            <label className="pf-label">Date Range</label>
            <select value={params.days} onChange={e => setP('days', e.target.value)} className="pf-select">
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="pf-label">Production Line</label>
            <select value={params.lineId} onChange={e => setP('lineId', e.target.value)} className="pf-select">
              <option value="">All Lines</option>
              {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="pf-label">Status</label>
            <select value={params.status} onChange={e => setP('status', e.target.value)} className="pf-select">
              <option value="">All Status</option>
              {['PENDING', 'APPROVED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="glass-card-sm px-5 py-3.5 mb-6 text-[13px] text-pf-muted flex items-start gap-2">
          <span className="text-base">💡</span>
          <span>Exports a styled Excel sheet with: date, shift, plant, line, SKU, production figures, OEE scores, downtime, status, operator, and reviewer.</span>
        </div>

        <button onClick={doExport} disabled={loading} className="pf-btn-primary">
          {loading ? 'Exporting...' : '⬇ Export Excel'}
        </button>
      </div>
    </div>
  );
}