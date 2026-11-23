import { Module } from '@nestjs/common';
import { ListingController } from './listing.ctrl';

@Module({
  controllers: [ListingController],
})
export class ListingModule {}
