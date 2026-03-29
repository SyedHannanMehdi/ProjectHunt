"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, Sparkles, Tag } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  name: string;
  tagline: string | null;
  slug: string;
  logoUrl: string | null;
  tags: string[];
  techStack: string[];
  category: string | null;
  upvoteCount: number;
  score: number;
}

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    // Cancel previous in-flight request
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/rag/search?q=${encodeURIComponent(q)}&limit=8`,
        { signal: controllerRef.current.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 500);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search projects semantically… e.g. 'AI writing tools built with Next.js'"
          className="w-full rounded-2xl border border-border bg-background pl-12 pr-12 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Sparkles className="w-4 h-4 text-primary/60" />
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="mt-3 space-y-2">
          {results.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No matching projects found. Try a different query.
            </p>
          )}

          {results.map((r) => (
            <Link
              key={r.id}
              href={`/projects/${r.slug}`}
              className="flex items-start gap-3.5 rounded-2xl border border-border bg-background px-4 py-3.5 hover:bg-muted/40 transition-colors group"
            >
              {/* Logo */}
              {r.logoUrl ? (
                <Image
                  src={r.logoUrl}
                  alt={r.name}
                  width={44}
                  height={44}
                  className="rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-base font-bold text-muted-foreground flex-shrink-0">
                  {r.name[0]}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{r.name}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {Math.round(r.score * 100)}% match
                  </span>
                </div>
                {r.tagline && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {r.tagline}
                  </p>
                )}
                {(r.tags.length > 0 || r.techStack.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...r.tags, ...r.techStack].slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
