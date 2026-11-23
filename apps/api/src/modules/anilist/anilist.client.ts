import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800;

export interface AnilistResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable()
export class AnilistClient {
  private readonly logger = new Logger(AnilistClient.name);

  async query<T>(query: string, variables?: Record<string, any>): Promise<T | null> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await axios.post<AnilistResponse<T>>(
          ANILIST_API,
          { query, variables },
          { timeout: 10000 },
        );
        if (data.errors) {
          const msg = data.errors.map((e) => e.message).join(', ');
          if (/temporarily disabled|rate ?limit/i.test(msg) && attempt < MAX_RETRIES) {
            await this.wait(attempt);
            continue;
          }
          this.logger.warn(`GraphQL errors: ${msg}`);
          return null;
        }
        return data.data ?? null;
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        const isRetryable = !status || status >= 500 || status === 429;
        if (isRetryable && attempt < MAX_RETRIES) {
          await this.wait(attempt);
          continue;
        }
        this.logger.error(`Anilist API error: ${err?.message || 'unknown'}`);
        return null;
      }
    }
    this.logger.error(`Anilist API error after ${MAX_RETRIES} attempts: ${(lastErr as any)?.message || 'unknown'}`);
    return null;
  }

  private async wait(attempt: number): Promise<void> {
    const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
    await new Promise((r) => setTimeout(r, delay));
  }

  async health(): Promise<boolean> {
    try {
      await axios.post(
        ANILIST_API,
        { query: 'query { Page(perPage: 1) { media(type: ANIME) { id } } }' },
        { timeout: 5000 },
      );
      return true;
    } catch {
      return false;
    }
  }
}
