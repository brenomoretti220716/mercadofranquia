import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRankingBigNumberType } from './schemas/create-ranking-big-numbers.schema';
import { BulkCreateRankingBigNumbersType } from './schemas/bulk-create-ranking-big-numbers.schema';
import { ReorderRankingBigNumbersType } from './schemas/reorder-ranking-big-numbers-cards.schema';
import { UpdateRankingBigNumberType } from './schemas/update-ranking-big-numbers.schema';
import { SetYearVisibilityType } from './schemas/set-year-visibility.schema';

@Injectable()
export class RankingBigNumbersService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveYear(year?: number) {
    return year ?? new Date().getFullYear();
  }

  private async validateYearConsistency(year: number) {
    const cards = await this.prisma.rankingBigNumber.findMany({
      where: { year },
      orderBy: { position: 'asc' },
    });

    if (cards.length > 4) {
      throw new BadRequestException('Only 4 cards are allowed per year.');
    }
  }

  async findAll(year?: number) {
    const selectedYear = this.resolveYear(year);
    return await this.prisma.rankingBigNumber.findMany({
      where: { year: selectedYear, isHidden: false },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Admin fetches cards even when hidden so the dashboard can unhide the year.
   * Public fetch should use `findAll` (filters hidden).
   */
  async findAllAdmin(year?: number) {
    const selectedYear = this.resolveYear(year);
    return await this.prisma.rankingBigNumber.findMany({
      where: { year: selectedYear },
      orderBy: { position: 'asc' },
    });
  }

  async findAvailableYears() {
    const result = await this.prisma.rankingBigNumber.findMany({
      where: { isHidden: false },
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' },
    });

    return result.map((item) => item.year);
  }

  async create(data: CreateRankingBigNumberType) {
    const year = this.resolveYear(data.year);
    const count = await this.prisma.rankingBigNumber.count({ where: { year } });

    if (count >= 4) {
      throw new BadRequestException(
        'This year already has 4 ranking big number cards.',
      );
    }

    const positionExists = await this.prisma.rankingBigNumber.findFirst({
      where: { year, position: data.position },
      select: { id: true },
    });

    if (positionExists) {
      throw new BadRequestException('Position already used for this year.');
    }

    return await this.prisma.rankingBigNumber.create({
      data: {
        name: data.name,
        position: data.position,
        growthPercentage: data.growthPercentage,
        year,
        isWorst: data.position === 4,
        isHidden: false,
      },
    });
  }

  async bulkCreate(data: BulkCreateRankingBigNumbersType) {
    const { year, cards } = data;

    const count = await this.prisma.rankingBigNumber.count({ where: { year } });
    if (count > 0) {
      throw new BadRequestException('This year already has big numbers cards.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const card of cards) {
        await tx.rankingBigNumber.create({
          data: {
            name: card.name,
            position: card.position,
            growthPercentage: card.growthPercentage,
            year,
            isWorst: card.position === 4,
            isHidden: false,
          },
        });
      }
    });

    // Reuse filter to ensure we always return the visible set
    return await this.findAll(year);
  }

  async update(id: string, data: UpdateRankingBigNumberType) {
    const existing = await this.prisma.rankingBigNumber.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Ranking big number card not found.');
    }

    if (data.position !== undefined && data.position !== existing.position) {
      const positionTaken = await this.prisma.rankingBigNumber.findFirst({
        where: {
          year: existing.year,
          position: data.position,
          id: { not: id },
        },
        select: { id: true },
      });

      if (positionTaken) {
        throw new BadRequestException('Position already used for this year.');
      }
    }

    const updated = await this.prisma.rankingBigNumber.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
        ...(data.growthPercentage !== undefined
          ? { growthPercentage: data.growthPercentage }
          : {}),
        ...(data.position !== undefined
          ? { isWorst: data.position === 4 }
          : {}),
      },
    });

    await this.validateYearConsistency(updated.year);
    return updated;
  }

  async reorder(data: ReorderRankingBigNumbersType) {
    const year = this.resolveYear(data.year);
    const cardsInDb = await this.prisma.rankingBigNumber.findMany({
      where: { year },
      select: { id: true },
    });

    if (cardsInDb.length !== 4) {
      throw new BadRequestException(
        'Reorder requires exactly 4 cards registered for the selected year.',
      );
    }

    const idsInPayload = new Set(data.cards.map((card) => card.id));
    const idsInDb = new Set(cardsInDb.map((card) => card.id));

    if (
      idsInPayload.size !== 4 ||
      cardsInDb.some((card) => !idsInPayload.has(card.id)) ||
      data.cards.some((card) => !idsInDb.has(card.id))
    ) {
      throw new BadRequestException(
        'Payload must contain exactly the same 4 cards from the selected year.',
      );
    }

    const positions = data.cards.map((card) => card.position).sort();
    const validPositions =
      JSON.stringify(positions) === JSON.stringify([1, 2, 3, 4]);
    if (!validPositions) {
      throw new BadRequestException('Positions must be exactly 1, 2, 3 and 4.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const card of data.cards) {
        await tx.rankingBigNumber.update({
          where: { id: card.id },
          data: { position: card.position + 10 },
        });
      }

      for (const card of data.cards) {
        await tx.rankingBigNumber.update({
          where: { id: card.id },
          data: {
            position: card.position,
            isWorst: card.position === 4,
          },
        });
      }
    });

    return await this.findAll(year);
  }

  async delete(id: string) {
    const existing = await this.prisma.rankingBigNumber.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Ranking big number card not found.');
    }

    const count = await this.prisma.rankingBigNumber.count({
      where: { year: existing.year },
    });

    if (count <= 4) {
      throw new BadRequestException(
        'Cannot delete card while year would have less than 4 items.',
      );
    }

    await this.prisma.rankingBigNumber.delete({ where: { id } });
    return { message: 'Ranking big number card deleted successfully.' };
  }

  async setYearVisibility(data: SetYearVisibilityType) {
    const { year, isHidden } = data;

    const count = await this.prisma.rankingBigNumber.count({ where: { year } });
    if (count === 0) {
      throw new BadRequestException(
        'Cannot change visibility for this year because no big numbers cards exist.',
      );
    }

    const result = await this.prisma.rankingBigNumber.updateMany({
      where: { year },
      data: { isHidden },
    });

    return {
      message: `Year ${year} visibility updated successfully.`,
      updatedCount: result.count,
    };
  }
}
