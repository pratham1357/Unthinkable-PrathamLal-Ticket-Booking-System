import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

const STATUS_STYLE = {
  AVAILABLE: { bg: '#1e1e3a', border: '#7c6ef7', cursor: 'pointer' },
  SELECTED: { bg: '#7c6ef7', border: '#7c6ef7', cursor: 'pointer' },
  HELD: { bg: '#2a2010', border: '#f59e0b', cursor: 'not-allowed' },
  BOOKED: { bg: '#1a1a1a', border: '#333', cursor: 'not-allowed' },
  MINE: { bg: '#1a3a1a', border: '#22c55e', cursor: 'pointer' },
};

export default function SeatMap({ eventId, userId, onSelectionChange }) {
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSeats = useCallback(async () => {
    try {
      const { data } = await api.get(`/events/${eventId}/seats`);
      setSeats(data);
    } catch {
      // silently keep previous state on polling errors
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 3000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  useEffect(() => {
    onSelectionChange(selected, seats.filter(s => selected.includes(s.id)));
  }, [selected, seats]);

  const toggleSeat = (seat) => {
    const isMine = seat.status === 'HELD' && seat.heldBy === userId;
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'HELD' && !isMine) return;

    setSelected(prev =>
      prev.includes(seat.id) ? prev.filter(id => id !== seat.id) : [...prev, seat.id]
    );
  };

  const rows = [...new Set(seats.map(s => s.seat.row))].sort();

  if (loading) return <div className="loading">Loading seat map...</div>;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 4, padding: '6px 40px', display: 'inline-block', color: 'var(--text2)', fontSize: 12, letterSpacing: 4, marginBottom: 20 }}>SCREEN</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {rows.map(row => {
          const rowSeats = seats.filter(s => s.seat.row === row).sort((a, b) => a.seat.number - b.seat.number);
          return (
            <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, color: 'var(--text2)', fontSize: 12, fontWeight: 700 }}>{row}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {rowSeats.map(seat => {
                  const isSelected = selected.includes(seat.id);
                  const isMine = seat.status === 'HELD' && seat.heldBy === userId;
                  let state = isSelected ? 'SELECTED' : (isMine ? 'MINE' : seat.status);
                  const style = STATUS_STYLE[state] || STATUS_STYLE.AVAILABLE;
                  return (
                    <div key={seat.id}
                      onClick={() => toggleSeat(seat)}
                      title={`${seat.seat.row}${seat.seat.number} — ${seat.seat.category} — ${seat.status}`}
                      style={{
                        width: 32, height: 32, border: `2px solid ${style.border}`,
                        background: style.bg, borderRadius: 5, cursor: style.cursor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: 'var(--text2)', transition: 'background 0.1s',
                      }}>
                      {seat.seat.number}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Available', color: '#7c6ef7', bg: '#1e1e3a' },
          { label: 'Selected', color: '#7c6ef7', bg: '#7c6ef7' },
          { label: 'Held by others', color: '#f59e0b', bg: '#2a2010' },
          { label: 'Booked', color: '#333', bg: '#1a1a1a' },
          { label: 'My hold', color: '#22c55e', bg: '#1a3a1a' },
        ].map(({ label, color, bg }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${color}`, background: bg, borderRadius: 3 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}