import { useApi } from "./useApi";
import type {
  Scripture,
  ScriptureDetail,
  Chapter,
  PaginatedVerses,
} from "../types/scripture";

export function useScriptures() {
  return useApi<Scripture[]>("/api/scriptures/");
}

export function useScripture(slug: string | undefined) {
  return useApi<ScriptureDetail>(slug ? `/api/scriptures/${slug}` : null);
}

export function useChapters(slug: string | undefined) {
  return useApi<Chapter[]>(slug ? `/api/scriptures/${slug}/chapters` : null);
}

export function useVerses(
  slug: string | undefined,
  chapterNum: number | undefined,
  page = 1,
  perPage = 50,
) {
  const path =
    slug && chapterNum
      ? `/api/scriptures/${slug}/chapters/${chapterNum}/verses?page=${page}&per_page=${perPage}`
      : null;
  return useApi<PaginatedVerses>(path);
}
