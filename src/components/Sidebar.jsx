import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import {
  LayoutDashboard, Award, Zap, Trophy, Users, ShieldCheck,
  ClipboardList, UserPlus, LogOut, Sun, Moon, GraduationCap, Menu, X, Upload,
  Briefcase, FileText, Layout, Star, FolderOpen, Database, ChevronLeft, ChevronRight, ListChecks, CalendarClock, FileCheck2, History, DatabaseBackup,
  Layers, UserCheck, BookOpen, ChevronDown, Grid3x3, Gauge, FileSpreadsheet, MessageCircle, MessageSquareText, ClipboardCheck
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileEditModal from './ProfileEditModal';
import { getImageUrl } from '../utils/imageUrl';

const Sidebar = ({ theme, toggleTheme }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Core Links (All Students)
  const commonStudentLinks = [
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/student/amcat', icon: FileText, label: 'AMCAT Result' },
    { to: '/student/mst', icon: FileText, label: 'MST Result' },
    { to: '/student/rgpv', icon: Award, label: 'RGPV Marks' },
    { to: '/student/podai-marks', icon: FileText, label: 'Pod AI Marks' },
    { to: '/certificates', icon: Award, label: 'Certificates' },
    { to: '/student/timetable', icon: CalendarClock, label: 'Time Table' },
    { to: '/student/no-dues', icon: FileCheck2, label: 'No Dues' },
    { to: '/student/sessional-marks', icon: GraduationCap, label: 'Sessional Marks' },
    { to: '/student/feedback', icon: MessageSquareText, label: 'Faculty Feedback' },
  ];

  // Training & Placement Section (ALL students)
  const tpLinks = [
    { to: '/placement', icon: Briefcase, label: 'T&P Dashboard' },
    { to: '/placement/results', icon: ClipboardList, label: 'Drive Results' },
  ];

  // PMS Section (ALL students)
  const pmsStudentLinks = [
    { to: '/pms/student', icon: FolderOpen, label: 'Major Project (PMS)' },
  ];

  // Super 50 Exclusive Section
  const super50Links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Super 50 Portal' },
    { to: '/projects', icon: Layout, label: 'Projects' },
    { to: '/activities', icon: Zap, label: 'Activities' },
  ];

  const isAcademicCoordinator = (user?.responsibilities || []).includes('Academic Coordinator');
  const isSuper50Mentor = (user?.responsibilities || []).includes('Super 50 Mentor');
  // A teacher only sees PMS guide features once they've actually been
  // assigned as a Project Guide (roles array gets 'guide' added — see
  // pms/admin/Guides.jsx) — being a teacher alone is no longer enough.
  const isProjectGuide = user?.role === 'guide' || (user?.roles || []).includes('guide');

  const teacherLinks = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/teacher/tasks', icon: ListChecks, label: 'Task Manager' },
    { to: '/faculty/no-dues', icon: FileCheck2, label: 'No Dues (TG)' },
    ...(isAcademicCoordinator ? [{ to: '/admin/no-dues', icon: FileCheck2, label: 'No Dues Report' }] : []),
    { to: '/faculty/sessional-marks', icon: GraduationCap, label: 'Sessional Marks' },
    { to: '/faculty/class-engagement', icon: UserCheck, label: 'Class Engagement' },
    ...(isAcademicCoordinator ? [{ to: '/admin/class-engagement-report', icon: UserCheck, label: 'Class Engagement Report' }] : []),
    { to: '/faculty/choice-filling', icon: ListChecks, label: 'Subject Choice Filling' },
    { to: '/faculty/my-subjects', icon: BookOpen, label: 'My Subjects (Activities)' },
    ...(isProjectGuide ? [{ to: '/pms/guide', icon: FolderOpen, label: 'Project Groups (PMS)' }] : []),
    { to: '/faculty/placement', icon: Briefcase, label: 'Placements' },
    { to: '/teacher/students', icon: Users, label: 'All Students' },
    { to: '/teacher/verify', icon: ShieldCheck, label: 'Verify Certificates' },
    { to: '/admin/timetable', icon: CalendarClock, label: 'Time Table' },
    ...(isSuper50Mentor ? [
      { to: '/teacher/super50-students', icon: Star, label: 'Super50 Students' }
    ] : []),
  ];

  const guideLinks = [
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/pms/guide', icon: FolderOpen, label: 'Project Groups (PMS)' },
    { to: '/faculty/no-dues', icon: FileCheck2, label: 'No Dues (TG)' },
    ...(isAcademicCoordinator ? [{ to: '/admin/no-dues', icon: FileCheck2, label: 'No Dues Report' }] : []),
    { to: '/faculty/sessional-marks', icon: GraduationCap, label: 'Sessional Marks' },
    { to: '/faculty/class-engagement', icon: UserCheck, label: 'Class Engagement' },
    ...(isAcademicCoordinator ? [{ to: '/admin/class-engagement-report', icon: UserCheck, label: 'Class Engagement Report' }] : []),
    { to: '/faculty/my-subjects', icon: BookOpen, label: 'My Subjects (Activities)' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  // Student Upload (existing Bulk Create page) now lives inside this group,
  // alongside the new Section/Mentor/Subject Catalog screens.
  const masterDataLinks = [
    { to: '/admin/bulk-create', icon: UserPlus, label: 'Student Upload' },
    { to: '/admin/master-data/sections', icon: Layers, label: 'Create Section' },
    { to: '/admin/master-data/mentors', icon: UserCheck, label: 'Assign Mentor' },
    { to: '/admin/master-data/subjects', icon: BookOpen, label: 'Create Subjects' },
    { to: '/admin/master-data/choice-matrix', icon: Grid3x3, label: 'Choice Filling Matrix' },
    { to: '/admin/master-data/load-calculation', icon: Gauge, label: 'Load Calculation' },
    { to: '/admin/master-data/allocation-sheet', icon: FileSpreadsheet, label: 'Allocation Sheet' },
  ];

  const adminLinks = [
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/faculty/tasks', icon: ListChecks, label: 'Task Manager' },
    { to: '/admin/timetable', icon: CalendarClock, label: 'Time Table' },
    { to: '/admin/no-dues', icon: FileCheck2, label: 'No Dues Report' },
    { to: '/faculty/no-dues', icon: FileCheck2, label: 'No Dues (Manage)' },
    { to: '/admin/sessional-marks', icon: GraduationCap, label: 'Sessional Marks Report' },
    { to: '/faculty/sessional-marks', icon: GraduationCap, label: 'Sessional Marks (Manage)' },
    { to: '/admin/feedback', icon: MessageSquareText, label: 'Faculty Feedback' },
    { to: '/admin/class-observations', icon: ClipboardCheck, label: 'Class Observation Form' },
    { to: '/faculty/class-engagement', icon: UserCheck, label: 'Class Engagement' },
    { to: '/admin/class-engagement-report', icon: UserCheck, label: 'Class Engagement Report' },
    { to: '/faculty/placement', icon: Briefcase, label: 'Placements' },
    { to: '/admin/students', icon: Users, label: 'All Students' },
    { to: '/admin/calling-tracker', icon: ClipboardList, label: 'Student Calling by Guide' },
    { to: '/admin/super50-students', icon: Star, label: 'Super50 Students' },
    { to: '/admin/verify', icon: ShieldCheck, label: 'Verify Certificates' },
    { to: '/admin/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/pms/admin', icon: Database, label: 'PMS Admin' },
    { label: 'Master Data', icon: Layers, children: masterDataLinks },
    { to: '/admin/super50-selection', icon: Star, label: 'Super 50 Selection' },
    { to: '/admin/general-forms', icon: ListChecks, label: 'General Forms' },
    { to: '/admin/guides', icon: ShieldCheck, label: 'Verify Faculty & Admins' },
    { to: '/admin/podai-marks', icon: FileText, label: 'Pod AI Master Sheet' },
    { to: '/admin/all-student-podai', icon: FileText, label: 'All Student Pod AI Sheet' },
    { to: '/admin/amcat', icon: FileText, label: 'AMCAT Dashboard' },
    { to: '/admin/mst', icon: FileText, label: 'MST Marks Dashboard' },
    { to: '/admin/rgpv', icon: Award, label: 'RGPV Marks Dashboard' },
    { to: '/admin/activity-logs', icon: History, label: 'Activity Logs' },
    { to: '/admin/backup-settings', icon: DatabaseBackup, label: 'Backup Settings' },
  ];

  const super50AdminLinks = [
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/admin/super50-selection', icon: Star, label: 'Super 50 Selection' },
    { to: '/admin/general-forms', icon: ListChecks, label: 'General Forms' },
    { to: '/admin/students', icon: Users, label: 'All Students' },
    { to: '/admin/super50-students', icon: Star, label: 'Super 50 Students' },
    { to: '/admin/podai-upload', icon: Upload, label: 'Pod AI Marks Upload' },
    { to: '/admin/podai-marks', icon: FileText, label: 'Pod AI Master Sheet' },
    { to: '/admin/verify', icon: ShieldCheck, label: 'Verify Certificates' },
    { to: '/admin/activity-logs', icon: History, label: 'Activity Logs' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const tpAdminLinks = [
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/tp/enroll-students', icon: UserPlus, label: 'Enroll Students' },
    { to: '/tp/create-drive', icon: Briefcase, label: 'Create Drive' },
    { to: '/faculty/placement', icon: ClipboardList, label: 'View Drives' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const pmsAdminLinks = [
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/pms/admin', icon: Database, label: 'PMS Dashboard' },
  ];

  const getNavLinks = () => {
    const roles = user?.roles && user.roles.length > 0 ? user.roles : [user?.role];
    if (roles.includes('student')) {
      return commonStudentLinks;
    }

    const combined = [];
    const seen = new Set();
    const hasMultipleRoles = roles.length > 1;

    roles.forEach(role => {
      let roleLinks = [];
      if (role === 'admin') roleLinks = adminLinks;
      else if (role === 'super50_admin') roleLinks = super50AdminLinks;
      else if (role === 'tp_admin') roleLinks = tpAdminLinks;
      else if (role === 'pms_admin') roleLinks = pmsAdminLinks;
      else if (role === 'teacher') roleLinks = teacherLinks;
      else if (role === 'guide') roleLinks = guideLinks;

      roleLinks.forEach(link => {
        const key = link.to || link.label; // groups (no `to`, has `children`) dedupe by label
        if (!seen.has(key)) {
          seen.add(key);

          let adjustedLabel = link.label;
          if (hasMultipleRoles) {
            if (link.to === '/admin/dashboard') {
              adjustedLabel = 'Dashboard (Admin)';
            } else if (link.to === '/teacher/dashboard') {
              adjustedLabel = 'Dashboard (Faculty)';
            }
          }

          combined.push({ ...link, label: adjustedLabel });
        }
      });
    });

    return combined.length > 0 ? combined : commonStudentLinks;
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className={`flex flex-col h-full bg-[var(--bg-card)] border-r border-[var(--border-light)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? 'w-20' : 'w-72'}`}>

      {/* Brand */}
      <div className="p-6 pb-2 relative group">
        <div className={`flex items-center gap-4 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg shadow-[rgba(139,92,246,0.25)] shrink-0 transition-transform duration-300 group-hover:scale-105">
            <GraduationCap size={20} color="white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <div className="font-display font-black text-3xl text-[var(--text-primary)] tracking-widest leading-none">
                MILE<span className="text-[var(--primary)]">.</span>
              </div>
              <div className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.2em] mt-1.5 opacity-80">
                {user?.role} Portal
              </div>
            </motion.div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-full items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] shadow-sm transition-all z-10"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Core Nav */}
        <div className="space-y-1.5">
          {!collapsed && <p className="px-4 text-[10px] font-black text-[var(--text-secondary)] opacity-60 uppercase tracking-[0.2em] mb-4">Core</p>}
          {getNavLinks().map((link) =>
            link.children ? (
              <NavGroup key={link.label} group={link} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
            ) : (
              <NavItem key={link.to} link={link} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            )
          )}
        </div>

        {/* T&P Section (Students Only) */}
        {user?.role === 'student' && (
          <div className="space-y-1.5">
            {!collapsed && <p className="px-4 text-[10px] font-black text-[var(--text-secondary)] opacity-60 uppercase tracking-[0.2em] mb-4">Placements</p>}
            {tpLinks.map((link) => (
              <NavItem key={link.to} link={link} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}

        {/* PMS Section (Students Only) */}
        {user?.role === 'student' && user?.enrollmentNo && (
          <div className="space-y-1.5">
            {!collapsed && <p className="px-4 text-[10px] font-black text-[var(--text-secondary)] opacity-60 uppercase tracking-[0.2em] mb-4 mt-6">Academics</p>}
            {pmsStudentLinks.map((link) => (
              <NavItem key={link.to} link={link} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}

        {/* Super 50 Section (Students Only) */}
        {user?.role === 'student' && user?.isSuper50 && (
          <div className="space-y-1.5">
            {!collapsed && <p className="px-4 text-[10px] font-black text-[var(--text-secondary)] opacity-60 uppercase tracking-[0.2em] mb-4 mt-6">Super 50</p>}
            {super50Links.map((link) => (
              <NavItem key={link.to} link={link} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto border-t border-[var(--border-light)]">
        <div className={`flex flex-col gap-3 ${collapsed ? 'items-center' : ''}`}>
          <div
            className="flex items-center gap-3 cursor-pointer group p-1.5 -ml-1.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            onClick={() => setIsProfileModalOpen(true)}
            title="Edit Profile"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--bg-app)] to-[var(--bg-app)] border border-[var(--border-light)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)] shadow-sm shrink-0 overflow-hidden group-hover:border-[var(--primary)] transition-colors">
              {user?.profileImage ? (
                <img
                  src={getImageUrl(user.profileImage)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.[0]
              )}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">{user?.name}</div>
                <div className="text-[10px] text-[var(--text-secondary)] truncate uppercase tracking-widest">{user?.isSuper50 ? 'Super 50 Member' : user?.role}</div>
              </div>
            )}
          </div>

          <div className={`flex gap-2 ${collapsed ? 'flex-col w-full' : ''}`}>
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-light)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all ${collapsed ? 'w-full' : 'flex-1'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-all font-bold text-xs uppercase tracking-widest ${collapsed ? 'w-full px-0' : 'flex-[2] px-4'}`}
              title="Logout"
            >
              <LogOut size={14} /> {!collapsed && "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-[100] p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-primary)] shadow-xl">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="hidden lg:block h-screen sticky top-0 z-40">
        <SidebarContent />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-[100] lg:hidden">
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

const NavItem = ({ link, onClick, collapsed }) => {
  // Only the Chat link needs a live badge — read the unread total straight
  // from the store here rather than threading it through every link array.
  const chatUnread = useSelector((s) =>
    link.to === '/chat' ? s.chat.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0
  );

  return (
  <NavLink
    to={link.to}
    onClick={onClick}
    className={({ isActive }) => `
      group relative flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-300
      ${isActive
        ? 'text-white font-bold'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }
      ${collapsed ? 'justify-center' : ''}
    `}
    title={collapsed ? link.label : ''}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="sidebarActiveBg"
            className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-xl shadow-md shadow-[rgba(139,92,246,0.15)]"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <link.icon
          size={18}
          className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}
        />
        {!collapsed && (
          <>
            <span className="relative z-10 font-bold text-sm tracking-tight flex-1">{link.label}</span>
            {chatUnread > 0 && (
              <span className={`relative z-10 text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${isActive ? 'bg-white text-[var(--primary)]' : 'bg-[var(--primary)] text-white'}`}>
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
            {isActive && (
              <motion.div layoutId="activePill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />
            )}
          </>
        )}
      </>
    )}
  </NavLink>
  );
};

// A parent menu item that expands into a flat list of NavItems — collapsed
// by default, auto-opens when one of its children is the active route.
// No such grouping existed anywhere in this file before Master Data.
const NavGroup = ({ group, collapsed, onNavigate }) => {
  const location = useLocation();
  const hasActiveChild = group.children.some((c) => location.pathname === c.to);
  const [open, setOpen] = useState(hasActiveChild);

  if (collapsed) {
    // No room to show a label + chevron when collapsed — just render the
    // children flat, same as any other icon-only link.
    return (
      <>
        {group.children.map((child) => (
          <NavItem key={child.to} link={child} collapsed={collapsed} onClick={onNavigate} />
        ))}
      </>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300"
      >
        <group.icon size={18} />
        <span className="flex-1 text-left font-bold text-sm tracking-tight">{group.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-4 space-y-1"
          >
            {group.children.map((child) => (
              <NavItem key={child.to} link={child} collapsed={collapsed} onClick={onNavigate} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
