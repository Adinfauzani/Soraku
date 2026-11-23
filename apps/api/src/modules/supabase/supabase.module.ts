import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseStrategy } from './strategies/supabase.strategy';

@Global()
@Module({
  providers: [SupabaseService, SupabaseStrategy],
  exports: [SupabaseService, SupabaseStrategy],
})
export class SupabaseModule {}
