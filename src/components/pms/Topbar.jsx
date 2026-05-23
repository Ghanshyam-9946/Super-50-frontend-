import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User as UserIcon, BellOff } from 'lucide-react';
import { useAuth } from '../context/pms/AuthContext';
import { useNotifications } from '../context/pms/NotificationContext';
import { getInitial, formatDateTime, cn } from '../../utils/pms/helpers';
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
  const { recent, unread, fetchRecent, markAllRead } = useNotifications();
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-7 flex items-center justify-between sticky top-0 z-30 shadow-soft">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-900 truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((p) => !p);
              if (!notifOpen) fetchRecent();
            }}
            className="relative w-10 h-10 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-elevated border border-slate-200 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
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
                      to={n.link || '/notifications'}
                      onClick={() => setNotifOpen(false)}
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
                  to="/notifications"
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
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center font-semibold text-sm">
              {getInitial(user.name)}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-elevated border border-slate-200 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-semibold text-sm">{user.name}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role} account</div>
              </div>
              <Link
                to="/notifications"
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
