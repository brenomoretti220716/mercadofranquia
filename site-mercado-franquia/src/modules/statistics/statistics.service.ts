import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { PlatformStatisticsDto } from './dto/platform-statistics.dto';

const CACHE_KEY = 'platform:statistics';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class StatisticsService implements OnModuleInit {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // Ensure statistics record exists on startup
    await this.ensureStatisticsRecord();
    // Calculate and cache initial statistics
    await this.updateStatistics();
  }

  private async ensureStatisticsRecord() {
    const stats = await this.prisma.platformStatistics.findUnique({
      where: { id: 1 },
    });
    if (!stats) {
      await this.prisma.platformStatistics.create({
        data: {
          id: 1,
          franchisesReviewed: 0,
          totalReviews: 0,
          totalSegments: 0,
          medianRating: 0.0,
        },
      });
      this.logger.log('Initial PlatformStatistics record created.');
    }
    return stats;
  }

  /**
   * Get platform statistics (checks Redis cache first)
   */
  async getStatistics(): Promise<PlatformStatisticsDto> {
    // Try to get from cache first
    const cached = await this.cacheService.get<PlatformStatisticsDto>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Cache miss - get from database
    const stats = await this.getStatisticsFromDatabase();
    
    // Store in cache (non-blocking)
    this.cacheService.set(CACHE_KEY, stats, CACHE_TTL).catch((error) => {
      this.logger.warn('Failed to cache statistics:', error);
    });

    return stats;
  }

  /**
   * Get statistics from database
   */
  private async getStatisticsFromDatabase(): Promise<PlatformStatisticsDto> {
    const [statsRecord, franchisesReviewed, totalReviews, totalSegments, medianRating] =
      await Promise.all([
        this.prisma.platformStatistics.findUnique({ where: { id: 1 } }),
        this.calculateFranchisesReviewed(),
        this.calculateTotalReviews(),
        this.calculateTotalSegments(),
        this.calculateMedianRating(),
      ]);

    // If record exists and is up to date, return it
    if (statsRecord) {
      return {
        franchisesReviewed: statsRecord.franchisesReviewed,
        totalReviews: statsRecord.totalReviews,
        totalSegments: statsRecord.totalSegments,
        medianRating: statsRecord.medianRating,
      };
    }

    // No record exists, return calculated values
    return {
      franchisesReviewed,
      totalReviews,
      totalSegments,
      medianRating,
    };
  }

  /**
   * Calculate number of franchises with at least one review
   */
  private async calculateFranchisesReviewed(): Promise<number> {
    return await this.prisma.franchise.count({
      where: {
        isActive: true,
        reviewCount: { gt: 0 },
      },
    });
  }

  /**
   * Calculate total number of active reviews
   */
  private async calculateTotalReviews(): Promise<number> {
    return await this.prisma.review.count({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Calculate number of unique segments
   */
  private async calculateTotalSegments(): Promise<number> {
    const result = await this.prisma.franchise.findMany({
      where: {
        isActive: true,
        segment: { not: null },
      },
      select: {
        segment: true,
      },
      distinct: ['segment'],
    });

    return result.length;
  }

  /**
   * Calculate average (mean) rating across all active reviews
   */
  private async calculateMedianRating(): Promise<number | null> {
    const result = await this.prisma.review.aggregate({
      where: {
        isActive: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    if (result._count.rating === 0) {
      return null;
    }

    return result._avg.rating ?? null;
  }

  /**
   * Update all statistics in the database
   * This should be called when relevant data changes
   */
  async updateStatistics(): Promise<void> {
    try {
      const [franchisesReviewed, totalReviews, totalSegments, medianRating] =
        await Promise.all([
          this.calculateFranchisesReviewed(),
          this.calculateTotalReviews(),
          this.calculateTotalSegments(),
          this.calculateMedianRating(),
        ]);

      await this.prisma.platformStatistics.upsert({
        where: { id: 1 },
        update: {
          franchisesReviewed,
          totalReviews,
          totalSegments,
          medianRating,
        },
        create: {
          id: 1,
          franchisesReviewed,
          totalReviews,
          totalSegments,
          medianRating,
        },
      });

      // Invalidate cache
      await this.cacheService.delete(CACHE_KEY);
    } catch (error) {
      this.logger.error('Error updating statistics:', error);
      throw error;
    }
  }

  /**
   * Update statistics asynchronously (fire-and-forget)
   * Use this to avoid blocking main operations
   */
  async updateStatisticsAsync(): Promise<void> {
    this.updateStatistics().catch((error) => {
      this.logger.error('Error in async statistics update:', error);
    });
  }
}

