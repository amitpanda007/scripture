import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { ErrorBanner } from "../components/ErrorBanner";
import { Spinner } from "../components/Spinner";
import { useScriptures } from "../hooks/useScriptures";
import { resolveBackendUrl } from "../config/env";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const { data: scriptures, loading, error, refetch } = useScriptures();

  const filtered = useMemo(() => {
    if (!scriptures) return [];
    const q = query.trim().toLowerCase();
    if (!q) return scriptures;
    return scriptures.filter((item) =>
      `${item.name} ${item.description ?? ""} ${item.language}`.toLowerCase().includes(q),
    );
  }, [scriptures, query]);

  return (
    <div className="px-6 pb-28 max-w-4xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-text-primary">Search Scriptures</h1>
        <p className="text-sm text-text-muted">Find scriptures quickly by title or language.</p>
      </div>

      <label className="mb-6 flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3">
        <Search size={18} className="text-text-muted" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </label>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.map((item) => {
            const posterSrc = item.poster_url ? resolveBackendUrl(item.poster_url) : null;
            return (
              <Link
                key={item.id}
                to={`/${item.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-3 hover:border-accent/30"
              >
                {posterSrc ? (
                  <img src={posterSrc} alt={item.name} className="h-16 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-12 rounded-lg bg-surface-hover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {item.language} · {item.total_chapters} chapters
                  </p>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="rounded-xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-muted">
              No scriptures found for "{query}".
            </p>
          )}
        </div>
      )}
    </div>
  );
}
