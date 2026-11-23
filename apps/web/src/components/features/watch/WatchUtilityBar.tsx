import {
  SkipForward,
  ListChecks,
  Keyboard,
  Moon,
  MonitorPlay,
  Play,
  Pause,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORE_KEY = "soraku:watch:prefs";

interface WatchPrefs {
  autoplay: boolean;
  autoSkip: boolean;
  autoNext: boolean;
}

const DEFAULT_PREFS: WatchPrefs = {
  autoplay: true,
  autoSkip: false,
  autoNext: true,
};

function loadPrefs(): WatchPrefs {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

interface WatchUtilityBarProps {
  currentEpisodeNumber: number;
  hasNext: boolean;
  hasPrev: boolean;
  hasSubtitles: boolean;
  isSkipAvailable: boolean;
  skipSeconds?: number | null;
  introSkipSeconds: number;
  onSeekBy: (seconds: number) => void;
  onToggleFullscreen: () => void;
  onToggleLightsOut: () => void;
  onPrev: () => void;
  onNext: () => void;
}

interface ShortcutDef {
  key: string;
  label: string;
  description: string;
}

const SHORTCUTS: ShortcutDef[] = [
  { key: "Space", label: "Play / Pause", description: "Toggle playback" },
  { key: "←/→", label: "Seek 10s", description: "Rewind / forward 10 seconds" },
  { key: "↑/↓", label: "Volume", description: "Adjust volume" },
  { key: "F", label: "Fullscreen", description: "Toggle fullscreen" },
];

export function WatchUtilityBar({
  currentEpisodeNumber,
  hasNext,
  hasPrev,
  hasSubtitles,
  isSkipAvailable,
  skipSeconds,
  introSkipSeconds,
  onSeekBy,
  onToggleFullscreen,
  onToggleLightsOut,
  onPrev,
  onNext,
}: WatchUtilityBarProps) {
  const [prefs, setPrefs] = useState<WatchPrefs>(loadPrefs);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!showShortcuts) return;
    const onClick = (e: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) {
        setShowShortcuts(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setShowShortcuts(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showShortcuts]);

  const toggle = (key: keyof WatchPrefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const utilityButton =
    "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full text-xs font-medium transition-colors border-0 bg-transparent hover:bg-white/[0.08] text-white/80";

  return (
    <div className="mt-3 flex w-fit flex-wrap items-center overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.03] divide-x divide-white/[0.08]">
      {/* Autoplay */}
      <button
        type="button"
        className={cn(
          utilityButton,
          prefs.autoplay ? "text-primary" : "text-white/40"
        )}
        onClick={() => toggle("autoplay")}
        aria-pressed={prefs.autoplay}
        title="Autoplay — play next episode automatically when available"
      >
        <MonitorPlay className="h-3.5 w-3.5" />
        Autoplay
        <span
          aria-hidden
          className={cn(
            "relative h-4 w-7 rounded-full border transition-colors",
            prefs.autoplay ? "border-primary/40 bg-primary/20" : "border-white/10 bg-white/[0.06]"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all",
              prefs.autoplay ? "left-[18px] bg-primary" : "left-0.5 bg-white/40"
            )}
          />
        </span>
      </button>

      {/* Auto Skip */}
      <button
        type="button"
        className={cn(
          utilityButton,
          prefs.autoSkip ? "text-primary" : "text-white/40",
          !isSkipAvailable && "opacity-40 cursor-not-allowed"
        )}
        disabled={!isSkipAvailable}
        onClick={() => toggle("autoSkip")}
        aria-pressed={prefs.autoSkip}
        title={
          isSkipAvailable
            ? "Auto Skip — skip intro/recap automatically when timestamps are known"
            : "Auto Skip — not available for this episode (no skip metadata)"
        }
      >
        <SkipForward className="h-3.5 w-3.5" />
        Auto Skip
      </button>

      {/* Auto Next */}
      <button
        type="button"
        className={cn(
          utilityButton,
          prefs.autoNext ? "text-primary" : "text-white/40"
        )}
        onClick={() => toggle("autoNext")}
        aria-pressed={prefs.autoNext}
        title="Auto Next — jump to the next episode when the current one ends"
      >
        <Zap className="h-3.5 w-3.5" />
        Auto Next
        <span
          aria-hidden
          className={cn(
            "relative h-4 w-7 rounded-full border transition-colors",
            prefs.autoNext ? "border-primary/40 bg-primary/20" : "border-white/10 bg-white/[0.06]"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all",
              prefs.autoNext ? "left-[18px] bg-primary" : "left-0.5 bg-white/40"
            )}
          />
        </span>
      </button>

      {/* Shortcuts */}
      <div className="relative">
        <button
          type="button"
          className={cn(utilityButton, "text-white/60")}
          onClick={() => setShowShortcuts((v) => !v)}
          aria-expanded={showShortcuts}
          aria-haspopup="dialog"
        >
          <Keyboard className="h-3.5 w-3.5" />
          Shortcuts
        </button>
        {showShortcuts && (
          <div
            ref={shortcutsRef}
            role="dialog"
            aria-label="Keyboard shortcuts"
            className="absolute bottom-full right-0 mb-2 z-50 w-72 rounded-xl border border-white/[0.08] bg-[#121218] p-1 shadow-2xl"
          >
            <div className="px-3 py-2 text-xs font-semibold text-white/70">
              Keyboard Shortcuts
            </div>
            <div className="flex flex-col gap-0.5">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/[0.03]"
                >
                  <kbd className="shrink-0 rounded-md border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-white/60">
                    {s.key}
                  </kbd>
                  <span className="text-xs text-white/70">{s.label}</span>
                  <span className="ml-auto text-[10px] text-white/30">
                    {s.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lights Off */}
      <button
        type="button"
        className={cn(utilityButton, "text-white/60")}
        onClick={onToggleLightsOut}
        title="Lights Off — dim the page, keep the player focused"
      >
        <Moon className="h-3.5 w-3.5" />
        Lights Off
      </button>

      {/* Player indicator: HANYA Plyr yg diimplementasikan nyata (Vidstack=0, hls.js=protokol bukan player).
          Spek player-selector: kalau satu player → tampilkan sbg INDIKATOR kompak, JANGAN dropdown palsu. */}
      <span
        className={cn(utilityButton, "cursor-default text-white/80")}
        title="Plyr — satu-satunya player Soraku. HLS dijalankan Plyr via hls.js (protokol streaming, bukan player)."
      >
        <Play className="h-3.5 w-3.5" />
        Plyr
      </span>

      {/* Prev Eps */}
      <button
        type="button"
        className={cn(utilityButton, "text-white/60")}
        onClick={onPrev}
        title="Previous episode"
        disabled={!hasPrev}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Prev Eps
      </button>

      {/* Next Eps */}
      <button
        type="button"
        className={cn(utilityButton, "text-white/60")}
        onClick={onNext}
        title="Next episode"
        disabled={!hasNext}
      >
        <ChevronRight className="h-3.5 w-3.5" />
        Next Eps
      </button>

    </div>
  );
}
