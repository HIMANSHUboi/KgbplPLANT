import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import { createStoresEntry } from '../../api/stores';

export default function StoresEntryPage() {
    const { user } = useAuth();
    const toast = useToast();
    const today = new Date().toISOString().split('T')[0];
    const [activeTab, setActiveTab] = useState('stores');

    const [form, setForm] = useState({
        date: today,
        plannedOrders: '', dispatchedOrders: '',
        palletizedOrders: '', manualOrders: '',
        totalVehicles: '', currentStock: '',
        remarks: '', criticalIssue: '',
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const mutation = useMutation({
        mutationFn: createStoresEntry,
        onSuccess: () => toast.success('Shipping data saved successfully!'),
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save data'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div className="p-6 lg:p-8 max-w-[900px] animate-fade-in">
            <PageHeader title="Stores & Shipping Data" subtitle={`Logistics & inventory data for ${user?.plant?.name || 'your plant'}`} />

            <div className="flex flex-wrap gap-2 mb-6 bg-white/40 p-2 rounded-xl border border-pf-border backdrop-blur-md">
                {['stores', 'shipping'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[120px] justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 capitalize
                        ${activeTab === tab ? 'bg-pf-accent text-white shadow-sm' : 'text-slate-500 hover:text-pf-text hover:bg-white/50'}`}
                    >
                        {tab} Data
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Date & Orders (Shipping Only) */}
                {activeTab === 'shipping' && (
                    <div className="glass-card p-6 mb-5 animate-slide-up">
                        <h3 className="font-mono text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2">
                            <span className="text-lg">📋</span> Orders
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="pf-label">Date</label>
                                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} max={today} className="pf-input" required />
                            </div>
                            <div>
                                <label className="pf-label">Planned Orders</label>
                                <input type="number" value={form.plannedOrders} onChange={e => set('plannedOrders', e.target.value)}
                                    placeholder="0" min="0" className="pf-input" />
                            </div>
                            <div>
                                <label className="pf-label">Dispatched Orders</label>
                                <input type="number" value={form.dispatchedOrders} onChange={e => set('dispatchedOrders', e.target.value)}
                                    placeholder="0" min="0" className="pf-input" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Dispatch Breakdown (Shipping Only) */}
                {activeTab === 'shipping' && (
                    <div className="glass-card p-6 mb-5 animate-slide-up">
                        <h3 className="font-mono text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                            <span className="text-lg">📦</span> Dispatch Breakdown
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                                <label className="pf-label">Palletized</label>
                                <input type="number" value={form.palletizedOrders} onChange={e => set('palletizedOrders', e.target.value)}
                                    placeholder="0" min="0" className="pf-input" />
                            </div>
                            <div>
                                <label className="pf-label">Manual</label>
                                <input type="number" value={form.manualOrders} onChange={e => set('manualOrders', e.target.value)}
                                    placeholder="0" min="0" className="pf-input" />
                            </div>
                            <div>
                                <label className="pf-label">Total Vehicles</label>
                                <input type="number" value={form.totalVehicles} onChange={e => set('totalVehicles', e.target.value)}
                                    placeholder="0" min="0" className="pf-input" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Stock (Stores Only) */}
                {activeTab === 'stores' && (
                    <div className="glass-card p-6 mb-5 animate-slide-up">
                        <h3 className="font-mono text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                            <span className="text-lg">🏭</span> Stock Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="pf-label">Date</label>
                                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} max={today} className="pf-input" required />
                            </div>
                            <div>
                                <label className="pf-label">Current Stock</label>
                                <input type="number" step="any" value={form.currentStock} onChange={e => set('currentStock', e.target.value)}
                                    placeholder="0.0" className="pf-input" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Remarks (Common) */}
                <div className="glass-card p-6 mb-5 animate-slide-up">
                    <h3 className="font-mono text-sm font-semibold text-rose-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">⚠️</span> Issues & Remarks
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="pf-label">Remarks / Notes</label>
                            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
                                placeholder={`${activeTab === 'stores' ? 'Stores' : 'Shipping'} & logistics details...`} rows={3} className="pf-input resize-y" />
                        </div>
                        <div>
                            <label className="pf-label">Critical Issue</label>
                            <textarea value={form.criticalIssue} onChange={e => set('criticalIssue', e.target.value)}
                                placeholder={`Any critical ${activeTab} issues...`} rows={3} className="pf-input resize-y" />
                        </div>
                    </div>
                </div>

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
