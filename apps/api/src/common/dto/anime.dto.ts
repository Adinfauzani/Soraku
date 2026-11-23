export class AnimeDTO {
  id: string;
  title: string;
  englishTitle?: string;
  romajiTitle?: string;
  nativeTitle?: string;
  image?: string;
  poster?: string;
  banner?: string;
  cover?: string;
  description?: string;
  genres?: string[];
  rating?: number;
  episodes?: number;
  totalEpisodes?: number;
  status?: string;
  type?: string;
  season?: string;
  year?: number;
  studios?: string[];
  producers?: string[];
  licensors?: string[];
  duration?: string;
  trailer?: string;
  source?: string;
  countryOfOrigin?: string;
  releaseDate?: string;
  endDate?: string;
  ageRating?: string;
  ageRatingGuide?: string;
  artworks?: string[];
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  };
}

export class EpisodeDTO {
  id: string;
  number: number;
  title?: string;
  image?: string;
  isSubbed?: boolean;
  isDubbed?: boolean;
  releaseDate?: string;
  duration?: number;
}

export class SearchResultDTO {
  animes: AnimeDTO[];
  totalPages: number;
  currentPage: number;
  hasNextPage?: boolean;
}

export class StreamSourceDTO {
  url: string;
  quality: string;
  isM3U8?: boolean;
}

export class SubtitleDTO {
  url: string;
  lang: string;
  label?: string;
}

export class StreamResultDTO {
  sources: StreamSourceDTO[];
  subtitles: SubtitleDTO[];
  headers?: Record<string, string>;
}
