import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'MOVIE', venueId: '', date: '', premiumPrice: '', standardPrice: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/admin/venues').then(({ data }) => setVenues(data)).catch(() => {}); }, []);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      await api.post('/events', { ...form, premiumPrice: parseFloat(form.premiumPrice), standardPrice: parseFloat(form.standardPrice) });
      navigate('/organiser');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create event');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <h2 style={{ marginBottom: 28, fontWeight: 800 }}>Create New Event</h2>
      <div className="card">
        <div className="form-group"><label>Event Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Interstellar 3" /></div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description..." style={{ resize: 'vertical' }} /></div>
        <div className="grid-2">
          <div className="form-group"><label>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="MOVIE">Movie</option><option value="CONCERT">Concert</option>
            </select>
          </div>
          <div className="form-group"><label>Venue</label>
            <select value={form.venueId} onChange={e => setForm({ ...form, venueId: e.target.value })}>
              <option value="">Select venue</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Date & Time</label><input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="grid-2">
          <div className="form-group"><label>Premium Price (₹)</label><input type="number" value={form.premiumPrice} onChange={e => setForm({ ...form, premiumPrice: e.target.value })} placeholder="450" /></div>
          <div className="form-group"><label>Standard Price (₹)</label><input type="number" value={form.standardPrice} onChange={e => setForm({ ...form, standardPrice: e.target.value })} placeholder="280" /></div>
        </div>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/organiser')}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1, padding: 12 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}