export interface Env {
  ORIGIN_API_URL: string
  ORIGIN_WEB_URL: string
  DEFAULT_SUBTITLE_LANG: string
  CACHE_TTL_IMAGE: string
  CACHE_TTL_API: string
  CACHE_TTL_STREAM: string
}

export interface ImageProxyRequest {
  path: string
}

export interface SubtitleProxyRequest {
  path: string
}

export interface StreamProxyRequest {
  path: string
}

export interface AnimeInfoRequest {
  animeId: string
  slug: string
}

export interface AnimeWatchRequest {
  animeId: string
  slug: string
  episode?: string
}

export interface ProviderUrls {
  samehadaku: string
  oploverz: string
  otakudesu: string
  hianime: string
  animekai: string
  kuramanime: string
  anoboy: string
}
