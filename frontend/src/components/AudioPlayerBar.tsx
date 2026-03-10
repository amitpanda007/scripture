import type { PlayPhase } from "../hooks/useAudioPlayer";
import { ListMusic, Moon, Pause, Play, SkipBack, SkipForward, Repeat, Square } from "lucide-react";
import type { Verse } from "../types/scripture";

interface Props {
  isPlaying: boolean;
  currentVerseNumber: number | null;
  phase: PlayPhase;
  progress: number;
  duration: number;
  onTogglePause: () => void;
  onStop: () => void;
  onPlayAll: () => void;
  hasVerses: boolean;
  verses?: Verse[];
  currentVerseId?: number | null;
  playVerse?: (verse: Verse, phase?: PlayPhase, progress?: number, forcePlayAll?: boolean) => void;
  isAutoNext?: boolean;
  toggleAutoNext?: () => void;
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayerBar({
  isPlaying,
  currentVerseNumber,
  phase,
  progress,
  duration,
  onTogglePause,
  onStop,
  onPlayAll,
  hasVerses,
  verses,
  currentVerseId,
  playVerse,
  isAutoNext,
  toggleAutoNext,
}: Props) {
  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const phaseLabel = phase === "scripture" ? "Verse" : phase === "meaning" ? "Meaning" : "";
  const totalBars = 36;
  const activeBars = Math.max(0, Math.min(totalBars, Math.round((pct / 100) * totalBars)));

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-[calc(100%-2.25rem)] -translate-x-1/2 sm:max-w-lg">
      <div className="rounded-[2rem] border border-border-subtle bg-surface-elevated/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-1 flex items-center justify-between px-1">
          <p className="truncate text-xs font-medium text-text-muted">
            {phase !== "idle" && currentVerseNumber
              ? `Verse ${currentVerseNumber}${phaseLabel ? ` • ${phaseLabel}` : ""}`
              : hasVerses
                ? "Tap play to start"
                : "Select a chapter"}
          </p>
          <p className="text-xs font-medium tabular-nums text-text-muted">
            {formatTime(progress)} / {formatTime(duration)}
          </p>
        </div>

        {/* Waveform */}
        <div className="mb-3 flex h-10 items-end justify-between gap-[3px] px-1">
          {Array.from({ length: totalBars }).map((_, idx) => {
            const baseHeight = 8 + ((idx * 7) % 18);
            const isActive = idx < activeBars;
            return (
              <span
                key={idx}
                className={`block w-[3px] rounded-full transition-colors ${
                  isActive ? "bg-accent" : "bg-border-subtle/60"
                }`}
                style={{ height: `${baseHeight}px` }}
              />
            );
          })}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleAutoNext}
            className={`rounded-full p-2 transition ${
              isAutoNext ? "text-accent bg-accent/10" : "text-text-muted hover:bg-surface hover:text-text-primary"
            }`}
            aria-label={isAutoNext ? "Auto move next enabled" : "Auto move next disabled"}
          >
            <Repeat size={18} />
          </button>

          <button
            onClick={() => {
              if (verses && currentVerseId && playVerse) {
                const idx = verses.findIndex((v) => v.id === currentVerseId);
                if (idx > 0) playVerse(verses[idx - 1]);
              }
            }}
            disabled={!currentVerseId || (verses && verses.findIndex((v) => v.id === currentVerseId) === 0)}
            className="rounded-full p-2 text-text-muted transition hover:bg-surface hover:text-text-primary disabled:opacity-40"
            aria-label="Previous Verse"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          {phase !== "idle" ? (
            <button
              onClick={onTogglePause}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/25 transition hover:bg-accent-dim"
              aria-label={isPlaying ? "Pause" : "Resume"}
            >
              {isPlaying ? (
                <Pause fill="currentColor" size={24} />
              ) : (
                <Play fill="currentColor" size={24} className="ml-1" />
              )}
            </button>
          ) : (
            <button
              onClick={onPlayAll}
              disabled={!hasVerses}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/25 transition hover:bg-accent-dim disabled:opacity-40"
              aria-label="Play all"
            >
              <Play fill="currentColor" size={24} className="ml-1" />
            </button>
          )}

          <button
            onClick={() => {
              if (verses && currentVerseId && playVerse) {
                const idx = verses.findIndex((v) => v.id === currentVerseId);
                if (idx !== -1 && idx + 1 < verses.length) playVerse(verses[idx + 1]);
              }
            }}
            disabled={!currentVerseId || (verses && verses.findIndex((v) => v.id === currentVerseId) === verses.length - 1)}
            className="rounded-full p-2 text-text-muted transition hover:bg-surface hover:text-text-primary disabled:opacity-40"
            aria-label="Next Verse"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          <button
            onClick={onStop}
            className="rounded-full p-2 text-text-muted transition hover:bg-surface hover:text-text-primary"
            aria-label="Stop playback"
          >
            <Square size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
