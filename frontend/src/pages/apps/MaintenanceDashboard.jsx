import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/Skeleton';
import { getMaintenanceStats, exportMaintenanceExcel } from '../../api/maintenance';
import { StatCard, ChartCard, ShadcnBarChart, ShadcnLineChart } from '../../components/Charts';
import DateRangeControls from '../../components/DateRangeControls';

export default function MaintenanceDashboard() {
    const [days, setDays] = useState(7);
    const [dateRange, setDateRange] = useState(null);
    const [exporting, setExporting] = useState(false);

    const queryParams = dateRange ? { from: dateRange.from, to: dateRange.to } : { days };
    const { data, isLoading } = useQuery({
        queryKey: ['maintenance-stats', queryParams],
        queryFn: () => getMaintenanceStats(queryParams).then(r => r.data),
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportMaintenanceExcel(dateRange || { days });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'maintenance_report.xlsx';
            a.click(); window.URL.revokeObjectURL(url);
        } catch { /* ignore */ }
        setExporting(false);
    };

    if (isLoading) return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Maintenance Dashboard" subtitle="Loading..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    );

    const entries = data?.entries || [];
    const totalBreakdowns = entries.reduce((s, e) => s + (e.breakdownCount || 0), 0);
    const avg = (field) => {
        const vals = entries.filter(e => e[field] != null);
        return vals.length ? (vals.reduce((s, e) => s + e[field], 0) / vals.length).toFixed(1) : '—';
    };
    const sum = (field) => entries.reduce((s, e) => s + (e[field] || 0), 0);

    const trend = entries.map(e => ({
        date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        breakdowns: e.breakdownCount || 0,
        pmCompliance: e.pmCompliance || 0,
        steam: e.steamGenerated || 0,
        electricity: e.electricityConsumed || 0,
        diesel: e.dieselConsumption || 0,
        dgUnits: e.dgUnits || 0,
        eur: e.eur || 0,
        pur: e.pur || 0,
        fur: e.fur || 0,
    }));

    return (
        <div className="p-6 lg:p-8">
            <PageHeader title="Maintenance Dashboard" subtitle={dateRange ? `${dateRange.from} to ${dateRange.to}` : `Last ${days} days`}>
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
                <StatCard icon="🔧" label="Total Breakdowns" value={totalBreakdowns} color="border-t-rose-400" delay={0} />
                <StatCard icon="📋" label="Avg PM Compliance" value={`${avg('pmCompliance')}%`} color="border-t-emerald-400" delay={1} />
                <StatCard icon="🔥" label="Total Steam (Tons)" value={sum('steamGenerated').toLocaleString()} color="border-t-orange-400" delay={2} />
                <StatCard icon="⚡" label="Total Electricity (Units)" value={sum('electricityConsumed').toLocaleString()} color="border-t-yellow-400" delay={3} />
            </div>

            {/* Row 2: Energy Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <StatCard icon="⛽" label="Fuel Used" value={sum('fuelUsed').toLocaleString()} color="border-t-amber-400" delay={4} />
                <StatCard icon="☀️" label="Solar Units" value={sum('solarUnits').toLocaleString()} color="border-t-yellow-300" delay={5} />
                <StatCard icon="🛢️" label="Diesel (Liters)" value={sum('dieselConsumption').toLocaleString()} color="border-t-slate-400" delay={6} />
                <StatCard icon="🔋" label="DG Units" value={sum('dgUnits').toLocaleString()} color="border-t-indigo-400" delay={7} />
            </div>

            {/* Row 3: EUR / PUR / FUR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <StatCard icon="📊" label="Avg EUR %" value={`${avg('eur')}%`} color="border-t-cyan-400" delay={8} />
                <StatCard icon="📊" label="Avg PUR %" value={`${avg('pur')}%`} color="border-t-blue-400" delay={9} />
                <StatCard icon="📊" label="Avg FUR %" value={`${avg('fur')}%`} color="border-t-purple-400" delay={10} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <ChartCard title="Breakdown Trend" description="Daily breakdown count" delay={11}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['breakdowns']} xKey="date" colors={['#f43f5e']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
                <ChartCard title="PM Compliance Trend" description="Preventive maintenance %" delay={12}>
                    {trend.length > 0 ? (
                        <ShadcnLineChart data={trend} dataKeys={['pmCompliance']} xKey="date" colors={['#10b981']} showLegend={false} formatter={v => `${v}%`} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Energy Consumption" description="Electricity & DG Units" delay={13}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['electricity', 'dgUnits']} xKey="date" colors={['#f59e0b', '#6366f1']} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
                <ChartCard title="EUR / PUR / FUR Trend" description="Equipment utilization rates" delay={14}>
                    {trend.length > 0 ? (
                        <ShadcnLineChart data={trend} dataKeys={['eur', 'pur', 'fur']} xKey="date" colors={['#06b6d4', '#3b82f6', '#a78bfa']} formatter={v => `${v}%`} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
}
