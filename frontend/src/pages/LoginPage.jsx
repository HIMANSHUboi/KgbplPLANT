import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { login } from '../api/auth';
import companyLogo from '../assets/company-logo.png';

import Particles from '../components/Particles/Particles';

const QUICK = [
  { role: 'Global Admin', phone: '9876543210', password: 'admin123' },
  { role: 'Plant Mgr', phone: '9876543211', password: 'mgr123' },
  { role: 'Supervisor', phone: '9876543212', password: 'sup123' },
  { role: 'Operator', phone: '9876543213', password: 'op123' },
];

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (e, qPhone, qPass) => {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await login(qPhone || phone, qPass || password);
      signin(data.token, data.user);
      navigate(data.user.role === 'OPERATOR' ? '/submit' : '/');
    } catch (err) {
      const raw = err.response?.data?.error ?? err.response?.data?.message ?? err.message ?? 'Login failed';
      setError(typeof raw === 'string' ? raw : (raw?.message || JSON.stringify(raw)));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pf-bg relative overflow-hidden">
      {/* Particles background from react-bits */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleCount={250}
          particleSpread={12}
          speed={0.08}
          particleColors={['#00d4ff', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9']}
          moveParticlesOnHover={true}
          particleHoverFactor={1.2}
          alphaParticles={true}
          particleBaseSize={120}
          sizeRandomness={1.5}
          cameraDistance={22}
          disableRotation={false}
          className=""
        />
      </div>

      <div className="animate-slide-up z-10 relative">
        <div className="glass-card-lg p-12 w-[420px] max-w-[90vw] relative shadow-2xl shadow-black/50">
          <div className="flex justify-center mb-2">
            <img src={companyLogo} alt="Coca-Cola Kandhari Global" className="h-14 object-contain" />
          </div>
          <div className="text-center text-pf-muted text-[13px] mb-9">Daily Management System</div>

          {error && (
            <div className="bg-pf-red/10 border border-pf-red/30 rounded-lg px-3.5 py-2.5 text-[13px] text-pf-red mb-4 animate-fade-in">
              {typeof error === 'object' ? (error.message || JSON.stringify(error)) : error}
            </div>
          )}

          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <label className="pf-label">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" className="pf-input" pattern="[0-9]{10}" maxLength={10} />
            </div>
            <div>
              <label className="pf-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pf-input" />
            </div>
            <button type="submit" disabled={loading} className="pf-btn-primary w-full justify-center mt-2">
              {loading ? 'Authenticating...' : 'Sign In →'}
            </button>
          </form>

          {/* Credentials Display */}
          <div className="mt-8 pt-6 border-t border-pf-border">
            <h3 className="text-[11px] text-pf-muted tracking-[2px] font-bold mb-3 text-center">DEMO CREDENTIALS</h3>
            <div className="text-[12px] text-pf-text space-y-2 bg-white/50 p-3 rounded-lg border border-pf-border/50">
              {QUICK.map(q => (
                <div key={q.role} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm">
                  <span className="font-semibold text-pf-accent/80">{q.role}:</span>
                  <div className="font-mono text-[11px] text-slate-600 flex gap-2">
                    <span>{q.phone}</span>
                    <span className="text-slate-300">|</span>
                    <span>{q.password}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}