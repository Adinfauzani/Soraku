import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  // Database
  DATABASE_URL: z.string().startsWith('postgresql://').or(z.string().startsWith('file:')).or(z.string().url()),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // Server
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // JWT (fallback, main auth is Supabase now)
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Supabase Auth
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string(),
  SUPABASE_SECRET_KEY: z.string(),
  SUPABASE_JWKS_URL: z.string().url(),

  // AniList OAuth
  ANILIST_CLIENT_ID: z.string(),
  ANILIST_CLIENT_SECRET: z.string(),
  ANILIST_REDIRECT_URI: z.string().default('soraku://anilist-callback'),

  // External API keys
  TMDB_API_KEY: z.string().optional(),
  MAL_CLIENT_ID: z.string().optional(),

  // Cloudflare R2
  CLOUDFLARE_R2_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_SECRET_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET: z.string().optional(),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().optional(),

  // Stream providers
  CONSUMET_API_URL: z.string().url().default('https://kuroji-api-j4mh.onrender.com'),
  API_STREAMS_BASE_URL: z.string().url().default('https://apistreams.vercel.app'),
  WAJIK_API_URL: z.string().url().default('http://localhost:3001'),
  MIRURO_API_URL: z.string().url().default('http://localhost:3002'),
  DEFAULT_SUBTITLE_LANG: z.string().default('id'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),

  // Admin
  ADMIN_API_KEY: z.string().optional(),

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),

  // Bull/Queue
  BULL_REDIS_PREFIX: z.string().default('{soraku}'),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
});

export const env = schema.parse(process.env);
