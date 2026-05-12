import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';

export default function Layout({ theme, toggleTheme }) {
  const { user, token } = useSelector((s) => s.auth);

  if (!token || !user) return <Navigate to="/login" replace />;

  // Force password change on first login for students
  if (!user.passwordChanged && user.role === 'student') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main style={{ flex: 1, marginLeft: 260, minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  );
}
