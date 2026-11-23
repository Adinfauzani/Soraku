import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { TrendingUp, ChevronLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PrimaryCard } from "@/components/features/home/PrimaryCard";
import { getPopularAnime } from "@/services/anime.service";
import type { Anime } from "@/services/anime.service";

export const Route = createFileRoute("/popular/")({
  component: PopularPage,
  loader: async () => {
    const data = await getPopularAnime(1);
    return data.filter(Boolean) as Anime[];
  },
});

function PopularPage() {
  const anime = Route.useLoaderData() as Anime[];

  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Popular</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            All-time most popular anime, sorted by popularity.
          </p>
        </div>

        {anime.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No popular anime</h3>
            <p className="text-muted-foreground">Check back later for new popular titles.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {anime.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <PrimaryCard anime={a} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </Container>
    </div>
  );
}