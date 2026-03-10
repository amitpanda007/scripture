import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useVerses } from "../hooks/useScriptures";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { VerseCard } from "../components/VerseCard";
import { AudioPlayerBar } from "../components/AudioPlayerBar";
import { Spinner } from "../components/Spinner";
import { ErrorBanner } from "../components/ErrorBanner";
import { ArrowLeft, Bookmark } from "lucide-react";

export function ChapterPage() {
  const { slug, chapterNum } = useParams<{
    slug: string;
    chapterNum: string;
  }>();
  const num = Number(chapterNum);
  const { data, loading, error, refetch } = useVerses(slug, num, 1, 100);
  const verses = data?.items ?? [];

  const {
    isPlaying,
    currentVerseId,
    phase,
    progress,
    duration,
    isAutoNext,
    playVerse,
    playAll,
    stop,
    togglePause,
    toggleAutoNext,
  } = useAudioPlayer(verses, slug, num);

  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (currentVerseId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentVerseId, phase]);

  const currentVerse = verses.find((v) => v.id === currentVerseId);

  return (
    <div className="min-h-screen px-6 pb-40 pt-6">
      <div className="mx-auto max-w-3xl">
        {/* Custom Header */}
        <header className="flex items-center justify-between mb-8">
          <Link 
            to={`/${slug}`} 
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div className="flex-1 text-center min-w-0 px-4">
            <h1 className="text-lg font-semibold text-text-primary truncate">
              {slug === "gita" ? "Bhagavad Gita" : slug}
            </h1>
            <p className="text-xs text-text-muted">Chapter {chapterNum}</p>
          </div>
          <Link
            to="/bookmarks"
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-full transition-colors"
            aria-label="Open bookmarks"
          >
            <Bookmark size={24} />
          </Link>
        </header>

        {loading && <Spinner />}
        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {/* Verse list */}
        <div className="space-y-6">
          {verses.map((verse) => {
            const isActive = verse.id === currentVerseId;
            return (
              <div
                key={verse.id}
                ref={(el) => {
                  if (isActive) activeRef.current = el;
                }}
              >
                <VerseCard
                  verse={verse}
                  isActive={isActive}
                  isPlaying={isActive && isPlaying}
                  phase={isActive ? phase : "idle"}
                  onPlay={playVerse}
                  onTogglePause={togglePause}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed floating player */}
      <AudioPlayerBar
        isPlaying={isPlaying}
        currentVerseNumber={currentVerse?.verse_number ?? null}
        phase={phase}
        progress={progress}
        duration={duration}
        onTogglePause={togglePause}
        onStop={stop}
        onPlayAll={() => playAll(0)}
        hasVerses={verses.length > 0}
        verses={verses}
        currentVerseId={currentVerseId}
        playVerse={playVerse}
        isAutoNext={isAutoNext}
        toggleAutoNext={toggleAutoNext}
      />
    </div>
  );
}
