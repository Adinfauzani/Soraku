import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AnimeEntry, Provider, SearchResult, StreamContext, StreamResult } from './types';

const DEFAULT_BASE = 'http://localhost:3001';

interface WajikAnime {
  title?: string;
  animeId?: string;
  poster?: string;
  score?: string;
  status?: string;
  otakudesuUrl?: string;
  genreList?: string[];
  episodeList?: { title?: string; episodeId?: string; otakudesuUrl?: string }[];
}

interface WajikServer {
  title?: string;
  serverId?: string;
}

@Injectable()
export class Wajik implements Provider {
  readonly name = 'Wajik';
  readonly type = 'indonesian' as const;

  private readonly logger = new Logger(Wajik.name);

  private get base() {
    return process.env.WAJIK_API_URL || DEFAULT_BASE;
  }

  private get http() {
    return axios.create({
      baseURL: this.base,
      timeout: 25000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    try {
      const { data } = await this.http.get('/otakudesu/search', { params: { q: query } });
      const list = ((data?.data?.animeList || []) as WajikAnime[]).filter((it) => it.animeId);
      return { results: list.map((it) => this.toEntry(it)), hasNextPage: false };
    } catch (e) {
      this.logger.warn(`search failed: ${(e as Error).message}`);
      return { results: [] };
    }
  }

  async info(id: string): Promise<AnimeEntry | null> {
    try {
      const { data } = await this.http.get(`/otakudesu/anime/${id}`);
      const a = data?.data?.details as WajikAnime | undefined;
      if (!a?.title) return null;
      return {
        id,
        title: a.title ?? '',
        image: a.poster,
        genres: a.genreList,
        rating: a.score ? parseFloat(a.score) : undefined,
        status: a.status,
        episodes: (a.episodeList || [])
          .filter((e) => /^[a-z0-9-]+-episode-\d+-(?:sub-indo|sub-ovajp|batch)$/i.test(e.episodeId || ''))
          .map((e, i) => ({ id: e.episodeId || '', number: i + 1, title: e.title })),
      };
    } catch (e) {
      this.logger.warn(`info failed: ${(e as Error).message}`);
      return null;
    }
  }

  async recent(page = 1): Promise<SearchResult> {
    try {
      const { data } = await this.http.get('/otakudesu/ongoing', { params: { page } });
      const list = ((data?.data?.animeList || []) as WajikAnime[]).filter((it) => it.animeId);
      return { results: list.map((it) => this.toEntry(it)), hasNextPage: !!data?.pagination };
    } catch (e) {
      this.logger.warn(`recent failed: ${(e as Error).message}`);
      return { results: [] };
    }
  }

  async stream(episodeId: string, ctx?: StreamContext): Promise<StreamResult | null> {
    try {
      const otakuEpisodeId = await this.resolveEpisodeId(episodeId, ctx?.title);
      if (!otakuEpisodeId) return null;

      const { data } = await this.http.get(`/otakudesu/episode/${otakuEpisodeId}`);
      const details = data?.data?.details;
      if (!details) return null;

      const sources: StreamResult['sources'] = [];
      if (details.defaultStreamingUrl) {
        sources.push({ url: details.defaultStreamingUrl, quality: 'auto', isM3U8: true });
      }

      const server = this.pickServer(details?.server?.qualityList);
      if (server?.serverId) {
        try {
          const { data: src } = await this.http.get(`/otakudesu/server/${server.serverId}`);
          const url = src?.data?.details?.url;
          if (url) sources.push({ url, quality: server.quality, isM3U8: true });
        } catch (e) {
          this.logger.warn(`server resolve failed: ${(e as Error).message}`);
        }
      }

      if (!sources.length) return null;
      return { sources, subtitles: [] };
    } catch (e) {
      this.logger.warn(`stream failed: ${(e as Error).message}`);
      return null;
    }
  }

  async health(): Promise<boolean> {
    try {
      const { data } = await this.http.get('/');
      return !!data?.routes && Array.isArray(data.routes);
    } catch {
      return false;
    }
  }

  async infoFromTitle(title: string): Promise<AnimeEntry | null> {
    const animeId = await this.searchAnimeId(title);
    if (!animeId) return null;
    return this.info(animeId);
  }

  private toEntry(it: WajikAnime): AnimeEntry {
    return {
      id: it.animeId || '',
      title: it.title || '',
      image: it.poster,
      rating: it.score ? parseFloat(it.score) : undefined,
      status: it.status,
      genres: it.genreList,
    };
  }

  private async resolveEpisodeId(episodeId: string, title?: string): Promise<string | null> {
    if (/^[a-z0-9-]+-episode-\d+-(?:sub-indo|sub-ovajp|batch)$/i.test(episodeId)) return episodeId;
    const match = /^anilist-ep-(\d+)-(\d+)$/.exec(episodeId) || /^(\d+)\/ep-(\d+)$/.exec(episodeId);
    if (!match) return null;
    const ep = Number(match[2]);
    const animeId = title ? await this.searchAnimeId(title) : null;
    if (!animeId) return null;
    return this.findEpisode(animeId, ep);
  }

  private async searchAnimeId(title: string): Promise<string | null> {
    const term = title.trim().slice(0, 80);
    const { data } = await this.http.get('/otakudesu/search', { params: { q: term } });
    const list = ((data?.data?.animeList || []) as WajikAnime[]).filter((it) => it.animeId);
    if (!list.length) return null;

    const t = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const words = t(term).split(' ').filter((w) => w.length > 1);

    let best: WajikAnime | undefined;
    let bestScore = 0;
    for (const it of list) {
      const tt = t(it.title || '');
      const score = words.reduce((sum, w) => sum + (tt.includes(w) ? w.length : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        best = it;
      }
    }
    return best?.animeId || null;
  }

  private async findEpisode(animeId: string, ep: number): Promise<string | null> {
    const { data } = await this.http.get(`/otakudesu/anime/${animeId}`);
    const eps = (data?.data?.details?.episodeList || []) as { title?: string; episodeId?: string }[];
    if (!eps.length) return null;

    const found = eps.find((e) => {
      const num = e.episodeId?.match(/^[a-z0-9-]+-episode-(\d+)-(?:sub-indo|sub-ovajp|batch)$/i)?.[1];
      return num != null && Number(num) === ep;
    });
    return found?.episodeId || null;
  }

  private pickServer(qualityList?: any[]): { serverId: string; quality: string } | null {
    if (!Array.isArray(qualityList)) return null;
    const withServers = qualityList.filter((q) => Array.isArray(q?.serverList) && q.serverList.length);
    if (!withServers.length) return null;
    const q = withServers[withServers.length - 1];
    const item = (q?.serverList?.[0] || {}) as WajikServer;
    if (!item.serverId) return null;
    const quality = String(q?.title || '').match(/(\d+p)/i)?.[1] || 'auto';
    return { serverId: item.serverId, quality };
  }
}