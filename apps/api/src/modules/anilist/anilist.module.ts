import { Module } from '@nestjs/common';
import { AnilistClient } from './anilist.client';
import { AnilistService } from './anilist.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [AnilistClient, AnilistService],
  exports: [AnilistService],
})
export class AnilistModule {}
