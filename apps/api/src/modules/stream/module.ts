import { Module } from '@nestjs/common';
import { Stream } from './stream';
import { CommonModule } from '../../common/common.module';
import { SourcesModule as LegacySourcesModule } from '../../sources/module';
import { SourcesModule } from '../sources/sources.module';

@Module({
  imports: [CommonModule, LegacySourcesModule, SourcesModule],
  controllers: [Stream],
})
export class StreamModule {}