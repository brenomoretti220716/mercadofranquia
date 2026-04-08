import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { JwtPayload } from '../auth/jwt.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;

  const mockFavoritesService = {
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    toggleFavorite: jest.fn(),
    getUserFavorites: jest.fn(),
    isFavorited: jest.fn(),
    getUserFavoriteIds: jest.fn(),
    getFranchiseFavoritesCount: jest.fn(),
  };

  const mockUser: JwtPayload = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.CANDIDATE,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: mockFavoritesService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FavoritesController>(FavoritesController);

    jest.clearAllMocks();
  });

  describe('addFavorite', () => {
    it('should add franchise to favorites and return success response', async () => {
      const franchiseId = 'franchise-456';
      const mockFavorite = {
        id: 'fav-789',
        userId: mockUser.id,
        franchiseId,
        createdAt: new Date(),
      };

      mockFavoritesService.addFavorite.mockResolvedValue(mockFavorite as any);

      const result = await controller.addFavorite(mockUser, franchiseId);

      expect(result).toEqual({
        success: true,
        message: 'Franchise added to favorites',
        data: mockFavorite,
      });
      expect(mockFavoritesService.addFavorite).toHaveBeenCalledWith(
        mockUser.id,
        franchiseId,
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove franchise from favorites and return success response', async () => {
      const franchiseId = 'franchise-456';

      mockFavoritesService.removeFavorite.mockResolvedValue(undefined);

      const result = await controller.removeFavorite(mockUser, franchiseId);

      expect(result).toEqual({
        success: true,
        message: 'Franchise removed from favorites',
      });
      expect(mockFavoritesService.removeFavorite).toHaveBeenCalledWith(
        mockUser.id,
        franchiseId,
      );
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status to true', async () => {
      const franchiseId = 'franchise-456';
      const mockResponse = {
        isFavorited: true,
        message: 'Franchise added to favorites',
      };

      mockFavoritesService.toggleFavorite.mockResolvedValue(mockResponse);

      const result = await controller.toggleFavorite(mockUser, franchiseId);

      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
      expect(mockFavoritesService.toggleFavorite).toHaveBeenCalledWith(
        mockUser.id,
        franchiseId,
      );
    });

    it('should toggle favorite status to false', async () => {
      const franchiseId = 'franchise-456';
      const mockResponse = {
        isFavorited: false,
        message: 'Franchise removed from favorites',
      };

      mockFavoritesService.toggleFavorite.mockResolvedValue(mockResponse);

      const result = await controller.toggleFavorite(mockUser, franchiseId);

      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });
  });

  describe('getUserFavorites', () => {
    it('should return paginated favorites with default options', async () => {
      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        order: 'desc' as const,
      };

      const mockResponse = {
        data: [
          {
            id: 'fav-1',
            userId: mockUser.id,
            franchiseId: 'franchise-1',
            createdAt: new Date(),
            franchise: {
              id: 'franchise-1',
              name: 'Test Franchise',
              logoUrl: 'logo.png',
              segment: 'Food',
              isActive: true,
              reviewCount: 10,
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockFavoritesService.getUserFavorites.mockResolvedValue(
        mockResponse as any,
      );

      const result = await controller.getUserFavorites(mockUser, query);

      expect(result).toEqual(mockResponse);
      expect(mockFavoritesService.getUserFavorites).toHaveBeenCalledWith(
        mockUser.id,
        query,
      );
    });

    it('should return paginated favorites with custom options', async () => {
      const query = {
        page: 2,
        limit: 10,
        sortBy: 'name' as const,
        order: 'asc' as const,
        search: 'McDonald',
      };

      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 10,
          totalPages: 0,
        },
      };

      mockFavoritesService.getUserFavorites.mockResolvedValue(
        mockResponse as any,
      );

      const result = await controller.getUserFavorites(mockUser, query);

      expect(result).toEqual(mockResponse);
      expect(mockFavoritesService.getUserFavorites).toHaveBeenCalledWith(
        mockUser.id,
        query,
      );
    });
  });

  describe('checkFavorite', () => {
    it('should return true when franchise is favorited', async () => {
      const franchiseId = 'franchise-456';
      const mockResponse = { isFavorited: true };

      mockFavoritesService.isFavorited.mockResolvedValue(mockResponse);

      const result = await controller.checkFavorite(mockUser, franchiseId);

      expect(result).toEqual(mockResponse);
      expect(mockFavoritesService.isFavorited).toHaveBeenCalledWith(
        mockUser.id,
        franchiseId,
      );
    });

    it('should return false when franchise is not favorited', async () => {
      const franchiseId = 'franchise-456';
      const mockResponse = { isFavorited: false };

      mockFavoritesService.isFavorited.mockResolvedValue(mockResponse);

      const result = await controller.checkFavorite(mockUser, franchiseId);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFavoriteIds', () => {
    it('should return array of favorite franchise IDs', async () => {
      const mockIds = ['franchise-1', 'franchise-2', 'franchise-3'];

      mockFavoritesService.getUserFavoriteIds.mockResolvedValue(mockIds);

      const result = await controller.getFavoriteIds(mockUser);

      expect(result).toEqual({
        franchiseIds: mockIds,
      });
      expect(mockFavoritesService.getUserFavoriteIds).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should return empty array when user has no favorites', async () => {
      mockFavoritesService.getUserFavoriteIds.mockResolvedValue([]);

      const result = await controller.getFavoriteIds(mockUser);

      expect(result).toEqual({
        franchiseIds: [],
      });
    });
  });
});
