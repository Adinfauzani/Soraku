import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.ctrl';

@Module({
  controllers: [ScheduleController],
})
export class ScheduleModule {}
