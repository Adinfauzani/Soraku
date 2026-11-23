import { Module } from '@nestjs/common';
import { WatchController } from './watch.ctrl';

@Module({
  controllers: [WatchController],
})
export class WatchModule {}
