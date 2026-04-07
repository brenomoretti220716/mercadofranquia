import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtPayload } from '../../auth/jwt.service';
import { ReviewResponseService } from './review-response.service';
import {
  createReviewResponseSchema,
  CreateReviewResponseType,
} from './schemas/create-review-response.schema';
import {
  updateReviewResponseSchema,
  UpdateReviewResponseType,
} from './schemas/update-review-response.schema';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('review-responses')
@Controller('reviews')
export class ReviewResponseController {
  constructor(private readonly reviewResponseService: ReviewResponseService) {}

  @Post(':reviewId/responses')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FRANCHISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create response to a review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID', type: Number })
  @ApiResponse({ status: 201, description: 'Response created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Franchisor only',
  })
  async createResponse(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body(new ZodValidationPipe(createReviewResponseSchema))
    createDto: CreateReviewResponseType,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewResponseService.create(
      reviewId,
      createDto,
      user.id,
      user.role,
    );
  }

  @Put('responses/:responseId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FRANCHISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review response' })
  @ApiParam({ name: 'responseId', description: 'Response ID', type: Number })
  @ApiResponse({ status: 200, description: 'Response updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Franchisor only',
  })
  async updateResponse(
    @Param('responseId', ParseIntPipe) responseId: number,
    @Body(new ZodValidationPipe(updateReviewResponseSchema))
    updateDto: UpdateReviewResponseType,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewResponseService.update(
      responseId,
      updateDto,
      user.id,
      user.role,
    );
  }

  @Delete('responses/:responseId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FRANCHISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review response' })
  @ApiParam({ name: 'responseId', description: 'Response ID', type: Number })
  @ApiResponse({ status: 200, description: 'Response deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Franchisor only',
  })
  async deleteResponse(
    @Param('responseId', ParseIntPipe) responseId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewResponseService.delete(responseId, user.id, user.role);
  }

  @Get(':reviewId/responses')
  @ApiOperation({ summary: 'Get responses for a review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID', type: Number })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  async getResponsesByReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    return this.reviewResponseService.findByReviewId(reviewId);
  }
}
