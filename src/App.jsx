import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { store } from './app/store';
import { logout } from './features/auth/authSlice';

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
import GeneralFormsPage from './pages/admin/GeneralFormsPage';
import GeneralFormSubmissionsPage from './pages/admin/GeneralFormSubmissionsPage';
import DriveEligibilityPage from './pages/admin/DriveEligibilityPage';
import DriveResultUpload from './pages/admin/DriveResultUpload';
import FacultyPlacementDashboard from './pages/admin/FacultyPlacementDashboard';
import EnrollStudentsPage from './pages/admin/EnrollStudentsPage';
import CreateDrivePage from './pages/admin/CreateDrivePage';
import DriveDetailsPage from './pages/admin/DriveDetailsPage';
import VerifyGuidesPage from './pages/admin/VerifyGuidesPage';
import FacultyTasksPage from './pages/faculty/FacultyTasksPage';
import CallingTrackerPage from './pages/admin/CallingTrackerPage';

import StudentPlacementDashboard from './pages/student/StudentPlacementDashboard';
import ProjectDashboard from './pages/student/ProjectDashboard';
import ProjectDetails from './pages/student/ProjectDetails';
import PodAIMarksUploadPage from './pages/admin/PodAIMarksUploadPage';
import PodAIMarksPage from './pages/student/PodAIMarksPage';
import PodAIMarksSheetPage from './pages/admin/PodAIMarksSheetPage';
import AllStudentPodAIUploadPage from './pages/admin/AllStudentPodAIUploadPage';
import AdminAMCATPage from './pages/admin/AdminAMCATPage';
import AdminMSTPage from './pages/admin/AdminMSTPage';
import StudentAMCATPage from './pages/student/StudentAMCATPage';
import StudentMSTPage from './pages/student/StudentMSTPage';
import AdminRGPVPage from './pages/admin/AdminRGPVPage';
import StudentRGPVPage from './pages/student/StudentRGPVPage';
import TimetableManagePage from './pages/admin/TimetableManagePage';
import StudentTimetablePage from './pages/student/StudentTimetablePage';
import NoDuesAdminPage from './pages/admin/NoDuesAdminPage';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import NoDuesPage from './pages/faculty/NoDuesPage';
import StudentNoDuesPage from './pages/student/StudentNoDuesPage';

// Shared
import LeaderboardPage from './pages/shared/LeaderboardPage';

// PMS
import PMSRoutes from './pages/pms/PMSRoutes';

// Role guard component. `allowResponsibility` additionally lets through any
// user (regardless of role) who holds that responsibility tag — e.g. an
// "Academic Coordinator" is usually a plain teacher/guide, not a distinct role.
const RoleGuard = ({ children, allowed, allowResponsibility }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token || !user) return <Navigate to="/" replace />;

  const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  const hasRole = allowed.some(role => userRoles.includes(role));
  const hasResponsibility = allowResponsibility && (user.responsibilities || []).includes(allowResponsibility);

  if (!hasRole && !hasResponsibility) {
    const fallback = userRoles.includes('student') ? '/leaderboard' :
                     userRoles.includes('admin') ? '/leaderboard' :
                     userRoles.includes('super50_admin') ? '/leaderboard' :
                     userRoles.includes('teacher') ? '/teacher/dashboard' :
                     userRoles.includes('guide') ? '/pms/guide' :
                     userRoles.includes('tp_admin') ? '/tp/enroll-students' :
                     userRoles.includes('pms_admin') ? '/pms/admin' : '/login';
    return <Navigate to={fallback} replace />;
  }
  return children;
};

const Super50Guard = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token || !user) return <Navigate to="/" replace />;
  
  const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  const isPrivileged = userRoles.some(r => ['admin', 'teacher', 'super50_admin'].includes(r));
  if (isPrivileged) return children;
  if (!user.isSuper50) return <Navigate to="/leaderboard" replace />;
  return children;
};

// Auto log out user after 6 hours of inactivity
function IdleTimer() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const TIMEOUT_LIMIT = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dispatch(logout());
        toast.error('Session expired due to inactivity');
      }, TIMEOUT_LIMIT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, dispatch]);

  return null;
}

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
          <RoleGuard allowed={['student', 'teacher', 'admin', 'super50_admin']}><CertificatesPage /></RoleGuard>
        } />
        <Route path="/student/podai-marks" element={
          <RoleGuard allowed={['student']}><PodAIMarksPage /></RoleGuard>
        } />
        <Route path="/student/amcat" element={
          <RoleGuard allowed={['student']}><StudentAMCATPage /></RoleGuard>
        } />
        <Route path="/student/mst" element={
          <RoleGuard allowed={['student']}><StudentMSTPage /></RoleGuard>
        } />
        <Route path="/student/timetable" element={
          <RoleGuard allowed={['student']}><StudentTimetablePage /></RoleGuard>
        } />
        <Route path="/student/no-dues" element={
          <RoleGuard allowed={['student']}><StudentNoDuesPage /></RoleGuard>
        } />
        <Route path="/student/rgpv" element={
          <RoleGuard allowed={['student']}><StudentRGPVPage /></RoleGuard>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><AdminDashboard /></RoleGuard>
        } />
        <Route path="/admin/calling-tracker" element={
          <RoleGuard allowed={['admin']}><CallingTrackerPage /></RoleGuard>
        } />
        <Route path="/admin/rgpv" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><AdminRGPVPage /></RoleGuard>
        } />
        <Route path="/admin/activity-logs" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><ActivityLogsPage /></RoleGuard>
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
        <Route path="/admin/general-forms" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><GeneralFormsPage /></RoleGuard>
        } />
        <Route path="/admin/general-forms/:id" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><GeneralFormSubmissionsPage /></RoleGuard>
        } />
        <Route path="/admin/podai-upload" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><PodAIMarksUploadPage /></RoleGuard>
        } />
        <Route path="/admin/all-student-podai" element={
          <RoleGuard allowed={['admin', 'super50_admin']}><AllStudentPodAIUploadPage /></RoleGuard>
        } />
        <Route path="/admin/podai-marks" element={<RoleGuard allowed={['admin', 'teacher', 'super50_admin']}><PodAIMarksSheetPage /></RoleGuard>} />
        <Route path="/admin/amcat" element={<RoleGuard allowed={['admin', 'super50_admin', 'teacher']}><AdminAMCATPage /></RoleGuard>} />
        <Route path="/admin/mst" element={<RoleGuard allowed={['admin', 'super50_admin', 'teacher']}><AdminMSTPage /></RoleGuard>} />
        <Route path="/admin/timetable" element={
          <RoleGuard allowed={['admin', 'teacher']}><TimetableManagePage /></RoleGuard>
        } />
        <Route path="/admin/no-dues" element={
          <RoleGuard allowed={['admin']} allowResponsibility="Academic Coordinator"><NoDuesAdminPage /></RoleGuard>
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

        {/* No Dues — mentor (TG) view, shared across staff roles */}
        <Route path="/faculty/no-dues" element={
          <RoleGuard allowed={['teacher', 'admin', 'super50_admin', 'tp_admin', 'guide', 'pms_admin']}><NoDuesPage /></RoleGuard>
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
        <IdleTimer />
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
