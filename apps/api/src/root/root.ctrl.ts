import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class RootController {
  @Get()
  @ApiOperation({ summary: 'API root info' })
  root() {
    return {
      name: 'Soraku API',
      version: '1.0.0',
      status: 'online',
      docs: '/api/docs',
      inspiredBy: 'Miruro',
      endpoints: [
        '/api/home',
        '/api/meta',
        '/api/trending',
        '/api/popular',
        '/api/top-rated',
        '/api/upcoming',
        '/api/spotlight',
        '/api/schedule',
        '/api/anime/:anilistId',
        '/api/anime/:anilistId/characters',
        '/api/anime/:anilistId/relations',
        '/api/anime/:anilistId/recommendations',
        '/api/watch/:anilistId/:slug/episodes',
        '/api/watch/:anilistId/:slug/episodes/:episodeId',
        '/api/search',
        '/api/search/filter',
        '/api/health',
      ],
    };
  }
}
