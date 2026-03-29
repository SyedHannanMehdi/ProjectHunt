"use client";

import { useState, ChangeEvent } from "react";
import { Search, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface SearchResult {
  project: Project;
  score: number;
}

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/rag/search?q=${encodeURIComponent(query)}&limit=5`
      );

      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search projects semantically..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </div>

      {error && (
        <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(({ project, score }) => (
            <div
              key={project.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <span className="text-xs text-gray-500 shrink-0">
                  {(score * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{project.description}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <p className="text-center text-gray-500 py-4">No results found.</p>
      )}
    </div>
  );
}
