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
    <div className="min-h-screen bg-slate-50 text-slate-900 relative z-10 flex">
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 w-full min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
