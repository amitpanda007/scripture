import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Globe,
  Headphones,
  Play,
  Star,
} from "lucide-react";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { useScripture } from "../hooks/useScriptures";
import { resolveBackendUrl } from "../config/env";
import { APP_STORAGE_EVENT, isBookmarked, toggleBookmark } from "../utils/appStorage";

export function ScripturePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: scripture, loading, error, refetch } = useScripture(slug);
  const [, setBookmarkTick] = useState(0);

  const [lastChapter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("scripture_playback");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scriptureSlug === slug && parsed.chapterNum) {
          return parsed.chapterNum;
        }
      }
    } catch {
      // ignore
    }
    return 1;
  });

  useEffect(() => {
    if (!slug) return;
    const sync = () => setBookmarkTick((n) => n + 1);
    window.addEventListener(APP_STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APP_STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (error) return <div className="p-6"><ErrorBanner message={error} onRetry={refetch} /></div>;
  if (!scripture) return null;

  const bookmarked = slug ? isBookmarked(slug) : false;
  const posterUrl = scripture.poster_url ? resolveBackendUrl(scripture.poster_url) : null;

  const handleBookmark = () => {
    toggleBookmark(scripture);
    setBookmarkTick((n) => n + 1);
  };

  return (
    <div className="min-h-screen px-6 py-6 pb-28 max-w-4xl mx-auto w-full relative z-0">
      {/* Full-width background poster with bottom fade */}
      {posterUrl && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-[-1] h-[72vh] w-screen -translate-x-1/2 bg-cover bg-top bg-no-repeat opacity-50 dark:opacity-35"
          style={{ backgroundImage: `url('${posterUrl}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/42 to-surface" />
        </div>
      )}

      {/* Title & Action */}
      <div className="mb-8 pt-8 text-center">
        <h1 className="mb-1 text-2xl font-bold text-text-primary sm:text-3xl">
          {scripture.name}
        </h1>
        <p className="text-text-secondary text-sm mb-6">Ancient Wisdom</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/${slug}/chapter/${lastChapter}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dim"
          >
            <span>Continue listening</span>
            <Headphones size={18} />
          </Link>

          <button
            onClick={handleBookmark}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-text-secondary hover:text-text-primary"
          >
            {bookmarked ? <BookmarkCheck size={16} className="text-accent" /> : <Bookmark size={16} />}
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-8 mb-10 border-y border-border-subtle py-4">
        <div className="text-center">
          <p className="text-text-muted text-xs mb-1 flex items-center gap-1 justify-center"><Star size={12} className="text-gold" fill="currentColor"/> Rating</p>
          <p className="font-medium text-text-primary">4.9</p>
        </div>
        <div className="w-px h-8 bg-border-subtle"></div>
        <div className="text-center">
          <p className="text-text-muted text-xs mb-1 flex items-center gap-1 justify-center"><Globe size={12}/> Language</p>
          <p className="font-medium text-text-primary">{scripture.language}</p>
        </div>
        <div className="w-px h-8 bg-border-subtle"></div>
        <div className="text-center">
          <p className="text-text-muted text-xs mb-1 flex items-center gap-1 justify-center"><Clock size={12}/> Chapters</p>
          <p className="font-medium text-text-primary">{scripture.total_chapters}</p>
        </div>
      </div>

      {/* Overview */}
      {scripture.description && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Overview</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            {scripture.description}
          </p>
        </div>
      )}

      {/* Chapter list */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Chapters</h2>
        <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3">
          {scripture.chapters
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .map((ch) => (
              <Link
                key={ch.id}
                to={`/${slug}/chapter/${ch.chapter_number}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface-elevated border border-border-subtle hover:border-accent/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-secondary font-medium">
                  {ch.chapter_number}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-text-primary truncate">
                    {ch.title}
                  </h3>
                  {ch.title_hindi && (
                    <p className="text-sm text-text-secondary truncate mt-0.5 font-devanagari">
                      {ch.title_hindi}
                    </p>
                  )}
                </div>
                <span className="text-text-muted p-2">
                  <Play size={20} fill="currentColor" />
                </span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
