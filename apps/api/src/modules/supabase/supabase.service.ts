import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient: SupabaseClient;
  private publicClient: SupabaseClient;

  constructor() {
    this.adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.publicClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
  }

  getAdmin() {
    return this.adminClient;
  }

  getPublic() {
    return this.publicClient;
  }

  async createUser(metadata: {
    email: string;
    anilistId: number;
    anilistUsername: string;
    avatarUrl?: string;
  }) {
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: metadata.email,
      email_confirm: true,
      user_metadata: {
        anilist_id: metadata.anilistId,
        anilist_username: metadata.anilistUsername,
        avatar_url: metadata.avatarUrl,
      },
    });

    if (error) {
      this.logger.error('Failed to create Supabase user', error.message);
      throw error;
    }

    return data.user;
  }

  async findUserByAnilistId(anilistId: number) {
    const { data, error } = await this.adminClient.auth.admin.listUsers();

    if (error) throw error;

    return data.users.find(
      (u) => u.user_metadata?.anilist_id === anilistId,
    );
  }

  async findOrCreateUser(anilistUser: {
    id: number;
    name: string;
    email?: string;
    avatar?: { large?: string };
  }) {
    const existing = await this.findUserByAnilistId(anilistUser.id);
    if (existing) return existing;

    return this.createUser({
      email: anilistUser.email || `anilist-${anilistUser.id}@anilist.user`,
      anilistId: anilistUser.id,
      anilistUsername: anilistUser.name,
      avatarUrl: anilistUser.avatar?.large,
    });
  }
}
