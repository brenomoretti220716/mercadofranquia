import { ApiProperty } from '@nestjs/swagger';

export class MulterFileSwaggerDto {
  @ApiProperty({
    description: 'Nome do campo do formulário',
    example: 'photo',
  })
  fieldname: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'foto-franquia.jpg',
  })
  originalname: string;

  @ApiProperty({
    description: 'Codificação do arquivo',
    example: '7bit',
  })
  encoding: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
  })
  mimetype: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Pasta de destino (opcional)',
    example: '/uploads/news',
    required: false,
  })
  destination?: string;

  @ApiProperty({
    description: 'Nome do arquivo salvo (opcional)',
    example: 'uuid-filename.jpg',
    required: false,
  })
  filename?: string;

  @ApiProperty({
    description: 'Caminho completo do arquivo (opcional)',
    example: '/uploads/news/uuid-filename.jpg',
    required: false,
  })
  path?: string;

  @ApiProperty({
    description: 'Buffer do arquivo',
    type: 'string',
    format: 'binary',
  })
  buffer: Buffer;
}

export class FileInfoSwaggerDto {
  @ApiProperty({
    description: 'Indica se o arquivo existe',
    example: true,
  })
  exists: boolean;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
    required: false,
  })
  size?: number;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
    required: false,
  })
  mimeType?: string;
}

export class UploadConfigSwaggerDto {
  @ApiProperty({
    description: 'Pasta de destino para upload',
    example: 'news',
    default: 'news',
  })
  folder: string;

  @ApiProperty({
    description: 'Tamanho máximo permitido em bytes',
    example: 5242880,
    default: 5242880,
  })
  maxSize: number;

  @ApiProperty({
    description: 'Tipos MIME permitidos',
    example: ['image/jpeg', 'image/png', 'image/gif'],
    type: [String],
  })
  allowedTypes: string[];
}

export class UploadResultSwaggerDto {
  @ApiProperty({
    description: 'Indica se o upload foi bem-sucedido',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'URL pública do arquivo',
    example: 'https://api.franchise.com/uploads/news/uuid-filename.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Nome do arquivo salvo',
    example: 'uuid-filename.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
  })
  mimeType: string;
}

export class UploadErrorSwaggerDto {
  @ApiProperty({
    description: 'Nome do arquivo que falhou',
    example: 'foto-invalida.txt',
  })
  fileName: string;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Apenas arquivos de imagem são permitidos',
  })
  error: string;
}

export class MultipleUploadResultSwaggerDto {
  @ApiProperty({
    description: 'Indica se o upload múltiplo foi bem-sucedido',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Resultados dos uploads bem-sucedidos',
    type: [UploadResultSwaggerDto],
  })
  results: UploadResultSwaggerDto[];

  @ApiProperty({
    description: 'Uploads que falharam',
    type: [UploadErrorSwaggerDto],
    required: false,
  })
  failed?: UploadErrorSwaggerDto[];
}
