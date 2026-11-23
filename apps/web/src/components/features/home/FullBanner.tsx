"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Heart, Play, Star } from "lucide-react";
import type { Anime } from "@/services/anime.service";
import { customColorFor, formatColor, statusMeta, titleFor } from "@/lib/anime-meta";
import { slugify } from "@/lib/slug";

const AUTOPLAY_MS = 12000;

interface FullBannerProps {
  anime: Anime[];
  isLoading?: boolean;
}

export function FullBanner({ anime, isLoading }: FullBannerProps) {
  const items = anime.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = items[index] ?? items[0];

  const advance = useCallback(() => {
    if (items.length === 0) return;
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const restart = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!paused) timer.current = setTimeout(advance, AUTOPLAY_MS);
  }, [paused, advance]);

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, restart]);

  if (isLoading || items.length === 0) {
    return (
      <section className="relative h-[62vh] min-h-[420px] w-full overflow-hidden bg-muted skeleton-shimmer" />
    );
  }

  return (
    <section
      className="relative h-[62vh] min-h-[420px] w-full overflow-hidden bg-black"
      style={{ ["--custom" as string]: customColorFor(active) }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Banner image */}
          {(active.banner || active.cover || active.image || active.poster) && (
            <img
              src={active.banner || active.cover || active.image || active.poster!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Radial fade into background, biased to one corner (Hayase-style) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(75% 65% at 59% 35%, hsla(from var(--background) h s l / 0.18) 30%, var(--background) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-16">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {!!active.rating && (
                  <span className="px-2 py-0.5 rounded bg-custom text-black font-bold text-[11px] flex items-center gap-1">
                    <Star size={10} fill="currentColor" className="text-black" />
                    {active.rating.toFixed(1)}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-custom text-black font-bold text-[11px]">
                  {(active.type || "TV").toUpperCase()}
                </span>
                {active.episodes != null && (
                  <span className="px-2 py-0.5 rounded bg-custom text-black font-bold text-[11px]">
                    {active.episodes} eps
                  </span>
                )}
                {active.year != null && (
                  <span className="px-2 py-0.5 rounded bg-custom text-black font-bold text-[11px]">
                    {active.year}
                  </span>
                )}
                <span
                  className="px-2 py-0.5 rounded bg-custom text-black font-bold text-[11px]"
                  style={{ filter: "brightness(0.9)" }}
                >
                  {statusMeta(active.status).label}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none text-shadow-lg">
                {titleFor(active) || active.title}
              </h1>

              {active.genres && active.genres.length > 0 && (
                <p className="mt-3 text-sm font-semibold text-white/70 flex flex-wrap gap-x-3">
                  {active.genres.slice(0, 4).map((g) => (
                    <span key={g}>{g}</span>
                  ))}
                </p>
              )}

              {active.description && (
                <p className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-3 max-w-xl hidden sm:block">
                  {active.description.replace(/<\/?[^>]+>/g, "").slice(0, 260)}
                  {active.description.length > 260 ? "…" : ""}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6">
                <Link
                  to="/info/$id/$slug"
                  params={{ id: active.id, slug: slugify(titleFor(active) || active.title) }}
                  search={{ page: undefined }}
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-custom text-black font-bold text-sm transition-transform hover:scale-[1.03] no-scale"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Now
                </Link>
                <button className="w-11 h-11 rounded-lg flex-center bg-white/10 text-white backdrop-blur-sm border border-white/15 no-scale" title="Add to list">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button className="w-11 h-11 rounded-lg flex-center bg-white/10 text-white backdrop-blur-sm border border-white/15 no-scale" title="Favorite">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 pb-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                className="group h-0.5 rounded-full bg-white/25 overflow-hidden flex-1 max-w-16 no-scale"
                title={titleFor(item)}
              >
                <span
                  key={`${index === i ? "active" : "idle"}-${i}`}
                  className={index === i ? "block h-full bg-custom banner-progress" : "block h-full bg-white/0"}
                  style={index === i ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}