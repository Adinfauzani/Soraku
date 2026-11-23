import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly api: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'Get home/discover data' })
  async getHome() {
    const data = await this.api.discover();
    return Unified.ok(data, 'anilist');
  }
}
