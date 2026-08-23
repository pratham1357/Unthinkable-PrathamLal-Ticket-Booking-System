import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetail from './pages/EventDetail';
import BookingConfirm from './pages/BookingConfirm';
import BookingHistory from './pages/BookingHistory';
import BookingTicket from './pages/BookingTicket';
import OrgDashboard from './pages/OrgDashboard';
import CreateEvent from './pages/CreateEvent';
import EventAnalytics from './pages/EventAnalytics';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/confirm" element={<ProtectedRoute roles={['CUSTOMER']}><BookingConfirm /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute roles={['CUSTOMER']}><BookingHistory /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute roles={['CUSTOMER']}><BookingTicket /></ProtectedRoute>} />
          <Route path="/organiser" element={<ProtectedRoute roles={['ORGANISER', 'ADMIN']}><OrgDashboard /></ProtectedRoute>} />
          <Route path="/organiser/create" element={<ProtectedRoute roles={['ORGANISER', 'ADMIN']}><CreateEvent /></ProtectedRoute>} />
          <Route path="/organiser/events/:id" element={<ProtectedRoute roles={['ORGANISER', 'ADMIN']}><EventAnalytics /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}