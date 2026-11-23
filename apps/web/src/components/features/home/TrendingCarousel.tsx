"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PremiumPosterCard, PremiumCardSkeleton } from "@/components/premium-card";
import { getTrendingAnime } from "@/services/anime.service";
import type { Anime } from "@/services/anime.service";

export function TrendingCarousel() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTrendingAnime(1).then((data) => {
      setAnimeList(data);
      setLoading(false);
    });
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Trending Now</h2>
        </div>
        <Link
          to="/trending"
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[160px] sm:w-[200px] lg:w-[220px]"><PremiumCardSkeleton /></div>
          ))}
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-white/[0.06] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -ml-4"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-2 snap-x snap-mandatory"
          >
            {animeList.map((anime, i) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="shrink-0 snap-start w-[160px] sm:w-[200px] lg:w-[220px]"
              >
                <PremiumPosterCard
                  anime={{
                    id: anime.id,
                    title: anime.title,
                    titleEnglish: anime.titleEnglish,
                    titleNative: anime.titleNative,
                    poster: anime.poster,
                    cover: anime.cover,
                    description: anime.description,
                    rating: anime.rating,
                    episodes: anime.episodes,
                    totalEpisodes: anime.totalEpisodes,
                    status: anime.status,
                    year: anime.year,
                    duration: anime.duration,
                    genres: anime.genres,
                    studios: anime.studios,
                    type: anime.type,
                    season: anime.season,
                    hasSub: anime.hasSub,
                    hasDub: anime.hasDub,
                  }}
                />
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-white/[0.06] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -mr-4"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      )}
    </section>
  );
}
