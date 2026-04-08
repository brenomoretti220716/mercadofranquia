import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from 'src/modules/database/prisma.service';
import { EmailService } from 'src/modules/email/email.service';
import { UpdateFranchisorUserDto } from '../schemas/update-user.schema';

@Injectable()
export class FranchisorsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private validateFranchisorData(ownedFranchises?: string[]): void {
    if (!ownedFranchises || ownedFranchises.length === 0) {
      throw new BadRequestException('At least one franchise is required');
    }
  }

  private async validateFranchiseAvailability(
    ownedFranchises: string[],
    excludeUserId?: string,
  ): Promise<void> {
    const existingFranchises = await this.prisma.franchise.findMany({
      where: {
        id: { in: ownedFranchises },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const foundFranchiseIds = existingFranchises.map((f) => f.id);
    const notFoundFranchises = ownedFranchises.filter(
      (id) => !foundFranchiseIds.includes(id),
    );

    if (notFoundFranchises.length > 0) {
      throw new BadRequestException(
        `Franchises with IDs ${notFoundFranchises.join(', ')} do not exist`,
      );
    }

    const conflictingFranchises = existingFranchises.filter(
      (franchise) => franchise.owner && franchise.owner.id !== excludeUserId,
    );

    if (conflictingFranchises.length > 0) {
      const conflictDetails = conflictingFranchises.map(
        (franchise) =>
          `Franchise "${franchise.name}" (ID: ${franchise.id}) is already owned by ${franchise?.owner?.name} (${franchise?.owner?.email})`,
      );

      throw new ConflictException({
        message:
          'One or more franchises are already owned by other franchisors',
        conflicts: conflictDetails,
        takenFranchises: conflictingFranchises.map((f) => f.id),
      });
    }
  }

  async updateFranchisor(id: string, data: UpdateFranchisorUserDto) {
    const franchisor = await this.prisma.user.findUnique({
      where: { id, role: Role.FRANCHISOR },
    });

    if (!franchisor) {
      throw new NotFoundException('Franchisor not found');
    }

    if (data.ownedFranchises) {
      await this.validateFranchiseAvailability(data.ownedFranchises, id);
    }

    const updatedFranchisor = await this.prisma.$transaction(async (tx) => {
      const { ownedFranchises, ...userData } = data;

      await tx.user.update({
        where: { id },
        data: userData,
      });

      if (ownedFranchises) {
        await tx.franchise.updateMany({
          where: { id: { in: ownedFranchises } },
          data: { ownerId: id },
        });
      }
    });

    return updatedFranchisor;
  }

  async findFranchisorsPaginated({
    page = 1,
    limit = 10,
    search = '',
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = { role: 'FRANCHISOR' };
    if (search && search.trim()) {
      const lower = search.toLowerCase();
      where.OR = [
        { name: { contains: lower } },
        { email: { contains: lower } },
      ];
    }
    const [data, total, totalActive, totalInactive] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          franchisorRequest: {
            select: {
              id: true,
              status: true,
              rejectionReason: true,
              reviewedBy: true,
              reviewedAt: true,
              createdAt: true,
              updatedAt: true,
              cnpj: true,
              streamName: true,
              commercialEmail: true,
              commercialPhone: true,
              cnpjCardPath: true,
              socialContractPath: true,
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          ownedFranchises: {
            select: {
              id: true,
              name: true,
              segment: true,
              subsegment: true,
              minimumInvestment: true,
              maximumInvestment: true,
              totalUnits: true,
              headquarterState: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { role: 'FRANCHISOR', isActive: true } }),
      this.prisma.user.count({
        where: { role: 'FRANCHISOR', isActive: false },
      }),
    ]);
    return {
      data,
      total,
      totalActive,
      totalInactive,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { cpf },
    });
  }

  async findByCnpj(cnpj: string): Promise<User | null> {
    const franchisorUser = await this.prisma.franchisorUser.findUnique({
      where: { cnpj },
      include: { user: true },
    });
    return franchisorUser ? franchisorUser.user : null;
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        role: Role.FRANCHISOR,
      },
      include: {
        franchisorRequest: {
          select: {
            id: true,
            status: true,
            rejectionReason: true,
            reviewedBy: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
            cnpj: true,
            streamName: true,
            commercialEmail: true,
            commercialPhone: true,
            cnpjCardPath: true,
            socialContractPath: true,
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        ownedFranchises: {
          select: {
            id: true,
            name: true,
            segment: true,
            subsegment: true,
            minimumInvestment: true,
            maximumInvestment: true,
            totalUnits: true,
            headquarterState: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
