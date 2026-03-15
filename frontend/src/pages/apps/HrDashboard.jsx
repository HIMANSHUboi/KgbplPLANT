import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/Skeleton';
import { getHrStats, exportHrExcel } from '../../api/hr';
import { StatCard, ChartCard, ShadcnAreaChart, ShadcnBarChart } from '../../components/Charts';
import DateRangeControls from '../../components/DateRangeControls';

export default function HrDashboard() {
    const [days, setDays] = useState(7);
    const [dateRange, setDateRange] = useState(null);
    const [exporting, setExporting] = useState(false);

    const queryParams = dateRange ? { from: dateRange.from, to: dateRange.to } : { days };
    const { data, isLoading } = useQuery({
        queryKey: ['hr-stats', queryParams],
        queryFn: () => getHrStats(queryParams).then(r => r.data),
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportHrExcel(dateRange || { days });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'hr_report.xlsx';
            a.click(); window.URL.revokeObjectURL(url);
        } catch { /* ignore */ }
        setExporting(false);
    };

    if (isLoading) return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="HR Dashboard" subtitle="Loading..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    );

    const entries = data?.entries || [];
    const avg = (field) => {
        const vals = entries.filter(e => e[field] != null);
        return vals.length ? (vals.reduce((s, e) => s + e[field], 0) / vals.length).toFixed(1) : '—';
    };
    const sum = (field) => entries.reduce((s, e) => s + (e[field] || 0), 0);
    const last = (field) => entries.length > 0 ? (entries[entries.length - 1][field] || 0) : 0;

    const trend = entries.map(e => ({
        date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        productivity: e.manpowerProductivity || 0,
        openPositions: e.totalOpenPosition || 0,
        totalManpower: e.totalManpower || 0,
        contractual: e.contractual || 0,
        ownPermanent: e.ownPermanent || 0,
        cases: e.noCases || 0,
    }));

    return (
        <div className="p-6 lg:p-8">
            <PageHeader title="HR Dashboard" subtitle={dateRange ? `${dateRange.from} to ${dateRange.to}` : `Last ${days} days`}>
                <DateRangeControls
                    days={days}
                    onDaysChange={(d) => { setDateRange(null); setDays(d); }}
                    onDateRangeChange={setDateRange}
                    onExport={handleExport}
                    loading={exporting}
                />
            </PageHeader>

            {/* Row 1: Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <StatCard icon="👥" label="Avg Productivity" value={`${avg('manpowerProductivity')}%`} color="border-t-purple-400" delay={0} />
                <StatCard icon="📌" label="Open Positions" value={last('totalOpenPosition')} color="border-t-amber-400" delay={1} />
                <StatCard icon="📋" label="Total Cases" value={sum('noCases')} color="border-t-rose-400" delay={2} />
                <StatCard icon="📊" label="Entries" value={entries.length} color="border-t-cyan-400" delay={3} />
            </div>

            {/* Row 2: Manpower Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <StatCard icon="🏢" label="Last Total Manpower" value={last('totalManpower')} color="border-t-blue-400" delay={4} />
                <StatCard icon="📝" label="Last Contractual" value={last('contractual')} delta="Contractual headcount" color="border-t-orange-400" delay={5} />
                <StatCard icon="🏠" label="Last Own/Permanent" value={last('ownPermanent')} delta="Permanent headcount" color="border-t-emerald-400" delay={6} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <ChartCard title="Manpower Productivity" description="Daily workforce efficiency" delay={7}>
                    {trend.length > 0 ? (
                        <ShadcnAreaChart data={trend} dataKeys={['productivity']} xKey="date" colors={['#a78bfa']} showLegend={false} formatter={v => `${v}%`} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
                <ChartCard title="Manpower Breakdown" description="Contractual vs Own/Permanent" delay={8}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['contractual', 'ownPermanent']} xKey="date" colors={['#f97316', '#10b981']} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Cases Trend" description="No. of cases over time" delay={9}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['cases']} xKey="date" colors={['#f43f5e']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
                <ChartCard title="Open Positions" description="Unfilled roles over time" delay={10}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['openPositions']} xKey="date" colors={['#f59e0b']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
}
