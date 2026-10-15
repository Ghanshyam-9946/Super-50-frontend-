import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { fetchMe } from '../features/auth/authSlice';
import { ChatSocketProvider } from '../context/ChatSocketContext';
import FloatingChatBubble from './chat/FloatingChatBubble';
import ReminderAlarm from './reminders/ReminderAlarm';
import AssistantBubble from './assistant/AssistantBubble';
import NotificationAlerts from './notifications/NotificationAlerts';
import { isModuleOn, isPathEnabled, moduleForPath, useInstitute } from '../utils/institute';

export default function Layout({ theme, toggleTheme }) {
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const institute = useInstitute();
  // The institute's subscription: a warning in its last fortnight, and a
  // notice once it has ended and the app is read-only. Shown to admins,
  // and to everyone once it has ended (their changes are being refused).
  const sub = institute.subscription;
  const isAdmin = (user?.roles?.length ? user.roles : [user?.role]).includes('admin');
  const subscriptionNotice = sub && (sub.readOnly
    ? { expired: true, text: 'Your institute\'s subscription has ended. You can still view everything, but changes are paused until it is renewed.' }
    : (isAdmin && sub.daysLeft <= 15 ? { expired: false, text: `Your institute's subscription ends in ${sub.daysLeft} day(s) (${new Date(sub.endsAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}). Please renew to avoid interruption.` } : null));
  // Opened by a link or bookmark to a module this institute does not have.
  const blockedModule = !isPathEnabled(location.pathname, institute) ? moduleForPath(location.pathname, institute) : null;

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  // An open board, not the board list.
  const onBoard = /^\/boards\/(?!$)/.test(location.pathname);

  if (!token || !user) return <Navigate to="/login" replace />;

  // Force password change on first login for students
  if (!user.passwordChanged && user.role === 'student') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    // The ONE place the chat socket connects app-wide (not re-connected per
    // page) — Sidebar's unread badge and ChatPage both read from the same
    // connection via useChatSocket(); it no-ops for student accounts.
    <ChatSocketProvider>
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] relative z-10 flex font-body">
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-1 w-full min-h-screen overflow-x-hidden relative">
          {subscriptionNotice && (
            <div className={`mx-4 mt-4 rounded-2xl px-4 py-3 text-xs font-semibold border ${subscriptionNotice.expired ? "bg-red-500/10 text-red-600 border-red-500/30" : "bg-amber-500/10 text-amber-700 border-amber-500/30"}`}>
              {subscriptionNotice.text}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              {blockedModule ? (
                <div className="p-8 max-w-xl mx-auto">
                  <div className="glass-card rounded-3xl p-10 text-center space-y-2">
                    <h1 className="text-2xl font-display font-black text-[var(--text-primary)]">{blockedModule.label}</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                      This module is not enabled for your institute. Please contact your administrator.
                    </p>
                  </div>
                </div>
              ) : (
                <Outlet />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        {/* A whiteboard takes the whole screen for teaching — floating
            bubbles over the writing surface get in the way, and get drawn
            on by accident. */}
        {!onBoard && isModuleOn('chat', institute) && <FloatingChatBubble />}
        {/* Bottom middle on every signed-in page, for every role. */}
        {!onBoard && isModuleOn('assistant', institute) && <AssistantBubble />}
        {/* Anything new, for every role, with a sound. Hidden on a board so
            it does not land on the writing surface mid-lesson. */}
        {!onBoard && <NotificationAlerts />}
        <ReminderAlarm />
      </div>
    </ChatSocketProvider>
  );
}
