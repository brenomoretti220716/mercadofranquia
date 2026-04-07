import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { MulterFile } from '../../upload/dto/multer';
import {
  CreateBusinessModelDto,
  UpdateBusinessModelDto,
  BusinessModelResponseDto,
} from './schemas';

/**
 * Service for managing business models attached to franchises.
 * Only franchise owners (FRANCHISOR role) can create, update, and delete business models
 * for their own franchises.
 */
@Injectable()
export class BusinessModelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Creates a new business model for a franchise
   * Authorization: Only the franchise owner can create business models
   */
  async create(
    dto: CreateBusinessModelDto,
    photo: MulterFile,
    userId: string,
    userRole: Role,
  ): Promise<BusinessModelResponseDto> {
    // Verify franchise exists
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: dto.franchiseId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!franchise) {
      throw new NotFoundException('Franquia não encontrada');
    }

    // Authorization: Only franchise owner can add business models
    if (userRole !== Role.ADMIN && franchise.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar modelos de negócio a esta franquia',
      );
    }

    // Upload photo
    let photoUrl: string;
    try {
      photoUrl = await this.uploadService.uploadFile(
        photo,
        'franchises/business-models',
      );
    } catch (error) {
      console.error('Error uploading business model photo:', error);
      throw new BadRequestException('Erro ao fazer upload da foto');
    }

    // Create business model
    const businessModel = await this.prisma.businessModel.create({
      data: {
        name: dto.name,
        description: dto.description,
        photoUrl,
        franchiseId: dto.franchiseId,
      },
    });

    return businessModel;
  }

  /**
   * Get all business models for a specific franchise
   * Public endpoint - no authorization needed
   */
  async getByFranchiseId(
    franchiseId: string,
  ): Promise<BusinessModelResponseDto[]> {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
      select: { id: true },
    });

    if (!franchise) {
      throw new NotFoundException('Franquia não encontrada');
    }

    const businessModels = await this.prisma.businessModel.findMany({
      where: { franchiseId },
      orderBy: { createdAt: 'desc' },
    });

    return businessModels;
  }

  /**
   * Get a single business model by ID
   * Public endpoint - no authorization needed
   */
  async getById(id: string): Promise<BusinessModelResponseDto> {
    const businessModel = await this.prisma.businessModel.findUnique({
      where: { id },
      include: {
        franchise: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!businessModel) {
      throw new NotFoundException('Modelo de negócio não encontrado');
    }

    return businessModel;
  }

  /**
   * Updates an existing business model
   * Authorization: Only the franchise owner can update
   */
  async update(
    id: string,
    dto: UpdateBusinessModelDto,
    photo: MulterFile | undefined,
    userId: string,
    userRole: Role,
  ): Promise<BusinessModelResponseDto> {
    // Find business model with franchise info
    const businessModel = await this.prisma.businessModel.findUnique({
      where: { id },
      include: {
        franchise: {
          select: { id: true, ownerId: true, name: true },
        },
      },
    });

    if (!businessModel) {
      throw new NotFoundException('Modelo de negócio não encontrado');
    }

    // Authorization: Only franchise owner can update
    if (userRole !== Role.ADMIN && businessModel.franchise.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este modelo de negócio',
      );
    }

    // Handle photo update if provided
    let photoUrl = businessModel.photoUrl;
    if (photo) {
      try {
        // Delete old photo
        await this.uploadService.deleteFile(businessModel.photoUrl);

        // Upload new photo
        photoUrl = await this.uploadService.uploadFile(
          photo,
          'franchises/business-models',
        );
      } catch (error) {
        console.error('Error updating business model photo:', error);
        throw new BadRequestException('Erro ao atualizar a foto');
      }
    }

    // Update business model
    const updated = await this.prisma.businessModel.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        photoUrl,
      },
    });

    return updated;
  }

  /**
   * Deletes a business model and its associated photo
   * Authorization: Only the franchise owner can delete
   */
  async delete(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<{ message: string }> {
    // Find business model with franchise info
    const businessModel = await this.prisma.businessModel.findUnique({
      where: { id },
      include: {
        franchise: {
          select: { id: true, ownerId: true, name: true },
        },
      },
    });

    if (!businessModel) {
      throw new NotFoundException('Modelo de negócio não encontrado');
    }

    // Authorization: Only franchise owner can delete
    if (userRole !== Role.ADMIN && businessModel.franchise.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este modelo de negócio',
      );
    }

    // Delete photo from storage
    try {
      await this.uploadService.deleteFile(businessModel.photoUrl);
    } catch (error) {
      console.error('Error deleting business model photo:', error);
      // Continue with deletion even if photo deletion fails
    }

    // Delete business model from database
    await this.prisma.businessModel.delete({
      where: { id },
    });

    return {
      message: 'Modelo de negócio excluído com sucesso',
    };
  }

  /**
   * Verify if user has permission to manage business model
   * Helper method for authorization checks
   */
  async verifyPermission(
    businessModelId: string,
    userId: string,
    userRole: Role,
  ): Promise<boolean> {
    if (userRole === Role.ADMIN) {
      return true;
    }

    const businessModel = await this.prisma.businessModel.findUnique({
      where: { id: businessModelId },
      include: {
        franchise: {
          select: { ownerId: true },
        },
      },
    });

    if (!businessModel) {
      return false;
    }

    return businessModel.franchise.ownerId === userId;
  }
}
