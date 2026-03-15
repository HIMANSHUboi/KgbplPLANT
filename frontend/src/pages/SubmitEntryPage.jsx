import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createShiftLog } from '../api/entries';
import { getLines, getEquipment } from '../api/lines';
import { getSKUs } from '../api/skus';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';

const SHIFTS = ['A', 'B', 'C'];

export default function SubmitEntryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const emptyForm = {
    date: today, shift: '', lineId: '', skuId: '', skuName: '',
    targetQty: '', grossProduction: '', rejectedQty: '0',
    plannedDowntime: '30', unplannedDowntime: '0', changeoverTime: '0',
    remarks: '',
    downtimeLogs: [],
    qualityLogs: [],
    utilityLogs: [],
  };

  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Downtime log sub-entry
  const [dtEntry, setDtEntry] = useState({ equipmentId: '', type: 'UNPLANNED', durationMins: '', reason: '', actionTaken: '' });

  const { data: lines = [] } = useQuery({
    queryKey: ['lines'],
    queryFn: () => getLines().then(r => r.data),
  });

  const { data: skus = [] } = useQuery({
    queryKey: ['skus'],
    queryFn: () => getSKUs().then(r => r.data),
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', form.lineId],
    queryFn: () => getEquipment(form.lineId).then(r => r.data),
    enabled: !!form.lineId,
  });

  const mutation = useMutation({
    mutationFn: createShiftLog,
    onSuccess: () => {
      toast.success('Shift log submitted successfully! Pending supervisor review.');
      setForm(emptyForm);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Submission failed. Please try again.');
    },
  });

  const addDowntimeEntry = () => {
    if (!dtEntry.equipmentId || !dtEntry.durationMins || !dtEntry.reason) {
      toast.error('Equipment, duration and reason are required for downtime entry.');
      return;
    }
    setForm(f => ({ ...f, downtimeLogs: [...f.downtimeLogs, { ...dtEntry }] }));
    setDtEntry({ equipmentId: '', type: 'UNPLANNED', durationMins: '', reason: '', actionTaken: '' });
  };

  const removeDowntimeEntry = (i) => {
    setForm(f => ({ ...f, downtimeLogs: f.downtimeLogs.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.lineId) { toast.error('Please select a production line.'); return; }
    if (!form.shift) { toast.error('Please select a shift.'); return; }
    mutation.mutate(form);
  };

  const gross = parseInt(form.grossProduction) || 0;
  const rejected = parseInt(form.rejectedQty) || 0;
  const goodQty = gross - rejected;

  return (
    <div className="p-6 lg:p-8 max-w-[900px] animate-fade-in">
      <PageHeader title="New Shift Log" subtitle="Submit production data for your shift. All entries are reviewed before approval." />

      <div className="glass-card p-6 lg:p-8">
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div>
              <label className="pf-label">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} max={today} className="pf-input" required />
            </div>
            <div>
              <label className="pf-label">Shift</label>
              <select value={form.shift} onChange={e => set('shift', e.target.value)} className="pf-select" required>
                <option value="">Select shift...</option>
                {SHIFTS.map(s => <option key={s} value={s}>Shift {s}</option>)}
              </select>
            </div>
            <div>
              <label className="pf-label">Production Line</label>
              <select value={form.lineId} onChange={e => set('lineId', e.target.value)} className="pf-select" required>
                <option value="">Select line...</option>
                {lines.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
              </select>
            </div>
          </div>

          {/* SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="pf-label">SKU</label>
              <select value={form.skuId} onChange={e => set('skuId', e.target.value)} className="pf-select">
                <option value="">Select SKU (optional)...</option>
                {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="pf-label">SKU Name (if not in list)</label>
              <input type="text" value={form.skuName} onChange={e => set('skuName', e.target.value)} placeholder="e.g. 500ml PET Water" className="pf-input" />
            </div>
          </div>

          {/* Production Data */}
          <h4 className="font-mono text-sm font-semibold text-pf-text mb-3 mt-4">Production Data</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div>
              <label className="pf-label">Target Qty</label>
              <input type="number" value={form.targetQty} onChange={e => set('targetQty', e.target.value)} placeholder="e.g. 5000" min="0" className="pf-input" required />
            </div>
            <div>
              <label className="pf-label">Gross Production</label>
              <input type="number" value={form.grossProduction} onChange={e => set('grossProduction', e.target.value)} placeholder="e.g. 4800" min="0" className="pf-input" required />
            </div>
            <div>
              <label className="pf-label">Rejected Qty</label>
              <input type="number" value={form.rejectedQty} onChange={e => set('rejectedQty', e.target.value)} placeholder="0" min="0" className="pf-input" />
            </div>
          </div>

          {gross > 0 && (
            <div className="glass-card-sm px-5 py-3 mb-6 flex items-center justify-between">
              <span className="text-xs text-pf-muted">Good Qty: <strong className="text-pf-green">{goodQty}</strong></span>
              <span className="text-xs text-pf-muted">Quality: <strong className={goodQty / gross >= 0.95 ? 'text-pf-green' : 'text-pf-amber'}>{gross > 0 ? ((goodQty / gross) * 100).toFixed(1) : 0}%</strong></span>
            </div>
          )}

          {/* Downtime Data */}
          <h4 className="font-mono text-sm font-semibold text-pf-text mb-3">Downtime & Changeover</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div>
              <label className="pf-label">Planned Downtime (min)</label>
              <input type="number" value={form.plannedDowntime} onChange={e => set('plannedDowntime', e.target.value)} min="0" className="pf-input" />
            </div>
            <div>
              <label className="pf-label">Unplanned Downtime (min)</label>
              <input type="number" value={form.unplannedDowntime} onChange={e => set('unplannedDowntime', e.target.value)} min="0" className="pf-input" />
            </div>
            <div>
              <label className="pf-label">Changeover Time (min)</label>
              <input type="number" value={form.changeoverTime} onChange={e => set('changeoverTime', e.target.value)} min="0" className="pf-input" />
            </div>
          </div>

          {/* Downtime Logs */}
          {form.lineId && (
            <div className="mb-6">
              <h4 className="font-mono text-sm font-semibold text-pf-text mb-3">Downtime Breakdown (Optional)</h4>
              {form.downtimeLogs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {form.downtimeLogs.map((dt, i) => {
                    const eq = equipment.find(e => e.id === parseInt(dt.equipmentId));
                    return (
                      <div key={i} className="flex items-center gap-3 border border-pf-border rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                        <span className="text-pf-text font-medium">{eq?.name || `Equip #${dt.equipmentId}`}</span>
                        <span className={dt.type === 'PLANNED' ? 'text-pf-accent' : 'text-pf-amber'}>{dt.type}</span>
                        <span className="text-pf-muted">{dt.durationMins}m</span>
                        <span className="text-pf-muted flex-1 truncate">{dt.reason}</span>
                        <button type="button" onClick={() => removeDowntimeEntry(i)} className="text-pf-red hover:text-pf-red/80">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                <select value={dtEntry.equipmentId} onChange={e => setDtEntry(d => ({ ...d, equipmentId: e.target.value }))} className="pf-select text-xs">
                  <option value="">Equipment</option>
                  {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                </select>
                <select value={dtEntry.type} onChange={e => setDtEntry(d => ({ ...d, type: e.target.value }))} className="pf-select text-xs">
                  <option value="UNPLANNED">Unplanned</option>
                  <option value="PLANNED">Planned</option>
                </select>
                <input type="number" value={dtEntry.durationMins} onChange={e => setDtEntry(d => ({ ...d, durationMins: e.target.value }))} placeholder="Min" min="1" className="pf-input text-xs" />
                <input type="text" value={dtEntry.reason} onChange={e => setDtEntry(d => ({ ...d, reason: e.target.value }))} placeholder="Reason" className="pf-input text-xs" />
                <button type="button" onClick={addDowntimeEntry} className="pf-btn-ghost text-xs py-2">+ Add</button>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="mb-6">
            <label className="pf-label">Remarks (optional)</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              placeholder="Any notes about this shift..." rows={3}
              className="pf-input resize-y" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="pf-btn-primary">
              {mutation.isPending ? 'Submitting...' : 'Submit Shift Log →'}
            </button>
            <button type="button" onClick={() => setForm(emptyForm)} className="pf-btn-ghost">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}