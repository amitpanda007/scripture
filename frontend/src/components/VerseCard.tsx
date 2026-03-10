import type { Verse } from "../types/scripture";
import type { PlayPhase } from "../hooks/useAudioPlayer";
import { Play, Pause } from "lucide-react";

interface Props {
  verse: Verse;
  isActive: boolean;
  isPlaying: boolean;
  phase: PlayPhase;
  onPlay: (verse: Verse) => void;
  onTogglePause: () => void;
}

export function VerseCard({ verse, isActive, isPlaying, phase, onPlay, onTogglePause }: Props) {
  const scriptureHighlight = isActive && phase === "scripture";
  const meaningHighlight = isActive && phase === "meaning";

  return (
    <article
      id={`verse-${verse.id}`}
      className={`
        group relative rounded-2xl border transition-all duration-500 ease-out overflow-hidden
        ${
          isActive
            ? "border-accent/40 bg-accent-glow shadow-lg shadow-accent/5 scale-[1.01]"
            : "border-border-subtle bg-surface-elevated hover:border-accent/20 hover:bg-surface-hover"
        }
      `}
    >
      {/* Top Header Row with Number and Play */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <span className="inline-flex items-center justify-center rounded-full bg-surface text-text-secondary text-xs font-semibold px-3 py-1 border border-border-subtle">
          Verse {verse.verse_number}
        </span>
        <button
          onClick={() => {
            if (isActive) {
              onTogglePause();
            } else {
              onPlay(verse);
            }
          }}
          className={`
            flex h-8 w-8 items-center justify-center rounded-full
            text-sm font-semibold transition-all duration-300
            ${
              isActive
                ? "bg-accent text-surface shadow-md shadow-accent/30"
                : "bg-surface-hover text-text-secondary hover:bg-accent/20 hover:text-accent"
            }
          `}
          title={isActive && isPlaying ? "Pause" : `Play verse ${verse.verse_number}`}
          aria-label={isActive && isPlaying ? "Pause" : `Play verse ${verse.verse_number}`}
        >
          {isActive && isPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4">
        {/* Sanskrit verse */}
        <div
          className={`
            rounded-xl px-4 py-3 transition-all duration-500
            ${scriptureHighlight ? "bg-highlight-verse ring-1 ring-accent/30" : ""}
          `}
        >
          <p className="font-devanagari text-lg leading-relaxed whitespace-pre-line text-text-primary sm:text-xl">
            {verse.original_text}
          </p>
        </div>

        {/* Transliteration */}
        {verse.transliteration && (
          <p className="px-4 text-sm leading-relaxed whitespace-pre-line text-text-muted italic">
            {verse.transliteration}
          </p>
        )}

        {/* Hindi meaning */}
        <div
          className={`
            rounded-xl px-4 py-3 transition-all duration-500
            ${meaningHighlight ? "bg-highlight-meaning ring-1 ring-gold/30" : ""}
          `}
        >
          <p className="font-devanagari leading-relaxed text-text-secondary">
            {verse.hindi_meaning}
          </p>
        </div>
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute bottom-0 left-6 right-6 h-0.5 overflow-hidden rounded-full bg-border-subtle">
          <div
            className={`h-full rounded-full transition-colors duration-300 ${
              phase === "scripture" ? "bg-accent" : "bg-gold"
            }`}
            style={{ width: "100%", animation: "pulse 1.5s ease-in-out infinite" }}
          />
        </div>
      )}
    </article>
  );
}
