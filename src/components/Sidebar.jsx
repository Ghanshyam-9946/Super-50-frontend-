import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import {
  LayoutDashboard, Award, Zap, Trophy, Users, ShieldCheck,
  ClipboardList, UserPlus, LogOut, Sun, Moon, GraduationCap, Menu, X,
  Briefcase, FileText, Layout, Star, FolderOpen, Database
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ theme, toggleTheme }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Core Links (All Students)
  const commonStudentLinks = [
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  // Training & Placement Section (ALL students)
  const tpLinks = [
    { to: '/placement', icon: Briefcase, label: 'T&P Dashboard' },

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
    { to: '/certificates', icon: Award, label: 'Certificates' },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/placement', icon: Briefcase, label: 'Placements' },
    { to: '/faculty/resumes', icon: FileText, label: 'Resume Review' },
    { to: '/teacher/students', icon: Users, label: 'All Students' },
    { to: '/teacher/verify', icon: ShieldCheck, label: 'Verify Certificates' },
    { to: '/teacher/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/pms/guide', icon: FolderOpen, label: 'Project Groups (PMS)' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const guideLinks = [
    { to: '/pms/guide', icon: FolderOpen, label: 'Project Groups (PMS)' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const adminLinks = [
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/admin/bulk-create', icon: UserPlus, label: 'Bulk Create' },
    { to: '/pms/admin', icon: Database, label: 'PMS Admin' },
    { to: '/admin/super50-selection', icon: Star, label: 'Super 50 Selection' },
    { to: '/faculty/placement', icon: Briefcase, label: 'Placements' },
    { to: '/admin/guides', icon: ShieldCheck, label: 'Verify Admins' },
  ];

  const super50AdminLinks = [
    { to: '/admin/super50-selection', icon: Star, label: 'Super 50 Selection' },
    { to: '/admin/students', icon: Users, label: 'Super 50 Students' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const tpAdminLinks = [
    { to: '/admin/drive-eligibility', icon: Briefcase, label: 'Drive Eligibility' },
    { to: '/admin/drive-results', icon: ClipboardList, label: 'Drive Results' },
    { to: '/faculty/placement', icon: Briefcase, label: 'Placements' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const pmsAdminLinks = [
    { to: '/pms/admin', icon: Database, label: 'PMS Dashboard' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-72 bg-white/60 backdrop-blur-xl border-r border-slate-200/60">
      {/* Brand */}
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <GraduationCap size={26} color="white" />
          </div>
          <div>
            <div className="font-black text-xl text-slate-950 tracking-tighter">SUPER 50</div>
            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest leading-none mt-1">
              {user?.role} Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-8">
        {/* Core Nav */}
        <div className="space-y-1.5">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Core</p>
          {(user?.role === 'admin' ? adminLinks :
            user?.role === 'super50_admin' ? super50AdminLinks :
            user?.role === 'tp_admin' ? tpAdminLinks :
            user?.role === 'pms_admin' ? pmsAdminLinks :
            user?.role === 'teacher' ? teacherLinks :
            user?.role === 'guide' ? guideLinks :
            commonStudentLinks).map((link) => (
                  <NavItem key={link.to} link={link} onClick={() => setMobileOpen(false)} />
                ))}
        </div>

        {/* T&P Section (Students Only) */}
        {user?.role === 'student' && (
          <div className="space-y-1.5">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Training & Placement</p>
            {tpLinks.map((link) => (
              <NavItem key={link.to} link={link} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}

        {/* PMS Section (Students Only) */}
        {user?.role === 'student' && (
          <div className="space-y-1.5">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 mt-6">Academic Projects</p>
            {pmsStudentLinks.map((link) => (
              <NavItem key={link.to} link={link} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}

        {/* Super 50 Section (Students Only) */}
        {user?.role === 'student' && user?.isSuper50 && (
          <div className="space-y-1.5">
            <div className="px-4 flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Super 50 Portal</p>
            </div>
            {super50Links.map((link) => (
              <NavItem key={link.to} link={link} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto">
        <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-500/20 flex items-center justify-center text-sm font-bold text-white shadow-inner">
              {user?.name?.[0]}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-slate-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-purple-600 truncate uppercase tracking-widest">{user?.isSuper50 ? 'Super 50 Member' : user?.role}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex-[2] flex items-center justify-center gap-2 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all font-bold text-xs uppercase tracking-widest"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-[100] p-3 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl">
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className="hidden lg:block h-screen sticky top-0">
        <SidebarContent />
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[90] lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-[100] lg:hidden">
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const NavItem = ({ link, onClick }) => (
  <NavLink
    to={link.to}
    onClick={onClick}
    className={({ isActive }) => `
      group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 border
      ${isActive
        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-[0_4px_12px_rgba(124,58,237,0.08)]'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/50'
      }
    `}
  >
    {({ isActive }) => (
      <>
        <link.icon
          size={18}
          className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-700'}`}
        />
        <span className="font-bold text-sm tracking-tight">{link.label}</span>
        {isActive && (
          <motion.div layoutId="activePill" className="ml-auto w-1 h-1 rounded-full bg-purple-600 shadow-[0_0_10px_#7c3aed]" />
        )}
      </>
    )}
  </NavLink>
);

export default Sidebar;
