import type { Scripture } from "../types/scripture";

const BOOKMARKS_KEY = "scripture_bookmarks";
const NOTIFICATIONS_KEY = "scripture_notifications";
export const APP_STORAGE_EVENT = "scripture-storage-updated";

export interface BookmarkItem {
  slug: string;
  name: string;
  language: string;
  total_chapters: number;
  poster_image?: string | null;
  poster_url: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: number;
  read: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(APP_STORAGE_EVENT));
}

export function getBookmarks(): BookmarkItem[] {
  return readJson<BookmarkItem[]>(BOOKMARKS_KEY, []);
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().some((item) => item.slug === slug);
}

export function addNotification(title: string, message: string) {
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      created_at: Date.now(),
      read: false,
    },
    ...getNotifications(),
  ].slice(0, 50);
  writeJson(NOTIFICATIONS_KEY, next);
}

export function getNotifications(): NotificationItem[] {
  const items = readJson<NotificationItem[]>(NOTIFICATIONS_KEY, []);
  if (items.length > 0) return items;
  return [
    {
      id: "welcome",
      title: "Welcome",
      message: "Use bookmarks, search, and profile from the bottom navigation.",
      created_at: Date.now(),
      read: true,
    },
  ];
}

export function markAllNotificationsRead() {
  const next = getNotifications().map((item) => ({ ...item, read: true }));
  writeJson(NOTIFICATIONS_KEY, next);
}

export function getUnreadNotificationCount() {
  return getNotifications().filter((item) => !item.read).length;
}

export function toggleBookmark(scripture: Scripture): boolean {
  const current = getBookmarks();
  const exists = current.some((item) => item.slug === scripture.slug);
  let next: BookmarkItem[];

  if (exists) {
    next = current.filter((item) => item.slug !== scripture.slug);
    writeJson(BOOKMARKS_KEY, next);
    addNotification("Bookmark removed", `${scripture.name} was removed from bookmarks.`);
    return false;
  }

  next = [
    {
      slug: scripture.slug,
      name: scripture.name,
      language: scripture.language,
      total_chapters: scripture.total_chapters,
      poster_image: scripture.poster_image ?? null,
      poster_url: scripture.poster_url,
    },
    ...current,
  ];
  writeJson(BOOKMARKS_KEY, next);
  addNotification("Bookmark added", `${scripture.name} was added to bookmarks.`);
  return true;
}
