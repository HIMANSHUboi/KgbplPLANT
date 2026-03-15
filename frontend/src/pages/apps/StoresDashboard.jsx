import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/Skeleton';
import { getStoresStats, exportStoresExcel } from '../../api/stores';
import { StatCard, ChartCard, ShadcnBarChart, ShadcnLineChart } from '../../components/Charts';
import DateRangeControls from '../../components/DateRangeControls';

export default function StoresDashboard() {
    const [days, setDays] = useState(7);
    const [dateRange, setDateRange] = useState(null);
    const [exporting, setExporting] = useState(false);

    const queryParams = dateRange ? { from: dateRange.from, to: dateRange.to } : { days };
    const { data, isLoading } = useQuery({
        queryKey: ['stores-stats', queryParams],
        queryFn: () => getStoresStats(queryParams).then(r => r.data),
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportStoresExcel(dateRange || { days });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'shipping_report.xlsx';
            a.click(); window.URL.revokeObjectURL(url);
        } catch { /* ignore */ }
        setExporting(false);
    };

    if (isLoading) return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title="Shipping Dashboard" subtitle="Loading..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    );

    const entries = data?.entries || [];
    const sum = (field) => entries.reduce((s, e) => s + (e[field] || 0), 0);
    const last = (field) => entries.length > 0 ? (entries[entries.length - 1][field] || 0) : 0;

    const trend = entries.map(e => ({
        date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        planned: e.plannedOrders || 0,
        dispatched: e.dispatchedOrders || 0,
        palletized: e.palletizedOrders || 0,
        manual: e.manualOrders || 0,
        vehicles: e.totalVehicles || 0,
        stock: e.currentStock || 0,
    }));

    return (
        <div className="p-6 lg:p-8">
            <PageHeader title="Shipping Dashboard" subtitle={dateRange ? `${dateRange.from} to ${dateRange.to}` : `Last ${days} days`}>
                <DateRangeControls
                    days={days}
                    onDaysChange={(d) => { setDateRange(null); setDays(d); }}
                    onDateRangeChange={setDateRange}
                    onExport={handleExport}
                    loading={exporting}
                />
            </PageHeader>

            {/* Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                <StatCard icon="📋" label="Total Planned Orders" value={sum('plannedOrders').toLocaleString()} color="border-t-blue-400" delay={0} />
                <StatCard icon="🚛" label="Total Dispatched" value={sum('dispatchedOrders').toLocaleString()} color="border-t-emerald-400" delay={1} />
                <StatCard icon="📦" label="Palletized Orders" value={sum('palletizedOrders').toLocaleString()} color="border-t-cyan-400" delay={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <StatCard icon="✋" label="Manual Orders" value={sum('manualOrders').toLocaleString()} color="border-t-amber-400" delay={3} />
                <StatCard icon="🚚" label="Total Vehicles" value={sum('totalVehicles').toLocaleString()} color="border-t-purple-400" delay={4} />
                <StatCard icon="🏭" label="Current Stock" value={last('currentStock').toLocaleString()} delta="Latest entry" color="border-t-rose-400" delay={5} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <ChartCard title="Orders Trend" description="Planned vs Dispatched orders" delay={6}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['planned', 'dispatched']} xKey="date" colors={['#3b82f6', '#10b981']} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
                <ChartCard title="Dispatch Breakdown" description="Palletized vs Manual" delay={7}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['palletized', 'manual']} xKey="date" colors={['#06b6d4', '#f59e0b']} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Vehicles" description="Daily total vehicles" delay={8}>
                    {trend.length > 0 ? (
                        <ShadcnBarChart data={trend} dataKeys={['vehicles']} xKey="date" colors={['#a78bfa']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
                <ChartCard title="Stock Level" description="Current stock over time" delay={9}>
                    {trend.length > 0 ? (
                        <ShadcnLineChart data={trend} dataKeys={['stock']} xKey="date" colors={['#f43f5e']} showLegend={false} />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data yet</div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
}
