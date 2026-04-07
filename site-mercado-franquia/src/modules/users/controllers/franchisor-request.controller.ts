import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { JwtPayload } from '../../auth/jwt.service';
import {
  StepThreeDto,
  stepThreeSchema,
  UpdateRequestDto,
  updateRequestSchema,
} from '../schemas/franchisor-request.schema';
import { FranchisorRequestService } from '../services/franchisor-request.service';

@ApiTags('franchisor-requests')
@Controller('users/franchisor-request')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class FranchisorRequestController {
  constructor(
    private readonly franchisorRequestService: FranchisorRequestService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cnpjCard', maxCount: 1 },
      { name: 'socialContract', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create franchisor request' })
  @ApiResponse({
    status: 201,
    description: 'Franchisor request created successfully',
  })
  async createRequest(
    @CurrentUser() currentUser: JwtPayload,
    @Body(new ZodValidationPipe(stepThreeSchema)) data: StepThreeDto,
    @UploadedFiles()
    files: {
      cnpjCard: Express.Multer.File[];
      socialContract: Express.Multer.File[];
    },
  ) {
    if (!files.cnpjCard || !files.socialContract) {
      throw new Error('Both CNPJ card and social contract files are required');
    }

    return this.franchisorRequestService.createRequest(currentUser.id, data, {
      cnpjCard: files.cnpjCard[0],
      socialContract: files.socialContract[0],
    });
  }

  @Get('my-request')
  @ApiOperation({ summary: 'Get current user franchisor request' })
  @ApiResponse({ status: 200, description: 'Request retrieved successfully' })
  async getMyRequest(@CurrentUser() currentUser: JwtPayload) {
    return this.franchisorRequestService.getMyRequest(currentUser.id);
  }

  @Put()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cnpjCard', maxCount: 1 },
      { name: 'socialContract', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update franchisor request' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  async updateRequest(
    @CurrentUser() currentUser: JwtPayload,
    @Body(new ZodValidationPipe(updateRequestSchema)) data: UpdateRequestDto,
    @UploadedFiles()
    files?: {
      cnpjCard?: Express.Multer.File[];
      socialContract?: Express.Multer.File[];
    },
  ) {
    return this.franchisorRequestService.updateRequest(currentUser.id, data, {
      cnpjCard: files?.cnpjCard?.[0],
      socialContract: files?.socialContract?.[0],
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Delete franchisor request' })
  @ApiResponse({ status: 200, description: 'Request deleted successfully' })
  async deleteRequest(@CurrentUser() currentUser: JwtPayload) {
    return this.franchisorRequestService.deleteRequest(currentUser.id);
  }
}
