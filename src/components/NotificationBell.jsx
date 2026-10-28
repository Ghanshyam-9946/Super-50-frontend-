import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

// The notification bell every signed-in user sees, wherever they are in the
// app. Backed by /api/notifications (the same inbox PMS uses), refreshed
// once a minute.
const POLL_MS = 60 * 1000;

const timeAgo = (d) => {
  const mins = Math.round((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function NotificationBell({ collapsed = false }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/recent');
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      /* stay quiet — the bell just keeps its last state */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (n) => {
    if (n.isRead) return;
    setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try { await api.put(`/notifications/${n._id}/read`); } catch { load(); }
  };

  const markAll = async () => {
    setBusy(true);
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try { await api.put('/notifications/mark-all-read'); } catch { load(); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label="Notifications"
        title="Notifications"
        className={`relative flex items-center gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${collapsed ? 'justify-center w-full' : 'w-full'}`}
      >
        <Bell size={16} />
        {!collapsed && <span>Notifications</span>}
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-card)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-light)]">
            <strong className="text-sm text-[var(--text-primary)]">Notifications</strong>
            {unread > 0 && (
              <button onClick={markAll} disabled={busy} className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />} Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-[var(--text-secondary)]">
                <BellOff size={26} className="mx-auto mb-2 opacity-40" />
                <div className="text-xs">Nothing yet</div>
              </div>
            ) : (
              items.map((n) => {
                const body = (
                  <>
                    <div className="text-sm font-bold text-[var(--text-primary)] leading-snug">{n.title}</div>
                    {n.message && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</div>}
                    <div className="text-[10px] text-[var(--text-secondary)] mt-1">{timeAgo(n.createdAt)}</div>
                  </>
                );
                const cls = `block px-4 py-3 border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors ${!n.isRead ? 'bg-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]' : ''}`;
                return n.link ? (
                  <Link key={n._id} to={n.link} onClick={() => { setOpen(false); markRead(n); }} className={cls}>{body}</Link>
                ) : (
                  <button key={n._id} onClick={() => markRead(n)} className={`${cls} w-full text-left`}>{body}</button>
                );
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border-light)] text-center">
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-sm font-bold text-[var(--primary)] hover:underline">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
