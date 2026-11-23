import { cn } from "@/lib/utils";

interface FilterTabsProps {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function FilterTabs({ options, selected, onSelect, className }: FilterTabsProps) {
  return (
    <div role="tablist" aria-label="Anime filters" className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option, index) => (
        <button
          key={option}
          role="tab"
          aria-selected={selected === index}
          onClick={() => onSelect(index)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B79CFF]",
            selected === index
              ? "bg-[#7C3AED] text-white font-bold shadow-lg shadow-[#7C3AED]/25"
              : "bg-[#1E1E28] text-white/50 hover:text-white"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}