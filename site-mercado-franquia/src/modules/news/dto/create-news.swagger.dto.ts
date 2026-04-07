import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsSwaggerDto {
  @ApiProperty({
    description: 'Título da notícia',
    example: 'Nova franquia revoluciona o mercado de alimentação',
    minLength: 1,
    maxLength: 200,
  })
  title: string;

  @ApiProperty({
    description: 'Categoria da notícia',
    example: 'Alimentação',
    minLength: 1,
    maxLength: 100,
  })
  category: string;

  @ApiProperty({
    description: 'Resumo da notícia',
    example:
      'Franquia inovadora traz conceito único para o mercado brasileiro...',
    minLength: 1,
    maxLength: 500,
  })
  summary: string;

  @ApiProperty({
    description: 'Conteúdo completo da notícia',
    example:
      'Esta nova franquia está revolucionando o mercado com sua proposta inovadora...',
    minLength: 10,
    maxLength: 2000,
  })
  content: string;

  @ApiProperty({
    description: 'Foto da notícia',
    type: 'string',
    format: 'binary',
    required: true,
  })
  photo: Express.Multer.File;
}
