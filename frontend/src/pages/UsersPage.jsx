import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, bulkUploadUsers } from '../api/users';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';

const ROLE_COLORS = {
  OPERATOR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SHIFT_SUPERVISOR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PLANT_MANAGER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ADMIN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  GLOBAL_ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'OPERATOR', department: '', empId: '', designation: '', contactNo: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries(['users']); resetForm(); },
    onError: (e) => toast.error(e?.response?.data?.error || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries(['users']); resetForm(); },
    onError: (e) => toast.error(e?.response?.data?.error || 'Failed'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }) => updateUser(id, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['users']); },
  });

  const uploadMut = useMutation({
    mutationFn: bulkUploadUsers,
    onSuccess: (res) => {
      setUploadResult(res.data);
      qc.invalidateQueries(['users']);
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Upload failed'),
  });

  const resetForm = () => { setShowForm(false); setEditUser(null); setForm({ name: '', phone: '', password: '', role: 'OPERATOR', department: '', empId: '', designation: '', contactNo: '' }); };

  const handleEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, phone: u.phone || '', password: '', role: u.role, department: u.department || '', empId: u.empId || '', designation: u.designation || '', contactNo: u.contactNo || '' });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editUser) {
      const data = { ...form };
      if (!data.password) delete data.password;
      updateMut.mutate({ id: editUser.id, data });
    } else {
      createMut.mutate(form);
    }
  };

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Please select a file');
    const fd = new FormData();
    fd.append('file', file);
    uploadMut.mutate(fd);
  };

  const users = data || [];

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader title="User Management" subtitle={`${users.length} users total`}>
        <div className="flex gap-2">
          <button onClick={() => setShowUpload(true)} className="pf-btn-ghost text-xs">📤 Bulk Upload</button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="pf-btn-primary text-xs">➕ Add User</button>
        </div>
      </PageHeader>

      {/* Bulk Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowUpload(false); setUploadResult(null); }}>
          <div className="glass-card w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-lg font-semibold text-pf-text mb-4">📤 Bulk Upload Users</h3>

            {!uploadResult ? (
              <>
                <div className="border-2 border-dashed border-pf-border rounded-xl p-8 text-center hover:border-pf-accent/30 transition-colors mb-4">
                  <div className="text-4xl mb-3 opacity-50">📁</div>
                  <p className="text-sm text-pf-muted mb-3">Select an Excel file (.xlsx)</p>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="text-xs text-pf-muted" />
                </div>

                <div className="glass-card p-4 mb-4 text-xs text-pf-muted">
                  <p className="font-semibold text-pf-text mb-2">Expected columns (in order):</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Name *</li>
                    <li>Phone Number *</li>
                    <li>Password *</li>
                    <li>Role (OPERATOR, SHIFT_SUPERVISOR, etc.)</li>
                    <li>Department</li>
                    <li>Employee ID</li>
                    <li>Designation</li>
                    <li>Contact Number</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleUpload} disabled={uploadMut.isPending} className="pf-btn-primary text-xs flex-1">
                    {uploadMut.isPending ? 'Uploading...' : '🚀 Upload & Create Users'}
                  </button>
                  <button onClick={() => setShowUpload(false)} className="pf-btn-ghost text-xs">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-xl border mb-4 ${uploadResult.failed > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <p className="text-sm font-medium text-pf-text mb-1">{uploadResult.message}</p>
                  <p className="text-xs text-pf-muted">✅ Created: {uploadResult.success} · ❌ Failed: {uploadResult.failed}</p>
                </div>

                {uploadResult.errors?.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto glass-card p-3 mb-4">
                    <p className="text-xs font-semibold text-red-400 mb-2">Errors:</p>
                    {uploadResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-pf-muted">Row {e.row}: {e.error}</p>
                    ))}
                  </div>
                )}

                <button onClick={() => { setShowUpload(false); setUploadResult(null); }} className="pf-btn-primary text-xs w-full">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-card p-6 mb-5 animate-slide-up">
          <h3 className="font-mono text-sm font-semibold text-pf-accent mb-4">
            {editUser ? '✏️ Edit User' : '➕ New User'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="pf-label">Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required className="pf-input" />
              </div>
              <div>
                <label className="pf-label">Phone Number *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required className="pf-input" disabled={!!editUser} pattern="[0-9]{10}" maxLength={10} placeholder="9876543210" />
              </div>
              <div>
                <label className="pf-label">{editUser ? 'New Password (optional)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required={!editUser} minLength={6} className="pf-input" />
              </div>
              <div>
                <label className="pf-label">Role</label>
                <select value={form.role} onChange={e => set('role', e.target.value)} className="pf-select">
                  <option value="OPERATOR">Operator</option>
                  <option value="SHIFT_SUPERVISOR">Shift Supervisor</option>
                  <option value="PLANT_MANAGER">Plant Manager</option>
                  <option value="ADMIN">Admin</option>
                  {me?.role === 'GLOBAL_ADMIN' && <option value="GLOBAL_ADMIN">Global Admin</option>}
                </select>
              </div>
              <div>
                <label className="pf-label">Employee ID</label>
                <input value={form.empId} onChange={e => set('empId', e.target.value)} className="pf-input" />
              </div>
              <div>
                <label className="pf-label">Department</label>
                <input value={form.department} onChange={e => set('department', e.target.value)} className="pf-input" />
              </div>
              <div>
                <label className="pf-label">Designation</label>
                <input value={form.designation} onChange={e => set('designation', e.target.value)} className="pf-input" />
              </div>
              <div>
                <label className="pf-label">Contact</label>
                <input value={form.contactNo} onChange={e => set('contactNo', e.target.value)} className="pf-input" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="pf-btn-primary text-xs">
                {(createMut.isPending || updateMut.isPending) ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={resetForm} className="pf-btn-ghost text-xs">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? <SkeletonTable rows={6} cols={6} /> : users.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4 opacity-30">👥</div>
          <p className="text-pf-muted text-sm">No users found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="font-medium text-pf-text">{u.name}</div>
                    {u.empId && <div className="text-[10px] text-pf-muted">{u.empId}</div>}
                  </td>
                  <td className="text-xs text-pf-muted">{u.phone}</td>
                  <td>
                    <span className={`pf-badge ${ROLE_COLORS[u.role] || ''}`}>
                      {u.role?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-xs text-pf-muted">{u.department || '—'}</td>
                  <td>
                    <button
                      onClick={() => toggleMut.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      className={`pf-badge ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} cursor-pointer hover:brightness-125`}
                    >
                      {u.status}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(u)} className="text-xs text-pf-accent hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}