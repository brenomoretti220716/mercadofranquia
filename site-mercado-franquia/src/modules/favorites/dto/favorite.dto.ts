import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({ description: 'Favorite ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Franchise ID' })
  franchiseId: string;

  @ApiProperty({ description: 'Date when franchise was favorited' })
  createdAt: Date;
}

export class FranchiseBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  logoUrl?: string | null;

  @ApiPropertyOptional()
  thumbnailUrl?: string | null;

  @ApiPropertyOptional()
  segment?: string | null;

  @ApiPropertyOptional()
  subsegment?: string | null;

  @ApiPropertyOptional()
  totalInvestmentNumeric?: number | null;

  @ApiPropertyOptional()
  averageMonthlyRevenueNumeric?: number | null;

  @ApiPropertyOptional()
  returnOnInvestmentNumeric?: number | null;

  @ApiPropertyOptional()
  averageRating?: number | null;

  @ApiProperty()
  reviewCount: number;

  @ApiPropertyOptional()
  totalUnits?: number | null;

  @ApiProperty()
  isActive: boolean;
}

export class FavoriteWithFranchiseDto extends FavoriteResponseDto {
  @ApiProperty({ type: FranchiseBasicDto })
  franchise: FranchiseBasicDto;
}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedFavoritesResponseDto {
  @ApiProperty({ type: [FavoriteWithFranchiseDto] })
  data: FavoriteWithFranchiseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class FavoriteIdsResponseDto {
  @ApiProperty({
    type: [String],
    description: 'Array of favorited franchise IDs',
  })
  franchiseIds: string[];
}

export class IsFavoritedResponseDto {
  @ApiProperty({
    description: 'Whether the franchise is favorited by the user',
  })
  isFavorited: boolean;
}

export class ToggleFavoriteResponseDto {
  @ApiProperty({ description: 'Whether the franchise is now favorited' })
  isFavorited: boolean;

  @ApiProperty({ description: 'Action message' })
  message: string;
}

export class PaginatedFavoritesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  limit?: number;

  @ApiPropertyOptional({ enum: ['createdAt', 'name'], default: 'createdAt' })
  sortBy?: 'createdAt' | 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Search by franchise name' })
  search?: string;
}
