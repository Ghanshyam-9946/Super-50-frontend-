import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, Trash2, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Everyone's notification inbox — the full list behind the sidebar bell.
export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 100 } });
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    try {
      await fn();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const markRead = (n) => !n.isRead && run(() => api.put(`/notifications/${n._id}/read`));
  const remove = (n) => run(() => api.delete(`/notifications/${n._id}`));
  const markAll = () => run(() => api.put('/notifications/mark-all-read'));
  const clearAll = () => {
    if (!window.confirm('Delete all your notifications? This cannot be undone.')) return;
    run(() => api.delete('/notifications/clear-all'));
  };

  const shown = filter === 'unread' ? items.filter((n) => !n.isRead) : items;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <Bell className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Notifications</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              {loading ? 'Loading…' : unread > 0 ? `${unread} unread` : 'You are all caught up'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={markAll} disabled={unread === 0} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
            <CheckCheck size={14} /> Mark all read
          </button>
          <button onClick={clearAll} disabled={items.length === 0} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      </header>

      <div className="flex gap-2">
        {[['all', `All (${items.length})`], ['unread', `Unread (${unread})`]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : shown.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <BellOff size={34} className="mx-auto text-[var(--text-secondary)] opacity-50" />
            <p className="font-bold text-[var(--text-primary)]">
              {filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              New tasks, assignments, marks and announcements will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            {shown.map((n) => {
              const body = (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.isRead ? 'bg-[var(--bg-input)] text-[var(--text-secondary)]' : 'bg-[var(--primary)] text-white'}`}>
                    <Bell size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--text-primary)]">{n.title}</div>
                    {n.message && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</div>}
                    <div className="text-[10px] text-[var(--text-secondary)] mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </>
              );
              return (
                <div key={n._id} className={`flex items-start gap-3 p-4 ${!n.isRead ? 'bg-[var(--primary)]/5' : ''}`}>
                  {n.link ? (
                    <Link to={n.link} onClick={() => markRead(n)} className="flex items-start gap-3 flex-1 min-w-0">{body}</Link>
                  ) : (
                    <div className="flex items-start gap-3 flex-1 min-w-0">{body}</div>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <button onClick={() => markRead(n)} title="Mark as read" className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)]">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => remove(n)} title="Delete" className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
