"use client";

import { cn } from "@/lib/utils";

interface Props {
  variant?: "poster" | "episode" | "ranking" | "continue";
}

export function PremiumCardSkeleton({ variant = "poster" }: Props) {
  if (variant === "episode") {
    return (
      <div className="rounded-[18px] overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        <div className="aspect-video bg-white/[0.04] relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="p-3 space-y-2">
          <div className="h-3 bg-white/[0.06] rounded w-3/4 relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
          <div className="h-2 bg-white/[0.04] rounded w-1/2 relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "continue") {
    return (
      <div className="rounded-[18px] overflow-hidden bg-white/[0.03] border border-white/[0.06]">
        <div className="aspect-video bg-white/[0.04] relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="p-3 space-y-2">
          <div className="h-3 bg-white/[0.06] rounded w-3/4 relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
          <div className="h-4 bg-white/[0.04] rounded w-1/3 relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] overflow-hidden bg-white/[0.03] border border-white/[0.06] aspect-[2/3] relative">
      {/* Poster shimmer */}
      <div className="absolute inset-0 skeleton-shimmer" />

      {/* Score badge shimmer */}
      <div className="absolute top-2 left-2 z-10">
        <div className="w-12 h-5 rounded-lg bg-white/[0.06] skeleton-shimmer" />
      </div>

      {/* Format badge shimmer */}
      <div className="absolute top-2 right-2 z-10">
        <div className="w-10 h-5 rounded-lg bg-white/[0.06] skeleton-shimmer" />
      </div>

      {/* Meta bar shimmer */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-white/[0.06] skeleton-shimmer" />
          <div className="w-8 h-3 rounded bg-white/[0.06] skeleton-shimmer" />
          <div className="w-10 h-3 rounded bg-white/[0.06] skeleton-shimmer ml-auto" />
        </div>
      </div>
    </div>
  );
}
