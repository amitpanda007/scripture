import { useCallback, useEffect, useRef, useState } from "react";
import type { Verse } from "../types/scripture";
import { resolveBackendUrl } from "../config/env";

export type PlayPhase = "idle" | "scripture" | "meaning";

interface PlayerState {
  isPlaying: boolean;
  currentVerseId: number | null;
  phase: PlayPhase;
  progress: number;
  duration: number;
  isAutoNext: boolean;
}

export function useAudioPlayer(verses: Verse[], scriptureSlug?: string, chapterNum?: number) {
  const [state, setState] = useState<PlayerState>(() => {
    try {
      const saved = localStorage.getItem("scripture_playback");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.scriptureSlug === scriptureSlug &&
          parsed.chapterNum === chapterNum &&
          parsed.verseId
        ) {
          return {
            isPlaying: false,
            currentVerseId: parsed.verseId,
            phase: parsed.phase || "idle",
            progress: parsed.progress || 0,
            duration: 0,
            isAutoNext: parsed.isAutoNext ?? true,
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      isPlaying: false,
      currentVerseId: null,
      phase: "idle",
      progress: 0,
      duration: 0,
      isAutoNext: true,
    };
  });

  const isAutoNextRef = useRef(state.isAutoNext);
  isAutoNextRef.current = state.isAutoNext;

  const currentPlayId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const versesRef = useRef(verses);
  versesRef.current = verses;

  const rafRef = useRef<number>(0);
  const setPlaybackState = useCallback((value: MediaSessionPlaybackState) => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = value;
    }
  }, []);

  const currentBlobUrlRef = useRef<string | null>(null);

  const clearAudioSource = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearAudioSource();
      setPlaybackState("none");
    };
  }, [clearAudioSource, setPlaybackState]);

  const trackProgress = useCallback(function track() {
    const audio = audioRef.current;
    if (!audio) return;
    setState((s) => {
      const newState = {
        ...s,
        progress: audio.currentTime,
        duration: audio.duration || 0,
      };
      if (s.currentVerseId && scriptureSlug && chapterNum) {
        try {
          localStorage.setItem("scripture_playback", JSON.stringify({
            verseId: s.currentVerseId,
            phase: s.phase,
            progress: audio.currentTime,
            scriptureSlug,
            chapterNum,
            isAutoNext: s.isAutoNext,
          }));
        } catch {
          // ignore
        }
      }
      return newState;
    });
    if (!audio.paused) {
      rafRef.current = requestAnimationFrame(track);
    }
  }, [scriptureSlug, chapterNum]);

  const playAudioUrl = useCallback(
    (url: string, startFrom: number = 0, id: number): Promise<void> =>
      new Promise(async (resolve, reject) => {
        const audio = audioRef.current;
        if (!audio) return reject(new Error("No audio element"));

        let blobUrl: string | null = null;

        const onEnded = () => {
          cleanup();
          if (currentPlayId.current === id) resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("Audio failed to load"));
        };

        function cleanup() {
          audio!.removeEventListener("ended", onEnded);
          audio!.removeEventListener("error", onError);
          cancelAnimationFrame(rafRef.current);
        }

        try {
          const res = await fetch(resolveBackendUrl(url), {
            headers: { "X-Scripture-App-Audio": "true" },
          });
          if (!res.ok) throw new Error("Audio fetch failed");
          const blob = await res.blob();
          
          if (currentPlayId.current !== id) return; // Prevent playing if skipped during fetch
          
          blobUrl = URL.createObjectURL(blob);
          if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
          }
          currentBlobUrlRef.current = blobUrl;
          
          audio.src = blobUrl;
          audio.currentTime = startFrom;
        } catch (err) {
          return reject(err);
        }

        audio.addEventListener("ended", onEnded, { once: true });
        audio.addEventListener("error", onError, { once: true });

        audio.play().then(() => {
          if (currentPlayId.current === id) trackProgress();
        }).catch(() => {
          cleanup();
          reject(new Error("Playback blocked or failed"));
        });
        setPlaybackState("playing");
      }),
    [trackProgress, setPlaybackState],
  );

  const playTTS = useCallback(
    (text: string, lang: string = "hi-IN", id: number): Promise<void> =>
      new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          return resolve();
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;

        const durationEst = text.length * 70;
        const startTime = Date.now();
        
        const trackTTS = () => {
          if (!window.speechSynthesis.speaking) return;
          const elapsed = (Date.now() - startTime) / 1000;
          setState((s) => ({
            ...s,
            progress: elapsed,
            duration: durationEst / 1000,
          }));
          rafRef.current = requestAnimationFrame(trackTTS);
        };
        
        rafRef.current = requestAnimationFrame(trackTTS);

        utterance.onend = () => {
          cancelAnimationFrame(rafRef.current);
          setPlaybackState("none");
          if (currentPlayId.current === id) resolve();
        };

        utterance.onerror = () => {
          cancelAnimationFrame(rafRef.current);
          setPlaybackState("none");
          resolve(); 
        };

        window.speechSynthesis.speak(utterance);
        setPlaybackState("playing");
      }),
    [setPlaybackState]
  );

  const playVerse = useCallback(
    async (verse: Verse, startPhase: PlayPhase = "scripture", startProgress: number = 0, forcePlayAll: boolean = false) => {
      const id = ++currentPlayId.current;
      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      cancelAnimationFrame(rafRef.current);

      let currentPhase = startPhase;

      if (currentPhase === "scripture") {
        setState((s) => ({
          ...s,
          isPlaying: true,
          currentVerseId: verse.id,
          phase: "scripture",
          progress: startProgress,
          duration: 0,
        }));

        if (verse.scripture_audio_url) {
          try {
            await playAudioUrl(verse.scripture_audio_url, startProgress, id);
          } catch {
            if (currentPlayId.current !== id) return;
            if (verse.original_text) await playTTS(verse.original_text, "hi-IN", id);
          }
        } else if (verse.original_text) {
          await playTTS(verse.original_text, "hi-IN", id);
        }
        
        if (currentPlayId.current !== id) return;
        currentPhase = "meaning";
        startProgress = 0; // reset for the next phase
      }

      if (currentPhase === "meaning") {
        setState((s) => ({ ...s, phase: "meaning", progress: startProgress, duration: 0 }));

        if (verse.meaning_audio_url) {
          try {
            await playAudioUrl(verse.meaning_audio_url, startProgress, id);
          } catch {
            if (currentPlayId.current !== id) return;
            if (verse.hindi_meaning) await playTTS(verse.hindi_meaning, "hi-IN", id);
          }
        } else if (verse.hindi_meaning) {
          await playTTS(verse.hindi_meaning, "hi-IN", id);
        }
      }

      if (currentPlayId.current !== id) return;

      if (isAutoNextRef.current || forcePlayAll) {
        const list = versesRef.current;
        const idx = list.findIndex(v => v.id === verse.id);
        if (idx !== -1 && idx + 1 < list.length) {
          playVerse(list[idx + 1], "scripture", 0, forcePlayAll);
          return;
        }
      }

      clearAudioSource();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlaybackState("none");

      setState((s) => {
        const newState = {
          ...s,
          phase: "idle" as PlayPhase,
          isPlaying: false,
          progress: 0,
          duration: 0,
        };
        try {
          localStorage.removeItem("scripture_playback");
        } catch {
          // ignore
        }
        return newState;
      });
    },
    [playAudioUrl, playTTS, clearAudioSource, setPlaybackState],
  );

  const playAll = useCallback(
    async (startIndex = 0) => {
      const list = versesRef.current;
      if (startIndex >= 0 && startIndex < list.length) {
        playVerse(list[startIndex], "scripture", 0, true);
      }
    },
    [playVerse],
  );

  const stop = useCallback(() => {
    currentPlayId.current++;
    clearAudioSource();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaybackState("none");
    cancelAnimationFrame(rafRef.current);
    setState((s) => ({
      ...s,
      isPlaying: false,
      currentVerseId: null,
      phase: "idle",
      progress: 0,
      duration: 0,
    }));
  }, [clearAudioSource, setPlaybackState]);

  const toggleAutoNext = useCallback(() => {
    setState((s) => {
      const newVal = !s.isAutoNext;
      isAutoNextRef.current = newVal;
      if (s.currentVerseId && scriptureSlug && chapterNum) {
        try {
          localStorage.setItem("scripture_playback", JSON.stringify({
            verseId: s.currentVerseId,
            phase: s.phase,
            progress: s.progress,
            scriptureSlug,
            chapterNum,
            isAutoNext: newVal,
          }));
        } catch {}
      }
      return { ...s, isAutoNext: newVal };
    });
  }, [scriptureSlug, chapterNum]);

  const togglePause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlaybackState("playing");
        setState((s) => ({ ...s, isPlaying: true }));
      } else {
        window.speechSynthesis.pause();
        setPlaybackState("paused");
        setState((s) => ({ ...s, isPlaying: false }));
      }
      return;
    }

    if (!audio.src && state.currentVerseId && state.phase !== "idle") {
      const verseToPlay = versesRef.current.find(v => v.id === state.currentVerseId);
      if (verseToPlay) {
        await playVerse(verseToPlay, state.phase, state.progress);
        return;
      }
    }

    if (audio.paused && audio.src) {
      audio.play().then(() => trackProgress()).catch(() => {});
      setPlaybackState("playing");
      setState((s) => ({ ...s, isPlaying: true }));
    } else if (!audio.paused) {
      audio.pause();
      setPlaybackState("paused");
      cancelAnimationFrame(rafRef.current);
      setState((s) => ({ ...s, isPlaying: false }));
    }
  }, [trackProgress, playVerse, setPlaybackState, state]);

  return { ...state, playVerse, playAll, stop, togglePause, toggleAutoNext };
}
