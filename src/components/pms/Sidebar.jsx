import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, FolderOpen, Presentation, UserCheck, Users,
  Layers, ArrowUpCircle, BarChart3, CheckSquare, Settings, GraduationCap,
  CloudUpload, ClipboardCheck, Bell, FileText, BookOpen, Award,
  Code2, TrendingUp, FolderArchive, Activity, CalendarCheck, FileEdit,
} from 'lucide-react';
import { useAuth } from '../../context/pms/AuthContext';
import { useNotifications } from '../../context/pms/NotificationContext';
import { cn } from '../../utils/pms/helpers';

const adminNav = [
  { section: 'Main' },
  { to: '/pms/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { section: 'Academic' },
  { to: '/pms/admin/academic-year', label: 'Academic Year', icon: Calendar },
  { to: '/pms/admin/projects', label: 'Projects', icon: FolderOpen },
  { to: '/pms/admin/presentations', label: 'Presentations', icon: Presentation },

  { section: 'People & Teams' },
  { to: '/pms/admin/guides', label: 'Project Guides', icon: UserCheck },
  { to: '/pms/admin/students', label: 'Students', icon: Users },
  { to: '/pms/admin/teams', label: 'Teams & Assign Guide', icon: Layers },
  { to: '/pms/admin/promote', label: 'Promote', icon: ArrowUpCircle },

  { section: 'Tracking' },
  { to: '/pms/admin/attendance', label: 'Daily Attendance', icon: CheckSquare },
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
    
    const hasAdmin = roles.includes('admin') || roles.includes('pms_admin');
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
  const logoUrl = branding.appLogo ? `/uploads/branding/${branding.appLogo}` : '';

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col',
          'transition-transform duration-300',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-8 h-8 rounded bg-white p-0.5 object-contain" />
          ) : (
            <GraduationCap className="w-7 h-7 text-brand-400" />
          )}
          <div className="leading-tight min-w-0">
            <div className="font-bold text-white truncate">{branding.appName}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {user.role} Portal
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {nav.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={idx}
                  className="px-3 py-2 mt-2 first:mt-0 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"
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
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Account */}
          <div className="px-3 py-2 mt-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Account
          </div>
          <NavLink
            to="/notifications"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Bell style={{ width: 18, height: 18 }} />
            <span className="flex-1">Notifications</span>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center">
                {unread}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="px-4 py-3 border-t border-white/5 text-xs text-slate-500 flex justify-between">
          <span>v1.0.0</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
