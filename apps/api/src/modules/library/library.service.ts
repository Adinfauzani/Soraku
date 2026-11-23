import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async getFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavorite(userId: string, anilistId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_anilistId: { userId, anilistId } },
    });
    if (existing) throw new ConflictException('Already in favorites');
    return this.prisma.favorite.create({ data: { userId, anilistId } });
  }

  async removeFavorite(userId: string, anilistId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_anilistId: { userId, anilistId } },
    });
    if (!existing) throw new NotFoundException('Favorite not found');
    await this.prisma.favorite.delete({ where: { id: existing.id } });
  }

  async getWatchlist(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addToWatchlist(userId: string, anilistId: number, status = 'PLANNING') {
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_anilistId: { userId, anilistId } },
    });
    if (existing) throw new ConflictException('Already in watchlist');
    return this.prisma.watchlist.create({ data: { userId, anilistId, status } });
  }

  async removeFromWatchlist(userId: string, anilistId: number) {
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_anilistId: { userId, anilistId } },
    });
    if (!existing) throw new NotFoundException('Watchlist item not found');
    await this.prisma.watchlist.delete({ where: { id: existing.id } });
  }

  async updateWatchlistItem(userId: string, anilistId: number, data: { status?: string; progress?: number }) {
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_anilistId: { userId, anilistId } },
    });
    if (!existing) throw new NotFoundException('Watchlist item not found');
    return this.prisma.watchlist.update({ where: { id: existing.id }, data });
  }

  async getHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async updateProgress(userId: string, anilistId: number, episode: number, progress: number) {
    const completed = progress >= 0.95;

    const history = await this.prisma.watchHistory.upsert({
      where: { userId_anilistId_episode: { userId, anilistId, episode } },
      update: { progress, completed, watchedAt: new Date() },
      create: { userId, anilistId, episode, progress, completed },
    });

    if (completed) {
      await this.prisma.watchlist.upsert({
        where: { userId_anilistId: { userId, anilistId } },
        update: { progress: { increment: 1 }, status: 'WATCHING' },
        create: { userId, anilistId, status: 'WATCHING', progress: 1 },
      });
    }

    return history;
  }

  async getContinueWatching(userId: string) {
    const entries = await this.prisma.watchHistory.findMany({
      where: { userId, completed: false, progress: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const seen = new Map<number, typeof entries[0]>();
    for (const entry of entries) {
      if (!seen.has(entry.anilistId) || entry.updatedAt > seen.get(entry.anilistId)!.updatedAt) {
        seen.set(entry.anilistId, entry);
      }
    }

    return Array.from(seen.values()).map((entry) => ({
      anilistId: entry.anilistId,
      episode: entry.episode,
      progress: entry.progress,
      watchedAt: entry.watchedAt,
    }));
  }
}
