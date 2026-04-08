import { Injectable, Logger } from '@nestjs/common';
import { UnitsEvolution } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FranchiseMonthlyUnitsService {
  private readonly logger = new Logger(FranchiseMonthlyUnitsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  private toMonthStartUtc(year: number, month: number): Date {
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  }

  getCurrentMonthPeriod(): Date {
    const now = new Date();
    return this.toMonthStartUtc(now.getUTCFullYear(), now.getUTCMonth() + 1);
  }

  getPreviousMonthPeriod(period: Date): Date {
    const year = period.getUTCFullYear();
    const month = period.getUTCMonth() + 1;

    if (month === 1) {
      return this.toMonthStartUtc(year - 1, 12);
    }
    return this.toMonthStartUtc(year, month - 1);
  }

  async registerMonthlyUnits(
    franchiseId: string,
    units: number | null,
    period?: Date,
    source?: string,
  ) {
    const normalizedPeriod = period || this.getCurrentMonthPeriod();
    const collectedAt = new Date();

    const result = await this.prismaService.franchiseMonthlyUnits.upsert({
      where: {
        franchiseId_period: {
          franchiseId,
          period: normalizedPeriod,
        },
      },
      create: {
        franchiseId,
        period: normalizedPeriod,
        units,
        collectedAt,
        source,
      },
      update: {
        units,
        collectedAt,
        source,
      },
    });

    this.logger.log(
      `Registered ${units ?? 'null'} units for franchise ${franchiseId} for period ${normalizedPeriod.toISOString()}`,
    );

    return result;
  }

  async calculateEvolution(
    franchiseId: string,
    currentPeriod?: Date,
  ): Promise<UnitsEvolution | null> {
    const period = currentPeriod || this.getCurrentMonthPeriod();
    const previousPeriod = this.getPreviousMonthPeriod(period);

    const [currentData, previousData] = await Promise.all([
      this.prismaService.franchiseMonthlyUnits.findUnique({
        where: {
          franchiseId_period: {
            franchiseId,
            period,
          },
        },
      }),
      this.prismaService.franchiseMonthlyUnits.findUnique({
        where: {
          franchiseId_period: {
            franchiseId,
            period: previousPeriod,
          },
        },
      }),
    ]);

    if (!currentData) {
      return null;
    }

    if (!previousData) {
      return null;
    }

    const currentUnits = currentData.units;
    const previousUnits = previousData.units;

    if (currentUnits === null || previousUnits === null) {
      return null;
    }

    if (currentUnits > previousUnits) {
      return UnitsEvolution.UP;
    } else if (currentUnits < previousUnits) {
      return UnitsEvolution.DOWN;
    } else {
      return UnitsEvolution.MAINTAIN;
    }
  }

  async updateFranchiseEvolution(
    franchiseId: string,
    evolution: UnitsEvolution | null,
  ) {
    await this.prismaService.franchise.update({
      where: { id: franchiseId },
      data: { unitsEvolution: evolution },
    });

    this.logger.log(
      `Updated evolution for franchise ${franchiseId}: ${evolution}`,
    );
  }

  async processMonthlyUnitsUpdate() {
    this.logger.log('Starting monthly units update process...');

    try {
      const currentPeriod = this.getCurrentMonthPeriod();

      const franchises = await this.prismaService.franchise.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          totalUnits: true,
        },
      });

      this.logger.log(`Processing ${franchises.length} franchises...`);

      let processed = 0;
      let errors = 0;

      for (const franchise of franchises) {
        try {
          await this.registerMonthlyUnits(
            franchise.id,
            franchise.totalUnits,
            currentPeriod,
            'monthly_scheduler',
          );

          const evolution = await this.calculateEvolution(
            franchise.id,
            currentPeriod,
          );
          await this.updateFranchiseEvolution(franchise.id, evolution);

          processed++;
        } catch (error) {
          this.logger.error(
            `Error processing franchise ${franchise.id} (${franchise.name}):`,
            error,
          );
          errors++;
        }
      }

      this.logger.log(
        `Monthly units update completed. Processed: ${processed}, Errors: ${errors}`,
      );

      return {
        success: true,
        processed,
        errors,
        total: franchises.length,
      };
    } catch (error) {
      this.logger.error('Error in monthly units update process:', error);
      throw error;
    }
  }

  async getFranchiseHistory(franchiseId: string, limit = 12) {
    return this.prismaService.franchiseMonthlyUnits.findMany({
      where: { franchiseId },
      orderBy: { period: 'desc' },
      take: limit,
    });
  }

  async getMonthData(period: Date) {
    return this.prismaService.franchiseMonthlyUnits.findMany({
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
  }
}
