import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import {
  APP_STORAGE_EVENT,
  getNotifications,
  markAllNotificationsRead,
  type NotificationItem,
} from "../utils/appStorage";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(() => getNotifications());

  useEffect(() => {
    const sync = () => setItems(getNotifications());
    window.addEventListener(APP_STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APP_STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="px-6 pb-28 max-w-4xl mx-auto w-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-muted">Recent app updates and actions.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-sm text-text-muted">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${
                item.read
                  ? "border-border-subtle bg-surface-elevated"
                  : "border-accent/30 bg-accent/5"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <BellRing size={14} className={item.read ? "text-text-muted" : "text-accent"} />
                <p className="text-sm font-medium text-text-primary">{item.title}</p>
              </div>
              <p className="text-sm text-text-secondary">{item.message}</p>
              <p className="mt-2 text-xs text-text-muted">{formatTime(item.created_at)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
