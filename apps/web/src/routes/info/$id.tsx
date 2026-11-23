import { createFileRoute } from "@tanstack/react-router";
import AnimeDetailPage from "@/components/anime/anime-detail-page";

export const Route = createFileRoute("/info/$id")({
  component: InfoPage,
  validateSearch: (search: Record<string, string | undefined>) => ({
    page: search.page,
  }),
});

function InfoPage() {
  const { id } = Route.useParams();
  const { page } = Route.useSearch();

  return <AnimeDetailPage id={id} page={page} />;
}
