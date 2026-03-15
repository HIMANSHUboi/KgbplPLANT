import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/Skeleton';
import { getProductionStats, exportProductionExcel } from '../../api/production';
import { StatCard, ChartCard, ShadcnAreaChart, ShadcnLineChart, ShadcnBarChart } from '../../components/Charts';
import DateRangeControls from '../../components/DateRangeControls';

const LINES = [
    { id: 'khs', label: 'KHS PDW', volKey: 'volumeKhsPdw', meKey: 'meKhsPdw', downKey: 'downtimeKhsPdw', poKey: 'openPoKhsPdw', color: 'cyan' },
    { id: 'csd', label: 'Krones CSD', volKey: 'volumeKronesCsd', meKey: 'meKronesCsd', downKey: 'downtimeKronesCsd', poKey: 'openPoKronesCsd', color: 'amber' },
    { id: 'tetra', label: 'Tetra', volKey: 'volumeTetra', meKey: 'meTetra', downKey: 'downtimeTetra', poKey: 'openPoTetra', color: 'emerald' },
];

const SKU_MAP = {
    khs: [
        { code: 'kinley_1000', name: 'Kinley+', size: '1000ml' },
        { code: 'kinley_500', name: 'Kinley', size: '500ml' },
    ],
    csd: [
        { code: 'coke_2000', name: 'Coke', size: '2L' },
        { code: 'fanta_2000', name: 'Fanta', size: '2L' },
        { code: 'fanta_250', name: 'Fanta', size: '250ml' },
        { code: 'limca_250', name: 'Limca', size: '250ml' },
        { code: 'coke_750', name: 'Coke', size: '750ml' },
        { code: 'sprite_710', name: 'Sprite', size: '750ml' },
        { code: 'soda_750', name: 'Soda', size: '750ml' },
    ],
    tetra: [{ code: 'maaza_150', name: 'Maaza', size: '150ml' }],
};

const SHIFT_LABELS = { A: 'Shift A', B: 'Shift B', C: 'Shift C', GENERAL: 'General' };

const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'shiftwise', label: '🔄 Shift Comparison' },
    { id: 'userinput', label: '👤 User Input' },
];

export default function ProductionDashboard() {
    const [days, setDays] = useState(7);
    const [dateRange, setDateRange] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [selectedLine, setSelectedLine] = useState('all');
    const [selectedSku, setSelectedSku] = useState('all');
    const [selectedShift, setSelectedShift] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const queryParams = dateRange
        ? { from: dateRange.from, to: dateRange.to, ...(selectedShift ? { shift: selectedShift } : {}) }
        : { days, ...(selectedShift ? { shift: selectedShift } : {}) };

    const { data, isLoading } = useQuery({
        queryKey: ['production-stats', queryParams],
        queryFn: () => getProductionStats(queryParams).then(r => r.data),
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportProductionExcel(dateRange || { days });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'production_report.xlsx';
            a.click(); window.URL.revokeObjectURL(url);
        } catch { /* ignore */ }
        setExporting(false);
    };

    if (isLoading) return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Production Dashboard" subtitle="Loading..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    );

    const entries = data?.entries || [];
    const byShift = data?.byShift || {};
    const userInputs = data?.userInputs || [];

    // Compute line data
    const getLineData = (lineId) => {
        const line = LINES.find(l => l.id === lineId);
        if (!line) return null;
        return {
            totalVol: entries.reduce((s, e) => s + (e[line.volKey] || 0), 0),
            avgMe: (() => {
                const valid = entries.filter(e => e[line.meKey] != null);
                return valid.length ? (valid.reduce((s, e) => s + e[line.meKey], 0) / valid.length).toFixed(1) : '—';
            })(),
            totalDown: entries.reduce((s, e) => s + (e[line.downKey] || 0), 0),
            totalPo: entries.reduce((s, e) => s + (e[line.poKey] || 0), 0),
        };
    };

    const totalKhs = entries.reduce((s, e) => s + (e.volumeKhsPdw || 0), 0);
    const totalKrones = entries.reduce((s, e) => s + (e.volumeKronesCsd || 0), 0);
    const totalTetra = entries.reduce((s, e) => s + (e.volumeTetra || 0), 0);
    const totalVolume = totalKhs + totalKrones + totalTetra;
    const avgCo2 = (() => {
        const valid = entries.filter(e => e.co2YieldPlant != null);
        return valid.length ? (valid.reduce((s, e) => s + e.co2YieldPlant, 0) / valid.length).toFixed(1) : '—';
    })();

    // Build trend data based on selected line
    const buildTrend = () => {
        if (selectedLine === 'all') {
            return entries.map(e => ({
                date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                khsPdw: e.volumeKhsPdw || 0,
                kronesCsd: e.volumeKronesCsd || 0,
                tetra: e.volumeTetra || 0,
            }));
        }
        const line = LINES.find(l => l.id === selectedLine);
        return entries.map(e => ({
            date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            volume: e[line.volKey] || 0,
            me: e[line.meKey] || 0,
            downtime: e[line.downKey] || 0,
        }));
    };

    const trend = buildTrend();
    const currentLineData = selectedLine !== 'all' ? getLineData(selectedLine) : null;
    const currentSkus = selectedLine !== 'all' ? (SKU_MAP[selectedLine] || []) : [];

    // Shift-wise comparison data
    const shiftCompData = Object.entries(byShift).map(([shift, d]) => ({
        shift: SHIFT_LABELS[shift] || shift,
        khsPdw: d.volumeKhs || 0,
        kronesCsd: d.volumeCsd || 0,
        tetra: d.volumeTetra || 0,
        total: (d.volumeKhs || 0) + (d.volumeCsd || 0) + (d.volumeTetra || 0),
        count: d.count || 0,
    }));

    // 3-line comparison data for bar chart
    const lineCompData = [
        { label: 'KHS PDW', volume: totalKhs, color: '#00d4ff' },
        { label: 'Krones CSD', volume: totalKrones, color: '#f59e0b' },
        { label: 'Tetra', volume: totalTetra, color: '#10b981' },
    ];

    const formatLastUpdated = (ts) => {
        if (!ts) return '';
        return ` • Last updated: ${new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    };

    return (
        <div className="p-6 lg:p-8">
            <PageHeader title="Production Dashboard" subtitle={dateRange ? `${dateRange.from} to ${dateRange.to}${formatLastUpdated(data?.lastUpdated)}` : `Analytics for the last ${days} days${formatLastUpdated(data?.lastUpdated)}`}>
                <DateRangeControls
                    days={days}
                    onDaysChange={(d) => { setDateRange(null); setDays(d); }}
                    onDateRangeChange={setDateRange}
                    onExport={handleExport}
                    loading={exporting}
                />
            </PageHeader>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 rounded-xl p-1 border border-pf-border" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all duration-200
                            ${activeTab === tab.id
                                ? 'bg-pf-accent/15 text-pf-accent border border-pf-accent/15'
                                : 'text-pf-muted hover:text-pf-text hover:bg-pf-accent/5 border border-transparent'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Line & Shift Selectors */}
            <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-pf-muted font-semibold uppercase tracking-wider">Line</label>
                    <select
                        value={selectedLine}
                        onChange={e => { setSelectedLine(e.target.value); setSelectedSku('all'); }}
                        className="pf-select w-auto text-xs"
                    >
                        <option value="all">All Lines</option>
                        {LINES.map(l => (
                            <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-pf-muted font-semibold uppercase tracking-wider">Shift</label>
                    <select
                        value={selectedShift}
                        onChange={e => setSelectedShift(e.target.value)}
                        className="pf-select w-auto text-xs"
                    >
                        <option value="">All Shifts</option>
                        <option value="A">Shift A</option>
                        <option value="B">Shift B</option>
                        <option value="C">Shift C</option>
                        <option value="GENERAL">General</option>
                    </select>
                </div>

                {selectedLine !== 'all' && currentSkus.length > 0 && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-pf-muted font-semibold uppercase tracking-wider">SKU / Flavour</label>
                        <select
                            value={selectedSku}
                            onChange={e => setSelectedSku(e.target.value)}
                            className="pf-select w-auto text-xs"
                        >
                            <option value="all">All SKUs</option>
                            {currentSkus.map(sku => (
                                <option key={sku.code} value={sku.code}>{sku.name} ({sku.size})</option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedLine !== 'all' && (
                    <div className="ml-auto flex gap-3 text-xs text-pf-muted">
                        <span>Vol: <strong className="text-pf-text">{currentLineData?.totalVol?.toLocaleString()}</strong></span>
                        <span>ME: <strong className="text-pf-text">{currentLineData?.avgMe}%</strong></span>
                        <span>Open POs: <strong className="text-pf-text">{currentLineData?.totalPo}</strong></span>
                    </div>
                )}
            </div>

            {/* Approval Status Bar */}
            {data?.pending != null && (
                <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 text-xs">
                    <span className="text-pf-muted font-semibold uppercase tracking-wider">Approval Status:</span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Approved: <strong className="text-pf-green">{data.approved || 0}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending: <strong className="text-pf-amber">{data.pending || 0}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> Rejected: <strong className="text-pf-red">{data.rejected || 0}</strong>
                    </span>
                </div>
            )}

            {/* ═══════════ OVERVIEW TAB ═══════════ */}
            {activeTab === 'overview' && (
                <>
                    {/* KPIs */}
                    {selectedLine === 'all' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                            <StatCard icon="📦" label="Total Volume" value={totalVolume.toLocaleString()} delta={`KHS: ${totalKhs.toLocaleString()} · Krones: ${totalKrones.toLocaleString()}`} color="border-t-cyan-400" delay={0} />
                            <StatCard icon="🏭" label="Tetra Volume" value={totalTetra.toLocaleString()} delta={`Last ${days} days`} color="border-t-blue-400" delay={1} />
                            <StatCard icon="💨" label="Avg CO₂ Yield" value={`${avgCo2}%`} delta="Plant-wide" color="border-t-emerald-400" delay={2} />
                            <StatCard icon="📋" label="Entries" value={entries.length} delta={`Last ${days} days`} color="border-t-amber-400" delay={3} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                            <StatCard icon="📦" label={`${LINES.find(l => l.id === selectedLine)?.label} Volume`} value={currentLineData?.totalVol?.toLocaleString()} color={`border-t-${LINES.find(l => l.id === selectedLine)?.color}-400`} delay={0} />
                            <StatCard icon="⚙️" label="Avg ME %" value={`${currentLineData?.avgMe}%`} color="border-t-blue-400" delay={1} />
                            <StatCard icon="⏱️" label="Total Downtime" value={`${currentLineData?.totalDown} min`} color="border-t-rose-400" delay={2} />
                            <StatCard icon="📋" label="Open POs" value={currentLineData?.totalPo} color="border-t-amber-400" delay={3} />
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                        <ChartCard title={selectedLine === 'all' ? 'Daily Volume Trend' : `${LINES.find(l => l.id === selectedLine)?.label} — Volume Trend`}
                            description={selectedLine === 'all' ? 'Production by line over time' : 'Daily volume for selected line'} delay={4}>
                            {trend.length > 0 ? (
                                selectedLine === 'all' ? (
                                    <ShadcnLineChart data={trend} dataKeys={['khsPdw', 'kronesCsd', 'tetra']} xKey="date"
                                        colors={['#00d4ff', '#f59e0b', '#10b981']} showDots={true} />
                                ) : (
                                    <ShadcnAreaChart data={trend} dataKeys={['volume']} xKey="date"
                                        colors={[LINES.find(l => l.id === selectedLine)?.color === 'cyan' ? '#00d4ff' : LINES.find(l => l.id === selectedLine)?.color === 'amber' ? '#f59e0b' : '#10b981']}
                                        showLegend={false} />
                                )
                            ) : (
                                <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet — enter production data to see trends</div>
                            )}
                        </ChartCard>

                        <ChartCard title="3-Line Comparison" description="Total volume by production line" delay={5}>
                            <ShadcnBarChart data={lineCompData} dataKeys={['volume']} xKey="label" colors={['#00d4ff']} showLegend={false} />
                        </ChartCard>
                    </div>

                    {selectedLine === 'all' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <ChartCard title="Machine Efficiency Trend" description="ME% by line" delay={6}>
                                {entries.length > 0 ? (
                                    <ShadcnAreaChart data={entries.map(e => ({
                                        date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                                        meKhs: e.meKhsPdw || 0, meKrones: e.meKronesCsd || 0, meTetra: e.meTetra || 0,
                                    }))} dataKeys={['meKhs', 'meKrones', 'meTetra']} xKey="date"
                                        colors={['#00d4ff', '#f59e0b', '#10b981']} formatter={v => `${v}%`} />
                                ) : (
                                    <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                                )}
                            </ChartCard>

                            {selectedLine === 'all' && (
                                <ChartCard title="ME v/s Downtime" description="Machine efficiency vs downtime comparison" delay={5}>
                                    {entries.length > 0 ? (
                                        <ShadcnBarChart data={entries.map(e => ({
                                            date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                                            me: ((e.meKhsPdw || 0) + (e.meKronesCsd || 0) + (e.meTetra || 0)) / 3,
                                            downtime: (e.downtimeKhsPdw || 0) + (e.downtimeKronesCsd || 0) + (e.downtimeTetra || 0),
                                        }))} dataKeys={['me', 'downtime']} xKey="date" colors={['#10b981', '#f43f5e']} />
                                    ) : (
                                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                                    )}
                                </ChartCard>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ SHIFT COMPARISON TAB ═══════════ */}
            {activeTab === 'shiftwise' && (
                <>
                    {/* Shift-wise KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                        {Object.entries(byShift).map(([shift, d], idx) => {
                            const total = (d.volumeKhs || 0) + (d.volumeCsd || 0) + (d.volumeTetra || 0);
                            const colors = ['border-t-cyan-400', 'border-t-amber-400', 'border-t-emerald-400', 'border-t-purple-400'];
                            return (
                                <StatCard
                                    key={shift}
                                    icon={shift === 'GENERAL' ? '🌐' : shift === 'A' ? '🌅' : shift === 'B' ? '☀️' : '🌙'}
                                    label={SHIFT_LABELS[shift] || shift}
                                    value={total.toLocaleString()}
                                    delta={`${d.count} entries`}
                                    color={colors[idx % 4]}
                                    delay={idx}
                                />
                            );
                        })}
                        {Object.keys(byShift).length === 0 && (
                            <div className="col-span-4 glass-card p-8 text-center text-pf-muted text-sm">
                                No shift-wise data available yet. Submit production entries with shifts to see comparison.
                            </div>
                        )}
                    </div>

                    {/* Shift Comparison Charts */}
                    {shiftCompData.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                            <ChartCard title="Shift-wise Volume Comparison" description="3-line volume breakdown per shift" delay={4}>
                                <ShadcnBarChart
                                    data={shiftCompData}
                                    dataKeys={['khsPdw', 'kronesCsd', 'tetra']}
                                    xKey="shift"
                                    colors={['#00d4ff', '#f59e0b', '#10b981']}
                                />
                            </ChartCard>

                            <ChartCard title="Total Volume by Shift" description="Overall production per shift" delay={5}>
                                <ShadcnBarChart
                                    data={shiftCompData}
                                    dataKeys={['total']}
                                    xKey="shift"
                                    colors={['#a855f7']}
                                    showLegend={false}
                                />
                            </ChartCard>
                        </div>
                    )}

                    {/* Shift Detail Table */}
                    {shiftCompData.length > 0 && (
                        <div className="glass-card overflow-hidden">
                            <div className="px-5 py-4 border-b border-pf-border">
                                <h3 className="font-mono text-sm font-semibold text-pf-text">Shift-wise Breakdown</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="pf-table">
                                    <thead>
                                        <tr>
                                            {['Shift', 'KHS PDW', 'Krones CSD', 'Tetra', 'Total Volume', 'Entries'].map(h => (
                                                <th key={h}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shiftCompData.map(row => (
                                            <tr key={row.shift}>
                                                <td className="font-semibold text-pf-text">{row.shift}</td>
                                                <td className="font-mono">{row.khsPdw.toLocaleString()}</td>
                                                <td className="font-mono">{row.kronesCsd.toLocaleString()}</td>
                                                <td className="font-mono">{row.tetra.toLocaleString()}</td>
                                                <td className="font-mono font-bold text-pf-accent">{row.total.toLocaleString()}</td>
                                                <td className="text-pf-muted">{row.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ USER INPUT TAB ═══════════ */}
            {activeTab === 'userinput' && (
                <div className="glass-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-pf-border">
                        <h3 className="font-mono text-sm font-semibold text-pf-text">User Input Comparison</h3>
                        <p className="text-[11px] text-pf-muted mt-0.5">See who entered what data for each shift</p>
                    </div>

                    {userInputs.length === 0 ? (
                        <div className="py-16 text-center text-pf-muted">
                            <div className="text-5xl mb-4 opacity-30">📝</div>
                            <p>No user input data available yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="pf-table">
                                <thead>
                                    <tr>
                                        {['Date', 'Shift', 'Submitted By', 'KHS PDW', 'Krones CSD', 'Tetra', 'Total', 'Status'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {userInputs.map((row, i) => {
                                        const rowTotal = row.volumeKhs + row.volumeCsd + row.volumeTetra;
                                        return (
                                            <tr key={i}>
                                                <td className="text-xs">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                                                <td>
                                                    <span className={`pf-badge ${row.shift === 'GENERAL' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'}`}>
                                                        {SHIFT_LABELS[row.shift] || row.shift}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="text-[13px] font-medium text-pf-text">{row.user?.name || 'Unknown'}</div>
                                                    {row.user?.empId && <div className="text-[10px] text-pf-muted">{row.user.empId}</div>}
                                                </td>
                                                <td className="font-mono text-[13px]">{row.volumeKhs.toLocaleString()}</td>
                                                <td className="font-mono text-[13px]">{row.volumeCsd.toLocaleString()}</td>
                                                <td className="font-mono text-[13px]">{row.volumeTetra.toLocaleString()}</td>
                                                <td className="font-mono font-bold text-pf-accent">{rowTotal.toLocaleString()}</td>
                                                <td>
                                                    <span className={`pf-badge ${row.status === 'APPROVED' ? 'pf-badge-approved' : row.status === 'REJECTED' ? 'pf-badge-rejected' : 'pf-badge-pending'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* SKU Cards */}
            {activeTab === 'overview' && selectedLine !== 'all' && currentSkus.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-xs text-pf-muted uppercase tracking-[1.5px] font-semibold mb-3">Available SKUs / Flavours</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {currentSkus.filter(s => selectedSku === 'all' || s.code === selectedSku).map(sku => (
                            <div key={sku.code} className="glass-card p-4 border-t-2 border-t-pf-accent/30 stat-card-hover">
                                <div className="text-sm font-semibold text-pf-text">{sku.name}</div>
                                <div className="text-[10px] text-pf-muted mt-0.5">{sku.size}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
