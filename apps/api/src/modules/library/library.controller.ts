import {
  Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('library')
@Controller('library')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  getFavorites(@CurrentUser('id') userId: string) {
    return this.libraryService.getFavorites(userId);
  }

  @Post('favorites/:anilistId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add anime to favorites' })
  addFavorite(@CurrentUser('id') userId: string, @Param('anilistId') anilistId: string) {
    return this.libraryService.addFavorite(userId, parseInt(anilistId));
  }

  @Delete('favorites/:anilistId')
  @ApiOperation({ summary: 'Remove anime from favorites' })
  removeFavorite(@CurrentUser('id') userId: string, @Param('anilistId') anilistId: string) {
    return this.libraryService.removeFavorite(userId, parseInt(anilistId));
  }

  @Get('watchlist')
  @ApiOperation({ summary: 'Get user watchlist' })
  getWatchlist(@CurrentUser('id') userId: string) {
    return this.libraryService.getWatchlist(userId);
  }

  @Post('watchlist/:anilistId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add anime to watchlist' })
  addToWatchlist(
    @CurrentUser('id') userId: string,
    @Param('anilistId') anilistId: string,
    @Body('status') status?: string,
  ) {
    return this.libraryService.addToWatchlist(userId, parseInt(anilistId), status);
  }

  @Delete('watchlist/:anilistId')
  @ApiOperation({ summary: 'Remove anime from watchlist' })
  removeFromWatchlist(@CurrentUser('id') userId: string, @Param('anilistId') anilistId: string) {
    return this.libraryService.removeFromWatchlist(userId, parseInt(anilistId));
  }

  @Patch('watchlist/:anilistId')
  @ApiOperation({ summary: 'Update watchlist item' })
  updateWatchlistItem(
    @CurrentUser('id') userId: string,
    @Param('anilistId') anilistId: string,
    @Body() data: { status?: string; progress?: number },
  ) {
    return this.libraryService.updateWatchlistItem(userId, parseInt(anilistId), data);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get watch history' })
  getHistory(@CurrentUser('id') userId: string) {
    return this.libraryService.getHistory(userId);
  }

  @Post('progress')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Update watch progress' })
  updateProgress(
    @CurrentUser('id') userId: string,
    @Body('anilistId') anilistId: string,
    @Body('episode') episode: number,
    @Body('progress') progress: number,
  ) {
    return this.libraryService.updateProgress(userId, parseInt(anilistId), episode, progress);
  }

  @Get('continue-watching')
  @ApiOperation({ summary: 'Get continue-watching items' })
  getContinueWatching(@CurrentUser('id') userId: string) {
    return this.libraryService.getContinueWatching(userId);
  }
}
