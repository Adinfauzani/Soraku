import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Film, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PremiumPosterCard } from "@/components/premium-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchAnime, genreFromSlug, type AnimeSearchResult } from "@/services/anime.service";

export const Route = createFileRoute("/genre/$slug")({
  component: GenrePage,
});

function GenreSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function GenrePage() {
  const { slug } = Route.useParams();
  const genreName = genreFromSlug(slug) ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const [data, setData] = useState<AnimeSearchResult | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);

    searchAnime("", page, { genre: genreName })
      .then((result) => {
        setData(result);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [genreName, page]);

  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {genreName} Anime
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Browse all anime in the {genreName} genre
          </p>
        </div>

        {isLoading ? (
          <GenreSkeleton />
        ) : error ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Failed to load anime
            </h3>
            <p className="text-muted-foreground mb-6">
              Something went wrong. Please try again.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setPage(1);
                setIsLoading(true);
                setError(false);
                searchAnime("", 1, { genre: genreName })
                  .then(setData)
                  .catch(() => setError(true))
                  .finally(() => setIsLoading(false));
              }}
            >
              Try Again
            </Button>
          </div>
        ) : data?.animes.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No anime found
            </h3>
            <p className="text-muted-foreground">
              No results for the &ldquo;{genreName}&rdquo; genre.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {data?.animes.map((anime, index) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <PremiumPosterCard anime={anime} />
                </motion.div>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
