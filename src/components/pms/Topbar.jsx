import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, ChevronRight, ArrowLeft, LogOut, BellOff } from 'lucide-react';
import { useAuth } from '../../context/pms/AuthContext';
import { useNotifications } from '../../context/pms/NotificationContext';
import { getInitial, formatDateTime, cn, notificationHref } from '../../utils/pms/helpers';
import * as Icons from 'lucide-react';

const NotifIcon = ({ name, className }) => {
  // Map common icon names to Lucide
  const iconMap = {
    'easel': Icons.Presentation,
    'check-circle': Icons.CheckCircle2,
    'x-circle': Icons.XCircle,
    'cloud-upload': Icons.CloudUpload,
    'collection': Icons.Layers,
    'people': Icons.Users,
    'person-badge': Icons.UserCheck,
    'star': Icons.Star,
    'clock': Icons.Clock,
    'bell': Icons.Bell,
  };
  const Component = iconMap[name] || Icons.Bell;
  return <Component className={className} />;
};

const Topbar = ({ onToggleSidebar, pageTitle }) => {
  const { user, logout } = useAuth();
  const { recent, unread, fetchRecent, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Navigate first, then clear auth: both updates land in the same render,
  // so nothing inside the PMS layout ever renders with a null user.
  const handleLogout = () => {
    navigate('/login', { replace: true });
    logout();
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white/75 backdrop-blur-xl border-b border-slate-200/70 px-4 lg:px-7 flex items-center justify-between gap-3 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Open menu"
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
          <span className="hidden sm:inline font-semibold text-slate-400">PMS</span>
          <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          <span className="font-semibold text-slate-900 truncate">{pageTitle}</span>
        </nav>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="hidden md:inline-flex ml-auto mr-1 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Main Dashboard
      </button>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((p) => !p);
              if (!notifOpen) fetchRecent();
            }}
            className={cn(
              'relative w-10 h-10 rounded-xl border bg-white flex items-center justify-center shadow-sm transition-colors',
              notifOpen ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[19px] h-[19px] px-1 flex items-center justify-center ring-2 ring-white shadow-md shadow-rose-500/30">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="pms-modal absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-indigo-50/60 border-b border-slate-100 flex items-center justify-between">
                <strong className="text-sm">Notifications</strong>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {recent.length === 0 ? (
                  <div className="py-10 px-4 text-center text-slate-400">
                    <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <div className="text-xs">No notifications yet</div>
                  </div>
                ) : (
                  recent.map((n) => (
                    <Link
                      key={n._id}
                      to={notificationHref(n)}
                      onClick={() => { setNotifOpen(false); markRead(n); }}
                      className={cn(
                        'flex gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-brand-50/40 transition-colors',
                        !n.isRead && 'bg-brand-50 border-l-4 border-l-brand-600'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        !n.isRead ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'
                      )}>
                        <NotifIcon name={n.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 leading-snug">{n.title}</div>
                        {n.message && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(n.createdAt)}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <Link
                  to="/pms/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((p) => !p)}
            className={cn(
              'flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border bg-white shadow-sm transition-colors',
              userOpen ? 'border-brand-200 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50'
            )}
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-100"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/25">
                {getInitial(user.name)}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="text-[10px] font-medium text-slate-500 capitalize">{user.role}</div>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-slate-400 hidden sm:block transition-transform', userOpen && 'rotate-180')} />
          </button>

          {userOpen && (
            <div className="pms-modal absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/60">
                <div className="font-semibold text-sm text-slate-900 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role} account</div>
              </div>
              <button
                onClick={() => { setUserOpen(false); navigate('/dashboard'); }}
                className="md:hidden w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Main Dashboard
              </button>
              <Link
                to="/pms/notifications"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700"
              >
                <Bell className="w-4 h-4" />
                Notifications
                {unread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5">
                    {unread}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
