import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'ORGANISER') navigate('/organiser');
      else navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ marginBottom: 6, fontWeight: 800 }}>Welcome back</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14 }}>Sign in to your account</p>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}