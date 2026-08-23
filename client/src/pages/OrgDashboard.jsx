import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function OrgDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/organiser/events').then(({ data }) => setEvents(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h2 style={{ fontWeight: 800 }}>Organiser Dashboard</h2>
        <Link to="/organiser/create"><button className="btn-primary">+ New Event</button></Link>
      </div>
      {loading ? <div className="loading">Loading...</div> : events.length === 0 ? (
        <div className="empty">No events yet. <Link to="/organiser/create">Create one</Link></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {events.map(e => (
            <div key={e.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{e.title}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>{new Date(e.date).toLocaleDateString('en-IN')} · {e.venue?.name}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>Premium ₹{e.premiumPrice} / Standard ₹{e.standardPrice}</div>
              </div>
              <Link to={`/organiser/events/${e.id}`}>
                <button className="btn-secondary">View Analytics</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}