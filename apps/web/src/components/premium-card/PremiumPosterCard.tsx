"use client";

import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Plus, Heart, Share2, Star, Film, Clock } from "lucide-react";
import { animeUrl } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { PremiumImage } from "./PremiumImage";
import { useLongPress } from "@/hooks/useLongPress";
import { QuickActionSheet } from "./QuickActionSheet";
import type { PremiumAnime } from "./types";

interface Props {
  anime: PremiumAnime;
  className?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  MOVIE: "MOVIE",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "SPECIAL",
};

function formatCount(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}

function formatDuration(dur: string | undefined): string {
  if (!dur) return "";
  const n = parseInt(dur);
  if (!isNaN(n)) return n + "m";
  return dur;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function PremiumPosterCard({ anime, className }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setSheetOpen(true),
    duration: 500,
  });

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleAddToList = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ url: window.location.origin + animeUrl(anime.id, anime.title) });
    }
  }, [anime.id, anime.title]);

  const formatLabel = FORMAT_LABELS[anime.type || ""] || anime.type || "TV";
  const desc = anime.description ? stripHtml(anime.description) : null;
  const truncatedDesc = desc && desc.length > 150 ? desc.slice(0, 150) + "..." : desc;
  const seasonLabel = anime.season && anime.year
    ? `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}`
    : anime.year
      ? String(anime.year)
      : null;

  return (
    <>
      <div
        className={cn(
          "group/card relative w-full z-0 hover:z-50",
          className
        )}
        {...longPressHandlers}
      >
        <Link
          to={animeUrl(anime.id, anime.title)}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[20px]"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            if ((e.target as HTMLElement).closest("button")) e.preventDefault();
          }}
        >
          {/* Poster Container */}
          <div
            className={cn(
              "relative aspect-[2/3] rounded-[20px] overflow-hidden",
              "bg-white/[0.03] border border-white/[0.06]",
              "transition-all duration-200 ease-out",
              "group-hover/card:lg:scale-[1.03]",
              "group-hover/card:lg:shadow-2xl group-hover/card:lg:shadow-primary/10",
              "group-hover/card:lg:border-primary/30"
            )}
          >
            <PremiumImage
              src={anime.poster || anime.cover}
              alt={anime.title}
            />

            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

            {/* Score Badge - Top Left */}
            {anime.rating && (
              <div className="absolute top-2 left-2 z-10">
                <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/[0.08]">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-bold text-white drop-shadow-sm">
                    {anime.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Format Badge - Top Right */}
            <div className="absolute top-2 right-2 z-10">
              <span className="px-1.5 py-1 rounded-lg text-[10px] font-bold bg-black/50 backdrop-blur-md border border-white/[0.08] text-white/90">
                {formatLabel}
              </span>
            </div>

            {/* Bottom Meta Bar - Always visible */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              {/* Expanded Hover Panel - slides up on hover */}
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                "max-h-0 opacity-0",
                "lg:group-hover/card:max-h-[220px] lg:group-hover/card:opacity-100"
              )}>
                <div className="px-2.5 pt-2.5 pb-1 space-y-2 bg-gradient-to-t from-black/95 to-black/60">
                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-1">
                    {anime.hasSub && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                        SUB
                      </span>
                    )}
                    {anime.hasDub && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        DUB
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/20">
                      1080P
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.08] text-white/70 border border-white/[0.06]">
                      HD
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.08] text-white/70 border border-white/[0.06]">
                      CC
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <h4 className="text-[12px] font-bold text-white leading-tight line-clamp-1">
                      {anime.title}
                    </h4>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {anime.status === "ONGOING" ? "Airing" : anime.status === "COMPLETED" ? "Finished" : "Upcoming"}
                      {seasonLabel && ` · ${seasonLabel}`}
                      {anime.episodes && ` · ${anime.episodes} Episodes`}
                    </p>
                  </div>

                  {/* Genres */}
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {anime.genres.slice(0, 3).map((g) => (
                        <span key={g} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-white/[0.06] text-white/60 border border-white/[0.04]">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {truncatedDesc && (
                    <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2">
                      {truncatedDesc}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 pt-0.5">
                    <span className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary/90 text-white text-[10px] font-semibold">
                      <Play className="w-3 h-3 fill-white" />
                      Watch Now
                    </span>
                    <button
                      onClick={handleAddToList}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors border border-white/[0.06]"
                    >
                      <Plus className="w-3 h-3 text-white/70" />
                    </button>
                    <button
                      onClick={handleFavorite}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors border border-white/[0.06]"
                    >
                      <Heart className="w-3 h-3 text-white/70" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors border border-white/[0.06]"
                    >
                      <Share2 className="w-3 h-3 text-white/70" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta Bar */}
              <div className="flex items-center gap-2.5 px-2.5 py-2 bg-gradient-to-t from-black/90 to-black/40 text-[10px] text-white/60">
                {anime.episodes && (
                  <span className="flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    {anime.episodes}
                  </span>
                )}
                {anime.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(anime.duration)}
                  </span>
                )}
                {anime.popularity && (
                  <span className="flex items-center gap-1 ml-auto">
                    <Heart className="w-3 h-3" />
                    {formatCount(anime.popularity)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Mobile Quick Actions */}
      <QuickActionSheet
        anime={anime}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
