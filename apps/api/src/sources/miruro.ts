import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AnimeEntry, EpisodeInfo, SearchResult, StreamResult, Provider, StreamContext } from './types';

const DEFAULT_BASE = 'http://localhost:3002';

interface MiruroEpisodes {
  providers?: Record<string, { episodes?: Record<string, any[]> }>;
  mappings?: { title?: string; episodes?: number };
}

interface MiruroSources {
  streams?: { url: string; quality?: string; type?: string; referer?: string }[];
  subtitles?: { file: string; label: string; kind?: string }[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
}

const ANILIST_CLIENT_ID = process.env.ANILIST_CLIENT_ID || '';
const ANILIST_CLIENT_SECRET = process.env.ANILIST_CLIENT_SECRET || '';
let anilistToken: string | null = null;
let anilistTokenExp = 0;

async function getAniListToken(): Promise<string | null> {
  if (anilistToken && Date.now() < anilistTokenExp) return anilistToken;
  if (!ANILIST_CLIENT_ID || !ANILIST_CLIENT_SECRET) return null;
  try {
    const { data } = await axios.post(
      'https://anilist.co/oauth/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ANILIST_CLIENT_ID,
        client_secret: ANILIST_CLIENT_SECRET,
      }),
      { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    if (data?.access_token) {
      anilistToken = data.access_token;
      anilistTokenExp = Date.now() + (data.expires_in ?? 3600) * 1000 - 60000;
      return anilistToken;
    }
  } catch {
    // fall through to unauthenticated request
  }
  return null;
}

function norm(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Score a candidate against the user's query. Exact full-title match wins; TV format
// preferred over movie/ova/special; drop obvious sequels/derivatives of the same name.
function scoreCandidate(query: string, m: any): number {
  const q = norm(query);
  const titles = [m.title?.romaji, m.title?.english, m.title?.native].filter(Boolean) as string[];
  let best = 0;
  for (const t of titles) {
    const tn = norm(t);
    if (tn === q) { best = Math.max(best, 1000); break; }
    if (tn.includes(q) || q.includes(tn)) best = Math.max(best, 500);
    const qw = q.split(' ').filter((w) => w.length > 1);
    const sc = qw.reduce((s, w) => s + (tn.includes(w) ? w.length : 0), 0);
    best = Math.max(best, sc);
  }
  if (m.format === 'TV' || m.format === 'TV_SHORT') best += 60;
  if (m.format === 'MOVIE') best -= 200;
  if (m.format === 'OVA' || m.format === 'SPECIAL' || m.format === 'ONA') best -= 120;
  // Penalise entries whose title is a strict superset (sequel/spin-off of same name).
  const main = norm(titles[0] || '');
  if (main && main !== q && main.includes(q) && main.length > q.length + 4) best -= 150;
  return best;
}

@Injectable()
export class Miruro implements Provider {
  readonly name = 'Miruro';
  readonly type = 'indonesian' as const;

  private readonly logger = new Logger(Miruro.name);

  private get base() {
    return process.env.MIRURO_API_URL || DEFAULT_BASE;
  }

  private get http() {
    return axios.create({ baseURL: this.base, timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    // Miruro metadata comes from AniList; delegate to a lightweight AniList search.
    return { results: [] };
  }

  async info(id: string): Promise<AnimeEntry | null> {
    return null;
  }

  async infoFromTitle(title: string, anilistId?: string): Promise<AnimeEntry | null> {
    const id = anilistId ? Number(anilistId) : await this.resolveAniListId(title);
    if (!id) return null;

    let data: MiruroEpisodes;
    try {
      const { data: resp } = await this.http.get<MiruroEpisodes>(`/episodes/${id}`);
      data = resp;
    } catch (e) {
      this.logger.warn(`miruro episodes failed: ${(e as Error).message}`);
      return null;
    }

    const providers = data.providers || {};
    const episodes = this.buildEpisodes(providers);
    if (!episodes.length) return null;

    return {
      id: String(anilistId),
      title,
      episodes,
    };
  }

  async stream(episodeId: string, ctx?: StreamContext): Promise<StreamResult | null> {
    const parsed = this.parseEpisodeId(episodeId);
    if (!parsed) return null;
    const { provider, anilistId, category, slug } = parsed;

    let data: MiruroSources;
    try {
      const { data: resp } = await this.http.get<MiruroSources>(
        `/watch/${provider}/${anilistId}/${category}/${encodeURIComponent(slug)}`,
      );
      data = resp;
    } catch (e) {
      this.logger.warn(`miruro stream failed: ${(e as Error).message}`);
      return null;
    }

    const sources = (data.streams || [])
      .filter((s) => s.url)
      .map((s) => ({
        url: s.url,
        quality: s.quality || 'auto',
        isM3U8: s.type === 'hls' || /\.m3u8(\?|$)/i.test(s.url),
      }));
    if (!sources.length) return null;

    return {
      sources,
      subtitles: (data.subtitles || []).map((s) => ({ url: s.file, lang: s.label })),
    };
  }

  async health(): Promise<boolean> {
    try {
      const { data } = await this.http.get('/health', { timeout: 5000 });
      return data?.status === 'ok';
    } catch {
      return false;
    }
  }

  // ── helpers ──

  private buildEpisodes(providers: MiruroEpisodes['providers']): EpisodeInfo[] {
    const out: EpisodeInfo[] = [];
    for (const [, pdata] of Object.entries((providers || {}) as Record<string, any>)) {
      if (!pdata || typeof pdata !== 'object') continue;
      const cats = (pdata as any).episodes || {};
      const list = (cats.sub || cats.dub || []) as any[];
      if (!Array.isArray(list) || !list.length) continue;
      for (const ep of list) {
        if (!ep || typeof ep.id === 'undefined' || typeof ep.number === 'undefined') continue;
        const title = String(ep.title || '');
        // Miruro occasionally injects separator rows like
        // "======== Pembatas Episode | Episode 1 – 900 Dalam Proses ======".
        if (/pembatas|^=+|=+$|dalam proses/i.test(title)) continue;
        // Miruro ids look like "watch/ally/21/sub/<base64>-N"; slashes break the
        // Express :episodeId route, so normalise them to dashes.
        out.push({
          id: String(ep.id).replace(/\//g, '-'),
          number: Number(ep.number),
          title: ep.title,
          image: ep.image,
          description: ep.description,
          releaseDate: ep.airDate,
          isSubbed: ep.audio === 'sub',
          isDubbed: ep.audio === 'dub',
          lang: ep.audio === 'dub' ? 'dub' : 'sub',
        });
      }
      break; // first provider with episodes only
    }
    return out.sort((a, b) => a.number - b.number);
  }

  private parseEpisodeId(episodeId: string): { provider: string; anilistId: number; category: string; slug: string } | null {
    // Ids are normalised to dashes (see buildEpisodes); accept both forms.
    const m = /^watch[-/]([^/-]+)[-/](\d+)[-/]?(sub|dub)[-/]?(.+)$/.exec(episodeId);
    if (!m) return null;
    return { provider: m[1], anilistId: Number(m[2]), category: m[3], slug: m[4] };
  }

  private async resolveAniListId(title: string): Promise<number | null> {
    const token = await getAniListToken();
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const query = `
      query ($q: String) {
        Page(page: 1, perPage: 15) {
          media(search: $q, type: ANIME, isAdult: false) { id title { romaji english native } format }
        }
      }
    `;
    try {
      const { data } = await axios.post(
        'https://graphql.anilist.co',
        { query, variables: { q: title } },
        { timeout: 15000, headers },
      );
      const media = data?.data?.Page?.media || [];
      if (!media.length) return null;
      let best = media[0];
      let bestScore = -Infinity;
      for (const m of media) {
        const sc = scoreCandidate(title, m);
        if (sc > bestScore) { bestScore = sc; best = m; }
      }
      return best?.id ? Number(best.id) : null;
    } catch {
      return null;
    }
  }
}