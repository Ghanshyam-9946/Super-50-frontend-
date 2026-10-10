import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../../api/pms';
import { handleError } from '../../api/pms/client';
import { Card, Spinner, EmptyState, confirmAction } from '../../components/pms/Common';
import { useNotifications } from '../../context/pms/NotificationContext';
import { formatDateTime, cn, notificationHref } from '../../utils/pms/helpers';

// Full PMS notification list — every role (admin, guide, student).
const Notifications = () => {
  const { fetchRecent } = useNotifications();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.list({ limit: 100 });
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep the Topbar bell / Sidebar badge in step with this page.
  const after = async (fn) => {
    try {
      await fn();
      await load();
      fetchRecent();
    } catch (err) {
      toast.error(handleError(err));
    }
  };

  const markRead = (n) => !n.isRead && after(() => notificationsAPI.markRead(n._id));
  const remove = (n) => after(() => notificationsAPI.remove(n._id));
  const markAll = () => after(() => notificationsAPI.markAllRead());
  const clearAll = () => {
    if (!confirmAction('Delete all your notifications? This cannot be undone.')) return;
    after(() => notificationsAPI.clearAll());
  };

  const shown = filter === 'unread' ? items.filter((n) => !n.isRead) : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">{loading ? 'Loading…' : unread > 0 ? `${unread} unread` : 'You are all caught up'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={markAll} disabled={unread === 0} className="btn-outline btn-sm flex items-center gap-1.5 disabled:opacity-50">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
          <button onClick={clearAll} disabled={items.length === 0} className="btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {[['all', `All (${items.length})`], ['unread', `Unread (${unread})`]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border', filter === key ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
          >
            {label}
          </button>
        ))}
      </div>

      <Card noPadding>
        {loading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : shown.length === 0 ? (
          <EmptyState icon={BellOff} title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((n) => {
              const href = notificationHref(n);
              const opensElsewhere = href !== '/pms/notifications';
              return (
                <li key={n._id} className={cn('flex gap-3 px-4 py-3', !n.isRead && 'bg-brand-50 border-l-4 border-l-brand-600')}>
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', !n.isRead ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600')}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {opensElsewhere ? (
                      <Link to={href} onClick={() => markRead(n)} className="text-sm font-medium text-slate-900 hover:text-brand-700 hover:underline">
                        {n.title}
                      </Link>
                    ) : (
                      <div className="text-sm font-medium text-slate-900">{n.title}</div>
                    )}
                    {n.message && <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>}
                    <div className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</div>
                  </div>
                  <div className="flex items-start gap-1">
                    {!n.isRead && (
                      <button onClick={() => markRead(n)} title="Mark as read" className="btn-outline btn-sm">
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={() => remove(n)} title="Delete" className="btn-secondary btn-sm">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
