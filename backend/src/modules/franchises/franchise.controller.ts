import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt.service';
import { FranchiseService } from './franchise.service';
import { FranchiseOptionsType } from './schemas/franchise-options.schema';
import { updateSponsorPlacementsSchema } from './schemas/sponsor-placements.schema';
import {
  FranchisorUpdateFranchiseType,
  FranchisorUpdateSchema,
} from './schemas/update-franchise.schema';
import { parseQueryToFilters } from './utils/controller-params.util';

@ApiTags('franchises')
@Controller('franchises')
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of franchises' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'segment',
    required: false,
    type: String,
    description: 'Filter by segment (case-insensitive partial match)',
  })
  @ApiResponse({
    status: 200,
    description: 'Franchises retrieved successfully',
  })
  async getFranchise(@Query() query: Record<string, any>) {
    const filters = parseQueryToFilters(query);
    return await this.franchiseService.getFranchisesPaginated(filters);
  }

  @Get('admin/all')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all franchises (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'segment',
    required: false,
    type: String,
    description: 'Filter by segment (case-insensitive partial match)',
  })
  @ApiResponse({
    status: 200,
    description: 'All franchises retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAllFranchisesForAdmin(@Query() query: Record<string, any>) {
    try {
      const filters = parseQueryToFilters(query);
      const result = await this.franchiseService.getAllFranchisesPaginated({
        ...filters,
        isAdmin: true,
      });
      return result;
    } catch (error: any) {
      console.error('Error fetching franchises (admin):', error);
      throw new HttpException(
        'Failed to fetch franchises (admin)',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle franchise active status (admin only)' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiBody({
    schema: { type: 'object', properties: { isActive: { type: 'boolean' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Franchise status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async toggleFranchiseStatus(
    @Param('id') franchiseId: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const result = await this.franchiseService.toggleFranchiseStatus(
        franchiseId,
        isActive,
        user.role,
      );
      return result;
    } catch (error) {
      console.error(
        `Error toggling franchise status for id ${franchiseId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      switch (errorMessage) {
        case 'Franchise not found':
          throw new HttpException('Franchise not found', HttpStatus.NOT_FOUND);
        case 'Only administrators can change franchise status':
          throw new HttpException(
            'Only administrators can change franchise status',
            HttpStatus.FORBIDDEN,
          );
        case 'Franchise ID is required':
          throw new HttpException(
            'Franchise ID is required',
            HttpStatus.BAD_REQUEST,
          );
        default:
          throw new HttpException(
            'Failed to toggle franchise status',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Patch(':id/toggle-review')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle franchise review status (admin only)' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiBody({
    schema: { type: 'object', properties: { isReview: { type: 'boolean' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Franchise review status toggled successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async toggleFranchiseReview(
    @Param('id') franchiseId: string,
    @Body('isReview') isReview: boolean,
  ) {
    return this.franchiseService.toggleFranchiseReview(franchiseId, isReview);
  }

  @Patch(':id/toggle-sponsored')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle franchise sponsored status (admin only)' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { isSponsored: { type: 'boolean' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Franchise sponsored status toggled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Maximum number of sponsored franchises (5) reached',
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async toggleFranchiseSponsored(
    @Param('id') franchiseId: string,
    @Body('isSponsored') isSponsored: boolean,
  ): Promise<{ data: unknown; message: string }> {
    return await this.franchiseService.toggleFranchiseSponsored(
      franchiseId,
      isSponsored,
    );
  }

  @Patch(':id/sponsor-placements')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update sponsor placements for a franchise' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        placements: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['HOME_DESTAQUES', 'RANKING_CATEGORIA', 'QUIZ'],
          },
        },
      },
      required: ['placements'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sponsor placements updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateSponsorPlacements(
    @Param('id') franchiseId: string,
    @Body() body: unknown,
  ) {
    const parsed = updateSponsorPlacementsSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return await this.franchiseService.updateSponsorPlacements(
      franchiseId,
      parsed.data.placements,
    );
  }

  @Get('franchisor/:franchisorId')
  @UseGuards(JwtGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get franchises by franchisor ID' })
  @ApiParam({ name: 'franchisorId', description: 'Franchisor ID' })
  @ApiResponse({
    status: 200,
    description: 'Franchises retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only access own franchises',
  })
  @ApiResponse({ status: 404, description: 'Franchisor not found' })
  async getFranchisesByFranchisor(
    @Param('franchisorId') franchisorId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      if (user.role !== Role.ADMIN && user.id !== franchisorId) {
        throw new HttpException(
          'You can only access your own franchises',
          HttpStatus.FORBIDDEN,
        );
      }
      const franchises =
        await this.franchiseService.getFranchisesByFranchisor(franchisorId);
      return {
        data: franchises,
        total: franchises.length,
        franchisorId: franchisorId,
      };
    } catch (error) {
      console.error(
        `Error fetching franchises for franchisor ${franchisorId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      switch (errorMessage) {
        case 'Franchisor not found':
          throw new HttpException('Franchisor not found', HttpStatus.NOT_FOUND);
        case 'No franchises found for this franchisor':
          throw new HttpException(
            'No franchises found for this franchisor',
            HttpStatus.NOT_FOUND,
          );
        default:
          throw new HttpException(
            'Failed to fetch franchises',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get('options')
  @ApiOperation({ summary: 'Get franchise options (id and name only)' })
  @ApiQuery({
    name: 'availableOnly',
    required: false,
    type: Boolean,
    description:
      'When true, returns only active franchises with no owner (unassigned)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description:
      'When provided with availableOnly=true, includes franchises owned by this user along with available franchises',
  })
  @ApiResponse({
    status: 200,
    description: 'Franchise options retrieved successfully',
  })
  async getFranchisesOptions(
    @Query('availableOnly') availableOnly?: string,
    @Query('userId') userId?: string,
  ): Promise<FranchiseOptionsType[]> {
    try {
      const onlyAvailable =
        availableOnly === 'true' ||
        availableOnly === '1' ||
        availableOnly === 'yes';

      let franchises: FranchiseOptionsType[];
      if (onlyAvailable && userId) {
        // Get available franchises + franchises owned by the specified user
        franchises =
          await this.franchiseService.getFranchisesNamesWithUserFilter(userId);
      } else if (onlyAvailable) {
        // Get only available franchises
        franchises = await this.franchiseService.getAvailableFranchisesNames();
      } else {
        // Get all active franchises
        franchises = await this.franchiseService.getFranchisesNames();
      }

      // Retorna apenas id e nome
      return franchises.map((franchise) => ({
        id: franchise.id,
        name: franchise.name,
      }));
    } catch (error) {
      console.error('Error fetching franchise options:', error);
      throw new HttpException(
        'Failed to fetch franchise options',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get franchise by ID' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiResponse({
    status: 200,
    description: 'Franchise retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  async getFranchiseById(@Param('id') id: string) {
    try {
      const franchise = await this.franchiseService.getFranchiseById(id);
      if (!franchise) {
        throw new HttpException('Franchise not found', HttpStatus.NOT_FOUND);
      }
      return { data: franchise };
    } catch (error) {
      console.error(`Error fetching franchise with id ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch franchise',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':slug/ranking')
  @ApiOperation({ summary: 'Get franchise ranking data' })
  @ApiParam({ name: 'slug', description: 'Franchise slug' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'segment',
    required: false,
    type: String,
    description: 'Filter by segment (case-insensitive partial match)',
  })
  @ApiResponse({
    status: 200,
    description: 'Franchise ranking retrieved successfully',
  })
  async getFranchiseByIdSortByDesc(
    @Param('slug') slug: string,
    @Query() query: Record<string, any>,
  ) {
    try {
      const filters = parseQueryToFilters(query);
      const franchise = await this.franchiseService.getFranchiseRanking(
        slug,
        filters,
      );
      return { data: franchise };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `Error fetching franchise ranking data for slug ${slug}:`,
        error,
      );
      throw new HttpException(
        'Failed to fetch franchise ranking data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('franchisor/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnailUrl'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update franchise (franchisor only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiResponse({
    status: 200,
    description: 'Franchise updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Franchisor only' })
  async franchisorUpdateFranchise(
    @Param('id') franchiseId: string,
    @Body(new ZodValidationPipe(FranchisorUpdateSchema))
    updateData: FranchisorUpdateFranchiseType,
    @UploadedFile() photo: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    const franchisorId = user.id;
    return this.franchiseService.franchisorUpdateFranchise(
      franchiseId,
      {
        ...updateData,
        photo,
      },
      franchisorId,
      user.role,
    );
  }

  @Post(':id/gallery')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @UseInterceptors(FilesInterceptor('galleryImages', 10))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add gallery images (franchisor only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiResponse({
    status: 200,
    description: 'Gallery images added successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Franchisor only' })
  async addGalleryImages(
    @Param('id') franchiseId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload,
  ) {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    const franchisorId = user.id;
    return this.franchiseService.addGalleryImages(
      franchiseId,
      files,
      franchisorId,
      user.role,
    );
  }

  @Delete(':id/gallery')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gallery image (franchisor only)' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { imageUrl: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Gallery image deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Franchisor only' })
  async deleteGalleryImage(
    @Param('id') franchiseId: string,
    @Body('imageUrl') imageUrl: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!imageUrl) {
      throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
    }

    const franchisorId = user.id;
    return this.franchiseService.deleteGalleryImage(
      franchiseId,
      imageUrl,
      franchisorId,
      user.role,
    );
  }

  @Delete(':id/video')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a video from franchise (franchisor only)' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { videoUrl: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Franchisor only' })
  async deleteVideo(
    @Param('id') franchiseId: string,
    @Body('videoUrl') videoUrl: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!videoUrl) {
      throw new HttpException('Video URL is required', HttpStatus.BAD_REQUEST);
    }

    const franchisorId = user.id;
    return this.franchiseService.deleteVideo(
      franchiseId,
      videoUrl,
      franchisorId,
      user.role,
    );
  }

  @Patch(':id/logo')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.FRANCHISOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('logoUrl'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update franchise logo (franchisor only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiResponse({
    status: 200,
    description: 'Logo updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Franchisor only' })
  @ApiResponse({ status: 400, description: 'No file uploaded' })
  async updateFranchiseLogo(
    @Param('id') franchiseId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const franchisorId = user.id;
    return this.franchiseService.updateFranchiseLogo(
      franchiseId,
      file,
      franchisorId,
      user.role,
    );
  }
}
