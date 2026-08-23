import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SeatMap from '../components/SeatMap';
import api from '../utils/api';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [selection, setSelection] = useState([]);
  const [selectionSeats, setSelectionSeats] = useState([]);
  const [holding, setHolding] = useState(false);
  const [holdExpiry, setHoldExpiry] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState('');
  const [waitlistCat, setWaitlistCat] = useState('');
  const [waitlistMsg, setWaitlistMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data)).catch(() => navigate('/'));
  }, [id]);

  useEffect(() => {
    if (!holdExpiry) { setCountdown(null); return; }
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(holdExpiry) - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) { clearInterval(timerRef.current); setHoldExpiry(null); }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [holdExpiry]);

  const handleHold = async () => {
    if (!user) return navigate('/login');
    if (selection.length === 0) return setError('Select at least one seat');
    setHolding(true); setError('');
    try {
      const { data } = await api.post(`/events/${id}/hold`, { seatIds: selection });
      setHoldExpiry(data.heldUntil);
    } catch (e) {
      setError(e.response?.data?.error || 'Hold failed');
    } finally { setHolding(false); }
  };

  const handleProceed = () => navigate(`/events/${id}/confirm`, { state: { seatIds: selection, holdExpiry, eventId: id } });

  const handleWaitlist = async () => {
    if (!user) return navigate('/login');
    if (!waitlistCat) return setWaitlistMsg('Select a category first');
    try {
      await api.post(`/events/${id}/waitlist`, { category: waitlistCat });
      setWaitlistMsg('Added to waitlist! You\'ll be notified when a seat is available.');
    } catch (e) {
      setWaitlistMsg(e.response?.data?.error || 'Could not join waitlist');
    }
  };

  const totalPrice = selectionSeats.reduce((sum, ss) => {
    if (!event) return sum;
    return sum + (ss.seat?.category === 'PREMIUM' ? event.premiumPrice : event.standardPrice);
  }, 0);

  if (!event) return <div className="loading" style={{ paddingTop: 80 }}>Loading event...</div>;

  const dateStr = new Date(event.date).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtCountdown = countdown !== null ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : null;

  return (
    <div className="page-container" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 28 }}>
            <span className="badge badge-info" style={{ marginBottom: 10 }}>{event.type}</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{event.title}</h1>
            <p style={{ color: 'var(--text2)', marginBottom: 8 }}>📅 {dateStr}</p>
            <p style={{ color: 'var(--text2)', marginBottom: 12 }}>📍 {event.venue?.name} — {event.venue?.location}</p>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{event.description}</p>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div><span style={{ color: 'var(--text2)', fontSize: 12 }}>PREMIUM</span><br /><strong>₹{event.premiumPrice}</strong> / seat</div>
              <div><span style={{ color: 'var(--text2)', fontSize: 12 }}>STANDARD</span><br /><strong>₹{event.standardPrice}</strong> / seat</div>
            </div>
            <SeatMap eventId={parseInt(id)} userId={user?.id}
              onSelectionChange={(ids, seats) => { setSelection(ids); setSelectionSeats(seats); }} />
          </div>

          {/* Waitlist section */}
          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>Sold out category? Join waitlist</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={waitlistCat} onChange={e => setWaitlistCat(e.target.value)} style={{ flex: 1 }}>
                <option value="">Select category</option>
                <option value="PREMIUM">Premium</option>
                <option value="STANDARD">Standard</option>
              </select>
              <button className="btn-secondary" onClick={handleWaitlist}>Join Waitlist</button>
            </div>
            {waitlistMsg && <p style={{ marginTop: 10, fontSize: 13, color: waitlistMsg.includes('notified') ? 'var(--success)' : 'var(--danger)' }}>{waitlistMsg}</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 76 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Booking Summary</h3>
            {selection.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>Select seats from the map to proceed.</p>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  {selectionSeats.map(ss => (
                    <div key={ss.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                      <span>{ss.seat?.row}{ss.seat?.number} <span className="badge badge-grey" style={{ marginLeft: 6 }}>{ss.seat?.category}</span></span>
                      <span>₹{ss.seat?.category === 'PREMIUM' ? event.premiumPrice : event.standardPrice}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 10, marginBottom: 20 }}>
                  <span>Total</span><span>₹{totalPrice}</span>
                </div>
              </>
            )}

            {fmtCountdown && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--warn)', borderRadius: 7, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>HOLD EXPIRES IN</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: countdown < 120 ? 'var(--danger)' : 'var(--warn)' }}>{fmtCountdown}</div>
              </div>
            )}

            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

            {!holdExpiry ? (
              <button className="btn-primary" style={{ width: '100%', padding: 12 }} onClick={handleHold} disabled={holding || selection.length === 0}>
                {holding ? 'Holding...' : `Hold ${selection.length} Seat${selection.length !== 1 ? 's' : ''}`}
              </button>
            ) : (
              <button className="btn-success" style={{ width: '100%', padding: 12 }} onClick={handleProceed}>
                Proceed to Book
              </button>
            )}

            {!user && <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12, textAlign: 'center' }}>You need to <a href="/login">login</a> to book.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}