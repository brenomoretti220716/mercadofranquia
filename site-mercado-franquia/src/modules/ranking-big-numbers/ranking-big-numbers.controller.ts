import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RankingBigNumbersService } from './ranking-big-numbers.service';
import {
  createRankingBigNumberSchema,
  CreateRankingBigNumberType,
} from './schemas/create-ranking-big-numbers.schema';
import {
  reorderRankingBigNumbersSchema,
  ReorderRankingBigNumbersType,
} from './schemas/reorder-ranking-big-numbers-cards.schema';
import {
  bulkCreateRankingBigNumbersSchema,
  BulkCreateRankingBigNumbersType,
} from './schemas/bulk-create-ranking-big-numbers.schema';
import {
  updateRankingBigNumberSchema,
  UpdateRankingBigNumberType,
} from './schemas/update-ranking-big-numbers.schema';
import {
  setYearVisibilitySchema,
  SetYearVisibilityType,
} from './schemas/set-year-visibility.schema';

@ApiTags('ranking-big-numbers')
@Controller('ranking-big-numbers')
export class RankingBigNumbersController {
  constructor(
    private readonly rankingBigNumbersService: RankingBigNumbersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get ranking big number cards (public)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Cards fetched successfully' })
  async findAll(@Query('year') year?: string) {
    const selectedYear = year ? Number(year) : undefined;
    return await this.rankingBigNumbersService.findAll(selectedYear);
  }

  @Get('years')
  @ApiOperation({ summary: 'Get available years for big numbers (public)' })
  @ApiResponse({ status: 200, description: 'Available years fetched successfully' })
  async findAvailableYears() {
    return await this.rankingBigNumbersService.findAvailableYears();
  }

  @Get('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ranking big number cards (admin)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Admin cards fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllAdmin(@Query('year') year?: string) {
    const selectedYear = year ? Number(year) : undefined;
    return await this.rankingBigNumbersService.findAllAdmin(selectedYear);
  }

  @Post('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ranking big number card (admin only)' })
  @ApiResponse({ status: 201, description: 'Card created successfully' })
  async create(
    @Body(new ZodValidationPipe(createRankingBigNumberSchema))
    body: CreateRankingBigNumberType,
  ) {
    return await this.rankingBigNumbersService.create(body);
  }

  @Post('admin/bulk')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk create ranking big numbers cards (admin only)',
  })
  @ApiResponse({ status: 201, description: 'Cards created successfully' })
  async bulkCreate(
    @Body(new ZodValidationPipe(bulkCreateRankingBigNumbersSchema))
    body: BulkCreateRankingBigNumbersType,
  ) {
    return await this.rankingBigNumbersService.bulkCreate(body);
  }

  @Patch('admin/year/visibility')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set year visibility (hide/unhide)' })
  @ApiResponse({ status: 200, description: 'Visibility updated successfully' })
  async setYearVisibility(
    @Body(new ZodValidationPipe(setYearVisibilitySchema))
    body: SetYearVisibilityType,
  ) {
    return await this.rankingBigNumbersService.setYearVisibility(body);
  }

  @Patch('admin/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ranking big number card (admin only)' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRankingBigNumberSchema))
    body: UpdateRankingBigNumberType,
  ) {
    return await this.rankingBigNumbersService.update(id, body);
  }

  @Put('admin/reorder')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder Top1, Top2, Top3 and Worst cards' })
  @ApiResponse({ status: 200, description: 'Cards reordered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorder(
    @Body(new ZodValidationPipe(reorderRankingBigNumbersSchema))
    body: ReorderRankingBigNumbersType,
  ) {
    return await this.rankingBigNumbersService.reorder(body);
  }

  @Delete('admin/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ranking big number card (admin only)' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card deleted successfully' })
  async delete(@Param('id') id: string) {
    return await this.rankingBigNumbersService.delete(id);
  }
}
