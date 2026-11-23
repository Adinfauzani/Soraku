import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AnimeEntry, SearchResult, Provider } from './types';

const API = 'https://api.jikan.moe/v4';

interface JikanAnime {
  mal_id: number; title: string; title_english?: string; title_japanese?: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  synopsis?: string; genres?: { name: string }[]; score?: number; status?: string;
  season?: string; year?: number; studios?: { name: string }[]; type?: string; episodes?: number;
}

function toEntry(item: JikanAnime): AnimeEntry {
  return {
    id: String(item.mal_id),
    title: item.title_english || item.title,
    englishTitle: item.title_english,
    nativeTitle: item.title_japanese,
    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
    description: item.synopsis?.trim(),
    genres: item.genres?.map((g) => g.name),
    rating: item.score,
    status: item.status,
    type: item.type,
    totalEpisodes: item.episodes,
    year: item.year,
    season: item.season,
    studios: item.studios?.map((s) => s.name),
  };
}

@Injectable()
export class Jikan implements Provider {
  readonly name = 'MyAnimeList';
  readonly type = 'metadata' as const;

  async search(query: string, page = 1): Promise<SearchResult> {
    try {
      const { data } = await axios.get(`${API}/anime`, { params: { q: query, page, limit: 20 } });
      return { results: (data.data || []).map(toEntry), hasNextPage: data.pagination?.has_next_page };
    } catch { return { results: [] }; }
  }

  async info(id: string): Promise<AnimeEntry | null> {
    try {
      const nid = parseInt(id, 10);
      if (isNaN(nid)) return null;
      const { data } = await axios.get(`${API}/anime/${nid}/full`);
      return data.data ? toEntry(data.data) : null;
    } catch { return null; }
  }

async health(): Promise<boolean> {
    try {
      await axios.get(`${API}/top/anime`, { params: { limit: 1 }, timeout: 5000 });
      return true;
    } catch { return false; }
  }

  async filter(page = 1, perPage = 20, opts: Record<string, any> = {}): Promise<SearchResult> {
    try {
      const params: Record<string, any> = { page, limit: perPage };
      if (opts.q) params.q = opts.q;
      if (opts.genres) params.genres = opts.genres;
      if (opts.genres_exclude) params.genres_exclude = opts.genres_exclude;
      if (opts.studios) params.studios = opts.studios;
      if (opts.season) params.season = opts.season;
      if (opts.year) params.year = opts.year;
      if (opts.status) params.status = opts.status;
      if (opts.type) params.type = opts.type;
      if (opts.sort) params.sort = opts.sort;
      const { data } = await axios.get(`${API}/anime`, { params });
      return { results: (data.data || []).map(toEntry), hasNextPage: data.pagination?.has_next_page };
    } catch { return { results: [] }; }
  }

  async popular(page = 1): Promise<SearchResult> {
    try {
      const { data } = await axios.get(`${API}/top/anime`, { params: { page, limit: 20 } });
      return { results: (data.data || []).map(toEntry), hasNextPage: data.pagination?.has_next_page };
    } catch { return { results: [] }; }
  }

  async trending(page = 1): Promise<SearchResult> {
    return this.popular(page);
  }

  async topRated(page = 1): Promise<SearchResult> {
    try {
      const { data } = await axios.get(`${API}/top/anime`, { params: { page, limit: 20, filter: 'bypopularity' } });
      return { results: (data.data || []).map(toEntry), hasNextPage: data.pagination?.has_next_page };
    } catch { return { results: [] }; }
  }
}
