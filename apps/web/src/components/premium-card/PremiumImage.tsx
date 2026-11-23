"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PremiumImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function PremiumImage({ src, alt, className }: PremiumImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(false);
  }, []);

  // Error state
  if (!src || error) {
    return (
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2",
        "bg-gradient-to-b from-white/[0.04] to-white/[0.01]",
        className
      )}>
        <svg className="w-8 h-8 text-white/[0.15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span className="text-[10px] text-white/[0.25] font-medium px-3 text-center leading-tight">
          Failed to load anime
        </span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRetry(); }}
          className="px-3 py-1 text-[10px] font-semibold rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/50 border border-white/[0.06] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Blur placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-white/[0.03]">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-xl scale-105"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
