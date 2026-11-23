import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export enum CacheTTL {
  METADATA = 86400,
  EPISODES = 43200,
  STREAM = 3600,
  HEALTH = 300,
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;
  private redis: any = null;
  private redisAvailable = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!url) {
      this.logger.log('No Redis URL configured, using in-memory cache');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-es/no-var-requires
      const Redis = require('ioredis');
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        lazyConnect: true,
      });
      this.redis.on('error', (err: Error) => {
        this.logger.warn(`Redis error: ${err.message}`);
        this.redisAvailable = false;
      });
      this.redis.connect().then(() => {
        this.redisAvailable = true;
        this.logger.log('Redis connected');
      }).catch((err: Error) => {
        this.logger.warn(`Redis connection failed: ${err.message}, using in-memory fallback`);
      });
    } catch (err) {
      this.logger.warn(`Redis init failed: ${(err as Error).message}, using in-memory cache`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisAvailable && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw) {
          this.hits++;
          return JSON.parse(raw) as T;
        }
      } catch {}
    }
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {}
    }
    this.store.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    if (this.store.size > 10000) {
      this.evictExpired();
    }
  }

  async del(key: string): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try { await this.redis.del(key); } catch {}
    }
    this.store.delete(key);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const data = await factory();
    await this.set(key, data, ttlSeconds);
    return data;
  }

  async flush(pattern?: string): Promise<void> {
    if (!pattern) {
      this.store.clear();
      return;
    }
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  getStats() {
    return {
      size: this.store.size,
      redisAvailable: this.redisAvailable,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}
