import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly api: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'Get airing schedule' })
  async getSchedule() {
    const data = await this.api.getSchedule();
    return Unified.ok(data, 'anilist');
  }
}
