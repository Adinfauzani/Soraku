import type { Anime } from "@/services/anime.service";

export function titleFor(anime: Anime): string {
  return anime.titleEnglish || anime.titleNative || anime.title;
}

/** Deterministic per-anime accent color (covers the missing coverImage.color). */
export function customColorFor(anime: { title?: string | null; id?: string }): string {
  const seed = (anime.title || anime.id || "soraku").toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash) % 360;
  const s = 62 + (Math.abs(hash >> 4) % 22); // 62..83%
  const l = 44 + (Math.abs(hash >> 8) % 18); // 44..61%
  return `hsl(${h} ${s}% ${l}%)`;
}

const FORMAT_COLORS: Record<string, string> = {
  MOVIE: "#3DB4F2",
  OVA: "#3BAEEA",
  ONA: "#F7A063",
  SPECIAL: "#FA7A7A",
};

export function formatColor(type?: string): string {
  if (!type) return "#7BD555";
  return FORMAT_COLORS[type.toUpperCase()] ?? "#7BD555";
}

export function statusMeta(status: Anime["status"]): { label: string; color: string } {
  switch (status) {
    case "ONGOING":
      return { label: "AIRING", color: "#7BD555" };
    case "COMPLETED":
      return { label: "END", color: "#8A8A8A" };
    default:
      return { label: "UPCOMING", color: "#3DB4F2" };
  }
}