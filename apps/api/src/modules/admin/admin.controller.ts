import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Overview stats for admin dashboard' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('mappings')
  @ApiOperation({ summary: 'List all anime mappings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMappings(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.adminService.getMappings(parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('mappings')
  @ApiOperation({ summary: 'Create a new anime mapping' })
  createMapping(@Body() data: {
    anilistId: number;
    consumetId?: string;
    otakudesuId?: string;
    oploverzId?: string;
    hianimeId?: string;
    animekaiId?: string;
    kuramanimeId?: string;
    anoboyId?: string;
  }) {
    return this.adminService.createMapping(data);
  }

  @Patch('mappings/:id')
  @ApiOperation({ summary: 'Update an existing mapping' })
  updateMapping(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.adminService.updateMapping(id, data);
  }

  @Get('health')
  @ApiOperation({ summary: 'Full system health check' })
  getHealth() {
    return this.adminService.getHealth();
  }
}
