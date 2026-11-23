import { Injectable, Inject } from '@nestjs/common';
import { CacheService } from '../../common/cache.service';
import { AnilistClient } from './anilist.client';
import { AnimeDTO } from '../../common/dto/anime.dto';
import { ANIME_INFO, CHARACTERS } from './queries/anime.query';
import { TRENDING, POPULAR, TOP_RATED, AIRING, RECENT, SEASONAL } from './queries/trending.query';
import { SEARCH, FILTER } from './queries/search.query';
import { SCHEDULE } from './queries/schedule.query';

const CACHE_PREFIX = 'anilist:';
const TTL_TRENDING = 10 * 60 * 1000;
const TTL_POPULAR = 10 * 60 * 1000;
const TTL_DETAIL = 6 * 60 * 60 * 1000;
const TTL_CHARACTERS = 24 * 60 * 60 * 1000;
const TTL_SCHEDULE = 30 * 60 * 1000;
const TTL_RECOMMENDATIONS = 12 * 60 * 60 * 1000;
const TTL_SEARCH = 15 * 60 * 1000;

interface Media {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  coverImage?: { large?: string };
  bannerImage?: string;
  description?: string;
  genres?: string[];
  averageScore?: number;
  status?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
  episodes?: number;
  duration?: number;
  source?: string;
  countryOfOrigin?: string;
  hashtag?: string;
  trailer?: { id?: string; site?: string; thumbnail?: string };
  studios?: { nodes: { name: string }[] };
  nextAiringEpisode?: { episode: number; timeUntilAiring: number; airingAt: number };
  relations?: { edges: any[] };
  recommendations?: { nodes: any[] };
}

function toDTO(m: Media): AnimeDTO {
  return {
    id: String(m.id),
    title: m.title?.english || m.title?.romaji || '',
    englishTitle: m.title?.english,
    nativeTitle: m.title?.native,
    image: m.coverImage?.large,
    banner: m.bannerImage,
    description: m.description?.replace(/<[^>]*>/g, '').trim(),
    genres: m.genres,
    rating: m.averageScore ? m.averageScore / 10 : undefined,
    status: m.status,
    type: m.format,
    totalEpisodes: m.episodes ?? undefined,
    episodes: m.episodes ?? undefined,
    year: m.seasonYear,
    season: m.season,
    duration: m.duration ? String(m.duration) : undefined,
    source: m.source?.replace(/_/g, ' '),
    countryOfOrigin: m.countryOfOrigin,
    trailer: m.trailer?.id && m.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${m.trailer.id}` : undefined,
    studios: m.studios?.nodes?.map((n) => n.name),
    nextAiringEpisode: m.nextAiringEpisode
      ? { episode: m.nextAiringEpisode.episode, airingAt: m.nextAiringEpisode.airingAt, timeUntilAiring: m.nextAiringEpisode.timeUntilAiring }
      : undefined,
  };
}

@Injectable()
export class AnilistService {
  constructor(
    private readonly client: AnilistClient,
    private readonly cache: CacheService,
  ) {}

  async getInfo(anilistId: string): Promise<AnimeDTO | null> {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) return null;

    const cacheKey = `${CACHE_PREFIX}info:${id}`;
    const cached = await this.cache.get<AnimeDTO>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Media: Media }>(ANIME_INFO, { id });
    if (!result?.Media) return null;

    const dto = toDTO(result.Media);
    await this.cache.set(cacheKey, dto, TTL_DETAIL);
    return dto;
  }

  async getCharacters(anilistId: string): Promise<any[]> {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) return [];

    const cacheKey = `${CACHE_PREFIX}characters:${id}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Media: { characters: { edges: any[] } } }>(CHARACTERS, { id, page: 1, perPage: 50 });
    const edges = result?.Media?.characters?.edges ?? [];
    const items = edges.map((e: any) => ({
      id: e?.node?.id,
      name: e?.node?.name?.full,
      image: e?.node?.image?.large,
      role: e?.role,
      voiceActors: (e?.voiceActors ?? []).map((va: any) => ({
        name: va?.name?.full,
        image: va?.image?.large,
        language: va?.language,
      })),
    }));
    await this.cache.set(cacheKey, items, TTL_CHARACTERS);
    return items;
  }

  async getTrending(page = 1, perPage = 20): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}trending:${page}:${perPage}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Page: { media: Media[] } }>(TRENDING, { page, perPage });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_TRENDING);
    return items;
  }

  async getPopular(page = 1, perPage = 20): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}popular:${page}:${perPage}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Page: { media: Media[] } }>(POPULAR, { page, perPage });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_POPULAR);
    return items;
  }

  async getTopRated(page = 1, perPage = 20): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}topRated:${page}:${perPage}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Page: { media: Media[] } }>(TOP_RATED, { page, perPage });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_DETAIL);
    return items;
  }

  async getAiring(page = 1, perPage = 20): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}airing:${page}:${perPage}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Page: { media: Media[] } }>(AIRING, { page, perPage });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_SCHEDULE);
    return items;
  }

  async getRecent(page = 1, perPage = 20): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}recent:${page}:${perPage}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Page: { media: Media[] } }>(RECENT, { page, perPage });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_SEARCH);
    return items;
  }

  async getSeasonal(page = 1, perPage = 20, season?: string, seasonYear?: number): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}seasonal:${page}:${perPage}:${season ?? ''}:${seasonYear ?? ''}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const s = season || ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(now.getMonth() / 3)];
    const y = seasonYear || now.getFullYear();
    const result = await this.client.query<{ Page: { media: Media[] } }>(SEASONAL, { page, perPage, season: s, seasonYear: y });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_DETAIL);
    return items;
  }

  async search(query: string, page = 1, perPage = 20): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}search:${query}:${page}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Page: { media: Media[] } }>(SEARCH, { q: query, page, perPage });
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_SEARCH);
    return items;
  }

  async filter(page = 1, perPage = 20, opts: Record<string, any> = {}): Promise<AnimeDTO[]> {
    const cacheKey = `${CACHE_PREFIX}filter:${page}:${perPage}:${JSON.stringify(opts)}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const variables: Record<string, any> = { page, perPage };
    if (opts.season) variables.season = opts.season;
    if (opts.seasonYear) variables.seasonYear = parseInt(opts.seasonYear);
    if (opts.status) variables.status = opts.status;
    if (opts.format) variables.format = opts.format;
    if (opts.genre) variables.genre = opts.genre;
    if (opts.sort) variables.sort = opts.sort;

    const result = await this.client.query<{ Page: { media: Media[] } }>(FILTER, variables);
    const items = (result?.Page?.media ?? []).map(toDTO);
    await this.cache.set(cacheKey, items, TTL_SEARCH);
    return items;
  }

  async getRelations(anilistId: string): Promise<any[]> {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) return [];

    const cacheKey = `${CACHE_PREFIX}relations:${id}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Media: Media }>(ANIME_INFO, { id });
    const edges = result?.Media?.relations?.edges ?? [];
    const items: any[] = edges
      .filter((e: any) => e.node && !e.node.isAdult)
      .map((e: any) => ({
        id: e.node.id,
        title: e.node.title?.english || e.node.title?.romaji || '',
        coverImage: e.node.coverImage?.large,
        format: e.node.format,
        relationType: e.relationType,
        status: e.node.status,
        episodes: e.node.episodes,
      }));
    await this.cache.set(cacheKey, items, TTL_DETAIL);
    return items;
  }

  async getRecommendations(anilistId: string): Promise<AnimeDTO[]> {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) return [];

    const cacheKey = `${CACHE_PREFIX}recommendations:${id}`;
    const cached = await this.cache.get<AnimeDTO[]>(cacheKey);
    if (cached) return cached;

    const result = await this.client.query<{ Media: Media }>(ANIME_INFO, { id });
    const nodes = result?.Media?.recommendations?.nodes ?? [];
    const items: AnimeDTO[] = nodes
      .filter((n: any) => n.mediaRecommendation && !n.mediaRecommendation.isAdult)
      .map((n: any) => toDTO(n.mediaRecommendation));
    await this.cache.set(cacheKey, items, TTL_RECOMMENDATIONS);
    return items;
  }

  async getSpotlight(count = 5): Promise<AnimeDTO[]> {
    const trending = await this.getTrending(1, count);
    return trending.slice(0, count);
  }

  async health(): Promise<boolean> {
    return this.client.health();
  }
}
