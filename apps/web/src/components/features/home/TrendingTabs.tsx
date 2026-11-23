import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPopularAnime,
  getRecentAnime,
  getTopRatedAnime,
  type Anime,
} from "@/services/anime.service";
import { PrimaryCard, PrimaryCardSkeleton } from "./PrimaryCard";

const PER_PAGE = 15;

type TabKey = "newest" | "popular" | "top-rated";

interface TabDef {
  key: TabKey;
  label: string;
}

function makeTabs(): TabDef[] {
  return [
    { key: "newest", label: "Newest" },
    { key: "popular", label: "Popular" },
    { key: "top-rated", label: "Top Rate" },
  ];
}

function fetchTabItems(tab: TabKey, page: number, year: number): Promise<Anime[]> {
  switch (tab) {
    case "popular":
      return getPopularAnime(page, year);
    case "top-rated":
      return getTopRatedAnime(page, year);
    case "newest":
    default:
      return getRecentAnime(page);
  }
}

export function TrendingTabs() {
  const year = new Date().getFullYear();
  const tabs = makeTabs();
  const [active, setActive] = useState<TabKey>("newest");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (tab: TabKey, p: number) => {
      setLoading(true);
      fetchTabItems(tab, p, year)
        .then((data) => setItems(data.slice(0, PER_PAGE)))
        .finally(() => setLoading(false));
    },
    [year]
  );

  useEffect(() => {
    load(active, page);
  }, [active, page, load]);

  const selectTab = (tab: TabKey) => {
    if (tab === active) return;
    setActive(tab);
    setPage(1);
  };

  const next = () => setPage((p) => p + 1);
  const prev = () => setPage((p) => Math.max(1, p - 1));

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-stretch rounded-lg overflow-hidden ring-1 ring-white/10 bg-muted shrink-0">
          {tabs.map((tab, i) => {
            const selected = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => selectTab(tab.key)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                  i > 0 && "border-l border-white/10",
                  selected
                    ? "bg-pink-500 text-black font-bold shadow-lg shadow-pink-500/25"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prev}
            disabled={page <= 1}
            aria-label="Previous page"
            className="w-8 h-8 rounded-md flex-center bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-8 h-8 px-2 rounded-md flex-center bg-muted text-foreground text-sm font-bold">
            {page}
          </span>
          <button
            onClick={next}
            disabled={loading || items.length < PER_PAGE}
            aria-label="Next page"
            className="w-8 h-8 rounded-md flex-center bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <PrimaryCardSkeleton key={i} />)
          : items.map((anime, i) => <PrimaryCard key={anime.id} anime={anime} index={i} />)}
      </div>
    </section>
  );
}