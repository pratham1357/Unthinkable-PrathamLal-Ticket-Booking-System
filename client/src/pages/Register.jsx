import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ marginBottom: 6, fontWeight: 800 }}>Create account</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14 }}>Join TicketVault to start booking</p>

        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" /></div>
        <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div>
        <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" /></div>
        <div className="form-group">
          <label>I am registering as</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="CUSTOMER">Customer</option>
            <option value="ORGANISER">Event Organiser</option>
          </select>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}