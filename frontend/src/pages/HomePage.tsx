import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScriptures } from "../hooks/useScriptures";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { MoreHorizontal } from "lucide-react";
import { APP_STORAGE_EVENT, isBookmarked, toggleBookmark } from "../utils/appStorage";
import { resolveBackendUrl } from "../config/env";

export function HomePage() {
  const { data: scriptures, loading, error, refetch } = useScriptures();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setBookmarkTick] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const featured = scriptures?.[0] ?? null;
  const others = scriptures?.slice(1) ?? [];
  const featuredBookmarked = featured ? isBookmarked(featured.slug) : false;

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", closeMenu);
    return () => window.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    const syncBookmarks = () => setBookmarkTick((n) => n + 1);
    window.addEventListener(APP_STORAGE_EVENT, syncBookmarks);
    window.addEventListener("storage", syncBookmarks);
    return () => {
      window.removeEventListener(APP_STORAGE_EVENT, syncBookmarks);
      window.removeEventListener("storage", syncBookmarks);
    };
  }, []);

  const getContinueChapter = (slug: string) => {
    try {
      const saved = localStorage.getItem("scripture_playback");
      if (!saved) return 1;
      const parsed = JSON.parse(saved);
      if (parsed.scriptureSlug === slug && parsed.chapterNum) {
        return Number(parsed.chapterNum);
      }
    } catch {
      // ignore
    }
    return 1;
  };

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (error) return <div className="p-6"><ErrorBanner message={error} onRetry={refetch} /></div>;
  if (!scriptures || scriptures.length === 0) {
    return <p className="text-center text-text-muted p-6">No scriptures available yet.</p>;
  }

  return (
    <div className="px-6 space-y-8 max-w-3xl mx-auto w-full">
      {/* Featured Card */}
      {featured && (
        <article
          className="relative cursor-pointer rounded-[2rem] border border-border-subtle bg-surface-elevated p-5 shadow-sm transition-shadow hover:shadow-md min-h-[140px] flex flex-col justify-center"
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/${featured.slug}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate(`/${featured.slug}`);
            }
          }}
        >
          {/* Background Image & Overlay */}
          {featured.poster_url && (
            <>
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center rounded-[2rem]"
                style={{ backgroundImage: `url(${resolveBackendUrl(featured.poster_url)})` }}
              />
              <div className="absolute inset-0 z-0 bg-black/60 rounded-[2rem]" />
            </>
          )}

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-semibold truncate ${featured.poster_url ? "text-white drop-shadow-md" : "text-text-primary"}`}>
                {featured.name}
              </h2>
              <p className={`text-sm truncate mt-1 ${featured.poster_url ? "text-gray-200 drop-shadow-md" : "text-text-secondary"}`}>
                {featured.language} • {featured.total_chapters} Chapters
              </p>
            </div>
            <div ref={menuRef} className="relative z-50">
              <button
                className={`p-2 transition-colors ${featured.poster_url ? "text-white hover:text-gray-200 drop-shadow-md" : "text-text-muted hover:text-text-primary"}`}
                aria-label="Open scripture options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((open) => !open);
                }}
              >
                <MoreHorizontal size={20} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated shadow-lg z-50">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      navigate(`/${featured.slug}`);
                    }}
                  >
                    Open scripture
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      navigate(`/${featured.slug}/chapter/${getContinueChapter(featured.slug)}`);
                    }}
                  >
                    Continue listening
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(featured);
                      setBookmarkTick((n) => n + 1);
                      setMenuOpen(false);
                    }}
                  >
                    {featuredBookmarked ? "Remove bookmark" : "Add bookmark"}
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Progress bar simulation */}
          <div className="relative z-10 mt-5 h-1 w-full bg-surface/50 rounded-full overflow-hidden">
            <div className="h-full bg-accent w-1/3 rounded-full" />
          </div>
        </article>
      )}

      {/* Listened recently (mapped to remaining scriptures) */}
      {others.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Explore Scriptures</h3>
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {others.map((s) => (
              <Link
                key={s.id}
                to={`/${s.slug}`}
                className="group flex items-center gap-4 p-3 rounded-2xl bg-surface hover:bg-surface-elevated transition-colors border border-transparent hover:border-border-subtle"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-surface-elevated group-hover:border-accent/30 transition-colors">
                  <span className="text-xl font-bold text-accent">{s.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium text-text-primary truncate">
                    {s.name}
                  </h4>
                  <p className="text-sm text-text-secondary truncate mt-0.5">
                    {s.language}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
