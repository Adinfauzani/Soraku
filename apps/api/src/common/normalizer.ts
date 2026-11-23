import { Injectable } from '@nestjs/common';
import type { AnimeEntry, EpisodeInfo, SearchResult, StreamResult } from '../sources/types';
import { AnimeDTO, EpisodeDTO, SearchResultDTO, StreamResultDTO, StreamSourceDTO, SubtitleDTO } from './dto/anime.dto';

@Injectable()
export class Normalizer {
  toAnimeDTO(item: any): AnimeDTO {
    return {
      id: String(item.id ?? ''),
      title: item.title ?? '',
      englishTitle: item.englishTitle || item.titleEnglish,
      romajiTitle: item.romajiTitle || item.romaji,
      nativeTitle: item.nativeTitle || item.titleNative,
      image: item.image || item.poster || item.posterUrl || item.coverImage?.large || item.coverImage?.medium || null,
      poster: item.image || item.poster || item.posterUrl || item.coverImage?.large || item.coverImage?.medium || null,
      banner: item.banner || item.bannerImage || item.cover || null,
      cover: item.cover || item.coverImage?.large || null,
      description: item.description || null,
      genres: Array.isArray(item.genres) ? item.genres : [],
      rating: item.rating ?? item.score ?? undefined,
      episodes: item.episodes ?? item.totalEpisodes ?? undefined,
      totalEpisodes: item.totalEpisodes ?? item.episodes ?? undefined,
      status: item.status ?? undefined,
      type: item.type ?? undefined,
      season: item.season ?? undefined,
      year: item.year ?? undefined,
      studios: Array.isArray(item.studios) ? item.studios : [],
      producers: Array.isArray(item.producers) ? item.producers : [],
      licensors: Array.isArray(item.licensors) ? item.licensors : [],
      duration: item.duration ?? undefined,
      trailer: item.trailer ?? undefined,
      releaseDate: item.releaseDate ?? undefined,
      endDate: item.endDate ?? undefined,
      ageRating: item.ageRating ?? undefined,
      ageRatingGuide: item.ageRatingGuide ?? undefined,
      artworks: Array.isArray(item.artworks) ? item.artworks : [],
      nextAiringEpisode: item.nextAiringEpisode ?? undefined,
    };
  }

  toAnimeDTOs(items: any[]): AnimeDTO[] {
    return (items || []).map((item) => this.toAnimeDTO(item));
  }

  toEpisodeDTO(ep: any): EpisodeDTO {
    return {
      id: String(ep.id ?? ''),
      number: ep.number ?? 0,
      title: ep.title ?? undefined,
      image: ep.image ?? ep.thumbnail ?? undefined,
      isSubbed: ep.isSubbed ?? true,
      isDubbed: ep.isDubbed ?? false,
      releaseDate: ep.releaseDate ?? undefined,
      duration: ep.duration ?? undefined,
    };
  }

  toEpisodeDTOs(eps: any[]): EpisodeDTO[] {
    return (eps || []).map((ep) => this.toEpisodeDTO(ep));
  }

  toSearchResult(input: any, page: number): SearchResultDTO {
    if (input?.animes) {
      return {
        animes: this.toAnimeDTOs(input.animes),
        totalPages: input.totalPages ?? 1,
        currentPage: input.currentPage ?? page,
        hasNextPage: input.hasNextPage,
      };
    }
    const results = Array.isArray(input) ? input : input?.results ?? [];
    return {
      animes: this.toAnimeDTOs(results),
      totalPages: 1,
      currentPage: page,
    };
  }

  toStreamResult(input: any): StreamResultDTO {
    if (!input) return { sources: [], subtitles: [] };
    return {
      sources: (input.sources || []).map((s: any): StreamSourceDTO => ({
        url: s.url,
        quality: s.quality || 'default',
        isM3U8: s.isM3U8 || s.url?.includes('.m3u8'),
      })),
      subtitles: (input.subtitles || []).map((s: any): SubtitleDTO => ({
        url: s.url,
        lang: s.lang || s.language || 'en',
        label: s.label,
      })),
      headers: input.headers ?? undefined,
    };
  }
}
