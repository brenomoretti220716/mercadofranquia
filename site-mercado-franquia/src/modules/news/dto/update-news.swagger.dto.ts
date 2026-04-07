import { ApiProperty } from '@nestjs/swagger';

export class UpdateNewsSwaggerDto {
  @ApiProperty({
    description: 'Título da notícia',
    example: 'Nova franquia revoluciona o mercado de alimentação',
    minLength: 1,
    maxLength: 200,
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Categoria da notícia',
    example: 'Alimentação',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  category?: string;

  @ApiProperty({
    description: 'Resumo da notícia',
    example:
      'Franquia inovadora traz conceito único para o mercado brasileiro...',
    minLength: 1,
    maxLength: 500,
    required: false,
  })
  summary?: string;

  @ApiProperty({
    description: 'Conteúdo completo da notícia',
    example:
      'Esta nova franquia está revolucionando o mercado com sua proposta inovadora...',
    minLength: 10,
    maxLength: 2000,
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Status de ativação da notícia',
    example: true,
    required: false,
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Nova foto da notícia (opcional)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  photo?: Express.Multer.File;
}
