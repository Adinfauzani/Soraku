import { Module } from '@nestjs/common';
import { SourcesModule } from './sources/module';
import { ApiModule } from './api.mod';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AnimeModule } from './anime/anime.mod';
import { SearchModule } from './search/search.mod';
import { WatchModule } from './watch/watch.mod';
import { ScheduleModule } from './schedule/schedule.mod';
import { ListingModule } from './listing/listing.mod';
import { HomeModule } from './home/home.mod';
import { MetaModule } from './meta/meta.mod';
import { RootModule } from './root/root.mod';
import { HealthModule } from './health/health.mod';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { StreamModule } from './modules/stream/module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    SourcesModule,
    ApiModule,
    AnimeModule,
    SearchModule,
    WatchModule,
    ScheduleModule,
    ListingModule,
    HomeModule,
    MetaModule,
    RootModule,
    HealthModule,
    FirebaseModule,
    AuthModule,
    SupabaseModule,
    StreamModule,
  ],
})
export class AppModule {}
