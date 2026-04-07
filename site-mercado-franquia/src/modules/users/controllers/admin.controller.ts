import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
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
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtPayload } from 'src/modules/auth/jwt.service';
import {
  CreateAdminUserDto,
  createAdminUserSchema,
} from '../schemas/create-user.schema';
import {
  UpdateFranchisorUserDto,
  UpdateUserBasicInfoDto,
  UpdateUserProfileDto,
  updateFranchisorUserSchema,
  updateUserBasicInfoSchema,
  updateUserProfileSchema,
} from '../schemas/update-user.schema';
import { AdminService } from '../services/admin.service';
import { MembersService } from '../services/members.service';
import { FranchisorsService } from '../services/franchisor.service';
import { UsersService } from '../services/users.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UsersAdminController {
  constructor(
    private readonly usersService: AdminService,
    private readonly membersService: MembersService,
    private readonly franchisorsService: FranchisorsService,
    private readonly usersCommonService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create admin user' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async createAdmin(
    @Body(new ZodValidationPipe(createAdminUserSchema))
    data: CreateAdminUserDto,
  ) {
    try {
      const admin = await this.usersService.create(data);
      return { user: admin };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error creating admin:', error);
      throw new HttpException(
        'Failed to create admin',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all admins (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Admins retrieved successfully' })
  async findAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    try {
      return await this.usersService.findAdminsPaginated({
        page: pageNum,
        limit: limitNum,
        search,
      });
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw new HttpException(
        'Failed to fetch admins',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('members')
  @ApiOperation({ summary: 'Get all members (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  async getMembers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    try {
      return await this.membersService.findMembersPaginated({
        page: pageNum,
        limit: limitNum,
        search,
      });
    } catch (error) {
      console.error('Error fetching franchisees:', error);
      throw new HttpException(
        'Failed to fetch franchisees',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('franchisors')
  @ApiOperation({ summary: 'Get all franchisors (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Franchisors retrieved successfully',
  })
  async getAllFranchisors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    try {
      return await this.franchisorsService.findFranchisorsPaginated({
        page: pageNum,
        limit: limitNum,
        search,
      });
    } catch (error) {
      console.error('Error fetching franchisors:', error);
      throw new HttpException(
        'Failed to fetch franchisors',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('franchisors/:id')
  @ApiOperation({ summary: 'Update franchisor' })
  @ApiParam({ name: 'id', description: 'Franchisor ID' })
  @ApiResponse({ status: 200, description: 'Franchisor updated successfully' })
  async updateFranchisor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFranchisorUserSchema))
    data: UpdateFranchisorUserDto,
  ) {
    await this.franchisorsService.updateFranchisor(id, data);

    return { message: 'Franchisor updated successfully' };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  findUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user basic information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUserBasicInfo(
    @Param('id') targetUserId: string,
    @Body(new ZodValidationPipe(updateUserBasicInfoSchema))
    data: UpdateUserBasicInfoDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const result = await this.usersCommonService.updateUserBasicInfo(
      targetUserId,
      data,
      currentUser,
    );
    return { user: result };
  }

  @Put('users/:id/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateUserProfile(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserProfileSchema))
    data: UpdateUserProfileDto,
  ) {
    return await this.usersCommonService.updateUserProfile(id, data);
  }
}
