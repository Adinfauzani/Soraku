export interface AnimeEntry {
  id: string;
  title: string;
  englishTitle?: string;
  romajiTitle?: string;
  nativeTitle?: string;
  image?: string;
  cover?: string;
  banner?: string;
  description?: string;
  genres?: string[];
  rating?: number;
  status?: string;
  type?: string;
  year?: number;
  season?: string;
  studios?: string[];
  totalEpisodes?: number;
  episodes?: EpisodeInfo[];
  nextAiringEpisode?: { episode: number; timeUntilAiring: number };
  trailer?: string;
  duration?: string;
  releaseDate?: string;
  endDate?: string;
  producers?: string[];
  licensors?: string[];
  ageRating?: string;
  ageRatingGuide?: string;
  artworks?: string[];
}

export interface EpisodeInfo {
  id: string;
  number: number;
  title?: string;
  image?: string;
  description?: string;
  releaseDate?: string;
  isSubbed?: boolean;
  isDubbed?: boolean;
  lang?: 'sub' | 'dub';
}

export interface StreamSource {
  url: string;
  quality: string;
  isM3U8?: boolean;
}

export interface Subtitle {
  url: string;
  lang: string;
}

export interface StreamResult {
  sources: StreamSource[];
  subtitles: Subtitle[];
  headers?: Record<string, string>;
}

export interface SearchResult {
  results: AnimeEntry[];
  totalPages?: number;
  hasNextPage?: boolean;
}

export interface StreamContext {
  anilistId?: string;
  title?: string;
  lang?: 'sub' | 'dub';
}

export interface Provider {
  readonly name: string;
  readonly type: 'global' | 'indonesian' | 'metadata';
  search(query: string, page?: number): Promise<SearchResult>;
  info(id: string): Promise<AnimeEntry | null>;
  infoFromTitle?(title: string, anilistId?: string): Promise<AnimeEntry | null>;
  stream?(episodeId: string, ctx?: StreamContext): Promise<StreamResult | null>;
  recent?(page?: number): Promise<SearchResult>;
  popular?(page?: number): Promise<SearchResult>;
  trending?(page?: number): Promise<SearchResult>;
  topRated?(page?: number): Promise<SearchResult>;
  health(): Promise<boolean>;
}
