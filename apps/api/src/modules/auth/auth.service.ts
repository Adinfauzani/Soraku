import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { env } from '../../config/env';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async register(dto: RegisterDto) {
    if (!env.JWT_SECRET) {
      throw new UnauthorizedException('Local auth is disabled, use AniList login');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async login(dto: LoginDto) {
    if (!env.JWT_SECRET) {
      throw new UnauthorizedException('Local auth is disabled, use AniList login');
    }

    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return user;
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token) as { sub: string; email: string; role: string };
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      const newToken = this.generateToken(user);
      return { token: newToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token) as { sub: string; email: string; role: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getMe(userId: string) {
    try {
      const user = await this.usersService.findById(userId);
      if (user) return this.sanitizeUser(user);
    } catch {
      // DB not available, try Supabase
    }

    try {
      const { data } = await this.supabase.getAdmin().auth.admin.getUserById(userId);
      if (!data?.user) throw new UnauthorizedException('User not found');

      const meta = data.user.user_metadata ?? {};
      return {
        id: data.user.id,
        email: data.user.email,
        username: meta.anilist_username ?? data.user.email?.split('@')[0],
        avatar: meta.avatar_url ?? null,
        role: 'user',
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('User not found');
    }
  }

  async loginWithAnilist(code: string, redirectUri?: string) {
    const anilistToken = await this.exchangeAnilistCode(code, redirectUri);
    const anilistUser = await this.fetchAnilistUser(anilistToken.access_token);

    const supabaseUser = await this.supabase.findOrCreateUser(anilistUser);

    const accessToken = this.jwtService.sign({
      sub: supabaseUser.id,
      email: supabaseUser.email,
      role: 'user',
      anilist_id: anilistUser.id,
      anilist_username: anilistUser.name,
    });

    const refreshToken = this.jwtService.sign(
      { sub: supabaseUser.id, email: supabaseUser.email, role: 'user' },
      { expiresIn: '30d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: anilistUser.name,
        avatar: anilistUser.avatar?.large,
      },
    };
  }

  getAnilistOAuthUrl(redirectUri?: string) {
    const redirect = redirectUri || env.ANILIST_REDIRECT_URI;
    const params = new URLSearchParams({
      client_id: env.ANILIST_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirect,
    });

    return { url: `https://anilist.co/api/v2/oauth/authorize?${params.toString()}` };
  }

  async connectAnilist(code: string, redirectUri?: string) {
    const token = await this.exchangeAnilistCode(code, redirectUri);
    const anilistUser = await this.fetchAnilistUser(token.access_token);

    return {
      accessToken: token.access_token,
      username: anilistUser.name,
      avatar: anilistUser.avatar?.large ?? null,
    };
  }

  async trackAnilist(input: { accessToken: string; mediaId: number; status?: string; progress?: number }) {
    const validStatuses = ['CURRENT', 'PLANNING', 'COMPLETING', 'REPEATING', 'PAUSED', 'DROPPED', 'COMPLETED'];
    const status = input.status || 'PLANNING';
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid AniList status');
    }

    const query = `
      mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int) {
        SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress) {
          id
          status
          progress
          media { id title { romaji } }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          mediaId: input.mediaId,
          status,
          progress: input.progress ?? undefined,
        },
      }),
    });

    const json = (await res.json()) as {
      data?: { SaveMediaListEntry?: { id: number; status?: string; progress?: number } };
      errors?: { message: string }[];
    };

    if (!res.ok || !json.data?.SaveMediaListEntry) {
      this.logger.error('AniList save list entry failed', JSON.stringify(json));
      throw new UnauthorizedException(json.errors?.[0]?.message || 'Failed to save to AniList');
    }

    return json.data.SaveMediaListEntry;
  }

  async loginWithFirebase(decodedToken: { uid: string; email?: string; name?: string; picture?: string }) {
    const email = decodedToken.email || `${decodedToken.uid}@firebase.user`;

    // Find existing user by email (Firebase UID is not a UUID, can't use getUserById)
    const { data: listResult } = await this.supabase.getAdmin().auth.admin.listUsers();
    let supabaseUser = (listResult.users as any[]).find(u => u.email === email) ?? null;

    if (!supabaseUser) {
      supabaseUser = await this.supabase.createUser({
        email,
        anilistId: 0,
        anilistUsername: decodedToken.name || email.split('@')[0],
        avatarUrl: decodedToken.picture,
      });
    }

    const accessToken = this.jwtService.sign({
      sub: supabaseUser.id,
      email: supabaseUser.email,
      role: 'user',
    });

    const refreshToken = this.jwtService.sign(
      { sub: supabaseUser.id, email: supabaseUser.email, role: 'user' },
      { expiresIn: '30d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: supabaseUser.user_metadata?.anilist_username ?? decodedToken.name ?? email.split('@')[0],
        avatar: supabaseUser.user_metadata?.avatar_url ?? decodedToken.picture,
      },
    };
  }

  private async exchangeAnilistCode(code: string, redirectUri?: string) {
    const url = 'https://anilist.co/api/v2/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.ANILIST_CLIENT_ID,
      client_secret: env.ANILIST_CLIENT_SECRET,
      redirect_uri: redirectUri || 'http://localhost:4000/api/auth/anilist/callback',
      code,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error('AniList token exchange failed', `${res.status}: ${text}`);
      throw new UnauthorizedException('Failed to authenticate with AniList');
    }

    return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
  }

  private async fetchAnilistUser(accessToken: string) {
    const query = `
      query {
        Viewer {
          id
          name
          avatar { large }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error('AniList user fetch failed', `${res.status}: ${res.headers.get('content-type')}`);
      this.logger.error('AniList response body', text);
      throw new UnauthorizedException('Failed to fetch AniList profile');
    }

    const json = await res.json() as { data: { Viewer: { id: number; name: string; avatar?: { large?: string } } } };

    if (!json.data?.Viewer) {
      this.logger.error('AniList returned no Viewer data', JSON.stringify(json));
      throw new UnauthorizedException('Failed to get AniList profile');
    }

    return json.data.Viewer;
  }

  private generateToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser<T extends { passwordHash?: string | null }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
