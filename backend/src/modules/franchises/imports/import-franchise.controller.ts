import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { ImportResultType } from '../schemas/create-franchise.schema';
import { FranchiseImportService } from './import-franchise.service';

@ApiTags('franchise-import')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('franchises/import')
@ApiBearerAuth()
export class FranchiseImportController {
  constructor(private readonly importService: FranchiseImportService) {}

  @Post('csv')
  @ApiOperation({ summary: 'Import franchises from CSV (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Franchises imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV file' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        console.log('File received:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });

        const allowedMimeTypes = [
          'text/csv',
          'application/csv',
          'text/plain',
          'application/vnd.ms-excel',
        ];

        const allowedExtensions = ['.csv'];
        const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some((ext) =>
          file.originalname.toLowerCase().endsWith(ext),
        );

        if (hasValidMimeType || hasValidExtension) {
          console.log('✅ File accepted');
          cb(null, true);
        } else {
          console.log('❌ File rejected');
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async importFromCSV(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResultType> {
    console.log('Controller received file:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importFromCSV(csvContent);
  }

  @Post('csv/update/:id')
  @ApiOperation({ summary: 'Update franchise from CSV (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Franchise ID' })
  @ApiResponse({ status: 200, description: 'Franchise updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV file or franchise ID' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        console.log('Update file received:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });

        const allowedMimeTypes = [
          'text/csv',
          'application/csv',
          'text/plain',
          'application/vnd.ms-excel',
        ];

        const allowedExtensions = ['.csv'];
        const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some((ext) =>
          file.originalname.toLowerCase().endsWith(ext),
        );

        if (hasValidMimeType || hasValidExtension) {
          console.log('✅ Update file accepted');
          cb(null, true);
        } else {
          console.log('❌ Update file rejected');
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async updateFromCSV(
    @Param('id') franchiseId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResultType> {
    console.log('Controller received update file:', {
      franchiseId,
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!franchiseId || franchiseId.trim() === '') {
      throw new BadRequestException('Franchise ID is required');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.updateFromCSV(franchiseId, csvContent);
  }
}
