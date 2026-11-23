import { createFileRoute } from "@tanstack/react-router";
import { SearchComponent } from "@/components/features/Search";

export const Route = createFileRoute("/discover/")({
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchComponent />
    </div>
  );
}