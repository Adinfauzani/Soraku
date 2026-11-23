import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiService } from '../api.svc';
import { Unified } from '../unified';

@ApiTags('meta')
@Controller('meta')
export class MetaController {
  constructor(private readonly api: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'List available servers and stream sources' })
  async getMeta() {
    return Unified.ok(this.api.getMeta());
  }
}