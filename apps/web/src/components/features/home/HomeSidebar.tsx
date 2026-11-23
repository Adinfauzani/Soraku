import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, MessageCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Anime } from "@/services/anime.service";
import { SmartImage } from "@/components/ui/smart-image";
import { getGenres, genreSlug } from "@/services/anime.service";
import { titleFor } from "@/lib/anime-meta";
import { slugify } from "@/lib/slug";

const TABS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function TopTenPanel({ anime }: { anime: Anime[] }) {
  const [tab, setTab] = useState<TabKey>("today");

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-lg bg-custom/15 flex-center">
          <Flame className="w-4 h-4 text-custom" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Top 10</h3>
      </div>

      <div className="px-4 pb-3 flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold transition-colors no-scale",
              tab === t.key
                ? "bg-custom text-black"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-1 pb-2">
        {anime.slice(0, 10).map((a, i) => (
          <Link
            key={a.id}
            to="/info/$id/$slug"
            params={{ id: a.id, slug: slugify(titleFor(a) || a.title) }}
            search={{ page: undefined }}
            className="group flex items-center gap-2.5 px-4 py-1.5 hover:bg-muted/50 transition-colors"
          >
            <span
              className={cn(
                "w-5 text-center text-base font-black italic leading-none tabular-nums shrink-0",
                i < 3 ? "text-custom" : "text-muted-foreground/60"
              )}
            >
              {i + 1}
            </span>
            <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden bg-muted ring-1 ring-border">
              <SmartImage
                src={a.poster || a.image || a.cover || undefined}
                alt={titleFor(a) || a.title}
                className="absolute inset-0"
                imgClassName="group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-custom transition-colors">
                {titleFor(a) || a.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                {a.rating != null && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-custom" fill="currentColor" />
                    {a.rating.toFixed(1)}
                  </span>
                )}
                {a.type && <span>{a.type.toUpperCase()}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const TRENDING_POSTS = [
  { user: "SoraMiko", time: "2h", title: "Kapan season 2 Shadow Shadow subbed rilis?", replies: 24 },
  { user: "Kyouk4", time: "5h", title: "Buriki no Dance ending paling emotional tahun ini", replies: 18 },
  { user: "hanamaru", time: "8h", title: "Rekomendasi OVA serupa Yuruyuru?", replies: 12 },
  { user: "zenith", time: "12h", title: "Movie terbaik musim ini menurut OP?", replies: 31 },
  { user: "arash1x", time: "1d", title: "Top 5 anime original yang wajib ditonton 2026", replies: 45 },
];

export function TrendingPosts() {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-custom" />
          <h3 className="text-sm font-bold text-foreground">Trending Posts</h3>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">HOT</span>
      </div>

      <div className="space-y-1 pb-2">
        {TRENDING_POSTS.map((post) => (
          <button
            key={post.title}
            className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-custom/20 text-custom flex-center text-[8px] font-black">
                {post.user[0]}
              </span>
              <span className="font-semibold text-foreground/80">{post.user}</span>
              <span>·</span>
              <span>{post.time}</span>
            </div>
            <p className="text-[12px] font-medium text-foreground leading-snug line-clamp-2 mt-1 group-hover:text-custom transition-colors">
              {post.title}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              <span>{post.replies} replies</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SidebarGenreList() {
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    Promise.resolve(getGenres()).then(setGenres);
  }, []);

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="text-sm font-bold text-foreground">Genres</h3>
        <Link
          to="/discover"
          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors no-scale"
        >
          More ›
        </Link>
      </div>

      <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
        {genres.map((genre) => (
          <Link
            key={genre}
            to="/genre/$slug"
            params={{ slug: genreSlug(genre) }}
            className="px-2.5 py-1.5 rounded-lg bg-muted/50 ring-1 ring-transparent hover:ring-border hover:bg-muted text-[11px] font-semibold text-foreground/80 hover:text-foreground transition-all text-center no-scale"
          >
            {genre}
          </Link>
        ))}
      </div>
    </div>
  );
}