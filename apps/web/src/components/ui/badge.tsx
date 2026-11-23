import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        secondary: "bg-muted-foreground/20 text-foreground",
        destructive: "bg-red-500/90 text-white",
        accent: "bg-primary text-background",
        outline: "border border-muted-foreground/30 text-foreground",
        airing: "badge-airing",
        completed: "bg-muted-foreground/30 text-foreground",
        upcoming: "bg-primary/20 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };