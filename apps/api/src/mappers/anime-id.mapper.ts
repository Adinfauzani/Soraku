import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';

export interface AnimeMappingResult {
  id: string;
  anilistId: number;
  consumetId: string | null;
  otakudesuId: string | null;
  oploverzId: string | null;
  hianimeId: string | null;
  animekaiId: string | null;
  kuramanimeId: string | null;
  anoboyId: string | null;
}

export interface CreateMappingInput {
  anilistId: number;
  consumetId?: string;
  otakudesuId?: string;
  oploverzId?: string;
  hianimeId?: string;
  animekaiId?: string;
  kuramanimeId?: string;
  anoboyId?: string;
}

const CACHE_PREFIX = 'anime-mapping:';
const CACHE_TTL = 24 * 60 * 60 * 1000;

@Injectable()
export class AnimeIdMapper {
  private readonly logger = new Logger(AnimeIdMapper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async toCanonical(externalId: string, source: 'anilist' | 'mal' | 'tmdb'): Promise<string | null> {
    if (source === 'anilist') return externalId;

    const cacheKey = `${CACHE_PREFIX}${source}:${externalId}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const numId = parseInt(externalId, 10);
    if (isNaN(numId)) return null;

    const mapping = await this.prisma.animeMapping.findFirst({
      where: source === 'mal' ? {} : {},
    });

    if (!mapping) return null;

    const anilistId = String(mapping.anilistId);
    await this.cache.set(cacheKey, anilistId, CACHE_TTL);
    return anilistId;
  }

  async getMapping(anilistId: number): Promise<AnimeMappingResult | null> {
    const cacheKey = `${CACHE_PREFIX}${anilistId}`;
    const cached = await this.cache.get<AnimeMappingResult>(cacheKey);
    if (cached) return cached;

    const mapping = await this.prisma.animeMapping.findUnique({
      where: { anilistId },
    });

    if (!mapping) return null;

    const result: AnimeMappingResult = {
      id: mapping.id,
      anilistId: mapping.anilistId,
      consumetId: mapping.consumetId,
      otakudesuId: mapping.otakudesuId,
      oploverzId: mapping.oploverzId,
      hianimeId: mapping.hianimeId,
      animekaiId: mapping.animekaiId,
      kuramanimeId: mapping.kuramanimeId,
      anoboyId: mapping.anoboyId,
    };

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getMappingByString(anilistId: string): Promise<AnimeMappingResult | null> {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) return null;
    return this.getMapping(id);
  }

  async createMapping(data: CreateMappingInput): Promise<AnimeMappingResult> {
    const mapping = await this.prisma.animeMapping.upsert({
      where: { anilistId: data.anilistId },
      create: {
        anilistId: data.anilistId,
        consumetId: data.consumetId,
        otakudesuId: data.otakudesuId,
        oploverzId: data.oploverzId,
        hianimeId: data.hianimeId,
        animekaiId: data.animekaiId,
        kuramanimeId: data.kuramanimeId,
        anoboyId: data.anoboyId,
      },
      update: {
        consumetId: data.consumetId,
        otakudesuId: data.otakudesuId,
        oploverzId: data.oploverzId,
        hianimeId: data.hianimeId,
        animekaiId: data.animekaiId,
        kuramanimeId: data.kuramanimeId,
        anoboyId: data.anoboyId,
      },
    });

    const result: AnimeMappingResult = {
      id: mapping.id,
      anilistId: mapping.anilistId,
      consumetId: mapping.consumetId,
      otakudesuId: mapping.otakudesuId,
      oploverzId: mapping.oploverzId,
      hianimeId: mapping.hianimeId,
      animekaiId: mapping.animekaiId,
      kuramanimeId: mapping.kuramanimeId,
      anoboyId: mapping.anoboyId,
    };

    await this.cache.set(`${CACHE_PREFIX}${data.anilistId}`, result, CACHE_TTL);
    return result;
  }
}
