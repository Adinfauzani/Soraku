import { createFileRoute } from "@tanstack/react-router";
import AnimeDetailPage from "@/components/anime/anime-detail-page";

export const Route = createFileRoute("/anime/$id")({
  component: AnimePage,
  validateSearch: (search: Record<string, string>) => ({
    page: search.page || "1",
  }),
});

function AnimePage() {
  const { id } = Route.useParams();
  const { page } = Route.useSearch();

  return <AnimeDetailPage id={id} page={page} basePath="anime" />;
}
