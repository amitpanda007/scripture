export function resolveApiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    throw new Error("Absolute API URLs are not allowed. Use a relative API path.");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/api" || normalized.startsWith("/api/")) return normalized;
  return `/api${normalized}`;
}

export function resolveBackendUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
