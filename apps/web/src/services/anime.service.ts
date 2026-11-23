export interface Anime {
  id: string;
  title: string;
  titleEnglish?: string;
  romajiTitle?: string;
  titleNative?: string;
  poster: string | null;
  image?: string;
  cover?: string;
  banner?: string;
  description?: string;
  rating?: number;
  episodes?: number;
  totalEpisodes?: number;
  status: "ONGOING" | "COMPLETED" | "UPCOMING";
  releaseDate?: string;
  endDate?: string;
  year?: number;
  duration?: string;
  genres?: string[];
  studios?: string[];
  producers?: string[];
  licensors?: string[];
  type?: string;
  season?: string;
  popularity?: number;
  hasSub?: boolean;
  hasDub?: boolean;
  trailer?: string;
  ageRating?: string;
  ageRatingGuide?: string;
  artworks?: string[];
}

export interface Episode {
  id: string;
  animeId: string;
  number: number;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  isSubbed?: boolean;
  isDubbed?: boolean;
  releaseDate?: string;
}

export interface AnimeSearchResult {
  animes: Anime[];
  totalPages: number;
  currentPage: number;
  hasNextPage?: boolean;
}

export interface EpisodeSource {
  sources: Array<{ url: string; quality: string; isM3U8?: boolean }>;
  subtitles: Array<{ url: string; label: string; lang?: string }>;
  headers?: Record<string, string>;
}

const KUROJI_API = "https://kuroji-api-j4mh.onrender.com/graphql";

function slugify(title: string): string {
  if (!title) return "";
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickImage(...candidates: Array<any>): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (c && typeof c === "object") {
      for (const k of ["large", "medium", "small", "extraLarge", "default"]) {
        if (typeof c[k] === "string" && c[k].trim()) return c[k];
      }
    }
  }
  return null;
}

function mapKurojiToAnime(item: any): Anime | null {
  if (!item || !item.id) return null;
  const title = item.title || {};
  const poster = item.poster || {};
  const statusMap: Record<string, Anime["status"]> = {
    FINISHED: "COMPLETED",
    RELEASING: "ONGOING",
    NOT_YET_RELEASED: "UPCOMING",
    CANCELLED: "COMPLETED",
    HIATUS: "ONGOING",
  };
  const posterUrl = pickImage(poster);
  return {
    id: String(item.id),
    title: title.romaji || title.english || title.native || "",
    titleEnglish: title.english || undefined,
    titleNative: title.native || undefined,
    poster: posterUrl,
    image: posterUrl || undefined,
    cover: posterUrl || undefined,
    banner: undefined,
    description: item.description || undefined,
    rating: item.averageScore ? Math.round(item.averageScore / 10) : undefined,
    episodes: item.episodes ?? undefined,
    totalEpisodes: item.episodes ?? undefined,
    status: statusMap[item.status] ?? "ONGOING",
    type: item.format ?? undefined,
    year: item.seasonYear ?? undefined,
    genres: item.genres ?? undefined,
    popularity: item.popularity ?? undefined,
  };
}

const BASE_FIELDS = "id title { romaji english native } poster { medium large } status format";

function animeListQuery(sort: string): string {
  return `query($page: Int, $perPage: Int) { animes(page: $page, per_page: $perPage, sort: ${sort}) { data { ${BASE_FIELDS} } } }`;
}

async function fetchWithFallback(
  primaryUrl: string,
  kurojiQuery: string,
  kurojiVars?: Record<string, unknown>
): Promise<Anime[]> {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return data?.results ?? data?.data ?? data?.anime ?? [];
  } catch {
    try {
      const res = await fetch(KUROJI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: kurojiQuery, variables: kurojiVars }),
      });
      if (!res.ok) return [];
const json = await res.json();
    const items = json.data?.animes?.results ?? json.data?.animes?.data ?? json.data?.animes ?? json.data?.anime ?? [];
      const animeList = Array.isArray(items) ? items.map(mapKurojiToAnime).filter((a): a is Anime => a !== null) : [];
      return animeList;
    } catch {
      return [];
    }
  }
}

export async function getAnimeById(id: string): Promise<Anime | null> {
  try {
    const res = await fetch(`/api/anime/${id}`);
    if (res.ok) {
      const data = await res.json();
      const raw = data.anime ?? data.data ?? data;
      return mapApiAnimeToAnime(raw);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAnimeRelated(id: string): Promise<Anime[]> {
  const urls = [`/api/anime/${id}/recommendations`, `/api/anime/${id}/relations`];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.data ?? data?.results ?? data?.nodes ?? [];
      if (Array.isArray(items) && items.length > 0) {
        return items
          .map((item: any) => {
            const node = item?.mediaRecommendation ?? item?.node ?? item ?? {};
            return mapApiAnimeToAnime(node);
          })
          .filter((a): a is Anime => a !== null);
      }
    } catch {
      continue;
    }
  }
  return [];
}

function mapApiAnimeToAnime(item: any): Anime | null {
  if (!item || (item.id == null && item.anilistId == null)) return null;
  const posterUrl = pickImage(item.posterImage?.large, item.posterImage?.medium, item.poster, item.image, item.coverImage?.large, item.cover);
  const statusMap: Record<string, Anime["status"]> = {
    ONGOING: "ONGOING",
    RELEASING: "ONGOING",
    current: "ONGOING",
    CURRENT: "ONGOING",
    COMPLETED: "COMPLETED",
    finished: "COMPLETED",
    FINISHED: "COMPLETED",
    UPCOMING: "UPCOMING",
    upcoming: "UPCOMING",
    UPCOMING_PLANNING: "UPCOMING",
  };
  return {
    id: String(item.id ?? item.anilistId),
title: item.title?.romaji || item.title?.english || item.title?.native || item.title || item.canonicalTitle || "",
    titleEnglish: item.title?.english || item.englishTitle || undefined,
    romajiTitle: item.title?.romaji || item.romajiTitle || undefined,
    titleNative: item.title?.native || item.nativeTitle || undefined,
    poster: posterUrl,
    image: posterUrl || undefined,
    cover: item.cover ?? item.banner ?? posterUrl ?? undefined,
    banner: item.banner ?? undefined,
    description: item.description || item.synopsis || undefined,
    rating: item.rating ?? (item.averageScore ? Math.round(item.averageScore / 10) : undefined) ?? (item.score ? Math.round(item.score) : undefined),
    episodes: item.episodes ?? item.totalEpisodes ?? undefined,
    totalEpisodes: item.totalEpisodes ?? item.episodes ?? undefined,
    status: statusMap[item.status] ?? (item.status ? "COMPLETED" : "COMPLETED"),
    type: item.type ?? item.format ?? undefined,
    year: item.year ?? item.seasonYear ?? undefined,
    genres: item.genres ?? undefined,
    season: item.season ?? undefined,
    studios: item.studios ?? undefined,
    producers: item.producers ?? undefined,
    licensors: item.licensors ?? undefined,
    trailer: item.trailer ?? undefined,
    ageRating: item.ageRating ?? undefined,
    ageRatingGuide: item.ageRatingGuide ?? undefined,
    artworks: item.artworks ?? undefined,
    endDate: item.endDate ?? undefined,
  };
}

export async function getAnimeEpisodes(id: string, server?: string, title?: string): Promise<Episode[]> {
  try {
    const params = new URLSearchParams();
    if (server) params.set("server", server);
    if (title) params.set("title", title);
    const slug = slugify(title || id);
    const res = await fetch(`/api/watch/${id}/${slug}/episodes?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const eps = data?.episodes ?? data?.data?.episodes ?? data?.data ?? data;
    return Array.isArray(eps) ? eps : [];
  } catch {
    return [];
  }
}

export async function getEpisodeSources(
  episodeId: string,
  server?: string,
  subOrDub?: string,
  animeId?: string,
  title?: string,
  ep = 1,
): Promise<EpisodeSource | null> {
  try {
    const params = new URLSearchParams({ ep: String(ep) });
    if (server && server !== "default") params.set("server", server);
    if (title) params.set("title", title);
    const slug = title ? slugify(title) : (animeId || "anime");
    const res = await fetch(`/api/watch/${animeId || "0"}/${slug}/episodes/${episodeId}?${params.toString()}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function searchAnime(
  query: string,
  page = 1,
  filters?: {
    genre?: string;
    year?: number;
    status?: string;
    type?: string;
    sort?: string;
    min_score?: number;
  }
): Promise<AnimeSearchResult> {
  try {
    const hasFilters = !!filters && Object.values(filters).some((v) => Boolean(v));

    if (hasFilters) {
      const params = new URLSearchParams({ page: String(page) });
      if (filters?.genre) params.set("genre", filters.genre);
      if (filters?.year) params.set("year", String(filters.year));
      if (filters?.status) {
      const statusMap: Record<string, string> = {
        Ongoing: "currently_releasing",
        Completed: "finished",
        Upcoming: "upcoming",
      };
      params.set("status", statusMap[filters.status] ?? filters.status);
    }
      if (filters?.type) {
      const typeMap: Record<string, string> = {
        TV: "tv",
        Movie: "movie",
        OVA: "ova",
        Special: "special",
        ONA: "ona",
        Music: "music",
      };
      params.set("type", typeMap[filters.type] ?? filters.type);
    }
      if (filters?.sort) {
      const sortMap: Record<string, string> = {
        "Most Popular": "bypopularity",
        "Top Rated": "byscore",
        Airing: "airing",
        Upcoming: "upcoming",
      };
      params.set("sort", sortMap[filters.sort] ?? filters.sort);
    }
      if (filters?.min_score) params.set("min_score", String(filters.min_score));
      const res = await fetch(`/api/search/filter?${params}`);
      if (!res.ok) return { animes: [], totalPages: 0, currentPage: page };
      const data = await res.json();
      const animes = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
      return { animes, totalPages: Math.ceil(animes.length / 20) || 1, currentPage: page };
    }

    const params = new URLSearchParams({ query, page: String(page) });
    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) return { animes: [], totalPages: 0, currentPage: page };
    const data = await res.json();
    const animes = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
    return { animes, totalPages: Math.ceil(animes.length / 20) || 1, currentPage: page };
  } catch {
    return { animes: [], totalPages: 0, currentPage: page };
  }
}

export async function getTrendingAnime(page = 1): Promise<Anime[]> {
  return fetchWithFallback(
    `/api/trending?page=${page}`,
    animeListQuery("TRENDING_DESC"),
    { page, per_page: 20 }
  ).catch(() => []);
}

export async function getPopularAnime(page = 1, year?: number): Promise<Anime[]> {
  return fetchWithFallback(
    `/api/popular?page=${page}${year ? `&year=${year}` : ""}`,
    animeListQuery("POPULARITY_DESC"),
    { page, per_page: 20 }
  ).catch(() => []);
}

export async function getTopRatedAnime(page = 1, year?: number): Promise<Anime[]> {
  return fetchWithFallback(
    `/api/top-rated?page=${page}${year ? `&year=${year}` : ""}`,
    animeListQuery("SCORE_DESC"),
    { page, per_page: 20 }
  ).catch(() => []);
}

export async function getAiringAnime(page = 1): Promise<Anime[]> {
  return fetchWithFallback(
    `/api/upcoming?page=${page}`,
    animeListQuery("EPISODES_DESC"),
    { page, per_page: 20 }
  ).catch(() => []);
}

export async function getSeasonalAnime(page = 1): Promise<Anime[]> {
  return fetchWithFallback(
    `/api/seasonal?page=${page}`,
    animeListQuery("TRENDING_DESC"),
    { page, per_page: 20 }
  ).catch(() => []);
}

export async function getRecentAnime(page = 1): Promise<Anime[]> {
  return fetchWithFallback(
    `/api/recent?page=${page}`,
    animeListQuery("TRENDING_DESC"),
    { page, per_page: 20 }
  ).catch(() => []);
}

/** Stable slug for a genre name (e.g. "Sci-Fi" -> "sci-fi", "Slice of Life" -> "slice-of-life"). */
export function genreSlug(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, "-");
}

/** Reverse of genreSlug — maps a slug back to the canonical genre name. */
export function genreFromSlug(slug: string): string | null {
  const all = getGenres();
  const bySlug = new Map(all.map((g: string) => [genreSlug(g), g]));
  return bySlug.get(slug) ?? null;
}

export function getGenres(): string[] {
  return [
    "Action",
    "Adventure",
    "Cars",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Mecha",
    "Music",
    "Mystery",
    "Psychological",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
  ];
}