import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Favorite, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/services/users.service';
import {
  FavoriteWithFranchiseType,
  PaginatedFavoritesQueryType,
  ToggleFavoriteResponseType,
} from './schemas/favorite.schema';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Resolve franchise slug to franchise id.
   */
  private async resolveFranchiseIdBySlug(slug: string): Promise<string> {
    const franchise = await this.prisma.franchise.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!franchise) {
      throw new NotFoundException(`Franchise with slug ${slug} not found`);
    }
    return franchise.id;
  }

  /**
   * Add a franchise to user's favorites (idempotent)
   */
  async addFavorite(userId: string, slug: string): Promise<Favorite> {
    const franchiseId = await this.resolveFranchiseIdBySlug(slug);

    // Check if franchise exists (already resolved) and is active
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
    });

    if (!franchise) {
      throw new NotFoundException(`Franchise with ID ${franchiseId} not found`);
    }

    if (!franchise.isActive) {
      throw new BadRequestException('Cannot favorite an inactive franchise');
    }

    // Check if user profile is complete
    const isProfileComplete = await this.usersService.isProfileComplete(userId);
    if (!isProfileComplete) {
      throw new ForbiddenException(
        'Complete seu perfil para usar esta funcionalidade',
      );
    }

    // Check if already favorited
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_franchiseId: {
          userId,
          franchiseId,
        },
      },
    });

    if (existingFavorite) {
      return existingFavorite; // Idempotent - return existing
    }

    // Create favorite and increment counter in a transaction
    const [favorite] = await this.prisma.$transaction([
      this.prisma.favorite.create({
        data: {
          userId,
          franchiseId,
        },
      }),
      this.prisma.franchise.update({
        where: { id: franchiseId },
        data: {
          favoritesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return favorite;
  }

  /**
   * Remove a franchise from user's favorites (idempotent)
   */
  async removeFavorite(userId: string, slug: string): Promise<void> {
    const franchiseId = await this.resolveFranchiseIdBySlug(slug);

    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_franchiseId: {
          userId,
          franchiseId,
        },
      },
    });

    if (!favorite) {
      return; // Idempotent - already removed
    }

    // Delete favorite and decrement counter in a transaction
    await this.prisma.$transaction([
      this.prisma.favorite.delete({
        where: {
          id: favorite.id,
        },
      }),
      this.prisma.franchise.update({
        where: { id: franchiseId },
        data: {
          favoritesCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    userId: string,
    slug: string,
  ): Promise<ToggleFavoriteResponseType> {
    const franchiseId = await this.resolveFranchiseIdBySlug(slug);

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_franchiseId: {
          userId,
          franchiseId,
        },
      },
    });

    if (existingFavorite) {
      await this.removeFavorite(userId, slug);
      return {
        isFavorited: false,
        message: 'Franchise removed from favorites',
      };
    } else {
      await this.addFavorite(userId, slug);
      return {
        isFavorited: true,
        message: 'Franchise added to favorites',
      };
    }
  }

  /**
   * Get user's favorites with pagination and filters
   */
  async getUserFavorites(
    userId: string,
    options: PaginatedFavoritesQueryType,
  ): Promise<{
    data: FavoriteWithFranchiseType[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page, limit, sortBy, order, search } = options;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause: Prisma.FavoriteWhereInput = {
      userId,
      franchise: {
        isActive: true,
        ...(search && {
          name: {
            contains: search,
          },
        }),
      },
    };

    // Build order by clause
    const orderByClause: Prisma.FavoriteOrderByWithRelationInput =
      sortBy === 'name'
        ? {
            franchise: {
              name: order,
            },
          }
        : {
            createdAt: order,
          };

    // Get total count and favorites
    const [total, favorites] = await Promise.all([
      this.prisma.favorite.count({
        where: whereClause,
      }),
      this.prisma.favorite.findMany({
        where: whereClause,
        include: {
          franchise: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              logoUrl: true,
              thumbnailUrl: true,
              segment: true,
              subsegment: true,
              minimumInvestment: true,
              maximumInvestment: true,
              averageMonthlyRevenue: true,
              minimumReturnOnInvestment: true,
              maximumReturnOnInvestment: true,
              franchiseFee: true,
              averageRating: true,
              reviewCount: true,
              totalUnits: true,
              isActive: true,
            },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: favorites as FavoriteWithFranchiseType[],
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Check if a franchise is favorited by user
   */
  async isFavorited(
    userId: string,
    slug: string,
  ): Promise<{ isFavorited: boolean }> {
    const franchiseId = await this.resolveFranchiseIdBySlug(slug);

    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_franchiseId: {
          userId,
          franchiseId,
        },
      },
    });

    return {
      isFavorited: !!favorite,
    };
  }

  /**
   * Get all favorite franchise IDs for a user (for bulk UI updates)
   */
  async getUserFavoriteIds(userId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { franchiseId: true },
    });

    return favorites.map((fav) => fav.franchiseId);
  }

  /**
   * Get favorites count for a franchise (for analytics)
   */
  async getFranchiseFavoritesCount(franchiseId: string): Promise<number> {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
      select: { favoritesCount: true },
    });

    return franchise?.favoritesCount ?? 0;
  }
}
