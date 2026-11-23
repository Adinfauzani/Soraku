import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';

const STATUS_MAP: Record<string, string> = {
  Ongoing: 'RELEASING',
  ongoing: 'RELEASING',
  Completed: 'FINISHED',
  completed: 'FINISHED',
  Upcoming: 'NOT_YET_RELEASED',
  upcoming: 'NOT_YET_RELEASED',
};

const FORMAT_MAP: Record<string, string> = {
  TV: 'TV',
  Movie: 'MOVIE',
  OVA: 'OVA',
  Special: 'SPECIAL',
  ONA: 'ONA',
  Music: 'MUSIC',
};

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly api: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'Search anime by query' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  async search(@Query('query') query: string, @Query('page') page = '1', @Query('per_page') perPage = '20') {
    if (!query) return Unified.fail('query parameter is required');
    const data = await this.api.search(query, parseInt(page), parseInt(perPage));
    return Unified.ok(data, 'anilist');
  }

  @Get('filter')
  @ApiOperation({ summary: 'Filter anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'season', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'format', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'genres_exclude', required: false })
  @ApiQuery({ name: 'studio', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'min_score', required: false })
  async filter(
    @Query('page') page = '1',
    @Query('per_page') perPage = '20',
    @Query('year') year?: string,
    @Query('season') season?: string,
    @Query('status') status?: string,
    @Query('format') format?: string,
    @Query('type') type?: string,
    @Query('genre') genre?: string,
    @Query('genres_exclude') genresExclude?: string,
    @Query('studio') studio?: string,
    @Query('sort') sort?: string,
    @Query('min_score') minScore?: string,
  ) {
    const mappedStatus = status ? (STATUS_MAP[status] || status.toUpperCase()) : undefined;
    const mappedFormat = format ? (FORMAT_MAP[format] || format) : undefined;
    const mappedType = type ? (FORMAT_MAP[type] || type) : undefined;
    const data = await this.api.filter(parseInt(page), parseInt(perPage), {
      year,
      season,
      status: mappedStatus,
      format: mappedFormat || mappedType,
      genre,
      genres_exclude: genresExclude,
      studio,
      sort,
      min_score: minScore ? parseInt(minScore) : undefined,
    });
    return Unified.ok(data, 'anilist');
  }
}
