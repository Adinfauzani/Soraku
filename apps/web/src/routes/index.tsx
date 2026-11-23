import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { Spotlight } from "@/components/features/home/Spotlight";
import { Section } from "@/components/features/home/Section";
import { TopPopular } from "@/components/features/home/TopPopular";
import { HotCard, SkeletonHotCard } from "@/components/features/home/AnimeCards";
import { PrimaryCard, PrimaryCardSkeleton } from "@/components/features/home/PrimaryCard";
import { TrendingTabs } from "@/components/features/home/TrendingTabs";
import { TopTenPanel, TrendingPosts, SidebarGenreList } from "@/components/features/home/HomeSidebar";
import { Footer } from "@/components/layout/Footer";
import {
  getTrendingAnime,
  getPopularAnime,
  getTopRatedAnime,
  getAiringAnime,
} from "@/services/anime.service";
import type { Anime } from "@/services/anime.service";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function Row({ items, loading, title, seeAll }: { items: Anime[]; loading: boolean; title: string; seeAll: string }) {
  return (
    <Section title={title} seeAllLink={seeAll} seeAllLabel="See all">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <PrimaryCardSkeleton key={i} />)
          : items.slice(0, 10).map((anime, i) => (
              <PrimaryCard key={anime.id} anime={anime} index={i} />
            ))}
      </div>
    </Section>
  );
}

function HotRightNow({ items, loading }: { items: Anime[]; loading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.85 : el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <Section title="Hot Right Now" seeAllLink="/trending" seeAllLabel="See all">
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex-center bg-card/90 backdrop-blur-sm ring-1 ring-border text-foreground opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonHotCard key={i} className="snap-start shrink-0" />)
            : items.map((anime, i) => (
                <div key={anime.id} className="snap-start shrink-0">
                  <HotCard anime={anime} index={i} />
                </div>
              ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex-center bg-card/90 backdrop-blur-sm ring-1 ring-border text-foreground opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </Section>
  );
}

function HomePage() {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [airing, setAiring] = useState<Anime[]>([]);
  const [airingLoading, setAiringLoading] = useState(true);

  useEffect(() => {
    getTrendingAnime(1).then((data) => {
      setTrending(data);
      setTrendingLoading(false);
    });
    getPopularAnime(1).then((data) => {
      setPopular(data);
      setPopularLoading(false);
    });
    getTopRatedAnime(1).then((data) => {
      setTopRated(data);
      setTopRatedLoading(false);
    });
    getAiringAnime(1).then((data) => {
      setAiring(data.slice(0, 16));
      setAiringLoading(false);
    });
  }, []);

  const movies = Array.from(
    new Map(
      [...trending, ...popular, ...topRated]
        .filter((a) => a.type && a.type.toUpperCase() === "MOVIE")
        .map((a) => [a.id, a])
    ).values()
  ).slice(0, 12);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        <Spotlight anime={trending} isLoading={trendingLoading} />
        <HotRightNow items={trending.filter(Boolean)} loading={trendingLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
          {/* Main column */}
          <div className="space-y-12 min-w-0">
            <TrendingTabs />
            <Row title="Trending Now" items={trending.filter(Boolean)} loading={trendingLoading} seeAll="/discover" />

            <TopPopular anime={popular.filter(Boolean)} />

            <Row title="All Time Popular" items={topRated.filter(Boolean)} loading={topRatedLoading} seeAll="/discover" />

            <Row title="Airing" items={airing} loading={airingLoading} seeAll="/discover" />

            {movies.length > 0 && <Row title="Movies" items={movies} loading={false} seeAll="/discover" />}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-6">
            <TopTenPanel anime={topRated.filter(Boolean)} />
            <TrendingPosts />
            <SidebarGenreList />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}