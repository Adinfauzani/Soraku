import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface SectionProps {
  title: string;
  seeAllLink?: string;
  seeAllLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  seeAllLink,
  seeAllLabel = "See all",
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
        {seeAllLink && (
          <Link
            to={seeAllLink}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap no-scale"
          >
            {seeAllLabel} ›
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}