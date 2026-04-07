import { ApiProperty } from '@nestjs/swagger';

export class DownloadImageSwaggerDto {
  @ApiProperty({
    description: 'URL da imagem para download',
    example: 'https://example.com/image.jpg',
    format: 'url',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Pasta de destino (opcional)',
    example: 'franchises',
    required: false,
  })
  folder?: string;
}

export class DownloadMultipleImagesSwaggerDto {
  @ApiProperty({
    description: 'Array de URLs das imagens para download',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.png',
    ],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  imageUrls: string[];

  @ApiProperty({
    description: 'Pasta de destino (opcional)',
    example: 'franchises',
    required: false,
  })
  folder?: string;
}

export class ValidateImageUrlSwaggerDto {
  @ApiProperty({
    description: 'URL da imagem para validação',
    example: 'https://example.com/image.jpg',
    format: 'url',
  })
  imageUrl: string;
}
