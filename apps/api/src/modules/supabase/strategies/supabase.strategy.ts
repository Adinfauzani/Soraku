import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';
import { env } from '../../../config/env';

interface SupabaseJwtPayload {
  sub: string;
  aud: string;
  role: string;
  email?: string;
  phone?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  iat: number;
  exp: number;
}

interface Jwk {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: Jwk[];
}

let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchJwks(): Promise<Jwk[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }
  const { data } = await axios.get<JwksResponse>(env.SUPABASE_JWKS_URL);
  jwksCache = { keys: data.keys, fetchedAt: now };
  return data.keys;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private readonly logger = new Logger(SupabaseStrategy.name);

  constructor() {
    super({
      secretOrKeyProvider: async (request: Request, rawJwtToken: string, done: (err: Error | null, secret?: string | Buffer) => void) => {
        try {
          let header: { kid?: string };
          try {
            header = JSON.parse(Buffer.from(rawJwtToken.split('.')[0], 'base64').toString('utf8'));
          } catch {
            return done(new Error('Invalid JWT header'));
          }

          const keys = await fetchJwks();
          const jwk = keys.find((k) => k.kid === header.kid);
          if (!jwk) {
            return done(new Error('Unable to find a key that matches'));
          }

          const pem = jwkToPem(jwk as unknown as any);
          return done(null, pem);
        } catch (err) {
          return done(err);
        }
      },
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      app_metadata: payload.app_metadata,
      user_metadata: payload.user_metadata,
    };
  }
}
