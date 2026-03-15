import { useState } from 'react';
import PageHeader from '../components/PageHeader';

const SECTIONS = [
    {
        id: 'getting-started',
        icon: '🚀',
        title: 'Getting Started',
        color: 'text-cyan-400',
        items: [
            { q: 'How do I log in?', a: 'Navigate to the login page and enter your phone number and password. If you don\'t have an account, contact your administrator.' },
            { q: 'What is the App Hub?', a: 'The App Hub is your home page after logging in. It shows all 5 DMS applications as tile cards. Click "Enter Data" to submit daily data or "Dashboard" to view analytics.' },
            { q: 'What roles are available?', a: 'There are 5 roles: Operator (basic data entry), Shift Supervisor (review + approve), Plant Manager (reports + export), Admin (user management + audit), and Global Admin (all plants + all features).' },
        ],
    },
    {
        id: 'dms-apps',
        icon: '🏭',
        title: 'DMS Applications',
        color: 'text-emerald-400',
        items: [
            { q: 'What are the 5 DMS apps?', a: '1) Production Data — daily volumes, ME%, yields, POs\n2) QSE Data — safety (TBT, BBS), quality (yields, CIPs), environment (ETP/STP)\n3) Maintenance — breakdowns, PM compliance\n4) HR — manpower productivity, open positions\n5) Stores & Shipping — stores inventory and logistics' },
            { q: 'How do I enter daily data?', a: 'From the Hub, click "Enter Data" on any app tile, or use the sidebar links. Fill in the form fields and click "Save". Data is saved per date per plant — if you submit again for the same date, it updates the existing entry.' },
            { q: 'How do I view analytics?', a: 'Click "Dashboard" on any app tile, or navigate via the app\'s header bar tabs. Dashboards show KPI cards and interactive charts. Use the date range selector to adjust the time period.' },
        ],
    },
    {
        id: 'shift-logs',
        icon: '📋',
        title: 'Shift Logs',
        color: 'text-amber-400',
        items: [
            { q: 'How do I submit a shift log?', a: 'Go to "New Shift Log" in the sidebar. Fill in the shift details, production data, and any downtime/quality events. Click "Submit" to create the entry.' },
            { q: 'How does the review process work?', a: 'Shift Supervisors and above can review submitted logs. Go to "Review Logs" to see pending entries. You can approve or reject each log with optional comments.' },
            { q: 'Can I edit a submitted log?', a: 'Only logs with "Pending" status can be edited. Once approved or rejected, the log is locked. Contact your supervisor if changes are needed.' },
        ],
    },
    {
        id: 'user-management',
        icon: '👥',
        title: 'User Management',
        color: 'text-purple-400',
        items: [
            { q: 'How do I add a new user?', a: 'Go to "Users" in the sidebar (Admin only). Click "Add User" and fill in the details. The user will receive login credentials.' },
            { q: 'How do I bulk upload users?', a: 'Click "Bulk Upload" on the Users page. Upload an Excel file (.xlsx) with columns: Name, Phone Number, Password, Role, Department, Employee ID, Designation, Contact. The system validates each row and reports results.' },
            { q: 'How do I deactivate a user?', a: 'On the Users page, click the status badge (ACTIVE/INACTIVE) to toggle the user\'s status. Inactive users cannot log in.' },
        ],
    },
    {
        id: 'alerts',
        icon: '🔔',
        title: 'Alerts & Notifications',
        color: 'text-rose-400',
        items: [
            { q: 'What triggers an alert?', a: 'Alerts are triggered automatically when: OEE falls below threshold, excessive downtime is recorded, quality issues are detected, or system events occur.' },
            { q: 'How do I manage alerts?', a: 'Go to "Alerts" in the sidebar. You can filter by severity and type. Click "Mark read" to acknowledge an alert. Admins can delete alerts individually or in bulk using checkboxes.' },
        ],
    },
    {
        id: 'export',
        icon: '⬇️',
        title: 'Data Export',
        color: 'text-cyan-400',
        items: [
            { q: 'How do I export data?', a: 'Go to "Export Data" in the sidebar (Plant Manager and above). Select the date range and data type, then click "Export" to download an Excel file.' },
            { q: 'What formats are supported?', a: 'Currently, data is exported as .xlsx (Excel) files. CSV export may be added in future updates.' },
        ],
    },
];

export default function GuidePage() {
    const [openSection, setOpenSection] = useState('getting-started');
    const [openItem, setOpenItem] = useState({});

    const toggleItem = (sectionId, idx) => {
        setOpenItem(prev => ({
            ...prev,
            [`${sectionId}-${idx}`]: !prev[`${sectionId}-${idx}`],
        }));
    };

    return (
        <div className="p-6 lg:p-8 max-w-[900px] animate-fade-in">
            <PageHeader title="User Guide" subtitle="Learn how to use PlantFlow DMS" />

            {/* Quick nav */}
            <div className="glass-card p-4 mb-6 flex flex-wrap gap-2">
                {SECTIONS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setOpenSection(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${openSection === s.id ? `bg-white/[0.06] ${s.color} border border-white/[0.08]` : 'text-pf-muted hover:text-pf-text hover:bg-white/[0.04]'}`}
                    >
                        <span>{s.icon}</span> {s.title}
                    </button>
                ))}
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {SECTIONS.map(section => (
                    <div key={section.id} className={`glass-card overflow-hidden transition-all duration-300
            ${openSection === section.id ? 'ring-1 ring-pf-accent/20' : 'opacity-70 hover:opacity-100'}`}>
                        <button
                            onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
                            className="w-full px-6 py-4 flex items-center gap-3 text-left"
                        >
                            <span className="text-2xl">{section.icon}</span>
                            <span className={`font-mono text-base font-semibold ${section.color}`}>{section.title}</span>
                            <div className="flex-1" />
                            <span className="text-pf-muted text-xs">{section.items.length} topics</span>
                            <span className={`text-pf-muted transition-transform ${openSection === section.id ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {openSection === section.id && (
                            <div className="px-6 pb-4 space-y-2 animate-slide-down">
                                {section.items.map((item, idx) => (
                                    <div key={idx} className="border border-pf-border/50 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleItem(section.id, idx)}
                                            className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-white/[0.04] transition-colors"
                                        >
                                            <span className="text-pf-accent text-xs">Q</span>
                                            <span className="text-sm text-pf-text font-medium flex-1">{item.q}</span>
                                            <span className={`text-pf-muted text-xs transition-transform ${openItem[`${section.id}-${idx}`] ? 'rotate-180' : ''}`}>▾</span>
                                        </button>
                                        {openItem[`${section.id}-${idx}`] && (
                                            <div className="px-4 pb-3 border-t border-pf-border/30">
                                                <p className="text-sm text-pf-dim leading-relaxed mt-3 whitespace-pre-line">{item.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="glass-card p-6 mt-6 text-center">
                <p className="text-sm text-pf-muted">Need more help? Contact your plant administrator or IT support.</p>
                <p className="text-xs text-pf-muted mt-1">PlantFlow DMS v2.0 · Kandhari Global Beverages</p>
            </div>
        </div>
    );
}
