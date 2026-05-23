import { createContext, useContext, useState, useCallback } from 'react';

// Stub NotificationContext — the merged P&T app uses its own notification system.
// This bridge provides a safe no-op so PMS components (Topbar, Sidebar) don't crash.
const NotificationContext = createContext({
  recent: [],
  unread: 0,
  fetchRecent: () => {},
  markAllRead: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [recent] = useState([]);
  const [unread] = useState(0);

  const fetchRecent = useCallback(() => {}, []);
  const markAllRead = useCallback(() => {}, []);

  return (
    <NotificationContext.Provider value={{ recent, unread, fetchRecent, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
