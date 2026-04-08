import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SponsorPlacement } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FranchiseController } from './franchise.controller';
import { FranchiseService } from './franchise.service';

describe('FranchiseController', () => {
  let controller: FranchiseController;

  const mockFranchiseService = {
    updateSponsorPlacements: jest.fn(),
    toggleFranchiseSponsored: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FranchiseController],
      providers: [
        {
          provide: FranchiseService,
          useValue: mockFranchiseService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FranchiseController>(FranchiseController);
    jest.clearAllMocks();
  });

  describe('updateSponsorPlacements', () => {
    it('throws bad request for invalid payload', async () => {
      await expect(
        controller.updateSponsorPlacements('franchise-1', {
          placements: ['INVALID'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('delegates valid payload to service', async () => {
      const serviceResult = {
        data: {
          id: 'franchise-1',
          isSponsored: true,
          sponsorPlacements: [SponsorPlacement.HOME_DESTAQUES],
        },
        message: 'Sponsor placements updated successfully',
      };
      mockFranchiseService.updateSponsorPlacements.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.updateSponsorPlacements('franchise-1', {
        placements: [SponsorPlacement.HOME_DESTAQUES],
      });

      expect(mockFranchiseService.updateSponsorPlacements).toHaveBeenCalledWith(
        'franchise-1',
        [SponsorPlacement.HOME_DESTAQUES],
      );
      expect(result).toEqual(serviceResult);
    });
  });

  describe('toggleFranchiseSponsored', () => {
    it('delegates to service', async () => {
      const serviceResult = {
        data: { id: 'franchise-1', isSponsored: true },
        message: 'ok',
      };
      mockFranchiseService.toggleFranchiseSponsored.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.toggleFranchiseSponsored(
        'franchise-1',
        true,
      );

      expect(mockFranchiseService.toggleFranchiseSponsored).toHaveBeenCalledWith(
        'franchise-1',
        true,
      );
      expect(result).toEqual(serviceResult);
    });
  });
});
