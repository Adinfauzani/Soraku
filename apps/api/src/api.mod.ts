import { Global, Module } from '@nestjs/common';
import { ApiService } from './api.svc';
import { AnilistModule } from './modules/anilist/anilist.module';

@Global()
@Module({
  imports: [AnilistModule],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiModule {}
