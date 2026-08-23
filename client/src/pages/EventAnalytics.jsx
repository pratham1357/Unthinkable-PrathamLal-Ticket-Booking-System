import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function EventAnalytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/organiser/events/${id}/summary`).then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading" style={{ paddingTop: 80 }}>Loading analytics...</div>;
  if (!data) return null;

  const { event, bookings, totalRevenue, totalSeats, bookedSeats, heldSeats, availableSeats } = data;
  const pct = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/organiser" style={{ fontSize: 13, color: 'var(--text2)' }}>← Dashboard</Link>
        <h2 style={{ fontWeight: 800, marginTop: 8 }}>{event.title}</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>{new Date(event.date).toLocaleString('en-IN')} — {event.venue?.name}</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'var(--success)' },
          { label: 'Confirmed Bookings', value: bookings.length, color: 'var(--accent2)' },
          { label: 'Seats Sold', value: `${bookedSeats} / ${totalSeats}`, color: 'var(--warn)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text2)' }}>
          <span>Occupancy</span><span>{pct}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 5, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
          <span>Booked: {bookedSeats}</span><span>Held: {heldSeats}</span><span>Available: {availableSeats}</span>
        </div>
      </div>

      <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Bookings</h3>
      {bookings.length === 0 ? <div className="empty">No bookings yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bookings.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.user?.name} <span style={{ color: 'var(--text2)', fontWeight: 400 }}>({b.user?.email})</span></div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{b.reference} · {b.bookingSeats?.length} seat(s) · ₹{b.totalAmount}</div>
              </div>
              <span className="badge badge-success">CONFIRMED</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}