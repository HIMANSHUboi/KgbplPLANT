import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import { getPerformanceStats } from '../api/performance';
import { StatCard, ChartCard, ShadcnBarChart, ShadcnAreaChart, ShadcnPieChart } from '../components/Charts';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function PerformanceDashboard() {
    const [days, setDays] = useState(30);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['performance', days],
        queryFn: () => getPerformanceStats({ days }).then(r => r.data),
    });

    if (isLoading) return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Employee Performance" subtitle="Loading..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    );

    const employees = data?.employees || [];
    const summary = data?.summary || {};
    const selected = selectedEmployee
        ? employees.find(e => e.user.id === selectedEmployee)
        : null;

    // Build chart data
    const entriesChart = employees.slice(0, 15).map(e => ({
        name: e.user.name?.split(' ')[0] || 'Unknown',
        shiftLogs: e.totalShiftLogs,
        dmsEntries: e.totalDmsEntries,
    }));

    const efficiencyChart = employees.slice(0, 15).map(e => ({
        name: e.user.name?.split(' ')[0] || 'Unknown',
        efficiency: e.efficiencyScore,
        approval: e.approvalRate,
    }));

    // Shift distribution pie
    const shiftPie = (() => {
        const totals = { A: 0, B: 0, C: 0, GENERAL: 0 };
        employees.forEach(e => {
            Object.entries(e.shiftDist || {}).forEach(([s, count]) => {
                totals[s] = (totals[s] || 0) + count;
            });
        });
        return Object.entries(totals).filter(([, v]) => v > 0).map(([name, value]) => ({
            name: name === 'GENERAL' ? 'General' : `Shift ${name}`,
            value,
        }));
    })();

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-rose-500/10 border-rose-500/20';
    };

    const formatLastUpdated = (ts) => {
        if (!ts) return '';
        return ` • Last updated: ${new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    };

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Employee Performance" subtitle={`Performance analytics — last ${days} days${formatLastUpdated(data?.lastUpdated)}`}>
                <div className="flex gap-1 rounded-lg p-0.5 border border-pf-border" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    {[{ v: 7, l: '7D' }, { v: 14, l: '14D' }, { v: 30, l: '30D' }, { v: 90, l: '90D' }].map(opt => (
                        <button key={opt.v} onClick={() => setDays(opt.v)}
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${days === opt.v ? 'bg-pf-accent/15 text-pf-accent' : 'text-pf-muted hover:text-pf-text'}`}>
                            {opt.l}
                        </button>
                    ))}
                </div>
            </PageHeader>

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                <StatCard icon="👥" label="Active Employees" value={summary.totalEmployees || 0} delta={`Last ${days} days`} color="border-t-cyan-400" delay={0} />
                <StatCard icon="📈" label="Avg Approval Rate" value={`${summary.overallApprovalRate || 0}%`} delta="All submissions" trend={summary.overallApprovalRate >= 80 ? 'up' : 'down'} color="border-t-emerald-400" delay={1} />
                <StatCard icon="🏆" label="Top Performer" value={summary.bestPerformer?.name || '—'} delta={summary.bestPerformer ? `Score: ${summary.bestPerformer.score}` : ''} color="border-t-purple-400" delay={2} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <ChartCard title="Entries by Employee" description="Shift logs vs DMS entries submitted" delay={4}>
                    {entriesChart.length > 0 ? (
                        <ShadcnBarChart data={entriesChart} dataKeys={['shiftLogs', 'dmsEntries']} xKey="name"
                            colors={['#00d4ff', '#f59e0b']} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>

                <ChartCard title="Efficiency Scores" description="Composite efficiency rating per employee" delay={5}>
                    {efficiencyChart.length > 0 ? (
                        <ShadcnBarChart data={efficiencyChart} dataKeys={['efficiency']} xKey="name"
                            colors={['#10b981']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <ChartCard title="Shift Distribution" description="Entries across shifts" className="lg:col-span-1" delay={6}>
                    {shiftPie.length > 0 ? (
                        <ShadcnPieChart data={shiftPie} colors={['#00d4ff', '#f59e0b', '#10b981', '#a855f7']} height={240}
                            centerLabel="Shifts" centerValue={String(shiftPie.reduce((s, d) => s + d.value, 0))} />
                    ) : (
                        <div className="h-[240px] flex items-center justify-center text-pf-muted text-xs">No data</div>
                    )}
                </ChartCard>

                <ChartCard title="Performance Comparison" description="Efficiency vs Approval Rate" className="lg:col-span-2" delay={7}>
                    {efficiencyChart.length > 0 ? (
                        <ShadcnBarChart data={efficiencyChart} dataKeys={['efficiency', 'approval']} xKey="name"
                            colors={['#10b981', '#00d4ff']} height={240} />
                    ) : (
                        <div className="h-[240px] flex items-center justify-center text-pf-muted text-xs">No data</div>
                    )}
                </ChartCard>
            </div>

            {/* Employee Leaderboard */}
            <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-pf-border flex items-center justify-between">
                    <div>
                        <h3 className="font-mono text-base font-semibold text-pf-text">Employee Leaderboard</h3>
                        <p className="text-[11px] text-pf-muted mt-0.5">Ranked by composite efficiency score (Target Achievement + Approval Rate)</p>
                    </div>
                    {selected && (
                        <button onClick={() => setSelectedEmployee(null)} className="pf-btn-ghost text-xs py-1.5 px-3">
                            ← Back to Leaderboard
                        </button>
                    )}
                </div>

                {!selected ? (
                    /* Leaderboard table */
                    <div className="overflow-x-auto">
                        <table className="pf-table">
                            <thead>
                                <tr>
                                    {['Rank', 'Employee', 'Role', 'Entries', 'Approved', 'Approval %', 'Efficiency Score', ''].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => (
                                    <tr key={emp.user.id} className="cursor-pointer hover:bg-white/[0.02]" onClick={() => setSelectedEmployee(emp.user.id)}>
                                        <td className="text-center">
                                            {idx < 3 ? (
                                                <span className="text-xl">{MEDAL[idx]}</span>
                                            ) : (
                                                <span className="text-sm text-pf-muted font-mono">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="text-[13px] font-medium text-pf-text">{emp.user.name}</div>
                                            {emp.user.empId && <div className="text-[10px] text-pf-muted">{emp.user.empId}</div>}
                                        </td>
                                        <td className="text-[11px] text-pf-muted capitalize">{emp.user.role?.replace('_', ' ').toLowerCase()}</td>
                                        <td className="font-mono text-[13px]">{emp.totalEntries}</td>
                                        <td className="font-mono text-[13px] text-pf-green">{emp.totalApproved}</td>
                                        <td className={`font-mono text-[13px] font-semibold ${emp.approvalRate >= 80 ? 'text-pf-green' : emp.approvalRate >= 60 ? 'text-pf-amber' : 'text-pf-red'}`}>
                                            {emp.approvalRate}%
                                        </td>
                                        <td>
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreBg(emp.efficiencyScore)} ${getScoreColor(emp.efficiencyScore)}`}>
                                                {emp.efficiencyScore}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="text-xs text-pf-accent hover:underline">Details →</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Employee Detail View */
                    <div className="p-5 animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full bg-[#1a3158] flex items-center justify-center text-lg font-bold text-pf-accent border border-pf-accent/20">
                                {selected.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-pf-text">{selected.user.name}</h3>
                                <div className="text-xs text-pf-muted">
                                    {selected.user.empId && <span>{selected.user.empId} · </span>}
                                    <span className="capitalize">{selected.user.role?.replace('_', ' ').toLowerCase()}</span>
                                    {selected.user.department && <span> · {selected.user.department}</span>}
                                </div>
                            </div>
                            <div className={`ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-base font-bold ${getScoreBg(selected.efficiencyScore)} ${getScoreColor(selected.efficiencyScore)}`}>
                                <span className="text-xs font-normal text-pf-muted">Score:</span> {selected.efficiencyScore}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div className="glass-card p-4 border-t-2 border-t-cyan-400">
                                <div className="text-[10px] text-pf-muted uppercase tracking-wider">Total Entries</div>
                                <div className="text-2xl font-bold text-pf-text mt-1">{selected.totalEntries}</div>
                                <div className="text-[10px] text-pf-muted mt-0.5">{selected.totalShiftLogs} shift logs + {selected.totalDmsEntries} DMS</div>
                            </div>
                            <div className="glass-card p-4 border-t-2 border-t-emerald-400">
                                <div className="text-[10px] text-pf-muted uppercase tracking-wider">Approval Rate</div>
                                <div className={`text-2xl font-bold mt-1 ${selected.approvalRate >= 80 ? 'text-emerald-400' : selected.approvalRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{selected.approvalRate}%</div>
                                <div className="text-[10px] text-pf-muted mt-0.5">{selected.totalApproved} approved of {selected.totalEntries}</div>
                            </div>
                            <div className="glass-card p-4 border-t-2 border-t-purple-400">
                                <div className="text-[10px] text-pf-muted uppercase tracking-wider">Active Days</div>
                                <div className="text-2xl font-bold text-pf-text mt-1">{selected.activeDays}</div>
                                <div className="text-[10px] text-pf-muted mt-0.5">{selected.entriesPerDay} entries/day avg</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="glass-card p-4">
                                <div className="text-[10px] text-pf-muted uppercase tracking-wider mb-2">Production Stats</div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between"><span className="text-pf-muted">Gross Production</span><span className="text-pf-text font-semibold">{selected.totalGross.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Good Qty</span><span className="text-pf-green font-semibold">{selected.totalGood.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Target</span><span className="text-pf-text font-semibold">{selected.totalTarget.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Achievement</span><span className={`font-semibold ${selected.targetAchievement >= 90 ? 'text-pf-green' : 'text-pf-amber'}`}>{selected.targetAchievement}%</span></div>
                                </div>
                            </div>
                            <div className="glass-card p-4">
                                <div className="text-[10px] text-pf-muted uppercase tracking-wider mb-2">Status Breakdown</div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between"><span className="text-pf-muted">Approved (Logs)</span><span className="text-pf-green font-semibold">{selected.approvedLogs}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Rejected (Logs)</span><span className="text-pf-red font-semibold">{selected.rejectedLogs}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Pending (Logs)</span><span className="text-pf-amber font-semibold">{selected.pendingLogs}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Approved (DMS)</span><span className="text-pf-green font-semibold">{selected.approvedDms}</span></div>
                                    <div className="flex justify-between"><span className="text-pf-muted">Rejected (DMS)</span><span className="text-pf-red font-semibold">{selected.rejectedDms}</span></div>
                                </div>
                            </div>
                            <div className="glass-card p-4">
                                <div className="text-[10px] text-pf-muted uppercase tracking-wider mb-2">Shift Distribution</div>
                                <div className="space-y-1 text-xs">
                                    {Object.entries(selected.shiftDist || {}).length > 0 ? (
                                        Object.entries(selected.shiftDist).map(([s, count]) => (
                                            <div key={s} className="flex justify-between">
                                                <span className="text-pf-muted">{s === 'GENERAL' ? 'General' : `Shift ${s}`}</span>
                                                <span className="text-pf-text font-semibold">{count} entries</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-pf-muted">No shift data</div>
                                    )}
                                    <div className="flex justify-between pt-1 border-t border-pf-border"><span className="text-pf-muted">Downtime</span><span className="text-pf-red font-semibold">{selected.totalDowntime}m</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
