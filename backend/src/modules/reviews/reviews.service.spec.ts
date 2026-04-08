import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { StatisticsService } from '../statistics/statistics.service';
import { UsersService } from '../users/services/users.service';
import { ReviewService } from './reviews.service';

describe('ReviewService', () => {
  let service: ReviewService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    franchise: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUsersService = {
    isProfileComplete: jest.fn(),
  };

  const mockStatisticsService = {
    updateStatisticsAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: StatisticsService,
          useValue: mockStatisticsService,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);

    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const franchiseSlug = 'test-franchise';
    const userId = 'user-1';

    const baseReviewData = {
      anonymous: false,
      rating: 4,
      comment: 'Great franchise',
    } as const;

    it('should create review when all preconditions pass', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'User',
        email: 'user@test.com',
        cpf: '123',
      });

      const franchise = {
        id: 'franchise-1',
        isReview: true,
        reviewCount: 0,
        franchisees: [{ id: userId }],
      };

      mockPrismaService.franchise.findUnique.mockResolvedValue(franchise);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockUsersService.isProfileComplete.mockResolvedValue(true);

      const createdReview = {
        id: 1,
        franchiseId: franchise.id,
        authorId: userId,
        anonymous: baseReviewData.anonymous,
        rating: baseReviewData.rating,
        comment: baseReviewData.comment,
        isFranchisee: true,
        isActive: true,
        franchise: { id: franchise.id, name: 'Franchise' },
        author: {
          id: userId,
          name: 'User',
          email: 'user@test.com',
          cpf: '123',
        },
        responses: [],
      };

      mockPrismaService.$transaction.mockImplementation(async (fn: any) =>
        fn({
          review: {
            create: jest.fn().mockResolvedValue(createdReview),
          },
          franchise: {
            update: jest
              .fn()
              .mockResolvedValueOnce({
                reviewCount: 1,
                ratingSum: baseReviewData.rating,
              })
              .mockResolvedValueOnce({}),
          },
        }),
      );

      const result = await service.createReview(
        franchiseSlug,
        userId,
        baseReviewData,
      );

      expect(result).toEqual(createdReview);
      expect(mockStatisticsService.updateStatisticsAsync).toHaveBeenCalled();
    });

    it('should throw when user not found or inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(franchiseSlug, userId, baseReviewData),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw when franchise not found or inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.franchise.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(franchiseSlug, userId, baseReviewData),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw when franchise is not accepting reviews', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: 'franchise-1',
        isReview: false,
        franchisees: [],
      });

      await expect(
        service.createReview(franchiseSlug, userId, baseReviewData),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw when user already reviewed this franchise', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: 'franchise-1',
        isReview: true,
        franchisees: [],
      });
      mockPrismaService.review.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.createReview(franchiseSlug, userId, baseReviewData),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user profile is incomplete', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: 'franchise-1',
        isReview: true,
        franchisees: [],
      });
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockUsersService.isProfileComplete.mockResolvedValue(false);

      await expect(
        service.createReview(franchiseSlug, userId, baseReviewData),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
