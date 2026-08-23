import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/bookings'), api.get('/waitlist')]).then(([b, w]) => {
      setBookings(b.data); setWaitlist(w.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading" style={{ paddingTop: 80 }}>Loading...</div>;

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ marginBottom: 28, fontWeight: 800 }}>My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="empty">No bookings yet. <Link to="/">Browse events</Link></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bookings.map(b => (
            <Link key={b.id} to={`/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{b.event?.title || 'Event'}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13 }}>Ref: {b.reference} · {new Date(b.createdAt).toLocaleDateString('en-IN')}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13 }}>{b.bookingSeats?.length} seat{b.bookingSeats?.length !== 1 ? 's' : ''} · ₹{b.totalAmount}</div>
                </div>
                <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}`}>{b.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {waitlist.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Waitlist</h3>
          {waitlist.map(w => (
            <div key={w.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{w.event?.title}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13 }}>Category: {w.category} · Position #{w.position}</div>
                  {w.offers?.[0]?.status === 'PENDING' && (
                    <div style={{ marginTop: 8, color: 'var(--success)', fontSize: 13 }}>
                      🎟 Seat offer available! Expires {new Date(w.offers[0].expiresAt).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
                <span className={`badge ${w.status === 'OFFERED' ? 'badge-success' : 'badge-warn'}`}>{w.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}