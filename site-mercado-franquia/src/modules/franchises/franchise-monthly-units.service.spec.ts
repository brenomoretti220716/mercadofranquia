import { Test, TestingModule } from '@nestjs/testing';
import { UnitsEvolution } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FranchiseMonthlyUnitsService } from './franchise-monthly-units.service';

describe('FranchiseMonthlyUnitsService', () => {
  let service: FranchiseMonthlyUnitsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    franchiseMonthlyUnits: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    franchise: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchiseMonthlyUnitsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FranchiseMonthlyUnitsService>(
      FranchiseMonthlyUnitsService,
    );
    prismaService = module.get<jest.Mocked<PrismaService>>(PrismaService);

    jest.clearAllMocks();
  });

  describe('registerMonthlyUnits', () => {
    it('should register monthly units for a franchise', async () => {
      const franchiseId = 'test-franchise-id';
      const units = 150;
      const period = new Date('2025-02-01T00:00:00.000Z');

      const mockResult = {
        id: 'test-id',
        franchiseId,
        period,
        units,
        collectedAt: new Date(),
        source: 'test',
      };

      mockPrismaService.franchiseMonthlyUnits.upsert.mockResolvedValue(
        mockResult,
      );

      const result = await service.registerMonthlyUnits(
        franchiseId,
        units,
        period,
        'test',
      );

      expect(result).toEqual(mockResult);
      expect(
        mockPrismaService.franchiseMonthlyUnits.upsert,
      ).toHaveBeenCalledWith({
        where: {
          franchiseId_period: {
            franchiseId,
            period,
          },
        },
        create: expect.objectContaining({
          franchiseId,
          period,
          units,
          source: 'test',
        }),
        update: expect.objectContaining({
          units,
          source: 'test',
        }),
      });
    });

    it('should register null units for a franchise without units', async () => {
      const franchiseId = 'test-franchise-id';
      const units = null;
      const period = new Date('2025-02-01T00:00:00.000Z');

      const mockResult = {
        id: 'test-id',
        franchiseId,
        period,
        units: null,
        collectedAt: new Date(),
        source: 'test',
      };

      mockPrismaService.franchiseMonthlyUnits.upsert.mockResolvedValue(
        mockResult,
      );

      const result = await service.registerMonthlyUnits(
        franchiseId,
        units,
        period,
        'test',
      );

      expect(result).toEqual(mockResult);
      expect(
        mockPrismaService.franchiseMonthlyUnits.upsert,
      ).toHaveBeenCalledWith({
        where: {
          franchiseId_period: {
            franchiseId,
            period,
          },
        },
        create: expect.objectContaining({
          franchiseId,
          period,
          units: null,
          source: 'test',
        }),
        update: expect.objectContaining({
          units: null,
          source: 'test',
        }),
      });
    });

    it('should use current period if period is not provided', async () => {
      const franchiseId = 'test-franchise-id';
      const units = 150;

      const mockResult = {
        id: 'test-id',
        franchiseId,
        period: expect.any(Date),
        units,
        collectedAt: new Date(),
        source: null,
      };

      mockPrismaService.franchiseMonthlyUnits.upsert.mockResolvedValue(
        mockResult,
      );

      await service.registerMonthlyUnits(franchiseId, units);

      expect(mockPrismaService.franchiseMonthlyUnits.upsert).toHaveBeenCalled();
    });
  });

  describe('calculateEvolution', () => {
    it('should return UP when current units are greater than previous', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique
        .mockResolvedValueOnce({
          id: 'current-id',
          franchiseId,
          period,
          units: 200,
          collectedAt: new Date(),
          source: 'test',
        })
        .mockResolvedValueOnce({
          id: 'previous-id',
          franchiseId,
          period: new Date('2025-02-01T00:00:00.000Z'),
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        });

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBe(UnitsEvolution.UP);
    });

    it('should return DOWN when current units are less than previous', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique
        .mockResolvedValueOnce({
          id: 'current-id',
          franchiseId,
          period,
          units: 100,
          collectedAt: new Date(),
          source: 'test',
        })
        .mockResolvedValueOnce({
          id: 'previous-id',
          franchiseId,
          period: new Date('2025-02-01T00:00:00.000Z'),
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        });

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBe(UnitsEvolution.DOWN);
    });

    it('should return MAINTAIN when current units equal previous', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique
        .mockResolvedValueOnce({
          id: 'current-id',
          franchiseId,
          period,
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        })
        .mockResolvedValueOnce({
          id: 'previous-id',
          franchiseId,
          period: new Date('2025-02-01T00:00:00.000Z'),
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        });

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBe(UnitsEvolution.MAINTAIN);
    });

    it('should return null when current data does not exist', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique.mockResolvedValue(
        null,
      );

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBeNull();
    });

    it('should return null when previous data does not exist', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique
        .mockResolvedValueOnce({
          id: 'current-id',
          franchiseId,
          period,
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        })
        .mockResolvedValueOnce(null);

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBeNull();
    });

    it('should return null when current units is null', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique
        .mockResolvedValueOnce({
          id: 'current-id',
          franchiseId,
          period,
          units: null,
          collectedAt: new Date(),
          source: 'test',
        })
        .mockResolvedValueOnce({
          id: 'previous-id',
          franchiseId,
          period: new Date('2025-02-01T00:00:00.000Z'),
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        });

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBeNull();
    });

    it('should return null when previous units is null', async () => {
      const franchiseId = 'test-franchise-id';
      const period = new Date('2025-03-01T00:00:00.000Z');

      mockPrismaService.franchiseMonthlyUnits.findUnique
        .mockResolvedValueOnce({
          id: 'current-id',
          franchiseId,
          period,
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        })
        .mockResolvedValueOnce({
          id: 'previous-id',
          franchiseId,
          period: new Date('2025-02-01T00:00:00.000Z'),
          units: null,
          collectedAt: new Date(),
          source: 'test',
        });

      const evolution = await service.calculateEvolution(franchiseId, period);

      expect(evolution).toBeNull();
    });
  });

  describe('updateFranchiseEvolution', () => {
    it('should update franchise evolution field', async () => {
      const franchiseId = 'test-franchise-id';
      const evolution = UnitsEvolution.UP;

      mockPrismaService.franchise.update.mockResolvedValue({
        id: franchiseId,
        unitsEvolution: evolution,
      } as any);

      await service.updateFranchiseEvolution(franchiseId, evolution);

      expect(mockPrismaService.franchise.update).toHaveBeenCalledWith({
        where: { id: franchiseId },
        data: { unitsEvolution: evolution },
      });
    });
  });

  describe('processMonthlyUnitsUpdate', () => {
    it('should process monthly units update for all active franchises', async () => {
      const mockFranchises = [
        { id: 'franchise-1', name: 'Franchise 1', totalUnits: 100 },
        { id: 'franchise-2', name: 'Franchise 2', totalUnits: 200 },
        { id: 'franchise-3', name: 'Franchise 3', totalUnits: null },
      ];

      mockPrismaService.franchise.findMany.mockResolvedValue(
        mockFranchises as any,
      );

      mockPrismaService.franchiseMonthlyUnits.upsert.mockResolvedValue({
        id: 'test-id',
        franchiseId: 'test',
        period: new Date(),
        units: 100,
        collectedAt: new Date(),
        source: 'monthly_scheduler',
      });

      mockPrismaService.franchiseMonthlyUnits.findUnique.mockResolvedValue(
        null,
      );

      mockPrismaService.franchise.update.mockResolvedValue({} as any);

      const result = await service.processMonthlyUnitsUpdate();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(3);
      expect(result.total).toBe(3);
      expect(result.errors).toBe(0);
    });

    it('should handle errors gracefully during processing', async () => {
      const mockFranchises = [
        { id: 'franchise-1', name: 'Franchise 1', totalUnits: 100 },
        { id: 'franchise-2', name: 'Franchise 2', totalUnits: 200 },
      ];

      mockPrismaService.franchise.findMany.mockResolvedValue(
        mockFranchises as any,
      );

      mockPrismaService.franchiseMonthlyUnits.upsert
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({
          id: 'test-id',
          franchiseId: 'test',
          period: new Date(),
          units: 200,
          collectedAt: new Date(),
          source: 'monthly_scheduler',
        });

      mockPrismaService.franchiseMonthlyUnits.findUnique.mockResolvedValue(
        null,
      );

      mockPrismaService.franchise.update.mockResolvedValue({} as any);

      const result = await service.processMonthlyUnitsUpdate();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.total).toBe(2);
    });
  });

  describe('getFranchiseHistory', () => {
    it('should get franchise history with default limit', async () => {
      const franchiseId = 'test-franchise-id';
      const mockHistory = [
        {
          id: '1',
          franchiseId,
          period: new Date('2025-03-01'),
          units: 150,
          collectedAt: new Date(),
          source: 'test',
        },
        {
          id: '2',
          franchiseId,
          period: new Date('2025-02-01'),
          units: 140,
          collectedAt: new Date(),
          source: 'test',
        },
      ];

      mockPrismaService.franchiseMonthlyUnits.findMany.mockResolvedValue(
        mockHistory,
      );

      const result = await service.getFranchiseHistory(franchiseId);

      expect(result).toEqual(mockHistory);
      expect(
        mockPrismaService.franchiseMonthlyUnits.findMany,
      ).toHaveBeenCalledWith({
        where: { franchiseId },
        orderBy: { period: 'desc' },
        take: 12,
      });
    });

    it('should get franchise history with custom limit', async () => {
      const franchiseId = 'test-franchise-id';
      const limit = 6;

      mockPrismaService.franchiseMonthlyUnits.findMany.mockResolvedValue([]);

      await service.getFranchiseHistory(franchiseId, limit);

      expect(
        mockPrismaService.franchiseMonthlyUnits.findMany,
      ).toHaveBeenCalledWith({
        where: { franchiseId },
        orderBy: { period: 'desc' },
        take: limit,
      });
    });
  });

  describe('getMonthData', () => {
    it('should get all franchise data for a specific month', async () => {
      const period = new Date('2025-03-01T00:00:00.000Z');
      const mockData = [
        {
          id: '1',
          franchiseId: 'franchise-1',
          period,
          units: 100,
          collectedAt: new Date(),
          source: 'test',
          franchise: { id: 'franchise-1', name: 'Franchise 1' },
        },
        {
          id: '2',
          franchiseId: 'franchise-2',
          period,
          units: 200,
          collectedAt: new Date(),
          source: 'test',
          franchise: { id: 'franchise-2', name: 'Franchise 2' },
        },
      ];

      mockPrismaService.franchiseMonthlyUnits.findMany.mockResolvedValue(
        mockData as any,
      );

      const result = await service.getMonthData(period);

      expect(result).toEqual(mockData);
      expect(
        mockPrismaService.franchiseMonthlyUnits.findMany,
      ).toHaveBeenCalledWith({
        where: { period },
        include: {
          franchise: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { franchiseId: 'asc' },
      });
    });
  });

  describe('date utility methods', () => {
    it('should get current month period', () => {
      const period = service.getCurrentMonthPeriod();

      expect(period).toBeInstanceOf(Date);
      expect(period.getUTCDate()).toBe(1);
      expect(period.getUTCHours()).toBe(0);
      expect(period.getUTCMinutes()).toBe(0);
      expect(period.getUTCSeconds()).toBe(0);
    });

    it('should get previous month period', () => {
      const currentPeriod = new Date('2025-03-01T00:00:00.000Z');
      const previousPeriod = service.getPreviousMonthPeriod(currentPeriod);

      expect(previousPeriod.getUTCFullYear()).toBe(2025);
      expect(previousPeriod.getUTCMonth()).toBe(1);
      expect(previousPeriod.getUTCDate()).toBe(1);
    });

    it('should handle year rollback when getting previous month from January', () => {
      const januaryPeriod = new Date('2025-01-01T00:00:00.000Z');
      const previousPeriod = service.getPreviousMonthPeriod(januaryPeriod);

      expect(previousPeriod.getUTCFullYear()).toBe(2024);
      expect(previousPeriod.getUTCMonth()).toBe(11);
      expect(previousPeriod.getUTCDate()).toBe(1);
    });
  });
});
