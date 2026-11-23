import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';
import type { Request } from 'express';

@ApiTags('watch')
@Controller('watch')
export class WatchController {
  constructor(private readonly api: ApiService) {}

  private withProxyUrls(data: any, proxy: string | undefined, req?: Request): any {
    if (proxy !== 'true' || !req || !data?.sources) return data;
    const proxyBase = `${req.protocol}://${req.get('host')}/api/stream/proxy/fetch?url=`;
    return {
      ...data,
      sources: data.sources.map((s: { url: string }) => ({
        ...s,
        url: `${proxyBase}${encodeURIComponent(s.url)}`,
      })),
    };
  }

  @Get(':anilistId/:slug/episodes')
  @ApiOperation({ summary: 'Get provider-native episodes for a server' })
  @ApiQuery({ name: 'server', required: false })
  @ApiQuery({ name: 'title', required: false })
  async getEpisodesByServer(
    @Param('anilistId') anilistId: string,
    @Param('slug') slug: string,
    @Query('server') server?: string,
    @Query('title') title?: string,
  ) {
    const data = await this.api.getEpisodesFromServer(server, title, anilistId);
    if (!data) return Unified.fail('No episodes found for server');
    return Unified.ok(data, server ?? 'soraku');
  }

  @Get(':anilistId/:slug/episodes/:episodeId')
  @ApiOperation({ summary: 'Get stream sources for a provider-native episode id' })
  @ApiQuery({ name: 'server', required: false })
  @ApiQuery({ name: 'ep', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'proxy', required: false })
  @ApiQuery({ name: 'lang', required: false, enum: ['sub', 'dub'] })
  async getSourceByServer(
    @Param('anilistId') anilistId: string,
    @Param('slug') slug: string,
    @Param('episodeId') episodeId: string,
    @Query('server') server?: string,
    @Query('ep') ep = '1',
    @Query('title') title?: string,
    @Query('proxy') proxy?: string,
    @Query('lang') lang?: string,
    @Req() req?: Request,
  ) {
    const audio = lang === 'dub' ? 'dub' : 'sub';
    const data = await this.api.getStreamFromServer(server, anilistId, parseInt(ep), title, audio);
    if (!data) return Unified.fail('No stream found');
    return Unified.ok(this.withProxyUrls(data, proxy, req), server ?? 'soraku');
  }
}
