import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Book, Search, Bookmark, User, Moon, Sun, Bell } from "lucide-react";
import { APP_STORAGE_EVENT, getUnreadNotificationCount } from "../utils/appStorage";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isGitaPage = location.pathname === "/gita";
  const isChapterPage = location.pathname.includes("/chapter/");
  const [unreadCount, setUnreadCount] = useState<number>(() => getUnreadNotificationCount());

  useEffect(() => {
    const sync = () => setUnreadCount(getUnreadNotificationCount());
    window.addEventListener(APP_STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APP_STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col font-sans transition-colors duration-300">
      {/* Top Header - Hidden on Chapter Page for custom header */}
      {!isChapterPage && (
        <header
          className={`w-full ${
            isGitaPage
              ? "border-b border-amber-200/55 bg-amber-100/45 backdrop-blur-md dark:border-amber-700/45 dark:bg-amber-900/28"
              : ""
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-3xl items-center justify-between px-6 ${
              isGitaPage ? "py-2.5" : "py-4 pt-8"
            }`}
          >
            <div className="flex items-center gap-3">
              {isHome ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 overflow-hidden flex items-center justify-center text-accent">
                    <User size={20} />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold leading-tight">Hey, Seeker!</h1>
                    <p className="text-xs text-text-muted">What will you listen to today?</p>
                  </div>
                </div>
              ) : (
                <Link to="/" className="text-text-secondary hover:text-accent p-2 -ml-2 rounded-full hover:bg-surface-hover transition-colors">
                  <Book size={24} />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-surface-hover transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <Link
                to="/notifications"
                className="relative p-2 text-text-secondary hover:text-accent rounded-full hover:bg-surface-hover transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute mt-[-8px] ml-[10px] inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${!isChapterPage ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isChapterPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface-elevated/90 backdrop-blur-xl border-t border-border-subtle z-40 pb-safe">
          <div className="flex items-center justify-around px-6 py-3 max-w-md mx-auto">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `p-3 rounded-xl transition-all ${
                  isActive ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-secondary"
                }`
              }
            >
              {({ isActive }) => <Book size={24} strokeWidth={isActive ? 2.5 : 2} />}
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `p-3 rounded-xl transition-all ${
                  isActive ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-secondary"
                }`
              }
            >
              {({ isActive }) => <Search size={24} strokeWidth={isActive ? 2.5 : 2} />}
            </NavLink>
            <NavLink
              to="/bookmarks"
              className={({ isActive }) =>
                `p-3 rounded-xl transition-all ${
                  isActive ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-secondary"
                }`
              }
            >
              {({ isActive }) => <Bookmark size={24} strokeWidth={isActive ? 2.5 : 2} />}
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `p-3 rounded-xl transition-all ${
                  isActive ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-secondary"
                }`
              }
            >
              {({ isActive }) => <User size={24} strokeWidth={isActive ? 2.5 : 2} />}
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}
