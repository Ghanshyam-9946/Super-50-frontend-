import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';

import Layout from './components/Layout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CertificatesPage from './pages/student/CertificatesPage';
import ActivitiesPage from './pages/student/ActivitiesPage';

// Admin/Teacher Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import VerifyCertificatesPage from './pages/admin/VerifyCertificatesPage';
import AttendancePage from './pages/admin/AttendancePage';
import BulkCreatePage from './pages/admin/BulkCreatePage';

// Shared
import LeaderboardPage from './pages/shared/LeaderboardPage';

// Role guard component
function RoleGuard({ allowed, children }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function AppRoutes({ theme, toggleTheme }) {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Protected layout */}
      <Route element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
        {/* Student routes */}
        <Route path="/dashboard" element={
          <RoleGuard allowed={['student']}><StudentDashboard /></RoleGuard>
        } />
        <Route path="/certificates" element={
          <RoleGuard allowed={['student']}><CertificatesPage /></RoleGuard>
        } />
        <Route path="/activities" element={
          <RoleGuard allowed={['student']}><ActivitiesPage /></RoleGuard>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <RoleGuard allowed={['admin']}><AdminDashboard /></RoleGuard>
        } />
        <Route path="/admin/students" element={
          <RoleGuard allowed={['admin']}><StudentsPage /></RoleGuard>
        } />
        <Route path="/admin/verify" element={
          <RoleGuard allowed={['admin']}><VerifyCertificatesPage /></RoleGuard>
        } />
        <Route path="/admin/attendance" element={
          <RoleGuard allowed={['admin']}><AttendancePage /></RoleGuard>
        } />
        <Route path="/admin/bulk-create" element={
          <RoleGuard allowed={['admin']}><BulkCreatePage /></RoleGuard>
        } />

        {/* Teacher routes (shared admin pages, read/write but no bulk-create) */}
        <Route path="/teacher/dashboard" element={
          <RoleGuard allowed={['teacher']}><AdminDashboard /></RoleGuard>
        } />
        <Route path="/teacher/students" element={
          <RoleGuard allowed={['teacher']}><StudentsPage /></RoleGuard>
        } />
        <Route path="/teacher/verify" element={
          <RoleGuard allowed={['teacher']}><VerifyCertificatesPage /></RoleGuard>
        } />
        <Route path="/teacher/attendance" element={
          <RoleGuard allowed={['teacher']}><AttendancePage /></RoleGuard>
        } />

        {/* Shared */}
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64 }}>🚫</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Access Denied</h1>
          <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view this page.</p>
          <a href="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>← Go to Login</a>
        </div>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('super50_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('super50_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes theme={theme} toggleTheme={toggleTheme} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
