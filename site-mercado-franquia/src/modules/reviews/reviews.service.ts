import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StatisticsService } from '../statistics/statistics.service';
import { UsersService } from '../users/services/users.service';
import { CreateReviewType } from './schemas/create-review.schema';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly statisticsService: StatisticsService,
  ) {}

  private isUserFranchisee(
    franchise: { franchisees?: { id: string }[] } | null,
    userId: string,
  ): boolean {
    return !!franchise?.franchisees?.some((f) => f.id === userId);
  }

  async createReview(
    franchiseSlug: string,
    userId: string,
    reviewData: CreateReviewType,
  ) {
    try {
      // 1. Verificar se o usuário existe e está ativo
      const user = await this.prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: { id: true, name: true, email: true, cpf: true },
      });

      if (!user) {
        throw new NotFoundException('User not found or inactive');
      }

      // 2. Verificar se a franquia existe e está ativa (via slug)
      const franchise = await this.prisma.franchise.findUnique({
        where: { slug: franchiseSlug, isActive: true },
        include: {
          franchisees: {
            select: { id: true },
          },
        },
      });

      if (!franchise) {
        throw new NotFoundException('Franchise not found or inactive');
      }

      if (franchise.isReview === false) {
        throw new ForbiddenException('Franchise is not accepting reviews');
      }

      // 3. Verificar se o usuário já fez uma review para esta franquia
      const existingReview = await this.prisma.review.findFirst({
        where: {
          franchiseId: franchise.id,
          authorId: userId,
        },
      });

      if (existingReview) {
        throw new BadRequestException(
          'You have already reviewed this franchise',
        );
      }

      // 4. Verificar se o perfil do usuário está completo
      const isProfileComplete =
        await this.usersService.isProfileComplete(userId);

      if (!isProfileComplete) {
        throw new ForbiddenException(
          'Complete seu perfil para usar esta funcionalidade',
        );
      }

      // 5. Verificar se o autor é franqueado desta franquia
      const isFranchisee = this.isUserFranchisee(franchise, userId);

      // 6. Criar a review (sempre ativa por padrão) e atualizar métricas de rating de forma transacional

      const createdReview = await this.prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            franchiseId: franchise.id,
            authorId: userId,
            anonymous: reviewData.anonymous,
            rating: reviewData.rating,
            comment: reviewData.comment,
            isFranchisee,
            isActive: true,
          },
          include: {
            franchise: {
              select: {
                id: true,
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
              },
            },
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
        });

        const updated = await tx.franchise.update({
          where: { id: franchise.id },
          data: {
            reviewCount: { increment: 1 },
            ratingSum: { increment: reviewData.rating },
          },
          select: { reviewCount: true, ratingSum: true },
        });

        const average =
          updated.reviewCount > 0
            ? Number(updated.ratingSum) / updated.reviewCount
            : null;

        await tx.franchise.update({
          where: { id: franchise.id },
          data: { averageRating: average },
        });

        return review;
      });

      // Update platform statistics asynchronously (fire-and-forget)
      // This will update totalReviews, medianRating, and franchisesReviewed if needed
      void this.statisticsService?.updateStatisticsAsync();

      return createdReview;
    } catch (error: unknown) {
      console.error('Error creating review:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new Error('Failed to create review');
    }
  }

  async findByFranchiseId(
    franchiseSlug: string,
    page: number = 1,
    limit: number = 4,
  ) {
    try {
      if (!franchiseSlug) {
        throw new BadRequestException('Franchise slug is required');
      }

      // Verificar se a franquia existe e está ativa (via slug)
      const franchise = await this.prisma.franchise.findUnique({
        where: { slug: franchiseSlug, isActive: true },
        select: { id: true },
      });

      if (!franchise) {
        throw new NotFoundException('Franchise not found or inactive');
      }

      const safePage = Math.max(1, page);
      const safeLimit = Math.max(1, Math.min(limit, 100));
      const skip = (safePage - 1) * safeLimit;

      // Buscar apenas reviews ativas, paginadas e ordenadas da mais recente para a mais antiga
      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where: { franchiseId: franchise.id, isActive: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
              },
            },
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
          skip,
          take: safeLimit,
        }),
        this.prisma.review.count({
          where: { franchiseId: franchise.id, isActive: true },
        }),
      ]);

      const data = reviews.map((review) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        anonymous: review.anonymous,
        createdAt: review.createdAt,
        isActive: review.isActive,
        isFranchisee: review.isFranchisee,
        responses: review.responses,
      }));

      return {
        data,
        total,
        page: safePage,
        limit: safeLimit,
        lastPage: Math.ceil(total / safeLimit),
      };
    } catch (error: unknown) {
      console.error(
        `Error fetching reviews for franchise ${franchiseSlug}:`,
        error,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new Error(`Failed to fetch reviews for franchise ${franchiseSlug}`);
    }
  }

  async findById(reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId, isActive: true },
      include: {
        franchise: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
          },
        },
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
    });

    if (!review) {
      throw new NotFoundException('Review not found or inactive');
    }

    return review;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        where: {
          isActive: true,
          franchise: {
            isActive: true,
          },
        },
        include: {
          franchise: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
            },
          },
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
      }),
      this.prisma.review.count({
        where: {
          isActive: true,
          franchise: {
            isActive: true,
          },
        },
      }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewStats(franchiseSlug: string) {
    // Resolve slug -> franchise ID
    const franchise = await this.prisma.franchise.findUnique({
      where: { slug: franchiseSlug, isActive: true },
      select: { id: true },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found or inactive');
    }

    const stats = await this.prisma.review.aggregate({
      where: { franchiseId: franchise.id, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { franchiseId: franchise.id, isActive: true },
      _count: { rating: true },
      orderBy: { rating: 'asc' },
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating || 0,
      ratingDistribution: ratingDistribution.map((item) => ({
        rating: item.rating,
        count: item._count.rating,
      })),
    };
  }

  async toggleReviewStatus(
    reviewId: number,
    isActive: boolean,
    userRole: Role,
  ) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can change review status',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, isActive: true, rating: true, franchiseId: true },
    });

    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    if (existing.isActive === isActive) {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          franchise: { select: { id: true, name: true } },
          author: {
            select: { id: true, name: true, email: true, cpf: true },
          },
          responses: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return {
        data: review,
        message: `Review already ${isActive ? 'active' : 'inactive'}`,
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: { isActive },
        include: {
          franchise: { select: { id: true, name: true } },
          author: {
            select: { id: true, name: true, email: true, cpf: true },
          },
          responses: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const deltaCount = isActive ? 1 : -1;
      const deltaSum = isActive ? existing.rating : -existing.rating;

      const updated = await tx.franchise.update({
        where: { id: existing.franchiseId },
        data: {
          reviewCount: { increment: deltaCount },
          ratingSum: { increment: deltaSum },
        },
        select: { reviewCount: true, ratingSum: true },
      });

      const safeCount = Math.max(0, updated.reviewCount);
      const average =
        safeCount > 0 ? Number(updated.ratingSum) / safeCount : null;

      await tx.franchise.update({
        where: { id: existing.franchiseId },
        data: { averageRating: average, reviewCount: safeCount },
      });

      return updatedReview;
    });

    // Update platform statistics asynchronously (fire-and-forget)
    // This will update totalReviews, medianRating, and franchisesReviewed if needed
    void this.statisticsService?.updateStatisticsAsync();

    return {
      data: result,
      message: `Review ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'review' | 'response' = 'review',
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const where = { authorId: userId };

      // Fetch all reviews for the user with responses
      const allReviews = await this.prisma.review.findMany({
        where,
        include: {
          franchise: {
            select: {
              id: true,
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
            },
          },
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
      });

      // Sort reviews based on sortBy parameter
      let sortedReviews = allReviews;
      if (sortBy === 'response') {
        sortedReviews = allReviews.sort((a, b) => {
          const aLatestResponse = a.responses[0]?.createdAt || null;
          const bLatestResponse = b.responses[0]?.createdAt || null;

          // Reviews with responses come first, sorted by most recent response
          if (aLatestResponse && bLatestResponse) {
            return (
              new Date(bLatestResponse).getTime() -
              new Date(aLatestResponse).getTime()
            );
          }
          // Reviews with responses come before reviews without
          if (aLatestResponse && !bLatestResponse) {
            return -1;
          }
          if (!aLatestResponse && bLatestResponse) {
            return 1;
          }
          // Both without responses, sort by review creation date
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } else {
        // Default: sort by review creation date (most recent first)
        sortedReviews = allReviews.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }

      // Paginate the sorted results
      const skip = (page - 1) * limit;
      const paginatedReviews = sortedReviews.slice(skip, skip + limit);
      const total = sortedReviews.length;

      return {
        data: paginatedReviews,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      console.error(`Error fetching reviews for user ${userId}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new Error(`Failed to fetch reviews for user ${userId}`);
    }
  }

  // Método atualizado para buscar reviews de uma franquia específica para admin
  async findByFranchiseIdForAdmin(
    franchiseId: string,
    page: number = 1,
    limit: number = 10,
    userRole: Role,
  ) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can view all reviews');
    }

    if (!franchiseId) {
      throw new BadRequestException('Franchise ID is required');
    }

    // Verificar se a franquia existe (não precisa estar ativa para admin)
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
      select: { id: true, name: true, isActive: true },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        where: { franchiseId },
        include: {
          franchise: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
            },
          },
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
      }),
      this.prisma.review.count({ where: { franchiseId } }),
    ]);

    return {
      data: reviews,
      franchise: {
        id: franchise.id,
        name: franchise.name,
        isActive: franchise.isActive,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
