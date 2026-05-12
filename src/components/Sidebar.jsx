import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import {
  LayoutDashboard, Award, Zap, Trophy, Users, ShieldCheck,
  ClipboardList, UserPlus, LogOut, Sun, Moon, GraduationCap, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/activities', icon: Zap, label: 'Activities' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const teacherLinks = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teacher/students', icon: Users, label: 'All Students' },
  { to: '/teacher/verify', icon: ShieldCheck, label: 'Verify Certificates' },
  { to: '/teacher/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/students', icon: Users, label: 'All Students' },
  { to: '/admin/verify', icon: ShieldCheck, label: 'Verify Certificates' },
  { to: '/admin/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/admin/bulk-create', icon: UserPlus, label: 'Bulk Create' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function Sidebar({ theme, toggleTheme }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'teacher' ? teacherLinks :
    studentLinks;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GraduationCap size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Super 50</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role} Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        {/* User info */}
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-card)', marginBottom: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-danger"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none', position: 'fixed', top: 16, left: 16,
          zIndex: 200, background: 'var(--accent)', border: 'none',
          borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'white'
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Sidebar */}
      <SidebarContent />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none'
          }}
          className="mobile-overlay"
        />
      )}
    </>
  );
}
