import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../api/auth';
import companyLogo from '../assets/company-logo.png';

const DMS_APPS = [
  { to: '/app/production/enter', icon: '🏭', label: 'Production Data' },
  { to: '/app/qse/enter', icon: '🛡️', label: 'QSE Data' },
  { to: '/app/maintenance/enter', icon: '🔧', label: 'Maintenance' },
  { to: '/app/hr/enter', icon: '👥', label: 'HR Data' },
  { to: '/app/stores/enter', icon: '📦', label: 'Stores & Shipping' },
];

const LOGISTICS_APPS = [
  { to: '/app/vehicles', icon: '🚚', label: 'Vehicle Tracking' },
];

const ADMIN_NAV = {
  OPERATOR: [
    { to: '/hub', icon: '🏠', label: 'Hub' },
    { to: '/submit', icon: '➕', label: 'New Shift Log' },
    { to: '/my-entries', icon: '📋', label: 'My Submissions' },
    { to: '/profile', icon: '⚙', label: 'Settings' },
  ],
  SHIFT_SUPERVISOR: [
    { to: '/hub', icon: '🏠', label: 'Hub' },
    { to: '/submit', icon: '➕', label: 'New Shift Log' },
    { to: '/my-entries', icon: '📋', label: 'My Submissions' },
    { to: '/review', icon: '✅', label: 'Review Logs' },
    { to: '/alerts', icon: '🔔', label: 'Alerts' },
    { to: '/profile', icon: '⚙', label: 'Settings' },
  ],
  PLANT_MANAGER: [
    { to: '/hub', icon: '🏠', label: 'Hub' },
    { to: '/dashboard', icon: '📊', label: 'Overview' },
    { to: '/review', icon: '✅', label: 'Review Logs' },
    { to: '/export', icon: '⬇', label: 'Export Data' },
    { to: '/alerts', icon: '🔔', label: 'Alerts' },
    { to: '/profile', icon: '⚙', label: 'Settings' },
  ],
  ADMIN: [
    { to: '/hub', icon: '🏠', label: 'Hub' },
    { to: '/dashboard', icon: '📊', label: 'Overview' },
    { to: '/review', icon: '✅', label: 'Review Logs' },
    { to: '/users', icon: '👤', label: 'Users' },
    { to: '/export', icon: '⬇', label: 'Export Data' },
    { to: '/alerts', icon: '🔔', label: 'Alerts' },
    { to: '/audit-log', icon: '📜', label: 'Activity Log' },
    { to: '/performance', icon: '🏆', label: 'Performance' },
    { to: '/profile', icon: '⚙', label: 'Settings' },
  ],
  GLOBAL_ADMIN: [
    { to: '/hub', icon: '🏠', label: 'Hub' },
    { to: '/dashboard', icon: '📊', label: 'Overview' },
    { to: '/review', icon: '✅', label: 'Review Logs' },
    { to: '/users', icon: '👤', label: 'Users' },
    { to: '/export', icon: '⬇', label: 'Export Data' },
    { to: '/alerts', icon: '🔔', label: 'Alerts' },
    { to: '/audit-log', icon: '📜', label: 'Activity Log' },
    { to: '/performance', icon: '🏆', label: 'Performance' },
    { to: '/profile', icon: '⚙', label: 'Settings' },
  ],
};

export default function Sidebar({ onClose }) {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const adminItems = ADMIN_NAV[user?.role] || ADMIN_NAV.OPERATOR;

  const handleLogout = async () => {
    try { await logout(); } catch { }
    signout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
    ${isActive
      ? 'bg-white/20 text-white border border-white/30 shadow-sm'
      : 'text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
    }`;

  return (
    <div className="w-[260px] h-full glass-surface flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <img src={companyLogo} alt="Coca-Cola Kandhari Global" className="h-10 object-contain" />
          <div className="text-[10px] text-white/60 tracking-[1px] mt-1 font-sans">Daily Management System</div>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white transition-colors p-1">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l8 8M14 6l-8 8" /></svg>
        </button>
      </div>

      {/* Plant info */}
      {user?.plant && (
        <div className="px-6 py-2 border-b border-white/10">
          <div className="text-[10px] text-white/60 uppercase tracking-[1.5px]">Plant</div>
          <div className="text-[13px] text-white font-medium">{user.plant.name}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {/* Admin nav */}
        <div className="space-y-0.5">
          {adminItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/hub'} onClick={onClose} className={linkClass}>
              <span className="text-base w-[22px] text-center group-hover:scale-110 transition-transform">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* DMS Separator */}
        <div className="flex items-center gap-2 mt-5 mb-2 px-3">
          <span className="text-[10px] text-white/60 uppercase tracking-[1.5px] font-semibold">DMS Apps</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* DMS app links */}
        <div className="space-y-0.5">
          {DMS_APPS.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
              <span className="text-base w-[22px] text-center group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[13px]">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Logistics Separator */}
        <div className="flex items-center gap-2 mt-5 mb-2 px-3">
          <span className="text-[10px] text-white/60 uppercase tracking-[1.5px] font-semibold">Logistics</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Logistics app links */}
        <div className="space-y-0.5">
          {LOGISTICS_APPS.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
              <span className="text-base w-[22px] text-center group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[13px]">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Help */}
        <div className="flex items-center gap-2 mt-5 mb-2 px-3">
          <span className="text-[10px] text-white/60 uppercase tracking-[1.5px] font-semibold">Help</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <NavLink to="/guide" onClick={onClose} className={linkClass}>
          <span className="text-base w-[22px] text-center group-hover:scale-110 transition-transform">📖</span>
          <span className="text-[13px]">User Guide</span>
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white border border-white/30 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">{user?.name}</div>
          <div className="text-[10px] text-white/60 capitalize mt-0.5">{user?.role?.replace('_', ' ').toLowerCase()}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="text-white/60 hover:text-white transition-colors text-xl p-1"
        >
          ⏻
        </button>
      </div>
    </div>
  );
}