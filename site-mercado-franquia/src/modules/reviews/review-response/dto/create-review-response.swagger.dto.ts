import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewResponseSwaggerDto {
  @ApiProperty({
    description: 'Conteúdo da resposta à avaliação',
    example:
      'Obrigado pelo seu feedback! Ficamos felizes em saber que está satisfeito.',
    minLength: 10,
    maxLength: 1000,
  })
  content: string;
}
