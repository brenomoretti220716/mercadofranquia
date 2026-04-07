import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAbfSegmentType } from './schemas/create-abf-segment.schema';
import { UpdateAbfSegmentType } from './schemas/update-abf-segment.schema';

type FindAbfSegmentsParams = {
  year?: number;
  quarter?: string;
};

@Injectable()
export class AbfSegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAbfSegmentsParams) {
    const where: { year?: number; quarter?: string } = {};

    if (params.year !== undefined) where.year = params.year;
    if (params.quarter) where.quarter = params.quarter;

    return await this.prisma.abfSegmentEntry.findMany({
      where,
      orderBy: [{ year: 'asc' }, { acronym: 'asc' }],
    });
  }

  async create(data: CreateAbfSegmentType) {
    return await this.prisma.abfSegmentEntry.create({
      data: {
        year: data.year,
        quarter: data.quarter,
        segment: data.segment,
        acronym: data.acronym,
        value: data.value,
      },
    });
  }

  async update(id: string, data: UpdateAbfSegmentType) {
    const existing = await this.prisma.abfSegmentEntry.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Segmento ABF não encontrado');

    return await this.prisma.abfSegmentEntry.update({
      where: { id },
      data: {
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.quarter !== undefined ? { quarter: data.quarter } : {}),
        ...(data.segment !== undefined ? { segment: data.segment } : {}),
        ...(data.acronym !== undefined ? { acronym: data.acronym } : {}),
        ...(data.value !== undefined ? { value: data.value } : {}),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.abfSegmentEntry.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Segmento ABF não encontrado');

    await this.prisma.abfSegmentEntry.delete({ where: { id } });
    return { message: 'Segmento ABF deletado com sucesso' };
  }
}
