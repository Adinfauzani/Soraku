import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export interface SeasonData { season: Season; year: number; startDate: Date; endDate: Date; }
export type RelationType = 'SEQUEL' | 'PREQUEL' | 'SIDE_STORY' | 'MOVIE' | 'OVA' | 'SPIN_OFF';
export interface RelationNode { animeId: number; title: string; coverImage: string | null; relationType: RelationType; format: string | null; status: string | null; episodes: number | null; score: number | null; }
export interface RelationGraph { rootId: number; nodes: RelationNode[]; }

const RELATIONS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { romaji english } coverImage { large } format status episodes averageScore
      relations { edges { relationType node { id title { romaji english } coverImage { large } format status episodes averageScore } } }
    }
  }`;

const RECOMMENDATIONS_QUERY = `
  query ($id: Int, $page: Int, $perPage: Int) {
    Media(id: $id, type: ANIME) {
      recommendations(page: $page, perPage: $perPage, sort: RATING_DESC) {
        nodes { mediaRecommendation { id title { romaji english } coverImage { large } format status episodes averageScore genres } }
      }
    }
  }`;

@Injectable()
export class Resolver {
  private readonly logger = new Logger(Resolver.name);
  private counter = 0;

  getCurrentSeason(): { season: Season; year: number } {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    if (m >= 2 && m <= 4) return { season: 'SPRING', year: y };
    if (m >= 5 && m <= 7) return { season: 'SUMMER', year: y };
    if (m >= 8 && m <= 10) return { season: 'FALL', year: y };
    return { season: 'WINTER', year: m === 11 ? y : y - 1 };
  }

  getSeasons(year?: number): SeasonData[] {
    const y = year ?? new Date().getFullYear();
    return [
      { season: 'WINTER', year: y, startDate: new Date(y, 0, 1), endDate: new Date(y, 2, 31) },
      { season: 'SPRING', year: y, startDate: new Date(y, 3, 1), endDate: new Date(y, 5, 30) },
      { season: 'SUMMER', year: y, startDate: new Date(y, 6, 1), endDate: new Date(y, 8, 30) },
      { season: 'FALL', year: y, startDate: new Date(y, 9, 1), endDate: new Date(y, 11, 31) },
    ];
  }

  async buildGraph(animeId: string): Promise<RelationGraph | null> {
    const id = parseInt(animeId, 10);
    if (isNaN(id)) return null;

    try {
      const { data } = await axios.post(ANILIST_API, { query: RELATIONS_QUERY, variables: { id } });
      const media = data.data?.Media;
      if (!media) return null;

      const nodes: RelationNode[] = [];
      const edges = media.relations?.edges ?? [];
      for (const e of edges) {
        nodes.push({
          animeId: e.node.id, title: e.node.title?.english ?? e.node.title?.romaji ?? '',
          coverImage: e.node.coverImage?.large ?? null, relationType: e.relationType as RelationType,
          format: e.node.format ?? null, status: e.node.status ?? null,
          episodes: e.node.episodes ?? null, score: e.node.averageScore ? e.node.averageScore / 10 : null,
        });
      }

      return { rootId: media.id, nodes };
    } catch { return null; }
  }

  async getSimilar(id: string): Promise<any[]> {
    const nid = parseInt(id, 10);
    if (isNaN(nid)) return [];

    try {
      const { data } = await axios.post(ANILIST_API, { query: RECOMMENDATIONS_QUERY, variables: { id: nid, page: 1, perPage: 20 } });
      const nodes = data.data?.Media?.recommendations?.nodes ?? [];
      return nodes.filter((n: any) => n.mediaRecommendation).map((n: any) => {
        const m = n.mediaRecommendation;
        return { id: String(m.id), title: m.title?.english || m.title?.romaji || '', image: m.coverImage?.large, format: m.format, status: m.status, episodes: m.episodes, rating: m.averageScore ? m.averageScore / 10 : null, genres: m.genres };
      });
    } catch { return []; }
  }
}
