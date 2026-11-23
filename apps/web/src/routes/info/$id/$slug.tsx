import { createFileRoute } from "@tanstack/react-router";
import AnimeDetailPage from "@/components/anime/anime-detail-page";

export const Route = createFileRoute("/info/$id/$slug")({
  component: InfoSlugPage,
  validateSearch: (search: Record<string, string | undefined>) => ({
    page: search.page,
  }),
});

function InfoSlugPage() {
  const { id, slug } = Route.useParams();
  const { page } = Route.useSearch();

  return <AnimeDetailPage id={id} slug={slug} page={page} />;
}
