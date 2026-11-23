import { Injectable, Logger } from '@nestjs/common';
import { AnimeSource, SourceAnimeEntry, SourceAnimeDetail, SourceEpisode } from '../interfaces/anime-source.interface';
import { env } from '../../../config/env';

type ConsumetExtensions = {
  META: { Anilist: new (provider?: any) => any };
  ANIME: {
    AnimeSaturn: new () => any;
    AnimeUnity: new () => any;
    AnimeKai: new () => any;
    AnimePahe: new () => any;
  };
};

let consumet: ConsumetExtensions | null = null;
try {
  // Optional dependency; may be unavailable/unbuilt in some environments.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  consumet = require('@consumet/extensions') as ConsumetExtensions;
} catch {
  consumet = null;
}

function createProvider(provider?: any) {
  if (!consumet?.META?.Anilist) return null;
  return new consumet.META.Anilist(provider);
}

function buildClients(): any[] {
  if (!consumet) return [];
  const factories: Array<() => any> = [
    () => createProvider(),
    () => consumet?.ANIME?.AnimeSaturn ? createProvider(new consumet.ANIME.AnimeSaturn()) : null,
    () => consumet?.ANIME?.AnimeUnity ? createProvider(new consumet.ANIME.AnimeUnity()) : null,
    () => consumet?.ANIME?.AnimeKai ? createProvider(new consumet.ANIME.AnimeKai()) : null,
    () => consumet?.ANIME?.AnimePahe ? createProvider(new consumet.ANIME.AnimePahe()) : null,
  ];
  const clients: any[] = [];
  for (const fn of factories) {
    try {
      const c = fn();
      if (c) clients.push(c);
    } catch {
      // ignore individual provider init failures
    }
  }
  return clients;
}

@Injectable()
export class ConsumetSource implements AnimeSource {
  readonly name = 'Consumet';
  readonly type = 'metadata' as const;
  readonly priority = 55;
  readonly subtitleLanguages = ['id', 'en'];
  readonly defaultSubtitleLang = env.DEFAULT_SUBTITLE_LANG;
  private readonly logger = new Logger(ConsumetSource.name);
  private readonly clients = buildClients();

  private get defaultClient() {
    return this.clients[0];
  }

  async search(query: string): Promise<SourceAnimeEntry[]> {
    for (const client of this.clients) {
      try {
        const res: any = await client.search(query, 1, 20);
        if (res?.results?.length) return (res.results || []).map((item: any) => this.toEntry(item));
      } catch {}
    }
    return [];
  }

  async getAnime(id: string): Promise<SourceAnimeDetail | null> {
    for (const client of this.clients) {
      try {
        const info: any = await client.fetchAnimeInfo(id);
        if (info) return this.toDetail(info);
      } catch {}
    }
    return null;
  }

  async getEpisodes(animeId: string): Promise<SourceEpisode[]> {
    const detail = await this.getAnime(animeId);
    return detail?.episodes ?? [];
  }

  async resolveEpisodeUrl(animeSlug: string, episodeNumber: number): Promise<string | null> {
    for (const client of this.clients) {
      try {
        let episodeId = '';
        try {
          const info: any = await client.fetchAnimeInfo(animeSlug);
          const ep = (info?.episodes || []).find((e: any) => e.number === episodeNumber);
          if (ep?.id) episodeId = ep.id;
        } catch {
          episodeId = `${animeSlug}-ep-${episodeNumber}`;
        }
        if (!episodeId) continue;

        const sources: any = await client.fetchEpisodeSources(episodeId);
        const m3u8 = (sources?.sources || []).find(
          (s: any) => s.isM3U8 || s.url?.includes('.m3u8'),
        );
        const url = m3u8?.url || sources?.sources?.[0]?.url || null;
        if (url) return url;
      } catch (err) {
        this.logger.verbose(`resolveEpisodeUrl failed for provider: ${(err as Error).message}`);
      }
    }
    return null;
  }

  async getPopular(page = 1): Promise<SourceAnimeEntry[]> {
    for (const client of this.clients) {
      try {
        const res: any = await client.fetchPopularAnime(page, 20);
        if (res?.results?.length) return (res.results || []).map((item: any) => this.toEntry(item));
      } catch {}
    }
    return [];
  }

  async health(): Promise<boolean> {
    if (!this.defaultClient) return false;
    try {
      await this.defaultClient.search('naruto', 1, 1);
      return true;
    } catch {
      return false;
    }
  }

  private toEntry(item: any): SourceAnimeEntry {
    return {
      title: typeof item.title === 'string' ? item.title : (item.title?.english ?? item.title?.romaji ?? ''),
      slug: String(item.id),
      synopsis: item.description?.replace(/<[^>]*>/g, '').trim(),
      posterUrl: item.image,
      genres: item.genres as string[],
      score: item.rating ? item.rating / 10 : undefined,
      source: this.name,
    };
  }

  private toDetail(info: any): SourceAnimeDetail {
    return {
      title: typeof info.title === 'string' ? info.title : (info.title?.english ?? info.title?.romaji ?? ''),
      slug: String(info.id),
      synopsis: info.description?.replace(/<[^>]*>/g, '').trim(),
      posterUrl: info.image,
      genres: info.genres as string[],
      score: info.rating ? info.rating / 10 : undefined,
      status: info.status,
      season: info.season,
      studio: info.studios?.[0],
      episodes: (info.episodes || []).map((ep: any) => ({
        number: ep.number,
        title: ep.title,
        duration: ep.duration as number | undefined,
        episodePageUrl: ep.id,
        videoUrls: {},
      })),
      source: this.name,
    };
  }
}
