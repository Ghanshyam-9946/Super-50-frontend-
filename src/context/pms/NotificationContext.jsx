import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { notificationsAPI } from '../../api/pms';

// PMS in-app notifications (backend: /api/pms/notifications). Keeps the
// unread count + latest few for the Topbar bell and Sidebar badge, polling
// once a minute while PMS is open.
const POLL_MS = 60 * 1000;

const NotificationContext = createContext({
  recent: [],
  unread: 0,
  fetchRecent: () => {},
  markRead: () => {},
  markAllRead: () => {},
  setUnread: () => {},
});

export const NotificationProvider = ({ children }) => {
  const token = useSelector((s) => s.auth.token);
  const [recent, setRecent] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.recent();
      setRecent(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      /* the bell just stays as it was — not worth a toast every minute */
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    fetchRecent();
    const id = setInterval(fetchRecent, POLL_MS);
    return () => clearInterval(id);
  }, [token, fetchRecent]);

  const markRead = useCallback(async (n) => {
    if (!n || n.isRead) return;
    setRecent((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try { await notificationsAPI.markRead(n._id); } catch { fetchRecent(); }
  }, [fetchRecent]);

  const markAllRead = useCallback(async () => {
    setRecent((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try { await notificationsAPI.markAllRead(); } catch { fetchRecent(); }
  }, [fetchRecent]);

  return (
    <NotificationContext.Provider value={{ recent, unread, fetchRecent, markRead, markAllRead, setUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
