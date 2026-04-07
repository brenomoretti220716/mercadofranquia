import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewResponseSwaggerDto {
  @ApiProperty({
    description: 'Conteúdo atualizado da resposta à avaliação',
    example:
      'Obrigado pelo seu feedback atualizado! Continuamos trabalhando para melhorar.',
    minLength: 10,
    maxLength: 1000,
    required: false,
  })
  content?: string;
}
