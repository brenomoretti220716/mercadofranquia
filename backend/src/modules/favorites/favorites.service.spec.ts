import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/services/users.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const mockPrismaService = {
    favorite: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    franchise: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    isProfileComplete: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);

    jest.clearAllMocks();
  });

  describe('addFavorite', () => {
    const userId = 'user-123';
    const franchiseSlug = 'franchise-456';
    const franchiseId = 'franchise-456';

    it('should create a new favorite when franchise exists and is active', async () => {
      const mockFranchise = {
        id: franchiseId,
        name: 'Test Franchise',
        isActive: true,
      };

      const mockFavorite = {
        id: 'fav-789',
        userId,
        franchiseId,
        createdAt: new Date(),
      };

      mockPrismaService.franchise.findUnique
        .mockResolvedValueOnce({ id: franchiseId })
        .mockResolvedValueOnce(mockFranchise as any);
      mockPrismaService.favorite.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([
        mockFavorite,
        mockFranchise,
      ] as any);

      const result = await service.addFavorite(userId, franchiseSlug);

      expect(result).toEqual(mockFavorite);
      expect(mockPrismaService.franchise.findUnique).toHaveBeenNthCalledWith(
        1,
        {
          where: { slug: franchiseSlug, isActive: true },
          select: { id: true },
        },
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should return existing favorite when already favorited (idempotent)', async () => {
      const mockFranchise = {
        id: franchiseId,
        isActive: true,
      };

      const existingFavorite = {
        id: 'fav-existing',
        userId,
        franchiseId,
        createdAt: new Date(),
      };

      mockPrismaService.franchise.findUnique
        .mockResolvedValueOnce({ id: franchiseId })
        .mockResolvedValueOnce(mockFranchise as any);
      mockPrismaService.favorite.findUnique.mockResolvedValue(
        existingFavorite as any,
      );

      const result = await service.addFavorite(userId, franchiseSlug);

      expect(result).toEqual(existingFavorite);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when franchise does not exist', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue(null);

      await expect(service.addFavorite(userId, franchiseSlug)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addFavorite(userId, franchiseSlug)).rejects.toThrow(
        `Franchise with slug ${franchiseSlug} not found`,
      );
    });

    it('should throw NotFoundException when franchise is inactive', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue(null);

      await expect(service.addFavorite(userId, franchiseSlug)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addFavorite(userId, franchiseSlug)).rejects.toThrow(
        `Franchise with slug ${franchiseSlug} not found`,
      );
    });
  });

  describe('removeFavorite', () => {
    const userId = 'user-123';
    const franchiseSlug = 'franchise-456';
    const franchiseId = 'franchise-456';

    it('should remove favorite and decrement counter when favorite exists', async () => {
      const mockFavorite = {
        id: 'fav-789',
        userId,
        franchiseId,
        createdAt: new Date(),
      };

      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: franchiseId,
      });
      mockPrismaService.favorite.findUnique.mockResolvedValue(
        mockFavorite as any,
      );
      mockPrismaService.$transaction.mockResolvedValue([null, null] as any);

      await service.removeFavorite(userId, franchiseSlug);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should do nothing when favorite does not exist (idempotent)', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: franchiseId,
      });
      mockPrismaService.favorite.findUnique.mockResolvedValue(null);

      await service.removeFavorite(userId, franchiseSlug);

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('toggleFavorite', () => {
    const userId = 'user-123';
    const franchiseSlug = 'franchise-456';
    const franchiseId = 'franchise-456';

    it('should remove favorite when it exists', async () => {
      const mockFavorite = {
        id: 'fav-789',
        userId,
        franchiseId,
        createdAt: new Date(),
      };

      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: franchiseId,
      });
      mockPrismaService.favorite.findUnique.mockResolvedValue(
        mockFavorite as any,
      );
      mockPrismaService.$transaction.mockResolvedValue([null, null] as any);

      const result = await service.toggleFavorite(userId, franchiseSlug);

      expect(result.isFavorited).toBe(false);
      expect(result.message).toBe('Franchise removed from favorites');
    });

    it('should add favorite when it does not exist', async () => {
      const mockFranchise = {
        id: franchiseId,
        isActive: true,
      };

      const mockFavorite = {
        id: 'fav-new',
        userId,
        franchiseId,
        createdAt: new Date(),
      };

      mockPrismaService.favorite.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrismaService.franchise.findUnique
        .mockResolvedValueOnce({ id: franchiseId })
        .mockResolvedValueOnce({ id: franchiseId })
        .mockResolvedValueOnce(mockFranchise as any);
      mockPrismaService.$transaction.mockResolvedValue([mockFavorite] as any);

      const result = await service.toggleFavorite(userId, franchiseSlug);

      expect(result.isFavorited).toBe(true);
      expect(result.message).toBe('Franchise added to favorites');
    });
  });

  describe('getUserFavorites', () => {
    const userId = 'user-123';

    it('should return paginated favorites with franchise details', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          userId,
          franchiseId: 'franchise-1',
          createdAt: new Date(),
          franchise: {
            id: 'franchise-1',
            name: 'Franchise 1',
            logoUrl: 'logo1.png',
            segment: 'Food',
            isActive: true,
            reviewCount: 10,
          },
        },
        {
          id: 'fav-2',
          userId,
          franchiseId: 'franchise-2',
          createdAt: new Date(),
          franchise: {
            id: 'franchise-2',
            name: 'Franchise 2',
            logoUrl: 'logo2.png',
            segment: 'Retail',
            isActive: true,
            reviewCount: 5,
          },
        },
      ];

      mockPrismaService.favorite.count.mockResolvedValue(15);
      mockPrismaService.favorite.findMany.mockResolvedValue(
        mockFavorites as any,
      );

      const options = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        order: 'desc' as const,
      };

      const result = await service.getUserFavorites(userId, options);

      expect(result.data).toEqual(mockFavorites);
      expect(result.meta.total).toBe(15);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter favorites by search query', async () => {
      mockPrismaService.favorite.count.mockResolvedValue(5);
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const options = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        order: 'desc' as const,
        search: 'McDonald',
      };

      await service.getUserFavorites(userId, options);

      expect(mockPrismaService.favorite.findMany).toHaveBeenCalled();
      expect(mockPrismaService.favorite.count).toHaveBeenCalled();
    });

    it('should sort by franchise name when specified', async () => {
      mockPrismaService.favorite.count.mockResolvedValue(5);
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const options = {
        page: 1,
        limit: 20,
        sortBy: 'name' as const,
        order: 'asc' as const,
      };

      await service.getUserFavorites(userId, options);

      expect(mockPrismaService.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            franchise: {
              name: 'asc',
            },
          },
        }),
      );
    });

    it('should calculate correct pagination meta', async () => {
      mockPrismaService.favorite.count.mockResolvedValue(45);
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const options = {
        page: 2,
        limit: 20,
        sortBy: 'createdAt' as const,
        order: 'desc' as const,
      };

      const result = await service.getUserFavorites(userId, options);

      expect(result.meta.total).toBe(45);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should skip correct number of records for pagination', async () => {
      mockPrismaService.favorite.count.mockResolvedValue(50);
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const options = {
        page: 3,
        limit: 10,
        sortBy: 'createdAt' as const,
        order: 'desc' as const,
      };

      await service.getUserFavorites(userId, options);

      expect(mockPrismaService.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10,
        }),
      );
    });
  });

  describe('isFavorited', () => {
    const userId = 'user-123';
    const franchiseSlug = 'franchise-456';
    const franchiseId = 'franchise-456';

    it('should return true when favorite exists', async () => {
      const mockFavorite = {
        id: 'fav-789',
        userId,
        franchiseId,
        createdAt: new Date(),
      };

      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: franchiseId,
      });
      mockPrismaService.favorite.findUnique.mockResolvedValueOnce(
        mockFavorite as any,
      );

      const result = await service.isFavorited(userId, franchiseSlug);

      expect(result.isFavorited).toBe(true);
    });

    it('should return false when favorite does not exist', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: franchiseId,
      });
      mockPrismaService.favorite.findUnique.mockResolvedValueOnce(null);

      const result = await service.isFavorited(userId, franchiseSlug);

      expect(result.isFavorited).toBe(false);
    });
  });

  describe('getUserFavoriteIds', () => {
    const userId = 'user-123';

    it('should return array of franchise IDs', async () => {
      const mockFavorites = [
        { franchiseId: 'franchise-1' },
        { franchiseId: 'franchise-2' },
        { franchiseId: 'franchise-3' },
      ];

      mockPrismaService.favorite.findMany.mockResolvedValue(
        mockFavorites as any,
      );

      const result = await service.getUserFavoriteIds(userId);

      expect(result).toEqual(['franchise-1', 'franchise-2', 'franchise-3']);
      expect(mockPrismaService.favorite.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { franchiseId: true },
      });
    });

    it('should return empty array when user has no favorites', async () => {
      mockPrismaService.favorite.findMany.mockResolvedValue([]);

      const result = await service.getUserFavoriteIds(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getFranchiseFavoritesCount', () => {
    const franchiseId = 'franchise-456';

    it('should return favorites count for franchise', async () => {
      const mockFranchise = {
        favoritesCount: 25,
      };

      mockPrismaService.franchise.findUnique.mockResolvedValue(
        mockFranchise as any,
      );

      const result = await service.getFranchiseFavoritesCount(franchiseId);

      expect(result).toBe(25);
      expect(mockPrismaService.franchise.findUnique).toHaveBeenCalledWith({
        where: { id: franchiseId },
        select: { favoritesCount: true },
      });
    });

    it('should return 0 when franchise does not exist', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue(null);

      const result = await service.getFranchiseFavoritesCount(franchiseId);

      expect(result).toBe(0);
    });

    it('should return 0 when favoritesCount is null', async () => {
      const mockFranchise = {
        favoritesCount: null,
      };

      mockPrismaService.franchise.findUnique.mockResolvedValue(
        mockFranchise as any,
      );

      const result = await service.getFranchiseFavoritesCount(franchiseId);

      expect(result).toBe(0);
    });
  });
});
