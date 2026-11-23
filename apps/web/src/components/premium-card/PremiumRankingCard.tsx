"use client";

import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { animeUrl } from "@/lib/slug";
import { PremiumImage } from "./PremiumImage";
import type { PremiumAnime } from "./types";

interface Props {
  anime: PremiumAnime;
  rank: number;
}

const rankColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-zinc-400",
  "from-amber-700 to-amber-800",
];

export function PremiumRankingCard({ anime, rank }: Props) {
  const colorClass = rankColors[rank - 1] || "from-white/10 to-white/5";

  return (
    <Link
      to={animeUrl(anime.id, anime.title)}
      className="group flex items-center gap-4 p-3 rounded-[18px] bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all duration-300 hover:bg-white/[0.05]"
    >
      {/* Rank Number */}
      <div className="relative w-14 shrink-0 text-center">
        <span className={`text-4xl font-black bg-gradient-to-b ${colorClass} bg-clip-text text-transparent`}>
          {rank}
        </span>
        {rank <= 3 && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/60" />
        )}
      </div>

      {/* Poster */}
      <div className="w-[60px] aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-white/[0.06]">
        <div className="relative w-full h-full">
          <PremiumImage
            src={anime.poster || anime.cover}
            alt={anime.title}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors mb-1">
          {anime.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-white/50">
          {anime.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-white/80">{anime.rating.toFixed(1)}</span>
            </span>
          )}
          {anime.episodes && <span>{anime.episodes} eps</span>}
          {anime.type && <span>{anime.type}</span>}
        </div>
      </div>
    </Link>
  );
}
