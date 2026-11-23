import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';

@ApiTags('listing')
@Controller()
export class ListingController {
  constructor(private readonly api: ApiService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Get trending anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getTrending(@Query('page') page = '1', @Query('per_page') perPage = '20', @Query('year') year?: string) {
    const data = await this.api.getTrending(parseInt(page), parseInt(perPage), year ? parseInt(year) : undefined);
    return Unified.ok(data, 'anilist');
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getPopular(@Query('page') page = '1', @Query('per_page') perPage = '20', @Query('year') year?: string) {
    const data = await this.api.getPopular(parseInt(page), parseInt(perPage), year ? parseInt(year) : undefined);
    return Unified.ok(data, 'anilist');
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top rated anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getTopRated(@Query('page') page = '1', @Query('per_page') perPage = '20', @Query('year') year?: string) {
    const data = await this.api.getTopRated(parseInt(page), parseInt(perPage), year ? parseInt(year) : undefined);
    return Unified.ok(data, 'anilist');
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming/airing anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  async getUpcoming(@Query('page') page = '1', @Query('per_page') perPage = '20') {
    const data = await this.api.getUpcoming(parseInt(page), parseInt(perPage));
    return Unified.ok(data, 'anilist');
  }

  @Get('spotlight')
  @ApiOperation({ summary: 'Get spotlight/featured anime' })
  async getSpotlight() {
    const data = await this.api.getSpotlight();
    return Unified.ok(data, 'anilist');
  }

  @Get('seasonal')
  @ApiOperation({ summary: 'Get seasonal anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'season', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getSeasonal(@Query('page') page = '1', @Query('season') season?: string, @Query('year') year?: string) {
    const data = await this.api.getSeasonal(parseInt(page), 20, season, year ? parseInt(year) : undefined);
    return Unified.ok(data, 'anilist');
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent anime' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  async getRecent(@Query('page') page = '1', @Query('per_page') perPage = '20') {
    const data = await this.api.getRecent(parseInt(page), parseInt(perPage));
    return Unified.ok(data, 'anilist');
  }
}
