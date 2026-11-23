import { Module } from '@nestjs/common';
import { SearchController } from './search.ctrl';

@Module({
  controllers: [SearchController],
})
export class SearchModule {}
