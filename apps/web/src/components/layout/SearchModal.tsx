"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Star, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { searchAnime, type Anime } from "@/services/anime.service";

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        useUIStore.getState().openSearch();
      }
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return setResults([]);
    setLoading(true);
    try {
      const data = await searchAnime(q, 1);
      setResults(data.animes.slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void doSearch(value), 250);
  };

  const goToAnime = (anime: Anime) => {
    navigate({
      to: "/info/$id/$slug",
      params: { id: anime.id, slug: anime.title.toLowerCase().replace(/\s+/g, "-") },
      search: { page: "1" },
    });
    closeSearch();
  };

  const goToResults = () => {
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim(), page: 1 } });
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) {
      if (e.key === "Enter" && query.trim()) goToResults();
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) goToAnime(results[selectedIndex]);
        else goToResults();
        break;
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div className="mx-auto mt-[12vh] w-[min(600px,92vw)]">
        <div className="rounded-2xl bg-popover border border-border shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search anime..."
              className="w-full h-14 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
            />
            <button
              onClick={closeSearch}
              className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground shrink-0"
            >
              ESC
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Searching…
              </div>
            )}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for “{query}”
              </div>
            )}
            {results.map((anime, index) => (
              <button
                key={anime.id}
                onClick={() => goToAnime(anime)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
                  index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <div className="w-10 h-14 rounded overflow-hidden shrink-0 bg-muted ring-1 ring-border">
                  {anime.poster && (
                    <img src={anime.poster} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {anime.title}
                  </p>
                  {anime.titleEnglish && anime.titleEnglish !== anime.title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {anime.titleEnglish}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {!!anime.rating && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-custom">
                        <Star size={11} fill="currentColor" />
                        {anime.rating}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {anime.type || "TV"}
                      {anime.episodes ? ` • ${anime.episodes} eps` : ""}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            {!query.trim() && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Search</span> across Soraku's
                anime library · press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">/</kbd> anytime
              </div>
            )}
            {query.trim() && results.length > 0 && (
              <button
                onClick={goToResults}
                className="w-full px-4 py-3 text-sm font-medium text-center border-t border-border text-foreground hover:bg-muted transition-colors"
              >
                View all results for “{query}” →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}