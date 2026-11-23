import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { AnimeEntry, EpisodeInfo, SearchResult, StreamResult, Provider } from './types';

const BASE = 'https://otakudesu.blog';

@Injectable()
export class Otakudesu implements Provider {
  readonly name = 'Otakudesu';
  readonly type = 'indonesian' as const;

  private get http() {
    return axios.create({ baseURL: BASE, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    const { data } = await this.http.get(`/?s=${encodeURIComponent(query)}&post_type=anime&page=${page}`);
    return { results: this.parseEntries(data) };
  }

  async info(id: string): Promise<AnimeEntry | null> {
    try {
      const { data } = await this.http.get(`/anime/${id}/`);
      const $ = cheerio.load(data);
      const infoZing = $('.infozingle p')
        .map((_, el) => $(el).text().trim())
        .get();

      const field = (label: string): string | undefined => {
        const line = infoZing.find((l) => l.startsWith(label));
        if (!line) return undefined;
        return line.replace(label, '').replace(':', '').trim();
      };

      const genres: string[] = [];
      $('.infozingle a[rel="tag"]').each((_, e) => {
        const g = $(e).text().trim();
        if (g) genres.push(g);
      });

      return {
        id,
        title: field('Judul') || $('h1').first().text().trim(),
        image: $('.post-thumbnail img, .thumb img, .series-thumb img').first().attr('src'),
        description: $('.entry-content p, .desc p').first().text().trim(),
        genres,
        status: field('Status') || 'UNKNOWN',
        totalEpisodes: field('Total') ? Number(field('Total')?.replace(/\D/g, '') || 0) : undefined,
        episodes: this.parseEpisodes($),
      };
    } catch { return null; }
  }

  async stream(episodeId: string): Promise<StreamResult | null> {
    try {
      const { data } = await this.http.get(episodeId.startsWith('http') ? episodeId : `/episode/${episodeId}/`);
      const $ = cheerio.load(data);
      const sources: any[] = [];
      $('iframe').each((_, el) => {
        const src = $(el).attr('src');
        if (src) sources.push({ url: src, quality: 'iframe', isM3U8: false });
      });
      $('source').each((_, el) => {
        const src = $(el).attr('src');
        if (src) sources.push({ url: src, quality: '720p', isM3U8: src.includes('.m3u8') });
      });
      return { sources, subtitles: [] };
    } catch { return null; }
  }

  async health(): Promise<boolean> {
    try { await this.http.get('/', { timeout: 5000 }); return true; } catch { return false; }
  }

  async infoFromTitle(title: string): Promise<AnimeEntry | null> {
    const sr = await this.search(title, 1);
    const first = sr.results[0];
    if (!first) return null;
    return this.info(first.id);
  }

  private parseEpisodes($: cheerio.CheerioAPI): EpisodeInfo[] {
    const episodes: EpisodeInfo[] = [];
    $('.episodelist ul li a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const m = href.match(/\/episode\/([^/]+)\/?$/);
      if (!m) return;
      const id = m[1];
      const numMatch = id.match(/episode[-_ ]?(\d+)/i) || id.match(/(-?(\d+)(?:[-_.]|$))/);
      episodes.push({
        id,
        number: numMatch ? parseInt(numMatch[1], 10) : episodes.length + 1,
        title: $(el).text().trim(),
      });
    });
    return episodes.sort((a, b) => a.number - b.number);
  }

  private parseEntries(html: string): AnimeEntry[] {
    const $ = cheerio.load(html);
    const results: AnimeEntry[] = [];
    // Current otakudesu.blog theme: <h2><a href=".../anime/{slug}/" title="...">{title}</a></h2>
    // with a poster <img> inside the preceding card.
    $('h2 a[href*="/anime/"]').each((_, el) => {
      const link = $(el);
      const href = link.attr('href') || '';
      const slug = href.split('/').filter(Boolean).pop() || '';
      const title = link.text().trim() || link.attr('title') || '';
      const img = link.parent().prev().find('img').first().attr('src')
        || link.parent().parent().find('img').first().attr('src');
      if (title && slug) results.push({ id: slug, title, image: img });
    });
    // Legacy selectors (older themes / category pages)
    $('.animposx, .chivsrc li, article, .post-show li').each((_, el) => {
      const link = $(el).find('a').first();
      const title = link.attr('title') || link.text().trim();
      const href = link.attr('href') || '';
      const slug = href.split('/').filter(Boolean).pop() || '';
      const img = $(el).find('img').first().attr('src');
      if (title && slug && !results.some((r) => r.id === slug)) results.push({ id: slug, title, image: img });
    });
    return results;
  }
}
