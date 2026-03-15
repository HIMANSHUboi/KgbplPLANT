import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { getPlantStats } from '../api/entries';
import { StatCard, ChartCard, ShadcnAreaChart, ShadcnBarChart, ShadcnPieChart, ShadcnGaugeChart } from '../components/Charts';

export default function DashboardPage() {
  const [range, setRange] = useState('7d');
  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;

  const { data, isLoading } = useQuery({
    queryKey: ['plant-stats', days],
    queryFn: () => getPlantStats({ days }).then(r => r.data),
  });

  if (isLoading) return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader title="Overview Dashboard" subtitle="Loading..." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const stats = data || {};
  const totalProduction = stats.totalGross || 0;
  const avgOee = stats.avgOEE ? stats.avgOEE.toFixed(1) : '0';
  const pendingReview = stats.pending || 0;
  const alertCount = stats.alertCount || 0;

  // Build trend data from byDay
  const byDay = stats.byDay || {};
  const trend = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, d]) => ({
      date: new Date(day).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      production: d.gross || 0,
      oee: d.oeeCount > 0 ? parseFloat((d.oeeSum / d.oeeCount).toFixed(1)) : 0,
    }));

  // Status distribution for pie
  const statusData = [
    { name: 'Approved', value: stats.approved || 0 },
    { name: 'Pending', value: stats.pendingAll || stats.pending || 0 },
    { name: 'Rejected', value: stats.rejected || 0 },
  ].filter(d => d.value > 0);

  const totalLogs = statusData.reduce((s, d) => s + d.value, 0);

  const formatLastUpdated = (ts) => {
    if (!ts) return '';
    return ` • Last updated: ${new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Overview Dashboard" subtitle={`Plant performance summary — last ${days} days${formatLastUpdated(stats.lastUpdated)}`}>
        <div className="flex gap-1 rounded-lg p-0.5 border border-pf-border" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          {[{ v: '7d', l: '7D' }, { v: '14d', l: '14D' }, { v: '30d', l: '30D' }].map(opt => (
            <button key={opt.v} onClick={() => setRange(opt.v)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${range === opt.v ? 'bg-pf-accent/15 text-pf-accent' : 'text-pf-muted hover:text-pf-text'}`}>
              {opt.l}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon="📦" label="Total Production" value={totalProduction.toLocaleString()} delta={`Last ${days} days`} color="border-t-cyan-400" delay={0} />
        <StatCard icon="⚡" label="Avg OEE" value={`${avgOee}%`} delta="Plant average" trend={Number(avgOee) >= 85 ? 'up' : 'down'} color="border-t-emerald-400" delay={1} />
        <StatCard icon="⏳" label="Pending Review" value={pendingReview} delta="Shift logs" color="border-t-amber-400" delay={2} />
        <StatCard icon="🔔" label="Active Alerts" value={alertCount} delta="Unread" trend={alertCount > 5 ? 'down' : undefined} color="border-t-rose-400" delay={3} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Production Trend" description="Daily output over time" className="lg:col-span-2" delay={4}>
          {trend.length > 0 ? (
            <ShadcnAreaChart data={trend} dataKeys={['production']} xKey="date" colors={['#00d4ff']} showLegend={false} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-pf-muted text-xs">No data available</div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Log Status" description="Approval breakdown" className="lg:col-span-1" delay={6}>
          {statusData.length > 0 ? (
            <ShadcnPieChart data={statusData} colors={['#10b981', '#f59e0b', '#f43f5e']} height={240}
              centerLabel="Total" centerValue={String(totalLogs)} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-pf-muted text-xs">No data available</div>
          )}
        </ChartCard>

        <ChartCard title="Daily Breakdown" description="Production by day" className="lg:col-span-2" delay={7}>
          {trend.length > 0 ? (
            <ShadcnBarChart data={trend} dataKeys={['production']} xKey="date" colors={['#00d4ff']} showLegend={false} height={240} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-pf-muted text-xs">No data available</div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}