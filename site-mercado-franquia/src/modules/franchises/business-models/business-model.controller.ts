import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { MulterFile } from '../../upload/dto/multer';
import { BusinessModelService } from './business-model.service';
import {
  createBusinessModelSchema,
  CreateBusinessModelDto,
  updateBusinessModelSchema,
  UpdateBusinessModelDto,
} from './schemas';
import * as fs from 'fs/promises';

/**
 * Controller for Business Model operations
 * Manages CRUD operations for business models attached to franchises
 *
 * Authorization:
 * - Create, Update, Delete: Only franchise owner (FRANCHISOR) or ADMIN
 * - Get operations: Public (no authentication required)
 */
@ApiTags('business-models')
@Controller('business-models')
export class BusinessModelController {
  constructor(private readonly businessModelService: BusinessModelService) {}

  /**
   * Validate if file is a valid Multer file
   */
  private isValidMulterFile(file: unknown): file is Express.Multer.File {
    return (
      file !== null &&
      file !== undefined &&
      typeof file === 'object' &&
      'fieldname' in file &&
      'originalname' in file &&
      'mimetype' in file
    );
  }

  /**
   * Create a new business model
   * POST /business-models
   *
   * Requires: FRANCHISOR or ADMIN role
   * Body: { franchiseId, name, description }
   * File: photo (multipart/form-data)
   */
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Create a new business model' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Business model created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @UploadedFile() file: unknown,
    @Body(new ZodValidationPipe(createBusinessModelSchema))
    createDto: CreateBusinessModelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Validate file
    if (!this.isValidMulterFile(file)) {
      throw new BadRequestException('Foto é obrigatória');
    }

    try {
      // Handle file buffer
      let buffer: Buffer;
      if ('path' in file && file.path) {
        // File was saved to disk, read it
        buffer = await fs.readFile(file.path);
        // Delete temporary file
        await fs.unlink(file.path).catch(() => {
          // Ignore error if file doesn't exist
        });
      } else if ('buffer' in file && file.buffer) {
        buffer = file.buffer;
      } else {
        throw new BadRequestException('Arquivo inválido');
      }

      // Convert to MulterFile format
      const multerFile: MulterFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: buffer,
      };

      return await this.businessModelService.create(
        createDto,
        multerFile,
        user.id,
        user.role,
      );
    } catch (error) {
      console.error('Error in create business model:', error);
      throw new BadRequestException('Erro ao processar arquivo');
    }
  }

  /**
   * Get all business models for a specific franchise
   * GET /business-models/franchise/:franchiseId
   *
   * Public endpoint - no authentication required
   */
  @Get('franchise/:franchiseId')
  @ApiOperation({ summary: 'Get all business models for a franchise' })
  @ApiResponse({
    status: 200,
    description: 'Business models fetched successfully',
  })
  async getByFranchiseId(@Param('franchiseId') franchiseId: string) {
    return await this.businessModelService.getByFranchiseId(franchiseId);
  }

  /**
   * Get a single business model by ID
   * GET /business-models/:id
   *
   * Public endpoint - no authentication required
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a business model by ID' })
  @ApiResponse({ status: 200, description: 'Business model fetched successfully' })
  @ApiResponse({ status: 404, description: 'Business model not found' })
  async getById(@Param('id') id: string) {
    return await this.businessModelService.getById(id);
  }

  /**
   * Update a business model
   * PUT /business-models/:id
   *
   * Requires: FRANCHISOR (owner) or ADMIN role
   * Body: { name?, description? } (all optional)
   * File: photo (optional - multipart/form-data)
   */
  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Update a business model' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Business model updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business model not found' })
  async update(
    @Param('id') id: string,
    @UploadedFile() file: unknown,
    @Body(new ZodValidationPipe(updateBusinessModelSchema))
    updateDto: UpdateBusinessModelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Photo is optional for updates
    let multerFile: MulterFile | undefined;

    if (this.isValidMulterFile(file)) {
      try {
        // Handle file buffer
        let buffer: Buffer;
        if ('path' in file && file.path) {
          buffer = await fs.readFile(file.path);
          await fs.unlink(file.path).catch(() => {
            // Ignore error
          });
        } else if ('buffer' in file && file.buffer) {
          buffer = file.buffer;
        } else {
          throw new BadRequestException('Arquivo inválido');
        }

        multerFile = {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          buffer: buffer,
        };
      } catch (error) {
        console.error('Error processing file:', error);
        throw new BadRequestException('Erro ao processar arquivo');
      }
    }

    return await this.businessModelService.update(
      id,
      updateDto,
      multerFile,
      user.id,
      user.role,
    );
  }

  /**
   * Delete a business model
   * DELETE /business-models/:id
   *
   * Requires: FRANCHISOR (owner) or ADMIN role
   * Also deletes the associated photo from storage
   */
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a business model' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Business model deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business model not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.businessModelService.delete(id, user.id, user.role);
  }
}
