const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8002";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export function resolveBackendUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
