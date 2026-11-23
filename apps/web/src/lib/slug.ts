export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function animeUrl(id: string | number, title: string): string {
  return `/info/${id}/${slugify(title)}`;
}

export function watchUrl(id: string | number, title: string, episode?: number): string {
  const base = `/watch/${id}/${slugify(title)}`;
  return episode ? `${base}?ep=${episode}` : base;
}
