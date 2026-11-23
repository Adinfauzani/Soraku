import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { SearchComponent } from "@/components/features/Search";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<SearchLoading />}>
        <SearchComponent />
      </Suspense>
    </div>
  );
}
