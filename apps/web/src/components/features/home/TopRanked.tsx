"use client";

import { useEffect, useState } from "react";
import { getTopRatedAnime } from "@/services/anime.service";
import { PremiumRankingCard } from "@/components/premium-card";
import type { Anime } from "@/services/anime.service";

export function TopRanked() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopRatedAnime(1).then((data) => {
      setAnimes(data.slice(0, 10));
      setLoading(false);
    });
  }, []);

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Top Rated</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-[18px] bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))
          : animes.map((anime, i) => (
              <PremiumRankingCard
                key={anime.id}
                anime={{
                  id: anime.id,
                  title: anime.title,
                  poster: anime.poster,
                  cover: anime.cover,
                  rating: anime.rating,
                  episodes: anime.episodes,
                  status: anime.status,
                  type: anime.type,
                }}
                rank={i + 1}
              />
            ))}
      </div>
    </section>
  );
}
