"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Clock, Play, Tv } from "lucide-react";
import type { Anime } from "@/services/anime.service";
import { cn } from "@/lib/utils";
import { titleFor } from "@/lib/anime-meta";
import { animeUrl, watchUrl } from "@/lib/slug";

const AUTOPLAY_MS = 6000;
const ACCENT = "bg-pink-500";

interface SpotlightItem {
  id: string;
  rank: number;
  title: string;
  backdrop?: string;
  type?: string;
  duration?: string;
  aired?: string;
  quality: string;
  episode?: number | null;
  synopsis?: string;
  watchUrl: string;
  detailUrl: string;
}

interface SpotlightProps {
  anime: Anime[];
  isLoading?: boolean;
}

function cleanSynopsis(desc?: string): string {
  return (desc || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAired(anime: Anime): string | undefined {
  if (anime.releaseDate) {
    const date = new Date(anime.releaseDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
  }
  return anime.year != null ? String(anime.year) : undefined;
}

function toSpotlightItems(anime: Anime[]): SpotlightItem[] {
  return anime.filter(Boolean).map((a, i) => {
    const title = titleFor(a) || a.title;
    return {
      id: a.id,
      rank: i + 1,
      title,
      backdrop: a.banner || a.cover || a.image || a.poster || undefined,
      type: a.type,
      duration: a.duration,
      aired: formatAired(a),
      quality: "HD",
      episode: a.episodes ?? a.totalEpisodes ?? undefined,
      synopsis: cleanSynopsis(a.description),
      watchUrl: watchUrl(a.id, title),
      detailUrl: animeUrl(a.id, title),
    };
  });
}

function SpotlightSkeleton() {
  return (
    <section className="relative h-auto md:h-[480px] w-full overflow-hidden rounded-2xl bg-card border border-border">
      <div className="absolute inset-x-0 top-0 h-[42%] md:h-full skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
      <div className="relative z-10 flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-12 py-6 md:min-h-[480px] md:py-16 max-w-[46%]">
        <div className="h-3.5 w-28 rounded-full skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
        <div className="mt-4 h-8 md:h-9 w-64 md:w-80 rounded-lg skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
        <div className="mt-3 flex items-center gap-2">
          <div className="h-4 w-24 rounded skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
          <div className="h-4 w-16 rounded skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
          <div className="h-4 w-20 rounded skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-80 max-w-full rounded skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
          <div className="h-3 w-72 max-w-full rounded skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
          <div className="h-3 w-64 max-w-full rounded skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
        </div>
        <div className="mt-6 flex gap-2.5">
          <div className="h-10 w-32 rounded-lg skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
          <div className="h-10 w-24 rounded-lg skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
        </div>
      </div>
    </section>
  );
}

export function Spotlight({ anime, isLoading = false }: SpotlightProps) {
  const items = toSpotlightItems(anime);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: false },
    [Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: true })]
  );

  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (isLoading || items.length === 0) return <SpotlightSkeleton />;

  return (
    <section
      className="relative h-auto md:h-[480px] w-full overflow-hidden rounded-2xl bg-card border border-border group"
      onMouseEnter={() => emblaApi?.plugins()?.autoplay?.stop()}
      onMouseLeave={() => emblaApi?.plugins()?.autoplay?.play()}
    >
      {/* Crossfading background artwork */}
      <div className="absolute inset-x-0 top-0 h-[42%] md:h-full">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out",
              selected === i ? "opacity-100" : "opacity-0"
            )}
          >
            {item.backdrop && (
              <img
                src={item.backdrop}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-right"
              />
            )}
            {/* Layer 1: dark left → transparent right (text readability) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/75 to-transparent" />
            {/* Mobile: blend artwork into the content below */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent md:hidden" />
            {/* Layer 2: subtle unify overlay */}
            <div className="absolute inset-0 bg-black/35" />
          </div>
        ))}
      </div>

      {/* Embla viewport (content only) */}
      <div ref={emblaRef} className="relative md:h-[480px]">
        <div className="flex">
          {items.map((item) => (
            <div key={item.id} className="relative flex-[0_0_100%] min-w-0">
              <div className="flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-12 pb-16 pt-4 md:min-h-[480px] md:py-20 md:w-[46%] max-w-xl">
                <h1 className="text-2xl sm:text-3xl md:text-[30px] font-bold text-white leading-tight line-clamp-2">
                  {item.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-white/70">
                  {item.type && (
                    <span className="inline-flex items-center gap-1.5">
                      <Tv className="w-4 h-4" />
                      {item.type}
                    </span>
                  )}
                  {item.duration && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {item.duration}
                    </span>
                  )}
                  {item.aired && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {item.aired}
                    </span>
                  )}
                  <span className="ml-1 inline-flex items-center gap-1">
                    <span className="rounded-md bg-white/10 text-white/85 text-[11px] font-bold px-2 py-0.5">
                      {item.quality}
                    </span>
                    {item.episode != null && (
                      <span className="rounded-md bg-white/10 text-white/85 text-[11px] font-bold px-2 py-0.5">
                        EP {item.episode}
                      </span>
                    )}
                  </span>
                </div>

                {item.synopsis && (
                  <p className="mt-4 text-[13px] md:text-sm text-white/60 leading-[1.6] max-w-[500px] line-clamp-3">
                    {item.synopsis}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-2.5">
                  <Link
                    to="/watch/$id/$"
                    params={{ id: item.id, _splat: item.title.replace(/\s+/g, "-").toLowerCase() }}
                    search={{ ep: 1 }}
                    className={cn(
                      "inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-bold text-black",
                      ACCENT,
                      "hover:brightness-110 active:scale-[0.98] no-scale"
                    )}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Now
                  </Link>
                  <Link
                    to="/info/$id/$slug"
                    params={{ id: item.id, slug: item.title.replace(/\s+/g, "-").toLowerCase() }}
                    search={{ page: undefined }}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white bg-white/10 ring-1 ring-white/15 hover:bg-white/15 transition-colors active:scale-[0.98] no-scale"
                  >
                    Detail
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slider indicator — bottom left */}
      <div className="absolute bottom-4 md:bottom-5 left-4 sm:left-6 md:left-10 lg:left-12 z-20 flex items-center gap-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "transition-all duration-300 rounded-full",
              selected === i ? "w-8 h-1.5 bg-pink-500" : "w-2 h-2 bg-white/30 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Next / previous — bottom right, stacked */}
      <div className="absolute bottom-4 md:bottom-6 right-4 sm:right-6 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous slide"
          className="hidden md:flex w-11 h-11 items-center justify-center rounded-lg bg-black/45 ring-1 ring-white/10 text-white hover:bg-black/65 hover:ring-white/25 transition-colors active:scale-[0.96] no-scale"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next slide"
          className="hidden md:flex w-11 h-11 items-center justify-center rounded-lg bg-black/45 ring-1 ring-white/10 text-white hover:bg-black/65 hover:ring-white/25 transition-colors active:scale-[0.96] no-scale"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}