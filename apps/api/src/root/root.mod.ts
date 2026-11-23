import { Module } from '@nestjs/common';
import { RootController } from './root.ctrl';

@Module({
  controllers: [RootController],
})
export class RootModule {}
