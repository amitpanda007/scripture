import { useCallback, useEffect, useRef, useState } from "react";
import { resolveApiPath } from "../config/env";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: !!path,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    if (!path) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(resolveApiPath(path), {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!controller.signal.aborted) {
        setState({ data: json, loading: false, error: null });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [path]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  return { ...state, refetch };
}
