import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SponsorPlacement } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { StatisticsService } from '../statistics/statistics.service';
import { UploadService } from '../upload/upload.service';
import { FranchiseService } from './franchise.service';

describe('FranchiseService', () => {
  let service: FranchiseService;

  const mockPrismaService = {
    franchise: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEmailService = {};
  const mockUploadService = {};
  const mockCacheService = {
    delete: jest.fn().mockResolvedValue(undefined),
    deletePattern: jest.fn().mockResolvedValue(undefined),
  };
  const mockStatisticsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchiseService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: StatisticsService, useValue: mockStatisticsService },
      ],
    }).compile();

    service = module.get<FranchiseService>(FranchiseService);
    jest.clearAllMocks();
  });

  describe('toggleFranchiseSponsored', () => {
    it('clears sponsorPlacements when unsponsoring', async () => {
      mockPrismaService.franchise.update.mockResolvedValue({
        id: 'franchise-1',
        isSponsored: false,
        sponsorPlacements: [],
      });

      await service.toggleFranchiseSponsored('franchise-1', false);

      expect(mockPrismaService.franchise.update).toHaveBeenCalledWith({
        where: { id: 'franchise-1' },
        data: { isSponsored: false, sponsorPlacements: [] },
      });
    });
  });

  describe('updateSponsorPlacements', () => {
    it('throws not found when franchise does not exist', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSponsorPlacements('missing-id', [SponsorPlacement.QUIZ]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws bad request when franchise is not sponsored', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: 'franchise-1',
        isSponsored: false,
      });

      await expect(
        service.updateSponsorPlacements('franchise-1', [SponsorPlacement.QUIZ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates placements for sponsored franchise', async () => {
      mockPrismaService.franchise.findUnique.mockResolvedValue({
        id: 'franchise-1',
        isSponsored: true,
      });
      mockPrismaService.franchise.update.mockResolvedValue({
        id: 'franchise-1',
        isSponsored: true,
        sponsorPlacements: [SponsorPlacement.RANKING_CATEGORIA],
      });

      const result = await service.updateSponsorPlacements('franchise-1', [
        SponsorPlacement.RANKING_CATEGORIA,
      ]);

      expect(mockPrismaService.franchise.update).toHaveBeenCalledWith({
        where: { id: 'franchise-1' },
        data: { sponsorPlacements: [SponsorPlacement.RANKING_CATEGORIA] },
      });
      expect(result).toEqual({
        data: {
          id: 'franchise-1',
          isSponsored: true,
          sponsorPlacements: [SponsorPlacement.RANKING_CATEGORIA],
        },
        message: 'Sponsor placements updated successfully',
      });
    });
  });
});
