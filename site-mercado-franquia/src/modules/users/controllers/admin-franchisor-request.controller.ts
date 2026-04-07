import {
  Body,
  Controller,
  Get,
  Param,
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
import { FranchisorRequestStatus, Role } from '@prisma/client';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtPayload } from '../../auth/jwt.service';
import {
  ApproveRequestDto,
  approveRequestSchema,
  RejectRequestDto,
  rejectRequestSchema,
} from '../schemas/franchisor-request.schema';
import { FranchisorRequestService } from '../services/franchisor-request.service';

@ApiTags('admin-franchisor-requests')
@Controller('admin/franchisor-requests')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminFranchisorRequestController {
  constructor(
    private readonly franchisorRequestService: FranchisorRequestService,
  ) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending franchisor requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Pending requests retrieved successfully',
  })
  async getPendingRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.franchisorRequestService.getPendingRequests(
      pageNum,
      limitNum,
      search,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all franchisor requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: FranchisorRequestStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  async getAllRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.franchisorRequestService.getAllRequests(
      pageNum,
      limitNum,
      status as FranchisorRequestStatus,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get franchisor request by ID' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request retrieved successfully' })
  async getRequestById(@Param('id') id: string) {
    return this.franchisorRequestService.getRequestById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve franchisor request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request approved successfully' })
  async approveRequest(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body(new ZodValidationPipe(approveRequestSchema)) data: ApproveRequestDto,
  ) {
    return this.franchisorRequestService.approveRequest(
      id,
      currentUser.id,
      data,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject franchisor request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request rejected successfully' })
  async rejectRequest(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body(new ZodValidationPipe(rejectRequestSchema)) data: RejectRequestDto,
  ) {
    return this.franchisorRequestService.rejectRequest(
      id,
      currentUser.id,
      data,
    );
  }
}
