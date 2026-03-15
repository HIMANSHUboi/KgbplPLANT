import { useAuth } from '../hooks/useAuth';
import { NavLink } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const APPS = [
    {
        id: 'production',
        icon: '🏭',
        title: 'Production Data',
        desc: 'Daily production volumes, line efficiency, OEE, yields, and critical issues',
        color: 'from-cyan-500/20 to-blue-600/20',
        border: 'border-cyan-500/30',
        accent: 'text-cyan-400',
        entryPath: '/app/production/enter',
        dashPath: '/app/production/dashboard',
    },
    {
        id: 'qse',
        icon: '🛡️',
        title: 'QSE Data',
        desc: 'Quality, Safety & Environment — TBT, BBS, water usage, ETP/STP readings',
        color: 'from-emerald-500/20 to-green-600/20',
        border: 'border-emerald-500/30',
        accent: 'text-emerald-400',
        entryPath: '/app/qse/enter',
        dashPath: '/app/qse/dashboard',
    },
    {
        id: 'maintenance',
        icon: '🔧',
        title: 'Maintenance Data',
        desc: 'Equipment breakdowns, preventive maintenance compliance, and critical issues',
        color: 'from-amber-500/20 to-orange-600/20',
        border: 'border-amber-500/30',
        accent: 'text-amber-400',
        entryPath: '/app/maintenance/enter',
        dashPath: '/app/maintenance/dashboard',
    },
    {
        id: 'hr',
        icon: '👥',
        title: 'HR Data',
        desc: 'Manpower productivity, open positions, and critical HR issues',
        color: 'from-purple-500/20 to-violet-600/20',
        border: 'border-purple-500/30',
        accent: 'text-purple-400',
        entryPath: '/app/hr/enter',
        dashPath: '/app/hr/dashboard',
    },
    {
        id: 'stores',
        icon: '📦',
        title: 'Stores & Shipping',
        desc: 'Stores inventory tracking, shipping data, and logistics management',
        color: 'from-rose-500/20 to-pink-600/20',
        border: 'border-rose-500/30',
        accent: 'text-rose-400',
        entryPath: '/app/stores/enter',
        dashPath: '/app/stores/dashboard',
    },
];

export default function AppHubPage() {
    const { user } = useAuth();
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="text-3xl">🏢</div>
                    <div>
                        <h1 className="font-mono text-2xl font-bold text-pf-text tracking-wide">
                            Kandhari Global Beverages
                        </h1>
                        <p className="text-xs text-pf-muted mt-0.5">
                            Daily Management System — {user?.plant?.name || 'All Plants'} · {today}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick stats bar */}
            <div className="glass-card p-4 mb-8 flex items-center gap-6 overflow-x-auto">
                <div className="flex items-center gap-2 text-xs text-pf-muted whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-pf-green animate-pulse" />
                    System Online
                </div>
                <div className="text-xs text-pf-muted whitespace-nowrap">
                    👤 Logged in as <strong className="text-pf-text">{user?.name}</strong>
                    <span className="ml-1 text-pf-accent">({user?.role?.replace(/_/g, ' ')})</span>
                </div>
                <div className="flex-1" />
                <NavLink to="/submit" className="text-xs text-pf-accent hover:text-pf-accent/80 transition-colors whitespace-nowrap">
                    📋 Quick Shift Log →
                </NavLink>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-5">
                <h2 className="font-mono text-base font-semibold text-pf-text tracking-wide uppercase">
                    DMS Applications
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-pf-accent/20 to-transparent" />
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {APPS.map((app, i) => (
                    <div
                        key={app.id}
                        className={`glass-card group relative overflow-hidden animate-slide-up`}
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        {/* Gradient top accent */}
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${app.color}`} />

                        <div className="p-6">
                            {/* Icon + Title */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${app.color} ${app.border} border`}>
                                    {app.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-mono text-lg font-bold ${app.accent}`}>
                                        {app.title}
                                    </h3>
                                    <p className="text-xs text-pf-muted mt-1 leading-relaxed">
                                        {app.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-5">
                                <NavLink
                                    to={app.entryPath}
                                    className={`flex-1 text-center pf-btn text-xs py-2.5 bg-gradient-to-r ${app.color} ${app.border} border ${app.accent} hover:brightness-125`}
                                >
                                    ➕ Enter Data
                                </NavLink>
                                <NavLink
                                    to={app.dashPath}
                                    className="flex-1 text-center pf-btn-ghost text-xs py-2.5"
                                >
                                    📊 Dashboard
                                </NavLink>
                            </div>
                        </div>

                        {/* Hover glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`} />
                    </div>
                ))}
            </div>

            {/* Admin Quick Links */}
            <div className="mt-8 flex items-center gap-3 mb-4">
                <h2 className="font-mono text-base font-semibold text-pf-text tracking-wide uppercase">
                    Administration
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-pf-accent/20 to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { to: '/', icon: '📊', label: 'Overview Dashboard' },
                    { to: '/submit', icon: '➕', label: 'Shift Log' },
                    { to: '/review', icon: '✅', label: 'Review Logs' },
                    { to: '/users', icon: '👥', label: 'Users' },
                    { to: '/export', icon: '⬇️', label: 'Export' },
                    { to: '/alerts', icon: '🔔', label: 'Alerts' },
                ].map((link, i) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className="glass-card px-4 py-3 text-center hover:bg-pf-accent/5 transition-colors group animate-slide-up"
                        style={{ animationDelay: `${(APPS.length + i) * 60}ms` }}
                    >
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{link.icon}</div>
                        <div className="text-[11px] text-pf-muted font-medium">{link.label}</div>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
