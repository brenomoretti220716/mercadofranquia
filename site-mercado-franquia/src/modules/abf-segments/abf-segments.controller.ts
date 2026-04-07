import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AbfSegmentsService } from './abf-segments.service';
import {
  createAbfSegmentSchema,
  CreateAbfSegmentType,
} from './schemas/create-abf-segment.schema';
import {
  updateAbfSegmentSchema,
  UpdateAbfSegmentType,
} from './schemas/update-abf-segment.schema';

@ApiTags('abf-segments')
@Controller('abf-segments')
export class AbfSegmentsController {
  constructor(private readonly abfSegmentsService: AbfSegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get ABF segments (public)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'quarter', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Segments fetched successfully' })
  async findAll(
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
  ) {
    const yearNum = year !== undefined ? Number(year) : undefined;

    return await this.abfSegmentsService.findAll({
      year: Number.isFinite(yearNum) ? yearNum : undefined,
      quarter,
    });
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ABF segment (admin only)' })
  @ApiResponse({ status: 201, description: 'Segment created successfully' })
  async create(
    @Body(new ZodValidationPipe(createAbfSegmentSchema))
    createDto: CreateAbfSegmentType,
  ) {
    return await this.abfSegmentsService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ABF segment (admin only)' })
  @ApiParam({ name: 'id', description: 'AbfSegmentEntry id' })
  @ApiResponse({ status: 200, description: 'Segment updated successfully' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAbfSegmentSchema))
    updateDto: UpdateAbfSegmentType,
  ) {
    return await this.abfSegmentsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ABF segment (admin only)' })
  @ApiParam({ name: 'id', description: 'AbfSegmentEntry id' })
  @ApiResponse({ status: 200, description: 'Segment deleted successfully' })
  async delete(@Param('id') id: string) {
    return await this.abfSegmentsService.delete(id);
  }
}
