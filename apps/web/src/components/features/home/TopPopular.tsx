import { Link } from "@tanstack/react-router";
import { Anime } from "@/services/anime.service";
import { slugify } from "@/lib/slug";

function titleFor(anime: Anime): string {
  return anime.titleEnglish || anime.titleNative || anime.title;
}

export function TopPopular({ anime }: { anime: Anime[] }) {
  const list = anime.slice(0, 5);
  if (list.length === 0) return null;

  const [top, ...rest] = list;

  return (
    <div className="space-y-3">
      <LargeTopCard anime={top} rank={1} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rest.map((a) => (
          <MediumTopCard key={a.id} rank={list.indexOf(a) + 1} anime={a} />
        ))}
      </div>
    </div>
  );
}

function LargeTopCard({ anime, rank }: { anime: Anime; rank: number }) {
  const eps = anime.episodes ?? anime.totalEpisodes;

  return (
    <Link
      to="/info/$id/$slug"
      params={{ id: anime.id, slug: slugify(titleFor(anime) || anime.title) }}
      search={{ page: undefined }}
      className="group relative block aspect-[16/8] sm:aspect-[16/6] rounded-2xl overflow-hidden bg-[#1A1A24] ring-1 ring-white/[0.06] transition hover:ring-[#7C3AED]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B79CFF]"
    >
      <img
        src={anime.cover || anime.banner || anime.poster || "/placeholder-cover.webp"}
        alt={titleFor(anime) || anime.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      <span className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-lg bg-[#FFD700] text-black text-sm font-bold shadow-lg">
        #{rank}
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <h3 className="text-lg md:text-2xl font-bold text-white line-clamp-2 mb-2 drop-shadow">
          {titleFor(anime) || anime.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {anime.rating != null && (
            <span className="font-semibold text-[#FFD700]">★ {anime.rating.toFixed(1)}</span>
          )}
          {eps != null && <span className="text-white/60">{eps} eps</span>}
          {anime.type && <span className="text-white/60">{anime.type}</span>}
        </div>
      </div>
    </Link>
  );
}

function MediumTopCard({ anime, rank }: { anime: Anime; rank: number }) {
  const eps = anime.episodes ?? anime.totalEpisodes;

  return (
    <Link
      to="/info/$id/$slug"
      params={{ id: anime.id, slug: slugify(titleFor(anime) || anime.title) }}
      search={{ page: undefined }}
      className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1A24] ring-1 ring-white/[0.06] transition hover:ring-[#7C3AED]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B79CFF]"
    >
      <div className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-[#2A2A3D]">
        <img
          src={anime.poster || anime.cover || "/placeholder-poster.svg"}
          alt={titleFor(anime) || anime.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded bg-[#7C3AED] text-white text-[10px] font-bold">
          #{rank}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#B79CFF] transition-colors">
          {titleFor(anime) || anime.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-xs">
          {anime.rating != null && (
            <span className="font-semibold text-[#FFD700]">★ {anime.rating.toFixed(1)}</span>
          )}
          {eps != null && <span className="text-white/40">{eps} eps</span>}
        </div>
        {anime.genres && anime.genres.length > 0 && (
          <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8B5CF6]/20 text-[#A78BFA]">
            {(anime.genres[0] || "").toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
}