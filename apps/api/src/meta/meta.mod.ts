import { Module } from '@nestjs/common';
import { MetaController } from './meta.ctrl';

@Module({
  controllers: [MetaController],
})
export class MetaModule {}