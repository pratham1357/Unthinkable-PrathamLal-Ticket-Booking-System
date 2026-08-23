import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
        <Link to="/" style={{ color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18 }}>
          <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 14 }}>TV</span>
          TicketVault
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ color: 'var(--text2)', fontSize: 14 }}>Events</Link>
          {user ? (
            <>
              {user.role === 'CUSTOMER' && <Link to="/bookings" style={{ color: 'var(--text2)', fontSize: 14 }}>My Bookings</Link>}
              {(user.role === 'ORGANISER' || user.role === 'ADMIN') && <Link to="/organiser" style={{ color: 'var(--text2)', fontSize: 14 }}>Dashboard</Link>}
              {user.role === 'ADMIN' && <Link to="/admin" style={{ color: 'var(--text2)', fontSize: 14 }}>Admin</Link>}
              <span style={{ color: 'var(--text2)', fontSize: 13 }}>Hi, {user.name.split(' ')[0]}</span>
              <button className="btn-secondary" onClick={handleLogout} style={{ padding: '6px 14px' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--text2)', fontSize: 14 }}>Login</Link>
              <Link to="/register"><button className="btn-primary" style={{ padding: '6px 16px' }}>Sign Up</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}