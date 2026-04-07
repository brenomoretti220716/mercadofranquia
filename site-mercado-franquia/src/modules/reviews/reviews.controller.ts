import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/jwt.service';
import { ReviewService } from './reviews.service';
import {
  createReviewSchema,
  CreateReviewType,
} from './schemas/create-review.schema';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtGuard)
  @Post(':franchiseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create review for a franchise' })
  @ApiParam({ name: 'franchiseId', description: 'Franchise slug' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(
    @Param('franchiseId') franchiseId: string,
    @Body(new ZodValidationPipe(createReviewSchema))
    reviewData: CreateReviewType,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reviewService.createReview(
      franchiseId,
      user.id,
      reviewData,
    );
  }

  @Get('franchise/:franchiseId')
  @ApiOperation({ summary: 'Get reviews by franchise slug (paginated, newest first)' })
  @ApiParam({ name: 'franchiseId', description: 'Franchise slug' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getReviewsByFranchise(
    @Param('franchiseId') franchiseId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '4',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 4;

      const result = await this.reviewService.findByFranchiseId(
        franchiseId,
        pageNum,
        limitNum,
      );

      return result;
    } catch (error) {
      console.error(
        `Error fetching reviews for franchise ${franchiseId}:`,
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

        case 'Franchise ID is required':
          throw new HttpException(
            'Franchise ID is required',
            HttpStatus.BAD_REQUEST,
          );

        default:
          throw new HttpException(
            'Failed to fetch reviews',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get('admin/franchise/:franchiseId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reviews by franchise ID (admin only)' })
  @ApiParam({ name: 'franchiseId', description: 'Franchise ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getReviewsByFranchiseForAdmin(
    @Param('franchiseId') franchiseId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      const result = await this.reviewService.findByFranchiseIdForAdmin(
        franchiseId,
        pageNum,
        limitNum,
        user.role,
      );
      return result;
    } catch (error) {
      console.error(
        `Error fetching reviews for franchise ${franchiseId} (admin):`,
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

        case 'Franchise ID is required':
          throw new HttpException(
            'Franchise ID is required',
            HttpStatus.BAD_REQUEST,
          );

        case 'Only administrators can view all reviews':
          throw new HttpException(
            'Only administrators can view all reviews',
            HttpStatus.FORBIDDEN,
          );

        default:
          throw new HttpException(
            'Failed to fetch reviews',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get('user/my-reviews')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['review', 'response'] })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getMyReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: string = 'review',
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const sortByValue =
        sortBy === 'response' ? ('response' as const) : ('review' as const);

      const result = await this.reviewService.findByUserId(
        user.id,
        pageNum,
        limitNum,
        sortByValue,
      );
      return result;
    } catch (error: unknown) {
      console.error(`Error fetching reviews for user ${user.id}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      switch (errorMessage) {
        case 'User not found':
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        case 'User ID is required':
          throw new HttpException(
            'User ID is required',
            HttpStatus.BAD_REQUEST,
          );

        default:
          throw new HttpException(
            'Failed to fetch reviews',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  async getReviewById(@Param('id', ParseIntPipe) id: number) {
    try {
      const review = await this.reviewService.findById(id);
      return { data: review };
    } catch (error) {
      console.error(`Error fetching review with id ${id}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getAllReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      const result = await this.reviewService.findAll(pageNum, limitNum);
      return result;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new HttpException(
        'Failed to fetch reviews',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('franchise/:franchiseId/stats')
  @ApiOperation({ summary: 'Get review statistics for a franchise' })
  @ApiParam({ name: 'franchiseId', description: 'Franchise slug' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getReviewStats(@Param('franchiseId') franchiseId: string) {
    try {
      const stats = await this.reviewService.getReviewStats(franchiseId);
      return { data: stats };
    } catch (error) {
      console.error(
        `Error fetching review stats for franchise ${franchiseId}:`,
        error,
      );
      throw new HttpException(
        'Failed to fetch review statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle review status (admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID', type: Number })
  @ApiBody({
    schema: { type: 'object', properties: { isActive: { type: 'boolean' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Review status toggled successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async toggleReviewStatus(
    @Param('id', ParseIntPipe) reviewId: number,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const result = await this.reviewService.toggleReviewStatus(
        reviewId,
        isActive,
        user.role,
      );

      return result;
    } catch (error) {
      console.error(`Error toggling review status for id ${reviewId}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      switch (errorMessage) {
        case 'Review not found':
          throw new HttpException('Review not found', HttpStatus.NOT_FOUND);

        case 'Only administrators can change review status':
          throw new HttpException(
            'Only administrators can change review status',
            HttpStatus.FORBIDDEN,
          );

        default:
          throw new HttpException(
            'Failed to toggle review status',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }
  }
}
