import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Admin
import AdminDashboard from './admin/Dashboard';
import AcademicYears from './admin/AcademicYears';
import Projects from './admin/Projects';
import Presentations from './admin/Presentations';
import Guides from './admin/Guides';
import Teams from './admin/Teams';
import Promote from './admin/Promote';
import AdminAttendance from './admin/Attendance';
import Reports from './admin/Reports';
import Settings from './admin/Settings';
import AdminForms from './admin/Forms';
import AdminGuidelines from './admin/Guidelines';
import AdminTemplates from './admin/Templates';
import SemesterAttendance from './admin/SemesterAttendance';
import Students from './admin/Students';

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
import GuideRubrics from './guide/Rubrics';
import GuideStatus from './guide/Status';
import GuideStatusDetail from './guide/StatusDetail';

// Role guard component
const RoleGuard = ({ children, allowed }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export default function PMSRoutes() {
  return (
    <Routes>
      {/* Admin */}
      <Route path="admin" element={<RoleGuard allowed={['admin']}><AdminDashboard /></RoleGuard>} />
      <Route path="admin/academic-year" element={<RoleGuard allowed={['admin']}><AcademicYears /></RoleGuard>} />
      <Route path="admin/projects" element={<RoleGuard allowed={['admin']}><Projects /></RoleGuard>} />
      <Route path="admin/presentations" element={<RoleGuard allowed={['admin']}><Presentations /></RoleGuard>} />
      <Route path="admin/guides" element={<RoleGuard allowed={['admin']}><Guides /></RoleGuard>} />
      <Route path="admin/students" element={<RoleGuard allowed={['admin']}><Students /></RoleGuard>} />
      <Route path="admin/teams" element={<RoleGuard allowed={['admin']}><Teams /></RoleGuard>} />
      <Route path="admin/promote" element={<RoleGuard allowed={['admin']}><Promote /></RoleGuard>} />
      <Route path="admin/attendance" element={<RoleGuard allowed={['admin']}><AdminAttendance /></RoleGuard>} />
      <Route path="admin/semester-attendance" element={<RoleGuard allowed={['admin']}><SemesterAttendance /></RoleGuard>} />
      <Route path="admin/reports" element={<RoleGuard allowed={['admin']}><Reports /></RoleGuard>} />
      <Route path="admin/forms" element={<RoleGuard allowed={['admin']}><AdminForms /></RoleGuard>} />
      <Route path="admin/guidelines" element={<RoleGuard allowed={['admin']}><AdminGuidelines /></RoleGuard>} />
      <Route path="admin/templates" element={<RoleGuard allowed={['admin']}><AdminTemplates /></RoleGuard>} />
      <Route path="admin/settings" element={<RoleGuard allowed={['admin']}><Settings /></RoleGuard>} />

      {/* Student */}
      <Route path="student" element={<RoleGuard allowed={['student']}><StudentDashboard /></RoleGuard>} />
      <Route path="student/team" element={<RoleGuard allowed={['student']}><StudentTeam /></RoleGuard>} />
      <Route path="student/progress" element={<RoleGuard allowed={['student']}><StudentProgress /></RoleGuard>} />
      <Route path="student/presentations" element={<RoleGuard allowed={['student']}><StudentPresentations /></RoleGuard>} />
      <Route path="student/marks" element={<RoleGuard allowed={['student']}><StudentMarks /></RoleGuard>} />
      <Route path="student/report" element={<RoleGuard allowed={['student']}><ProjectReport /></RoleGuard>} />
      <Route path="student/code-editor" element={<RoleGuard allowed={['student']}><CodeEditor /></RoleGuard>} />
      <Route path="student/resources" element={<RoleGuard allowed={['student']}><StudentResources /></RoleGuard>} />
      <Route path="student/guidelines" element={<RoleGuard allowed={['student']}><StudentGuidelines /></RoleGuard>} />

      {/* Guide */}
      <Route path="guide" element={<RoleGuard allowed={['guide', 'teacher']}><GuideDashboard /></RoleGuard>} />
      <Route path="guide/groups" element={<RoleGuard allowed={['guide', 'teacher']}><GuideGroups /></RoleGuard>} />
      <Route path="guide/review/:teamId" element={<RoleGuard allowed={['guide', 'teacher']}><GuideReview /></RoleGuard>} />
      <Route path="guide/rubrics/:teamId" element={<RoleGuard allowed={['guide', 'teacher']}><GuideRubrics /></RoleGuard>} />
      <Route path="guide/attendance" element={<RoleGuard allowed={['guide', 'teacher']}><GuideAttendance /></RoleGuard>} />
      <Route path="guide/status" element={<RoleGuard allowed={['guide', 'teacher']}><GuideStatus /></RoleGuard>} />
      <Route path="guide/status/:teamId" element={<RoleGuard allowed={['guide', 'teacher']}><GuideStatusDetail /></RoleGuard>} />
      <Route path="guide/reports" element={<RoleGuard allowed={['guide', 'teacher']}><GuideReports /></RoleGuard>} />
    </Routes>
  );
}
