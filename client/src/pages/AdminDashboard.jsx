import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [venues, setVenues] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', location: '' });
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/admin/overview').then(({ data }) => setOverview(data));
    api.get('/admin/venues').then(({ data }) => setVenues(data));
    api.get('/admin/users').then(({ data }) => setUsers(data));
  }, []);

  const handleCreateVenue = async () => {
    if (!form.name || !form.location) return setMsg('Name and location required');
    try {
      const { data } = await api.post('/admin/venues', {
        name: form.name, location: form.location,
        layout: {
          PREMIUM: { rows: ['A', 'B', 'C'], seatsPerRow: 8 },
          STANDARD: { rows: ['D', 'E', 'F'], seatsPerRow: 8 },
        },
      });
      setVenues(v => [...v, data]);
      setForm({ name: '', location: '' });
      setMsg(`Venue "${data.name}" created with 48 seats.`);
    } catch (e) { setMsg(e.response?.data?.error || 'Failed'); }
  };

  const TABS = ['overview', 'venues', 'users'];

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ fontWeight: 800, marginBottom: 24 }}>Admin Dashboard</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 18px', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && overview && (
        <div className="grid-2">
          {[
            { label: 'Total Revenue', value: `₹${overview.totalRevenue?.toLocaleString('en-IN') || 0}` },
            { label: 'Total Bookings', value: overview.totalBookings },
            { label: 'Total Events', value: overview.totalEvents },
            { label: 'Registered Users', value: overview.totalUsers },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent2)', marginBottom: 6 }}>{value}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'venues' && (
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Create Venue</h3>
            <div className="grid-2">
              <div className="form-group"><label>Venue Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Grand Cineplex 2" /></div>
              <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="South Mumbai" /></div>
            </div>
            {msg && <div style={{ fontSize: 13, color: msg.includes('created') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>{msg}</div>}
            <button className="btn-primary" onClick={handleCreateVenue}>Create Venue</button>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>Default layout: A-C PREMIUM (8 seats each), D-F STANDARD (8 seats each).</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {venues.map(v => (
              <div key={v.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 700 }}>{v.name}</div><div style={{ color: 'var(--text2)', fontSize: 13 }}>{v.location} · {v._count?.seats} seats</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</div></div>
              <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'ORGANISER' ? 'badge-warn' : 'badge-info'}`}>{u.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}