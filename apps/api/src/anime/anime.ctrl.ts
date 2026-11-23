import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Providers that can produce real episode lists by title when AniList reports 0 eps.
const EPISODE_PROVIDERS = ['Otakudesu', 'Miruro', 'Wajik', 'Oploverz'];

@ApiTags('anime')
@Controller('anime')
export class AnimeController {
  constructor(private readonly api: ApiService) {}

  @Get(':anilistId')
  @ApiOperation({ summary: 'Get anime details by AniList ID' })
  async getInfo(@Param('anilistId') anilistId: string) {
    const data = await this.api.getInfo(anilistId);
    if (!data) return Unified.fail('Anime not found');
    return Unified.ok(data, 'anilist');
  }

  @Get(':anilistId/episodes')
  @ApiOperation({ summary: 'Episode list for an anime' })
  async getEpisodes(@Param('anilistId') anilistId: string) {
    const eps = await this.api.getAnimeEpisodes(anilistId);
    return eps;
  }

  @Get(':anilistId/characters')
  @ApiOperation({ summary: 'Get anime characters' })
  async getCharacters(@Param('anilistId') anilistId: string) {
    const data = await this.api.getCharacters(anilistId);
    return Unified.ok(data, 'anilist');
  }

  @Get(':anilistId/relations')
  @ApiOperation({ summary: 'Get anime relations' })
  async getRelations(@Param('anilistId') anilistId: string) {
    const data = await this.api.getRelations(anilistId);
    return Unified.ok(data, 'anilist');
  }

  @Get(':anilistId/recommendations')
  @ApiOperation({ summary: 'Get anime recommendations' })
  async getRecommendations(@Param('anilistId') anilistId: string) {
    const data = await this.api.getRecommendations(anilistId);
    return Unified.ok(data, 'anilist');
  }

  @Get(':anilistId/:slug')
  @ApiOperation({ summary: 'Get anime with slug validation' })
  async getInfoWithSlug(
    @Param('anilistId') anilistId: string,
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    const data = await this.api.getInfo(anilistId);
    if (!data) {
      return res.status(404).json(Unified.fail('Anime not found'));
    }
    const expectedSlug = slugify(data.englishTitle || data.title);
    if (slug !== expectedSlug) {
      return res.redirect(308, `/api/anime/${anilistId}/${expectedSlug}`);
    }
    return res.json(Unified.ok(data, 'anilist'));
  }
}
