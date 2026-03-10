import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkCheck } from "lucide-react";
import { resolveBackendUrl } from "../config/env";
import { APP_STORAGE_EVENT, type BookmarkItem, getBookmarks } from "../utils/appStorage";

export function BookmarksPage() {
  const [items, setItems] = useState<BookmarkItem[]>(() => getBookmarks());

  useEffect(() => {
    const sync = () => setItems(getBookmarks());
    window.addEventListener(APP_STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APP_STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="px-6 pb-28 max-w-4xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-text-primary">Bookmarks</h1>
        <p className="text-sm text-text-muted">Your saved scriptures.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-sm text-text-muted">
          No bookmarks yet. Open a scripture and tap the bookmark button.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const posterSrc = item.poster_url ? resolveBackendUrl(item.poster_url) : null;
            return (
              <Link
                key={item.slug}
                to={`/${item.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-3 hover:border-accent/30"
              >
                {posterSrc ? (
                  <img src={posterSrc} alt={item.name} className="h-16 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-12 rounded-lg bg-surface-hover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {item.language} · {item.total_chapters} chapters
                  </p>
                </div>
                <BookmarkCheck size={18} className="text-accent" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
