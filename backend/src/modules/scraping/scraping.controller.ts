import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScrapingService } from './scraping.service';

@ApiTags('scraping')
@Controller('scraping')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth()
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update franchise by scraping (admin only)' })
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiResponse({ status: 200, description: 'Franchise updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateFranchiseById(@Param('id') id: string) {
    return await this.scrapingService.updateFranchiseById(id);
  }
}
