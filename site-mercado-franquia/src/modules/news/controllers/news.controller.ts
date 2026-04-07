import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import * as fs from 'fs/promises';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { UploadService } from 'src/modules/upload/upload.service';
import { MulterFile } from '../../upload/dto/multer';
import {
  createNewsSchema,
  CreateNewsType,
} from '../schemas/create-news.schema';
import {
  updateNewsSchema,
  UpdateNewsType,
} from '../schemas/update-news.schema';
import { NewsService } from '../services/news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly uploadService: UploadService,
  ) {}

  // Type guard atualizado para arquivos do diskStorage
  private isValidMulterFile(file: unknown): file is Express.Multer.File {
    return (
      file !== null &&
      file !== undefined &&
      typeof file === 'object' &&
      'fieldname' in file &&
      'originalname' in file &&
      'encoding' in file &&
      'mimetype' in file &&
      'size' in file &&
      ('buffer' in file || 'path' in file) // Aceitar tanto buffer quanto path
    );
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create news article (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'News created successfully' })
  @ApiResponse({ status: 400, description: 'Photo is required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async createNews(
    @UploadedFile() file: unknown,
    @Body(new ZodValidationPipe(createNewsSchema))
    createNewsDto: CreateNewsType,
  ) {
    console.log('=== DEBUG CREATE NEWS ===');
    console.log('File received:', file);
    console.log('File is valid:', this.isValidMulterFile(file));
    console.log('Body received:', createNewsDto);
    console.log('========================');

    if (!this.isValidMulterFile(file)) {
      throw new BadRequestException('Foto é obrigatória');
    }

    try {
      // Se o arquivo foi salvo no disco, precisamos ler o buffer
      let buffer: Buffer;
      if ('path' in file && file.path) {
        buffer = await fs.readFile(file.path);
        // Deletar o arquivo temporário após ler
        await fs.unlink(file.path).catch(() => {
          // Ignorar erro se arquivo não existir
        });
      } else if ('buffer' in file && file.buffer) {
        buffer = file.buffer;
      } else {
        throw new BadRequestException('Arquivo inválido');
      }

      // Converter para MulterFile
      const multerFile: MulterFile = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: buffer,
      };

      console.log('MulterFile created:', {
        fieldname: multerFile.fieldname,
        originalname: multerFile.originalname,
        mimetype: multerFile.mimetype,
        size: multerFile.size,
        bufferSize: multerFile.buffer.length,
      });

      const photoUrl = await this.uploadService.uploadFile(multerFile, 'news');

      return this.newsService.create({
        ...createNewsDto,
        photoUrl,
      });
    } catch (error) {
      console.error('Error in createNews:', error);
      throw new BadRequestException('Erro ao processar arquivo');
    }
  }

  // Rota pública - sem guards
  @Get()
  @ApiOperation({ summary: 'Get paginated list of news' })
  @ApiResponse({ status: 200, description: 'News retrieved successfully' })
  async findAllNews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.newsService.findAllPaginated({
      page: pageNum,
      limit: limitNum,
      search,
      category,
    });
  }

  // Rota pública - sem guards
  @Get(':id')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiParam({ name: 'id', description: 'News ID' })
  @ApiResponse({ status: 200, description: 'News retrieved successfully' })
  async findNewsById(@Param('id') id: string) {
    console.log('=== PUBLIC ACCESS: GET NEWS BY ID ===');
    console.log('News ID:', id);
    return this.newsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update news article (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'News ID' })
  @ApiResponse({ status: 200, description: 'News updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateNews(
    @Param('id') id: string,
    @UploadedFile() file: unknown,
    @Body(new ZodValidationPipe(updateNewsSchema)) updateData: UpdateNewsType,
  ) {
    console.log('=== DEBUG UPDATE NEWS ===');
    console.log('File received:', file);
    console.log('File is valid:', this.isValidMulterFile(file));
    console.log('Body received:', updateData);
    console.log('========================');

    const existingNews = await this.newsService.findById(id);

    // Preparar dados para atualização
    const updatePayload: UpdateNewsType & { photoUrl?: string } = {
      ...updateData,
    };

    // Se um novo arquivo foi enviado, processar o upload
    if (this.isValidMulterFile(file)) {
      console.log('Processing new file upload...');
      const newPhotoUrl = await this.handleFileUpload(
        file,
        existingNews.photoUrl,
      );
      updatePayload.photoUrl = newPhotoUrl;
      console.log('New photo URL:', newPhotoUrl);
    }

    console.log('Final update payload:', updatePayload);

    return this.newsService.update(id, updatePayload);
  }

  private async handleFileUpload(
    file: Express.Multer.File,
    existingPhotoUrl: string | null,
  ): Promise<string> {
    // Ler buffer do arquivo
    let buffer: Buffer;
    if ('path' in file && file.path) {
      buffer = await fs.readFile(file.path);
      await fs.unlink(file.path).catch(() => {});
    } else if ('buffer' in file && file.buffer) {
      buffer = file.buffer;
    } else {
      throw new BadRequestException('Arquivo inválido');
    }

    const multerFile: MulterFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: buffer,
    };

    const newPhotoUrl = await this.uploadService.uploadFile(multerFile, 'news');

    if (existingPhotoUrl) {
      await this.uploadService.deleteFile(existingPhotoUrl);
    }

    return newPhotoUrl;
  }
}
