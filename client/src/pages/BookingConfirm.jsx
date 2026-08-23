import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function BookingConfirm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state;

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state?.seatIds) return navigate(`/events/${id}`);
    api.get(`/events/${id}`).then(({ data }) => setEvent(data));
    api.get(`/events/${id}/seats`).then(({ data }) => {
      setSeats(data.filter(s => state.seatIds.includes(s.id)));
    });
  }, [id]);

  const totalAmount = seats.reduce((sum, ss) => {
    if (!event) return sum;
    return sum + (ss.seat?.category === 'PREMIUM' ? event.premiumPrice : event.standardPrice);
  }, 0);

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/bookings', { eventId: parseInt(id), seatIds: state.seatIds });
      navigate(`/bookings/${data.id}`, { state: { fromConfirm: true } });
    } catch (e) {
      setError(e.response?.data?.error || 'Booking failed');
      setLoading(false);
    }
  };

  if (!event) return <div className="loading" style={{ paddingTop: 80 }}>Loading...</div>;

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 800 }}>Confirm Booking</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 4, fontWeight: 700 }}>{event.title}</h3>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
          {new Date(event.date).toLocaleString('en-IN')} — {event.venue?.name}
        </p>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {seats.map(ss => (
            <div key={ss.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              <span>Seat {ss.seat?.row}{ss.seat?.number} <span className="badge badge-grey">{ss.seat?.category}</span></span>
              <span>₹{ss.seat?.category === 'PREMIUM' ? event.premiumPrice : event.standardPrice}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 14, fontSize: 16 }}>
            <span>Total</span><span>₹{totalAmount}</span>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>Booking for: <strong style={{ color: 'var(--text)' }}>{user?.name}</strong> ({user?.email})</p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>A QR code ticket will be generated and emailed to you after confirmation.</p>
      </div>
      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>Go Back</button>
        <button className="btn-primary" style={{ flex: 1, padding: 12 }} onClick={handleConfirm} disabled={loading}>
          {loading ? 'Confirming...' : `Confirm & Pay ₹${totalAmount}`}
        </button>
      </div>
    </div>
  );
}