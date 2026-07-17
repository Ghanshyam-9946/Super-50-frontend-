import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { fetchMe } from '../features/auth/authSlice';

export default function Layout({ theme, toggleTheme }) {
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  if (!token || !user) return <Navigate to="/" replace />;

  // Force password change on first login for students
  if (!user.passwordChanged && user.role === 'student') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] relative z-10 flex font-body">
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 w-full min-h-screen overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
