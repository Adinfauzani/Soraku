"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SmartImageProps {
  src?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  placeholderClassName?: string;
  priority?: boolean;
  sizes?: string;
}

export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  placeholderClassName,
  priority,
  sizes,
}: SmartImageProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">(src ? "loading" : "error");

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {state !== "ready" && (
        <div
          className={cn(
            "absolute inset-0",
            "skeleton-shimmer bg-[linear-gradient(110deg,transparent,var(--muted))] opacity-60",
            placeholderClassName
          )}
        />
      )}
      {src && (
        <img
          src={src}
          alt={alt ?? ""}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          referrerPolicy="no-referrer"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            "transition-[opacity,filter,transform] duration-700 ease-out",
            state === "ready"
              ? "opacity-100 blur-0 scale-100"
              : "opacity-0 blur-[6px] scale-[1.02]",
            imgClassName
          )}
        />
      )}
    </div>
  );
}