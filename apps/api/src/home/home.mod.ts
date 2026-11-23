import { Module } from '@nestjs/common';
import { HomeController } from './home.ctrl';

@Module({
  controllers: [HomeController],
})
export class HomeModule {}
