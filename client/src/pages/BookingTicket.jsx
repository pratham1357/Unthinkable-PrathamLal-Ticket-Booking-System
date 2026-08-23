import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function BookingTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`).then(({ data }) => setBooking(data)).catch(() => navigate('/bookings')).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${id}/cancel`);
      setBooking(b => ({ ...b, status: 'CANCELLED' }));
      setMsg('Booking cancelled. The seats have been released.');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Cancellation failed');
    } finally { setCancelling(false); }
  };

  if (loading) return <div className="loading" style={{ paddingTop: 80 }}>Loading ticket...</div>;
  if (!booking) return null;

  const dateStr = booking.event ? new Date(booking.event.date).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800 }}>Your Ticket</h2>
        <span className={`badge ${booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}`}>{booking.status}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{booking.event?.title}</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 4 }}>📅 {dateStr}</p>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>📍 {booking.event?.venue?.name}</p>
          </div>
          {booking.qrCode && (
            <img src={booking.qrCode} alt="QR Code" style={{ width: 100, height: 100, borderRadius: 8, border: '2px solid var(--border)' }} />
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>Booking Reference</span>
            <strong style={{ fontFamily: 'monospace', fontSize: 14 }}>{booking.reference}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>Amount Paid</span>
            <strong>₹{booking.totalAmount}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text2)', fontSize: 13, display: 'block', marginBottom: 8 }}>Seats</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {booking.bookingSeats?.map(bs => (
                <span key={bs.id} style={{ background: 'var(--surface2)', padding: '4px 12px', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>
                  {bs.showSeat?.seat?.row}{bs.showSeat?.seat?.number} <span style={{ color: 'var(--text2)' }}>({bs.showSeat?.seat?.category})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 16, fontSize: 13, color: msg.includes('cancelled') || msg.includes('failed') ? (msg.includes('cancelled') ? 'var(--success)' : 'var(--danger)') : 'var(--text2)' }}>{msg}</div>}

      {booking.status === 'CONFIRMED' && (
        <button className="btn-danger" onClick={handleCancel} disabled={cancelling} style={{ width: '100%', padding: 12 }}>
          {cancelling ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      )}

      <button className="btn-secondary" style={{ width: '100%', padding: 10, marginTop: 10 }} onClick={() => navigate('/bookings')}>
        ← Back to Bookings
      </button>
    </div>
  );
}