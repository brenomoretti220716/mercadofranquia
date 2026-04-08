import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContactInfo, Franchise, Role, SponsorPlacement } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import {
  generateFranchiseCacheKey,
  generateFranchiseListCacheKey,
} from '../cache/utils/cache-key.util';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { StatisticsService } from '../statistics/statistics.service';
import { UploadService } from '../upload/upload.service';
import { FranchiseFiltersDto } from './dto/franchise-filters.dto';
import { FranchisorUpdateWithFileDto } from './schemas/update-franchise.schema';
import { buildFranchiseWhereClause } from './utils/filter-builder.util';
import { buildFranchiseOrderByClause } from './utils/sort-builder.util';

/** Franchise with dynamically calculated ranking position */
export type FranchiseWithRanking = Franchise & {
  rankingPosition: number;
  isSponsored: boolean;
  // Public listing now includes basic contact info for direct website access
  contact?: ContactInfo | null;
};

/** Maximum number of franchises that can be sponsored at the same time */
export const MAX_SPONSORED_FRANCHISES = 5;

/** Paginated franchise list response */
export interface PaginatedFranchiseResponse {
  data: FranchiseWithRanking[];
  total: number;
  page: number;
  lastPage: number;
}

@Injectable()
export class FranchiseService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly uploadService: UploadService,
    private readonly cacheService: CacheService,
    private readonly statisticsService: StatisticsService,
  ) {}

  // Ranking persistido removido. A posição agora é calculada dinamicamente conforme a ordenação.

  // Listagem paginada para uso admin (inclui inativos)
  async getAllFranchisesPaginated(
    filters: FranchiseFiltersDto & { isAdmin?: boolean },
  ) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const isAdmin = filters.isAdmin === true;
      const maxSponsored = isAdmin ? MAX_SPONSORED_FRANCHISES : 3;

      // Build WHERE and ORDER BY clauses using utility functions
      // false = include inactive franchises for admin
      const where = buildFranchiseWhereClause(filters, false);
      const orderBy = buildFranchiseOrderByClause(filters);

      // Admin include options for detailed franchise data
      const adminInclude = {
        contact: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        franchisees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            anonymous: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
              },
            },
          },
          where: { isActive: true },
          orderBy: {
            createdAt: 'desc' as const,
          },
        },
        _count: {
          select: {
            reviews: {
              where: { isActive: true },
            },
            franchisees: true,
          },
        },
        businessModels: {
          orderBy: {
            createdAt: 'desc' as const,
          },
        },
      };

      // 1. Fetch sponsored franchises matching filters
      const sponsoredWhere = { ...where, isSponsored: true };
      const allSponsored = await this.prismaService.franchise.findMany({
        where: sponsoredWhere,
        include: adminInclude,
        orderBy: { name: 'asc' },
      });

      // Admin: show all sponsored (up to max). Non-admin: randomly select up to max
      let sponsoredFranchises = allSponsored;
      if (allSponsored.length > maxSponsored) {
        if (isAdmin) {
          sponsoredFranchises = allSponsored.slice(0, maxSponsored);
        } else {
          const shuffled = [...allSponsored];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          sponsoredFranchises = shuffled
            .slice(0, maxSponsored)
            .sort((a, b) => a.name.localeCompare(b.name));
        }
      }

      const sponsoredIds = sponsoredFranchises.map((f) => f.id);
      const sponsoredCount = sponsoredFranchises.length;

      // 2. Calculate pagination for regular franchises
      const regularLimit = limit - sponsoredCount;
      const regularSkip = (page - 1) * regularLimit;

      // 3. Build WHERE clause for regular franchises (exclude sponsored)
      const regularWhere = {
        ...where,
        ...(sponsoredIds.length > 0
          ? { id: { notIn: sponsoredIds }, isSponsored: false }
          : { isSponsored: false }),
      };

      // 4. Fetch ALL matching franchises ordered by sort criteria to calculate positions
      // We only need IDs to create a position map
      const allFranchisesOrdered = await this.prismaService.franchise.findMany({
        where,
        select: { id: true },
        orderBy,
      });

      // Create a map of franchise ID -> position (1-based index)
      const positionMap = new Map<string, number>();
      allFranchisesOrdered.forEach((franchise, index) => {
        positionMap.set(franchise.id, index + 1);
      });

      // 5. Fetch regular franchises and counts
      const [
        regularFranchises,
        totalRegular,
        totalSponsored,
        totalActive,
        totalInactive,
      ] = await Promise.all([
        regularLimit > 0
          ? this.prismaService.franchise.findMany({
              where: regularWhere,
              skip: regularSkip,
              take: regularLimit,
              include: adminInclude,
              orderBy,
            })
          : ([] as typeof allSponsored),
        this.prismaService.franchise.count({ where: regularWhere }),
        this.prismaService.franchise.count({ where: sponsoredWhere }),
        this.prismaService.franchise.count({ where: { isActive: true } }),
        this.prismaService.franchise.count({ where: { isActive: false } }),
      ]);

      // 6. Combine sponsored (first) + regular franchises
      // Sponsored franchises appear at top but use their ACTUAL ranking position
      const sponsoredWithPosition = sponsoredFranchises.map((item) => ({
        ...item,
        rankingPosition: positionMap.get(item.id) || 0,
      }));

      // Regular franchises use their ACTUAL ranking position (no offset)
      const regularWithPosition = regularFranchises.map((item) => ({
        ...item,
        rankingPosition: positionMap.get(item.id) || 0,
      }));

      const combinedData = [...sponsoredWithPosition, ...regularWithPosition];

      // 6. Calculate total and lastPage
      const total = totalSponsored + totalRegular;
      const lastPage =
        regularLimit > 0
          ? Math.max(1, Math.ceil(totalRegular / regularLimit))
          : totalSponsored > 0
            ? 1
            : 0;

      return {
        data: combinedData,
        total,
        totalActive,
        totalInactive,
        totalSponsored,
        page,
        lastPage,
      };
    } catch (error) {
      console.error('Error fetching franchises:', error);
      throw new Error('Failed to fetch franchises');
    }
  }
  async getFranchisesPaginated(filters: FranchiseFiltersDto) {
    try {
      const cacheKey = generateFranchiseListCacheKey(filters);

      const cachedResult =
        await this.cacheService.get<PaginatedFranchiseResponse>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const where = buildFranchiseWhereClause(filters, true);
      const orderBy = buildFranchiseOrderByClause(filters);

      const [allFranchisesOrdered, [franchises, total]] = await Promise.all([
        this.prismaService.franchise.findMany({
          where,
          select: { id: true },
          orderBy,
        }),
        this.prismaService.$transaction([
          this.prismaService.franchise.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
              contact: true,
            },
          }),
          this.prismaService.franchise.count({ where }),
        ]),
      ]);

      const positionMap = new Map<string, number>();
      allFranchisesOrdered.forEach((franchise, index) => {
        positionMap.set(franchise.id, index + 1);
      });

      const data: FranchiseWithRanking[] = franchises.map((item) => ({
        ...item,
        rankingPosition: positionMap.get(item.id) || 0,
        isSponsored: !!item.isSponsored,
      }));

      const lastPage = total > 0 ? Math.ceil(total / limit) : 0;

      const result: PaginatedFranchiseResponse = {
        data,
        total,
        page,
        lastPage,
      };

      await this.cacheService.set(cacheKey, result).catch((error) => {
        console.error('Failed to cache franchise list result:', error);
      });

      return result;
    } catch (error) {
      console.error('Error fetching franchises:', error);
      throw new Error('Failed to fetch franchises');
    }
  }

  // Novo método para toggle status da franquia
  async toggleFranchiseStatus(
    franchiseId: string,
    isActive: boolean,
    userRole: Role,
  ) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can change franchise status',
      );
    }

    if (!franchiseId) {
      throw new Error('Franchise ID is required');
    }

    try {
      const franchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!franchise) {
        throw new NotFoundException('Franchise not found');
      }

      const updatedFranchise = await this.prismaService.franchise.update({
        where: { id: franchiseId },
        data: { isActive },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          franchisees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              anonymous: true,
              createdAt: true,
              isActive: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  cpf: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reviews: true,
              franchisees: true,
            },
          },
          businessModels: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // Enviar email para o franchisor se ele existir
      if (franchise.owner && franchise.owner.email) {
        try {
          await this.emailService.sendUserUpdateNotification({
            userName: franchise.owner.name,
            userEmail: franchise.owner.email,
          });
        } catch (emailError) {
          console.error(
            'Error sending franchise status change email:',
            emailError,
          );
          // Não falha a operação se o email não for enviado
        }
      }

      // Invalidate cache for this franchise and franchise lists (ranking may change)
      await this.invalidateFranchiseCache(franchiseId);

      return {
        data: updatedFranchise,
        message: `Franchise ${isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error) {
      console.error(
        `Error toggling franchise status for id ${franchiseId}:`,
        error,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new Error(
        `Failed to toggle franchise status for id ${franchiseId}`,
      );
    }
  }

  async getFranchisesByFranchisor(franchisorId: string) {
    try {
      if (!franchisorId) {
        throw new Error('Franchisor ID is required');
      }

      const franchisor = await this.prismaService.user.findUnique({
        where: {
          id: franchisorId,
          role: 'FRANCHISOR',
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!franchisor) {
        throw new Error('Franchisor not found');
      }

      const franchises = await this.prismaService.franchise.findMany({
        where: {
          ownerId: franchisorId,
        },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          franchisees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              anonymous: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  cpf: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reviews: true,
              franchisees: true,
            },
          },
          businessModels: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: [
          {
            totalUnits: 'desc',
          },
          {
            name: 'asc',
          },
        ],
      });

      if (franchises.length === 0) {
        throw new Error('No franchises found for this franchisor');
      }

      const franchisesWithRanking = franchises.map((franchise, index) => ({
        ...franchise,
        rankingPosition: index + 1,
      }));

      return franchisesWithRanking;
    } catch (error) {
      console.error(
        `Error fetching franchises for franchisor ${franchisorId}:`,
        error,
      );
      throw error;
    }
  }

  async toggleFranchiseReview(franchiseId: string, isReview: boolean) {
    const franchise = await this.prismaService.franchise.update({
      where: { id: franchiseId },
      data: { isReview: isReview },
    });

    // Invalidate cache for this franchise
    await this.invalidateFranchiseCache(franchiseId);

    return {
      data: franchise,
      message: 'Franchise review toggled successfully',
    };
  }

  /**
   * Toggle franchise sponsored status (admin only)
   * At most MAX_SPONSORED_FRANCHISES can be sponsored at a time.
   */
  async toggleFranchiseSponsored(franchiseId: string, isSponsored: boolean) {
    if (isSponsored) {
      const sponsoredCount = await this.prismaService.franchise.count({
        where: { isSponsored: true },
      });
      if (sponsoredCount >= MAX_SPONSORED_FRANCHISES) {
        const current = await this.prismaService.franchise.findUnique({
          where: { id: franchiseId },
          select: { isSponsored: true },
        });
        if (!current?.isSponsored) {
          throw new BadRequestException(
            'Só podem existir no máximo 5 franquias patrocinadas ao mesmo tempo.',
          );
        }
      }
    }

    const franchise = await this.prismaService.franchise.update({
      where: { id: franchiseId },
      data: {
        isSponsored,
        ...(isSponsored ? {} : { sponsorPlacements: [] }),
      },
    });

    // Invalidate cache for this franchise and all list caches
    await this.invalidateFranchiseCache(franchiseId);

    return {
      data: franchise,
      message: `Franchise ${isSponsored ? 'sponsored' : 'unsponsored'} successfully`,
    };
  }

  async updateSponsorPlacements(
    franchiseId: string,
    placements: SponsorPlacement[],
  ) {
    const franchise = await this.prismaService.franchise.findUnique({
      where: { id: franchiseId },
      select: { id: true, isSponsored: true },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    if (!franchise.isSponsored) {
      throw new BadRequestException(
        'Cannot set sponsor placements for a non-sponsored franchise.',
      );
    }

    const updatedFranchise = await this.prismaService.franchise.update({
      where: { id: franchiseId },
      data: { sponsorPlacements: placements },
    });

    await this.invalidateFranchiseCache(franchiseId);

    return {
      data: updatedFranchise,
      message: 'Sponsor placements updated successfully',
    };
  }

  /**
   * Get sponsored franchises matching the given filters
   * Returns up to maxSponsored franchises, randomly selected if more exist
   * Ordered alphabetically by name
   */
  private async getSponsoredFranchises(
    where: ReturnType<typeof buildFranchiseWhereClause>,
    maxSponsored: number = 3,
  ) {
    // Build sponsored filter: must be sponsored AND match all other filters
    const sponsoredWhere = {
      ...where,
      isSponsored: true,
    };

    // Fetch all matching sponsored franchises
    const allSponsored = await this.prismaService.franchise.findMany({
      where: sponsoredWhere,
      orderBy: { name: 'asc' },
    });

    // If we have more than maxSponsored, randomly select
    if (allSponsored.length > maxSponsored) {
      // Fisher-Yates shuffle
      const shuffled = [...allSponsored];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Take maxSponsored and sort alphabetically
      return shuffled
        .slice(0, maxSponsored)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return allSponsored;
  }

  async getFranchiseById(id: string) {
    try {
      if (!id) {
        throw new Error('Franchise ID is required');
      }

      // Try to get from cache first
      const cacheKey = generateFranchiseCacheKey(id);
      const cachedFranchise = await this.cacheService.get<{
        id: string;
        rankingPosition: number | null;
        [key: string]: unknown;
      }>(cacheKey);

      if (cachedFranchise) {
        return cachedFranchise;
      }

      // Cache miss - fetch from database
      // First, get the franchise with all its relations
      const franchise = await this.prismaService.franchise.findUnique({
        where: { id },
        include: {
          contact: true,
          reviews: {
            include: {
              responses: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      role: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              reviews: true,
              franchisees: true,
            },
          },
          businessModels: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!franchise) {
        throw new Error('Franchise not found');
      }

      // Optimize ranking calculation: use COUNT query instead of fetching all franchises
      // Count how many franchises rank higher (better totalUnits or same totalUnits but better name)
      // Sponsored franchises are ranked alongside regular franchises - no special treatment
      const rankingPosition = await this.calculateRankingPosition(
        id,
        franchise.totalUnits,
        franchise.name,
      );

      const result = {
        ...franchise,
        rankingPosition: rankingPosition > 0 ? rankingPosition : null,
      };

      // Store in cache (non-blocking)
      await this.cacheService.set(cacheKey, result).catch((error) => {
        // Log but don't fail the request if caching fails
        console.error('Failed to cache franchise result:', error);
      });

      return result;
    } catch (error) {
      console.error(`Error fetching franchise with id ${id}:`, error);
      throw new Error(`Failed to fetch franchise with id ${id}`);
    }
  }

  /**
   * Calculate ranking position efficiently using COUNT query
   * Instead of fetching all franchises, we count how many rank higher
   * Ranking: ALL franchises (sponsored + regular) ranked together by totalUnits desc, then name asc
   * Sponsored franchises do NOT get special positions - they are ranked alongside regular franchises
   */
  private async calculateRankingPosition(
    franchiseId: string,
    totalUnits: number | null,
    name: string,
  ): Promise<number> {
    // Rank ALL franchises together (sponsored + regular) using same criteria
    // No special handling for sponsored - they get their actual position based on sort criteria
    let count: number;

    if (totalUnits === null) {
      // If this franchise has null totalUnits, count all franchises (sponsored + regular) with:
      // 1. Non-null totalUnits (they rank higher), OR
      // 2. Null totalUnits but name comes before alphabetically
      count = await this.prismaService.franchise.count({
        where: {
          isActive: true,
          id: { not: franchiseId }, // Exclude self
          OR: [
            {
              totalUnits: { not: null },
            },
            {
              totalUnits: null,
              name: { lt: name },
            },
          ],
        },
      });
    } else {
      // If this franchise has a totalUnits value, count all franchises (sponsored + regular) with:
      // 1. Higher totalUnits, OR
      // 2. Same totalUnits but name comes before alphabetically
      count = await this.prismaService.franchise.count({
        where: {
          isActive: true,
          id: { not: franchiseId }, // Exclude self
          OR: [
            {
              totalUnits: { gt: totalUnits },
            },
            {
              totalUnits: totalUnits,
              name: { lt: name },
            },
          ],
        },
      });
    }

    return count + 1;
  }

  /**
   * Invalidate cache for a specific franchise and all franchise lists
   * (since ranking may change when a franchise is updated)
   */
  private async invalidateFranchiseCache(franchiseId: string): Promise<void> {
    try {
      // Delete specific franchise cache
      const franchiseCacheKey = generateFranchiseCacheKey(franchiseId);
      await this.cacheService.delete(franchiseCacheKey);

      // Delete all franchise list caches (ranking may have changed)
      await this.cacheService
        .deletePattern('franchise:list:*')
        .catch((error) => {
          console.error('Failed to invalidate franchise list cache:', error);
        });
    } catch (error) {
      // Log but don't fail the operation if cache invalidation fails
      console.error(
        `Failed to invalidate cache for franchise ${franchiseId}:`,
        error,
      );
    }
  }

  /**
   * Resolve franchise by slug and return its ranking info within the filtered list.
   * The public API now uses slug instead of internal ID.
   */
  async getFranchiseRanking(slug: string, filters: FranchiseFiltersDto) {
    try {
      if (!slug) {
        throw new Error('Franchise slug is required');
      }

      // Build WHERE and ORDER BY using utility functions
      // Apply the same filters used in listing to ensure ranking matches
      const where = buildFranchiseWhereClause(filters, true); // true = active only
      const orderBy = buildFranchiseOrderByClause(filters);

      // Resolve slug -> ID
      const franchiseBySlug = await this.prismaService.franchise.findUnique({
        where: { slug, isActive: true },
        select: { id: true },
      });

      if (!franchiseBySlug) {
        throw new NotFoundException('Franchise not found or inactive');
      }

      const franchiseId = franchiseBySlug.id;

      const franchise = await this.getFranchiseById(franchiseId);

      // Get all franchises matching the filters, ordered by ranking to calculate position
      const allFranchisesRaw = await this.prismaService.franchise.findMany({
        where,
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          franchisees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              anonymous: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  cpf: true,
                },
              },
            },
            where: { isActive: true },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reviews: {
                where: { isActive: true },
              },
              franchisees: true,
            },
          },
          businessModels: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy,
      });

      const allFranchises = allFranchisesRaw as Array<{
        id: string;
        slug: string | null;
      }>;

      const currentPosition = allFranchises.findIndex(
        (f) => f.id === franchiseId,
      );

      // If franchise not found in filtered results, it doesn't match the current filters
      if (currentPosition === -1) {
        return {
          franchiseWithRanking: {
            ...franchise,
            rankingPosition: null, // No position in filtered results
          },
          nextFranchiseWithRanking: null,
          previousFranchiseWithRanking: null,
          totalInFilteredResults: allFranchises.length,
          isInFilteredResults: false,
        };
      }

      const rankingPosition = currentPosition + 1;

      const nextFranchiseSlug =
        allFranchises[currentPosition + 1]?.slug ?? null;
      const previousFranchiseSlug =
        allFranchises[currentPosition - 1]?.slug ?? null;

      return {
        franchiseWithRanking: {
          ...franchise,
          rankingPosition,
        },
        nextFranchiseWithRanking: nextFranchiseSlug,
        previousFranchiseWithRanking: previousFranchiseSlug,
        totalInFilteredResults: allFranchises.length,
        isInFilteredResults: true,
      };
    } catch (error) {
      console.error(`Error fetching franchise with slug ${slug}:`, error);
      throw new Error(`Failed to fetch franchise with slug ${slug}`);
    }
  }

  async franchisorUpdateFranchise(
    franchiseId: string,
    updateData: FranchisorUpdateWithFileDto,
    franchisorId: string,
    userRole: Role,
  ) {
    if (!franchiseId) {
      throw new Error('Franchise ID is required');
    }

    try {
      // Buscar a franquia atual
      const currentFranchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contact: true,
        },
      });

      if (!currentFranchise) {
        throw new NotFoundException('Franchise not found');
      }

      // Verificar se o franchisor é o dono da franquia
      if (
        userRole !== Role.ADMIN &&
        currentFranchise.ownerId !== franchisorId
      ) {
        throw new ForbiddenException('You can only update your own franchises');
      }

      // Preparar dados para atualização da franquia
      const updatePayload: Record<string, unknown> = {};

      // Campos básicos
      if (updateData.name !== undefined) {
        updatePayload.name = updateData.name;

        // Regenerate slug when name changes
        if (updateData.name && updateData.name !== currentFranchise.name) {
          const baseSlug = this.toSlug(updateData.name);
          updatePayload.slug = await this.generateUniqueSlug(
            baseSlug,
            currentFranchise.id,
          );
        }
      }
      if (updateData.detailedDescription !== undefined) {
        updatePayload.detailedDescription =
          updateData.detailedDescription || undefined;
      }

      // Investment Range
      if (updateData.minimumInvestment !== undefined) {
        updatePayload.minimumInvestment = updateData.minimumInvestment ?? null;
      }
      if (updateData.maximumInvestment !== undefined) {
        // Validate: if updating only maximum, minimum must exist in DB or be in update
        if (
          updateData.minimumInvestment === undefined &&
          !currentFranchise.minimumInvestment
        ) {
          throw new BadRequestException(
            'Maximum investment requires a minimum investment value. Please set the minimum investment first.',
          );
        }
        // Validate: if both are being updated, max must be > min
        if (
          updateData.minimumInvestment !== undefined &&
          updateData.maximumInvestment !== undefined &&
          updateData.maximumInvestment <= updateData.minimumInvestment
        ) {
          throw new BadRequestException(
            'Maximum investment must be greater than minimum investment',
          );
        }
        // Validate: if only max is being updated, it must be > existing min
        if (
          updateData.minimumInvestment === undefined &&
          currentFranchise.minimumInvestment &&
          updateData.maximumInvestment <=
            Number(currentFranchise.minimumInvestment)
        ) {
          throw new BadRequestException(
            'Maximum investment must be greater than minimum investment',
          );
        }
        updatePayload.maximumInvestment = updateData.maximumInvestment ?? null;
      }

      // ROI Range (in months)
      if (updateData.minimumReturnOnInvestment !== undefined) {
        updatePayload.minimumReturnOnInvestment =
          updateData.minimumReturnOnInvestment ?? null;
      }
      if (updateData.maximumReturnOnInvestment !== undefined) {
        // Validate: if updating only maximum, minimum must exist in DB or be in update
        if (
          updateData.minimumReturnOnInvestment === undefined &&
          !currentFranchise.minimumReturnOnInvestment
        ) {
          throw new BadRequestException(
            'Maximum ROI requires a minimum ROI value. Please set the minimum ROI first.',
          );
        }
        // Validate: if both are being updated, max must be > min
        if (
          updateData.minimumReturnOnInvestment !== undefined &&
          updateData.maximumReturnOnInvestment !== undefined &&
          updateData.maximumReturnOnInvestment <=
            updateData.minimumReturnOnInvestment
        ) {
          throw new BadRequestException(
            'Maximum ROI must be greater than minimum ROI',
          );
        }
        // Validate: if only max is being updated, it must be > existing min
        if (
          updateData.minimumReturnOnInvestment === undefined &&
          currentFranchise.minimumReturnOnInvestment &&
          updateData.maximumReturnOnInvestment <=
            Number(currentFranchise.minimumReturnOnInvestment)
        ) {
          throw new BadRequestException(
            'Maximum ROI must be greater than minimum ROI',
          );
        }
        updatePayload.maximumReturnOnInvestment =
          updateData.maximumReturnOnInvestment ?? null;
      }

      // Localização e unidades
      if (updateData.headquarterState !== undefined) {
        updatePayload.headquarterState = updateData.headquarterState || null;
      }
      if (updateData.totalUnits !== undefined) {
        updatePayload.totalUnits = updateData.totalUnits ?? null;
      }

      // Segmentos
      if (updateData.segment !== undefined) {
        updatePayload.segment = updateData.segment || null;
        // Update statistics when segment changes (affects totalSegments count)
        void this.statisticsService?.updateStatisticsAsync();
      }
      if (updateData.subsegment !== undefined) {
        updatePayload.subsegment = updateData.subsegment || null;
      }
      if (updateData.businessType !== undefined) {
        updatePayload.businessType = updateData.businessType || null;
      }

      // Datas
      if (updateData.brandFoundationYear !== undefined) {
        updatePayload.brandFoundationYear =
          updateData.brandFoundationYear ?? null;
      }
      if (updateData.franchiseStartYear !== undefined) {
        updatePayload.franchiseStartYear =
          updateData.franchiseStartYear ?? null;
      }
      if (updateData.abfSince !== undefined) {
        updatePayload.abfSince = updateData.abfSince ?? null;
      }

      // Mídia
      if (updateData.videoUrl !== undefined) {
        if (updateData.videoUrl) {
          // Parse existing videos
          const existingVideos = this.parseVideoUrls(currentFranchise.videoUrl);

          // Parse new video(s) - could be single URL or JSON array
          const newVideos = this.parseVideoUrls(updateData.videoUrl);

          // Merge arrays, removing duplicates
          const mergedVideos = [...new Set([...existingVideos, ...newVideos])];

          // Store as JSON array string
          updatePayload.videoUrl = JSON.stringify(mergedVideos);
        } else {
          // If empty string, clear videos
          updatePayload.videoUrl = undefined;
        }
      }

      // Processar upload da foto se fornecida
      if (updateData.photo) {
        try {
          // Deletar foto antiga se existir
          if (currentFranchise.thumbnailUrl) {
            await this.uploadService.deleteFile(currentFranchise.thumbnailUrl);
          }

          // Fazer upload da nova foto
          const thumbnailUrl = await this.uploadService.uploadFile(
            updateData.photo,
            'franchises',
          );
          updatePayload.thumbnailUrl = thumbnailUrl;
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
          throw new Error('Failed to upload photo');
        }
      }

      // Preparar dados de contato
      const contactUpdateData: {
        phone?: string;
        email?: string;
        website?: string;
      } = {};
      let hasContactUpdate = false;

      if (updateData.phone !== undefined) {
        const phoneValue = String(updateData.phone ?? '');
        contactUpdateData.phone = phoneValue;
        hasContactUpdate = true;
      }
      if (updateData.email !== undefined) {
        const emailValue = String(updateData.email ?? '');
        contactUpdateData.email = emailValue;
        hasContactUpdate = true;
      }
      if (updateData.website !== undefined) {
        const websiteValue = String(updateData.website ?? '');
        contactUpdateData.website = websiteValue;
        hasContactUpdate = true;
      }

      // Verificar se há algo para atualizar
      if (Object.keys(updatePayload).length === 0 && !hasContactUpdate) {
        // Return the current franchise instead of throwing an error
        // This handles the case where the frontend sends data but after
        // transformation all values become undefined/unchanged
        const currentFranchiseData =
          await this.prismaService.franchise.findUnique({
            where: { id: franchiseId },
            include: {
              contact: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              franchisees: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              reviews: {
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  anonymous: true,
                  createdAt: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      cpf: true,
                    },
                  },
                },
                where: { isActive: true },
                orderBy: {
                  createdAt: 'desc',
                },
              },
              _count: {
                select: {
                  reviews: {
                    where: { isActive: true },
                  },
                  franchisees: true,
                },
              },
              businessModels: {
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          });

        return {
          data: currentFranchiseData,
          message: 'No changes to update',
        };
      }

      // Atualizar a franquia e contato em transação
      await this.prismaService.$transaction(async (tx) => {
        // Atualizar franquia
        await tx.franchise.update({
          where: { id: franchiseId },
          data: updatePayload,
        });

        // Atualizar ou criar contato se necessário
        if (hasContactUpdate) {
          if (currentFranchise.contact) {
            // Atualizar contato existente
            await tx.contactInfo.update({
              where: { id: currentFranchise.contact.id },
              data: contactUpdateData,
            });
          } else {
            // Criar novo contato se não existir
            const hasValidContactData =
              contactUpdateData.phone ||
              contactUpdateData.email ||
              contactUpdateData.website;

            if (hasValidContactData) {
              const newContact = await tx.contactInfo.create({
                data: {
                  phone: contactUpdateData.phone || '',
                  email: contactUpdateData.email || '',
                  website: contactUpdateData.website || '',
                },
              });

              // Associar o novo contato à franquia
              await tx.franchise.update({
                where: { id: franchiseId },
                data: { contactId: newContact.id },
              });
            }
          }
        }
      });

      // Buscar franquia atualizada com todas as relações
      const finalFranchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          franchisees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              anonymous: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  cpf: true,
                },
              },
            },
            where: { isActive: true },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reviews: {
                where: { isActive: true },
              },
              franchisees: true,
            },
          },
          businessModels: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // Invalidate cache for this franchise and franchise lists (ranking may change)
      await this.invalidateFranchiseCache(franchiseId);

      return {
        data: finalFranchise,
        message: 'Franchise updated successfully',
      };
    } catch (error) {
      console.error(`Error updating franchise ${franchiseId}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Se houve erro e uma foto foi enviada, tentar fazer rollback do upload
      if (updateData.photo && error instanceof Error) {
        console.error('Rolling back photo upload due to error');
      }

      throw new Error(
        `Failed to update franchise: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Método público para retornar todas as franquias apenas com id e nome
  async getFranchisesNames() {
    try {
      return await this.prismaService.franchise.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error('Error fetching all franchises (id and name):', error);
      throw new Error('Failed to fetch franchise options');
    }
  }

  // Retorna apenas franquias "disponíveis" (sem franqueador vinculado)
  async getAvailableFranchisesNames() {
    try {
      return await this.prismaService.franchise.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          isActive: true,
          ownerId: null,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error(
        'Error fetching available franchises (id and name):',
        error,
      );
      throw new Error('Failed to fetch available franchise options');
    }
  }

  // Retorna franquias disponíveis (sem franqueador) + franquias do usuário especificado
  async getFranchisesNamesWithUserFilter(userId: string) {
    try {
      return await this.prismaService.franchise.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          isActive: true,
          OR: [
            { ownerId: null }, // Available franchises
            { ownerId: userId }, // Franchises owned by the specified user
          ],
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error(
        'Error fetching franchises with user filter (id and name):',
        error,
      );
      throw new Error('Failed to fetch franchise options with user filter');
    }
  }

  /**
   * Helper method to safely parse galleryUrls JSON string
   */
  private toSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate a unique slug, optionally excluding a specific franchise ID
   * (used when updating an existing franchise name).
   */
  private async generateUniqueSlug(
    base: string,
    excludeFranchiseId?: string,
  ): Promise<string> {
    let slug = base || 'franchise';
    let suffix = 2;

    // Try base slug, then slug-2, slug-3, ... until it is unique

    while (true) {
      const existing = await this.prismaService.franchise.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (
        !existing ||
        (excludeFranchiseId && existing.id === excludeFranchiseId)
      ) {
        return slug;
      }

      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  /**
   * Helper method to safely parse galleryUrls JSON string
   */
  private parseGalleryUrls(galleryUrls: string | null): string[] {
    if (!galleryUrls) return [];

    try {
      const parsed = JSON.parse(galleryUrls) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((url): url is string => typeof url === 'string');
      }
      return [];
    } catch (error) {
      console.warn('Failed to parse galleryUrls:', error);
      return [];
    }
  }

  /**
   * Helper method to safely parse videoUrl JSON string or single URL
   * Handles backward compatibility with single URL strings
   */
  private parseVideoUrls(videoUrl: string | null): string[] {
    if (!videoUrl) return [];

    // Try parsing as JSON array first
    if (videoUrl.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(videoUrl) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((url): url is string => typeof url === 'string');
        }
      } catch (error) {
        console.warn('Failed to parse videoUrl as JSON array:', error);
      }
    }

    // If not a JSON array, treat as single URL (backward compatibility)
    if (videoUrl.trim().length > 0) {
      return [videoUrl.trim()];
    }

    return [];
  }

  /**
   * Add gallery images to a franchise
   */
  async addGalleryImages(
    franchiseId: string,
    files: Express.Multer.File[],
    franchisorId: string,
    userRole: Role,
  ) {
    if (!franchiseId) {
      throw new Error('Franchise ID is required');
    }

    try {
      // Fetch current franchise
      const currentFranchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        select: {
          id: true,
          ownerId: true,
          galleryUrls: true,
          name: true,
        },
      });

      if (!currentFranchise) {
        throw new NotFoundException('Franchise not found');
      }

      // Verify ownership
      if (
        userRole !== Role.ADMIN &&
        currentFranchise.ownerId !== franchisorId
      ) {
        throw new ForbiddenException('You can only update your own franchises');
      }

      // Parse existing gallery URLs
      const existingUrls = this.parseGalleryUrls(currentFranchise.galleryUrls);

      // Upload new files
      const uploadedUrls: string[] = [];
      for (const file of files) {
        try {
          // Convert to MulterFile format
          const multerFile = {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer,
          };

          const url = await this.uploadService.uploadFile(
            multerFile,
            'franchises',
          );
          uploadedUrls.push(url);
        } catch (uploadError) {
          console.error('Error uploading gallery image:', uploadError);
          // Continue with other files even if one fails
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('Failed to upload any images');
      }

      // Combine existing and new URLs
      const updatedUrls = [...existingUrls, ...uploadedUrls];

      // Update franchise with new gallery URLs
      const updatedFranchise = await this.prismaService.franchise.update({
        where: { id: franchiseId },
        data: {
          galleryUrls: JSON.stringify(updatedUrls),
        },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Invalidate cache
      await this.invalidateFranchiseCache(franchiseId);

      return {
        message: 'Gallery images added successfully',
        addedCount: uploadedUrls.length,
        totalCount: updatedUrls.length,
        data: updatedFranchise,
      };
    } catch (error) {
      console.error('Error adding gallery images:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to add gallery images: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a specific gallery image from a franchise
   */
  async deleteGalleryImage(
    franchiseId: string,
    imageUrl: string,
    franchisorId: string,
    userRole: Role,
  ) {
    if (!franchiseId) {
      throw new Error('Franchise ID is required');
    }

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    try {
      // Fetch current franchise
      const currentFranchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        select: {
          id: true,
          ownerId: true,
          galleryUrls: true,
          name: true,
        },
      });

      if (!currentFranchise) {
        throw new NotFoundException('Franchise not found');
      }

      // Verify ownership
      if (
        userRole !== Role.ADMIN &&
        currentFranchise.ownerId !== franchisorId
      ) {
        throw new ForbiddenException('You can only update your own franchises');
      }

      // Parse existing gallery URLs
      const existingUrls = this.parseGalleryUrls(currentFranchise.galleryUrls);

      // Check if image exists in gallery
      if (!existingUrls.includes(imageUrl)) {
        throw new NotFoundException('Image not found in gallery');
      }

      // Remove the image URL from array
      const updatedUrls = existingUrls.filter((url) => url !== imageUrl);

      // Delete the actual file from storage
      try {
        await this.uploadService.deleteFile(imageUrl);
      } catch (deleteError) {
        console.warn('Failed to delete file from storage:', deleteError);
        // Continue with database update even if file deletion fails
      }

      // Update franchise with new gallery URLs
      const updatedFranchise = await this.prismaService.franchise.update({
        where: { id: franchiseId },
        data: {
          galleryUrls:
            updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : null,
        },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Invalidate cache
      await this.invalidateFranchiseCache(franchiseId);

      return {
        message: 'Gallery image deleted successfully',
        remainingCount: updatedUrls.length,
        data: updatedFranchise,
      };
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to delete gallery image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a specific video from a franchise
   */
  async deleteVideo(
    franchiseId: string,
    videoUrl: string,
    franchisorId: string,
    userRole: Role,
  ) {
    if (!franchiseId) {
      throw new Error('Franchise ID is required');
    }

    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    try {
      // Fetch current franchise
      const currentFranchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        select: {
          id: true,
          ownerId: true,
          videoUrl: true,
          name: true,
        },
      });

      if (!currentFranchise) {
        throw new NotFoundException('Franchise not found');
      }

      // Verify ownership
      if (
        userRole !== Role.ADMIN &&
        currentFranchise.ownerId !== franchisorId
      ) {
        throw new ForbiddenException('You can only update your own franchises');
      }

      // Parse existing video URLs
      const existingUrls = this.parseVideoUrls(currentFranchise.videoUrl);

      // Check if video exists
      if (!existingUrls.includes(videoUrl)) {
        throw new NotFoundException('Video not found');
      }

      // Remove the video URL from array
      const updatedUrls = existingUrls.filter((url) => url !== videoUrl);

      // Update franchise with new video URLs
      const updatedFranchise = await this.prismaService.franchise.update({
        where: { id: franchiseId },
        data: {
          videoUrl: updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : null,
        },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Invalidate cache
      await this.invalidateFranchiseCache(franchiseId);

      return {
        message: 'Video deleted successfully',
        remainingCount: updatedUrls.length,
        data: updatedFranchise,
      };
    } catch (error) {
      console.error('Error deleting video:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update franchise logo
   */
  async updateFranchiseLogo(
    franchiseId: string,
    file: Express.Multer.File,
    franchisorId: string,
    userRole: Role,
  ) {
    if (!franchiseId) {
      throw new Error('Franchise ID is required');
    }

    if (!file) {
      throw new Error('Logo file is required');
    }

    try {
      // Fetch current franchise
      const currentFranchise = await this.prismaService.franchise.findUnique({
        where: { id: franchiseId },
        select: {
          id: true,
          ownerId: true,
          logoUrl: true,
          name: true,
        },
      });

      if (!currentFranchise) {
        throw new NotFoundException('Franchise not found');
      }

      // Verify ownership
      if (
        userRole !== Role.ADMIN &&
        currentFranchise.ownerId !== franchisorId
      ) {
        throw new ForbiddenException('You can only update your own franchises');
      }

      // Delete old logo if exists
      if (currentFranchise.logoUrl) {
        try {
          await this.uploadService.deleteFile(currentFranchise.logoUrl);
        } catch (deleteError) {
          console.warn('Failed to delete old logo from storage:', deleteError);
          // Continue with upload even if old file deletion fails
        }
      }

      // Upload new logo
      const logoUrl = await this.uploadService.uploadFile(file, 'franchises');

      // Update franchise with new logo URL
      const updatedFranchise = await this.prismaService.franchise.update({
        where: { id: franchiseId },
        data: { logoUrl },
        include: {
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          franchisees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              anonymous: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  cpf: true,
                },
              },
            },
            where: { isActive: true },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reviews: {
                where: { isActive: true },
              },
              franchisees: true,
            },
          },
          businessModels: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // Invalidate cache
      await this.invalidateFranchiseCache(franchiseId);

      return {
        message: 'Logo updated successfully',
        data: updatedFranchise,
      };
    } catch (error) {
      console.error('Error updating franchise logo:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to update franchise logo: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
