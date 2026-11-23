import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { env } from '../../../config/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET ?? 'fallback-secret-not-for-production',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    try {
      const user = await this.usersService.findById(payload.sub);
      if (user) return user;
    } catch {
      // DB not available, try Supabase
    }

    try {
      const { data: supabaseUser } = await this.supabase.getAdmin().auth.admin.getUserById(payload.sub);
      if (supabaseUser?.user) {
        return {
          id: supabaseUser.user.id,
          email: supabaseUser.user.email,
          username: supabaseUser.user.user_metadata?.anilist_username,
          avatar: supabaseUser.user.user_metadata?.avatar_url,
          role: 'user',
        };
      }
    } catch {
      // Supabase also not available
    }

    throw new UnauthorizedException('User not found');
  }
}
