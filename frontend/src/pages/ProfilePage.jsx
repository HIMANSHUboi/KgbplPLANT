import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import { useToast } from '../components/Toast';

const ROLE_LABELS = {
    OPERATOR: 'Operator', SHIFT_SUPERVISOR: 'Shift Supervisor',
    PLANT_MANAGER: 'Plant Manager', ADMIN: 'Admin', GLOBAL_ADMIN: 'Global Admin',
};

export default function ProfilePage() {
    const { user } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }
        if (form.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            toast.success('Password changed successfully!');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to change password.');
        } finally { setLoading(false); }
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

    return (
        <div className="p-6 lg:p-8 max-w-[700px] animate-fade-in">
            <PageHeader title="Profile & Settings" subtitle="View your profile and manage your password." />

            {/* Profile Card */}
            <div className="glass-card p-6 lg:p-8 mb-6">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-xl bg-[#1a3158] flex items-center justify-center text-xl font-bold text-pf-accent border border-pf-accent/20 shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-pf-text">{user?.name}</h3>
                        <p className="text-sm text-pf-muted">{user?.phone}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-6">
                    {[
                        { label: 'Role', value: ROLE_LABELS[user?.role] || user?.role },
                        { label: 'Employee ID', value: user?.empId || '—' },
                        { label: 'Department', value: user?.department || '—' },
                        { label: 'Designation', value: user?.designation || '—' },
                        { label: 'Plant', value: user?.plant?.name || '—' },
                        { label: 'Contact', value: user?.contactNo || '—' },
                    ].map(f => (
                        <div key={f.label}>
                            <div className="text-[10px] text-pf-muted uppercase tracking-[1.5px] mb-1">{f.label}</div>
                            <div className="text-[13px] text-pf-text font-medium">{f.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Change Password */}
            <div className="glass-card p-6 lg:p-8">
                <h4 className="font-mono text-base font-semibold text-pf-text mb-1">Change Password</h4>
                <p className="text-xs text-pf-muted mb-5">Must be at least 6 characters.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="pf-label">Current Password</label>
                        <input type="password" value={form.currentPassword} onChange={e => set('currentPassword', e.target.value)} className="pf-input" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="pf-label">New Password</label>
                            <input type="password" value={form.newPassword} onChange={e => set('newPassword', e.target.value)} className="pf-input" required minLength={6} />
                        </div>
                        <div>
                            <label className="pf-label">Confirm Password</label>
                            <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} className="pf-input" required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="pf-btn-primary">
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
