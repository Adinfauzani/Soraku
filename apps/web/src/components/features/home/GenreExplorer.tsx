"use client";

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getGenres, genreSlug } from "@/services/anime.service";

const genreGradients: Record<string, string> = {
  Action: "from-red-600/20 to-orange-600/10 hover:from-red-600/30 hover:to-orange-600/20",
  Adventure: "from-emerald-600/20 to-teal-600/10 hover:from-emerald-600/30 hover:to-teal-600/20",
  Comedy: "from-yellow-600/20 to-amber-600/10 hover:from-yellow-600/30 hover:to-amber-600/20",
  Drama: "from-violet-600/20 to-purple-600/10 hover:from-violet-600/30 hover:to-purple-600/20",
  Fantasy: "from-pink-600/20 to-rose-600/10 hover:from-pink-600/30 hover:to-rose-600/20",
  Horror: "from-red-800/20 to-red-900/10 hover:from-red-800/30 hover:to-red-900/20",
  Romance: "from-pink-500/20 to-red-400/10 hover:from-pink-500/30 hover:to-red-400/20",
  SciFi: "from-cyan-600/20 to-blue-600/10 hover:from-cyan-600/30 hover:to-blue-600/20",
  SliceOfLife: "from-teal-500/20 to-green-500/10 hover:from-teal-500/30 hover:to-green-500/20",
  Sports: "from-blue-600/20 to-indigo-600/10 hover:from-blue-600/30 hover:to-indigo-600/20",
  Thriller: "from-slate-600/20 to-zinc-600/10 hover:from-slate-600/30 hover:to-zinc-600/20",
  Mystery: "from-indigo-600/20 to-purple-600/10 hover:from-indigo-600/30 hover:to-purple-600/20",
};

function getGradient(genre: string): string {
  return genreGradients[genre] || "from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10";
}

export function GenreExplorer() {
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve(getGenres()).then(setGenres).finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Browse by Genre</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {genres.map((genre) => (
            <Link
              key={genre}
              to="/genre/$slug"
              params={{ slug: genreSlug(genre) }}
              className={`bg-gradient-to-br ${getGradient(genre)} border border-white/[0.06] hover:border-white/20 rounded-xl px-3 py-2.5 transition-all duration-300 text-center group`}
            >
              <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                {genre}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
