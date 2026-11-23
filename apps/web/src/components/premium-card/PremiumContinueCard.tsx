"use client";

import { Link } from "@tanstack/react-router";
import { Play, Clock } from "lucide-react";
import { animeUrl } from "@/lib/slug";
import { PremiumImage } from "./PremiumImage";
import type { PremiumAnime } from "./types";

interface Props {
  anime: PremiumAnime;
  progress?: number;
}

export function PremiumContinueCard({ anime, progress = 35 }: Props) {
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Resume button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.08]">
          <div
            className="h-full bg-primary rounded-r-full transition-all duration-500 group-hover:brightness-110"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
          {anime.title}
        </h3>
        <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {progress < 100 ? `${Math.round((100 - progress) * 1.2)}m remaining` : "Completed"}
        </p>
      </div>
    </Link>
  );
}
