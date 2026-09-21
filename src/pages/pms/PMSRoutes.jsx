import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PMSLayout from '../../components/pms/PMSLayout';

// Admin
import AdminDashboard from './admin/Dashboard';
import AcademicYears from './admin/AcademicYears';
import Projects from './admin/Projects';
import Presentations from './admin/Presentations';
import Guides from './admin/Guides';
import GuideProfileView from './admin/GuideProfileView';
import Teams from './admin/Teams';
import AdminAttendance from './admin/Attendance';
import Reports from './admin/Reports';
import Settings from './admin/Settings';
import AdminForms from './admin/Forms';
import AdminGuidelines from './admin/Guidelines';
import AdminTemplates from './admin/Templates';
import SemesterAttendance from './admin/SemesterAttendance';
import Students from './admin/Students';
import TeamConfig from './admin/TeamConfig';
import AllocationSheet from './admin/AllocationSheet';
import AttendanceMark from './admin/AttendanceMark';

// Student
import StudentDashboard from './student/Dashboard';
import StudentTeam from './student/Team';
import StudentPresentations from './student/Presentations';
import StudentMarks from './student/Marks';
import StudentGuidelines from './student/Guidelines';
import StudentProgress from './student/Progress';
import StudentResources from './student/Resources';
import CodeEditor from './student/CodeEditor';
import ProjectReport from './student/ProjectReport';

// Guide
import GuideDashboard from './guide/Dashboard';
import GuideGroups from './guide/Groups';
import GuideReview from './guide/Review';
import GuideAttendance from './guide/Attendance';
import GuideReports from './guide/Reports';
import PMSNotifications from './Notifications';
import GuideRubrics from './guide/Rubrics';
import GuideStatus from './guide/Status';
import GuideStatusDetail from './guide/StatusDetail';

// Role guard component. `allowResponsibility` additionally lets through any
// user (regardless of role) who holds that responsibility tag — mirrors
// App.jsx's own RoleGuard (used for Master Data / No Dues's "Academic
// Coordinator") so a teacher tagged "Project Coordinator" gets full PMS
// admin access here too.
const RoleGuard = ({ children, allowed, allowResponsibility }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token || !user) return <Navigate to="/login" replace />;
  const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  const hasRole = allowed.some(role => userRoles.includes(role));
  const hasResponsibility = allowResponsibility && (user.responsibilities || []).includes(allowResponsibility);
  if (!hasRole && !hasResponsibility) return <Navigate to="/unauthorized" replace />;
  return children;
};

// Students only get PMS while their semester has an active Minor/Major
// project (user.pmsProject, set by /auth/login + /auth/me). `undefined`
// means a session from before that field existed — PMSLayout's fetchMe is
// already refreshing it, so wait briefly instead of bouncing them.
// The backend enforces the same rule (requireActivePmsProject).
const StudentProjectGuard = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (user?.pmsProject === undefined) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  }
  if (!user.pmsProject) return <Navigate to="/leaderboard" replace />;
  return children;
};

const StudentRoute = ({ children }) => (
  <RoleGuard allowed={['student']}>
    <StudentProjectGuard>{children}</StudentProjectGuard>
  </RoleGuard>
);

export default function PMSRoutes() {
  return (
    <Routes>
      {/* All PMS routes wrapped in PMSLayout → gives PMS Sidebar + Topbar */}
      <Route element={<PMSLayout />}>

        {/* Admin — /pms/admin/dashboard alias for sidebar nav link.
            allowResponsibility="Project Coordinator" lets a plain teacher
            tagged with that responsibility in too, matching adminRoutes.js's
            PMS_ADMIN gate on the backend. */}
        <Route path="admin" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AdminDashboard /></RoleGuard>} />
        <Route path="admin/dashboard" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AdminDashboard /></RoleGuard>} />
        <Route path="admin/academic-year" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AcademicYears /></RoleGuard>} />
        <Route path="admin/projects" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Projects /></RoleGuard>} />
        <Route path="admin/presentations" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Presentations /></RoleGuard>} />
        <Route path="admin/team-config" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><TeamConfig /></RoleGuard>} />
        <Route path="admin/allocation-sheet" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AllocationSheet /></RoleGuard>} />
        <Route path="admin/guides" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Guides /></RoleGuard>} />
        <Route path="admin/guides/:userId/profile" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><GuideProfileView /></RoleGuard>} />
        <Route path="admin/students" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Students /></RoleGuard>} />
        <Route path="admin/teams" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Teams /></RoleGuard>} />
        <Route path="admin/attendance" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AdminAttendance /></RoleGuard>} />
        <Route path="admin/attendance-mark" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AttendanceMark /></RoleGuard>} />
        <Route path="admin/semester-attendance" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><SemesterAttendance /></RoleGuard>} />
        <Route path="admin/reports" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Reports /></RoleGuard>} />
        <Route path="admin/forms" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AdminForms /></RoleGuard>} />
        <Route path="admin/guidelines" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AdminGuidelines /></RoleGuard>} />
        <Route path="admin/templates" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><AdminTemplates /></RoleGuard>} />
        <Route path="admin/settings" element={<RoleGuard allowed={['admin', 'pms_admin']} allowResponsibility="Project Coordinator"><Settings /></RoleGuard>} />

        {/* Student — /pms/student/dashboard alias for sidebar nav link */}
        <Route path="student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="student/team" element={<StudentRoute><StudentTeam /></StudentRoute>} />
        <Route path="student/progress" element={<StudentRoute><StudentProgress /></StudentRoute>} />
        <Route path="student/presentations" element={<StudentRoute><StudentPresentations /></StudentRoute>} />
        <Route path="student/marks" element={<StudentRoute><StudentMarks /></StudentRoute>} />
        <Route path="student/report" element={<StudentRoute><ProjectReport /></StudentRoute>} />
        <Route path="student/code-editor" element={<StudentRoute><CodeEditor /></StudentRoute>} />
        <Route path="student/resources" element={<StudentRoute><StudentResources /></StudentRoute>} />
        <Route path="student/guidelines" element={<StudentRoute><StudentGuidelines /></StudentRoute>} />

        {/* Guide — /pms/guide/dashboard alias for sidebar nav link */}
        <Route path="guide" element={<RoleGuard allowed={['guide']}><GuideDashboard /></RoleGuard>} />
        <Route path="guide/dashboard" element={<RoleGuard allowed={['guide']}><GuideDashboard /></RoleGuard>} />
        <Route path="guide/groups" element={<RoleGuard allowed={['guide']}><GuideGroups /></RoleGuard>} />
        <Route path="guide/review/:teamId" element={<RoleGuard allowed={['guide']}><GuideReview /></RoleGuard>} />
        <Route path="guide/rubrics/:teamId" element={<RoleGuard allowed={['guide']}><GuideRubrics /></RoleGuard>} />
        <Route path="guide/attendance" element={<RoleGuard allowed={['guide']}><GuideAttendance /></RoleGuard>} />
        <Route path="guide/status" element={<RoleGuard allowed={['guide']}><GuideStatus /></RoleGuard>} />
        <Route path="guide/status/:teamId" element={<RoleGuard allowed={['guide']}><GuideStatusDetail /></RoleGuard>} />
        <Route path="guide/reports" element={<RoleGuard allowed={['guide']}><GuideReports /></RoleGuard>} />

        {/* Every signed-in PMS user — admin, guide, student */}
        <Route path="notifications" element={<PMSNotifications />} />

      </Route>
    </Routes>
  );
}
