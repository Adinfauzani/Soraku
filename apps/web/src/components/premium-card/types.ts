export interface PremiumAnime {
  id: string;
  title: string;
  titleEnglish?: string;
  titleNative?: string;
  poster: string | null;
  cover?: string;
  banner?: string;
  description?: string;
  rating?: number;
  episodes?: number;
  totalEpisodes?: number;
  status: string;
  releaseDate?: string;
  year?: number;
  duration?: string;
  genres?: string[];
  studios?: string[];
  type?: string;
  season?: string;
  hasSub?: boolean;
  hasDub?: boolean;
  popularity?: number;
}

export interface PremiumEpisode {
  id: string;
  animeId: string;
  number: number;
  title?: string;
  image?: string;
  description?: string;
  isSubbed?: boolean;
  isDubbed?: boolean;
  progress?: number;
  remaining?: string;
}

export type CardVariant = "poster" | "episode" | "ranking" | "continue";
