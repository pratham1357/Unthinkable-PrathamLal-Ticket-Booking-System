import { Link } from 'react-router-dom';

const TYPE_COLORS = { MOVIE: '#7c6ef7', CONCERT: '#f59e0b', DEFAULT: '#22c55e' };
const POSTER_COLORS = ['#1e1e3a', '#1a2a1a', '#2a1a1a', '#1a1a2a', '#2a2a1a'];

export default function EventCard({ event }) {
  const typeColor = TYPE_COLORS[event.type] || TYPE_COLORS.DEFAULT;
  const bg = POSTER_COLORS[event.id % POSTER_COLORS.length];
  const dateStr = new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s', display: 'flex', flexDirection: 'column', gap: 12 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
        <div style={{ height: 140, borderRadius: 7, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 48, opacity: 0.2, fontWeight: 900, position: 'absolute' }}>{event.type === 'MOVIE' ? '🎬' : '🎵'}</div>
          <span className="badge" style={{ background: typeColor + '33', color: typeColor, position: 'absolute', top: 10, right: 10 }}>{event.type}</span>
          <span style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', padding: '0 12px', position: 'relative' }}>{event.title}</span>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{event.title}</div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8 }}>{dateStr}</div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 10 }}>📍 {event.venue?.name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>From <strong style={{ color: 'var(--text)' }}>₹{event.standardPrice}</strong></span>
            <button className="btn-primary" style={{ padding: '5px 14px', fontSize: 12 }}>Book Now</button>
          </div>
        </div>
      </div>
    </Link>
  );
}