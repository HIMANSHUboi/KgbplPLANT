import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/Skeleton';
import { getQseStats, exportQseExcel } from '../../api/qse';
import { StatCard, ChartCard, ShadcnLineChart, ShadcnBarChart } from '../../components/Charts';
import DateRangeControls from '../../components/DateRangeControls';

export default function QseDashboard() {
    const [days, setDays] = useState(7);
    const [dateRange, setDateRange] = useState(null);
    const [exporting, setExporting] = useState(false);

    const queryParams = dateRange ? { from: dateRange.from, to: dateRange.to } : { days };
    const { data, isLoading } = useQuery({
        queryKey: ['qse-stats', queryParams],
        queryFn: () => getQseStats(queryParams).then(r => r.data),
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportQseExcel(dateRange || { days });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'qse_report.xlsx';
            a.click(); window.URL.revokeObjectURL(url);
        } catch { /* ignore */ }
        setExporting(false);
    };

    if (isLoading) return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="QSE Dashboard" subtitle="Loading..." />
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

    const trend = entries.map(e => ({
        date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        tbt: e.tbtCompliance || 0,
        bbs: e.bbsPercent || 0,
        waterUsage: e.waterUsageRatio || 0,
        etp: e.etpDischarge || 0,
    }));

    const totalNearMiss = entries.reduce((s, e) => s + (e.nearMissSifis || 0), 0);

    return (
        <div className="p-6 lg:p-8">
            <PageHeader title="QSE Dashboard" subtitle={dateRange ? `${dateRange.from} to ${dateRange.to}` : `Quality, Safety & Environment — last ${days} days`}>
                <DateRangeControls
                    days={days}
                    onDaysChange={(d) => { setDateRange(null); setDays(d); }}
                    onDateRangeChange={setDateRange}
                    onExport={handleExport}
                    loading={exporting}
                />
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <StatCard icon="🛡️" label="Avg TBT Compliance" value={`${avg('tbtCompliance')}%`} color="border-t-emerald-400" delay={0} />
                <StatCard icon="👁️" label="Avg BBS" value={`${avg('bbsPercent')}%`} color="border-t-blue-400" delay={1} />
                <StatCard icon="⚠️" label="Near Miss / SIFIs" value={totalNearMiss} color="border-t-amber-400" delay={2} />
                <StatCard icon="💧" label="Avg Water Usage" value={avg('waterUsageRatio')} color="border-t-cyan-400" delay={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <ChartCard title="Safety Trend" description="TBT & BBS compliance over time" delay={4}>
                    {trend.length > 0 ? (
                        <ShadcnLineChart data={trend} dataKeys={['tbt', 'bbs']} xKey="date"
                            colors={['#10b981', '#3b82f6']} formatter={v => `${v}%`} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet — enter QSE data to see trends</div>
                    )}
                </ChartCard>

                <ChartCard title="Water Usage Trend" description="Daily water usage ratio" delay={5}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['waterUsage']} xKey="date"
                            colors={['#06b6d4']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="ETP Discharge Trend" description="Daily ETP discharge in KL" delay={6}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['etp']} xKey="date"
                            colors={['#a78bfa']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
}
