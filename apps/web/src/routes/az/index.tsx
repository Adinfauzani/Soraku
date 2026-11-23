import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { searchAnime } from "@/services/anime.service";
import { PrimaryCard, PrimaryCardSkeleton } from "@/components/features/home/PrimaryCard";

export const Route = createFileRoute("/az/")({
  validateSearch: (search: Record<string, unknown>) => ({
    letter: typeof search.letter === "string" && search.letter ? search.letter : undefined,
    page: typeof search.page === "string" ? (Number(search.page) || undefined) : undefined,
  }),
});

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

function AzListPage() {
  const { letter, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeLetter, setActiveLetter] = useState(letter ?? "A");
  const [activePage, setActivePage] = useState(page ?? 1);

  const { data, isLoading } = useQuery({
    queryKey: ["az", activeLetter, activePage],
    queryFn: () => searchAnime(activeLetter, activePage),
    staleTime: 5 * 60 * 1000,
  });

  const pick = useCallback(
    (l: string) => {
      setActiveLetter(l);
      setActivePage(1);
      navigate({ to: "/az", search: { letter: l, page: 1 } });
    },
    [navigate]
  );

  const changePage = useCallback(
    (p: number) => {
      setActivePage(p);
      navigate({ to: "/az", search: { letter: activeLetter, page: p } });
    },
    [navigate, activeLetter]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">A-Z List</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse all anime titles alphabetically from A to Z.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LETTERS.map((l) => (
          <button
            key={l}
            onClick={() => pick(l)}
            className={cn(
              "w-9 h-9 rounded-md text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
              activeLetter === l
                ? "bg-pink-500 text-black shadow-md shadow-pink-500/25"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Titles starting with &ldquo;{activeLetter}&rdquo;
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <PrimaryCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.animes.length ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {data.animes.map((anime, i) => (
                <PrimaryCard key={anime.id} anime={anime} index={i} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  disabled={activePage <= 1}
                  onClick={() => changePage(activePage - 1)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-muted text-muted-foreground hover:text-foreground border border-border"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {activePage} of {data.totalPages}
                </span>
                <button
                  disabled={activePage >= data.totalPages}
                  onClick={() => changePage(activePage + 1)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-muted text-muted-foreground hover:text-foreground border border-border"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No anime found starting with &ldquo;{activeLetter}&rdquo;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { AzListPage as Component };