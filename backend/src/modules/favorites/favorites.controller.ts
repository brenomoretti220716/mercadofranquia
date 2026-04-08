import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { JwtPayload } from '../auth/jwt.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FavoritesService } from './favorites.service';
import {
  PaginatedFavoritesQuerySchema,
  PaginatedFavoritesQueryType,
} from './schemas/favorite.schema';
import {
  FavoriteResponseDto,
  PaginatedFavoritesResponseDto,
  FavoriteIdsResponseDto,
  IsFavoritedResponseDto,
  ToggleFavoriteResponseDto,
  PaginatedFavoritesQueryDto,
} from './dto/favorite.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtGuard, RolesGuard)
@Roles(
  Role.FRANCHISOR,
  Role.ADMIN,
  Role.ENTHUSIAST,
  Role.FRANCHISEE,
  Role.CANDIDATE,
)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':franchiseId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add franchise to favorites' })
  @ApiParam({
    name: 'franchiseId',
    description: 'Franchise slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Franchise added to favorites successfully',
    type: FavoriteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot favorite inactive franchise',
  })
  async addFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('franchiseId') franchiseId: string,
  ) {
    const favorite = await this.favoritesService.addFavorite(
      user.id,
      franchiseId,
    );
    return {
      success: true,
      message: 'Franchise added to favorites',
      data: favorite,
    };
  }

  @Delete(':franchiseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove franchise from favorites' })
  @ApiParam({
    name: 'franchiseId',
    description: 'Franchise slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Franchise removed from favorites successfully',
  })
  async removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('franchiseId') franchiseId: string,
  ) {
    await this.favoritesService.removeFavorite(user.id, franchiseId);
    return {
      success: true,
      message: 'Franchise removed from favorites',
    };
  }

  @Post(':franchiseId/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle favorite status of a franchise' })
  @ApiParam({
    name: 'franchiseId',
    description: 'Franchise slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled successfully',
    type: ToggleFavoriteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  async toggleFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('franchiseId') franchiseId: string,
  ) {
    const result = await this.favoritesService.toggleFavorite(
      user.id,
      franchiseId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites with pagination' })
  @ApiQuery({ type: PaginatedFavoritesQueryDto })
  @ApiResponse({
    status: 200,
    description: 'User favorites retrieved successfully',
    type: PaginatedFavoritesResponseDto,
  })
  async getUserFavorites(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(PaginatedFavoritesQuerySchema))
    query: PaginatedFavoritesQueryType,
  ) {
    return await this.favoritesService.getUserFavorites(user.id, query);
  }

  @Get('check/:franchiseId')
  @ApiOperation({ summary: 'Check if franchise is favorited' })
  @ApiParam({ name: 'franchiseId', description: 'Franchise slug' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status checked successfully',
    type: IsFavoritedResponseDto,
  })
  async checkFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('franchiseId') franchiseId: string,
  ) {
    return await this.favoritesService.isFavorited(user.id, franchiseId);
  }

  @Get('ids')
  @ApiOperation({
    summary: 'Get all favorite franchise IDs for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite IDs retrieved successfully',
    type: FavoriteIdsResponseDto,
  })
  async getFavoriteIds(@CurrentUser() user: JwtPayload) {
    const franchiseIds = await this.favoritesService.getUserFavoriteIds(
      user.id,
    );
    return {
      franchiseIds,
    };
  }
}
