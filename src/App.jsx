import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';

import Layout from './components/Layout';

// Landing Page
import LandingPage from './pages/LandingPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

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
import Super50SelectionPage from './pages/admin/Super50SelectionPage';
import DriveEligibilityPage from './pages/admin/DriveEligibilityPage';
import DriveResultUpload from './pages/admin/DriveResultUpload';
import FacultyPlacementDashboard from './pages/admin/FacultyPlacementDashboard';
import EnrollStudentsPage from './pages/admin/EnrollStudentsPage';
import CreateDrivePage from './pages/admin/CreateDrivePage';
import DriveDetailsPage from './pages/admin/DriveDetailsPage';
import VerifyGuidesPage from './pages/admin/VerifyGuidesPage';
import FacultyTasksPage from './pages/faculty/FacultyTasksPage';

import StudentPlacementDashboard from './pages/student/StudentPlacementDashboard';
import ProjectDashboard from './pages/student/ProjectDashboard';
import ProjectDetails from './pages/student/ProjectDetails';
import PodAIMarksUploadPage from './pages/admin/PodAIMarksUploadPage';
import PodAIMarksPage from './pages/student/PodAIMarksPage';
import PodAIMarksSheetPage from './pages/admin/PodAIMarksSheetPage';
import AdminAMCATPage from './pages/admin/AdminAMCATPage';
import StudentAMCATPage from './pages/student/StudentAMCATPage';

// Shared
import LeaderboardPage from './pages/shared/LeaderboardPage';

// PMS
import PMSRoutes from './pages/pms/PMSRoutes';

// Role guard component
const RoleGuard = ({ children, allowed }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token || !user) return <Navigate to="/" replace />;
  
  if (!allowed.includes(user.role)) {
    const fallback = user.role === 'student' ? '/leaderboard' : 
                   user.role === 'teacher' ? '/teacher/dashboard' : 
                   user.role === 'guide' ? '/pms/guide' : 
                   user.role === 'admin' ? '/leaderboard' :
                   user.role === 'super50_admin' ? '/admin/dashboard' :
                   user.role === 'tp_admin' ? '/tp/enroll-students' :
                   user.role === 'pms_admin' ? '/pms/admin' : '/login';
    return <Navigate to={fallback} replace />;
  }
  return children;
};

const Super50Guard = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token || !user) return <Navigate to="/" replace />;
  if (user.role === 'admin' || user.role === 'teacher' || user.role === 'super50_admin') return children;
  if (!user.isSuper50) return <Navigate to="/leaderboard" replace />;
  return children;
};

function AppRoutes({ theme, toggleTheme }) {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Protected layout */}
      <Route element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
        {/* Student Routes - General */}
        <Route path="/dashboard" element={
          <Super50Guard><StudentDashboard /></Super50Guard>
        } />
        <Route path="/leaderboard" element={
          <RoleGuard allowed={['student', 'admin', 'teacher', 'guide', 'pms_admin', 'super50_admin', 'tp_admin']}><LeaderboardPage /></RoleGuard>
        } />
        <Route path="/placement" element={
          <RoleGuard allowed={['student']}><StudentPlacementDashboard /></RoleGuard>
        } />
        <Route path="/placement/results" element={
          <RoleGuard allowed={['student']}><StudentPlacementDashboard showOnlyResults={true} /></RoleGuard>
        } />

        {/* Student Routes - Super 50 Exclusive */}
        <Route path="/projects" element={
          <Super50Guard><ProjectDashboard /></Super50Guard>
        } />
        <Route path="/projects/:id" element={
          <Super50Guard><ProjectDetails /></Super50Guard>
        } />
        <Route path="/activities" element={
          <Super50Guard><ActivitiesPage /></Super50Guard>
        } />
        <Route path="/certificates" element={
          <Super50Guard><CertificatesPage /></Super50Guard>
        } />
        <Route path="/student/podai-marks" element={
          <Super50Guard><PodAIMarksPage /></Super50Guard>
        } />
        <Route path="/student/amcat" element={
          <RoleGuard allowed={['student']}><StudentAMCATPage /></RoleGuard>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><AdminDashboard /></RoleGuard>
        } />
        <Route path="/admin/students" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><StudentsPage /></RoleGuard>
        } />
        <Route path="/admin/super50-students" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><StudentsPage isSuper50={true} /></RoleGuard>
        } />
        <Route path="/admin/verify" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><VerifyCertificatesPage /></RoleGuard>
        } />
        <Route path="/admin/guides" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><VerifyGuidesPage /></RoleGuard>
        } />
        <Route path="/admin/attendance" element={
          <RoleGuard allowed={['admin']}><AttendancePage /></RoleGuard>
        } />
        <Route path="/admin/bulk-create" element={
          <RoleGuard allowed={['admin']}><BulkCreatePage /></RoleGuard>
        } />
        <Route path="/admin/super50-selection" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><Super50SelectionPage /></RoleGuard>
        } />
        <Route path="/admin/podai-upload" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><PodAIMarksUploadPage /></RoleGuard>
        } />
        <Route path="/admin/podai-marks" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><PodAIMarksSheetPage /></RoleGuard>
        } />
        <Route path="/admin/amcat" element={
          <RoleGuard allowed={['admin']}><AdminAMCATPage /></RoleGuard>
        } />
        <Route path="/admin/drive-eligibility" element={
          <RoleGuard allowed={['admin', 'tp_admin']}><DriveEligibilityPage /></RoleGuard>
        } />
        <Route path="/admin/drive-results" element={
          <RoleGuard allowed={['admin', 'tp_admin']}><DriveResultUpload /></RoleGuard>
        } />
        <Route path="/faculty/placement" element={
          <RoleGuard allowed={['admin', 'teacher', 'tp_admin']}><FacultyPlacementDashboard /></RoleGuard>
        } />
        <Route path="/tp/enroll-students" element={
          <RoleGuard allowed={['admin', 'tp_admin']}><EnrollStudentsPage /></RoleGuard>
        } />
        <Route path="/tp/create-drive" element={
          <RoleGuard allowed={['admin', 'tp_admin']}><CreateDrivePage /></RoleGuard>
        } />
        <Route path="/tp/drives/:id" element={
          <RoleGuard allowed={['admin', 'tp_admin', 'teacher']}><DriveDetailsPage /></RoleGuard>
        } />

        {/* Teacher routes (shared admin pages, read/write but no bulk-create) */}
        <Route path="/teacher/dashboard" element={
          <RoleGuard allowed={['teacher']}><AdminDashboard /></RoleGuard>
        } />
        <Route path="/teacher/students" element={
          <RoleGuard allowed={['teacher']}><StudentsPage /></RoleGuard>
        } />
        <Route path="/teacher/super50-students" element={
          <RoleGuard allowed={['teacher']}><StudentsPage isSuper50={true} /></RoleGuard>
        } />
        <Route path="/teacher/verify" element={
          <RoleGuard allowed={['teacher']}><VerifyCertificatesPage /></RoleGuard>
        } />
        <Route path="/teacher/attendance" element={
          <RoleGuard allowed={['teacher']}><AttendancePage /></RoleGuard>
        } />
        <Route path="/teacher/placement" element={
          <RoleGuard allowed={['teacher']}><FacultyPlacementDashboard /></RoleGuard>
        } />
        <Route path="/teacher/tasks" element={
          <RoleGuard allowed={['teacher']}><FacultyTasksPage /></RoleGuard>
        } />

        {/* Faculty Task Manager (shared across staff roles) */}
        <Route path="/faculty/tasks" element={
          <RoleGuard allowed={['teacher', 'admin', 'super50_admin', 'tp_admin', 'guide', 'pms_admin']}><FacultyTasksPage /></RoleGuard>
        } />
      </Route>

      {/* PMS Routes - outside main Layout so PMS gets its own Sidebar + Topbar */}
      <Route path="/pms/*" element={<PMSRoutes />} />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64 }}>🚫</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Access Denied</h1>
          <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view this page.</p>
          <a href="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>← Go to Login</a>
        </div>
      } />

      {/* Default route */}
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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
