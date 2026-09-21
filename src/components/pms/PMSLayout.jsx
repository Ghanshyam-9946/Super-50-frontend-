import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { NotificationProvider } from '../../context/pms/NotificationContext';
import { fetchMe } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './pms.css';

// Map route paths to human-readable page titles
const PAGE_TITLES = {
  '/pms/admin': 'Dashboard',
  '/pms/admin/dashboard': 'Dashboard',
  '/pms/admin/academic-year': 'Academic Year',
  '/pms/admin/projects': 'Projects',
  '/pms/admin/presentations': 'Presentations',
  '/pms/admin/guides': 'Project Guides',
  '/pms/admin/students': 'Students',
  '/pms/admin/teams': 'Teams & Assign Guide',
  '/pms/admin/attendance': 'Daily Attendance',
  '/pms/admin/semester-attendance': 'Semester Attendance',
  '/pms/admin/reports': 'Reports',
  '/pms/admin/forms': 'Forms & PDFs',
  '/pms/admin/guidelines': 'Student Guidelines',
  '/pms/admin/templates': 'Templates & Resources',
  '/pms/admin/settings': 'App Settings',

  '/pms/student': 'Dashboard',
  '/pms/student/dashboard': 'Dashboard',
  '/pms/student/team': 'My Team',
  '/pms/student/progress': 'Project Progress',
  '/pms/student/presentations': 'Presentations',
  '/pms/student/marks': 'Marks & Status',
  '/pms/student/report': 'Project Report',
  '/pms/student/code-editor': 'Code Editor',
  '/pms/student/resources': 'Templates & Formats',
  '/pms/student/guidelines': 'Guidelines',

  '/pms/guide': 'Dashboard',
  '/pms/guide/dashboard': 'Dashboard',
  '/pms/guide/groups': 'My Groups',
  '/pms/guide/status': 'Project Status',
  '/pms/guide/attendance': 'Attendance',
  '/pms/guide/reports': 'Reports',
  '/pms/notifications': 'Notifications',
};

const PMSLayoutInner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { token, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  // Same refresh the main Layout does — keeps user.pmsProject current when
  // someone lands on /pms directly (it decides whether a student may be here).
  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [dispatch, token]);

  // Signed out (or never signed in): leave before Sidebar/Topbar render —
  // they read user.name etc. and would crash the whole app on a null user.
  if (!token || !user) return <Navigate to="/login" replace />;

  const pageTitle = PAGE_TITLES[location.pathname] || 'PMS Portal';

  return (
    <div className="pms-root min-h-screen bg-slate-50 text-slate-900 relative z-10">
      {/* PMS Sidebar — fixed positioned, w-64 on desktop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area — pushed right by sidebar width on desktop */}
      <div className="flex flex-col min-h-screen lg:ml-64">
        {/* PMS Topbar */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          pageTitle={pageTitle}
        />

        {/* Page content */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 lg:p-8">
          <div key={location.pathname} className="pms-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Wraps with NotificationProvider so Topbar/Sidebar notification hooks work
const PMSLayout = () => (
  <NotificationProvider>
    <PMSLayoutInner />
  </NotificationProvider>
);

export default PMSLayout;
