import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AnimeEntry, EpisodeInfo, Provider, SearchResult } from './types';

const KITSU_API = 'https://kitsu.io/api/edge';

const MAL_GALLERY_CACHE = new Map<string, { at: number; artworks: string[] }>();
const MAL_GALLERY_TTL = 6 * 60 * 60 * 1000;

const KITSU_EPISODES_CACHE = new Map<string, { at: number; episodes: EpisodeInfo[] }>();
const KITSU_EPISODES_TTL = 24 * 60 * 60 * 1000;

interface KitsuAttributes {
  slug?: string;
  canonicalTitle?: string;
  synopsis?: string;
  description?: string;
  titles?: { en_jp?: string; ja_jp?: string };
  posterImage?: { large?: string; medium?: string; small?: string };
  coverImage?: { large?: string };
  averageRating?: string;
  status?: string;
  subtype?: string;
  showType?: string;
  episodeCount?: number;
  episodeLength?: number;
  startDate?: string;
  endDate?: string;
  popularityRank?: number;
  genres?: string[];
  ageRating?: string;
  ageRatingGuide?: string;
  youtubeVideoId?: string;
}

interface KitsuItem {
  id: string;
  type?: string;
  attributes: KitsuAttributes;
}

function kitsuSeason(month: number): string {
  if (month <= 2) return 'WINTER';
  if (month <= 5) return 'SPRING';
  if (month <= 8) return 'SUMMER';
  return 'FALL';
}

@Injectable()
export class Kitsu implements Provider {
  readonly name = 'Kitsu';
  readonly type = 'metadata' as const;

  private readonly logger = new Logger(Kitsu.name);

  private get http() {
    return axios.create({
      baseURL: KITSU_API,
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/vnd.api+json' },
    });
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    try {
      const { data } = await this.http.get('/anime', {
        params: { 'filter[text]': query, 'page[limit]': 20, 'page[number]': page, include: 'categories' },
      });
      return { results: ((data.data || []) as KitsuItem[]).map((it) => this.toEntry(it)), hasNextPage: false };
    } catch (e) {
      this.logger.warn(`search failed: ${(e as Error).message}`);
      return { results: [] };
    }
  }

  async info(id: string): Promise<AnimeEntry | null> {
    try {
      const isNumeric = /^\d+$/.test(id);
      const { data } = isNumeric
        ? await this.http.get(`/anime/${id}`, { params: { include: 'categories' } })
        : await this.http.get('/anime', { params: { 'filter[slug]': id, include: 'categories' } });
      const item = isNumeric ? data.data : (data.data || [])[0];
      if (!item) return null;

      const genres = (data.included || [])
        .filter((i: any) => i.type === 'categories')
        .map((c: any) => c.attributes?.title || c.attributes?.name);

      const productions = await this.fetchProductions(isNumeric ? id : String(item.id));

      const detail = this.toDetail(item);
      if (genres.length) detail.genres = genres;
      if (productions.studios.length) detail.studios = productions.studios;
      if (productions.producers.length) detail.producers = productions.producers;
      if (productions.licensors.length) detail.licensors = productions.licensors;
      detail.artworks = await this.fetchGallery(isNumeric ? id : String(item.id));
      return detail;
    } catch (e) {
      this.logger.warn(`info failed: ${(e as Error).message}`);
      return null;
    }
  }

  private async fetchMappings(animeId: string): Promise<Array<{ externalSite: string; externalId: string }>> {
    try {
      const { data } = await this.http.get(`/anime/${animeId}/mappings`, { params: { 'page[limit]': 20 } });
      return ((data.data || []) as Array<{ attributes?: { externalSite?: string; externalId?: string } }>).map((m) => ({
        externalSite: m.attributes?.externalSite ?? '',
        externalId: m.attributes?.externalId ?? '',
      }));
    } catch (e) {
      this.logger.warn(`fetchMappings failed: ${(e as Error).message}`);
      return [];
    }
  }

  private async fetchGallery(animeId: string): Promise<string[]> {
    if (!/^\d+$/.test(animeId)) return [];
    const cached = MAL_GALLERY_CACHE.get(animeId);
    if (cached && Date.now() - cached.at < MAL_GALLERY_TTL) return cached.artworks;

    const mappings = await this.fetchMappings(animeId);
    const mal = mappings.find((m) => m.externalSite === 'myanimelist/anime');
    if (!mal) return [];

    try {
      const { data } = await axios.get(`https://myanimelist.net/anime/${mal.externalId}/_/pics`, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
      });
      const matched = (data as string).match(/https:\/\/cdn\.myanimelist\.net\/images\/anime\/\d+\/\d+l\.(?:jpg|png)/g);
      const urls = [...new Set<string>(matched || [])];
      if (urls.length) MAL_GALLERY_CACHE.set(animeId, { at: Date.now(), artworks: urls });
      return urls;
    } catch (e) {
      this.logger.warn(`fetchGallery failed: ${(e as Error).message}`);
      return [];
    }
  }

  async episodes(animeId: string): Promise<EpisodeInfo[]> {
    try {
      const numericId = await this.resolveNumericId(animeId);
      if (!numericId) return [];
      const cached = KITSU_EPISODES_CACHE.get(numericId);
      if (cached && Date.now() - cached.at < KITSU_EPISODES_TTL) return cached.episodes;
      const results: EpisodeInfo[] = [];
      let page = 1;
      let guard = 0;
      while (guard++ < 30) {
        const { data } = await this.http.get(`/anime/${numericId}/episodes`, {
          params: { sort: 'number', 'page[limit]': 20, 'page[number]': page },
        });
        const batch = ((data.data || []) as any[]).map((ep) => {
          const a = ep.attributes || {};
          return {
            id: String(ep.id),
            number: a.number ?? 0,
            title: a.canonicalTitle?.trim(),
            image: a.thumbnail?.original || a.thumbnail?.large,
            description: (a.synopsis || a.description)?.trim(),
            releaseDate: a.airdate ?? undefined,
          };
        });
        if (!batch.length) break;
        results.push(...batch);
        if (batch.length < 20) break;
        page += 1;
      }
      if (results.length) KITSU_EPISODES_CACHE.set(numericId, { at: Date.now(), episodes: results });
      return results;
    } catch (e) {
      this.logger.warn(`episodes failed: ${(e as Error).message}`);
      return [];
    }
  }

  private async resolveNumericId(id: string): Promise<string> {
    if (/^\d+$/.test(id)) return id;
    try {
      const { data } = await this.http.get('/anime', {
        params: { 'filter[slug]': id, 'page[limit]': 1 },
      });
      const hit = (data.data || [])[0];
      return hit ? String(hit.id) : '';
    } catch {
      return '';
    }
  }

  private async fetchProductions(animeId: string): Promise<{ studios: string[]; producers: string[]; licensors: string[] }> {
    const result = { studios: [] as string[], producers: [] as string[], licensors: [] as string[] };
    try {
      const { data } = await this.http.get(`/anime/${animeId}/anime-productions`, {
        params: { include: 'producer', 'page[limit]': 20 },
      });
      const included = (data.included || []) as Array<{ id: string; type?: string; attributes?: { name?: string } }>;
      const nameOf = (pid: string): string | undefined => included.find((i) => i.id === pid && i.type === 'producers')?.attributes?.name;
      for (const rel of data.data || []) {
        const role = rel.attributes?.role;
        const pid = rel.relationships?.producer?.data?.id;
        const name = nameOf(pid);
        if (!name) continue;
        if (role === 'studio') {
          if (!result.studios.includes(name)) result.studios.push(name);
        } else if (role === 'producer') {
          if (!result.producers.includes(name)) result.producers.push(name);
        } else if (role === 'licensor') {
          if (!result.licensors.includes(name)) result.licensors.push(name);
        }
      }
    } catch (e) {
      this.logger.warn(`fetchProductions failed: ${(e as Error).message}`);
    }
    return result;
  }

  async recent(page = 1): Promise<SearchResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const results: AnimeEntry[] = [];
      const seen = new Set<string>();
      for (let p = page; p < page + 10 && results.length < 20; p++) {
        const { data } = await this.http.get('/episodes', {
          params: { sort: '-airdate', include: 'media', 'page[limit]': 20, 'page[number]': p },
        });
        const mediaById = new Map<string, KitsuItem>((data.included || []).map((m: KitsuItem) => [m.id, m]));
        for (const ep of data.data || []) {
          const air = ep.attributes?.airdate;
          if (!air || air > today) continue;
          const mediaRel = ep.relationships?.media?.data;
          if (!mediaRel || mediaRel.type !== 'anime' || seen.has(mediaRel.id)) continue;
          const media = mediaById.get(mediaRel.id);
          if (!media) continue;
          seen.add(mediaRel.id);
          results.push(this.toEntry(media));
          if (results.length >= 20) break;
        }
      }
      return { results, hasNextPage: false };
    } catch (e) {
      this.logger.warn(`recent failed: ${(e as Error).message}`);
      return { results: [] };
    }
  }

  async relations(id: string): Promise<AnimeEntry[]> {
    try {
      let numericId = id;
      if (!/^\d+$/.test(id)) {
        const slugRes = await this.http.get('/anime', { params: { 'filter[slug]': id, 'page[limit]': 1 } });
        const hit = (slugRes.data.data || [])[0];
        if (!hit) return [];
        numericId = hit.id;
      }
      const { data } = await this.http.get(`/anime/${numericId}/media-relationships`, {
        params: { include: 'destination', 'page[limit]': 20 },
      });
      const included = (data.included || []) as KitsuItem[];
      const destMap = new Map<string, KitsuItem>();
      for (const item of included) {
        if (item.type === 'anime') destMap.set(item.id, item);
      }
      const results: AnimeEntry[] = [];
      for (const rel of data.data || []) {
        const dest = rel.relationships?.destination?.data;
        if (!dest || dest.type !== 'anime') continue;
        const anime = destMap.get(dest.id);
        if (!anime) continue;
        results.push(this.toEntry(anime));
      }
      return results;
    } catch (e) {
      this.logger.warn(`relations failed: ${(e as Error).message}`);
      return [];
    }
  }

  async popular(page = 1, year?: number): Promise<SearchResult> {
    return this.list(
      '/anime',
      year
        ? { 'filter[season_year]': year, sort: '-favoritesCount', 'page[limit]': 20, 'page[number]': page }
        : { sort: '-favoritesCount', 'page[limit]': 20, 'page[number]': page },
      page,
    );
  }

  async trending(page = 1, year?: number): Promise<SearchResult> {
    return this.list(
      '/anime',
      year
        ? { 'filter[season_year]': year, sort: 'popularity_rank', 'page[limit]': 20, 'page[number]': page }
        : { sort: 'popularity_rank', 'page[limit]': 20, 'page[number]': page },
      page,
    );
  }

  async seasonal(page = 1, season?: string, seasonYear?: number): Promise<SearchResult> {
    const now = new Date();
    const s = season || ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(now.getMonth() / 3)];
    const y = seasonYear || now.getFullYear();
    return this.list(
      '/anime',
      { 'filter[season]': s.toLowerCase(), 'filter[season_year]': y, sort: 'popularity_rank', 'page[limit]': 20, 'page[number]': page },
      page,
    );
  }

  async upcoming(page = 1): Promise<SearchResult> {
    return this.list('/anime', { 'filter[status]': 'upcoming', sort: 'popularity_rank', 'page[limit]': 20, 'page[number]': page }, page);
  }

  async topRated(page = 1, year?: number): Promise<SearchResult> {
    return this.list(
      '/anime',
      year
        ? { 'filter[season_year]': year, sort: '-averageRating', 'page[limit]': 20, 'page[number]': page }
        : { sort: '-averageRating', 'page[limit]': 20, 'page[number]': page },
      page,
    );
  }

  async health(): Promise<boolean> {
    try {
      await this.http.get('/anime', { params: { 'page[limit]': 1 }, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private async list(path: string, params: Record<string, unknown>, page: number): Promise<SearchResult> {
    try {
      const { data } = await this.http.get(path, { params });
      return { results: ((data.data || []) as KitsuItem[]).map((it) => this.toEntry(it)), hasNextPage: false };
    } catch (e) {
      this.logger.warn(`list failed: ${(e as Error).message}`);
      return { results: [] };
    }
  }

  private toEntry(item: KitsuItem): AnimeEntry {
    const a = item.attributes;
    const start = a.startDate ? new Date(a.startDate) : undefined;
    return {
      id: String(item.id),
      title: a.canonicalTitle || a.titles?.en_jp || '',
      englishTitle: a.titles?.en_jp || a.canonicalTitle,
      romajiTitle: a.canonicalTitle,
      nativeTitle: a.titles?.ja_jp,
      image: a.posterImage?.large || a.posterImage?.medium,
      rating: a.averageRating ? parseFloat(a.averageRating) / 10 : undefined,
      status: a.status,
      type: a.subtype,
      genres: a.genres,
      totalEpisodes: a.episodeCount,
      year: start ? start.getFullYear() : undefined,
      season: start ? kitsuSeason(start.getMonth()) : undefined,
      description: (a.synopsis || a.description)?.trim(),
      trailer: a.youtubeVideoId ? `https://www.youtube.com/watch?v=${a.youtubeVideoId}` : undefined,
    };
  }

  private toDetail(item: KitsuItem): AnimeEntry {
    const a = item.attributes;
    return {
      ...this.toEntry(item),
      description: (a.synopsis || a.description)?.trim(),
      cover: a.coverImage?.large || a.posterImage?.large,
      banner: a.coverImage?.large || a.posterImage?.large,
      genres: a.genres,
      duration: a.episodeLength != null ? `${a.episodeLength} min` : undefined,
      releaseDate: a.startDate ?? undefined,
      endDate: a.endDate ?? undefined,
      ageRating: a.ageRating ?? undefined,
      ageRatingGuide: a.ageRatingGuide ?? undefined,
    };
  }
}