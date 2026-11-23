import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, Plus, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Anime } from "@/services/anime.service";
import { SmartImage } from "@/components/ui/smart-image";
import { customColorFor, statusMeta, titleFor } from "@/lib/anime-meta";
import { slugify } from "@/lib/slug";

const PREVIEW_W = 348;
const GAP = 12;

function usePreviewPosition(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean
): { top: number; left: number } | null {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceRight = window.innerWidth - r.right - GAP;
    const left =
      spaceRight >= PREVIEW_W + GAP ? r.right + GAP : Math.max(GAP, r.left - PREVIEW_W - GAP);
    const top = Math.min(Math.max(GAP, r.top), window.innerHeight - PREVIEW_W * 0.9);
    setPos({ top, left });
  }, [ref]);

  useEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return pos;
}

function PosterPreview({ anime }: { anime: Anime }) {
  const custom = customColorFor(anime);
  const eps = anime.episodes ?? anime.totalEpisodes;
  const year = anime.year ?? (anime.releaseDate ? Number(anime.releaseDate.slice(0, 4)) : undefined);
  const status = statusMeta(anime.status);
  const desc = (anime.description || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();

  return (
    <div className="flex flex-col">
      <div
        className="h-14 shrink-0 relative overflow-hidden rounded-t-lg p-4 flex items-end"
        style={{
          background: `radial-gradient(120% 160% at 80% 20%, ${custom}55 0%, transparent 55%), linear-gradient(135deg, var(--secondary), var(--card))`,
        }}
      >
        <div className="flex flex-wrap gap-1.5">
          {!!anime.rating && (
            <span className="px-2 py-0.5 rounded bg-custom text-black text-[10px] font-black flex items-center gap-1">
              <Star size={10} fill="currentColor" />
              {anime.rating.toFixed(1)}
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-custom text-black text-[10px] font-black">
            {(anime.type || "TV").toUpperCase()}
          </span>
          {eps != null && (
            <span className="px-2 py-0.5 rounded bg-custom text-black text-[10px] font-black">{eps} eps</span>
          )}
          {year != null && (
            <span className="px-2 py-0.5 rounded bg-custom text-black text-[10px] font-black">{year}</span>
          )}
          <span
            className="px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-black ring-1 ring-white/15"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="p-4 flex gap-4">
        <div className="w-[92px] aspect-[2/3] shrink-0 rounded overflow-hidden ring-1 ring-border">
          <SmartImage
            src={anime.poster || anime.image || anime.cover || undefined}
            alt={titleFor(anime) || anime.title}
            className="absolute inset-0"
            imgClassName="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-black text-foreground leading-tight line-clamp-2">
            {titleFor(anime) || anime.title}
          </h4>
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {anime.genres.slice(0, 3).map((g) => (
                <span key={g} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold">
                  {g}
                </span>
              ))}
            </div>
          )}
          {desc && (
            <p className="text-xs leading-relaxed text-muted-foreground mt-2 line-clamp-3">{desc.slice(0, 240)}</p>
          )}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="w-9 h-9 rounded-lg flex-center bg-custom text-black no-scale">
              <Play className="w-4 h-4 fill-current" />
            </span>
            <span className="w-9 h-9 rounded-lg flex-center bg-secondary text-foreground no-scale">
              <Heart className="w-4 h-4" />
            </span>
            <span className="w-9 h-9 rounded-lg flex-center bg-secondary text-foreground no-scale">
              <Bookmark className="w-4 h-4" />
            </span>
            <span className="ml-auto text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {slugify(titleFor(anime) || anime.title)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function yearFor(anime: Anime): number | undefined {
  return anime.year ?? (anime.releaseDate ? Number(anime.releaseDate.slice(0, 4)) : undefined);
}

interface PosterCardProps {
  anime: Anime;
  className?: string;
  priority?: boolean;
  index?: number;
}

/** Poster with a Play overlay + gradient (used for hero/contextual cards). */
export function PlayPoster({ anime, className }: { anime: Anime; className?: string }) {
  const custom = customColorFor(anime);
  return (
    <Link
      to="/info/$id/$slug"
      params={{ id: anime.id, slug: slugify(titleFor(anime) || anime.title) }}
      search={{ page: undefined }}
      style={{ ["--custom" as string]: custom }}
      className={cn("group relative block rounded-md overflow-hidden bg-muted ring-1 ring-border", className)}
    >
      <div className="relative aspect-[16/9]">
        <SmartImage
          src={anime.banner || anime.cover || anime.image || anime.poster || undefined}
          alt={titleFor(anime) || anime.title}
          className="absolute inset-0"
          imgClassName="group-hover:scale-[1.04] transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute inset-0 m-auto w-12 h-12 rounded-full flex-center bg-custom text-black/70 bg-black/60 shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
          <Play className="w-5 h-5 fill-current" />
        </span>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-sm font-bold text-white line-clamp-1 text-shadow-lg">
        {titleFor(anime) || anime.title}
      </p>
    </Link>
  );
}

interface EpisodeCardProps {
  episode: {
    id: string;
    number: number;
    title?: string;
    image?: string;
    airDate?: string;
  };
  animeId: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EpisodeCard({
  episode,
  isSelected = false,
  onClick,
  className,
}: EpisodeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 p-2 rounded-md transition-all duration-200 no-scale",
        "hover:bg-muted",
        isSelected && "bg-muted ring-1 ring-primary/50",
        className
      )}
      aria-pressed={isSelected}
    >
      <div className="relative flex-shrink-0 w-16 h-9 aspect-video overflow-hidden rounded bg-muted">
        <SmartImage src={episode.image || undefined} alt={`Episode ${episode.number}`} className="absolute inset-0" />
        <span className="absolute bottom-0 right-0 m-0.5 px-1 py-0.5 text-[10px] font-bold text-white bg-black/80 rounded">
          {episode.number}
        </span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="text-sm font-semibold text-foreground truncate">
          {episode.title || `Episode ${episode.number}`}
        </h4>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {episode.airDate ? new Date(episode.airDate).toLocaleDateString() : "TBA"}
        </p>
      </div>
    </button>
  );
}

export function HotCard({ anime, className, priority = false, index = 0 }: PosterCardProps) {
  const [hovered, setHovered] = useState(false);
  const [side, setSide] = useState<"right" | "left">("right");
  const cardRef = useRef<HTMLAnchorElement>(null);
  const custom = customColorFor(anime);
  const eps = anime.episodes ?? anime.totalEpisodes;
  const year = yearFor(anime);
  const status = statusMeta(anime.status);
  const desc = (anime.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  const aired = anime.releaseDate
    ? new Date(anime.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";
  const title = titleFor(anime) || anime.title;
  const posterSrc = anime.poster || anime.image || anime.cover || "";
  const hasImage = !!posterSrc;

  const computeSide = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = 340;
    const spaceRight = window.innerWidth - r.right;
    setSide(spaceRight >= panelW + 16 ? "right" : "left");
  }, []);

  const onEnter = useCallback(() => {
    computeSide();
    setHovered(true);
  }, [computeSide]);

  return (
    <div
      className={cn(
        "group relative inline-block w-[180px] sm:w-[200px] lg:w-[220px] max-w-full rounded-xl",
        className
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={onEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        ref={cardRef}
        to="/info/$id/$slug"
        params={{ id: anime.id, slug: slugify(title) }}
        search={{ page: undefined }}
        className={cn(
          "relative block w-full aspect-[2/3] rounded-xl overflow-hidden bg-card ring-1 ring-border load-in",
          "transition-all duration-250 hover:ring-2 hover:ring-ring hover:shadow-2xl hover:shadow-black/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <div className="relative w-full h-full overflow-hidden rounded-xl">
          {hasImage ? (
            <SmartImage
              src={posterSrc}
              alt={title}
              priority={priority}
              className="absolute inset-0"
              imgClassName={cn("transition-transform duration-300 ease-out", hovered && "scale-[1.06]")}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 120% at 80% 20%, ${custom} 0%, ${custom}55 40%, #0a0a0f 100%)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-white/15">
                  {(title || "S")[0]}
                </span>
              </div>
            </div>
          )}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              hovered ? "bg-black/55 backdrop-blur-sm" : "bg-gradient-to-r from-black/70 via-black/25 to-transparent"
            )}
          />

          {/* DEFAULT STATE — left vertical panel */}
          <div className="absolute inset-0 flex">
            <div className="w-[34%] flex flex-col items-center justify-between py-3 px-1.5">
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <p
                  className="text-[11px] font-bold text-white whitespace-nowrap drop-shadow"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center center" }}
                >
                  {title}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[15px] font-black text-white tabular-nums drop-shadow">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="w-5 h-px bg-white/50 rounded-full" />
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </Link>

      {/* HOVER DETAIL PANEL — appears to the right (or left at viewport edge) */}
      <div
        className={cn(
          "absolute top-0 z-30 pointer-events-auto",
          side === "right" ? "left-full ml-2" : "right-full mr-2",
          "transition-all duration-250 ease-out",
          hovered
            ? "opacity-100 translate-x-0"
            : side === "right"
            ? "opacity-0 translate-x-2"
            : "opacity-0 -translate-x-2"
        )}
        onMouseEnter={onEnter}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={cn(
            "w-[330px] sm:w-[350px] max-w-[90vw] rounded-xl overflow-hidden",
            "bg-[#0E0E14] ring-1 ring-white/10 shadow-2xl shadow-black/60"
          )}
        >
          <div className="flex">
            <div className="w-[110px] shrink-0 aspect-[2/3] relative">
              {hasImage ? (
                <SmartImage
                  src={posterSrc}
                  alt=""
                  className="absolute inset-0"
                  imgClassName="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(120% 120% at 80% 20%, ${custom} 0%, ${custom}55 40%, #0a0a0f 100%)`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </div>

            <div className="flex-1 flex flex-col justify-between p-3.5 text-white">
              <div className="space-y-2">
                <h3 className="text-[15px] font-bold leading-tight line-clamp-2">{title}</h3>

                <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {anime.rating ? anime.rating.toFixed(2) : "—"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/85 font-semibold">
                    HD
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/85 font-semibold">
                    {eps ?? "—"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/85 font-semibold">
                    {(anime.type || "TV").toUpperCase()}
                  </span>
                </div>

                {desc && (
                  <p className="text-[10.5px] leading-relaxed text-white/60 line-clamp-4">{desc}</p>
                )}

                <div className="text-[10px] text-white/50 space-y-0.5">
                  {anime.titleNative && <p><span className="text-white/35">Japanese:</span> {anime.titleNative}</p>}
                  {aired && <p><span className="text-white/35">Aired:</span> {aired}</p>}
                  <p><span className="text-white/35">Status:</span> {status.label}</p>
                  {anime.genres && anime.genres.length > 0 && (
                    <p><span className="text-white/35">Genres:</span> {anime.genres.slice(0, 4).join(", ")}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-custom text-black text-[11px] font-bold">
                  <Play className="w-3.5 h-3.5 fill-current" /> Watch now
                </span>
                <span
                  className="w-8 h-8 rounded-lg flex-center bg-white/10 hover:bg-white/15 transition-colors"
                  title="Add to watchlist"
                >
                  <Plus className="w-4 h-4" />
                </span>
                <span
                  className="w-8 h-8 rounded-lg flex-center bg-white/10 hover:bg-white/15 transition-colors"
                  title="View on AniList"
                >
                  <AniListLogo className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonHotCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[180px] sm:w-[200px] lg:w-[220px] max-w-full rounded-xl overflow-hidden bg-card ring-1 ring-border",
        className
      )}
    >
      <div className="aspect-[2/3] skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
    </div>
  );
}

function AniListLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function SkeletonEpisodeCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-md", className)}>
      <div className="w-16 h-9 rounded bg-muted skeleton-shimmer" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-3/4 rounded bg-muted skeleton-shimmer" />
        <div className="h-2 w-1/2 rounded bg-muted skeleton-shimmer" />
      </div>
    </div>
  );
}