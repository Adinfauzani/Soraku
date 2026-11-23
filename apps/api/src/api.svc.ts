import { Injectable, Logger } from '@nestjs/common';
import { Registry } from './sources/registry';
import { Normalizer } from './common/normalizer';
import { CacheService, CacheTTL } from './common/cache.service';
import { AnilistService } from './modules/anilist/anilist.service';
import { DEFAULT_SERVER_ID, SERVERS, resolveProviders } from './servers.config';
import type { AnimeEntry, StreamContext } from './sources/types';
import type { StreamSourceDTO } from './common/dto/anime.dto';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  constructor(
    private readonly registry: Registry,
    private readonly normalizer: Normalizer,
    private readonly anilist: AnilistService,
    private readonly cache: CacheService,
  ) {}

  private async fromMetadata<T>(fn: (p: any) => Promise<T | null>, fallback: T): Promise<T> {
    const metadata = this.registry.getByType('metadata');
    for (const p of metadata) {
      try {
        if (typeof p.health === 'function') {
          const healthy = await p.health();
          if (!healthy) continue;
        }
        const r = await fn(p);
        if (r == null) continue;
        if (Array.isArray(r)) {
          if (r.length === 0) continue;
          return r;
        }
        if (typeof r === 'object' && 'results' in r && Array.isArray((r as any).results)) {
          if ((r as any).results.length === 0) continue;
          return r;
        }
        return r;
      } catch {}
    }
    return fallback;
  }

  async search(query: string, page = 1, perPage = 20) {
    const data = await this.anilist.search(query, page, perPage);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => p.search(query, page).then((r: any) => r?.results?.slice(0, perPage) || null),
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async filter(page = 1, perPage = 20, opts: any = {}) {
    const data = await this.anilist.filter(page, perPage, opts);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => typeof p.filter === 'function' ? p.filter(page, perPage, opts).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getTrending(page = 1, perPage = 20, year?: number) {
    const data = await this.anilist.getTrending(page, perPage);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => p.trending ? p.trending(page, year).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getPopular(page = 1, perPage = 20, year?: number) {
    const data = await this.anilist.getPopular(page, perPage);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => p.popular ? p.popular(page, year).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getRecent(page = 1, perPage = 20) {
    const data = await this.anilist.getRecent(page, perPage);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => p.recent ? p.recent(page).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getSeasonal(page = 1, perPage = 20, season?: string, seasonYear?: number) {
    const data = await this.anilist.getSeasonal(page, perPage, season, seasonYear);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => typeof p.seasonal === 'function' ? p.seasonal(page, season, seasonYear).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getUpcoming(page = 1, perPage = 20) {
    const data = await this.anilist.getAiring(page, perPage);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => typeof p === 'object' && 'upcoming' in p ? (p as any).upcoming(page).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getTopRated(page = 1, perPage = 20, year?: number) {
    const data = await this.anilist.getTopRated(page, perPage);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => p.topRated ? p.topRated(page, year).then((r: any) => r?.results?.slice(0, perPage) || null) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getSpotlight() {
    const data = await this.anilist.getSpotlight(5);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => p.trending ? p.trending(1).then((r: any) => (r?.results || []).slice(0, 5)) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getInfo(anilistId: string) {
    const numeric = /^\d+$/.test(anilistId);
    // Jikan first (supports MAL numeric IDs), then AniList, then Kitsu
    if (numeric) {
      const jikan = this.registry.get('MyAnimeList');
      if (jikan?.info) {
        try {
          const entry = await jikan.info(anilistId);
          if (entry) return this.normalizer.toAnimeDTO(entry);
        } catch {}
      }
    }
    const data = await this.anilist.getInfo(anilistId);
    if (data) return data;
    const kitsu = this.registry.get('Kitsu');
    if (kitsu?.info) {
      try {
        const entry = await kitsu.info(anilistId);
        if (entry) return this.normalizer.toAnimeDTO(entry);
      } catch {}
    }
    const fallback = await this.fromMetadata<AnimeEntry | null>(
      (p) => p.info(anilistId),
      null,
    );
    return fallback ? this.normalizer.toAnimeDTO(fallback) : null;
  }

  async getCharacters(id: string) {
    const data = await this.anilist.getCharacters(id);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => typeof p === 'object' && 'characters' in p ? (p as any).characters(id) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getRelations(id: string) {
    const data = await this.anilist.getRelations(id);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => typeof p === 'object' && 'relations' in p ? (p as any).relations(id) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getRecommendations(id: string) {
    const data = await this.anilist.getRecommendations(id);
    if (data.length) return data;
    const fallback = await this.fromMetadata(
      (p) => typeof p === 'object' && 'recommendations' in p ? (p as any).recommendations(id) : null,
      [],
    );
    return this.normalizer.toAnimeDTOs(fallback);
  }

  async getEpisodes(anilistId: string) {
    const info = await this.anilist.getInfo(anilistId);
    const total = info?.totalEpisodes ?? 0;
    if (total <= 0) return [];

    const nextAiring = info?.nextAiringEpisode?.episode;
    const aired = nextAiring != null ? nextAiring - 1 : total;
    const count = Math.max(0, Math.min(total, aired));
    if (count <= 0) return [];

    return Array.from({ length: count }, (_, index) => ({
      id: `anilist-ep-${anilistId}-${index + 1}`,
      animeId: anilistId,
      number: index + 1,
    }));
  }

  async getEpisodesFromServer(server?: string, title?: string, anilistId?: string) {
    const cacheKey = `watch:episodes:${server ?? DEFAULT_SERVER_ID}:${title ?? ''}:${anilistId ?? ''}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const chain = resolveProviders(server ?? undefined);
    for (const name of chain) {
      const prov = this.registry.get(this.normalizeName(name));
      if (!prov?.infoFromTitle) continue;
      try {
        const info = await prov.infoFromTitle(title || '', anilistId);
        if (info?.episodes?.length) {
          const episodes = await this.enrichEpisodes(info, anilistId);
          const result = { episodes, provider: prov.name, server: server ?? DEFAULT_SERVER_ID };
          await this.cache.set(cacheKey, result, CacheTTL.EPISODES);
          return result;
        }
      } catch {}
    }
    return null;
  }

  // Providers that can produce real episode lists by title when AniList reports 0 eps.
  private static readonly EPISODE_PROVIDERS = ['Otakudesu', 'Miruro', 'Wajik', 'Oploverz'];

  async getAnimeEpisodes(anilistId: string): Promise<any[]> {
    const cacheKey = `anime:episodes:${anilistId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    let info: any = null;
    try { info = await this.getInfo(anilistId); } catch {}

    if (info && info.totalEpisodes && info.totalEpisodes > 0) {
      const eps = this.generateAniListEpisodes(anilistId, info.totalEpisodes);
      await this.cache.set(cacheKey, eps, 3600);
      return eps;
    }

    const title = info?.romajiTitle || info?.title || info?.englishTitle;
    if (title) {
      for (const name of ApiService.EPISODE_PROVIDERS) {
        const prov = this.registry.get(this.normalizeName(name));
        if (!prov?.infoFromTitle) continue;
        try {
          const entry = await prov.infoFromTitle(title, anilistId);
          if (entry?.episodes?.length) {
            const eps = entry.episodes
              .filter((e: any) => {
                const t = String(e.title || '');
                // Providers occasionally inject separator rows like
                // "======== Pembatas Episode | ..." — drop them.
                return !/pembatas|^=+|=+$|dalam proses/i.test(t);
              })
              .map((e: any, i: number) => ({
              id: e.id || `${entry.id}-ep-${i + 1}`,
              number: e.number ?? i + 1,
              title: e.title,
              image: e.image,
            }));
            await this.cache.set(cacheKey, eps, 3600);
            return eps;
          }
        } catch {}
      }
    }
    return [];
  }

  private generateAniListEpisodes(anilistId: string, total: number): any[] {
    return Array.from({ length: total }, (_, i) => ({
      id: `anilist-ep-${anilistId}-${i + 1}`,
      animeId: anilistId,
      number: i + 1,
      title: `Episode ${i + 1}`,
    }));
  }

  private async enrichEpisodes(info: AnimeEntry, anilistId?: string): Promise<Array<Record<string, unknown>>> {
    const base = info.episodes!.map((e, i) => ({
      id: e.id || `${info.id}-ep-${i + 1}`,
      animeId: info.id,
      number: e.number ?? i + 1,
      title: e.title,
    }));

    const kitsu = this.registry.get('Kitsu');
    if (!kitsu || !anilistId) return base;

    try {
      const meta = await (kitsu as any).episodes(anilistId);
      if (!Array.isArray(meta) || meta.length === 0) return base;
      const byNumber = new Map<number, any>(meta.map((m) => [m.number, m]));
      return base.map((ep) => {
        const m = byNumber.get(ep.number);
        if (!m) return ep;
        return {
          ...ep,
          title: m.title || ep.title,
          description: m.description,
          image: m.image,
          releaseDate: m.releaseDate,
        };
      });
    } catch {
      return base;
    }
  }

  private async unwrapEmbedSource(
    url: string,
  ): Promise<{ url: string; isM3U8: boolean } | null> {
    if (!url) return null;
    if (/nekoclouds/i.test(url)) return this.unwrapNeko(url);
    if (!/(desustream|solidfiles|playdesu|index\.php\?id=)/i.test(url)) return null;

    const cached = await this.cache.get<string>(`stream:unwrap:${url}`);
    if (cached) return { url: cached, isM3U8: /\.m3u8/i.test(cached) };

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Referer: 'https://otakudesu.blog/',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
          signal: controller.signal,
        });
        const html = await res.text();
        if (res.ok && /<video/i.test(html)) {
          const match =
            html.match(/<video[^>]*\ssrc=["']([^"']+)["']/i) ||
            html.match(/<source[^>]*\ssrc=["']([^"']+)["']/i) ||
            html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);

          const target = match?.[1];
          if (target && /^https?:\/\//i.test(target) && /(\.m3u8|\.mp4|videoplayback|googlevideo|mime=video)/i.test(target)) {
            await this.cache.set(`stream:unwrap:${url}`, target, CacheTTL.STREAM / 2);
            return { url: target, isM3U8: /\.m3u8/i.test(target) };
          }
        }
      } catch (e) {
        if (attempt === 2) this.logger.warn(`unwrapStreamUrl failed for ${url.slice(0, 90)}: ${(e as Error).message}`);
      } finally {
        clearTimeout(timeout);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  }

  private async unwrapNeko(
    embedUrl: string,
  ): Promise<{ url: string; isM3U8: boolean } | null> {
    const mediaId = embedUrl.match(/\/embed\/([^/?#]+)/)?.[1];
    if (!mediaId) return null;

    const cached = await this.cache.get<string>(`stream:unwrap:${embedUrl}`);
    if (cached) return { url: cached, isM3U8: true };

    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
    const jar = new Map<string, string>();
    const applySetCookie = (headers: Headers) => {
      const raw =
        typeof headers.getSetCookie === 'function'
          ? headers.getSetCookie()
          : headers.get('set-cookie')
            ? [headers.get('set-cookie')!]
            : [];
      for (const c of raw) {
        const [pair] = c.split(';');
        const idx = pair.indexOf('=');
        if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
    };
    const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const emb = await fetch(embedUrl, {
          headers: {
            'User-Agent': ua,
            Referer: 'https://otakudesu.blog/',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
          signal: controller.signal,
        });
        applySetCookie(emb.headers);
        const html = await emb.text();
        const csrf = html.match(/name="csrf-token"\s+content="([^"]+)"/i)?.[1];
        if (!csrf) return null;

        const auth = await fetch(`https://nekoclouds.com/playback/${mediaId}/authorize`, {
          method: 'POST',
          headers: {
            'User-Agent': ua,
            Cookie: cookieHeader(),
            'X-CSRF-TOKEN': csrf,
            'X-Requested-With': 'XMLHttpRequest',
            Referer: embedUrl,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        applySetCookie(auth.headers);
        const json = (await auth.json().catch(() => null)) as {
          manifest_url?: string;
        } | null;
        const manifestUrl = json?.manifest_url;
        if (manifestUrl && /^https?:\/\//i.test(manifestUrl)) {
          await this.cache.set(`stream:unwrap:${embedUrl}`, manifestUrl, CacheTTL.STREAM / 2);
          return { url: manifestUrl, isM3U8: true };
        }
      } catch (e) {
        if (attempt === 2) this.logger.warn(`unwrapNeko failed for ${embedUrl.slice(0, 90)}: ${(e as Error).message}`);
      } finally {
        clearTimeout(timeout);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  }

  private async unwrapSources(sources: StreamSourceDTO[]): Promise<StreamSourceDTO[]> {
    const out = [...sources];
    console.error('[unwrap-debug] input sources:', out.map(s => s.url.slice(0,80)));
    for (let i = 0; i < Math.min(out.length, 2); i++) {
      const unwrapped = await this.unwrapEmbedSource(out[i].url);
      console.error('[unwrap-debug] source', i, 'unwrap result:', unwrapped ? unwrapped.url.slice(0,80) : null);
      if (unwrapped) {
        out[i] = { ...out[i], url: unwrapped.url, isM3U8: unwrapped.isM3U8 };
        break;
      }
    }
    return out;
  }

  async getStreamFromServer(
    server?: string,
    anilistId?: string,
    ep?: number,
    title?: string,
    lang: 'sub' | 'dub' = 'sub',
  ) {
    const chain = resolveProviders(server ?? undefined);
    let info: AnimeEntry | null = null;
    let providerName = '';
    for (const name of chain) {
      const prov = this.registry.get(this.normalizeName(name));
      if (!prov?.infoFromTitle) continue;
      try {
        const found = await prov.infoFromTitle(title || '', anilistId);
        if (found?.episodes?.length) {
          info = found;
          providerName = prov.name;
          break;
        }
      } catch {}
    }
    if (!info?.episodes?.length) return null;

    const episode = info.episodes.find((e) => (e.number ?? 0) === (ep || 1)) || info.episodes[0];
    if (!episode) return null;

    for (const name of chain) {
      const prov = this.registry.get(this.normalizeName(name));
      if (!prov?.stream) continue;
      try {
        console.error('[stream-debug] calling', prov.name, 'stream(', episode.id, ')');
        const result = await prov.stream(episode.id, { anilistId, title: info?.title, lang });
        console.error('[stream-debug]', prov.name, 'result sources:', result?.sources?.length);
        if (result?.sources?.length) {
          const dto = this.normalizer.toStreamResult(result);
          return {
            ...dto,
            sources: await this.unwrapSources(dto.sources),
            provider: providerName,
            streamProvider: prov.name,
            server: server ?? DEFAULT_SERVER_ID,
            audio: lang,
            dubAvailable: info.episodes?.some((e) => e.isDubbed === true) || false,
          };
        }
      } catch {}
    }
    return null;
  }

  async getSchedule() {
    return this.fromMetadata(
      (p) => typeof p === 'object' && 'schedule' in p ? (p as any).schedule() : null,
      [],
    );
  }

  async watch(provider: string, anilistId: string, ep: number, type: string, server?: string, title?: string) {
    const chain = resolveProviders(server ?? undefined, server ? undefined : provider || undefined);

    let ctx: StreamContext | undefined;
    if (title) {
      ctx = { anilistId, title };
    }
    for (const name of chain) {
      const prov = this.registry.get(this.normalizeName(name));
      if (!prov?.stream) continue;
      try {
        if (!ctx) {
          const info = await this.anilist.getInfo(anilistId).catch(() => null);
          if (info) ctx = { anilistId, title: info.englishTitle || info.title || '' };
        }
        const epId = `${anilistId}/ep-${ep}`;
        const result = await prov.stream(epId, ctx);
        if (result?.sources?.length) {
          const dto = this.normalizer.toStreamResult(result);
          return {
            ...dto,
            sources: await this.unwrapSources(dto.sources),
            provider: prov.name,
            server: server ?? DEFAULT_SERVER_ID,
          };
        }
      } catch {}
    }
    return null;
  }

  async getSources(episodeId: string, provider?: string, anilistId?: string, category = 'sub') {
    const fallbackOrder = ['otakudesu', 'hianime', 'animepahe', 'kickassanime', 'animekai'];
    const names = provider ? [provider, ...fallbackOrder] : fallbackOrder;
    const prioritized = this.dedupe(names);

    for (const name of prioritized) {
      const p = this.registry.get(this.normalizeName(name));
      if (!p?.stream) continue;
      try {
        const result = await p.stream(episodeId);
        if (result?.sources?.length) return this.normalizer.toStreamResult(result);
      } catch {}
    }
    return null;
  }

  async discover() {
    const [trending, popular, recent] = await Promise.all([
      this.getTrending(1, 10),
      this.getPopular(1, 10),
      this.getRecent(1, 10),
    ]);
    return { trending, popular, recent };
  }

  getMeta() {
    return {
      defaultServer: DEFAULT_SERVER_ID,
      servers: SERVERS.map((s) => ({ id: s.id, name: s.name, providers: s.providers })),
      sources: this.registry.getAll().map((p) => ({ id: p.name.toLowerCase(), name: p.name, type: p.type })),
    };
  }

  getProvider(name: string) {
    return this.registry.get(this.normalizeName(name));
  }

  private normalizeName(name: string): string {
    const map: Record<string, string> = {
      hianime: 'HiAnime',
      animepahe: 'AnimePahe',
      animekai: 'AnimeKai',
      kickassanime: 'KickAssAnime',
      otakudesu: 'Otakudesu',
      wajik: 'Wajik',
      kitsu: 'Kitsu',
      oploverz: 'Oploverz',
      miruro: 'Miruro',
      anilist: 'AniList',
      jikan: 'Jikan',
    };
    return map[name.toLowerCase()] || name;
  }

  private dedupe(arr: string[]): string[] {
    return [...new Set(arr.map((s) => s.toLowerCase()))];
  }
}
