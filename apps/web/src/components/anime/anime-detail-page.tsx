"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Play,
  Heart,
  Share2,
  Check,
  Tv,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Captions,
  Mic,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { customColorFor } from "@/lib/anime-meta";
import { getAnimeById, getAnimeEpisodes, getAnimeRelated, type Anime } from "@/services/anime.service";

const BG = "var(--background)";
const SURFACE = "var(--muted)";
const CARD = "var(--card)";
const ACCENT = "var(--custom)";
const GOLD = "#FFD700";

function slugify(title: string): string {
  if (!title) return "";
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatReleaseDate(date?: string): string | undefined {
  if (!date) return undefined;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return date;
  const day = parseInt(m[3], 10);
  const month = MONTHS[parseInt(m[2], 10) - 1] || m[2];
  return `${day} ${month} ${m[1]}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

const ITEMS_PER_PAGE = 12;

interface Props {
  id: string;
  slug?: string;
  page?: string;
  basePath?: string;
}

type DetailTab = "overview" | "artwork" | "episodes";

type EpisodeView = "list" | "grid" | "gallery";

const STATUS_META: Record<Anime["status"], { label: string; classes: string }> = {
  ONGOING: { label: "Airing", classes: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
  COMPLETED: { label: "Completed", classes: "text-custom bg-custom/10 border-custom/30" },
  UPCOMING: { label: "Upcoming", classes: "text-amber-400 bg-amber-400/10 border-amber-400/25" },
};

export default function AnimeDetailPage({ id, slug, page: pageStr, basePath }: Props) {
  const navigate = useNavigate();
  const seasonsRef = useRef<HTMLDivElement>(null);
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [favorited, setFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [artworkPage, setArtworkPage] = useState(1);
  const [episodeView, setEpisodeView] = useState<EpisodeView>("gallery");

  const { data: anime, isLoading: animeLoading, error: animeError } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeById(id),
  });

  const { data: episodes = [], isLoading: episodesLoading } = useQuery({
    queryKey: ["anime-episodes", id, anime?.title],
    queryFn: () => getAnimeEpisodes(id, "local", anime?.title),
    enabled: !!anime,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["anime-related", id],
    queryFn: () => getAnimeRelated(id),
    enabled: !!anime,
  });

  // Redirect slug-based URL to numeric ID URL (e.g. /info/attack-on-titan/attack-on-titan → /info/7442/attack-on-titan)
  useEffect(() => {
    if (anime && !animeLoading && !/^\d+$/.test(id) && /^\d+$/.test(anime.id) && anime.id !== id) {
      const targetSlug = slug || slugify(anime.romajiTitle || anime.titleEnglish || anime.title);
      navigate({ to: `/info/${anime.id}/${targetSlug}`, search: { page: pageStr }, replace: true });
    }
  }, [anime, animeLoading, id, slug, pageStr, navigate]);

  if (animeLoading) {
    return <DetailSkeleton />;
  }

  if (animeError || !anime) {
    return <NotFoundState />;
  }

  const expectedSlug = slugify(anime.romajiTitle || anime.titleEnglish || anime.title);
  if (slug && slug !== expectedSlug) {
    const correctPath = basePath ? `/${basePath}/${id}/${expectedSlug}` : `/info/${id}/${expectedSlug}`;
    navigate({ to: correctPath, replace: true });
    return null;
  }

  const totalPages = Math.ceil(episodes.length / ITEMS_PER_PAGE);
  const paginatedEpisodes = episodes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const description = anime.description ? stripHtml(anime.description) : "";
  const posterSrc = anime.poster || anime.image || anime.cover;
  const pathPrefix = basePath || "info";

  const artworks =
    anime.artworks?.length
      ? Array.from(new Set(anime.artworks))
      : Array.from(
          new Set(
            [anime.banner, anime.cover, anime.poster, anime.image].filter(
              (src): src is string => Boolean(src)
            )
          )
        );

  const ARTWORK_PER_PAGE = 10;
  const artworkTotalPages = Math.max(1, Math.ceil(artworks.length / ARTWORK_PER_PAGE));
  const artworkClamped = Math.min(artworkPage, artworkTotalPages);
  const paginatedArtworks = artworks.slice(
    (artworkClamped - 1) * ARTWORK_PER_PAGE,
    artworkClamped * ARTWORK_PER_PAGE
  );

  const totalEps = anime.totalEpisodes ?? anime.episodes;

  const scrollSeasons = (dir: -1 | 1) => {
    if (!seasonsRef.current) return;
    seasonsRef.current.scrollBy({ left: dir * (seasonsRef.current.clientWidth * 0.7), behavior: "smooth" });
  };

  const yearValue = anime.year ? String(anime.year) : anime.releaseDate ? anime.releaseDate.slice(0, 4) : undefined;

  const airedValue = [anime.releaseDate, anime.endDate]
    .filter((d): d is string => Boolean(d))
    .map((d) => {
      const p = d.split("-");
      if (p.length !== 3) return d;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[Number(p[1]) - 1] ?? p[1]} ${Number(p[2])}, ${p[0]}`;
    })
    .join(" to ");

  const details: Array<{ label: string; value: string }> = [];
  if (anime.rating != null) details.push({ label: "Rating", value: anime.rating.toFixed(1) });
  if (anime.type) details.push({ label: "Format", value: anime.type });
  if (totalEps != null) details.push({ label: "Episodes", value: String(totalEps) });
  if (anime.duration) details.push({ label: "Duration", value: anime.duration });
  if (airedValue) details.push({ label: "Aired", value: airedValue });
  if (yearValue) details.push({ label: "Year", value: yearValue });
  if (anime.titleNative) details.push({ label: "Japanese", value: anime.titleNative });
  if (anime.titleEnglish && anime.titleEnglish !== anime.title) details.push({ label: "English", value: anime.titleEnglish });
  if (anime.title) details.push({ label: "Romaji", value: anime.title });
  if (anime.status) details.push({ label: "Status", value: STATUS_META[anime.status]?.label ?? anime.status });
  if (anime.season) details.push({ label: "Season", value: anime.season });
  if (anime.ageRating) details.push({ label: "Age Rating", value: anime.ageRatingGuide ? `${anime.ageRating} - ${anime.ageRatingGuide}` : anime.ageRating });
  if (anime.genres?.length) details.push({ label: "Genres", value: anime.genres.join(", ") });
  if (anime.producers?.length) details.push({ label: "Producers", value: anime.producers.join(", ") });
  if (anime.licensors?.length) details.push({ label: "Licensors", value: anime.licensors.join(", ") });
  if (anime.studios?.length) details.push({ label: "Studios", value: anime.studios.join(", ") });

  const shareUrl = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const status = STATUS_META[anime.status] ?? STATUS_META.COMPLETED;

  const tabs: Array<{ key: DetailTab; label: string }> = [
    { key: "overview", label: "Overview" },
    ...(artworks.length > 0 ? [{ key: "artwork" as const, label: "Artwork" }] : []),
    { key: "episodes", label: `Episodes (${episodes.length})` },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", ["--custom" as string]: customColorFor(anime) }}
    >
      {/* ===== Hero section (full width) ===== */}
      <div className="relative w-full">
        {/* Background image covering full width */}
        <div className="absolute inset-0 -z-0 h-[480px] sm:h-[540px] lg:h-[600px] bg-muted">
            {(anime.banner || anime.cover || posterSrc) && (
              <img
                src={anime.banner || anime.cover || posterSrc || ""}
                alt={anime.title}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/50 to-black/70" />
            {/* Themed blur starting from the Watch Now button down */}
            <div
              className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[48%] lg:h-[46%] pointer-events-none"
              style={{
                backgroundColor: "var(--background)",
                opacity: 0.55,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                maskImage: "linear-gradient(to top, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)",
              }}
            />
          </div>

          {/* ===== Top content: poster + title/synopsis ===== */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-6 md:gap-8 px-4 sm:px-6 lg:px-8 pt-36 sm:pt-44 lg:pt-58 pb-8 md:pb-12">
            {/* Left: poster */}
            <div className="mx-auto sm:mx-0 w-[160px] sm:w-full">
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted ring-1 ring-white/10 shadow-lg shadow-black/50">
                {posterSrc ? (
                  <img
                    src={posterSrc}
                    alt={anime.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: CARD }}>
                    <span className="text-5xl font-bold text-white/10">
                      {(anime.title || "S")[0] as string}
                    </span>
                  </div>
                )}
                {anime.rating != null && (
                  <div
                    className="absolute top-0 right-0 m-1.5 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold"
                    style={{ backgroundColor: "rgba(0,0,0,0.75)", color: GOLD, backdropFilter: "blur(4px)" }}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {anime.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: title + subtitle + synopsis */}
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                {anime.title}
              </h1>
              {anime.titleEnglish && anime.titleEnglish !== anime.title && (
                <p className="text-base md:text-lg text-white/60 mt-2 drop-shadow-md">{anime.titleEnglish}</p>
              )}
              {/* Status bar: type + status badge */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
                {anime.type && (
                  <span className="inline-flex items-center gap-1.5 text-white/70 text-sm drop-shadow-md">
                    <Tv className="w-4 h-4" />
                    {anime.type}
                  </span>
                )}
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold", status.classes)}>
                  {status.label}
                </span>
              </div>
              {description && (
                <p
                  className={cn(
                    "mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-white/80 drop-shadow-md",
                    !descExpanded && "line-clamp-3"
                  )}
                >
                  {description}
                </p>
              )}
              {description && description.length > 240 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((e) => !e)}
                  className="mt-2 w-fit text-xs font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ color: ACCENT }}
                >
                  {descExpanded ? "Read less" : "Read more"}
                </button>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  asChild
                  className="gap-2 text-white font-semibold px-8 h-12 rounded-xl transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Link to="/watch/$id/$" params={{ id, _splat: expectedSlug }} search={{ ep: 1 }}>
                    <Play className="w-5 h-5 fill-current" />
                    Watch Now
                  </Link>
                </Button>
                <button
                  type="button"
                  aria-label={favorited ? "Remove from watchlist" : "Add to watchlist"}
                  aria-pressed={favorited}
                  onClick={() => setFavorited((f) => !f)}
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-custom/20 hover:border-custom/40"
                >
                  <Heart className={`w-5 h-5 transition-colors ${favorited ? "fill-rose-500 text-rose-500" : "text-white/60"}`} />
                </button>
                <button
                  type="button"
                  aria-label="Copy link"
                  onClick={shareUrl}
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-custom/20 hover:border-custom/40"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5 text-white/60" />}
                </button>
              </div>

              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Anime details"
                className="inline-flex items-stretch overflow-hidden rounded-lg ring-1 ring-white/10 mt-4 self-start"
                style={{ backgroundColor: SURFACE }}
              >
                {tabs.map((t, i) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      i > 0 && "border-l border-white/10",
                      tab === t.key ? "text-white font-bold shadow" : "text-white/50 hover:text-white"
                    )}
                    style={tab === t.key ? { backgroundColor: ACCENT } : undefined}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Content: Information + Tabs ===== */}
        <Container className="pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 md:gap-8 mt-6 md:mt-8">
          {/* Left: Information box */}
          <aside
            className="block rounded-xl p-5 border border-white/[0.06] w-full h-fit"
            style={{ backgroundColor: "rgba(22,22,29,0.6)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">Information</h2>
            <dl className="space-y-3">
              {details.map((d) => (
                <div key={d.label}>
                  <dt className="text-[11px] uppercase tracking-wider text-white/40">{d.label}</dt>
                  <dd className="mt-0.5 text-sm text-white/80">{d.value}</dd>
                </div>
              ))}
            </dl>
          </aside>

          {/* Right: tab content */}
          <div className="min-w-0">
            {/* Tab content */}
            <div className="-mt-9 md:-mt-11">
              {tab === "overview" && (
            <section aria-label="Overview" className="space-y-5">
              <div
                className="rounded-xl p-5 md:p-6 border border-white/[0.06]"
                style={{ backgroundColor: "rgba(22,22,29,0.6)" }}
              >
                {anime.trailer ? (
                  <div>
                    <div className="rounded-xl overflow-hidden ring-1 ring-white/10" style={{ backgroundColor: "#0d0d12" }}>
                      <YouTubeEmbed url={anime.trailer} title={`${anime.title} trailer`} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40">No trailer available.</p>
                )}

                {related.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">All Seasons</h2>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Previous seasons"
                          onClick={() => scrollSeasons(-1)}
                          className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/60 transition hover:bg-custom/20 hover:border-custom/40 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next seasons"
                          onClick={() => scrollSeasons(1)}
                          className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/60 transition hover:bg-custom/20 hover:border-custom/40 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div ref={seasonsRef} className="flex gap-3 overflow-x-auto scrollbar-hide snap-x">
                      {related.slice(0, 30).map((animeItem) => (
                        <RelatedPoster key={animeItem.id} anime={animeItem} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "artwork" && artworks.length > 0 && (
            <section aria-label="Artwork">
              <div
                className="rounded-xl p-5 md:p-6 border border-white/[0.06]"
                style={{ backgroundColor: "rgba(22,22,29,0.6)" }}
              >
                {artworkTotalPages > 1 && (
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setArtworkPage((p) => Math.max(1, p - 1))}
                      disabled={artworkClamped <= 1}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-transparent hover:bg-white/5"
                      style={{ color: "var(--foreground)" }}
                      aria-label="Previous artwork"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>

                    <span className="text-sm tabular-nums text-muted-foreground">
                      {artworkClamped} / {artworkTotalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setArtworkPage((p) => Math.min(artworkTotalPages, p + 1))}
                      disabled={artworkClamped >= artworkTotalPages}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-transparent hover:bg-white/5"
                      style={{ color: "var(--foreground)" }}
                      aria-label="Next artwork"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {paginatedArtworks.map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={src}
                        alt={`${anime.title} artwork`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          {tab === "episodes" && (
            <section aria-label="Episodes">
              {episodesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : episodes.length > 0 ? (
                <div
                  className="rounded-xl p-5 md:p-6 border border-white/[0.06]"
                  style={{ backgroundColor: "rgba(22,22,29,0.6)" }}
                >
                  <div className="mb-5 flex items-center gap-1 rounded-xl p-1 ring-1 ring-white/10 self-start w-fit">
                    {(
                      [
                        { key: "list" as const, label: "List", icon: List },
                        { key: "grid" as const, label: "Grid", icon: LayoutGrid },
                        { key: "gallery" as const, label: "Gallery", icon: ImageIcon },
                      ]
                    ).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEpisodeView(key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          episodeView === key ? "text-white" : "text-white/50 hover:text-white"
                        }`}
                        style={episodeView === key ? { backgroundColor: ACCENT } : undefined}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {episodeView === "list" && (
                    <div className="grid gap-2.5 max-w-3xl">
                      {paginatedEpisodes.map((ep) => (
                        <Link
                          key={ep.number}
                          to="/watch/$id/$"
                          params={{ id, _splat: expectedSlug }}
                          search={{ ep: ep.number }}
                          className="group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-custom/40"
                          style={{ backgroundColor: CARD, border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors group-hover:bg-custom/30"
                            style={{ backgroundColor: "#2A2A3D", color: "rgba(255,255,255,0.7)" }}
                          >
                            {ep.number}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1 text-sm md:text-base">
                              EP {ep.number} · {ep.title || anime.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              {ep.isDubbed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                                  <Mic className="w-2.5 h-2.5" /> DUB
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                                  <Captions className="w-2.5 h-2.5" /> CC
                                </span>
                              )}
                              {ep.releaseDate && <span className="text-xs text-white/40">{formatReleaseDate(ep.releaseDate)}</span>}
                            </div>
                          </div>

                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:bg-custom/25 group-hover:scale-110 shrink-0"
                            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                          >
                            <Play className="w-4 h-4 text-white/40 group-hover:text-custom transition-colors ml-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {episodeView === "grid" && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
                      {paginatedEpisodes.map((ep) => (
                        <Link
                          key={ep.number}
                          to="/watch/$id/$"
                          params={{ id, _splat: expectedSlug }}
                          search={{ ep: ep.number }}
                          className="group relative aspect-square rounded-xl flex items-center justify-center text-base font-bold transition-all duration-200 hover:border-custom/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          style={{
                            backgroundColor: "#1C1C24",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "rgba(255,255,255,0.55)",
                          }}
                        >
                          <span className="group-hover:opacity-0 transition-opacity">{ep.number}</span>
                          <Play className="w-5 h-5 absolute opacity-0 group-hover:opacity-100 transition-opacity text-custom" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {episodeView === "gallery" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paginatedEpisodes.map((ep) => {
                        const epImage = ep.image || anime.banner || anime.cover || anime.poster;
                        const hasSub = ep.isSubbed === true;
                        const hasDub = ep.isDubbed === true;
                        return (
                          <Link
                            key={ep.number}
                            to="/watch/$id/$"
                            params={{ id, _splat: expectedSlug }}
                            search={{ ep: ep.number }}
                            className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:ring-custom/50 hover:-translate-y-0.5 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ backgroundColor: CARD }}
                          >
                            <div className="relative aspect-video">
                              {epImage ? (
                                <img
                                  src={epImage}
                                  alt={`EP ${ep.number} · ${anime.title}`}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#1C1C24" }}>
                                  <Play className="w-8 h-8 text-white/30" />
                                </div>
                              )}
                              <span
                                className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                style={{ backgroundColor: ACCENT }}
                              >
                                EP {ep.number}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 p-3">
                              <p className="font-semibold text-white/85 group-hover:text-white transition-colors line-clamp-1 text-sm">
                                EP {ep.number} · {ep.title || anime.title}
                              </p>

                              {ep.description && (
                                <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{ep.description}</p>
                              )}

                              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1.5">
                                  {hasSub && (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded text-white/80"
                                      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                                      title="Subtitled"
                                    >
                                      <Captions className="w-3 h-3" />
                                    </span>
                                  )}
                                  {hasDub && (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded text-white/80"
                                      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                                      title="Dubbed"
                                    >
                                      <Mic className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>

                                {ep.releaseDate && (
                                  <span className="text-xs text-white/40 ml-auto">{formatReleaseDate(ep.releaseDate)}</span>
                                )}

                                <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-custom">
                                  <Play className="w-3 h-3 text-white/70 group-hover:text-white ml-0.5" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) =>
                        pathPrefix === "info" ? (
                          <Link
                            key={pageNum}
                            to="/info/$id/$slug"
                            params={{ id, slug: expectedSlug }}
                            search={{ page: String(pageNum) }}
                            aria-label={`Page ${pageNum}`}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              currentPage === pageNum
                                ? "text-white shadow-lg"
                                : "text-white/50 hover:text-white border border-white/10"
                            }`}
                            style={currentPage === pageNum ? { backgroundColor: ACCENT } : { backgroundColor: "rgba(255,255,255,0.04)" }}
                          >
                            {pageNum}
                          </Link>
                        ) : (
                          <Link
                            key={pageNum}
                            to="/anime/$id"
                            params={{ id }}
                            search={{ page: String(pageNum) }}
                            aria-label={`Page ${pageNum}`}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              currentPage === pageNum
                                ? "text-white shadow-lg"
                                : "text-white/50 hover:text-white border border-white/10"
                            }`}
                            style={currentPage === pageNum ? { backgroundColor: ACCENT } : { backgroundColor: "rgba(255,255,255,0.04)" }}
                          >
                            {pageNum}
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 rounded-xl border border-white/[0.06]" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <p className="text-white/40">No episodes available yet. Check back later!</p>
                </div>
              )}
            </section>
          )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function RelatedPoster({ anime }: { anime: Anime }) {
  const posterSrc = anime.poster || anime.image || anime.cover;
  const relatedSlug = slugify(anime.romajiTitle || anime.titleEnglish || anime.title);

  return (
    <Link
      to="/info/$id/$slug"
      params={{ id: anime.id, slug: relatedSlug }}
      search={{ page: undefined }}
      className="group relative aspect-[2/3] w-[140px] sm:w-[150px] shrink-0 rounded-xl overflow-hidden ring-1 ring-white/10 bg-muted snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 hover:ring-custom/50"
    >
      {posterSrc ? (
        <>
          <img
            src={posterSrc}
            alt={anime.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="text-xs font-medium text-white leading-snug line-clamp-2">{anime.title}</p>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: CARD }}>
          <span className="text-3xl font-bold text-white/10">{(anime.title || "S")[0] as string}</span>
        </div>
      )}
    </Link>
  );
}

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const videoId =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? null;

  if (!videoId) return null;

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="block w-full aspect-video"
    />
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <Container className="py-6 md:py-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-6 md:gap-8">
          <div className="hidden sm:block">
            <Skeleton className="aspect-[2/3] w-full rounded-xl shrink-0" />
          </div>
          <div className="space-y-4 pt-1">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full max-w-2xl rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </Container>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-white mb-4">Anime Not Found</h1>
        <p className="text-white/60 mb-8">The anime you are looking for does not exist.</p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}