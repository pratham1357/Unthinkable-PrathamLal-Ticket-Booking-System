import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import api from '../utils/api';

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const fetchEvents = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (type) params.type = type;
      const { data } = await api.get('/events', { params });
      setEvents(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [search, type]);

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          Book Seats.<br />
          <span style={{ color: 'var(--accent2)' }}>Skip the queue.</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 16 }}>Movies, concerts, and more — with real-time seat selection.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." style={{ flex: 1, minWidth: 200 }} />
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: 160 }}>
          <option value="">All types</option>
          <option value="MOVIE">Movies</option>
          <option value="CONCERT">Concerts</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading events...</div> : events.length === 0 ? (
        <div className="empty">No events found.</div>
      ) : (
        <div className="grid-3">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}