import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AnimeEntry, Provider, SearchResult } from './types';

const WAJIK_BASE = process.env.WAJIK_API_URL || 'http://localhost:3001';

interface OploverzItem {
  title?: string;
  poster?: string;
  type?: string;
  status?: string;
  slug?: string;
  href?: string;
}

interface OploverzDetail {
  title?: string;
  poster?: string;
  status?: string;
  studio?: string;
  duration?: string;
  season?: string;
  type?: string;
  rating?: string;
  releasedOn?: string;
  synopsis?: { paragraphList?: string[] };
  genres?: string[];
  episodeList?: { episode?: string; title?: string; date?: string; href?: string }[];
}

@Injectable()
export class Oploverz implements Provider {
  readonly name = 'Oploverz';
  readonly type = 'indonesian' as const;

  private readonly logger = new Logger(Oploverz.name);

  private get http() {
    return axios.create({
      baseURL: WAJIK_BASE,
      timeout: 25000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    try {
      const { data } = await this.http.get('/oploverz/search', { params: { q: query } });
      const list = ((data?.data?.animeList || []) as OploverzItem[]).filter((it) => it.slug);
      return { results: list.map((it) => this.toEntry(it)), hasNextPage: false };
    } catch (e) {
      this.logger.warn(`search failed: ${(e as Error).message}`);
      return { results: [] };
    }
  }

  async info(id: string): Promise<AnimeEntry | null> {
    try {
      const { data } = await this.http.get(`/oploverz/anime/${id}`);
      const a = data?.data?.details as OploverzDetail | undefined;
      if (!a?.title) return null;
      return {
        id,
        title: a.title,
        image: a.poster,
        genres: a.genres,
        status: a.status,
        rating: a.rating ? parseFloat(a.rating) : undefined,
        episodes: (a.episodeList || []).map((e, i) => ({
          id: e.href ? Buffer.from(e.href).toString('base64url') : `${id}-ep-${i + 1}`,
          number: i + 1,
          title: e.title,
        })),
      };
    } catch (e) {
      this.logger.warn(`info failed: ${(e as Error).message}`);
      return null;
    }
  }

  async recent(page = 1): Promise<SearchResult> {
    return this.search('', page);
  }

  async stream(): Promise<null> {
    this.logger.warn('Oploverz streaming is not supported yet (no episode endpoint in wajik-anime-api)');
    return null;
  }

  async health(): Promise<boolean> {
    try {
      const { data } = await this.http.get('/oploverz/search', { params: { q: 'one' }, timeout: 8000 });
      return !!data?.data;
    } catch {
      return false;
    }
  }

  async infoFromTitle(title: string): Promise<AnimeEntry | null> {
    const sr = await this.search(title, 1);
    const first = sr.results[0];
    if (!first) return null;
    return this.info(first.id);
  }

  private toEntry(it: OploverzItem): AnimeEntry {
    return {
      id: it.slug || '',
      title: it.title || '',
      image: it.poster,
      status: it.status,
      type: it.type,
    };
  }
}