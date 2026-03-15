import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/Toast';
import { createProductionEntry } from '../../api/production';
import PageHeader from '../../components/PageHeader';

// 3 production lines with their SKU/Flavour breakdowns
const LINES = [
    {
        id: 'khs',
        label: 'KHS PDW',
        color: 'border-t-cyan-400',
        accent: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        skus: [
            { code: 'kinley_1000', name: 'Kinley+', size: '1000ml' },
            { code: 'kinley_500', name: 'Kinley', size: '500ml' },
        ],
    },
    {
        id: 'csd',
        label: 'Krones CSD',
        color: 'border-t-amber-400',
        accent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        skus: [
            { code: 'coke_2000', name: 'Coke', size: '2L' },
            { code: 'fanta_2000', name: 'Fanta', size: '2L' },
            { code: 'fanta_250', name: 'Fanta', size: '250ml' },
            { code: 'limca_250', name: 'Limca', size: '250ml' },
            { code: 'coke_750', name: 'Coke', size: '750ml' },
            { code: 'sprite_710', name: 'Sprite', size: '750ml' },
            { code: 'soda_750', name: 'Soda', size: '750ml' },
        ],
    },
    {
        id: 'tetra',
        label: 'Tetra',
        color: 'border-t-emerald-400',
        accent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        skus: [
            { code: 'maaza_150', name: 'Maaza', size: '150ml' },
        ],
    },
];

export default function ProductionEntryPage() {
    const toast = useToast();
    const qc = useQueryClient();
    const [activeLine, setActiveLine] = useState('khs');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [shift, setShift] = useState('GENERAL');

    // Line-level aggregate fields
    const [lineData, setLineData] = useState({
        khs: { volume: '', me: '', downtime: '', preformYield: '', closureYield: '', openPo: '' },
        csd: { volume: '', me: '', downtime: '', preformYield: '', closureYield: '', openPo: '' },
        tetra: { volume: '', me: '', downtime: '', preformYield: '', closureYield: '', openPo: '' },
    });

    // SKU-level volumes (per line)
    const [skuData, setSkuData] = useState(() => {
        const init = {};
        LINES.forEach(line => {
            init[line.id] = {};
            line.skus.forEach(sku => { init[line.id][sku.code] = ''; });
        });
        return init;
    });

    // Shared fields
    const [shared, setShared] = useState({
        cipFlushing: '',
        co2YieldPlant: '',
        next24hrsPlan: '',
        criticalIssues: '',
    });

    const setLine = (lineId, field, value) => {
        setLineData(prev => ({ ...prev, [lineId]: { ...prev[lineId], [field]: value } }));
    };
    const setSku = (lineId, skuCode, value) => {
        setSkuData(prev => ({ ...prev, [lineId]: { ...prev[lineId], [skuCode]: value } }));
    };

    const mutation = useMutation({
        mutationFn: createProductionEntry,
        onSuccess: () => { toast.success('Production data saved!'); qc.invalidateQueries(['production']); },
        onError: (e) => toast.error(e?.response?.data?.error || 'Failed to save'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            date,
            shift,
            // KHS line
            volumeKhsPdw: lineData.khs.volume,
            meKhsPdw: lineData.khs.me,
            downtimeKhsPdw: lineData.khs.downtime,
            preformYieldKhsPdw: lineData.khs.preformYield,
            closureYieldKhsPdw: lineData.khs.closureYield,
            openPoKhsPdw: lineData.khs.openPo,
            // CSD line
            volumeKronesCsd: lineData.csd.volume,
            meKronesCsd: lineData.csd.me,
            downtimeKronesCsd: lineData.csd.downtime,
            preformYieldKronesCsd: lineData.csd.preformYield,
            closureYieldKronesCsd: lineData.csd.closureYield,
            openPoKronesCsd: lineData.csd.openPo,
            // Tetra line
            volumeTetra: lineData.tetra.volume,
            meTetra: lineData.tetra.me,
            downtimeTetra: lineData.tetra.downtime,
            openPoTetra: lineData.tetra.openPo,
            // Shared
            cipFlushing: shared.cipFlushing,
            co2YieldPlant: shared.co2YieldPlant,
            next24hrsPlan: shared.next24hrsPlan,
            criticalIssues: shared.criticalIssues,
            // SKU breakdown as JSON string
            skuBreakdown: JSON.stringify(skuData),
        };
        mutation.mutate(payload);
    };

    const activeLineObj = LINES.find(l => l.id === activeLine);

    // Calculate total SKU volume for active line
    const skuTotal = Object.values(skuData[activeLine] || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Production Data Entry" subtitle="Enter daily production metrics per line" />

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date Picker */}
                <div className="glass-card p-5 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="pf-label">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="pf-input w-auto" required />
                    </div>
                    <div>
                        <label className="pf-label">Shift</label>
                        <select value={shift} onChange={e => setShift(e.target.value)} className="pf-select w-auto">
                            <option value="GENERAL">General</option>
                            <option value="A">Shift A</option>
                            <option value="B">Shift B</option>
                            <option value="C">Shift C</option>
                        </select>
                    </div>
                </div>

                {/* Line Tabs */}
                <div className="flex gap-2">
                    {LINES.map(line => (
                        <button
                            key={line.id}
                            type="button"
                            onClick={() => setActiveLine(line.id)}
                            className={`flex-1 py-3 rounded-xl border-t-2 text-sm font-semibold transition-all duration-200
                ${activeLine === line.id
                                    ? `glass-card ${line.color} text-pf-text shadow-lg`
                                    : 'bg-white/[0.04] border-transparent text-pf-muted hover:text-pf-text hover:bg-white/[0.06]'
                                }`}
                        >
                            {line.label}
                            {lineData[line.id].volume && (
                                <span className="ml-2 text-xs opacity-60">Vol: {lineData[line.id].volume}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Active line data entry */}
                <div className={`glass-card p-6 border-t-2 ${activeLineObj.color} animate-fade-in`} key={activeLine}>
                    <div className="flex items-center gap-3 mb-5">
                        <h3 className="font-mono text-base font-semibold text-pf-text">{activeLineObj.label}</h3>
                        <span className={`pf-badge ${activeLineObj.accent}`}>{activeLineObj.skus.length} SKU{activeLineObj.skus.length > 1 ? 's' : ''}</span>
                    </div>

                    {/* Line aggregates */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div>
                            <label className="pf-label">Volume (Cases)</label>
                            <input type="number" value={lineData[activeLine].volume} onChange={e => setLine(activeLine, 'volume', e.target.value)}
                                className="pf-input" placeholder="0" />
                        </div>
                        <div>
                            <label className="pf-label">ME %</label>
                            <input type="number" step="0.1" value={lineData[activeLine].me} onChange={e => setLine(activeLine, 'me', e.target.value)}
                                className="pf-input" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="pf-label">Downtime (min)</label>
                            <input type="number" value={lineData[activeLine].downtime} onChange={e => setLine(activeLine, 'downtime', e.target.value)}
                                className="pf-input" placeholder="0" />
                        </div>
                        {activeLine !== 'tetra' && (
                            <>
                                <div>
                                    <label className="pf-label">Preform Yield %</label>
                                    <input type="number" step="0.01" value={lineData[activeLine].preformYield} onChange={e => setLine(activeLine, 'preformYield', e.target.value)}
                                        className="pf-input" placeholder="0.0" />
                                </div>
                                <div>
                                    <label className="pf-label">Closure Yield %</label>
                                    <input type="number" step="0.01" value={lineData[activeLine].closureYield} onChange={e => setLine(activeLine, 'closureYield', e.target.value)}
                                        className="pf-input" placeholder="0.0" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="pf-label">Open POs</label>
                            <input type="number" value={lineData[activeLine].openPo} onChange={e => setLine(activeLine, 'openPo', e.target.value)}
                                className="pf-input" placeholder="0" />
                        </div>
                    </div>

                    {/* SKU Breakdown */}
                    <div className="border-t border-pf-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[11px] text-pf-muted uppercase tracking-[1.5px] font-semibold">SKU / Flavour Breakdown</h4>
                            {skuTotal > 0 && (
                                <span className="text-xs text-pf-dim">Total: <span className="font-semibold text-pf-text">{skuTotal.toLocaleString()}</span> cases</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {activeLineObj.skus.map(sku => (
                                <div key={sku.code} className="rounded-lg p-3 border border-pf-border" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-pf-text">{sku.name}</span>
                                        <span className="text-[10px] text-pf-muted">{sku.size}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={skuData[activeLine][sku.code]}
                                        onChange={e => setSku(activeLine, sku.code, e.target.value)}
                                        className="pf-input text-xs"
                                        placeholder="Cases"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Shared / Plant-level fields */}
                <div className="glass-card p-6">
                    <h3 className="font-mono text-sm font-semibold text-pf-text mb-4">Plant-Wide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="pf-label">CIP / Flushing</label>
                            <input type="number" step="0.1" value={shared.cipFlushing} onChange={e => setShared(p => ({ ...p, cipFlushing: e.target.value }))}
                                className="pf-input" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="pf-label">CO₂ Yield % (Plant)</label>
                            <input type="number" step="0.1" value={shared.co2YieldPlant} onChange={e => setShared(p => ({ ...p, co2YieldPlant: e.target.value }))}
                                className="pf-input" placeholder="0.0" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="pf-label">Next 24hrs Plan</label>
                            <textarea value={shared.next24hrsPlan} onChange={e => setShared(p => ({ ...p, next24hrsPlan: e.target.value }))}
                                rows={3} className="pf-input" placeholder="Production plan for tomorrow..." />
                        </div>
                        <div>
                            <label className="pf-label">Critical Issues</label>
                            <textarea value={shared.criticalIssues} onChange={e => setShared(p => ({ ...p, criticalIssues: e.target.value }))}
                                rows={3} className="pf-input" placeholder="Any critical issues to flag..." />
                        </div>
                    </div>
                </div>

                {/* Summary bar */}
                <div className="glass-card p-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1 flex gap-4 text-xs text-pf-muted">
                        {LINES.map(line => {
                            const vol = parseFloat(lineData[line.id].volume) || 0;
                            return (
                                <div key={line.id} className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${line.id === 'khs' ? 'bg-cyan-400' : line.id === 'csd' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                    <span>{line.label}: <strong className="text-pf-text">{vol.toLocaleString()}</strong></span>
                                </div>
                            );
                        })}
                        <div className="text-pf-accent font-semibold">
                            Total: {LINES.reduce((s, l) => s + (parseFloat(lineData[l.id].volume) || 0), 0).toLocaleString()} cases
                        </div>
                    </div>
                    <button type="submit" disabled={mutation.isPending} className="pf-btn-primary text-sm">
                        {mutation.isPending ? '⏳ Saving...' : '💾 Save Production Data'}
                    </button>
                </div>
            </form>
        </div>
    );
}
