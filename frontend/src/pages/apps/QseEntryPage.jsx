import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import { createQseEntry } from '../../api/qse';

export default function QseEntryPage() {
    const { user } = useAuth();
    const toast = useToast();
    const today = new Date().toISOString().split('T')[0];
    const [activeTab, setActiveTab] = useState('safety');

    const [form, setForm] = useState({
        date: today,
        tbtCompliance: '', bbsPercent: '', ucUaPercent: '',
        nearMissSifis: '', criticalSafetyIssue: '',
        waterUsageRatio: '', concentrateYield: '', sugarYield: '', pulpYield: '',
        totalRawSyrup: '', numCips: '', criticalQualityIssue: '',
        etpDischarge: '', etpInlet: '', etpRoDischarge: '', stpDischarge: '',
        criticalEnvIssue: '',
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const mutation = useMutation({
        mutationFn: (data) => createQseEntry(activeTab, data),
        onSuccess: () => {
            toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} data saved successfully!`);
        },
        onError: (err) => toast.error(err?.response?.data?.error || `Failed to save ${activeTab} data`),
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Only send fields corresponding to the active tab
        const payload = { date: form.date };
        if (activeTab === 'safety') {
            payload.tbtCompliance = form.tbtCompliance;
            payload.bbsPercent = form.bbsPercent;
            payload.ucUaPercent = form.ucUaPercent;
            payload.nearMissSifis = form.nearMissSifis;
            payload.criticalSafetyIssue = form.criticalSafetyIssue;
        } else if (activeTab === 'quality') {
            payload.waterUsageRatio = form.waterUsageRatio;
            payload.concentrateYield = form.concentrateYield;
            payload.sugarYield = form.sugarYield;
            payload.pulpYield = form.pulpYield;
            payload.totalRawSyrup = form.totalRawSyrup;
            payload.numCips = form.numCips;
            payload.criticalQualityIssue = form.criticalQualityIssue;
        } else if (activeTab === 'environment') {
            payload.etpDischarge = form.etpDischarge;
            payload.etpInlet = form.etpInlet;
            payload.etpRoDischarge = form.etpRoDischarge;
            payload.stpDischarge = form.stpDischarge;
            payload.criticalEnvIssue = form.criticalEnvIssue;
        }

        mutation.mutate(payload);
    };

    const Field = ({ label, field, type = 'number', placeholder = '', unit = '' }) => (
        <div>
            <label className="pf-label">{label}{unit && <span className="text-emerald-400 ml-1">({unit})</span>}</label>
            <input type={type} value={form[field]} onChange={e => set(field, e.target.value)}
                placeholder={placeholder} step={type === 'number' ? 'any' : undefined} className="pf-input" />
        </div>
    );

    return (
        <div className="p-6 lg:p-8 max-w-[1100px] animate-fade-in">
            <PageHeader title="QSE Data Entry" subtitle={`Quality, Safety & Environment data for ${user?.plant?.name || 'your plant'}`} />

            <div className="flex flex-wrap gap-2 mb-6 bg-white/40 p-2 rounded-xl border border-pf-border backdrop-blur-md">
                {['safety', 'quality', 'environment'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[120px] justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 capitalize
                        ${activeTab === tab ? 'bg-pf-accent text-white shadow-sm' : 'text-slate-500 hover:text-pf-text hover:bg-white/50'}`}
                    >
                        {tab} Metrics
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Date */}
                <div className="glass-card p-6 mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="pf-label">Date</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} max={today} className="pf-input" required />
                        </div>
                    </div>
                </div>

                {/* Safety Section */}
                {activeTab === 'safety' && (
                    <div className="glass-card p-6 mb-5 animate-slide-up">
                        <h3 className="font-mono text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                            <span className="text-lg">🛡️</span> Safety Metrics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <Field label="TBT Compliance" field="tbtCompliance" placeholder="%" unit="%" />
                            <Field label="BBS %" field="bbsPercent" placeholder="%" unit="%" />
                            <Field label="UC/UA %" field="ucUaPercent" placeholder="%" unit="%" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
                            <Field label="Near Miss / SIFIs" field="nearMissSifis" placeholder="Nos." />
                            <div className="sm:col-span-2">
                                <label className="pf-label">Critical Safety Issues</label>
                                <textarea value={form.criticalSafetyIssue} onChange={e => set('criticalSafetyIssue', e.target.value)}
                                    placeholder="Describe any critical safety issues..." rows={2} className="pf-input resize-y" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Quality Section */}
                {activeTab === 'quality' && (
                    <div className="glass-card p-6 mb-5 animate-slide-up">
                        <h3 className="font-mono text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                            <span className="text-lg">🔬</span> Quality Metrics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <Field label="Water Usage Ratio" field="waterUsageRatio" />
                            <Field label="Concentrate Yield" field="concentrateYield" placeholder="%" unit="%" />
                            <Field label="Sugar Yield" field="sugarYield" placeholder="%" unit="%" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
                            <Field label="Pulp Yield" field="pulpYield" placeholder="%" unit="%" />
                            <Field label="Total Raw Syrup Generation" field="totalRawSyrup" placeholder="in KL" unit="KL" />
                            <Field label="No. of CIPs" field="numCips" placeholder="Nos." />
                        </div>
                        <div className="mt-4">
                            <label className="pf-label">Critical Quality Issue</label>
                            <textarea value={form.criticalQualityIssue} onChange={e => set('criticalQualityIssue', e.target.value)}
                                placeholder="Describe any critical quality issues..." rows={2} className="pf-input resize-y" />
                        </div>
                    </div>
                )}

                {/* Environment Section */}
                {activeTab === 'environment' && (
                    <div className="glass-card p-6 mb-5 animate-slide-up">
                        <h3 className="font-mono text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                            <span className="text-lg">🌿</span> Environment Metrics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                            <Field label="ETP Discharge" field="etpDischarge" placeholder="in KL" unit="KL" />
                            <Field label="ETP Inlet" field="etpInlet" placeholder="in KL" unit="KL" />
                            <Field label="ETP RO Discharge" field="etpRoDischarge" placeholder="in KL" unit="KL" />
                            <Field label="STP Discharge" field="stpDischarge" placeholder="in KL" unit="KL" />
                        </div>
                        <div className="mt-4">
                            <label className="pf-label">Critical Environment Issue</label>
                            <textarea value={form.criticalEnvIssue} onChange={e => set('criticalEnvIssue', e.target.value)}
                                placeholder="Describe any critical environment issues..." rows={2} className="pf-input resize-y" />
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                    <button type="submit" disabled={mutation.isPending} className="pf-btn-primary capitalize">
                        {mutation.isPending ? 'Saving...' : `💾 Save ${activeTab} Data`}
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, date: today })} className="pf-btn-ghost">Reset</button>
                </div>
            </form>
        </div>
    );
}
