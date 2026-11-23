export function normalizeEpisode(value: unknown, fallback = 1): number {
  if (value == null) return fallback;

  let raw: string;
  if (typeof value === "number") {
    raw = String(value);
  } else if (typeof value === "string") {
    raw = value.trim();
    if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1).trim();
    }
  } else {
    return fallback;
  }

  if (raw === "+" || raw === "-" || raw === "") return fallback;

  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1) return n;
  return fallback;
}