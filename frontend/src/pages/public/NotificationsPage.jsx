import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/resources';
import { formatDate } from '../../utils/format';
import { EmptyState, PageLoader } from '../../components/ui/Primitives';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationService
      .list()
      .then(({ data }) => setNotifications(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    await notificationService.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await notificationService.markAllAsRead();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-charcoal-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="text-xs text-terracotta-600 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="bg-white border border-stone-100 divide-y divide-stone-50">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-ivory-100 ${!n.isRead ? 'bg-sand-100/30' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-terracotta-500' : 'bg-transparent'}`} />
              <div>
                <p className="text-sm text-charcoal-900">{n.title}</p>
                <p className="text-xs text-charcoal-500 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-charcoal-400 mt-1">{formatDate(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
