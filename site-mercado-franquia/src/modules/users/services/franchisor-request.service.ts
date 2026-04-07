import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FranchisorRequestStatus, Prisma, Role } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  ApproveRequestDto,
  RejectRequestDto,
  StepThreeDto,
  UpdateRequestDto,
} from '../schemas/franchisor-request.schema';

@Injectable()
export class FranchisorRequestService {
  private readonly uploadDir = 'uploads/franchisor-documents';
  private readonly cnpjCardDir = path.join(this.uploadDir, 'cnpj-cards');
  private readonly socialContractDir = path.join(
    this.uploadDir,
    'social-contracts',
  );

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {
    void this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories() {
    await fs.mkdir(this.cnpjCardDir, { recursive: true });
    await fs.mkdir(this.socialContractDir, { recursive: true });
  }

  async createRequest(
    userId: string,
    data: StepThreeDto,
    files: {
      cnpjCard: Express.Multer.File;
      socialContract: Express.Multer.File;
    },
  ) {
    const existingRequest = await this.prisma.franchisorRequest.findUnique({
      where: { userId },
    });

    if (existingRequest) {
      throw new ConflictException('You already have a pending request');
    }

    const existingCnpj = await this.prisma.franchisorRequest.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existingCnpj) {
      throw new ConflictException('CNPJ already in use');
    }

    const cnpjCardPath = await this.saveFile(
      files.cnpjCard,
      'cnpjCard',
      userId,
    );
    const socialContractPath = await this.saveFile(
      files.socialContract,
      'socialContract',
      userId,
    );

    const request = await this.prisma.franchisorRequest.create({
      data: {
        userId,
        streamName: data.streamName,
        cnpj: data.cnpj,
        cnpjCardPath,
        socialContractPath,
        responsable: data.responsable,
        responsableRole: data.responsableRole,
        commercialEmail: data.commercialEmail,
        commercialPhone: data.commercialPhone,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification to all admin users
    try {
      const adminUsers = await this.prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: { id: true },
      });
      const adminIds = adminUsers.map((admin) => admin.id);

      if (adminIds.length > 0) {
        await this.notificationsService.notifyFranchisorRequest(
          adminIds,
          request.user.name,
        );
      }
    } catch (error) {
      console.error('Failed to send franchisor request notifications:', error);
    }

    return request;
  }

  async updateRequest(
    userId: string,
    data: UpdateRequestDto,
    files?: {
      cnpjCard?: Express.Multer.File;
      socialContract?: Express.Multer.File;
    },
  ) {
    try {
      const existingRequest = await this.prisma.franchisorRequest.findUnique({
        where: { userId },
      });

      if (!existingRequest) {
        throw new NotFoundException('Request not found');
        console.log('Request not found');
      }

      const updateData: Prisma.FranchisorRequestUpdateInput = {};

      if (data.streamName) updateData.streamName = data.streamName;
      if (data.cnpj) {
        const existingCnpj = await this.prisma.franchisorRequest.findUnique({
          where: { cnpj: data.cnpj },
        });
        if (existingCnpj && existingCnpj.userId !== userId) {
          throw new ConflictException('CNPJ already in use');
        }
        updateData.cnpj = data.cnpj;
      }
      if (data.responsable) updateData.responsable = data.responsable;
      if (data.responsableRole)
        updateData.responsableRole = data.responsableRole;
      if (data.commercialEmail)
        updateData.commercialEmail = data.commercialEmail;
      if (data.commercialPhone)
        updateData.commercialPhone = data.commercialPhone;

      if (files?.cnpjCard) {
        await this.deleteFile(existingRequest.cnpjCardPath);
        updateData.cnpjCardPath = await this.saveFile(
          files.cnpjCard,
          'cnpjCard',
          userId,
        );
        console.log('CNPJ card updated');
      }

      if (files?.socialContract) {
        await this.deleteFile(existingRequest.socialContractPath);
        updateData.socialContractPath = await this.saveFile(
          files.socialContract,
          'socialContract',
          userId,
        );
        console.log('Social contract updated');
      }

      const updated = await this.prisma.franchisorRequest.update({
        where: { userId },
        data: { ...updateData, status: FranchisorRequestStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log('Request updated');

      return updated;
    } catch (error) {
      console.error('Error updating request:', error);
      throw new Error('Failed to update request');
    }
  }

  async getMyRequest(userId: string) {
    const request = await this.prisma.franchisorRequest.findUnique({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return request;
  }

  async deleteRequest(userId: string) {
    const request = await this.prisma.franchisorRequest.findUnique({
      where: { userId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== FranchisorRequestStatus.PENDING) {
      throw new BadRequestException(
        'Cannot delete a request that has been reviewed',
      );
    }

    await this.deleteFile(request.cnpjCardPath);
    await this.deleteFile(request.socialContractPath);

    await this.prisma.franchisorRequest.delete({
      where: { userId },
    });

    return { message: 'Request deleted successfully' };
  }

  async getPendingRequests(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where: Prisma.FranchisorRequestWhereInput = {
      status: FranchisorRequestStatus.PENDING,
    };

    if (search && search.trim()) {
      where.OR = [
        { user: { name: { contains: search.toLowerCase() } } },
        { user: { email: { contains: search.toLowerCase() } } },
        { cnpj: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.franchisorRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              cpf: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.franchisorRequest.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAllRequests(
    page = 1,
    limit = 10,
    status?: FranchisorRequestStatus,
    search = '',
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.FranchisorRequestWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { user: { name: { contains: search.toLowerCase() } } },
        { user: { email: { contains: search.toLowerCase() } } },
        { cnpj: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.franchisorRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              cpf: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.franchisorRequest.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getRequestById(requestId: string) {
    const request = await this.prisma.franchisorRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
            createdAt: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async approveRequest(
    requestId: string,
    adminId: string,
    data: ApproveRequestDto,
  ) {
    const request = await this.prisma.franchisorRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== FranchisorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    const franchiseIds = data.ownedFranchises;
    const existingFranchises = await this.prisma.franchise.findMany({
      where: { id: { in: franchiseIds } },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existingFranchises.length !== franchiseIds.length) {
      throw new BadRequestException('One or more franchises do not exist');
    }

    const ownedFranchises = existingFranchises.filter((f) => f.owner !== null);
    if (ownedFranchises.length > 0) {
      throw new ConflictException(
        'Uma ou mais franquias selecionadas já estão vinculadas a outro franqueador. Atualize a lista e tente novamente.',
      );
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.franchisorRequest.update({
        where: { id: requestId },
        data: {
          status: FranchisorRequestStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.franchisorUser.create({
        data: {
          userId: request.userId,
          streamName: request.streamName,
          cnpj: request.cnpj,
          cnpjCardPath: request.cnpjCardPath,
          socialContractPath: request.socialContractPath,
          responsable: request.responsable,
          responsableRole: request.responsableRole,
          commercialEmail: request.commercialEmail,
          commercialPhone: request.commercialPhone,
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: { role: Role.FRANCHISOR },
      });

      await tx.franchise.updateMany({
        where: { id: { in: franchiseIds } },
        data: { ownerId: request.userId },
      });
    });

    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: { name: true, email: true },
    });

    if (user) {
      try {
        await this.emailService.sendUserUpdateNotification({
          userEmail: user.email,
          userName: user.name,
        });
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }

      // Send notification to the user
      try {
        await this.notificationsService.notifyRequestApproved(
          request.userId,
          user.name,
        );
      } catch (error) {
        console.error('Failed to send approval notification:', error);
      }
    }
    return { message: 'Request approved successfully' };
  }

  async rejectRequest(
    requestId: string,
    adminId: string,
    data: RejectRequestDto,
  ) {
    const request = await this.prisma.franchisorRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== FranchisorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    await this.prisma.franchisorRequest.update({
      where: { id: requestId },
      data: {
        status: FranchisorRequestStatus.REJECTED,
        rejectionReason: data.rejectionReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: { name: true, email: true },
    });

    if (user) {
      try {
        await this.emailService.sendUserUpdateNotification({
          userEmail: user.email,
          userName: user.name,
        });
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }

      // Send notification to the user
      try {
        await this.notificationsService.notifyRequestRejected(
          request.userId,
          user.name,
          data.rejectionReason,
        );
      } catch (error) {
        console.error('Failed to send rejection notification:', error);
      }
    }

    return { message: 'Request rejected successfully' };
  }

  private async saveFile(
    file: Express.Multer.File,
    type: 'cnpjCard' | 'socialContract',
    userId: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${extension}`;
    const directory =
      type === 'cnpjCard' ? this.cnpjCardDir : this.socialContractDir;
    const filePath = path.join(directory, filename);

    await fs.writeFile(filePath, file.buffer);

    return filePath;
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }
}
