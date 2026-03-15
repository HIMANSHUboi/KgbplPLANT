import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import { createHrEntry } from '../../api/hr';

export default function HrEntryPage() {
    const { user } = useAuth();
    const toast = useToast();
    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        date: today,
        manpowerProductivity: '', totalOpenPosition: '',
        noCases: '', totalManpower: '',
        contractual: '', ownPermanent: '',
        criticalHrIssue: '',
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const mutation = useMutation({
        mutationFn: createHrEntry,
        onSuccess: () => toast.success('HR data saved successfully!'),
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save HR data'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div className="p-6 lg:p-8 max-w-[900px] animate-fade-in">
            <PageHeader title="HR Data Entry" subtitle={`Manpower & HR data for ${user?.plant?.name || 'your plant'}`} />

            <form onSubmit={handleSubmit}>
                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">📊</span> Productivity
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="pf-label">Date</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} max={today} className="pf-input" required />
                        </div>
                        <div>
                            <label className="pf-label">Manpower Productivity</label>
                            <input type="number" value={form.manpowerProductivity} onChange={e => set('manpowerProductivity', e.target.value)}
                                placeholder="" step="any" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Total Open Position</label>
                            <input type="number" value={form.totalOpenPosition} onChange={e => set('totalOpenPosition', e.target.value)}
                                placeholder="" min="0" className="pf-input" />
                        </div>
                    </div>
                </div>

                {/* Manpower Breakdown */}
                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">👥</span> Manpower Breakdown
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                            <label className="pf-label">No. of Cases</label>
                            <input type="number" value={form.noCases} onChange={e => set('noCases', e.target.value)}
                                placeholder="0" min="0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Total Manpower</label>
                            <input type="number" value={form.totalManpower} onChange={e => set('totalManpower', e.target.value)}
                                placeholder="0" min="0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Contractual</label>
                            <input type="number" value={form.contractual} onChange={e => set('contractual', e.target.value)}
                                placeholder="0" min="0" className="pf-input" />
                        </div>
                        <div>
                            <label className="pf-label">Own / Permanent</label>
                            <input type="number" value={form.ownPermanent} onChange={e => set('ownPermanent', e.target.value)}
                                placeholder="0" min="0" className="pf-input" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 mb-5">
                    <h3 className="font-mono text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">⚠️</span> Critical HR Issue
                    </h3>
                    <textarea value={form.criticalHrIssue} onChange={e => set('criticalHrIssue', e.target.value)}
                        placeholder="Describe any critical HR issues..." rows={4} className="pf-input resize-y" />
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={mutation.isPending} className="pf-btn-primary">
                        {mutation.isPending ? 'Saving...' : '💾 Save HR Data'}
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, date: today })} className="pf-btn-ghost">Reset</button>
                </div>
            </form>
        </div>
    );
}
