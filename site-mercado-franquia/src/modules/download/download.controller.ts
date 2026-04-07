// import {
//   BadRequestException,
//   Body,
//   Controller,
//   HttpCode,
//   HttpStatus,
//   Post,
//   UsePipes,
// } from '@nestjs/common';
// import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
// import { DownloadService } from './download.service';
// import {
//   DownloadImageSwaggerDto,
//   DownloadMultipleImagesSwaggerDto,
//   ValidateImageUrlSwaggerDto,
// } from './dto/download.swagger.dto';
// import {
//   downloadImageSchema,
//   DownloadImageType,
//   downloadMultipleImagesSchema,
//   DownloadMultipleImagesType,
//   validateImageUrlSchema,
//   ValidateImageUrlType,
// } from './schemas/download.schema';

// @ApiTags('download')
// @Controller('download')
// export class DownloadController {
//   constructor(private readonly downloadService: DownloadService) {}

//   @Post('image')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Download de uma imagem' })
//   @ApiResponse({ status: 200, description: 'Imagem baixada com sucesso' })
//   @ApiBody({ type: DownloadImageSwaggerDto })
//   @UsePipes(new ZodValidationPipe(downloadImageSchema))
//   async downloadImage(@Body() data: DownloadImageType) {
//     const { imageUrl, folder } = data;

//     try {
//       const localUrl = await this.downloadService.downloadImage(
//         imageUrl,
//         folder,
//       );
//       return {
//         success: true,
//         originalUrl: imageUrl,
//         localUrl,
//         message: 'Imagem baixada com sucesso',
//       };
//     } catch (error) {
//       throw new BadRequestException(
//         `Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
//       );
//     }
//   }

//   @Post('images')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Download de múltiplas imagens' })
//   @ApiResponse({ status: 200, description: 'Imagens baixadas com sucesso' })
//   @ApiBody({ type: DownloadMultipleImagesSwaggerDto })
//   @UsePipes(new ZodValidationPipe(downloadMultipleImagesSchema))
//   async downloadMultipleImages(@Body() data: DownloadMultipleImagesType) {
//     const { imageUrls, folder } = data;

//     try {
//       const results = await this.downloadService.downloadMultipleImages(
//         imageUrls,
//         folder,
//       );
//       return {
//         success: true,
//         results,
//         message: 'Imagens processadas com sucesso',
//       };
//     } catch (error) {
//       throw new BadRequestException(
//         `Erro ao baixar imagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
//       );
//     }
//   }

//   @Post('validate')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Validar URL de imagem' })
//   @ApiResponse({ status: 200, description: 'URL validada com sucesso' })
//   @ApiBody({ type: ValidateImageUrlSwaggerDto })
//   @UsePipes(new ZodValidationPipe(validateImageUrlSchema))
//   async validateImageUrl(@Body() data: ValidateImageUrlType) {
//     const { imageUrl } = data;

//     try {
//       const isValid = await this.downloadService.validateImageUrl(imageUrl);
//       return {
//         success: true,

//         imageUrl,
//         isValid,
//         message: isValid
//           ? 'URL da imagem é válida'
//           : 'URL da imagem é inválida',
//       };
//     } catch (error) {
//       throw new BadRequestException(
//         `Erro ao validar URL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
//       );
//     }
//   }
// }
