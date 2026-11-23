import { createFileRoute, redirect } from "@tanstack/react-router";
import { GenreExplorer } from "@/components/features/home/GenreExplorer";
import { Container } from "@/components/layout/container";

export const Route = createFileRoute("/genre/")({
  component: GenrePage,
});

function GenrePage() {
  return (
    <Container>
      <div className="py-8">
        <GenreExplorer />
      </div>
    </Container>
  );
}
