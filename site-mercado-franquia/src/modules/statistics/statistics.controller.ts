import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { PlatformStatisticsDto } from './dto/platform-statistics.dto';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({
    status: 200,
    description: 'Platform statistics retrieved successfully',
    type: PlatformStatisticsDto,
  })
  async getStatistics(): Promise<PlatformStatisticsDto> {
    return await this.statisticsService.getStatistics();
  }
}

