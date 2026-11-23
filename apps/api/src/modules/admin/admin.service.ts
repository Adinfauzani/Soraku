import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      totalComments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.comment.count(),
    ]);

    return { totalUsers, totalComments };
  }

  async getMappings(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.animeMapping.findMany({
        orderBy: { anilistId: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.animeMapping.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createMapping(data: {
    anilistId: number;
    consumetId?: string;
    otakudesuId?: string;
    oploverzId?: string;
    hianimeId?: string;
    animekaiId?: string;
    kuramanimeId?: string;
    anoboyId?: string;
  }) {
    return this.prisma.animeMapping.upsert({
      where: { anilistId: data.anilistId },
      create: data,
      update: data,
    });
  }

  async updateMapping(id: string, data: Record<string, any>) {
    const mapping = await this.prisma.animeMapping.findUnique({ where: { id } });
    if (!mapping) throw new NotFoundException('Mapping not found');
    return this.prisma.animeMapping.update({ where: { id }, data });
  }

  async getHealth() {
    const dbConnected = this.prisma.isConnected;
    return {
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }
}
