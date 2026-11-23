import { Link } from "@tanstack/react-router";
import { Captions, Mic, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Anime } from "@/services/anime.service";
import { SmartImage } from "@/components/ui/smart-image";
import { customColorFor, formatColor, titleFor } from "@/lib/anime-meta";
import { slugify } from "@/lib/slug";

const STATUS_DOT: Record<Anime["status"], string> = {
  ONGOING: "bg-emerald-500",
  COMPLETED: "bg-zinc-500",
  UPCOMING: "bg-amber-500",
};

function ratingLabel(rating?: number): string | null {
  if (rating == null) return null;
  return rating >= 10 ? String(Math.round(rating)) : rating.toFixed(1);
}

function PrimaryCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[150px] sm:w-[170px] md:w-[190px] max-w-full shrink-0",
        className
      )}
    >
      <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-muted ring-1 ring-border">
        <div className="absolute inset-0 skeleton-shimmer bg-[linear-gradient(110deg,var(--muted),transparent,var(--muted))]" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-5/6 rounded bg-muted skeleton-shimmer" />
        <div className="h-5 w-3/4 rounded bg-muted skeleton-shimmer" />
      </div>
    </div>
  );
}

interface PrimaryCardProps {
  anime: Anime;
  className?: string;
  priority?: boolean;
  index?: number;
}

export function PrimaryCard({ anime, className, priority = false, index = 0 }: PrimaryCardProps) {
  const title = titleFor(anime) || anime.title;
  const year = anime.year ?? (anime.releaseDate ? Number(anime.releaseDate.slice(0, 4)) : undefined);
  const eps = anime.episodes ?? anime.totalEpisodes;
  const rating = ratingLabel(anime.rating);
  const custom = customColorFor(anime);
  const posterSrc = anime.poster || anime.image || anime.cover || undefined;

  return (
    <Link
      to="/info/$id/$slug"
      params={{ id: anime.id, slug: slugify(title) }}
      search={{ page: undefined }}
      style={{ ["--custom" as string]: custom, animationDelay: `${index * 50}ms` }}
      className={cn(
        "group relative block w-[150px] sm:w-[170px] md:w-[190px] max-w-full shrink-0",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[10px]",
        "transition-transform duration-200 ease-out hover:-translate-y-1",
        "load-in",
        className
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[10px] bg-muted ring-1 ring-border shadow-sm shadow-black/20">
        {posterSrc ? (
          <SmartImage
            src={posterSrc}
            alt={title}
            priority={priority}
            className="absolute inset-0"
            imgClassName="group-hover:scale-[1.06] transition-transform duration-500 ease-out"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `radial-gradient(120% 120% at 50% 30%, ${custom} 0%, ${custom}80 45%, #0a0a0f 100%)`,
            }}
          >
            <span className="text-5xl font-black text-white/25">{(title || "S")[0]}</span>
          </div>
        )}
      </div>

      {/* Title row — status dot + single line title */}
      <div className="mt-2 flex items-start gap-1.5">
        <span
          className={cn(
            "mt-[5px] w-1.5 h-1.5 shrink-0 rounded-full ring-2 ring-white/10",
            STATUS_DOT[anime.status] ?? "bg-zinc-500"
          )}
        />
        <p className="min-w-0 flex-1 text-[13px] font-semibold text-foreground leading-snug line-clamp-1">
          {title}
        </p>
      </div>

      {/* Metadata row */}
      <div className="mt-1.5 flex items-center gap-1 overflow-hidden whitespace-nowrap">
        <span
          className="px-1.5 py-px rounded-[4px] text-[9px] font-bold text-black/90"
          style={{ backgroundColor: `${formatColor(anime.type ?? "TV")}cc` }}
        >
          {(anime.type ?? "TV").toUpperCase()}
        </span>
        <span className="px-1.5 py-px rounded-[4px] bg-muted text-muted-foreground text-[9px] font-semibold">
          {year ?? "—"}
        </span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-[4px] bg-muted text-muted-foreground text-[9px] font-semibold tracking-wide">
          <Captions className="w-2.5 h-2.5" />
          <span>{eps != null ? `${eps}` : "–"}</span>
          <span className="text-muted-foreground/50">/</span>
          <Mic className="w-2.5 h-2.5" />
          <span>{anime.hasDub ? (eps != null ? `${eps}` : "DUB") : "–"}</span>
        </span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-[4px] bg-muted text-muted-foreground text-[9px] font-semibold">
          <Star className="w-2.5 h-2.5 text-amber-400" fill="currentColor" />
          {rating ?? "–"}
        </span>
      </div>
    </Link>
  );
}

export { PrimaryCardSkeleton };