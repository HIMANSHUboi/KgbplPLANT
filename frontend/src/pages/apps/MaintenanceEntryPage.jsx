import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import { createMaintenanceEntry } from '../../api/maintenance';

export default function MaintenanceEntryPage() {
    const { user } = useAuth();
    const toast = useToast();
    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        date: today,
        breakdownCount: '', pmCompliance: '',
        steamGenerated: '', fuelUsed: '',
        electricityConsumed: '', solarUnits: '',
        dieselConsumption: '', dgUnits: '',
        eur: '', pur: '', fur: '',
        criticalIssue: '', remarks: '',
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const mutation = useMutation({
        mutationFn: createMaintenanceEntry,
        onSuccess: () => toast.success('Maintenance data saved successfully!'),
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save data'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div className="p-6 lg:p-8 max-w-[900px] animate-fade-in">
            <PageHeader title="Maintenance Data Entry" subtitle={`Equipment maintenance data for ${user?.plant?.name || 'your plant'}`} />

            <form onSubmit={handleSubmit}>
                {/* Basic Fields */}
                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">🔧</span> Basic Info
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="pf-label">Date</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} max={today} className="pf-input" required />
                        </div>
                        <div>
                            <label className="pf-label">Breakdown Count</label>
                            <input type="number" value={form.breakdownCount} onChange={e => set('breakdownCount', e.target.value)} placeholder="Nos." min="0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">PM Compliance <span className="text-amber-400">(%)</span></label>
                            <input type="number" value={form.pmCompliance} onChange={e => set('pmCompliance', e.target.value)} placeholder="%" step="any" className="pf-input" />
                        </div>
                    </div>
                </div>

                {/* Energy & Utilities */}
                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">⚡</span> Energy & Utilities
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="pf-label">Steam Generated <span className="text-pf-muted">(Tons)</span></label>
                            <input type="number" step="any" value={form.steamGenerated} onChange={e => set('steamGenerated', e.target.value)} placeholder="0.0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Fuel Used</label>
                            <input type="number" step="any" value={form.fuelUsed} onChange={e => set('fuelUsed', e.target.value)} placeholder="0.0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Electricity Consumed <span className="text-pf-muted">(Units)</span></label>
                            <input type="number" step="any" value={form.electricityConsumed} onChange={e => set('electricityConsumed', e.target.value)} placeholder="0.0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Solar Units <span className="text-pf-muted">(Units)</span></label>
                            <input type="number" step="any" value={form.solarUnits} onChange={e => set('solarUnits', e.target.value)} placeholder="0.0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Diesel Consumption <span className="text-pf-muted">(Liters)</span></label>
                            <input type="number" step="any" value={form.dieselConsumption} onChange={e => set('dieselConsumption', e.target.value)} placeholder="0.0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">DG Units <span className="text-pf-muted">(Units)</span></label>
                            <input type="number" step="any" value={form.dgUnits} onChange={e => set('dgUnits', e.target.value)} placeholder="0.0" className="pf-input" />
                        </div>
                    </div>
                </div>

                {/* EUR / PUR / FUR */}
                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">📊</span> EUR / PUR / FUR
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="pf-label">EUR <span className="text-pf-muted">(%)</span></label>
                            <input type="number" step="any" value={form.eur} onChange={e => set('eur', e.target.value)} placeholder="%" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">PUR <span className="text-pf-muted">(%)</span></label>
                            <input type="number" step="any" value={form.pur} onChange={e => set('pur', e.target.value)} placeholder="%" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">FUR <span className="text-pf-muted">(%)</span></label>
                            <input type="number" step="any" value={form.fur} onChange={e => set('fur', e.target.value)} placeholder="%" className="pf-input" />
                        </div>
                    </div>
                </div>

                {/* Issues & Remarks */}
                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">⚠️</span> Issues & Remarks
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="pf-label">Critical Maintenance Issue</label>
                            <textarea value={form.criticalIssue} onChange={e => set('criticalIssue', e.target.value)}
                                placeholder="Describe any critical maintenance issues..." rows={3} className="pf-input resize-y" />
                        </div>
                        <div>
                            <label className="pf-label">Remarks</label>
                            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
                                placeholder="Additional notes..." rows={2} className="pf-input resize-y" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={mutation.isPending} className="pf-btn-primary">
                        {mutation.isPending ? 'Saving...' : '💾 Save Maintenance Data'}
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, date: today })} className="pf-btn-ghost">Reset</button>
                </div>
            </form>
        </div>
    );
}
