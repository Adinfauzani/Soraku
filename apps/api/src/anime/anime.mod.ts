import { Module } from '@nestjs/common';
import { AnimeController } from './anime.ctrl';
import { ApiModule } from '../api.mod';

@Module({
  imports: [ApiModule],
  controllers: [AnimeController],
})
export class AnimeModule {}
