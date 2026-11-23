import { Anime } from "@/services/anime.service";
import { PrimaryCard, PrimaryCardSkeleton } from "./PrimaryCard";
import { cn } from "@/lib/utils";

interface CardGridProps {
  anime: Anime[];
  isLoading?: boolean;
  skeletonCount?: number;
  className?: string;
  cardWidth?: "sm" | "md" | "lg";
}

export function CardGrid({
  anime,
  isLoading = false,
  skeletonCount = 6,
  className,
  cardWidth = "md",
}: CardGridProps) {
  const widthClass = {
    sm: "w-[120px] sm:w-[140px]",
    md: "w-[140px] sm:w-[160px] md:w-[180px]",
    lg: "w-[160px] sm:w-[180px] md:w-[200px]",
  }[cardWidth];

  if (isLoading) {
    return (
      <div className={cn("flex gap-4 overflow-x-auto pb-2 scrollbar-hide", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <PrimaryCardSkeleton key={i} className={widthClass} />
        ))}
      </div>
    );
  }

  if (anime.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No anime found.
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {anime.map((item) => (
        <PrimaryCard key={item.id} anime={item} className={widthClass} />
      ))}
    </div>
  );
}
