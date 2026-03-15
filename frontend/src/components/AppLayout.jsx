import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';

const APP_META = {
    production: { icon: '🏭', title: 'Production Data', accent: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-600/20' },
    qse: { icon: '🛡️', title: 'QSE Data', accent: 'text-emerald-400', bg: 'from-emerald-500/20 to-green-600/20' },
    maintenance: { icon: '🔧', title: 'Maintenance Data', accent: 'text-amber-400', bg: 'from-amber-500/20 to-orange-600/20' },
    hr: { icon: '👥', title: 'HR Data', accent: 'text-purple-400', bg: 'from-purple-500/20 to-violet-600/20' },
    stores: { icon: '📦', title: 'Stores & Shipping', accent: 'text-rose-400', bg: 'from-rose-500/20 to-pink-600/20' },
};

export default function AppLayout() {
    const { appId } = useParams();
    const navigate = useNavigate();
    const meta = APP_META[appId] || APP_META.production;

    const links = [
        { to: `/app/${appId}/enter`, icon: '➕', label: 'Enter Data' },
        { to: `/app/${appId}/dashboard`, icon: '📊', label: 'Dashboard' },
        { to: `/app/${appId}/history`, icon: '📋', label: 'History' },
    ];

    return (
        <div className="animate-fade-in">
            {/* App top bar */}
            <div className={`border-b border-pf-border/60 bg-gradient-to-r ${meta.bg}`} style={{ backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)' }}>
                <div className="px-6 py-3 flex items-center gap-4 overflow-x-auto">
                    <button
                        onClick={() => navigate('/hub')}
                        className="text-pf-muted hover:text-pf-text transition-colors text-xs flex items-center gap-1 shrink-0"
                    >
                        ← Hub
                    </button>
                    <div className="w-px h-5 bg-pf-border shrink-0" />
                    <span className="text-2xl shrink-0">{meta.icon}</span>
                    <span className={`font-mono text-base font-bold ${meta.accent} whitespace-nowrap`}>{meta.title}</span>
                    <div className="flex-1" />
                    <nav className="flex gap-1">
                        {links.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive
                                        ? `bg-white/80 ${meta.accent} border border-pf-border shadow-sm`
                                        : 'text-pf-dim hover:text-pf-text hover:bg-white/50'
                                    }`
                                }
                            >
                                <span>{link.icon}</span>
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* App content */}
            <Outlet />
        </div>
    );
}
