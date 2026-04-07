import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtPayload } from 'src/modules/auth/jwt.service';
import { NewsCommentService } from './news-comment.service';
import {
    createNewsCommentSchema,
    CreateNewsCommentType,
} from './schemas/create-news-comment.schema';

@ApiTags('news-comments')
@Controller('news')
export class NewsCommentController {
  constructor(private readonly newsCommentService: NewsCommentService) {}

  @Post(':newsId/comments')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create comment on news article' })
  @ApiParam({ name: 'newsId', description: 'News ID', type: String })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'News not found' })
  async createComment(
    @Param('newsId') newsId: string,
    @Body(new ZodValidationPipe(createNewsCommentSchema))
    createDto: CreateNewsCommentType,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.newsCommentService.create(newsId, createDto, user.id);
  }

  @Get(':newsId/comments')
  @ApiOperation({ summary: 'Get comments for a news article' })
  @ApiParam({ name: 'newsId', description: 'News ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
  })
  async getCommentsByNews(@Param('newsId') newsId: string) {
    return this.newsCommentService.findByNewsId(newsId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete news comment (admin only)' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.newsCommentService.delete(commentId, user.id, user.role);
  }
}


