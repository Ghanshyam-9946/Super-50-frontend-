import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, FolderOpen, Presentation, UserCheck, Users,
  Layers, BarChart3, CheckSquare, Settings, GraduationCap,
  CloudUpload, ClipboardCheck, Bell, FileText, BookOpen, Award,
  Code2, TrendingUp, FolderArchive, Activity, CalendarCheck, FileEdit,
  SlidersHorizontal, ClipboardList, CalendarPlus, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../context/pms/AuthContext';
import { useNotifications } from '../../context/pms/NotificationContext';
import { cn, getInitial } from '../../utils/pms/helpers';
import { getFileUrl } from '../../utils/imageUrl';

const adminNav = [
  { section: 'Main' },
  { to: '/pms/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { section: 'Academic' },
  { to: '/pms/admin/academic-year', label: 'Academic Year', icon: Calendar },
  { to: '/pms/admin/projects', label: 'Projects', icon: FolderOpen },
  { to: '/pms/admin/presentations', label: 'Presentations', icon: Presentation },
  { to: '/pms/admin/meetings', label: 'Guide Meetings', icon: CalendarClock },

  { section: 'People & Teams' },
  { to: '/pms/admin/guides', label: 'Project Guides', icon: UserCheck },
  { to: '/pms/admin/students', label: 'Students', icon: Users },
  { to: '/pms/admin/teams', label: 'Teams & Assign Guide', icon: Layers },
  { to: '/pms/admin/team-config', label: 'Team Configuration', icon: SlidersHorizontal },
  { to: '/pms/admin/allocation-sheet', label: 'Allocation Sheet', icon: ClipboardList },

  { section: 'Tracking' },
  { to: '/pms/admin/attendance', label: 'Daily Attendance', icon: CheckSquare },
  { to: '/pms/admin/attendance-mark', label: 'Mark Attendance', icon: CalendarPlus },
  { to: '/pms/admin/semester-attendance', label: 'Semester Attendance', icon: CalendarCheck },
  { to: '/pms/admin/reports', label: 'Reports', icon: BarChart3 },

  { section: 'Documents' },
  { to: '/pms/admin/forms', label: 'Forms & PDFs', icon: FileText },
  { to: '/pms/admin/guidelines', label: 'Student Guidelines', icon: BookOpen },
  { to: '/pms/admin/templates', label: 'Templates & Resources', icon: FolderArchive },

  { section: 'System' },
  { to: '/pms/admin/settings', label: 'App Settings', icon: Settings },
];

const studentNav = [
  { section: 'Main' },
  { to: '/pms/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { section: 'Project' },
  { to: '/pms/student/team', label: 'My Team', icon: Users },
  { to: '/pms/student/progress', label: 'Project Progress', icon: TrendingUp },
  { to: '/pms/student/presentations', label: 'Presentations', icon: CloudUpload },
  { to: '/pms/student/marks', label: 'Marks & Status', icon: ClipboardCheck },
  { to: '/pms/student/report', label: 'Project Report', icon: FileEdit },

  { section: 'Tools' },
  { to: '/pms/student/code-editor', label: 'Code Editor', icon: Code2 },

  { section: 'Resources' },
  { to: '/pms/student/resources', label: 'Templates & Formats', icon: FolderArchive },
  { to: '/pms/student/guidelines', label: 'Guidelines', icon: BookOpen },
];

const guideNav = [
  { section: 'Main' },
  { to: '/pms/guide/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { section: 'Supervision' },
  { to: '/pms/guide/groups', label: 'My Groups', icon: Layers },
  { to: '/pms/guide/title-approvals', label: 'Title Approvals', icon: ClipboardCheck },
  { to: '/pms/guide/meetings', label: 'Guide Meetings', icon: CalendarClock },
  { to: '/pms/guide/panel-presentations', label: 'Presentation Panel', icon: Presentation },
  { to: '/pms/guide/status', label: 'Project Status', icon: Activity },
  { to: '/pms/guide/attendance', label: 'Attendance', icon: CheckSquare },

  { section: 'Reports' },
  { to: '/pms/guide/reports', label: 'Reports', icon: BarChart3 },
];

const Sidebar = ({ open, onClose }) => {
  const { user, branding } = useAuth();
  const { unread } = useNotifications();

  if (!user) return null;

  const getNav = () => {
    const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    if (roles.includes('student')) {
      return studentNav;
    }
    
    // A teacher tagged "Project Coordinator" gets full PMS admin access
    // (adminRoutes.js's PMS_ADMIN gate on the backend, App.jsx/PMSRoutes.jsx's
    // allowResponsibility on the frontend) — without this, they could still
    // reach every /pms/admin/* page directly by URL, but had no way to
    // discover them since this sidebar only ever showed them guide nav.
    const isProjectCoordinator = (user.responsibilities || []).includes('Project Coordinator');
    const hasAdmin = roles.includes('admin') || roles.includes('pms_admin') || isProjectCoordinator;
    const hasGuide = roles.includes('guide') || roles.includes('teacher');
    
    if (hasAdmin && hasGuide) {
      const combined = [];
      const sections = {};
      
      const addNav = (navItems) => {
        let currentSection = 'Main';
        navItems.forEach(item => {
          if (item.section) {
            currentSection = item.section;
            return;
          }
          if (!sections[currentSection]) {
            sections[currentSection] = [];
          }
          if (!sections[currentSection].some(existing => existing.to === item.to)) {
            let adjustedLabel = item.label;
            if (item.to === '/pms/admin/dashboard') {
              adjustedLabel = 'PMS Admin Dashboard';
            } else if (item.to === '/pms/guide/dashboard') {
              adjustedLabel = 'PMS Guide Dashboard';
            }
            sections[currentSection].push({ ...item, label: adjustedLabel });
          }
        });
      };
      
      addNav(adminNav);
      addNav(guideNav);
      
      Object.keys(sections).forEach(secName => {
        if (sections[secName].length > 0) {
          combined.push({ section: secName });
          combined.push(...sections[secName]);
        }
      });
      return combined;
    }
    
    if (hasAdmin) return adminNav;
    return guideNav;
  };

  const nav = getNav();
  const logoUrl = getFileUrl(branding.appLogo, 'branding');

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'pms-sidebar fixed inset-y-0 left-0 z-50 w-64 text-slate-200 flex flex-col overflow-hidden',
          'bg-gradient-to-b from-[#0b1022] via-[#10163a] to-[#1b1450]',
          'transition-transform duration-300',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Soft glow behind the brand */}
        <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-24 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl" />

        {/* Brand */}
        <div className="relative px-5 py-5 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl bg-white p-1 object-contain shadow-lg" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 ring-1 ring-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="font-display font-extrabold text-white text-[15px] truncate">{branding.appName}</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-indigo-200 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {user.role} Portal
            </div>
          </div>
        </div>
        <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Nav */}
        <nav className="relative flex-1 px-3 py-3 overflow-y-auto">
          {nav.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={idx}
                  className="px-3 pt-4 pb-1.5 first:pt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500 font-bold"
                >
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-200 mb-0.5',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-white/10'
                      : 'text-slate-300/90 hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300')}
                      style={{ width: 18, height: 18 }}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Account */}
          <div className="px-3 pt-4 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500 font-bold">
            Account
          </div>
          <NavLink
            to="/pms/notifications"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-white/10'
                  : 'text-slate-300/90 hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Bell className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300')} style={{ width: 18, height: 18 }} />
                <span className="flex-1">Notifications</span>
                {unread > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center shadow-md shadow-rose-900/40">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </nav>

        {/* Signed-in user */}
        <div className="relative p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2.5">
            {user.profileImage ? (
              <img src={user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-400/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-indigo-400/30">
                {getInitial(user.name)}
              </div>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-sm font-semibold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email || user.enrollmentNo}</div>
            </div>
          </div>
          <div className="mt-2 px-1 text-[10px] text-slate-500 flex justify-between">
            <span>v1.0.0</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
