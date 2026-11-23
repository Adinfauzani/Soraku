import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { CacheService } from './cache.service';
import { Normalizer } from './normalizer';

@Global()
@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
    CacheService,
    Normalizer,
  ],
  exports: [CacheService, Normalizer],
})
export class CommonModule {}
