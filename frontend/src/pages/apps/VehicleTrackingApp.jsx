import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { createVehicleEntry, getVehicles, updateVehicleStatus, getVehicleStats, getVehicleTAT } from '../../api/vehicles';
import toast from 'react-hot-toast';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

// ─── Stage Definitions ──────────────────────────────────────────────────────
const STAGES = [
    { id: 'GATE_IN', label: 'Gate Entry', icon: '🚪', color: '#6366f1' },
    { id: 'DOCK_REPORT', label: 'Dock Report', icon: '📋', color: '#f59e0b' },
    { id: 'LOADING', label: 'Loading', icon: '🚚', color: '#3b82f6' },
    { id: 'INVOICE', label: 'Invoice', icon: '📄', color: '#8b5cf6' },
    { id: 'GATE_EXIT', label: 'Gate Exit', icon: '🏁', color: '#10b981' },
];

const TABS = [
    ...STAGES,
    { id: 'COMPLETED', label: 'Completed', icon: '✅', color: '#22c55e' },
    { id: 'ANALYTICS', label: 'Analytics', icon: '📊', color: '#0ea5e9' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function elapsed(from, to) {
    if (!from) return '—';
    const diff = Math.floor(((to || Date.now()) - new Date(from)) / 60000);
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

function StageProgressDots({ vehicle }) {
    return (
        <div className="flex items-center gap-1 mt-1">
            {STAGES.map((s, i) => {
                const stageOrder = ['GATE_IN', 'DOCK_REPORT', 'LOADING', 'INVOICE', 'GATE_EXIT', 'COMPLETED'];
                const vehicleIdx = stageOrder.indexOf(vehicle.status);
                const stageIdx = stageOrder.indexOf(s.id);
                const done = vehicleIdx > stageIdx;
                const current = vehicleIdx === stageIdx;
                return (
                    <span key={s.id} className="flex items-center gap-1">
                        <span
                            title={s.label}
                            className={`w-2 h-2 rounded-full inline-block transition-all ${done ? 'bg-emerald-500' :
                                current ? 'bg-pf-accent ring-2 ring-pf-accent/30' :
                                    'bg-slate-200'
                                }`}
                        />
                        {i < STAGES.length - 1 && (
                            <span className={`w-4 h-px inline-block ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                        )}
                    </span>
                );
            })}
        </div>
    );
}

function StatCard({ label, value, icon, sub, color }) {
    return (
        <div className="glass-card p-5 flex items-center gap-4">
            <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl" style={{ background: color + '22' }}>
                {icon}
            </div>
            <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
                <p className="text-2xl font-extrabold text-pf-text">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-pf-border rounded-xl shadow-lg px-4 py-2 text-sm">
            <p className="font-bold text-pf-text">{label}</p>
            <p className="text-pf-accent">{payload[0].value} vehicles</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VehicleTrackingApp() {
    const [activeTab, setActiveTab] = useState('GATE_IN');
    const [checkedRows, setCheckedRows] = useState({});
    const [loadingQuantities, setLoadingQuantities] = useState({});
    const [formData, setFormData] = useState({
        vehicleNumber: '', transporterName: '', destination: '',
        driverContact: '', vehicleCapacity: '', agency: '', shift: 'GENERAL'
    });

    const queryClient = useQueryClient();

    const { data: vehicles = [], isLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => getVehicles().then(r => r.data),
        refetchInterval: 30000 // auto-refresh every 30s
    });

    const { data: stats } = useQuery({
        queryKey: ['vehicleStats'],
        queryFn: () => getVehicleStats().then(r => r.data),
        enabled: activeTab === 'ANALYTICS'
    });

    const { data: tatStats } = useQuery({
        queryKey: ['vehicleTat'],
        queryFn: () => getVehicleTAT().then(r => r.data),
        enabled: activeTab === 'ANALYTICS'
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, nextStatus, supplyLoaded }) => updateVehicleStatus(id, nextStatus, supplyLoaded),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries(['vehicles']);
            queryClient.invalidateQueries(['vehicleStats']);
            toast.success(vars.nextStatus === 'COMPLETED'
                ? '🎉 Vehicle journey completed!'
                : '✅ Vehicle advanced to next stage');
            setCheckedRows(prev => { const n = { ...prev }; delete n[vars.id]; return n; });
            setLoadingQuantities(prev => { const n = { ...prev }; delete n[vars.id]; return n; });
        },
        onError: () => toast.error('Failed to update vehicle status')
    });

    const createMutation = useMutation({
        mutationFn: createVehicleEntry,
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicles']);
            toast.success('🚚 Gate entry recorded!');
            setFormData({ vehicleNumber: '', transporterName: '', destination: '', driverContact: '', vehicleCapacity: '', agency: '', shift: 'GENERAL' });
        },
        onError: () => toast.error('Failed to record gate entry')
    });

    const handleCreate = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleAdvance = (v) => {
        const stageOrder = ['GATE_IN', 'DOCK_REPORT', 'LOADING', 'INVOICE', 'GATE_EXIT'];
        const currentIndex = stageOrder.indexOf(v.status);
        const isLastStage = v.status === 'GATE_EXIT';

        if (v.status === 'LOADING' && !loadingQuantities[v.id]) {
            return toast.error('Please enter supply loaded quantity first.');
        }

        const nextStatus = isLastStage ? 'COMPLETED' : stageOrder[currentIndex + 1];
        const supplyLoaded = v.status === 'LOADING' ? loadingQuantities[v.id] : undefined;
        statusMutation.mutate({ id: v.id, nextStatus, supplyLoaded });
    };

    const countFor = (status) => vehicles.filter(v => v.status === status).length;
    const todayVehicles = vehicles.filter(v => {
        const d = new Date(v.gateInTime);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    });

    // ─── Stage Progress Header ────────────────────────────────────────────────
    const renderPipeline = () => (
        <div className="flex items-center justify-between mb-6 px-2 py-3 bg-white/50 rounded-xl border border-pf-border">
            {STAGES.map((stage, i) => {
                const count = countFor(stage.id);
                return (
                    <div key={stage.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1 gap-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all ${activeTab === stage.id
                                ? 'border-pf-accent bg-pf-accent/10 shadow-md scale-110'
                                : 'border-slate-200 bg-white'
                                }`}>
                                {stage.icon}
                            </div>
                            <p className="text-[10px] text-center font-semibold text-slate-500 max-w-[60px] leading-tight">{stage.label}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                                {count}
                            </span>
                        </div>
                        {i < STAGES.length - 1 && (
                            <div className={`h-0.5 w-6 mx-1 rounded ${count > 0 ? 'bg-amber-300' : 'bg-slate-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );

    // ─── Vehicle Table (shared for stages 2-5) ────────────────────────────────
    const renderVehicleTable = (stageId) => {
        const stageVehicles = vehicles.filter(v => v.status === stageId);
        const isExitStage = stageId === 'GATE_EXIT';
        const isCompleted = stageId === 'COMPLETED';
        const showSupplyInput = stageId === 'LOADING';
        const showSupplyRead = ['INVOICE', 'GATE_EXIT', 'COMPLETED'].includes(stageId);
        const nextStageLabel = isExitStage ? 'Complete Exit' : STAGES[STAGES.findIndex(s => s.id === stageId) + 1]?.label;

        if (isLoading) return (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pf-accent border-t-transparent rounded-full animate-spin" /></div>
        );
        if (stageVehicles.length === 0) return (
            <div className="text-center py-24 text-slate-400">
                <div className="text-5xl mb-4 opacity-40">{isCompleted ? '✅' : '🚚'}</div>
                <p className="font-medium">{isCompleted ? 'No vehicles completed today.' : 'No vehicles in this stage.'}</p>
            </div>
        );

        return (
            <div className="overflow-x-auto">
                <table className="pf-table w-full">
                    <thead>
                        <tr>
                            {!isCompleted && <th className="w-10 pl-4"><span className="sr-only">Confirm</span></th>}
                            <th className="pl-4">Token</th>
                            <th>Vehicle No.</th>
                            <th>Transporter</th>
                            <th>Contact</th>
                            <th>Gate-In</th>
                            <th>Stage Time</th>
                            {showSupplyInput && <th>Qty Loaded</th>}
                            {showSupplyRead && <th>Qty Loaded</th>}
                            {!isCompleted && <th className="pr-4 text-right">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {stageVehicles.map(v => {
                            const isChecked = !!checkedRows[v.id];
                            const canProceed = isChecked && (!showSupplyInput || loadingQuantities[v.id]);

                            // Time at current stage
                            const stageTimeField = {
                                DOCK_REPORT: v.dockReportTime,
                                LOADING: v.loadingTime,
                                INVOICE: v.invoiceTime,
                                GATE_EXIT: v.gateExitTime,
                            };
                            const stageStart = stageTimeField[stageId] || v.gateInTime;

                            return (
                                <tr key={v.id} className={`transition-colors group ${isChecked ? 'bg-emerald-50/60' : 'hover:bg-white/50'}`}>
                                    {!isCompleted && (
                                        <td className="pl-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => setCheckedRows(p => ({ ...p, [v.id]: e.target.checked }))}
                                                className="w-4 h-4 rounded accent-pf-accent cursor-pointer"
                                                title="Check to confirm advancement"
                                            />
                                        </td>
                                    )}
                                    <td className="pl-4 font-mono font-bold text-pf-muted text-base">
                                        #{v.tokenNumber}
                                        <StageProgressDots vehicle={v} />
                                    </td>
                                    <td className="font-mono text-[15px] font-bold text-pf-accent">{v.vehicleNumber}</td>
                                    <td className="text-sm font-medium">{v.transporterName}</td>
                                    <td className="text-sm text-slate-400">{v.driverContact}</td>
                                    <td className="text-xs text-slate-500">{new Date(v.gateInTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</td>
                                    <td className="text-xs text-slate-400">
                                        {isCompleted
                                            ? <span className="text-emerald-600 font-semibold">Done</span>
                                            : <span className="font-semibold text-amber-600">{elapsed(stageStart)}</span>
                                        }
                                    </td>
                                    {showSupplyInput && (
                                        <td>
                                            <input
                                                type="number" step="any" min="0"
                                                value={loadingQuantities[v.id] || ''}
                                                onChange={e => setLoadingQuantities(p => ({ ...p, [v.id]: e.target.value }))}
                                                className="pf-input py-1 px-2 w-24 bg-white border-pf-border text-sm"
                                                placeholder="Qty"
                                            />
                                        </td>
                                    )}
                                    {showSupplyRead && (
                                        <td className="font-semibold text-emerald-600">{v.supplyLoaded ?? '—'}</td>
                                    )}
                                    {!isCompleted && (
                                        <td className="pr-4 text-right">
                                            <button
                                                onClick={() => handleAdvance(v)}
                                                disabled={!canProceed || statusMutation.isPending}
                                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 ml-auto
                                                    ${canProceed
                                                        ? isExitStage
                                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                            : 'bg-pf-accent hover:bg-pf-accent/85 text-white'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                            >
                                                {isExitStage ? '🏁' : '→'}{' '}
                                                {canProceed ? (isExitStage ? 'Complete Exit' : `To ${nextStageLabel}`) : 'Check to proceed'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // ─── Analytics Tab ────────────────────────────────────────────────────────
    const renderAnalytics = () => {
        if (!stats || !tatStats) return (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pf-accent border-t-transparent rounded-full animate-spin" /></div>
        );

        // Last 7 days for bar chart
        const last7 = stats.daily ? stats.daily.slice(-7) : [];
        const weeklyData = stats.weekly || [];

        return (
            <div className="p-6 lg:p-8 space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Today's Total" value={stats.todayTotal ?? 0} icon="🚚" color="#6366f1" sub="Vehicles registered today" />
                    <StatCard label="Completed Today" value={stats.todayCompleted ?? 0} icon="✅" color="#22c55e" sub="Full gate-in → gate-out" />
                    <StatCard label="Currently Active" value={stats.activeVehicles ?? 0} icon="⏱" color="#f59e0b" sub="In-plant right now" />
                </div>

                {/* Daily bar chart (last 7 days) and Weekly line chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="glass-card p-6">
                        <h3 className="text-base font-bold text-pf-text mb-1">Daily Completed Vehicles <span className="text-slate-400 font-normal text-sm">(last 7 days)</span></h3>
                        <p className="text-xs text-slate-400 mb-4">Number of vehicles that fully exited each day</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={last7} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }}
                                    tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {last7.map((entry, i) => (
                                        <Cell key={i} fill={entry.count > 0 ? '#6366f1' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-base font-bold text-pf-text mb-1">Weekly Trend <span className="text-slate-400 font-normal text-sm">(last 4 weeks)</span></h3>
                        <p className="text-xs text-slate-400 mb-4">Total completed vehicles per week</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone" dataKey="count"
                                    stroke="#6366f1" strokeWidth={2.5}
                                    dot={{ fill: '#6366f1', r: 4 }}
                                    activeDot={{ r: 6, fill: '#4f46e5' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TAT KPI Cards */}
                <h3 className="text-lg font-bold text-pf-text mt-8 mb-2 border-b border-pf-border pb-2">Turn-Around Time (TAT) Analytics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <StatCard label="Gate → Dock" value={`${tatStats.kpis.gateToDock || 0}m`} icon="📋" color="#f59e0b" />
                    <StatCard label="Dock → Load" value={`${tatStats.kpis.dockToLoading || 0}m`} icon="🚚" color="#3b82f6" />
                    <StatCard label="Load → Invoice" value={`${tatStats.kpis.loadingToInvoice || 0}m`} icon="📄" color="#8b5cf6" />
                    <StatCard label="Invoice → Exit" value={`${tatStats.kpis.invoiceToExit || 0}m`} icon="🏁" color="#10b981" />
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard label="Avg Total TAT" value={`${tatStats.kpis.total || 0}m`} icon="⏱️" color="#0ea5e9" sub="Gate-In to Gate-Exit" />
                    </div>
                </div>

                {/* TAT Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-4">
                    <div className="glass-card p-6">
                        <h3 className="text-base font-bold text-pf-text mb-1">Avg TAT Trend <span className="text-slate-400 font-normal text-sm">(last 14 days)</span></h3>
                        <p className="text-xs text-slate-400 mb-4">Daily average total turn-around time (minutes)</p>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={tatStats.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tatGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="avgTotal" stroke="#0ea5e9" fillOpacity={1} fill="url(#tatGrad)" strokeWidth={2} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-base font-bold text-pf-text mb-1">TAT Stage Breakdown <span className="text-slate-400 font-normal text-sm">(last 14 days)</span></h3>
                        <p className="text-xs text-slate-400 mb-4">Average minutes spent in each stage per day</p>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={tatStats.stageBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar dataKey="Gate Entry" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Loading" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="Invoice" stackId="a" fill="#8b5cf6" />
                                <Bar dataKey="Exit" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="p-6 lg:p-8 animate-fade-in max-w-7xl mx-auto">
            <PageHeader title="Plant Vehicle Tracking 🚚" subtitle="Sequential gate management — check the box to advance each stage" />

            {/* Pipeline overview (stages only, not analytics/completed tabs) */}
            {!['ANALYTICS', 'COMPLETED'].includes(activeTab) && renderPipeline()}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1.5 mb-6 bg-white/40 p-1.5 rounded-xl border border-pf-border backdrop-blur-md">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    const count = ['ANALYTICS'].includes(tab.id)
                        ? null
                        : tab.id === 'COMPLETED'
                            ? vehicles.filter(v => v.status === 'COMPLETED').length
                            : countFor(tab.id);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 flex-1 min-w-[100px] justify-center py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200
                                ${isActive ? 'bg-pf-accent text-white shadow-sm' : 'text-slate-600 hover:text-pf-text hover:bg-white/60 border border-transparent'}`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {count !== null && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center ${isActive
                                    ? 'bg-white/25 text-white'
                                    : count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main content card */}
            <div className="glass-card overflow-hidden min-h-[420px]">

                {/* ── GATE ENTRY TAB ────────────────────────────────────── */}
                {activeTab === 'GATE_IN' && (
                    <div>
                        {/* Entry Form */}
                        <div className="p-6 lg:p-8 border-b border-pf-border">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-pf-accent text-lg">●</span>
                                <div>
                                    <h2 className="text-lg font-bold text-pf-text">Gate Entry Registration</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Fill in vehicle details to issue a token</p>
                                </div>
                            </div>
                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[
                                    { label: 'Vehicle Number *', key: 'vehicleNumber', placeholder: 'e.g. PB02EG3237', required: true, upper: true },
                                    { label: 'Transporter / Name *', key: 'transporterName', placeholder: 'e.g. Own / Avneet Transport', required: true },
                                    { label: 'Driver Contact *', key: 'driverContact', placeholder: 'Mobile Number', required: true },
                                    { label: 'Destination', key: 'destination', placeholder: 'City / Plant' },
                                    { label: 'Vehicle Capacity', key: 'vehicleCapacity', placeholder: 'e.g. 10 Ton' },
                                    { label: 'Agency / Customer', key: 'agency', placeholder: 'Agency Details' },
                                ].map(({ label, key, placeholder, required, upper }) => (
                                    <div key={key} className="flex flex-col gap-1.5">
                                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold pl-1">{label}</label>
                                        <input
                                            type="text"
                                            required={required}
                                            value={formData[key]}
                                            onChange={e => setFormData({ ...formData, [key]: upper ? e.target.value.toUpperCase() : e.target.value })}
                                            className="pf-input bg-white/60 border-pf-border"
                                            placeholder={placeholder}
                                        />
                                    </div>
                                ))}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold pl-1">Shift</label>
                                    <select value={formData.shift} onChange={e => setFormData({ ...formData, shift: e.target.value })} className="pf-select bg-white/60 border-pf-border">
                                        <option value="GENERAL">General</option>
                                        <option value="A">Shift A</option>
                                        <option value="B">Shift B</option>
                                        <option value="C">Shift C</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
                                    <button type="submit" disabled={createMutation.isPending} className="pf-btn-primary px-8 py-2.5 bg-pf-accent text-white font-bold shadow-sm flex items-center gap-2 rounded-lg">
                                        {createMutation.isPending ? '⏳ Saving...' : '💾 Save Gate Entry'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Awaiting Dock Report — actionable advance section */}
                        <div className="p-4 border-t border-pf-border">
                            <div className="flex items-center gap-2 px-2 pb-4">
                                <span className="text-xl">📋</span>
                                <div>
                                    <h2 className="text-base font-bold text-pf-text">Awaiting Dock Report</h2>
                                    <p className="text-xs text-slate-400">✔ Check the box on each row, then click the button to advance to Dock Report</p>
                                </div>
                            </div>
                            {renderVehicleTable('GATE_IN')}
                        </div>
                    </div>
                )}

                {/* ── STAGE TABS (Dock Report → Gate Exit) ─────────────── */}
                {['DOCK_REPORT', 'LOADING', 'INVOICE', 'GATE_EXIT'].includes(activeTab) && (
                    <div className="p-4">
                        <div className="flex items-center gap-2 px-2 pb-4">
                            <span className="text-xl">{STAGES.find(s => s.id === activeTab)?.icon}</span>
                            <div>
                                <h2 className="text-base font-bold text-pf-text">{STAGES.find(s => s.id === activeTab)?.label}</h2>
                                <p className="text-xs text-slate-400">✔ Check the box on each row, then click the button to advance the vehicle</p>
                            </div>
                        </div>
                        {renderVehicleTable(activeTab)}
                    </div>
                )}

                {/* ── COMPLETED TAB ─────────────────────────────────────── */}
                {activeTab === 'COMPLETED' && (
                    <div className="p-4">
                        <div className="flex items-center gap-2 px-2 pb-4">
                            <span className="text-xl">✅</span>
                            <div>
                                <h2 className="text-base font-bold text-pf-text">Completed Vehicles</h2>
                                <p className="text-xs text-slate-400">All vehicles that have fully exited the plant</p>
                            </div>
                        </div>
                        {renderVehicleTable('COMPLETED')}
                    </div>
                )}

                {/* ── ANALYTICS TAB ─────────────────────────────────────── */}
                {activeTab === 'ANALYTICS' && renderAnalytics()}
            </div>
        </div>
    );
}
