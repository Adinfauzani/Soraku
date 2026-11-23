"use client";

import { Link } from "@tanstack/react-router";
import { Play, Clock, Star } from "lucide-react";
import { animeUrl } from "@/lib/slug";
import { PremiumImage } from "./PremiumImage";
import type { PremiumAnime } from "./types";

interface Props {
  anime: PremiumAnime;
}

export function PremiumEpisodeCard({ anime }: Props) {
  return (
    <Link
      to={animeUrl(anime.id, anime.title)}
      className="group relative rounded-[18px] overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-video overflow-hidden bg-white/[0.06]">
        <PremiumImage
          src={anime.poster || anime.cover}
          alt={anime.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Episode Number Badge */}
        <div className="absolute top-2 left-2 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-lg">
          EP {anime.episodes || "?"}
        </div>

        {/* Sub/Dub Badge */}
        <div className="absolute top-2 right-2 flex gap-1">
          {anime.hasSub && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              SUB
            </span>
          )}
          {anime.hasDub && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
              DUB
            </span>
          )}
        </div>

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
          {anime.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-white/50">
          {anime.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.rating.toFixed(1)}
            </span>
          )}
          {anime.type && (
            <>
              <span className="text-white/30">•</span>
              <span>{anime.type}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}


